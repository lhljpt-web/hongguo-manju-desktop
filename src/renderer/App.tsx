import './playback-enhancements.css';
import {nextSeason,episodeFinished,sleepExpired} from './season-continuation';
import type {SleepPlan} from './season-continuation';
import {playbackDuration,completedResumeResource} from './progressive-resume';
import {seekPosition,visiblePlaybackTime} from './seek-progress';
import type {PlayerPreferences} from './player-preferences';
import type {Recommendations as RecommendationData,VideoQuality} from '../shared/types';
import {readPlaybackRate,savePlaybackRate,PLAYBACK_RATES,readPlayerPreferences,savePlayerPreferences,qualityChoices} from './player-preferences';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, KeyboardEvent, ReactNode } from 'react';
import type { Board, BufferState, CacheOverview, Catalog, Episode, Library, Playback, Progress, Result, Series, Work } from '../shared/types';
import { formatTime, resumeTime, selectEpisode } from './playback-state';
import {UpdateControl} from './UpdateControl';
import {PlayerSurface,useFrameHandoff} from './PlayerSurface';
import {CacheProgress,cacheProgressText} from './CacheProgress';
import {CacheCenter} from './CacheCenter';
import {Recommendations} from './Recommendations';
import {AppearanceDialog} from './Appearance';
import {applyUiTheme,readUiTheme,saveUiTheme,themeOption} from './ui-theme';
import type {UiTheme} from './ui-theme';

let backgrounded=false;
type View = 'discover' | 'favorites' | 'history' | 'search' | 'cache';
type IconName = 'home' | 'heart' | 'clock' | 'search' | 'plus' | 'play' | 'pause' | 'back' | 'refresh' | 'close' | 'next' | 'previous' | 'volume' | 'muted' | 'fullscreen' | 'check' | 'arrow' | 'film' | 'link' | 'palette' | 'download';
const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  play: <path d="m8 4 13 8-13 8Z" />,
  pause: <><path d="M8 5v14M16 5v14" /></>,
  back: <path d="m14 5-7 7 7 7M7 12h14" />,
  refresh: <><path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  next: <><path d="m5 5 11 7-11 7ZM19 5v14" /></>,
  previous: <><path d="m19 5-11 7 11 7ZM5 5v14" /></>,
  volume: <><path d="M4 9h4l5-4v14l-5-4H4ZM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14" /></>,
  muted: <><path d="M4 9h4l5-4v14l-5-4H4ZM17 9l5 6M17 15l5-6" /></>,
  fullscreen: <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />,
  check: <path d="m5 12 4 4 10-10" />,
  arrow: <path d="m9 5 7 7-7 7" />,
  film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  link: <><path d="m10 13 4-4M8 15l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 9l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(0 -1)" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18h1.4a2 2 0 0 0 1.5-3.3 2 2 0 0 1 1.5-3.3H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z" /><circle cx="7.4" cy="11.4" r="1" /><circle cx="9.8" cy="7.5" r="1" /><circle cx="14.4" cy="7.2" r="1" /></>,
  download: <><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" /></>,
};
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
async function call<T>(operation: () => Promise<Result<T>>): Promise<T> {
  let result: Result<T>;
  try { result = await operation(); }
  catch { throw new Error('连接暂时中断，请重试。'); }
  if (!result.ok || result.data === undefined) throw new Error(result.error?.message || '暂时无法获取内容，请稍后重试。');
  return result.data;
}
function errorMessage(error: unknown) { return error instanceof Error ? error.message : '发生了一个问题，请重试。'; }
const emptyLibrary: Library = { favorites: [], history: [] };
// Keep writes ordered even when changing an episode unmounts its player.
let progressWrites: Promise<void> = Promise.resolve();

function Cover({ work, className = '' }: { work: Work; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [work.cover]);
  return <div className={`cover ${className}`}>
    {work.cover && !failed ? <img src={work.cover} alt={`${work.title}封面`} loading="lazy" onError={() => setFailed(true)} /> : <div className="cover-placeholder"><Icon name="film" size={34} /><span>{work.title}</span></div>}
  </div>;
}
function ErrorState({ message, onRetry, compact = false }: { message: string; onRetry: () => void; compact?: boolean }) {
  return <div className={`error-state ${compact ? 'compact' : ''}`} role="alert"><div className="state-icon"><Icon name="refresh" size={27} /></div><h3>暂时没有连上</h3><p>{message}</p><button className="secondary-button" onClick={onRetry}><Icon name="refresh" size={16} />重新尝试</button></div>;
}
function EmptyState({ icon, title, description, action }: { icon: IconName; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="state-icon"><Icon name={icon} size={32} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}
function WorkCard({ work, onOpen, progress }: { work: Work; onOpen: () => void; progress?: Progress }) {
  const percent = progress?.duration ? Math.min(100, progress.time / progress.duration * 100) : 0;
  return <button className="work-card" onClick={onOpen}>
    <div className="poster-wrap"><Cover work={work} /><span className="episode-badge">{work.total ? `${work.total}集` : '漫剧'}</span><div className="poster-hover"><span><Icon name="play" size={23} /></span></div>
      {progress && <div className="poster-progress"><i style={{ width: `${percent}%` }} /></div>}
    </div>
    <h3>{work.title}</h3><p>{progress ? `看到第${progress.order}集 · ${formatTime(progress.time)}` : work.categories?.join(' / ') || '点击观看'}</p>
  </button>;
}

function ResumeCard({ progress, onOpen }: { progress: Progress; onOpen: () => void }) {
  const percent = progress.duration > 0 ? Math.max(0, Math.min(100, progress.time / progress.duration * 100)) : 0;
  return <button className="resume-card" onClick={onOpen} aria-label={`继续观看${progress.work.title}`}>
    <Cover work={progress.work} />
    <div className="resume-caption"><div><h3>{progress.work.title}</h3><p>第{progress.order}集 · {formatTime(progress.time)}</p></div><span className="resume-play"><Icon name="play" size={16} /></span></div>
    <span className="resume-progress"><i style={{ width: `${percent}%` }} /></span>
  </button>;
}

export default function App() {
  const [view, setView] = useState<View>('discover');
  const [board, setBoard] = useState<Board>('recommend');
  const [heroIndex, setHeroIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [moreError, setMoreError] = useState('');
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const [libraryError, setLibraryError] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preferences,setPreferences]=useState(readPlayerPreferences);
  const [sleep,setSleepState]=useState<SleepPlan>({kind:'off'});
  const sleepRef=useRef<SleepPlan>(sleep);
  const [startFirst,setStartFirst]=useState<string|null>(null);
  useEffect(()=>{if(!activeId)setStartFirst(null)},[activeId]);
  const changeSleep=(plan:SleepPlan)=>{sleepRef.current=plan;setSleepState(plan)};
  const canContinue=()=>!backgrounded&&!sleepExpired(sleepRef.current);
  const finishEpisode=()=>{const plan=episodeFinished(sleepRef.current);changeSleep(plan);return !backgrounded&&!sleepExpired(plan)};
  const changePreferences=(value:PlayerPreferences)=>{setPreferences(value);if(!savePlayerPreferences(value))notify('播放设置已应用，但未能保存。')};
  useEffect(()=>{const tick=()=>{if(sleepRef.current.kind==='deadline'&&sleepExpired(sleepRef.current)){changeSleep({kind:'stopped'});document.querySelector('video')?.pause()}};const timer=window.setInterval(tick,500);document.addEventListener('visibilitychange',tick);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',tick)}},[]);
  const session:PlaybackSession={preferences,onPreferences:changePreferences,sleep,onSleep:changeSleep,canContinue,finishEpisode,onManualPlay:()=>{if(sleepExpired(sleepRef.current))changeSleep({kind:'off'})}};
  const [rate, setRate] = useState(readPlaybackRate);
  const changeRate = (value: number) => { setRate(value); if (!savePlaybackRate(value)) notify('倍速已应用，但未能保存，重开软件后可能需要重新设置。'); };
  const [importOpen, setImportOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [toast, setToast] = useState('');
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [uiTheme,setUiTheme]=useState<UiTheme>(readUiTheme);
  const [appearanceOpen,setAppearanceOpen]=useState(false);
  const [cache,setCache]=useState<CacheOverview|null>(null);
  const [cacheError,setCacheError]=useState('');
  const refreshCache=useCallback(async()=>{try{setCache(await call(()=>window.desktop.cacheState()));setCacheError('')}catch(error){setCacheError(errorMessage(error))}},[]);
  useEffect(()=>{let live=true,timer:number;const poll=async()=>{await refreshCache();if(live)timer=window.setTimeout(()=>void poll(),1000)};void poll();return()=>{live=false;window.clearTimeout(timer)}},[refreshCache]);
  useEffect(()=>window.desktop.onBackground?.(hidden=>{backgrounded=hidden;if(hidden)document.querySelector('video')?.pause()}),[]);
  const requestId = useRef(0);
  const scrollArea = useRef<HTMLDivElement>(null);
  const notify = useCallback((message: string) => setToast(message), []);
  useEffect(()=>{applyUiTheme(uiTheme)},[uiTheme]);
  const changeTheme=useCallback((value:UiTheme)=>{applyUiTheme(value);setUiTheme(value);if(!saveUiTheme(value))setToast('外观已切换，但未能保存。')},[]);
  const closeAppearance=useCallback(()=>setAppearanceOpen(false),[]);
  useEffect(()=>{void call(()=>window.desktop.videoQuality(readPlayerPreferences().quality)).catch(error=>notify(`画质设置同步失败：${errorMessage(error)}`))},[notify]);
  useEffect(() => {
    let allowClose = false;
    let closing = false;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (allowClose) return;
      event.preventDefault(); event.returnValue = '';
      if (closing) return;
      closing = true;
      // Player listeners enqueue their last snapshot during this same event.
      void Promise.resolve().then(() => progressWrites).finally(() => { allowClose = true; window.setTimeout(() => window.close(), 0); });
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 4500); return () => window.clearTimeout(timer); }, [toast]);
  const updateLibrary = useCallback((value: Library) => { setLibrary(value); setLibraryError(''); }, []);
  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true); setLibraryError('');
    try { updateLibrary(await call(() => window.desktop.library())); }
    catch (error) { setLibraryError(errorMessage(error)); }
    finally { setLibraryLoading(false); }
  }, [updateLibrary]);
  useEffect(() => { void loadLibrary(); }, [loadLibrary]);
  const loadCatalog = useCallback(async (append = false) => {
    if (view !== 'discover' && view !== 'search') return;
    const token = ++requestId.current;
    if (append) { setMoreLoading(true); setMoreError(''); }
    else { setLoading(true); setCatalogError(''); setMoreError(''); setMoreLoading(false); setHeroIndex(0); }
    const offset = append ? catalog?.nextOffset || 0 : 0;
    try {
      const value = await call(() => view === 'search' ? window.desktop.search(searchTerm, offset) : window.desktop.catalog(board, offset));
      if (token !== requestId.current) return;
      setCatalog(previous => append && previous ? { ...value, items: [...previous.items, ...value.items.filter(item => !previous.items.some(old => old.id === item.id))] } : value);
    } catch (error) {
      if (token !== requestId.current) return;
      if (append) setMoreError(errorMessage(error)); else setCatalogError(errorMessage(error));
    } finally {
      if (token === requestId.current) { setLoading(false); setMoreLoading(false); }
    }
  }, [view, board, searchTerm, catalog?.nextOffset]);
  useEffect(() => {
    setCatalog(null); scrollArea.current?.scrollTo({ top: 0 });
    if (view === 'discover' || view === 'search') void loadCatalog();
    return () => { requestId.current++; };
    // A nextOffset update must not reload the first page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, board, searchTerm]);
  async function toggleFavorite(work: Work) {
    if (favoriteBusy) return;
    setFavoriteBusy(true);
    const enabled = !library.favorites.some(item => item.id === work.id);
    try { updateLibrary(await call(() => window.desktop.favorite(work, enabled))); notify(enabled ? '已加入收藏' : '已取消收藏'); }
    catch (error) { notify(errorMessage(error)); }
    finally { setFavoriteBusy(false); }
  }
  function navigate(next: View) { setActiveId(null); setView(next); if (next === 'favorites' || next === 'history') void loadLibrary(); }
  function submitSearch(event: FormEvent) {
    event.preventDefault(); const term = query.trim(); if (!term) return;
    setActiveId(null); if (term === searchTerm && view === 'search') void loadCatalog();
    setSearchTerm(term); setView('search');
  }
  async function importWork(event: FormEvent) {
    event.preventDefault(); if (!shareText.trim() || importing) return;
    setImporting(true); setImportError('');
    try {
      const series = await call(() => window.desktop.importShare(shareText.trim()));
      updateLibrary(await call(() => window.desktop.favorite(series, true)));
      setImportOpen(false); setShareText(''); setActiveId(series.id); notify('导入成功，已加入收藏');
    } catch (error) { setImportError(errorMessage(error)); }
    finally { setImporting(false); }
  }
  useEffect(() => {
    if (!importOpen) return;
    const handler = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape' && !importing) setImportOpen(false); };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [importOpen, importing]);
  const heading = view === 'favorites' ? '我的收藏' : view === 'history' ? '继续你的故事' : `“${searchTerm}”的搜索结果`;
  const subheading = view === 'favorites' ? '喜欢的故事，都在这里。' : view === 'history' ? '从上次停下的地方，继续看。' : '找到下一部想看的漫剧。';
  const featuredWorks = !loading && !catalogError && view === 'discover' ? catalog?.items.slice(0, 3) || [] : [];
  const spotlight = featuredWorks[heroIndex] || featuredWorks[0];
  const spotlightFavorite = spotlight && library.favorites.some(item => item.id === spotlight.id);
  const list = view === 'favorites' ? library.favorites : view === 'history' ? library.history.map(item => item.work) : catalog?.items || [];
  const cacheRunning = !!cache?.tasks.some(task => !task.paused && task.state.status !== 'complete');
  return <div className="app-shell">
    {uiTheme === 'neon' && <aside className="theme-rail" aria-label="主要导航">
      <button className="rail-logo" onClick={() => navigate('discover')} aria-label="发现" title="返回首页"><span>漫</span></button>
      <nav className="rail-nav">
        <button className={view === 'discover' ? 'active' : ''} aria-current={view === 'discover' ? 'page' : undefined} onClick={() => navigate('discover')}><Icon name="home" size={19} /><span>发现</span></button>
        <button className={view === 'favorites' ? 'active' : ''} aria-current={view === 'favorites' ? 'page' : undefined} onClick={() => navigate('favorites')}><Icon name="heart" size={19} /><span>收藏</span></button>
        <button className={view === 'history' ? 'active' : ''} aria-current={view === 'history' ? 'page' : undefined} onClick={() => navigate('history')}><Icon name="clock" size={19} /><span>历史</span></button>
        <button className={view === 'cache' ? 'active' : ''} aria-current={view === 'cache' ? 'page' : undefined} onClick={() => navigate('cache')}><Icon name="download" size={19} /><span>缓存</span>{cacheRunning && <i className="rail-dot" />}</button>
      </nav>
      <div className="rail-bottom">
        <button onClick={() => { setImportError(''); setImportOpen(true); }}><Icon name="link" size={18} /><span>导入</span></button>
        <button className={appearanceOpen ? 'active' : ''} onClick={() => setAppearanceOpen(true)}><Icon name="palette" size={18} /><span>外观</span></button>
      </div>
    </aside>}
    <div className="workspace">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('discover')} aria-label="发现" title="返回首页">漫剧</button>
        <nav className="board-tabs" role="tablist" aria-label="漫剧榜单">{([['recommend', '推荐', '推荐榜'], ['hot', '热播', '热播榜'], ['new', '新剧', '新剧榜']] as const).map(([key, label, accessibleLabel]) => <button key={key} role="tab" aria-label={accessibleLabel} aria-selected={view === 'discover' && !activeId && board === key} className={view === 'discover' && !activeId && board === key ? 'selected' : ''} onClick={() => { setActiveId(null); setView('discover'); setBoard(key); }}>{label}</button>)}</nav>
        <form className="search-box" onSubmit={submitSearch}><Icon name="search" size={18} /><input value={query} onChange={event => setQuery(event.target.value)} aria-label="搜索漫剧名称" placeholder="搜索漫剧" maxLength={200} /><button type="submit" aria-label="搜索" title="搜索"><Icon name="arrow" size={16} /></button></form>
        <button className="top-import" aria-label="导入分享" onClick={() => { setImportError(''); setImportOpen(true); }}><Icon name="link" size={17} /><span>导入链接</span></button>
        <nav className="library-nav" aria-label="个人记录"><button className={view === 'favorites' && !activeId ? 'active' : ''} aria-label="我的收藏" onClick={() => navigate('favorites')}>收藏</button><button className={view === 'history' && !activeId ? 'active' : ''} aria-label="观看历史" onClick={() => navigate('history')}>历史</button></nav>
        <button className="diagnostic-button" onClick={()=>void call(()=>window.desktop.exportDiagnostics()).then(result=>{if(result.saved)notify('诊断信息已导出')}).catch(error=>notify(errorMessage(error)))}>导出诊断</button><UpdateControl/>
        <button className={`appearance-button ${uiTheme !== 'paper' ? 'has-theme' : ''}`} onClick={() => setAppearanceOpen(true)} aria-label={`外观设置，当前${themeOption(uiTheme).name}`} title="外观设置"><Icon name="palette" size={17} /><span>外观</span>{uiTheme !== 'paper' && <i />}</button>
        <button className={`cache-nav ${view==='cache'&&!activeId?'active':''}`} onClick={()=>navigate('cache')} aria-label="缓存中心">缓存{cacheRunning&&<i/>}</button>
      </header>
      <main className="content-scroll" ref={scrollArea}>
        {activeId ? <Detail session={session} startFirst={startFirst===activeId} onOpen={(id,first=false)=>{setStartFirst(first?id:null);setActiveId(id)}} rate={rate} onRateChange={changeRate} id={activeId} library={library} onLibrary={updateLibrary} onFavorite={toggleFavorite} favoriteBusy={favoriteBusy} onBack={() => setActiveId(null)} notify={notify} /> : view==='cache'?<CacheCenter state={cache} error={cacheError} onRefresh={()=>void refreshCache()} onOpen={setActiveId} favorites={library.favorites}/>:<div className={`catalog-page ${view === 'discover' ? 'discover-page' : ''}`}>
          {view !== 'discover' && <div className="page-heading"><div><h1>{heading}</h1><p>{subheading}</p></div>{view === 'search' && <button className="refresh-button" onClick={() => void loadCatalog()} disabled={loading}><Icon name="refresh" size={17} />刷新</button>}</div>}
          {spotlight && <section className="spotlight" aria-label="作品推荐">
            <Cover work={spotlight} className="spotlight-art" />
            <div className="spotlight-copy"><span className="featured-label">{spotlight.categories?.join(' · ') || (board === 'hot' ? '热门故事' : board === 'new' ? '新鲜上线' : '推荐开看')}</span><h2>{spotlight.title}</h2><div className="spotlight-meta">{spotlight.total ? `全${spotlight.total}集` : '漫剧'}</div><p>{spotlight.description || '打开这个故事，精彩即将开始。'}</p><div className="spotlight-actions"><button className="primary-button" aria-label="立即观看" onClick={() => setActiveId(spotlight.id)}><Icon name="play" size={18} />播放</button><button className={`secondary-button ${spotlightFavorite ? 'is-favorite' : ''}`} disabled={favoriteBusy} onClick={() => void toggleFavorite(spotlight)}><Icon name="heart" size={17} />{spotlightFavorite ? '已收藏' : '收藏'}</button></div></div>
            {featuredWorks.length > 1 && <div className="hero-pagination" aria-label="切换推荐作品">{featuredWorks.map((work, index) => <button key={work.id} aria-label={`切换推荐作品${index + 1}`} aria-pressed={spotlight.id === work.id} title={work.title} className={spotlight.id === work.id ? 'selected' : ''} onClick={() => setHeroIndex(index)}><span /></button>)}</div>}
          </section>}
          <div className="catalog-body">
          {view === 'discover' && <section className="resume-section" aria-label="继续观看"><div className="section-heading"><h2>继续观看</h2><span className="section-rule" /><button className="text-button" onClick={() => navigate('history')}>全部历史<Icon name="arrow" size={14} /></button></div>{libraryLoading ? <p className="resume-empty">正在读取观看记录…</p> : libraryError ? <div className="resume-empty" role="alert">{libraryError}<button className="text-button" onClick={() => void loadLibrary()}>重新尝试</button></div> : library.history.length ? <div className="resume-grid">{library.history.slice(0, 3).map(progress => <ResumeCard key={progress.seriesId} progress={progress} onOpen={() => setActiveId(progress.seriesId)} />)}</div> : <p className="resume-empty">开始观看一部漫剧，下次就能从这里继续。</p>}</section>}
          {view === 'discover' && <div className="section-heading"><h2>{loading ? '正在寻找好故事' : catalog?.label || '精选漫剧'}</h2><span className="section-rule" /><button className="refresh-button" onClick={() => void loadCatalog()} disabled={loading}><Icon name="refresh" size={16} />刷新</button></div>}
          {(view === 'discover' || view === 'search') && loading ? <div className="skeleton-grid" aria-label="正在加载漫剧" aria-busy="true">{Array.from({ length: 10 }, (_, index) => <div className="skeleton-card" key={index}><div /><i /><span /></div>)}</div> : catalogError && (view === 'discover' || view === 'search') ? <ErrorState message={catalogError} onRetry={() => void loadCatalog()} /> : (view === 'favorites' || view === 'history') && libraryLoading ? <div className="center-loading"><span className="spinner" /><p>正在整理你的漫剧…</p></div> : libraryError && (view === 'favorites' || view === 'history') ? <ErrorState message={libraryError} onRetry={() => void loadLibrary()} /> : <>
            {list.length > 0 ? <>{view !== 'discover' && <div className="section-heading"><h2>{view === 'search' ? '搜索结果' : view === 'favorites' ? '已收藏的漫剧' : '最近观看'}</h2><span>{list.length}部漫剧</span></div>}<div className="work-grid">{list.map(work => <WorkCard key={work.id} work={work} progress={view === 'history' ? library.history.find(item => item.seriesId === work.id) : undefined} onOpen={() => setActiveId(work.id)} />)}</div></> : <EmptyState icon={view === 'favorites' ? 'heart' : view === 'history' ? 'clock' : 'search'} title={view === 'favorites' ? '收藏你的第一部漫剧' : view === 'history' ? '故事还没开始' : view === 'search' ? '没有找到相关漫剧' : '暂时没有推荐内容'} description={view === 'favorites' ? '在作品页面点击收藏，或导入一条分享内容。' : view === 'history' ? '看过的漫剧会出现在这里，随时接着看。' : view === 'search' ? '换一个剧名或关键词，再试试。' : '点击刷新，再来看看。'} action={view === 'favorites' || view === 'history' ? <button className="primary-button" onClick={() => navigate('discover')}>去发现<Icon name="arrow" size={16} /></button> : undefined} />}
            {(view === 'discover' || view === 'search') && catalog?.hasMore && <div className="load-more">{moreError && <p role="alert">{moreError}</p>}<button className="secondary-button" disabled={moreLoading} onClick={() => void loadCatalog(true)}>{moreLoading ? <><span className="spinner small" />正在加载…</> : moreError ? '重新加载' : '发现更多'}{!moreLoading && <Icon name="arrow" size={16} />}</button></div>}
          </>}
          <footer className="page-footer"><span>好故事，值得慢慢看</span><span>自动检查更新 · 顶部「更新」查看</span></footer>
          </div>
        </div>}
      </main>
    </div>
    {importOpen && <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget && !importing) setImportOpen(false); }}><section className="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title"><button className="modal-close icon-button" aria-label="关闭导入" disabled={importing} onClick={() => setImportOpen(false)}><Icon name="close" /></button><div className="modal-icon"><Icon name="plus" size={27} /></div><h2 id="import-title">把好故事带回来</h2><p>粘贴红果漫剧的分享文本或链接，导入后会自动加入收藏。</p><form onSubmit={importWork}><textarea autoFocus placeholder="在这里粘贴分享内容或链接…" value={shareText} onChange={event => setShareText(event.target.value)} maxLength={10000} disabled={importing} aria-label="分享文本或链接" />{importError && <p className="inline-error" role="alert">{importError}</p>}<button className="primary-button full-width" type="submit" disabled={!shareText.trim() || importing}>{importing ? <><span className="spinner small" />正在找到这部漫剧…</> : <><Icon name="plus" size={18} />导入并收藏</>}</button></form></section></div>}
    {appearanceOpen && <AppearanceDialog theme={uiTheme} onChange={changeTheme} onClose={closeAppearance} />}
    {toast && <div className="toast" role="status"><Icon name="check" size={18} /><span>{toast}</span><button aria-label="关闭提示" onClick={() => setToast('')}><Icon name="close" size={15} /></button></div>}
  </div>;
}

interface PlaybackSession {
 preferences:PlayerPreferences;onPreferences:(value:PlayerPreferences)=>void;
 sleep:SleepPlan;onSleep:(plan:SleepPlan)=>void;canContinue:()=>boolean;finishEpisode:()=>boolean;onManualPlay:()=>void;
}
function SleepControl({session}:{session:PlaybackSession}){
 const plan=session.sleep;
 const value=plan.kind==='deadline'?'deadline':plan.kind==='episodes'?`episodes-${plan.remaining}`:plan.kind;
 return <label className="sleep-control">睡眠 <select aria-label="睡眠定时" value={value} onChange={event=>{const value=event.target.value;session.onSleep(value==='off'?{kind:'off'}:value.startsWith('minutes-')?{kind:'deadline',deadline:Date.now()+Number(value.slice(8))*60000}:{kind:'episodes',remaining:Number(value.slice(9))})}}>
 <option value="off">关闭</option>{plan.kind==='deadline'&&<option value="deadline">{Math.max(1,Math.ceil((plan.deadline-Date.now())/60000))} 分钟后停止</option>}{plan.kind==='stopped'&&<option value="stopped">已停止 · 手动播放可继续</option>}
 <option value="minutes-15">15 分钟后</option><option value="minutes-30">30 分钟后</option><option value="minutes-60">60 分钟后</option>
 <option value="episodes-1">播完当前集</option><option value="episodes-2">再播完 2 集</option><option value="episodes-3">再播完 3 集</option><option value="episodes-4">再播完 4 集</option><option value="episodes-5">再播完 5 集</option>
 </select></label>;
}
function Detail({ session,startFirst,onOpen, rate, onRateChange, id, library, onLibrary, onFavorite, favoriteBusy, onBack, notify }: {session:PlaybackSession;startFirst:boolean; onOpen:(id:string,first?:boolean)=>void; rate: number; onRateChange: (rate: number) => void; id: string; library: Library; onLibrary: (library: Library) => void; onFavorite: (work: Work) => void; favoriteBusy: boolean; onBack: () => void; notify: (message: string) => void }) {
 const [series,setSeries]=useState<Series|null>(null),[episode,setEpisode]=useState<Episode|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[reload,setReload]=useState(0);
 const [buffer,setBuffer]=useState<BufferState|null>(null),[bufferError,setBufferError]=useState(''),[bufferRetry,setBufferRetry]=useState(0);
 const [sortDescending,setSortDescending]=useState(false);
 const [related,setRelated]=useState<RecommendationData|null>(null),[relatedError,setRelatedError]=useState(''),[relatedLoading,setRelatedLoading]=useState(true),[relatedRetry,setRelatedRetry]=useState(0);
 const [ended,setEnded]=useState(false),[pendingEnd,setPendingEnd]=useState(false);
 const sessionRef=useRef(session);sessionRef.current=session;
 const prefetched=useRef(new Set<string>());
 const libraryRef=useRef(library);libraryRef.current=library;
 useEffect(()=>{
  let live=true;setLoading(true);setError('');setEpisode(null);setSeries(null);setEnded(false);setPendingEnd(false);setBuffer(null);
  void call(()=>window.desktop.series(id)).then(value=>{if(!live)return;const ordered={...value,episodes:[...value.episodes].sort((a,b)=>a.order-b.order)};setSeries(ordered);setEpisode(selectEpisode(ordered.episodes,startFirst?undefined:libraryRef.current.history.find(item=>item.seriesId===id)?.episodeId)||null)}).catch(error=>{if(live)setError(errorMessage(error))}).finally(()=>{if(live)setLoading(false)});
  return()=>{live=false};
 },[id,reload,startFirst]);
 useEffect(()=>{
  let live=true;setRelated(null);setRelatedLoading(true);setRelatedError('');
  void call(()=>window.desktop.recommendations(id,relatedRetry>0)).then(value=>{if(live)setRelated(value)}).catch(error=>{if(live)setRelatedError(errorMessage(error))}).finally(()=>{if(live)setRelatedLoading(false)});
  return()=>{live=false};
 },[id,relatedRetry]);
 const index=series?.episodes.findIndex(item=>item.id===episode?.id)??-1;
 const immediate=series&&related?nextSeason(series,related.seasons.map(item=>item.work)):undefined;
 useEffect(()=>{if(!immediate||prefetched.current.has(immediate.id))return;prefetched.current.add(immediate.id);void call(()=>window.desktop.cacheAdd(immediate.id)).catch(()=>{prefetched.current.delete(immediate.id)})},[immediate?.id]);
 useEffect(()=>{
  if(!pendingEnd||relatedLoading||!series||series.id!==id)return;
  setPendingEnd(false);
  if(immediate&&session.preferences.autoNext&&session.canContinue()&&!relatedError){onOpen(immediate.id,true)}
 },[pendingEnd,relatedLoading,relatedError,immediate?.id,session.preferences.autoNext,session.sleep,id]);
 useEffect(()=>{
  if(!series||index<0)return;
  let live=true,timer:number|undefined;setBuffer(null);setBufferError('');
  const refresh=async()=>{try{const state=await call(()=>window.desktop.bufferState());if(live){setBuffer(state);setBufferError('')}}catch(error){if(live)setBufferError(errorMessage(error))}};
  const ordered=[...series.episodes.slice(index),...series.episodes.slice(0,index)].map(item=>item.id);
  void(async()=>{await call(()=>window.desktop.videoQuality(sessionRef.current.preferences.quality));if(!live)return;await call(()=>window.desktop.bufferEpisodes(ordered));if(bufferRetry)await call(()=>window.desktop.retryBuffer());if(!live)return;await refresh();if(live)timer=window.setInterval(()=>void refresh(),1000)})().catch(error=>{if(live)setBufferError(errorMessage(error))});
  return()=>{live=false;window.clearInterval(timer)};
 },[series,index,bufferRetry]);
 useEffect(()=>()=>{void call(()=>window.desktop.bufferEpisodes([])).catch(()=>{})},[]);
 const choose=(item:Episode)=>{setEnded(false);setPendingEnd(false);setEpisode(item)};
 const next=()=>{if(series&&index>=0&&index<series.episodes.length-1)choose(series.episodes[index+1])};
 const finished=()=>{
  if(index<0||!series||series.id!==id)return;
  const allowed=sessionRef.current.finishEpisode();
  if(index<series.episodes.length-1){if(allowed&&sessionRef.current.preferences.autoNext)next();return}
  setEnded(true);setPendingEnd(allowed&&sessionRef.current.preferences.autoNext);
 };
 const favorite=library.favorites.some(item=>item.id===id);
 const episodes=sortDescending?[...(series?.episodes||[])].reverse():series?.episodes||[];
 const endOverlay=ended?<div className="season-end-overlay" role="status"><span className="eyebrow">STORY CONTINUES</span><h2>{session.sleep.kind==='stopped'?'已按睡眠计划停止':relatedLoading?'正在查找下一季…':relatedError?'后续作品查询暂时失败':immediate?'本季已看完':'本季已完结'}</h2>
 {relatedLoading?<p>正在核对同名下一季，请稍候。</p>:relatedError?<><p>{relatedError}</p><button className="secondary-button" onClick={()=>setRelatedRetry(value=>value+1)}>重试查找后续作品</button></>:<><p>{immediate?'已找到同名下一季；可手动开始，自动连播开启时会继续。':'未找到可唯一确认的紧接下一季，看看其他故事。'}</p>{related?.message&&<p>{related.message}</p>}{immediate&&<button className="primary-button" onClick={()=>{session.onManualPlay();onOpen(immediate.id,true)}}>播放 {immediate.title}</button>}<div className="end-recommendations">{related?.similar.slice(0,6).map(item=><button key={item.work.id} onClick={()=>{session.onManualPlay();onOpen(item.work.id,true)}}><Cover work={item.work}/><span>{item.work.title}</span></button>)}</div></>}
 <button className="secondary-button" onClick={()=>{session.onManualPlay();setEnded(false);setPendingEnd(false);document.querySelector<HTMLVideoElement>('.player-surface video')?.dispatchEvent(new Event('replay-request'))}}>重播本集</button></div>:null;
 return <div className="detail-page"><button className="back-button" onClick={onBack}><Icon name="back" size={18}/>返回</button>
 {series&&<div className="detail-heading"><div><span className="eyebrow">NOW SHOWING</span><h1>{series.title}</h1><p>{series.categories?.join(' · ')} · {series.episodes.length}集</p></div><button className={`favorite-button ${favorite?'is-favorite':''}`} disabled={favoriteBusy} onClick={()=>onFavorite(series)}><Icon name="heart" size={18}/>{favorite?'已收藏':'收藏漫剧'}</button></div>}
 <div className="watch-layout"><section className="watch-main">
 {series&&episode&&<><div className="background-cache-entry"><span>下一季会在确认后自动加入缓存</span><button className="secondary-button" onClick={()=>void call(()=>window.desktop.cacheAdd(series.id)).then(()=>notify('已加入后台缓存')).catch(error=>notify(errorMessage(error)))}>缓存当前整季</button></div><CacheProgress state={buffer} episodes={series.episodes} error={bufferError} onRetry={()=>setBufferRetry(value=>value+1)}/></>}
 <PlayerSurface episodeId={episode?.id||id}>
 {loading?<PlayerTransition><div className="player-overlay"><span className="spinner"/><strong>正在打开下一段故事…</strong></div></PlayerTransition>:error?<PlayerTransition><div className="player-overlay player-error"><ErrorState message={error} onRetry={()=>setReload(value=>value+1)}/></div></PlayerTransition>:series&&episode?<Player session={session} onManualStart={()=>{setEnded(false);setPendingEnd(false)}} endOverlay={endOverlay} buffer={buffer} bufferError={bufferError} rate={rate} onRateChange={onRateChange} key={`${series.id}:${episode.id}`} series={series} episode={episode} initialTime={startFirst?0:library.history.find(item=>item.seriesId===id&&item.episodeId===episode.id)?.time||0} onLibrary={onLibrary} onPrevious={index>0?()=>choose(series.episodes[index-1]):undefined} onNext={index<series.episodes.length-1?next:undefined} onEnded={finished} notify={notify}/>:<div className="unavailable-player"><h3>暂时无法继续上次分集</h3><p>来源返回的选集列表中没有上次观看的分集。观看记录已保留，请重试获取，或在右侧手动选集。</p><button onClick={()=>setReload(value=>value+1)}>重新获取剧集</button></div>}
 </PlayerSurface>
 <div className="now-playing"><strong>{episode?`第${episode.order}集`:'准备播放'}</strong><SleepControl session={session}/><label className="toggle-label"><input type="checkbox" checked={session.preferences.autoNext} onChange={event=>session.onPreferences({...session.preferences,autoNext:event.target.checked})}/><span className="toggle-track"/>自动连播</label></div>
 {series&&<section className="story-info"><Cover work={series}/><div><h2>关于这部漫剧</h2><div className="category-chips">{series.categories?.map(category=><span key={category}>{category}</span>)}</div><p>{series.description||'暂无作品简介。'}</p></div></section>}
 </section><aside className="episode-panel"><div className="episode-heading"><div><h2>选集</h2><span>{episodes.length}集 · 可用性以播放结果为准</span></div><button onClick={()=>setSortDescending(value=>!value)}>{sortDescending?'倒序 ↓':'正序 ↑'}</button></div><div className="episode-grid">{episodes.map(item=><button key={item.id} className={item.id===episode?.id?'current':''} onClick={()=>{session.onManualPlay();choose(item)}} aria-label={`播放第${item.order}集`}>{item.order}</button>)}</div></aside></div>
 <Recommendations id={id} supplied={{data:related,error:relatedError,loading:relatedLoading,retry:()=>setRelatedRetry(value=>value+1)}} onOpen={id=>onOpen(id,true)} renderCard={(work,open)=><WorkCard work={work} onOpen={open}/>}/>
 </div>;
}

function PlayerTransition({children}:{children:ReactNode}){
 const video=useRef<HTMLVideoElement|null>(null);
 const {stageRef}=useFrameHandoff(video);
 return <div className="player transition-player"><div className="video-stage" ref={stageRef}>{children}</div></div>;
}

function Player({ session,endOverlay,onManualStart,rate, onRateChange, series, episode, initialTime, onLibrary, onPrevious, onNext, onEnded, notify, buffer, bufferError }: {session:PlaybackSession;endOverlay:ReactNode;onManualStart:()=>void; rate: number; onRateChange: (rate: number) => void; series: Series; episode: Episode; initialTime: number; onLibrary: (library: Library) => void; onPrevious?: () => void; onNext?: () => void; onEnded: () => void; notify: (message: string) => void; buffer:BufferState|null;bufferError:string }) {
  const video = useRef<HTMLVideoElement>(null);
  const {videoRef,stageRef}=useFrameHandoff(video);
  const container = useRef<HTMLDivElement>(null);
  const [resource, setResource] = useState<Playback | null>(null);
  const resourceRef=useRef(resource);resourceRef.current=resource;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(episode.duration || 0);
  const {volume,muted,quality}=session.preferences;
  const setVolume=(value:number)=>session.onPreferences({...session.preferences,volume:value,muted:false});
  const setMuted=(value:boolean|((value:boolean)=>boolean))=>session.onPreferences({...session.preferences,muted:typeof value==='function'?value(muted):value});
  const sessionRef=useRef(session);sessionRef.current=session;
  const [pip,setPip]=useState(false),[pipError,setPipError]=useState('');
  const [qualityBusy,setQualityBusy]=useState(false);
  const pipSupported=typeof document.pictureInPictureEnabled==='boolean'&&document.pictureInPictureEnabled;
  useEffect(()=>{if(session.sleep.kind==='stopped')video.current?.pause()},[session.sleep.kind]);
  useEffect(()=>{const changed=()=>setPip(document.pictureInPictureElement===video.current);const element=video.current;element?.addEventListener('enterpictureinpicture',changed);element?.addEventListener('leavepictureinpicture',changed);return()=>{element?.removeEventListener('enterpictureinpicture',changed);element?.removeEventListener('leavepictureinpicture',changed)}},[resource]);
  useEffect(()=>{const replay=()=>{if(video.current){video.current.currentTime=0;void video.current.play().catch(()=>notify('请点击播放继续'))}};const element=video.current;element?.addEventListener('replay-request',replay);return()=>element?.removeEventListener('replay-request',replay)},[resource]);
  async function togglePip(){setPipError('');const element=video.current;if(!element||!pipSupported){setPipError('当前环境不支持画中画');return}try{if(document.pictureInPictureElement)await document.exitPictureInPicture();else await element.requestPictureInPicture()}catch{setPipError('画中画未能打开，请在视频开始播放后重试。')}}
  async function changeQuality(value:VideoQuality){
    captureProgress();void save();desiredTime.current=progress.current.ready?progress.current.time:desiredTime.current;
    setQualityBusy(true);
    try{await call(()=>window.desktop.videoQuality(value));if(!mounted.current)return;sessionRef.current.onPreferences({...sessionRef.current.preferences,quality:value})}catch(error){notify(errorMessage(error))}finally{if(mounted.current)setQualityBusy(false)}
  }
  const [attempt, setAttempt] = useState(0);
  const automaticRetry = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const desiredTime = useRef(initialTime);
  const pendingResume=useRef<number|null>(null);
  const explicitSeek=useRef(false);
  const playAfterSeek=useRef<boolean|null>(null);
  const streamComplete=useRef(false);
  const progress = useRef({ time: 0, duration: episode.duration || 0, ready: false });
  const persisted = useRef<string>('');
  const callbacks = useRef({ onLibrary, notify });
  callbacks.current = { onLibrary, notify };
  const mounted = useRef(true);
  const save = useCallback(async () => {
    const element = video.current;
    if (element && progress.current.ready) {
      progress.current.time = visiblePlaybackTime(element.currentTime,pendingResume.current);
      progress.current.duration=playbackDuration(resourceRef.current,element.duration,progress.current.duration,streamComplete.current);
    }
    const state = { ...progress.current };
    if (!state.ready || state.duration <= 0) return progressWrites;
    const fingerprint = `${Math.floor(state.time)}:${Math.floor(state.duration)}`;
    if (persisted.current === fingerprint) return progressWrites;
    persisted.current = fingerprint;
    const { episodes: _, ...work } = series;
    progressWrites = progressWrites.then(async () => {
      try {
        const result = await call(() => window.desktop.progress({ seriesId: series.id, episodeId: episode.id, order: episode.order, time: state.time, duration: state.duration, work }));
        callbacks.current.onLibrary(result);
      } catch (error) { persisted.current = ''; if (mounted.current) callbacks.current.notify(`观看进度未保存：${errorMessage(error)}`); }
    });
    return progressWrites;
  }, [series, episode.id, episode.order]);
  useEffect(() => {
    mounted.current = true;
    const timer = window.setInterval(() => { void save(); }, 5000);
    const beforeUnload = () => { video.current?.pause(); void save(); };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { mounted.current = false; window.clearInterval(timer); window.removeEventListener('beforeunload', beforeUnload); void save(); };
  }, [save]);
  useEffect(() => {
    let live = true; streamComplete.current=false;pendingResume.current=null;setLoading(true); setError(''); setResource(null); setElapsed(0); setPlaying(false);
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000);
    void (async()=>{await call(()=>window.desktop.videoQuality(quality));if(!live)return;return call(() => window.desktop.playback(episode.id, attempt > 0,quality))})().then(value => { if (live&&value) setResource(value); }).catch(error => { if (live) setError(errorMessage(error)); }).finally(() => { if (live) setLoading(false); window.clearInterval(timer); });
    return () => { live = false; window.clearInterval(timer); };
  }, [episode.id, attempt,quality]);
  useEffect(()=>{
    if(!resource?.progressive)return;
    let live=true,busy=false;
    const isCurrent=()=>live&&pendingResume.current!==null&&resourceRef.current===resource;
    const poll=async()=>{
      if(busy||!isCurrent())return;busy=true;
      try{
        const complete=await completedResumeResource({episodeId:episode.id,url:resource.url,isCurrent,
          getState:()=>call(()=>window.desktop.bufferState()),getPlayback:()=>call(()=>window.desktop.playback(episode.id,false,quality))});
        if(complete&&isCurrent()){
          desiredTime.current=pendingResume.current!;streamComplete.current=true;setResource(complete);
        }
      }catch{/* A failed completion probe leaves the visible manual start option available. */}
      finally{busy=false}
    };
    const timer=window.setInterval(()=>void poll(),1000);void poll();
    return()=>{live=false;window.clearInterval(timer)};
  },[resource,episode.id,quality]);
  useEffect(()=>{if(resource&&!resource.progressive&&pendingResume.current!==null)video.current?.load()},[resource]);
  const trackStyle = (value: number, max: number): CSSProperties => ({ '--range-progress': `${max > 0 ? Math.min(100, value / max * 100) : 0}%` } as CSSProperties);
  function captureProgress() {
    const element = video.current; if (!element || !progress.current.ready) return;
    const total=playbackDuration(resource,element.duration,progress.current.duration,streamComplete.current);
    const current=visiblePlaybackTime(element.currentTime,pendingResume.current);
    progress.current = { ready: true, time: current, duration: total };
    setTime(current); setDuration(total);
  }
  function retry() { captureProgress(); void save(); desiredTime.current = progress.current.ready ? progress.current.time : desiredTime.current; setAttempt(value => value + 1); }
  function startFromBeginning(){
    const element=video.current;if(!element)return;
    session.onManualPlay();onManualStart();desiredTime.current=0;pendingResume.current=null;playAfterSeek.current=true;
    progress.current={ready:true,time:0,duration:playbackDuration(resource,element.duration,episode.duration||0,streamComplete.current)};
    element.currentTime=0;setTime(0);setWaiting(false);void element.play().catch(()=>notify('请点击播放继续'));
  }
  async function togglePlay() {
    const element = video.current; if (!element || loading || error) return;
    if(pendingResume.current!==null){
      const next=playAfterSeek.current===false;playAfterSeek.current=next;setPlaying(next);
      if(next){session.onManualPlay();onManualStart()}else element.pause();
      return;
    }
    if (element.paused) { playAfterSeek.current=true;session.onManualPlay();onManualStart();try { await element.play(); } catch { notify('点击播放，继续观看。'); } } else {playAfterSeek.current=false;element.pause()}
  }
  function isBuffered(element:HTMLVideoElement,value:number){for(let index=0;index<element.buffered.length;index++)if(value>=element.buffered.start(index)&&value<=element.buffered.end(index))return true;return false}
  function restoreBuffered(){const element=video.current,target=pendingResume.current;if(!element)return;let through=0;for(let index=0;index<element.buffered.length;index++){if(element.buffered.start(index)>through+.2)break;through=element.buffered.end(index)}if(resource&&through>=resource.duration-.2&&resource.duration>0)streamComplete.current=true;if(target===null||!isBuffered(element,target))return;pendingResume.current=null;element.currentTime=target;progress.current.time=target;progress.current.ready=true;setTime(target);setWaiting(false);if(playAfterSeek.current!==false&&sessionRef.current.canContinue()&&!endOverlay)void element.play().catch(()=>setPlaying(false))}
  function seek(value:number){
    const target=seekPosition(value,duration);if(target===undefined)return;
    const element=video.current;
    const continuePlaying=pendingResume.current!==null?playAfterSeek.current!==false:element?!element.paused:true;
    explicitSeek.current=true;desiredTime.current=target;playAfterSeek.current=continuePlaying;
    progress.current={ready:true,time:target,duration};setTime(target);
    if(!element||!resource||(resource.progressive&&!streamComplete.current&&!isBuffered(element,target))){
      pendingResume.current=target;setWaiting(true);setPlaying(continuePlaying);element?.pause();return;
    }
    pendingResume.current=null;element.currentTime=target;setWaiting(false);
    if(continuePlaying&&sessionRef.current.canContinue()&&!endOverlay)void element.play().catch(()=>setPlaying(false));
  }
  function move(action?: () => void) { captureProgress(); void save();if(action)session.onManualPlay();action?.(); }
  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => notify('暂时无法退出全屏。'));
    else void container.current?.closest('.player-surface')?.requestFullscreen().catch(() => notify('暂时无法进入全屏。'));
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).matches('input, select, button')) return;
    if (event.key === ' ' || event.key.toLowerCase() === 'k') { event.preventDefault(); void togglePlay(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); seek(Math.max(0, time - 5)); }
    if (event.key === 'ArrowRight') { event.preventDefault(); seek(Math.min(duration, time + 5)); }
    if (event.key.toLowerCase() === 'f') toggleFullscreen();
    if (event.key.toLowerCase() === 'm') setMuted(value => !value);
  }
  useEffect(() => { if (video.current) { video.current.volume = volume; video.current.muted = muted; video.current.playbackRate = rate; } }, [volume, muted, rate, resource]);
  return <div className="player" ref={container} tabIndex={0} onKeyDown={keyboard} aria-label={`第${episode.order}集播放器`}>
    <div className="video-stage" ref={stageRef}>
      {resource && !error && <video ref={videoRef} src={resource.url} playsInline preload="auto" onClick={() => void togglePlay()} onDoubleClick={toggleFullscreen}
        onLoadedMetadata={() => {
          const element = video.current!; const total=playbackDuration(resource,element.duration,resource.duration,streamComplete.current);
          const restored = explicitSeek.current?(seekPosition(desiredTime.current,total)??0):resumeTime(desiredTime.current, total);const defer=!!resource.progressive&&restored>0&&!isBuffered(element,restored);pendingResume.current=defer?restored:null;if(!defer)element.currentTime = restored; element.volume = volume; element.muted = muted; element.playbackRate = rate;
          progress.current = { ready: true, time: restored, duration: total }; setDuration(total); setTime(restored); setWaiting(defer);if(defer)setPlaying(playAfterSeek.current!==false);
          if(!defer&&playAfterSeek.current!==false&&!endOverlay&&sessionRef.current.canContinue())void element.play().catch(() => setPlaying(false));
        }}
        onProgress={restoreBuffered} onTimeUpdate={captureProgress} onPlay={() => {if(!sessionRef.current.canContinue()){video.current?.pause();return}setPlaying(true)}} onPause={() => { setPlaying(pendingResume.current!==null&&playAfterSeek.current!==false); captureProgress(); void save(); }} onWaiting={() => setWaiting(true)} onCanPlay={() => {restoreBuffered();if(pendingResume.current===null)setWaiting(false)}} onPlaying={() => {if(pendingResume.current!==null)video.current?.pause();else setWaiting(false)}}
        onError={() => { captureProgress(); void save(); if (!automaticRetry.current) { automaticRetry.current = true; retry(); return; } setError('这一集暂时无法播放，请重新获取资源后再试。'); setPlaying(false); }}
        onEnded={() => {if(pendingResume.current!==null)return;captureProgress(); void save(); setPlaying(false); onEnded(); }} />}
      {loading ? <div className="player-overlay"><span className="spinner" /><strong>{elapsed >= 5 ? '正在准备播放资源…' : '正在获取这一集…'}</strong><p>{elapsed >= 5 ? '正在解析并缓冲视频，准备好后开始播放。' : `第${episode.order}集即将开始`}</p></div> : error ? <div className="player-overlay player-error" role="alert"><div className="state-icon"><Icon name="film" size={30} /></div><strong>播放遇到了一点问题</strong><p>{error}</p><button className="primary-button" onClick={retry}><Icon name="refresh" size={17} />重试当前集</button></div> : waiting ? <div className="buffering"><span className="spinner" /><span>{pendingResume.current!==null?`正在准备 ${formatTime(pendingResume.current)}，就绪后自动跳转…`:'正在缓冲…'}</span>{pendingResume.current!==null&&<button className="secondary-button" onClick={startFromBeginning}>从头播放</button>}</div> : !playing && resource && !endOverlay && <button className="big-play" onClick={() => void togglePlay()} aria-label="播放"><Icon name="play" size={33} /></button>}
      {endOverlay}
    </div>
    <div className="player-controls"><input className="seek-range" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(time, duration || 1)} style={trackStyle(time, duration)} disabled={duration<=0 || !!error} onChange={event => seek(Number(event.target.value))} onPointerUp={() => void save()} onKeyUp={() => void save()} aria-label="播放进度" aria-valuetext={`${formatTime(time)} / ${formatTime(duration)}`} />
      <div className="fullscreen-cache">{buffer?`整剧缓存 ${buffer.ready}/${buffer.total} 集 · ${buffer.total?Math.floor(buffer.ready/buffer.total*100):0}%`:'正在读取缓存状态…'}<span>{cacheProgressText(buffer,series.episodes,bufferError)}</span></div>
      <div className="fullscreen-sleep"><SleepControl session={session}/></div>
      {pipError&&<p className="player-inline-error" role="alert">{pipError}</p>}
      <div className="control-row"><button className="control-button" onClick={() => void togglePlay()} disabled={!resource || !!error} aria-label={playing ? '暂停' : '播放'} title={playing ? '暂停（空格）' : '播放（空格）'}><Icon name={playing ? 'pause' : 'play'} size={19} /></button><button className="control-button" disabled={!onPrevious} onClick={() => move(onPrevious)} aria-label="上一集" title="上一集"><Icon name="previous" size={18} /></button><button className="control-button" disabled={!onNext} onClick={() => move(onNext)} aria-label="下一集" title="下一集"><Icon name="next" size={18} /></button><span className="time-label">{formatTime(time)}<i>/</i>{formatTime(duration)}</span><span className="controls-spacer" /><select className="quality-select" aria-label="画质上限" title="优先选不超过上限的最高档；没有更低档位时使用来源最低档" value={quality} disabled={qualityBusy||loading} onChange={event=>void changeQuality(event.target.value as VideoQuality)}><option value="auto">自动 · 最高画质</option>{qualityChoices(resource?.availableQualities).map(value=><option key={value} value={value}>{value}</option>)}{quality!=='auto'&&!qualityChoices(resource?.availableQualities).includes(quality)&&<option value={quality}>{quality} 上限 · 自动回退</option>}</select><span className="definition-label" title={[resource?.codec,resource?.size?`${(resource.size/1024/1024).toFixed(1)} MB`:'',resource?.progressive?'边缓存边播':''].filter(Boolean).join(' · ')}>{resource?.definition||''}</span><div className="volume-controls"><button className="control-button" onClick={() => setMuted(value => !value)} aria-label={muted || !volume ? '取消静音' : '静音'} title="静音（M）"><Icon name={muted || !volume ? 'muted' : 'volume'} size={18} /></button><input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} style={trackStyle(muted ? 0 : volume, 1)} onChange={event => { setVolume(Number(event.target.value)); }} aria-label="音量" /></div><select className="speed-select" value={rate} onChange={event => onRateChange(Number(event.target.value))} aria-label="播放倍速" title="播放倍速">{PLAYBACK_RATES.map(value => <option key={value} value={value}>{value === 1 ? '倍速 1×' : `${value}×`}</option>)}</select><button className="control-button pip-button" onClick={()=>void togglePip()} disabled={!pipSupported||!resource||loading} aria-label={pip?'退出画中画':'画中画'} title={pipSupported?'画中画':'当前环境不支持画中画'}>▣</button><button className="control-button" onClick={toggleFullscreen} aria-label="切换全屏" title="全屏（F）"><Icon name="fullscreen" size={18} /></button></div>
    </div>
  </div>;
}
