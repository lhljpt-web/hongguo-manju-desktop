import {BrowserWindow,session} from 'electron';
import {AppError} from './errors';

const ORIGIN='https://hongguoduanju.com';

// The site now initializes its browser search environment before requesting results.
// Observe the site's own response rather than reproducing verification tokens.
export class SearchBrowser {
 private pending:Promise<unknown>=Promise.resolve();
 private active?:BrowserWindow;
 private stopped=false;

 read(url:URL):Promise<string>{
  const operation=this.pending.then(()=>this.load(url));
  this.pending=operation.catch(()=>{});
  return operation;
 }

 close(){this.stopped=true;this.active?.destroy()}

 private load(url:URL):Promise<string>{
  if(this.stopped)return Promise.reject(new AppError('CANCELLED','搜索已停止'));
  const page=new URL('/search/'+encodeURIComponent(url.searchParams.get('query')!),ORIGIN);
  if(url.searchParams.has('page'))page.searchParams.set('page',url.searchParams.get('page')!);
  const browserSession=session.fromPartition('persist:official-search');
  browserSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  const window=new BrowserWindow({show:false,webPreferences:{session:browserSession,sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  this.active=window;
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,address)=>{if(new URL(address).origin!==ORIGIN)event.preventDefault()});
  return new Promise((resolve,reject)=>{
   const network=window.webContents.debugger;
   let requestId:string|undefined,settled=false;
   const finish=(error?:Error,value?:string)=>{
    if(settled)return;settled=true;clearTimeout(timer);
    network.removeListener('message',message);
    if(this.active===window)this.active=undefined;
    if(!window.isDestroyed())window.destroy();
    if(error)reject(error);else resolve(value!);
   };
   const message=(_event:unknown,method:string,params:any)=>{
    if(method==='Network.responseReceived'){
     const responseUrl=new URL(params.response.url);
     if(responseUrl.origin!==ORIGIN||responseUrl.pathname!==url.pathname||responseUrl.searchParams.get('query')!==url.searchParams.get('query')||(responseUrl.searchParams.get('page')||'1')!==(url.searchParams.get('page')||'1'))return;
     if(params.response.status!==200){finish(new AppError('SEARCH_UNAVAILABLE',params.response.status===403?'官网搜索暂时拒绝请求或需要人工验证，请稍后重试。':`官网搜索暂不可用（HTTP ${params.response.status}）`));return}
     requestId=params.requestId;
    }
    if(method==='Network.loadingFinished'&&requestId&&params.requestId===requestId){
     void network.sendCommand('Network.getResponseBody',{requestId}).then(result=>{
      const text=result.base64Encoded?Buffer.from(result.body,'base64').toString('utf8'):result.body;
      if(text.length>8*1024*1024)throw new AppError('PAGE_TOO_LARGE','搜索返回内容过大');
      finish(undefined,text);
     }).catch(()=>finish(new AppError('SEARCH_RESPONSE','搜索结果读取失败，请重试')));
    }
   };
   const timer=setTimeout(()=>finish(new AppError('SEARCH_TIMEOUT','官网搜索准备超时，请检查网络后重试')),30000);
   window.once('closed',()=>finish(new AppError('CANCELLED','搜索已停止')));
   try{
    network.attach('1.3');network.on('message',message);
    void window.loadURL('about:blank').then(()=>network.sendCommand('Network.enable')).then(()=>window.loadURL(page.href)).catch(()=>finish(new AppError('SEARCH_NETWORK','官网搜索页面加载失败，请检查网络后重试')));
   }catch{finish(new AppError('SEARCH_BROWSER','搜索环境无法启动，请重试'))}
  });
 }
}
