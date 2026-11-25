import {spawn,execFile,type ChildProcess} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {safeJson} from './json';
import {AppError} from './errors';

export class SdkPlayback {
 private stopped=false;
 private workers=new Set<{cancel:()=>Promise<void>;closed:Promise<void>}>();
 constructor(private executable:string,private cacheDirectory:string,private prefixArgs:string[]=[],private timeoutMs=90000){}

 async resolve(episodeId:string,signal?:AbortSignal):Promise<any>{
  if(!/^[1-9]\d{7,23}$/.test(episodeId))throw new AppError('INVALID_EPISODE','分集编号无效');
  if(this.stopped||signal?.aborted)throw new AppError('CANCELLED','内容服务已停止');
  await mkdir(this.cacheDirectory,{recursive:true});
  if(this.stopped||signal?.aborted)throw new AppError('CANCELLED','内容服务已停止');
  return new Promise((resolve,reject)=>{
   const child=spawn(this.executable,[...this.prefixArgs,'--videos',episodeId,'--cache',this.cacheDirectory],{windowsHide:true,stdio:['ignore','pipe','ignore']});
   let output=Buffer.alloc(0),failure:AppError|undefined,terminating:Promise<void>|undefined;
   const closed=new Promise<void>(done=>child.once('close',()=>done()));
   const stop=(error:AppError)=>{failure??=error;return terminating??=this.stopTree(child).catch(()=>{failure=new AppError('SDK_SHUTDOWN','播放组件未能停止，请彻底退出应用后重试')})};
   const worker={closed,cancel:()=>stop(new AppError('CANCELLED','内容服务已停止'))};this.workers.add(worker);
   const abort=()=>{void worker.cancel()};signal?.addEventListener('abort',abort,{once:true});
   const timer=setTimeout(()=>{void stop(new AppError('SDK_TIMEOUT','播放资源准备超时，请重试当前集'))},this.timeoutMs);
   child.stdout.on('data',(chunk:Buffer)=>{
    if(failure)return;
    if(output.length+chunk.length>512*1024){void stop(new AppError('SDK_OUTPUT','播放资源响应过大'));return}
    output=Buffer.concat([output,chunk]);
   });
   child.once('error',()=>{failure??=new AppError('SDK_START','播放组件无法启动')});
   child.once('close',async code=>{
    clearTimeout(timer);signal?.removeEventListener('abort',abort);await terminating;this.workers.delete(worker);
    if(failure){reject(failure);return}
    if(code!==0){reject(new AppError('SDK_FAILED','播放资源暂不可用'));return}
    try{
     const reply=safeJson(output.toString('utf8'));
     const model=reply?.ok===true&&Object.hasOwn(reply.models??{},episodeId)?reply.models[episodeId]:null;
     if(!model||typeof model!=='object'||Array.isArray(model))throw Error();
     resolve({code:0,data:{video_model:model}});
    }catch{reject(new AppError('SDK_MODEL','来源未返回所选分集的播放资源'))}
   });
  });
 }

 async shutdown(){
  this.stopped=true;
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{await Promise.race([
   Promise.all([...this.workers].map(async worker=>{await worker.cancel();await worker.closed})),
   new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new AppError('SDK_SHUTDOWN','播放组件未能停止，请彻底退出应用后重试')),10000)}),
  ])}finally{clearTimeout(timer)}
 }

 private async stopTree(child:ChildProcess){
  if(child.exitCode!==null||!child.pid)return;
  // The one-file Python helper owns a second process; killing only its launcher leaves SDK work running during updates.
  if(process.platform==='win32')await new Promise<void>((resolve,reject)=>{
   execFile('taskkill.exe',['/pid',String(child.pid),'/t','/f'],{windowsHide:true},error=>{
    if(error&&child.exitCode===null)reject(error);else resolve();
   });
  });
  else child.kill();
 }
}
