import test from 'node:test';
import assert from 'node:assert/strict';
import type { ApiTransport } from '../src/shared/types.ts';

const providerModule = await import('../src/main/provider.ts').catch(() => ({} as any));
const SID = '7695370827507698713';
const VID = '7695386527160863769';
const detail = () => ({ code: 0, data: { [SID]: { video_data: {
  series_title: '测试漫剧', series_intro: '简介', series_cover: 'https://img.example/cover', episode_cnt: 2,
  video_list: [{ vid: '7695386808800005145', vid_index: 2, duration: 45 }, { vid: VID, vid_index: 1, duration: 60 }],
} } } });
const errorCode = (code: string) => (error: any) => error.code === code;
const transport = (respond: (path: string, body?: any, extra?: any) => any): ApiTransport => ({ request: async (...args) => respond(...args) });
const make = (api: ApiTransport, fetcher?: typeof fetch) => {
  assert.equal(typeof providerModule.ContentProvider, 'function');
  return new providerModule.ContentProvider(api, fetcher ? { fetch: fetcher } : undefined);
};

test('nested batch track metadata preserves codec selection and requires explicit encryption',async()=>{
 const track={main_url:'https://media.example/video.mp4',video_meta:{codec_type:'bytevc1',definition:'1080p',size:1234},encrypt_info:{encrypt:true,encryption_method:'cenc-aes-ctr',spade_a:'test-key'}};
 const provider=(value:any)=>make(transport(()=>({code:0,data:{video_model:{status:10,video_duration:45,video_list:[value]}}})));
 const r=await provider(track).getResource(VID);assert.equal(r.codec,'bytevc1');assert.equal(r.definition,'1080p');assert.equal(r.size,1234);assert.equal(r.encrypted,true);assert.equal(r.spade,'test-key');
 await assert.rejects(provider({...track,encrypt_info:{}}).getResource(VID),errorCode('UNKNOWN_ENCRYPTION'));
});

test('series preserves exact string identifiers, verifies shape and sorts episodes', async () => {
  let requestBody: any;
  const provider = make(transport((path, body) => { assert.equal(path, '/novel/player/multi_video_detail/v1/'); requestBody = body; return detail(); }));
  const series = await provider.getSeries(SID);
  assert.equal(requestBody.series_id, SID);
  assert.equal(requestBody.biz_param.source, 7);
  assert.deepEqual(series.episodes.map((episode: any) => [episode.id, episode.order]), [[VID, 1], ['7695386808800005145', 2]]);
  assert.equal(series.title, '测试漫剧');
  assert.doesNotMatch(JSON.stringify(series), /spade|kid|main_url|key_seed/);
});

test('unsafe numeric identifiers and business failures produce explicit codes', async () => {
  const provider = make(transport(() => ({ code: 6000, message: 'failed', data: {} })));
  await assert.rejects(provider.getSeries(Number(SID)), errorCode('INVALID_SERIES_ID'));
  await assert.rejects(provider.getSeries(SID), errorCode('API_6000'));
  const bad = detail(); bad.data[SID].video_data.video_list[0].vid = Number(VID) as any;
  await assert.rejects(make(transport(() => bad)).getSeries(SID), errorCode('INVALID_EPISODE_ID'));
});

test('catalog validates selected board and respects server pagination', async () => {
  const provider = make(transport((path, body, extra) => {
    assert.equal(path, '/reading/bookapi/bookmall/cell/change/v'); assert.equal(body, undefined);
    assert.equal(extra.sub_selected_items, 'comic_series_hot_play'); assert.equal(extra.offset, 15);
    return { code: 0, data: { has_more: true, next_offset: 30, cell_view: {
      cell_selector: { outer_row: { items: [{ selector_item_id: 'comic_series_rank', is_selected: true, show_name: '漫剧', sub_cell_selector: { outer_row: { items: [
        { selector_item_id: 'comic_series_hot_play', is_selected: true, show_name: '热播榜' },
      ] } } }] } },
      cell_data: [{ video_data: [{ series_id: SID, series_title: '测试漫剧', episode_cnt: 2, series_cover: 'cover' }] }],
    } } };
  }));
  const result = await provider.catalog('hot', 15);
  assert.equal(result.label, '热播榜'); assert.equal(result.items[0].id, SID);
  assert.equal(result.hasMore, true); assert.equal(result.nextOffset, 30);
});

test('catalog never labels a mismatched selected board as the requested board', async () => {
  const result = { code: 0, data: { cell_view: { cell_data: [], cell_selector: { items: [
    { id: 'comic_series_new_rank', show_name: '新剧榜', is_selected: true },
  ] } } } };
  await assert.rejects(make(transport(() => result)).catalog('hot'), errorCode('BOARD_MISMATCH'));
});

test('resources handle model/track variants, prefer highest supported resolution and keep credentials internal', async () => {
  const encoded = Buffer.from('https://v.example/video.mp4?token=secret').toString('base64');
  const track = { main_url: encoded, codec_type: 'bytevc1', encrypt: true, encryption_method: 'cenc-aes-ctr', spade_a: 'SECRET_KEY', kid: 'SECRET_KID', size: 1234, definition: '720p' };
  const balanced = { ...track, definition: '540p' };
  for (const tracks of [[{ ...track, definition: '1080p' }, track, balanced], { high: { ...track, definition: '1080p' }, medium: track, balanced }]) {
    for (const stringify of [false, true]) {
      const model = { video_duration: 60.125, video_list: tracks };
      const provider = make(transport((path, body) => {
        assert.equal(path, '/novel/player/video_model/v1/');
        assert.deepEqual(body, { video_id: VID, content_type: 1, biz_param: { need_all_video_definition: true, video_platform: 3 } });
        return { code: 0, data: { video_model: stringify ? JSON.stringify(model) : model } };
      }));
      const resource = await provider.getResource(VID);
      assert.equal(resource.definition, '1080p'); assert.equal(resource.spade, 'SECRET_KEY');
      assert.equal(resource.url, 'https://v.example/video.mp4?token=secret'); assert.equal(resource.size, 1234);
    }
  }
});

test('malformed or unsupported resource encryption fails without leaking credentials', async () => {
  const track = { main_url: Buffer.from('https://v.example/video').toString('base64'), codec_type: 'bytevc1', encrypt: true, encryption_method: 'unknown', spade_a: 'SECRET_KEY', size: 123, definition: '720p' };
  const provider = make(transport(() => ({ code: 0, data: { video_model: { video_duration: 60, video_list: [track] } } })));
  await assert.rejects(provider.getResource(VID), (error: any) => error.code === 'UNSUPPORTED_ENCRYPTION' && !error.message.includes('SECRET_KEY'));
  await assert.rejects(make(transport(() => ({ code: 0, data: { video_model: '{bad' } }))).getResource(VID), errorCode('INVALID_RESOURCE_MODEL'));
});

test('an unsupported low-resolution codec cannot hide a compatible full-length track',async()=>{
  const base={main_url:'https://v.example/video',encrypt:false,size:9482722};
  const tracks=[{...base,definition:'540p',codec_type:'bytevc2'},{...base,definition:'720p',codec_type:'bytevc2'},{...base,definition:'1080p',codec_type:'bytevc1'}];
  for(const list of [tracks,Object.fromEntries(tracks.map((t,index)=>[index,t]))]){
    const provider=make(transport(()=>({code:0,data:{video_model:{status:10,video_duration:60.303,video_list:list}}})));
    const resource=await provider.getResource(VID);
    assert.equal(resource.codec,'bytevc1');assert.equal(resource.definition,'1080p');assert.equal(resource.duration,60.303);
  }
});

test('quality preference is stable across episode track order and falls back to the best available resolution',async()=>{
 const base={main_url:'https://v.example/video',encrypt:false,size:1234,codec_type:'h264'};
 for(const [definitions,expected] of [
  [['360p','1080p','540p','720p'],'1080p'],
  [['540p','720p','480p'],'720p'],
  [['360p','480p'],'480p'],
  [['unknown','720p'],'720p'],
 ] as const){
  for(const order of [[...definitions],[...definitions].reverse()]){
   const tracks=order.map(definition=>({...base,definition}));
   const provider=make(transport(()=>({code:0,data:{video_model:{video_duration:60,video_list:tracks}}})));
   assert.equal((await provider.getResource(VID)).definition,expected);
  }
 }
 const tracks=[{...base,definition:'1080p',codec_type:'bytevc2'},{...base,definition:'720p'}];
 assert.equal((await make(transport(()=>({code:0,data:{video_model:{video_duration:60,video_list:tracks}}}))).getResource(VID)).definition,'720p');
});

test('a resource with only unsupported codecs fails before download with an explicit error',async()=>{
  for(const codec of ['bytevc2','future-codec']){
    const track={main_url:'https://v.example/video?token=SECRET',codec_type:codec,encrypt:false,size:1234,definition:'540p'};
    const provider=make(transport(()=>({code:0,data:{video_model:{video_duration:60,video_list:[track]}}})));
    await assert.rejects(provider.getResource(VID),(error:any)=>error.code==='UNSUPPORTED_CODEC'&&!error.message.includes('SECRET'));
  }
});

const page = (data: any) => `<script>window._ROUTER_DATA = ${JSON.stringify({ loaderData: data })};</script>`;
test('official JSON search uses query and confirmed ten-result page cursor', async () => {
  const fetcher = (async (input: any, init:any) => {const url=new URL(input);assert.equal(url.pathname,'/api/search/result');assert.equal(url.searchParams.get('query'),'测试漫剧');assert.equal(new Headers(init.headers).get('accept'),'application/json');const pageNum=Number(url.searchParams.get('page')||1);return Response.json({searchList:[{name:'测试漫剧',video_data:{series_id:SID,series_cover:'cover',episode_cnt:2}}],pageNum,totalPages:2,hasMore:pageNum===1});}) as typeof fetch;
  const provider = make(transport(() => { throw new Error('not native search'); }), fetcher);
  const result = await provider.search('测试漫剧');
  assert.equal(result.items[0].id, SID); assert.equal(result.hasMore, true);assert.equal(result.nextOffset,10);
  assert.equal((await provider.search('测试漫剧', result.nextOffset)).hasMore,false);
});

test('share imports follow only official source redirects and cross-check title and episodes', async () => {
  const html = page({ 'video-animation-share_page': { params: { series_id: SID, aid: '8704' }, pageData: {
    series_data: { title: '测试漫剧', serial_count: 2 }, chapter_ids: [VID, '7695386808800005145'],
  } } });
  let calls = 0;
  const fetcher = (async () => { calls++; return calls === 1 ? new Response(null, { status: 302, headers: { location: 'https://hainanyuyue.com/share/video-animation-share' } }) : new Response(html); }) as typeof fetch;
  const series = await make(transport(() => detail()), fetcher).resolveShare('复制这段 https://kylin.hainanyuyue.com/s/Nx9mnh9X6vY/ 打开');
  assert.equal(series.id, SID); assert.equal(calls, 2);
  const evil = (async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } })) as typeof fetch;
  await assert.rejects(make(transport(() => detail()), evil).resolveShare('https://kylin.hainanyuyue.com/s/test/'), errorCode('UNSAFE_SHARE_URL'));
  const changed = detail(); changed.data[SID].video_data.series_title = '别的作品';
  await assert.rejects(make(transport(() => changed), (async () => new Response(html)) as typeof fetch).resolveShare('https://hainanyuyue.com/share/video-animation-share'), errorCode('SHARE_MISMATCH'));
});

test('JSON search preserves unquoted 19 digit IDs and never executes scripts', async () => {
  const json = `{"searchList":[{"name":"大整数作品","video_data":{"series_id":${SID},"episode_cnt":2}}],"pageNum":1,"totalPages":1,"hasMore":false}`;
  const provider = make(transport(() => null), (async () => new Response(json)) as typeof fetch);
  assert.equal((await provider.search('大整数作品')).items[0].id, SID);
  await assert.rejects(make(transport(()=>null),(async()=>new Response('<script>globalThis.providerScriptExecuted=true</script>')) as typeof fetch).search('测试'),errorCode('INVALID_SEARCH_DATA'));
  assert.equal((globalThis as any).providerScriptExecuted, undefined);
});

test('incomplete series cannot be advertised as a complete episode list', async () => {
  const bad = detail(); bad.data[SID].video_data.episode_cnt = 155;
  await assert.rejects(make(transport(() => bad)).getSeries(SID), errorCode('INCOMPLETE_SERIES'));
});

test('unknown resource encryption and missing size never produce playable resources', async () => {
  const base = { main_url: 'https://v.example/video', codec_type: 'bytevc1', size: 1234, definition: '540p' };
  const provider = (track: any) => make(transport(() => ({ code: 0, data: { video_model: { video_duration: 60, video_list: [track] } } })));
  await assert.rejects(provider(base).getResource(VID), errorCode('UNKNOWN_ENCRYPTION'));
  await assert.rejects(provider({ ...base, encrypt: false, size: 0 }).getResource(VID), errorCode('INVALID_RESOURCE_MODEL'));
});

test('share URL credentials and lookalike domains are rejected before network access', async () => {
  let called = false;
  const provider = make(transport(() => null), (async () => { called = true; return new Response(''); }) as typeof fetch);
  for (const url of ['https://kylin.hainanyuyue.com.evil.test/s/a', 'https://evil@kylin.hainanyuyue.com/s/a', 'http://hainanyuyue.com/share/a']) {
    await assert.rejects(provider.resolveShare(url), errorCode('UNSAFE_SHARE_URL'));
  }
  assert.equal(called, false);
});

test('temporary public search HTTP failure retries once without substituting results', async () => {
  let calls = 0;
  const html = JSON.stringify({searchList:[{name:'测试漫剧',video_data:{series_id:SID}}],pageNum:1,totalPages:1,hasMore:false});
  const fetcher = (async () => ++calls === 1 ? new Response('temporary', { status: 500 }) : new Response(html)) as typeof fetch;
  const result = await make(transport(() => null), fetcher).search('测试漫剧');
  assert.equal(calls, 2); assert.equal(result.items[0].id, SID);
});

test('JSON search rejects mismatched or absent pagination and filters actor cards',async()=>{
 const valid={searchList:[{name:'演员',keyword:SID,user_info:{}},{name:'作品',video_data:{series_id:SID}}],pageNum:1,totalPages:1,hasMore:false};
 const provider=(data:any)=>make(transport(()=>null),(async()=>Response.json(data)) as typeof fetch);
 assert.equal((await provider(valid).search('测试')).items.length,1);
 for(const data of [{...valid,pageNum:2},{...valid,hasMore:true},{...valid,totalPages:undefined},{code:'upstream_unavailable'}])await assert.rejects(provider(data).search('测试'));
 let calls=0;const p=make(transport(()=>null),(async()=>{calls++;return Response.json(valid)}) as typeof fetch);
 await assert.rejects(p.search('测'.repeat(31)),errorCode('INVALID_QUERY'));
 await assert.rejects(p.search('测试',1),errorCode('INVALID_OFFSET'));assert.equal(calls,0);
});

test('native model status 10 with success is playable while failed model statuses are rejected', async () => {
  const track = { main_url: Buffer.from('https://v.example/video').toString('base64'), codec_type: 'bytevc1', size: 1234, definition: '540p', encrypt: false };
  const provider = (status: number, message: string) => make(transport(() => ({ code: 0, data: {
    video_model: JSON.stringify({ status, message, video_duration: 60, video_list: { video_1: track } }),
  } })));
  assert.equal((await provider(10, 'success').getResource(VID)).definition, '540p');
  await assert.rejects(provider(20, 'failed').getResource(VID), errorCode('RESOURCE_UNAVAILABLE'));
});

test('native rank video_data uses cover and video_desc with title for cards', async () => {
  const provider = make(transport(() => ({ code: 0, data: { has_more: false, next_offset: 15, cell_view: {
    cell_selector: { outer_row: { items: [{ selector_item_id: 'comic_series_rank', show_name: '漫剧', is_selected: true,
      sub_cell_selector: { outer_row: { items: [{ selector_item_id: 'comic_series_hot_rank', show_name: '推荐榜', is_selected: true }] } },
    }] } },
    cell_data: [{ video_data: { vid: VID, series_id: SID, title: '测试漫剧', cover: 'https://p6-novel-sign.byteimg.com/cover.jpg',
      video_desc: '原生榜单作品简介', episode_cnt: 155, horiz_cover: '' } }],
  } } })));
  const item = (await provider.catalog('recommend')).items[0];
  assert.equal(item.cover, 'https://p6-novel-sign.byteimg.com/cover.jpg');
  assert.equal(item.description, '原生榜单作品简介');
  assert.equal(item.title, '测试漫剧');
});

test('share response missing page data retries the same original URL only once',async()=>{
 const url='https://kylin.hainanyuyue.com/s/sample';const addresses:string[]=[];
 const html=page({'video-animation-share_page':{linkParams:{schemeParams:{video_id:SID}},pageData:{series_data:{title:'测试漫剧',serial_count:2},chapter_ids:[VID,'7695386808800005145']}}});
 const fetcher=(async(input:string)=>{addresses.push(input);return new Response(addresses.length===1?'<html></html>':html)}) as typeof fetch;
 const result=await make(transport(()=>detail()),fetcher).resolveShare(url);
 assert.equal(result.id,SID);assert.deepEqual(addresses,[url,url]);
 let failedCalls=0;
 await assert.rejects(make(transport(()=>detail()),(async()=>{failedCalls++;return new Response('<html></html>')}) as typeof fetch).resolveShare(url),errorCode('PAGE_DATA_MISSING'));
 assert.equal(failedCalls,2);
});

test('browser search data uses the same validated pagination and exact work IDs without a raw API fetch',async()=>{
 let pages=0,raw=0;
 const provider=new providerModule.ContentProvider(transport(()=>null),{fetch:async()=>{raw++;throw Error('raw search is rejected')},searchPage:async(url:URL)=>{pages++;const pageNum=Number(url.searchParams.get('page')||1);return JSON.stringify({searchList:[{name:'测试漫剧',video_data:{series_id:SID,episode_cnt:2}}],pageNum,totalPages:2,hasMore:pageNum===1})}});
 assert.equal((await provider.search('测试漫剧')).items[0].id,SID);
 assert.equal((await provider.search('测试漫剧',10)).hasMore,false);
 assert.equal(pages,2);assert.equal(raw,0);
});
