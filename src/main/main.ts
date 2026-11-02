import {SearchBrowser} from './search-browser';
import {app,BrowserWindow,ipcMain,protocol,dialog,shell,Tray,Menu,nativeImage} from 'electron';import path from 'node:path';import {LibraryStore} from './library';import {MediaCache} from './media';import {CacheManager} from './cache-manager';import {Signer,Transport} from './transport';import {ContentProvider,ProviderError} from './provider';import {AppError} from './errors';import type {Result,Work,Progress,Board} from '../shared/types';
import {trayIcon} from './tray-icon';
import {RecommendationService} from './recommendations';
import {Diagnostics} from './diagnostics';import {writeFile} from 'node:fs/promises';import type {VideoQuality} from '../shared/types';
import {autoUpdater} from 'electron-updater';import {UpdateService} from './updater';
protocol.registerSchemesAsPrivileged([{scheme:'manju-media',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,corsEnabled:true}}]);
app.setName('红果漫剧桌面版');if(process.env.HONGGUO_TEST_DATA)app.setPath('userData',process.env.HONGGUO_TEST_DATA);
if(!app.requestSingleInstanceLock()){app.quit()}else{
 let window:BrowserWindow|null=null;let signer:Signer,media:MediaCache,library:LibraryStore,updates:UpdateService,cache:CacheManager;let quitting=false;let installing=false;let exiting=false;let tray:Tray|null=null;const diagnostics=new Diagnostics();const searchBrowser=new SearchBrowser();
 async function result<T>(fn:()=>Promise<T>|T):Promise<Result<T>>{try{return {ok:true,data:await fn()}}catch(error){if(error instanceof AppError||error instanceof ProviderError)return {ok:false,error:{code:String((error as any).code),message:String((error as any).message)}};return {ok:false,error:{code:'UNAVAILABLE',message:'操作暂未完成，请重试'}}}}
 function handle(channel:string,fn:(...args:any[])=>unknown){ipcMain.handle(channel,async(event,...args)=>{if(!window||event.sender!==window.webContents)return {ok:false,error:{code:'IPC_DENIED',message:'请求无效'}};const response=await result(()=>fn(...args));if(!response.ok)diagnostics.record({stage:'ipc',code:response.error?.code});return response})}
 function createWindow(){
  window=new BrowserWindow({width:1400,height:920,minWidth:1040,minHeight:720,title:'红果漫剧桌面版',backgroundColor:'#f4f0e8',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',(event,url)=>{if(url!==window?.webContents.getURL())event.preventDefault()});
  window.loadFile(path.join(__dirname,'../renderer/index.html'));window.on('show',()=>window?.webContents.send('window-background',false));window.on('close',event=>{if(!exiting&&tray&&cache?.closeToTray){event.preventDefault();window?.webContents.send('window-background',true);window?.hide()}});window.on('closed',()=>{window=null});
 }
 app.whenReady().then(async()=>{
  const runtime=app.isPackaged?path.join(process.resourcesPath,'runtime-bundle'):path.join(app.getAppPath(),'runtime-bundle');signer=new Signer(runtime,path.join(app.getPath('userData'),'runtime-work'));const provider=new ContentProvider(new Transport(signer,app.getPath('userData')),{searchPage:url=>searchBrowser.read(url)}),recommendations=new RecommendationService(provider);library=new LibraryStore(app.getPath('userData'));await library.init();media=new MediaCache(await CacheManager.directory(app.getPath('userData')),path.join(runtime,'ffmpeg.exe'),(id,quality)=>provider.getResource(id,quality),{concurrency:4,diagnostics});await media.init();cache=new CacheManager(app.getPath('userData'),media,()=>library.snapshot().history);await cache.init();
  protocol.handle('manju-media',request=>media.response(request.url,request.headers.get('range')));
  handle('buffer-episodes',(ids:string[])=>media.setBufferWindow(ids));
  handle('buffer-state',()=>media.bufferState());handle('buffer-retry',()=>media.retryBuffer());
  handle('cache-state',()=>cache.snapshot());handle('cache-add',async(id:string)=>cache.add(await provider.getSeries(id)));handle('cache-action',async(id:string,action:any)=>{
   if(action==='delete'){
    if(!window)throw new AppError('CACHE_WINDOW','请先打开主窗口');const snapshot=await cache.snapshot(),task=snapshot.tasks.find(task=>task.series.id===id);if(!task)throw new AppError('CACHE_TASK','缓存任务不存在');
    const answer=await dialog.showMessageBox(window,{type:'warning',title:'删除作品缓存',message:`删除《${task.series.title}》的缓存？`,detail:`将停止此任务并删除本地视频缓存（约 ${((task.state.cachedBytes||0)/1048576).toFixed(1)} MiB），保留收藏和观看记录。再次观看需要重新缓存。`,buttons:['取消','删除缓存'],defaultId:0,cancelId:0});if(answer.response!==1)return cache.snapshot();
   }return cache.action(id,action);
  });
  handle('cache-concurrency',(value:number)=>cache.setConcurrency(value));
  handle('cache-limits',value=>cache.setLimits(value));handle('cache-priority',(id,priority)=>cache.setPriority(id,priority));
  handle('video-quality',(quality:VideoQuality)=>{media.setQuality(quality);return true});
  handle('diagnostics-export',async()=>{if(!window)throw new AppError('DIAGNOSTICS_WINDOW','请先打开主窗口');const selection=await dialog.showSaveDialog(window,{title:'导出脱敏诊断',defaultPath:'Hongguo-Manju-diagnostics.json',filters:[{name:'JSON 诊断文件',extensions:['json']}]});if(selection.canceled||!selection.filePath)return {saved:false};try{await writeFile(selection.filePath,JSON.stringify(diagnostics.snapshot(app.getVersion()),null,2));return {saved:true}}catch{throw new AppError('DIAGNOSTICS_WRITE','诊断文件无法保存，请选择其他位置')}});
  handle('cache-delete-watched',async()=>{
   if(!window)throw new AppError('CACHE_WINDOW','请先打开主窗口');const snapshot=await cache.snapshot(),tasks=snapshot.tasks.filter(task=>task.watched);if(!tasks.length)return snapshot;
   const bytes=tasks.reduce((sum,task)=>sum+(task.state.cachedBytes||0),0),answer=await dialog.showMessageBox(window,{type:'warning',title:'清理已看完作品',message:`清理 ${tasks.length} 部已看完作品的缓存？`,detail:`预计释放 ${(bytes/1048576).toFixed(1)} MiB。按末集观看达到 95% 判定，不代表逐集观看核验。只删除这些作品的缓存和任务，保留收藏、历史及其他作品。`,buttons:['取消','清理缓存'],defaultId:0,cancelId:0});return answer.response===1?cache.deleteWatched(tasks.map(task=>task.series.id)):cache.snapshot();
  });
  handle('cache-directory',async()=>{if(!window)throw new AppError('CACHE_WINDOW','请先打开主窗口');const selection=await dialog.showOpenDialog(window,{title:'选择缓存存储位置（将建立专用 HongguoManjuCache 文件夹）',properties:['openDirectory','createDirectory']});if(selection.canceled||!selection.filePaths[0])return cache.snapshot();return cache.migrate(path.join(selection.filePaths[0],'HongguoManjuCache'))});
  handle('cache-open-directory',async()=>{const error=await shell.openPath(media.location);if(error)throw new AppError('CACHE_PATH','无法打开缓存文件夹');return true});handle('cache-close-to-tray',(enabled:boolean)=>cache.setCloseToTray(enabled));
  handle('catalog',(board:Board,offset=0)=>provider.catalog(board,offset));handle('search',(query:string,offset=0)=>provider.search(query,offset));handle('series',async(id:string)=>{const series=await provider.getSeries(id);await cache.remember(series);return series});
  handle('recommendations',(id:string,refresh=false)=>recommendations.get(id,refresh));
  handle('share',async(text:string)=>{const series=await provider.resolveShare(text);await library.favorite(series,true);return series});handle('playback',(id:string,force=false,quality?:VideoQuality)=>{if(quality!==undefined)media.setQuality(quality);return media.prepare(id,force)});handle('library',()=>library.snapshot());handle('favorite',(work:Work,enabled:boolean)=>library.favorite(work,enabled));handle('progress',(progress:Omit<Progress,'updatedAt'>)=>library.progress(progress));
  updates=new UpdateService(autoUpdater,app.getVersion(),app.isPackaged&&process.platform==='win32',state=>{if(window&&!window.isDestroyed())window.webContents.send('update-status',state);if(state.status==='error'&&installing&&quitting){dialog.showErrorBox('更新未完成',state.message);app.quit();}},()=>{installing=true;app.quit();});
  handle('update',()=>updates.check());handle('update-state',()=>updates.snapshot());handle('update-download',()=>updates.download());handle('update-install',()=>updates.requestInstall());createWindow();
  try{tray=new Tray(nativeImage.createFromDataURL(trayIcon));tray.setToolTip('红果漫剧 · 后台缓存');const show=()=>{if(!window)createWindow();window?.show();window?.focus()};tray.on('click',show);tray.on('double-click',show);tray.setContextMenu(Menu.buildFromTemplate([{label:'打开红果漫剧',click:show},{label:'退出软件（停止后台缓存）',click:()=>{exiting=true;app.quit()}}]))}catch{tray=null}
  if(app.isPackaged){setTimeout(()=>void updates.check(),2000).unref();setInterval(()=>void updates.check(),4*60*60*1000).unref();}
 }).catch(()=>{dialog.showErrorBox('红果漫剧启动失败','应用数据或运行组件无法读取，请检查安装是否完整，以及应用数据目录是否可写。');app.quit()});
 app.on('second-instance',()=>{window?.show();window?.focus()});app.on('window-all-closed',()=>app.quit());
 app.on('before-quit',event=>{if(quitting)return;event.preventDefault();exiting=true;searchBrowser.close();if(window&&!window.isDestroyed()){window.close();return}quitting=true;Promise.allSettled([signer?.shutdown(),media?.close(),library?.flush(),cache?.flush()]).then(results=>{tray?.destroy();if(installing&&results.some(result=>result.status==='rejected')){dialog.showErrorBox('暂未安装更新','后台组件未能退出或观看记录未能保存，已停止安装。缓存会保留，请彻底退出软件后重新安装。');app.quit();}else if(installing){updates.installAfterShutdown();}else app.quit();})});
}
