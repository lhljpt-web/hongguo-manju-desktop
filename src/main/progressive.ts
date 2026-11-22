import {encodingRateArgs} from './encoding-budget';
import {open,stat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {AppError} from './errors';

// undefined means more prefix bytes are needed; only a front, complete moov is accepted.
export function streamableMp4(bytes:Buffer):boolean|undefined{
 let offset=0;
 while(offset+8<=bytes.length){
  let size=bytes.readUInt32BE(offset);const kind=bytes.toString('ascii',offset+4,offset+8);
  if(size===1){if(offset+16>bytes.length)return;const large=bytes.readBigUInt64BE(offset+8);if(large>BigInt(Number.MAX_SAFE_INTEGER))return false;size=Number(large)}
  if(size<8||size>2*1024*1024)return false;
  if(kind==='mdat')return false;
  if(offset+size>bytes.length)return;
  if(kind==='moov')return true;
  offset+=size;
 }
}
const delay=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
export class GrowingMedia{
 private done=false;private error=false;
 constructor(public file:string){}
 complete(file:string){this.file=file;this.done=true}
 fail(){this.error=true;this.done=true}
 response():Response{
  let offset=0,cancelled=false;
  const body=new ReadableStream<Uint8Array>({
   pull:async controller=>{
    while(!cancelled){
     if(this.error){controller.error(new Error('视频流准备中断，请重试'));return}
     let handle;try{handle=await open(this.file,'r');const info=await handle.stat();if(info.size>offset){const bytes=Buffer.alloc(Math.min(64*1024,info.size-offset));const part=await handle.read(bytes,0,bytes.length,offset);if(part.bytesRead){offset+=part.bytesRead;controller.enqueue(bytes.subarray(0,part.bytesRead));return}}}catch(error:any){if(error.code!=='ENOENT'){controller.error(new Error('本地视频流读取失败'));return}}finally{await handle?.close()}
     if(this.done){controller.close();return}await delay(50);
    }
   },cancel:()=>{cancelled=true},
  });
  return new Response(body,{headers:{'content-type':'video/mp4','accept-ranges':'none','cache-control':'no-store'}});
 }
}

/** One non-seekable front-indexed input -> fragmented H.264/AAC MP4. */
export class ProgressiveEncoder{
 readonly ready:Promise<void>;readonly finished:Promise<void>;
 private child:ReturnType<typeof spawn>;private stopped=false;private readyDone=false;
 private readyResolve!:()=>void;private readyReject!:(error:unknown)=>void;
 constructor(ffmpeg:string,private output:string,key:Buffer|null,duration:number,codec:string,signal:AbortSignal,report:(percent:number)=>void){
  this.ready=new Promise((resolve,reject)=>{this.readyResolve=resolve;this.readyReject=reject});void this.ready.catch(()=>{});
  const args=['-hide_banner','-loglevel','error','-nostats','-progress','pipe:1',...(key?['-decryption_key',key.toString('hex')]:[]),'-i','pipe:0',...(['h264','avc1'].includes(codec)?['-c:v','copy']:['-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-preset','veryfast','-threads','2','-crf','20',...encodingRateArgs(duration,150*1024*1024)]),'-c:a','aac','-movflags','+empty_moov+default_base_moof','-frag_duration','500000','-flush_packets','1','-y',output];
  this.child=spawn(ffmpeg,args,{windowsHide:true,stdio:['pipe','pipe','pipe']});let progress='',actual=0,polling=false;
  const child=this.child,abort=()=>child.kill();signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
  const inspect=async()=>{if(polling||this.stopped)return;polling=true;try{const info=await stat(output);if(info.size>150*1024*1024){child.kill();return}if(!this.readyDone&&info.size>1024){const h=await open(output,'r');try{const buffer=Buffer.alloc(Math.min(info.size,256*1024));await h.read(buffer,0,buffer.length,0);if(buffer.includes(Buffer.from('moof'))&&buffer.includes(Buffer.from('mdat'))){this.readyDone=true;this.readyResolve()}}finally{await h.close()}}}catch{}finally{polling=false}};
  const poll=setInterval(()=>void inspect(),100),timeout=setTimeout(()=>child.kill(),180000);
  this.finished=new Promise((resolve,reject)=>{
   const finish=(success:boolean)=>{if(this.stopped)return;this.stopped=true;clearInterval(poll);clearTimeout(timeout);signal.removeEventListener('abort',abort);const error=new AppError(signal.aborted?'CANCELLED':'MEDIA_DECODE',signal.aborted?'播放准备已取消':'渐进视频处理未完成，将使用完整准备');if(!this.readyDone)this.readyReject(error);success?resolve():reject(error)};
   child.stdout?.on('data',data=>{progress+=data;if(progress.length>50000)progress=progress.slice(-25000);const time=Number([...progress.matchAll(/^out_time_us=(\d+)\r?\n/gm)].at(-1)?.[1])/1e6;if(Number.isFinite(time)){actual=time;report(Math.min(99,Math.floor(time/duration*100)))}void inspect()});
   child.stderr?.resume();child.stdin?.on('error',()=>{});
   child.once('error',()=>finish(false));child.once('close',code=>finish(!signal.aborted&&code===0&&Math.abs(actual-duration)<1));
  });void this.finished.catch(()=>{});
 }
 async write(bytes:Uint8Array){if(this.stopped||!this.child.stdin)throw new AppError('MEDIA_DECODE','渐进输入无法继续');await new Promise<void>((resolve,reject)=>{this.child.stdin!.write(bytes,error=>error?reject(new AppError('MEDIA_DECODE','渐进输入无法继续')):resolve())})}
 end(){this.child.stdin?.end();return this.finished}
 stop(){this.child.kill()}
}
