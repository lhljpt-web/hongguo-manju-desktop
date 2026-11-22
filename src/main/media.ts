import {encodingRateArgs} from './encoding-budget';
import {randomUUID,createHash} from 'node:crypto';import {spawn} from 'node:child_process';import {mkdir,writeFile,readFile,stat,statfs,unlink,rename,readdir,open,copyFile} from 'node:fs/promises';import {createReadStream,constants} from 'node:fs';import {Readable} from 'node:stream';import path from 'node:path';
import type {Resource,Playback,BufferState,CacheActivity,VideoQuality,CachePriority} from '../shared/types';import {AppError} from './errors';import {validId} from './library';
import {downloadMedia} from './resumable-download';import {GrowingMedia,ProgressiveEncoder,streamableMp4} from './progressive';import {TransferLimiter} from './transfer-limits';import {Diagnostics} from './diagnostics';

export function parseRange(header:string|null,size:number):{start:number;end:number;status:number}|null{
 if(!Number.isSafeInteger(size)||size<=0)return null;if(!header)return {start:0,end:size-1,status:200};
 const m=/^bytes=(\d*)-(\d*)$/.exec(header);if(!m||(!m[1]&&!m[2]))return null;
 const start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));const end=m[1]?(m[2]?Math.min(size-1,Number(m[2])):size-1):size-1;
 return Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&start<size&&end>=start?{start,end,status:206}:null;
}

// 已观察到的 v1 包装格式：每个字节与同奇偶位的前字节异或，再减位置相关偏移。
// 这里独立实现格式解析，不包含上游 Python 实现或其样本密钥。
export function decodeContentKey(encoded:string):Buffer{
 if(typeof encoded!=='string'||encoded.length>4096||!encoded.length||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw new AppError('UNSUPPORTED_RESOURCE','视频密钥格式暂不支持');
 const packet=Buffer.from(encoded,'base64');if(packet.length<5)throw new AppError('UNSUPPORTED_RESOURCE','视频密钥格式暂不支持');
 const tagLength=(packet[0]^packet[1]^packet[2])-48;const count=packet.length-tagLength-1;
 if(tagLength<1||tagLength>packet.length-3||count<3)throw new AppError('UNSUPPORTED_RESOURCE','视频密钥格式暂不支持');
 const salt=packet[packet.length-tagLength-2]^packet[packet.length-tagLength-1];const tag=Buffer.from(packet.subarray(packet.length-tagLength).map(b=>b^salt)).toString('ascii');
 if(tag==='app_v2'||tag==='web_v2')throw new AppError('UNSUPPORTED_RESOURCE','此作品的加密格式暂不支持');
 const original=packet.subarray(1,count+1),decoded=Buffer.alloc(count);
 for(let i=0;i<count;i++){let bits=0,n=i;while(n){bits+=n&1;n>>>=1}decoded[i]=((original[i]^(i<2?[250,85][i]:original[i-2]))-21-bits)&255}
 const prefix=String.fromCharCode(decoded[0]);if(!/^[0-9a-f]$/.test(prefix))throw new AppError('UNSUPPORTED_RESOURCE','视频密钥格式暂不支持');
 const key=decoded.subarray(1,count-Number.parseInt(prefix,16)).toString('ascii');if(!/^[0-9a-f]{32}$/.test(key))throw new AppError('UNSUPPORTED_RESOURCE','视频密钥格式暂不支持');return Buffer.from(key,'hex');
}
interface CacheEntry { key:string; file:string; episodeId:string; duration:number; definition:string; touched:number; policy:string; bytes?:number;quality?:VideoQuality;availableQualities?:string[];codec?:string;size?:number }
export interface BackgroundGroup {id:string;ids:string[];paused:boolean;priority?:CachePriority}
// Older caches used lower-resolution-first selection and stronger compression.
const CACHE_POLICY='highest-resolution-crf20-v1';
interface MediaJob {
 id:string; force:boolean; foreground:boolean; controller:AbortController;
 progress?:CacheActivity;
 promise:Promise<Playback>; resolve:(value:Playback)=>void; reject:(error:unknown)=>void;
 completion?:Promise<void>;ready?:boolean;everReady?:boolean;progressivePlayback?:Playback;quality:VideoQuality;capacityBytes?:number;capacityCommitted?:boolean;processingActive?:boolean;
}
const CACHE_LIMIT=1024*1024*1024;
const FILE_LIMIT=150*1024*1024;
const SPACE_RESERVE=1024*1024*1024;
const cancelled=()=>new AppError('CANCELLED','播放准备已取消');
function check(signal:AbortSignal){if(signal.aborted)throw cancelled()}
// Resource lookups may finish late; cancellation must prevent them starting a download.
function abortable<T>(task:Promise<T>,signal:AbortSignal):Promise<T>{
 return new Promise((resolve,reject)=>{
  const abort=()=>reject(cancelled());
  signal.addEventListener('abort',abort,{once:true});
  task.then(value=>{signal.removeEventListener('abort',abort);signal.aborted?reject(cancelled()):resolve(value)},error=>{signal.removeEventListener('abort',abort);reject(error)});
  if(signal.aborted)abort();
 });
}
export class MediaCache {
 private entries=new Map<string,CacheEntry>();
 private jobs=new Map<string,MediaJob>();
 private activeJobs=new Set<MediaJob>();
 private groups:BackgroundGroup[]=[];
 private groupCursor=0;
 private suspended=false;
 private window:string[]=[];
 private protectedIds=new Set<string>();
 private pausedMessage='';
 private failed=new Set<string>();
 private closing=false;
 private processing=0;
 private processingQueue:{signal:AbortSignal;grant:(release:()=>void)=>void;reject:()=>void}[]=[];
 private transfers=new Map<number,number>();
 private deletionMetadata=new Map<string,string>();
 private transferStarted=0;
 private quality:VideoQuality='auto';private maxBytes=0;private limiter=new TransferLimiter();private growing=new Map<string,GrowingMedia>();private partialBytes=new Map<string,number>();
 constructor(private directory:string,private ffmpeg:string,private getResource:(id:string,quality?:VideoQuality)=>Promise<Resource>,private options:{freeBytes?:()=>Promise<number>;concurrency?:number;diagnostics?:Diagnostics;progressive?:boolean}={}){}
 async init(){await mkdir(this.directory,{recursive:true});for(const name of await readdir(this.directory)){
  if(/^[a-f0-9]{32}\.json$/.test(name)){try{const e=JSON.parse(await readFile(path.join(this.directory,name),'utf8'));if(e.policy===CACHE_POLICY&&validId(e.episodeId)&&Number.isFinite(e.duration)&&e.duration>0&&typeof e.definition==='string'&&e.key===name.slice(0,32)){e.file=path.join(this.directory,e.key+'.mp4');const info=await stat(e.file);if(info.size>0&&info.size<=FILE_LIMIT){e.bytes=info.size;this.entries.set(e.episodeId,e)}}}catch{}}
  if(/^[a-f0-9]{32}\.(?:input|working)\.mp4$/.test(name))await unlink(path.join(this.directory,name)).catch(()=>{});
  if(/^[a-f0-9]{32}\.partial\.mp4$/.test(name)){const info=await stat(path.join(this.directory,name));if(info.size<=FILE_LIMIT&&Date.now()-info.mtimeMs<7*86400000)this.partialBytes.set(name,info.size);else{await unlink(path.join(this.directory,name)).catch(()=>{});await unlink(path.join(this.directory,name.replace('.mp4','.json'))).catch(()=>{})}}
 }
  const liveKeys=new Set([...this.entries.values()].map(e=>e.key));for(const name of await readdir(this.directory)){if(/^[a-f0-9]{32}\.(?:mp4|json)$/.test(name)&&!liveKeys.has(name.split('.')[0]))await unlink(path.join(this.directory,name)).catch(()=>{})}
  // Defer size/age eviction until a work is opened so a completed series survives restart.
 }
 setBufferWindow(ids:string[]):BufferState{
  if(!Array.isArray(ids)||ids.length>5000||ids.some(id=>!validId(id))||new Set(ids).size!==ids.length)throw new AppError('INVALID_INPUT','缓冲剧集列表无效');
  if(this.closing)return this.bufferState();
  const sameWork=ids.length===this.protectedIds.size&&ids.every(id=>this.protectedIds.has(id));
  if(ids.length){this.protectedIds=new Set(ids);if(!sameWork)this.pausedMessage=''}
  this.window=[...ids];this.failed=new Set([...this.failed].filter(id=>ids.includes(id)||this.groups.some(group=>group.ids.includes(id))));
  for(const job of this.jobs.values()){
   if(job.foreground&&job.id!==ids[0]){if(this.inBackground(job.id)&&this.activeJobs.has(job))job.foreground=false;else this.cancel(job)}
   else if(!ids.includes(job.id)&&!this.inBackground(job.id))this.cancel(job);
  }
  this.pump();
  return this.bufferState();
 }
 bufferState():BufferState{return this.stateFor(this.window)}
 stateFor(ids:string[]):BufferState{
  const total=ids.length,ready=ids.filter(id=>this.cached(id)).length;
  const failed=ids.filter(id=>!this.cached(id)&&this.failed.has(id)).length;
  const activities=[...this.activeJobs].filter(job=>!job.controller.signal.aborted&&ids.includes(job.id)).map(job=>({episodeId:job.id,activity:job.progress?{...job.progress}:undefined}));
  const activeId=activities[0]?.episodeId;
  const currentFailed=!this.groups.length&&this.failed.has(ids[0])&&!this.cached(ids[0]);
  const status:BufferState['status']=!total?'idle':ready===total?'complete':this.pausedMessage?'paused':currentFailed?'partial':activeId||ready+failed<total?'preparing':'partial';
  const message=status==='paused'?this.pausedMessage:status==='complete'?'全剧已缓存，可直接播放已缓存剧集':status==='partial'?'部分剧集准备失败，可重试缓存':'';
  return {status,total,ready,failed,activeId,active:activities[0]?.activity,activities,cachedBytes:ids.reduce((sum,id)=>sum+this.retainedBytes(id),0),message};
 }
 private inBackground(id:string){return this.groups.some(group=>!group.paused&&group.ids.includes(id))}
 setBackgroundGroups(groups:BackgroundGroup[]){
  if(!Array.isArray(groups)||groups.length>100||groups.some(group=>!validId(group.id)||!Array.isArray(group.ids)||group.ids.length>5000||group.ids.some(id=>!validId(id))||new Set(group.ids).size!==group.ids.length))throw new AppError('INVALID_INPUT','后台缓存队列无效');
  this.groups=groups.map(group=>({...group,ids:[...group.ids]}));
  for(const job of this.jobs.values())if(!job.foreground&&!this.inBackground(job.id)&&job.id!==this.window[0])this.cancel(job);
  this.pump();
 }
 retryBuffer(ids?:string[]){
  if(this.closing)return this.bufferState();this.pausedMessage='';if(ids)for(const id of ids)this.failed.delete(id);else this.failed.clear();
  if(!ids&&this.window[0]&&!this.entries.has(this.window[0])&&!this.jobs.has(this.window[0]))this.enqueue(this.window[0],false,true);
  this.pump();return this.bufferState();
 }
 prepare(id:string,force=false):Promise<Playback>{
  if(!validId(id))return Promise.reject(new AppError('INVALID_INPUT','剧集编号无效'));
  if(this.closing)return Promise.reject(cancelled());
  if(this.suspended)return Promise.reject(new AppError('CACHE_MOVING','正在迁移缓存，请稍后再播放'));
  const cached=this.cached(id);if(cached&&!force){cached.touched=Date.now();return Promise.resolve(this.result(cached))}
  const existing=this.jobs.get(id);
  if(existing&&!existing.controller.signal.aborted){if(force&&existing.everReady)this.cancel(existing);else{existing.foreground=true;if(existing.progressivePlayback)existing.resolve(existing.progressivePlayback);if(existing.progress?.stage==='waiting')this.prioritizeProcessing(existing.controller.signal);return existing.promise}}
  // A new current episode takes priority; a useful in-flight episode is adopted above.
  if(this.activeJobs.size>=this.concurrency){const background=[...this.activeJobs].find(job=>!job.foreground&&job.id!==id);if(background)this.cancel(background)}
  this.failed.delete(id);
  const job=this.enqueue(id,force,true);this.pump();return job.promise;
 }
 private enqueue(id:string,force:boolean,foreground:boolean):MediaJob{
  let resolve!:MediaJob['resolve'],reject!:MediaJob['reject'];
  const promise=new Promise<Playback>((yes,no)=>{resolve=yes;reject=no});
  const job:MediaJob={id,force,foreground,controller:new AbortController(),promise,resolve,reject,quality:this.quality};
  this.jobs.set(id,job);
  // Background failures are isolated from playback and retried only on a later explicit request.
  void promise.catch(()=>{});return job;
 }
 private renewPlaybackWait(job:MediaJob){
  // An early progressive result may already have settled the original promise.
  // Callers arriving after its failure must wait for the fallback's actual result.
  job.promise=new Promise<Playback>((resolve,reject)=>{job.resolve=resolve;job.reject=reject});void job.promise.catch(()=>{});
 }
 private cancel(job:MediaJob){
  job.controller.abort();
  if(!this.activeJobs.has(job)){if(this.jobs.get(job.id)===job)this.jobs.delete(job.id);job.reject(cancelled())}
 }
 private get concurrency(){return Math.max(1,Math.min(6,this.options.concurrency||1))}
 get downloadConcurrency(){return this.concurrency}
 private cached(id:string){const entry=this.entries.get(id);return entry&&(entry.quality??'auto')===this.quality?entry:undefined}
 setQuality(value:VideoQuality){if(!['auto','1080p','720p','540p','480p','360p'].includes(value))throw new AppError('INVALID_INPUT','画质选项无效');if(value===this.quality)return;this.quality=value;this.failed.clear();this.pausedMessage='';for(const job of this.jobs.values())this.cancel(job);this.pump()}
 setLimits(value:{maxBytes:number;bytesPerSecond:number}){if(!value||!Number.isSafeInteger(value.maxBytes)||value.maxBytes<0||!Number.isSafeInteger(value.bytesPerSecond)||value.bytesPerSecond<0)throw new AppError('INVALID_INPUT','缓存额度或限速无效');const changed=this.maxBytes!==value.maxBytes;this.maxBytes=value.maxBytes;this.limiter.setRate(value.bytesPerSecond);if(changed&&this.pausedMessage.includes('缓存额度')){this.pausedMessage='';this.pump()}}
 setConcurrency(value:number){
  if(![2,4,6].includes(value))throw new AppError('INVALID_INPUT','请选择 2、4 或 6 路并行准备');
  this.options.concurrency=value;this.pump();
 }
 get downloadBytesPerSecond(){
  const now=Date.now(),bucket=Math.floor(now/1000);let bytes=0;
  for(const [second,count] of this.transfers){if(second<bucket-4)this.transfers.delete(second);else bytes+=count}
  return bytes?Math.round(bytes/Math.max(.25,Math.min(5,(now-this.transferStarted)/1000))):0;
 }
 private transferred(bytes:number){const now=Date.now();if(!this.transferStarted)this.transferStarted=now;const bucket=Math.floor(now/1000);this.transfers.set(bucket,(this.transfers.get(bucket)||0)+bytes);for(const key of this.transfers.keys())if(key<bucket-4)this.transfers.delete(key)}
 private processor(signal:AbortSignal):Promise<()=>void>{
  return new Promise((resolve,reject)=>{
   const entry={signal,grant:(release:()=>void)=>{signal.removeEventListener('abort',abort);resolve(release)},reject:()=>{signal.removeEventListener('abort',abort);reject(cancelled())}};
   const abort=()=>{const index=this.processingQueue.indexOf(entry);if(index>=0)this.processingQueue.splice(index,1);entry.reject()};
   signal.addEventListener('abort',abort,{once:true});this.processingQueue.push(entry);if(signal.aborted)abort();
   this.prioritizeProcessing(signal);
   this.pumpProcessors();
  });
 }
 private prioritizeProcessing(signal:AbortSignal){
  if(!signal.aborted&&this.processing>=2&&[...this.activeJobs].some(job=>job.foreground&&job.controller.signal===signal)){
   const background=[...this.activeJobs].find(job=>!job.foreground&&!job.controller.signal.aborted&&(job.progress?.stage==='processing'||job.processingActive));if(background)this.cancel(background);
  }
 }
 hasDeletionPending(ids:string[]){return ids.some(id=>this.deletionMetadata.has(id))}
 private pumpProcessors(){
  while(this.processing<2&&this.processingQueue.length){
   const first=this.processingQueue.findIndex(item=>[...this.activeJobs].some(job=>job.foreground&&job.controller.signal===item.signal));
   const [entry]=this.processingQueue.splice(first<0?0:first,1);if(entry.signal.aborted){entry.reject();continue}
   this.processing++;let released=false;entry.grant(()=>{if(released)return;released=true;this.processing--;this.pumpProcessors()});
  }
 }
 async deleteEpisodes(ids:string[]):Promise<{freedBytes:number}>{
  if(!Array.isArray(ids)||ids.length>5000||ids.some(id=>!validId(id))||new Set(ids).size!==ids.length)throw new AppError('INVALID_INPUT','删除缓存的分集列表无效');
  if(this.suspended||this.closing)throw new AppError('CACHE_BUSY','缓存正在迁移或退出，请稍后再删除');
  if(ids.some(id=>this.window.includes(id)))throw new AppError('CACHE_IN_USE','作品仍在播放页打开，请先返回缓存中心再删除');
  this.suspended=true;let freedBytes=0,failed=false;
  try{
   const selected=new Set(ids),pending=[...new Set([...this.jobs.values(),...this.activeJobs])].filter(job=>selected.has(job.id));
   for(const job of pending)this.cancel(job);await Promise.allSettled(pending.map(job=>job.completion??job.promise));
   for(const id of ids){
    const entry=this.entries.get(id),key=entry?.key||this.deletionMetadata.get(id);
    if(entry){try{await unlink(entry.file)}catch(error:any){if(error.code!=='ENOENT'){failed=true;continue}}this.entries.delete(id);freedBytes+=entry.bytes||0}
    this.failed.delete(id);this.protectedIds.delete(id);
    for(const quality of ['auto','1080p','720p','540p','480p','360p']){const name=this.partialName(id,quality as VideoQuality);try{const bytes=this.partialBytes.get(name+'.mp4')||0;await unlink(path.join(this.directory,name+'.mp4'));this.partialBytes.delete(name+'.mp4');freedBytes+=bytes}catch(error:any){if(error.code!=='ENOENT')failed=true}try{await unlink(path.join(this.directory,name+'.json'))}catch(error:any){if(error.code!=='ENOENT')failed=true}}
    if(key){this.deletionMetadata.set(id,key);try{await unlink(path.join(this.directory,key+'.json'));this.deletionMetadata.delete(id)}catch(error:any){if(error.code!=='ENOENT')failed=true;else this.deletionMetadata.delete(id)}}
   }
   if(failed)throw new AppError('CACHE_DELETE','部分缓存文件无法删除，任务已暂停；请关闭占用文件的程序或检查目录权限后重试删除');
   return {freedBytes};
  }finally{this.suspended=false;this.pump()}
 }
 get location(){return this.directory}
 get usedBytes(){return [...this.entries.values()].reduce((sum,entry)=>sum+(entry.bytes||0),0)+[...this.partialBytes.values()].reduce((sum,bytes)=>sum+bytes,0)}
 private retainedBytes(id:string){let bytes=this.entries.get(id)?.bytes||0;if(this.partialBytes.size)for(const quality of ['auto','1080p','720p','540p','480p','360p'] as const)bytes+=this.partialBytes.get(this.partialName(id,quality)+'.mp4')||0;return bytes}
 // The quota covers projected retained files. Active source/working files are
 // additional temporary disk overhead; disk headroom and processor slots still apply.
 private projectedBytes(){let bytes=this.usedBytes;for(const job of this.activeJobs){if(job.controller.signal.aborted||job.capacityBytes===undefined)continue;bytes-=this.partialBytes.get(this.partialName(job.id,job.quality)+'.mp4')||0;if(!job.capacityCommitted)bytes+=job.capacityBytes-(this.entries.get(job.id)?.bytes||0)}return bytes}
 private checkBudget(job:MediaJob){if(this.maxBytes&&this.projectedBytes()>this.maxBytes){job.capacityBytes=undefined;throw new AppError('CACHE_BUDGET','缓存额度不足，已暂停新任务；请清理缓存或提高缓存额度后重试')}}
 async freeBytes(){const info=await statfs(this.directory);return info.bavail*info.bsize}
 async relocate(destination:string,commit:()=>Promise<void>){
  if(this.suspended||this.closing)throw new AppError('CACHE_BUSY','缓存正在迁移或退出，请稍后重试');
  const source=path.resolve(this.directory),target=path.resolve(destination);
  if(source.toLowerCase()===target.toLowerCase())return;
  const nested=(a:string,b:string)=>{const relative=path.relative(a,b);return relative===''||(!relative.startsWith('..')&&!path.isAbsolute(relative))};
  if(nested(source,target)||nested(target,source))throw new AppError('CACHE_PATH','新旧缓存目录不能相互包含');
  this.suspended=true;const copied:string[]=[];
  try{
   const pending=[...new Set([...this.jobs.values(),...this.activeJobs])];for(const job of pending)this.cancel(job);await Promise.allSettled(pending.map(job=>job.completion??job.promise));
   await mkdir(target,{recursive:true});if((await readdir(target)).length)throw new AppError('CACHE_PATH','目标专用缓存文件夹不是空文件夹，请选择其他位置');
   const info=await statfs(target);if(info.bavail*info.bsize<this.usedBytes+SPACE_RESERVE+2*FILE_LIMIT*this.concurrency)throw new AppError('DISK_SPACE','目标磁盘空间不足，原缓存及目录设置未更改');
   const hash=async(file:string)=>{const digest=createHash('sha256');for await(const chunk of createReadStream(file))digest.update(chunk);return digest.digest('hex')};
   for(const entry of this.entries.values())for(const suffix of ['.mp4','.json']){
    if(this.closing)throw cancelled();const from=path.join(source,entry.key+suffix),to=path.join(target,entry.key+suffix);
    await copyFile(from,to,constants.COPYFILE_EXCL);copied.push(to);
    if(await hash(from)!==await hash(to))throw new AppError('CACHE_VERIFY','迁移文件校验失败，已保留原缓存');
   }
   for(const name of this.partialBytes.keys())for(const file of [name,name.replace('.mp4','.json')]){
    if(this.closing)throw cancelled();const from=path.join(source,file),to=path.join(target,file);const exists=await stat(from).catch(()=>null);if(!exists)continue;
    await copyFile(from,to,constants.COPYFILE_EXCL);copied.push(to);if(await hash(from)!==await hash(to))throw new AppError('CACHE_VERIFY','断点文件校验失败，继续使用原目录');
   }
   if(this.closing)throw cancelled();await commit();this.directory=target;
   for(const entry of this.entries.values())entry.file=path.join(target,entry.key+'.mp4');
  }catch(error){for(const file of copied)await unlink(file).catch(()=>{});if(error instanceof AppError)throw error;throw new AppError('CACHE_MOVE','缓存迁移失败，原缓存及目录设置未更改，请检查目标目录权限和空间')}
  finally{this.suspended=false;this.pump()}
 }
 private pump(){
  if(this.closing||this.suspended)return;
  while(this.activeJobs.size<this.concurrency){
  let job=[...this.jobs.values()].find(job=>job.foreground&&!job.controller.signal.aborted&&!this.activeJobs.has(job)&&![...this.activeJobs].some(other=>other.id===job.id));
  if(!job&&!this.pausedMessage){
   // Temporary advance episodes share the same round robin as persistent works.
   const groups=Array.from({length:4},(_,round)=>this.groups.filter(group=>round<(group.priority==='high'?4:group.priority==='low'?1:2))).flat();
   if(this.window[0]&&(this.cached(this.window[0])||[...this.jobs.values()].some(job=>job.id===this.window[0]&&job.ready))&&!groups.some(group=>group.ids.includes(this.window[0])))groups.push({id:'current',ids:this.window.slice(1),paused:false});
   for(let n=0;n<groups.length;n++){
    const index=(this.groupCursor+n)%groups.length,group=groups[index];
    const id=!group.paused?group.ids.find(id=>!this.cached(id)&&!this.failed.has(id)&&!this.jobs.has(id)):undefined;
    if(id){job=this.enqueue(id,false,false);this.groupCursor=(index+1)%groups.length;break}
   }
  }
  if(!job)return;
  const running=job;this.activeJobs.add(running);
  const finish=()=>{
   if(this.jobs.get(running.id)===running)this.jobs.delete(running.id);
   this.activeJobs.delete(running);
  };
  running.completion=this.run(running).then(value=>{finish();running.resolve(value);this.pump()},error=>{
   if(!running.controller.signal.aborted){
    if(error instanceof AppError&&['DISK_SPACE','DISK_CHECK','CACHE_BUDGET'].includes(error.code))this.pausedMessage=error.message;
    else this.failed.add(running.id);
   }
   finish();running.reject(error);this.pump();
  });
  }
 }
 private async run(job:MediaJob):Promise<Playback>{
  const signal=job.controller.signal;let last:unknown;
  for(let attempt=0;attempt<2;attempt++){
   check(signal);
   try{job.progress={stage:'resolving'};await this.ensureSpace(signal);const start=Date.now(),resource=await abortable(this.getResource(job.id,job.quality),signal);this.options.diagnostics?.record({stage:'resolve',code:'OK',ms:Date.now()-start});check(signal);if(!Number.isSafeInteger(resource.size)||resource.size<=0||resource.size>FILE_LIMIT)throw new AppError('UNSUPPORTED_RESOURCE','播放资源不完整或大小暂不支持');job.capacityBytes=resource.size;job.capacityCommitted=false;this.checkBudget(job);return await this.create(resource,signal,progress=>{if(!signal.aborted)job.progress=progress},job,attempt===0)}
   catch(error){last=error;this.options.diagnostics?.record({stage:'playback',code:error instanceof AppError?error.code:'UNKNOWN'});if(signal.aborted||this.closing)throw cancelled();if(error instanceof AppError&&['DISK_SPACE','DISK_CHECK','CACHE_BUDGET','NETWORK'].includes(error.code))throw error}
  }
  throw last;
 }
 private async ensureSpace(signal:AbortSignal){
  check(signal);
  try{
   const free=async()=>this.options.freeBytes?this.options.freeBytes():statfs(this.directory).then(info=>info.bavail*info.bsize);
   let available=await free();check(signal);
   if(available<SPACE_RESERVE+2*FILE_LIMIT*this.concurrency){await this.trim(true);available=await free();check(signal)}
   if(!Number.isFinite(available)||available<SPACE_RESERVE+2*FILE_LIMIT*this.concurrency)throw new AppError('DISK_SPACE',`缓存空间不足，已暂停准备新剧集；请至少留出 ${((SPACE_RESERVE+2*FILE_LIMIT*this.concurrency)/1024**3).toFixed(1)} GiB 可用空间后点击重试缓存`);
  }catch(error){check(signal);if(error instanceof AppError)throw error;throw new AppError('DISK_CHECK','无法检查缓存磁盘空间，已暂停准备新剧集；请检查磁盘后重试缓存')}
 }
 private result(e:CacheEntry):Playback{return {url:`manju-media://local/${e.key}`,duration:e.duration,definition:e.definition,episodeId:e.episodeId,availableQualities:e.availableQualities,codec:e.codec,size:e.size}}
 private partialName(id:string,quality:VideoQuality){return createHash('sha256').update(id+':'+quality).digest('hex').slice(0,32)+'.partial'}
 private async create(resource:Resource,signal:AbortSignal,report:(activity:CacheActivity)=>void,job:MediaJob,firstAttempt:boolean):Promise<Playback>{
  check(signal);
  if(!(resource.duration>0)||resource.duration>1800||!(resource.size>0)||resource.size>FILE_LIMIT)throw new AppError('UNSUPPORTED_RESOURCE','播放资源不完整或大小暂不支持');
  const key=randomUUID().replaceAll('-',''),partial=this.partialName(resource.episodeId,job.quality);const input=path.join(this.directory,partial+'.mp4'),checkpoint=path.join(this.directory,partial+'.json'),working=path.join(this.directory,key+'.working.mp4'),output=path.join(this.directory,key+'.mp4');
  const metadata=path.join(this.directory,key+'.json');let committed=false,downloaded=false,encoder:ProgressiveEncoder|undefined,release:(()=>void)|undefined,growing:GrowingMedia|undefined,prefix=Buffer.alloc(0),decided=false,processingMs=0;
  const contentKey=resource.encrypted?decodeContentKey(resource.spade||''):null;
  try{
   report({stage:'downloading',transferred:0,total:resource.size,percent:0});
   const downloadStart=Date.now(),fingerprint=createHash('sha256').update([resource.episodeId,resource.definition,resource.codec,resource.size,resource.encrypted,resource.spade||''].join(':')).digest('hex');
   const streamAllowed=this.options.progressive!==false&&firstAttempt&&!job.force;
    await downloadMedia({url:resource.url,path:input,metadataPath:checkpoint,size:resource.size,fingerprint,signal,throttle:async(bytes,signal)=>{await this.limiter.consume(bytes,signal);this.transferred(bytes)},onProgress:(bytes,total)=>{this.partialBytes.set(partial+'.mp4',bytes);report({stage:'downloading',transferred:bytes,total,percent:Math.floor(bytes/total*100)})},...(streamAllowed?{onChunk:async(chunk:Uint8Array)=>{
    if(encoder){await encoder.write(chunk);return}if(decided)return;
    prefix=Buffer.concat([prefix,chunk]);const candidate=streamableMp4(prefix);if(candidate===false||prefix.length>2*1024*1024){decided=true;prefix=Buffer.alloc(0);return}if(candidate!==true)return;
    decided=true;report({stage:'waiting'});release=await this.processor(signal);job.processingActive=true;check(signal);processingMs=Date.now();
    encoder=new ProgressiveEncoder(this.ffmpeg,working,contentKey,resource.duration,resource.codec,signal,()=>{});growing=new GrowingMedia(working);this.growing.set(key,growing);
     void encoder.ready.then(()=>{if(signal.aborted)return;job.ready=true;job.everReady=true;job.progressivePlayback={...this.result({key,file:working,episodeId:resource.episodeId,duration:resource.duration,definition:resource.definition,touched:Date.now(),policy:CACHE_POLICY,availableQualities:resource.availableQualities,codec:resource.codec,size:resource.size}),progressive:true};if(job.foreground)job.resolve(job.progressivePlayback);this.pump()}).catch(()=>{});
    await encoder.write(prefix);prefix=Buffer.alloc(0);
   }}:{})});
   downloaded=true;this.options.diagnostics?.record({stage:'download',code:'OK',ms:Date.now()-downloadStart});check(signal);
   if(encoder){report({stage:'processing',percent:99});await encoder.end();this.options.diagnostics?.record({stage:'processing',code:'OK',ms:Date.now()-processingMs});release?.();release=undefined;job.processingActive=false}
   else{
   report({stage:'waiting'});release=await this.processor(signal);job.processingActive=true;
   try{
   check(signal);report({stage:'processing',percent:0});processingMs=Date.now();
   const progress=(percent:number)=>report({stage:'processing',percent});
   if(['h264','avc1'].includes(resource.codec)){
    try{await this.transcode(input,working,contentKey,resource.duration,signal,progress,true);if((await stat(working)).size>FILE_LIMIT)throw new AppError('MEDIA_DECODE','封装文件过大，改用兼容编码')}
    catch(error){check(signal);if(!(error instanceof AppError)||error.code!=='MEDIA_DECODE')throw error;report({stage:'processing',percent:0});await this.transcode(input,working,contentKey,resource.duration,signal,progress)}
   }else await this.transcode(input,working,contentKey,resource.duration,signal,progress);
   this.options.diagnostics?.record({stage:'processing',code:'OK',ms:Date.now()-processingMs});
   }finally{release?.();release=undefined;job.processingActive=false}
   }
   contentKey?.fill(0);check(signal);
   report({stage:'finalizing'});
   const info=await stat(working);if(info.size<=0||info.size>FILE_LIMIT)throw new AppError('MEDIA_CACHE','单集缓存超过大小限制');
    // Reserve actual output synchronously before rename/metadata I/O so concurrent
    // completions cannot both spend the same remaining quota.
    job.capacityBytes=info.size;this.checkBudget(job);
    try{await unlink(input)}catch(error:any){if(error.code!=='ENOENT')throw new AppError('MEDIA_CACHE','已下载的临时文件无法清理，请检查文件占用后重试')}
    this.partialBytes.delete(partial+'.mp4');await unlink(checkpoint).catch(()=>{});check(signal);this.checkBudget(job);
   await rename(working,output);check(signal);
   const entry:CacheEntry={key,file:output,episodeId:resource.episodeId,duration:resource.duration,definition:resource.definition,touched:Date.now(),policy:CACHE_POLICY,bytes:info.size,quality:job.quality,availableQualities:resource.availableQualities,codec:resource.codec,size:resource.size};
   await writeFile(metadata,JSON.stringify({...entry,file:undefined}));check(signal);
    const previous=this.entries.get(resource.episodeId);this.entries.set(resource.episodeId,entry);job.capacityCommitted=true;committed=true;growing?.complete(output);this.growing.delete(key);
   if(previous){await unlink(path.join(this.directory,previous.key+'.json')).catch(()=>{});await unlink(previous.file).catch(()=>{})}
   await this.trim();return this.result(entry);
  }catch(error){check(signal);if(error instanceof AppError)throw error;throw new AppError('MEDIA_CACHE','视频准备失败，请检查磁盘空间后重试当前集')}
    finally{encoder?.stop();await encoder?.finished.catch(()=>{});release?.();if(!committed){if(job.ready)this.renewPlaybackWait(job);growing?.fail();job.ready=false;job.progressivePlayback=undefined}this.growing.delete(key);contentKey?.fill(0);if(downloaded){await unlink(input).catch(()=>{});await unlink(checkpoint).catch(()=>{})}const retained=await stat(input).catch(()=>null);if(retained?.size)this.partialBytes.set(partial+'.mp4',retained.size);else this.partialBytes.delete(partial+'.mp4');await unlink(working).catch(()=>{});if(!committed){await unlink(output).catch(()=>{});await unlink(metadata).catch(()=>{})}}
 }
 private transcode(input:string,output:string,key:Buffer|null,duration:number,signal:AbortSignal,report:(percent:number)=>void,copy=false):Promise<void>{
  check(signal);
  return new Promise((resolve,reject)=>{
    const args=['-hide_banner','-loglevel','error','-nostats','-progress','pipe:1',...(key?['-decryption_key',key.toString('hex')]:[]),'-i',input,...(copy?['-c:v','copy']:['-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-preset','veryfast','-threads','2','-crf','20',...encodingRateArgs(duration,FILE_LIMIT)]),'-c:a','aac','-movflags','+faststart','-fs',String(FILE_LIMIT+1),'-y',output];
   const child=spawn(this.ffmpeg,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let progress='';
   const abort=()=>{child.kill()};signal.addEventListener('abort',abort,{once:true});
   const timeout=setTimeout(()=>child.kill(),180000);
   const cleanup=()=>{clearTimeout(timeout);signal.removeEventListener('abort',abort)};
   child.stdout.on('data',data=>{progress+=data;if(progress.length>50000)progress=progress.slice(-25000);const actual=Number([...progress.matchAll(/^out_time_us=(\d+)\r?\n/gm)].at(-1)?.[1])/1e6;if(Number.isFinite(actual))report(Math.max(0,Math.min(99,Math.floor(actual/duration*100))))});child.stderr.resume();
   child.once('error',()=>{cleanup();reject(signal.aborted?cancelled():new AppError('MEDIA_RUNTIME','媒体组件无法启动'))});
   child.once('close',code=>{cleanup();const actual=Number([...progress.matchAll(/^out_time_us=(\d+)$/gm)].at(-1)?.[1])/1e6;signal.aborted?reject(cancelled()):code===0&&Math.abs(actual-duration)<1?resolve():reject(new AppError('MEDIA_DECODE','视频处理未完成，请重试当前集'))});
  });
 }
 async response(url:string,range:string|null):Promise<Response>{
  const uri=new URL(url);if(uri.hostname!=='local'||!/^\/[a-f0-9]{32}$/.test(uri.pathname))return new Response(null,{status:404});
  const growing=this.growing.get(uri.pathname.slice(1));if(growing){if(range&&!/^bytes=0-\d*$/.test(range))return new Response(null,{status:416});return growing.response()}
  const entry=[...this.entries.values()].find(e=>e.key===uri.pathname.slice(1));if(!entry)return new Response(null,{status:404});
  const info=await stat(entry.file).catch(()=>null);if(!info)return new Response(null,{status:404});const slice=parseRange(range,info.size);if(!slice)return new Response(null,{status:416,headers:{'content-range':`bytes */${info.size}`}});
  entry.touched=Date.now();const stream=Readable.toWeb(createReadStream(entry.file,{start:slice.start,end:slice.end}));return new Response(stream as ReadableStream,{status:slice.status,headers:{'content-type':'video/mp4','accept-ranges':'bytes','content-length':String(slice.end-slice.start+1),...(slice.status===206?{'content-range':`bytes ${slice.start}-${slice.end}/${info.size}`}:{})}});
 }
 private async trim(reclaim=false){
  const entries=[...this.entries.values()].sort((a,b)=>a.touched-b.touched);
  const sizes=new Map<string,number>();let total=0;
  for(const e of entries){const info=await stat(e.file).catch(()=>null);if(!info){this.entries.delete(e.episodeId);continue}sizes.set(e.episodeId,info.size);total+=info.size}
  for(const e of entries){
   // Keep every episode of the opened work, including earlier episodes after a jump.
   if(this.protectedIds.has(e.episodeId)||this.groups.some(group=>group.ids.includes(e.episodeId))||[...this.activeJobs].some(job=>job.id===e.episodeId)||!sizes.has(e.episodeId))continue;
   if(reclaim||total>CACHE_LIMIT||Date.now()-e.touched>86400000){
    try{await unlink(e.file);await unlink(path.join(this.directory,e.key+'.json')).catch(()=>{});this.entries.delete(e.episodeId);total-=sizes.get(e.episodeId)!}catch{/* Windows may still have an old file open; retry on the next trim. */}
   }
  }
 }
 async close(){this.closing=true;this.window=[];const pending=[...new Set([...this.jobs.values(),...this.activeJobs])];for(const job of pending)this.cancel(job);this.limiter.close();await Promise.allSettled(pending.map(job=>job.completion??job.promise))}
}
