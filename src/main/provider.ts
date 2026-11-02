import {safeJson} from './json';
import {webPlayback} from './web-playback';
import { randomUUID } from 'node:crypto';
import type { ApiTransport, Board, Catalog, Episode, Resource, Series, Work,VideoQuality } from '../shared/types.ts';

type RecordData = Record<string, any>;
const ID = /^[1-9]\d{7,23}$/;
const BOARDS = {
  recommend: { id: 'comic_series_hot_rank', label: '推荐榜' },
  hot: { id: 'comic_series_hot_play', label: '热播榜' },
  new: { id: 'comic_series_new_rank', label: '新剧榜' },
} satisfies Record<Board, { id: string; label: string }>;
const SHARE_HOSTS = new Set(['kylin.hainanyuyue.com', 'hainanyuyue.com']);
const WEB_ORIGIN = 'https://hongguoduanju.com';
const QUALITY_ORDER = ['1080p', '720p', '540p', '480p', '360p'];
const SUPPORTED_CODECS = new Set(['bytevc1', 'h264', 'h265', 'avc1', 'hvc1', 'hevc', 'h265_hvc1', 'av1']);

export class ProviderError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
  }
}

function fail(code: string, message: string): never { throw new ProviderError(code, message); }
function record(value: unknown): value is RecordData { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function identifier(value: unknown, kind: 'SERIES' | 'EPISODE'): string {
  if (typeof value !== 'string' || !ID.test(value)) fail(`INVALID_${kind}_ID`, '作品或分集编号无效，请重新取得原始链接。');
  return value;
}
function offsetValue(offset: number): number {
  if (!Number.isSafeInteger(offset) || offset < 0) fail('INVALID_OFFSET', '分页位置无效。');
  return offset;
}
function count(value: unknown): number {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}
function text(value: unknown): string { return typeof value === 'string' ? value : ''; }


function routerData(html: string): RecordData {
  const block = html.match(/(?:window\.)?_ROUTER_DATA\s*=\s*([\s\S]*?)<\/script>/);
  if (!block) fail('PAGE_DATA_MISSING', '网页没有可核对的作品数据。');
  const source = block[1].trim();
  if (source[0] !== '{') fail('INVALID_PAGE_DATA', '网页数据不是合法 JSON。');
  let depth = 0, inString = false, escaped = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{' || char === '[') depth++;
    else if (char === '}' || char === ']') {
      if (--depth === 0) {
        try { return safeJson(source.slice(0, index + 1)); }
        catch { fail('INVALID_PAGE_DATA', '网页数据不是合法 JSON。'); }
      }
    }
  }
  fail('INVALID_PAGE_DATA', '网页作品数据不完整。');
}

function work(value: RecordData, knownId?: string): Work {
  const id = identifier(knownId ?? value.series_id, 'SERIES');
  const title = text(value.series_title || value.series_name || value.title);
  if (!title.trim()) fail('INVALID_WORK', '接口返回的作品缺少标题。');
  const categories = Array.isArray(value.category_list) ? value.category_list.filter((item: unknown) => typeof item === 'string') : undefined;
  return { id, title, cover: text(value.series_cover || value.cover), description: text(value.series_intro || value.video_desc || value.description),
    total: count(value.episode_cnt ?? value.serial_count), ...(categories?.length ? { categories } : {}) };
}

function selectedItems(selector: unknown): RecordData[] {
  const items: RecordData[] = [];
  function visit(value: unknown, depth = 0) {
    if (depth > 16 || !value || typeof value !== 'object') return;
    if (record(value) && (value.is_selected === true || value.is_selected === 1)) items.push(value);
    for (const child of Object.values(value)) visit(child, depth + 1);
  }
  visit(selector);
  return items;
}

export class ContentProvider {
  private readonly transport: ApiTransport;
  private readonly fetcher: typeof fetch;
  private readonly searchPage?: (url:URL)=>Promise<string>;

  constructor(transport: ApiTransport, options: { fetch?: typeof fetch;searchPage?:(url:URL)=>Promise<string> } = {}) {
    this.transport = transport;
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.searchPage = options.searchPage;
  }

  private async api(path: string, body?: unknown, extra?: Record<string, string | number | boolean>): Promise<RecordData> {
    let response: any;
    try { response = await this.transport.request(path, body, extra); }
    catch (error) {
      if (error instanceof Error && 'code' in error && typeof error.code === 'string' && /^[A-Z0-9_]{1,50}$/.test(error.code)) throw error;
      fail('NETWORK_ERROR', '内容接口请求失败，请稍后重试。');
    }
    if (!record(response)) fail('EMPTY_RESPONSE', '内容接口未返回有效数据。');
    const code = response.code ?? response.BaseResp?.StatusCode ?? response.base_resp?.StatusCode;
    if (code == null) fail('INVALID_RESPONSE', '内容接口缺少状态码。');
    if (Number(code) !== 0) {
      const suffix = /^[A-Za-z0-9_-]{1,30}$/.test(String(code)) ? String(code) : 'ERROR';
      fail(`API_${suffix}`, `内容接口返回错误（${suffix}）。`);
    }
    if (!record(response.data)) fail('EMPTY_RESPONSE', '内容接口未返回作品数据。');
    return response.data;
  }

  async catalog(board: Board, offset = 0): Promise<Catalog> {
    if (!Object.hasOwn(BOARDS, board)) fail('INVALID_BOARD', '榜单类型无效。');
    offsetValue(offset);
    const requested = BOARDS[board];
    const data = await this.api('/reading/bookapi/bookmall/cell/change/v', undefined, {
      cell_id: '7470092475068071998', tab_type: 26, client_req_type: 2, client_template: 2, screen_width_px: 1350,
      selected_items: 'comic_series_rank', sub_selected_items: requested.id, session_id: randomUUID(), offset,
    });
    const cell = data.cell_view;
    if (!record(cell) || !Array.isArray(cell.cell_data)) fail('INVALID_CATALOG', '榜单数据结构无效。');
    const selected = selectedItems(cell.cell_selector);
    const match = selected.find(item => (item.selector_item_id ?? item.id) === requested.id);
    const outer = selected.find(item => (item.selector_item_id ?? item.id) === 'comic_series_rank');
    if (!match || text(match.show_name) !== requested.label || (outer && text(outer.show_name) !== '漫剧')) {
      fail('BOARD_MISMATCH', '接口返回的榜单与请求不一致，请稍后重试。');
    }
    const items: Work[] = [];
    for (const entry of cell.cell_data) {
      const videos = Array.isArray(entry?.video_data) ? entry.video_data : [entry?.video_data];
      for (const video of videos) if (record(video)) items.push(work(video));
    }
    const hasMore = (data.has_more ?? cell.has_more) === true;
    const rawOffset = data.next_offset ?? cell.next_offset;
    const nextOffset = rawOffset == null ? offset + items.length : count(rawOffset);
    if (hasMore && (nextOffset <= offset || items.length === 0)) fail('INVALID_PAGINATION', '榜单返回的分页位置无效。');
    return { items: [...new Map(items.map(item => [item.id, item])).values()], hasMore, nextOffset,
      label: requested.label, source: '原生漫剧榜单' };
  }

  private validatePageUrl(url: URL, share: boolean): void {
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') ||
      (share ? !SHARE_HOSTS.has(url.hostname) : url.origin !== WEB_ORIGIN)) {
      fail(share ? 'UNSAFE_SHARE_URL' : 'UNSAFE_WEB_URL', '链接不是受支持的官方内容页面。');
    }
  }

  private async page(url: URL, share: boolean, accept='text/html'): Promise<string> {
    const visited = new Set<string>();
    for (let hop = 0; hop < 6; hop++) {
      this.validatePageUrl(url, share);
      if (visited.has(url.href)) fail('REDIRECT_LOOP', '分享链接发生循环跳转。');
      visited.add(url.href);
      let response: Response;
      try { response = await this.fetcher(url.href, { redirect: 'manual', signal: AbortSignal.timeout(20_000), headers: { Accept: accept } }); }
      catch { fail('NETWORK_ERROR', '网页加载失败，请稍后重试。'); }
      if (response.status === 429 || response.status >= 500) {
        await response.body?.cancel();
        try { response = await this.fetcher(url.href, { redirect: 'manual', signal: AbortSignal.timeout(20_000), headers: { Accept: accept } }); }
        catch { fail('NETWORK_ERROR', '网页加载失败，请稍后重试。'); }
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location) fail('INVALID_REDIRECT', '分享链接跳转缺少目标地址。');
        try { url = new URL(location, url); }
        catch { fail('INVALID_REDIRECT', '分享链接跳转地址无效。'); }
        continue;
      }
      if (!response.ok) fail(`HTTP_${response.status}`, `网页加载失败（HTTP ${response.status}）。`);
      const limit = 8 * 1024 * 1024;
      if (Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); fail('PAGE_TOO_LARGE', '网页内容过大。'); }
      const reader = response.body?.getReader();
      if (!reader) fail('EMPTY_RESPONSE', '网页没有返回内容。');
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          bytes += part.value.byteLength;
          if (bytes > limit) { await reader.cancel(); fail('PAGE_TOO_LARGE', '网页内容过大。'); }
          chunks.push(part.value);
        }
      } catch (error) {
        if (error instanceof ProviderError) throw error;
        fail('NETWORK_ERROR', '网页内容读取失败，请稍后重试。');
      } finally { reader.releaseLock(); }
      return Buffer.concat(chunks).toString('utf8');
    }
    fail('TOO_MANY_REDIRECTS', '分享链接跳转次数过多。');
  }

  async search(query: string, offset = 0): Promise<Catalog> {
    if (typeof query !== 'string' || !query.trim() || Array.from(query.trim()).length > 30) fail('INVALID_QUERY', '请输入不超过 30 字的搜索关键词。');
    offsetValue(offset);
    if(offset%10!==0||offset>2147483647)fail('INVALID_OFFSET','搜索分页位置无效。');
    const label = `搜索：${query.trim()}`;
    // Official site now loads results as JSON, with ten source entries per page.
    // Advance by server page, not filtered work count (results can include actors).
    const pageNum=offset/10+1,url=new URL('/api/search/result',WEB_ORIGIN);
    url.searchParams.set('query',query.trim());if(pageNum>1)url.searchParams.set('page',String(pageNum));
    let model:RecordData;
    const source=await (this.searchPage?this.searchPage(url):this.page(url,false,'application/json'));
    try{model=safeJson(source)}catch{fail('INVALID_SEARCH_DATA','搜索来源返回的数据格式无效。')}
    if(!record(model)||!Array.isArray(model.searchList)||model.code!=null||model.isSuccess===false)fail('INVALID_SEARCH_DATA','搜索来源没有返回有效作品列表。');
    if(model.pageNum!==pageNum||!Number.isSafeInteger(model.totalPages)||model.totalPages<0||typeof model.hasMore!=='boolean'||
       model.hasMore!==(pageNum<model.totalPages)||(model.totalPages===0&&(pageNum!==1||model.searchList.length!==0))||
       (model.totalPages>0&&pageNum>model.totalPages))fail('INVALID_PAGINATION','搜索来源返回的分页信息无效。');
    const items: Work[] = [];
    for (const entry of model.searchList) {
      if (!record(entry)) continue;
      if(!record(entry.video_data))continue;
      const video = entry.video_data;
      const candidate = video.series_id ?? entry.keyword;
      if (candidate == null || (typeof candidate === 'string' && !ID.test(candidate))) continue;
      items.push(work({ ...video, series_id: candidate, series_title: entry.name || video.series_title || video.series_name }));
    }
    const unique = [...new Map(items.map(item => [item.id, item])).values()];
    return { items: unique, hasMore: model.hasMore, nextOffset: offset+10, label, source: '官方网页搜索接口' };
  }

  async resolveShare(input: string): Promise<Series> {
    if (typeof input !== 'string' || input.length > 16_384) fail('INVALID_SHARE', '分享内容无效。');
    const candidate = input.match(/https?:\/\/[^\s<>"'\u3000-\u303f\uff00-\uffef]+/i)?.[0]?.replace(/[),.;!?]+$/, '');
    if (!candidate) fail('INVALID_SHARE', '分享内容中没有有效链接。');
    let url: URL;
    try { url = new URL(candidate); }
    catch { fail('INVALID_SHARE', '分享链接格式无效。'); }
    let router:RecordData;
    try { router=routerData(await this.page(url,true)); }
    catch(error) {
      // Some successful share responses intermittently omit the JSON page payload.
      // Retry the original link once, retaining all redirect/host checks and title/episode checks.
      if (!(error instanceof ProviderError) || error.code!=='PAGE_DATA_MISSING') throw error;
      router=routerData(await this.page(url,true));
    }
    const model = router.loaderData?.['video-animation-share_page'];
    const data = model?.pageData;
    if (!record(data?.series_data) || !Array.isArray(data.chapter_ids) || !data.chapter_ids.length) fail('INVALID_SHARE_DATA', '分享页面没有完整的作品信息。');
    const id = identifier(model.linkParams?.schemeParams?.video_id || model.params?.series_id, 'SERIES');
    const ids = data.chapter_ids.map((value: unknown) => identifier(value, 'EPISODE'));
    const series = await this.getSeries(id);
    if (series.title !== text(data.series_data.title) || series.episodes.length !== ids.length ||
      series.episodes.some((episode, index) => episode.id !== ids[index]) ||
      (data.series_data.serial_count != null && series.total !== count(data.series_data.serial_count))) {
      fail('SHARE_MISMATCH', '分享页面与内容接口的标题或分集不一致，请重新导入。');
    }
    return series;
  }

  async getSeries(id: string): Promise<Series> {
    identifier(id, 'SERIES');
    const data = await this.api('/novel/player/multi_video_detail/v1/', { series_id: id, biz_param: {
      detail_page_version: 0, disable_digg_stat: false, disable_video_relate_book: false, need_all_video_definition: false,
      need_mp4_align: false, screen_width_px: '900', source: 7, use_os_player: false, use_server_dns: false,
    } });
    const video = data[id]?.video_data;
    if (!record(video) || !Array.isArray(video.video_list) || !video.video_list.length) fail('SERIES_NOT_FOUND', '接口没有返回此作品的分集。');
    const base = work(video, id);
    const episodes: Episode[] = video.video_list.map((entry: RecordData) => {
      if (!record(entry)) fail('INVALID_EPISODE', '分集数据结构无效。');
      const episodeId = identifier(entry.vid, 'EPISODE');
      if (!Number.isInteger(entry.vid_index) || entry.vid_index < 1) fail('INVALID_EPISODE_ORDER', '分集顺序无效。');
      const duration = Number(entry.duration);
      return { id: episodeId, order: entry.vid_index, ...(Number.isFinite(duration) && duration > 0 ? { duration } : {}),
        ...(text(entry.title) ? { title: text(entry.title) } : {}) };
    }).sort((left: Episode, right: Episode) => left.order - right.order);
    if (new Set(episodes.map(episode => episode.id)).size !== episodes.length ||
      episodes.some((episode, index) => episode.order !== index + 1) || base.total !== episodes.length) {
      fail('INCOMPLETE_SERIES', '接口返回的分集不完整或顺序异常。');
    }
    return { ...base, episodes };
  }

  // Internal main-process API. Never forward this object to the renderer or persist it in history.
  async getResource(episodeId: string,quality:VideoQuality='auto'): Promise<Resource> {
    identifier(episodeId, 'EPISODE');
    if(quality!=='auto'&&!QUALITY_ORDER.includes(quality))fail('INVALID_QUALITY','画质选项无效。');
    let data: RecordData;
    try {
      data = await this.api('/novel/player/video_model/v1/', { video_id: episodeId, content_type: 1,
        biz_param: { need_all_video_definition: true, video_platform: 3 } });
    } catch (error) {
      // The native gateway now returns HTTP 200 with an empty body. Use the
      // site's own public compatibility player; preserve unrelated failures.
      if (error instanceof Error && 'code' in error && error.code === 'API_EMPTY') return webPlayback(episodeId, this.fetcher);
      throw error;
    }
    let model = data.video_model;
    if (typeof model === 'string') {
      try { model = safeJson(model); }
      catch { fail('INVALID_RESOURCE_MODEL', '播放资源模型无效。'); }
    }
    if (!record(model) || (!Array.isArray(model.video_list) && !record(model.video_list))) fail('INVALID_RESOURCE_MODEL', '播放资源模型无效。');
    // The verified native player model uses status=10 for success; this differs from API code=0.
    if (model.status != null && Number(model.status) !== 0 && Number(model.status) !== 10) fail('RESOURCE_UNAVAILABLE', '此分集的播放资源暂不可用。');
    const available = Object.values(model.video_list).filter(record).map(track => record(track.video_meta) ? {
      main_url:track.main_url,codec_type:track.video_meta.codec_type,definition:track.video_meta.definition,size:track.video_meta.size,
      encrypt:track.encrypt_info?.encrypt,encryption_method:track.encrypt_info?.encryption_method,spade_a:track.encrypt_info?.spade_a,
    } : track);
    if (!available.length) fail('RESOURCE_UNAVAILABLE', '此分集没有可播放的视频轨道。');
    // Some episodes provide bytevc2 at every lower definition and HEVC only
    // at 1080p. Choose a decodable track before applying quality preference.
    const tracks = available.filter(track => SUPPORTED_CODECS.has(text(track.codec_type))).sort((left, right) => {
      const rank = (definition: unknown) => { const index = QUALITY_ORDER.indexOf(text(definition)); return index < 0 ? 99 : index; };
      return rank(left.definition) - rank(right.definition);
    });
    if (!tracks.length) fail('UNSUPPORTED_CODEC', '此分集没有当前播放器支持的视频编码。');
    const availableQualities=[...new Set(tracks.map(track=>text(track.definition)).filter(value=>QUALITY_ORDER.includes(value)))];
    const ceiling=quality==='auto'?0:QUALITY_ORDER.indexOf(quality);
    const track = quality==='auto'?tracks[0]:tracks.find(track=>QUALITY_ORDER.indexOf(text(track.definition))>=ceiling&&QUALITY_ORDER.includes(text(track.definition)))??tracks.at(-1)!;
    if (typeof track.encrypt !== 'boolean') fail('UNKNOWN_ENCRYPTION', '资源缺少明确的加密标记。');
    if (track.encrypt && track.encryption_method !== 'cenc-aes-ctr') fail('UNSUPPORTED_ENCRYPTION', '暂不支持此资源的加密格式。');
    if (track.encrypt && !text(track.spade_a)) fail('MISSING_MEDIA_KEY', '播放资源缺少必要的媒体参数。');
    let url: URL;
    try { url = new URL(/^https?:\/\//.test(text(track.main_url)) ? track.main_url : Buffer.from(text(track.main_url), 'base64').toString('utf8')); }
    catch { fail('INVALID_MEDIA_URL', '播放资源地址无效。'); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) fail('INVALID_MEDIA_URL', '播放资源地址无效。');
    const duration = Number(model.video_duration), size = Number(track.size);
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isSafeInteger(size) || size <= 0 || !text(track.definition) || !text(track.codec_type)) {
      fail('INVALID_RESOURCE_MODEL', '播放资源缺少完整时长或文件信息。');
    }
    return { episodeId, duration, definition: track.definition, codec: track.codec_type, encrypted: track.encrypt,availableQualities,
      ...(track.encrypt ? { spade: track.spade_a } : {}), url: url.href, size };
  }
}

export { ContentProvider as Provider };
