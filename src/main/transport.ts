import {mkdirSync} from 'node:fs';import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';import {tmpdir} from 'node:os';import {safeJson} from './json';
import {spawn, type ChildProcessWithoutNullStreams} from 'node:child_process';import {createInterface} from 'node:readline';import {createHash,randomInt,randomUUID} from 'node:crypto';import path from 'node:path';
import type {ApiTransport} from '../shared/types';import {AppError} from './errors';
import {registerPlayer} from './player-registration';
type Reply={seq:number;headers?:Record<string,string>;error?:string};
export class Signer {
 private process:ChildProcessWithoutNullStreams|null=null;private seq=0;private pending=new Map<number,{resolve:(headers:Record<string,string>)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
 private stopped=false;private stopping?:Promise<void>;private workers=new Map<ChildProcessWithoutNullStreams,Promise<void>>();
 constructor(private runtime:string,private workDirectory=path.join(tmpdir(),'hongguo-runtime')){}
 private start(){if(this.stopped)throw new AppError('CANCELLED','应用正在退出，内容服务已停止');if(this.process)return;mkdirSync(this.workDirectory,{recursive:true});
  const child=spawn(path.join(this.runtime,'java/bin/java.exe'),['-Xmx384m',`-Djava.io.tmpdir=${this.workDirectory}`,'-cp',`${path.join(this.runtime,'classes')};${path.join(this.runtime,'dependencies.jar')}`,'app.hongguo.runtime.SignerBridge',path.join(this.runtime,'sdk')],{cwd:this.workDirectory,windowsHide:true,stdio:['pipe','pipe','pipe']});this.process=child;
  this.workers.set(child,new Promise(resolve=>child.once('close',()=>{this.workers.delete(child);resolve()})));
  child.stderr.resume();const lines=createInterface({input:child.stdout});lines.on('line',line=>{
   if(line.length>100000)return;let reply:Reply;try{reply=JSON.parse(line)}catch{return}const pending=this.pending.get(reply.seq);if(!pending)return;clearTimeout(pending.timer);this.pending.delete(reply.seq);
   if(reply.error||!reply.headers?.['X-Argus']||!reply.headers?.['X-Gorgon'])pending.reject(new AppError('SIGN_FAILED','内容连接准备失败，请重试'));else pending.resolve(reply.headers);
  });
  const fail=()=>{lines.close();if(this.process!==child)return;this.process=null;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new AppError('SIGN_RUNTIME','内容服务已退出，请重试'))}this.pending.clear()};child.once('error',fail);child.once('close',fail);child.stdin.on('error',()=>{});
 }
 sign(url:string,headers:Record<string,string>):Promise<Record<string,string>>{
  this.start();if(!this.process)throw new AppError('SIGN_RUNTIME','内容组件无法启动');const seq=++this.seq;return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.pending.delete(seq);reject(new AppError('SIGN_TIMEOUT','内容连接准备超时，请重试'));this.close()},35000);this.pending.set(seq,{resolve,reject,timer});this.process!.stdin.write(JSON.stringify({seq,url,headers})+'\n',error=>{if(error){clearTimeout(timer);this.pending.delete(seq);reject(new AppError('SIGN_RUNTIME','内容组件无法启动'))}});
  });
 }
 close(){const child=this.process;this.process=null;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new AppError('CANCELLED','内容服务已停止'))}this.pending.clear();child?.stdin.end();child?.kill()}
 // Unlike a retryable close(), terminal shutdown forbids late requests from
 // starting another worker and waits for OS exit before replacing runtime files.
 shutdown(timeoutMs=10000):Promise<void>{
  if(this.stopping)return this.stopping;this.stopped=true;this.close();
  for(const child of this.workers.keys())child.kill();
  this.stopping=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new AppError('SIGN_SHUTDOWN','内容组件未能退出，已停止安装更新，请彻底退出软件后重试')),timeoutMs);
   Promise.all(this.workers.values()).then(()=>{clearTimeout(timer);resolve()},error=>{clearTimeout(timer);reject(error)});
  });return this.stopping;
 }
}
export class Transport implements ApiTransport {
 private playerIdentity?:Promise<{device_id:string;iid:string}>;
 private registeredPlayer=false;private registration?:Promise<void>;
 constructor(private signer:Signer,private profileDirectory=path.join(tmpdir(),'hongguo-runtime')){}
 private identity(){
  return this.playerIdentity??=(async()=>{
   const file=path.join(this.profileDirectory,'player-profile.json');
   try{
    await mkdir(this.profileDirectory,{recursive:true});
    let stored:string;
    try{stored=await readFile(file,'utf8')}catch(error:any){
     if(error.code!=='ENOENT')throw error;
     const id=()=> '1'+Array.from({length:18},()=>randomInt(10)).join('');
     const created={device_id:id(),iid:id()};
     try{await writeFile(file,JSON.stringify(created),{flag:'wx',mode:0o600});return created}
     catch(writeError:any){if(writeError.code!=='EEXIST')throw writeError;stored=await readFile(file,'utf8')}
    }
    const value=JSON.parse(stored);
    if(!value||typeof value.device_id!=='string'||typeof value.iid!=='string'||! /^[1-9]\d{15,19}$/.test(value.device_id)||! /^[1-9]\d{15,19}$/.test(value.iid))throw Error('INVALID_PROFILE');
    this.registeredPlayer=value.registered===true;
    return {device_id:value.device_id,iid:value.iid};
   }catch{throw new AppError('PLAYER_PROFILE','播放标识无法读取或保存，请检查应用数据目录是否可写')}
  })();
 }
 private register(){
  return this.registration??=(async()=>{
   const identity=await registerPlayer();
   const file=path.join(this.profileDirectory,'player-profile.json'),temporary=file+'.'+randomUUID()+'.tmp';
   try{await writeFile(temporary,JSON.stringify({...identity,registered:true}),{mode:0o600});await rename(temporary,file)}finally{await unlink(temporary).catch(()=>{})}
   this.playerIdentity=Promise.resolve(identity);this.registeredPlayer=true;
  })();
 }
 async request(endpoint:string,body?:unknown,extra:Record<string,string|number|boolean>={}):Promise<any>{
  if(!/^\/(?:novel\/player\/|reading\/bookapi\/)/.test(endpoint))throw new AppError('INVALID_ENDPOINT','内容接口无效');
  const playback=endpoint==='/novel/player/video_model/v1/';
  let requestBody=body;
  if(playback){
   const value=body as {video_id?:unknown};
   if(!value||typeof value.video_id!=='string'||!/^\d{8,24}$/.test(value.video_id))throw new AppError('INVALID_INPUT','播放分集编号无效');
   requestBody=undefined;
  }
  const url=new URL(playback?'/reading/bookapi/video_tab/multi_video_model/v1/':endpoint,playback?'https://api5-normal-sinfonlineb.fqnovel.com':'https://api5-normal-sinfonlinea.fqnovel.com');
  for(const [k,v] of Object.entries({aid:'8704',app_name:'novelread',version_code:'72232',version_name:'7.2.2.32',channel:'audit',device_platform:'android',os_version:'12',update_version_code:'72232',_rticket:Date.now(),...extra}))url.searchParams.set(k,String(v));
  // The old POST route now returns empty bodies. The current GET route uses
  // flat query fields and a video_model_data envelope (verified 2026-11-03).
  if(playback){url.search='';for(const [key,value] of Object.entries({aid:'8662',app_name:'novelread',version_code:'73532',version_name:'7.3.5.32',manifest_version_code:'73532',update_version_code:'73532',channel:'update_64',device_platform:'android',os:'android',ssmix:'a',device_type:'25053RT47C',device_brand:'Redmi',language:'zh',os_api:'36',os_version:'16',resolution:'1280*2772',dpi:'520',ac:'wifi',...await this.identity()}))url.searchParams.set(key,value)}
  if(playback)for(const [key,value] of Object.entries({video_id:(body as {video_id:string}).video_id,video_id_type:'0',device_level:'1',need_all_video_definition:'1',need_mp4_align:'0',use_os_player:'0',video_platform:'1024',source:'0',from_video_id:'',_rticket:String(Date.now())}))url.searchParams.set(key,value);
  const payload=requestBody===undefined?undefined:JSON.stringify(requestBody);const headers:Record<string,string>={'user-agent':'HongguoTV/0.1','content-type':'application/json; charset=utf-8',...(payload?{'x-ss-stub':createHash('md5').update(payload).digest('hex').toUpperCase()}: {})};
  if(playback)Object.assign(headers,{'user-agent':'com.phoenix.read/73532 (Linux; U; Android 16; zh_CN; 25053RT47C; Build/BP2A.250605.031.A3; Cronet/TTNetVersion:04657795 2026-01-23 QuicVersion:c67e9834 2025-09-08)',accept:'application/json','x-xs-from-web':'0','sdk-version':'2'});
  const signatures=playback?{}:await this.signer.sign(url.href,headers);let response:Response;
  try{response=await fetch(url,{method:payload?'POST':'GET',headers:{...headers,...signatures},body:payload,signal:AbortSignal.timeout(25000)})}catch{throw new AppError('NETWORK','无法连接内容来源，请检查网络后重试')}
  if(!response.ok)throw new AppError('API_HTTP',`内容来源暂不可用（${response.status}）`);
  const text=await response.text();if(!text.trim()){
   if(playback&&url.searchParams.get('device_id')!==(await this.identity()).device_id)return this.request(endpoint,body,extra);
   if(playback&&!this.registeredPlayer){
    try{await this.register()}catch{throw new AppError('API_EMPTY','内容来源返回空结果，请稍后重试')}
    return this.request(endpoint,body,extra);
   }
   throw new AppError('API_EMPTY','内容来源返回空结果，请稍后重试');
  }if(text.length>8*1024*1024)throw new AppError('API_FORMAT','内容返回过大');
  let json:any;try{json=safeJson(text)}catch{throw new AppError('API_FORMAT','内容来源的数据格式发生变化')}
  const code=json.code??json.Code??json.BaseResp?.StatusCode;
  if(code!==undefined&&code!==0)throw new AppError('API_UNAVAILABLE',`内容来源暂不可用（代码 ${Number(code)||'未知'}）`);
  if(playback){const item=json.data?.video_model_data?.[(body as {video_id:string}).video_id];if(code!==0||!item||typeof item!=='object'||!item.video_model)throw new AppError('API_FORMAT','内容来源未返回当前分集的播放资源');return {...json,code:0,data:item}}
  return json;
 }
}
