import {createHash} from 'node:crypto';
import {registerPlayer} from './player-registration';
import {signPlayback} from './vendor/playback-signing.js';
import {signPlaybackV5} from './vendor/playback-v5.js';
import {gzipSync} from 'node:zlib';
import {safeJson} from './json';
import {AppError} from './errors';

async function registeredPlayerPlayback(episodeId:string) {
 const identity=await registerPlayer();
 const body=gzipSync(Buffer.from(JSON.stringify({
  biz_param:{detail_page_version:0,device_level:3,disable_digg_stat:false,
   disable_video_relate_book:false,need_all_video_definition:true,need_mp4_align:false,
   use_os_player:false,use_server_dns:false,video_platform:1024},
  mixed_video_id_map:{'1004':[episodeId]},dr_scene:'player',
 })));
 for(const {host,videoTab} of [{host:'sinfonlineb',videoTab:false},{host:'sinfonlinea',videoTab:false},{host:'sinfonlineb',videoTab:true}]){
  const endpoint=videoTab?'/reading/bookapi/video_tab/multi_video_model/v1/':'/novel/player/multi_video_model/player/v1';
  const signed=signPlaybackV5({base:`https://api5-normal-${host}.fqnovel.com${endpoint}`,
   values:{aid:'8662',app_name:'novelread',version_code:'74332',version_name:'7.4.3.32',
    channel:'vivo_8662_64',device_platform:'android',device_type:'PGT-AN10',os_version:'12',
    update_version_code:'74332',...identity,...(videoTab?{video_id:episodeId,video_id_type:'0',device_level:'1',
     need_all_video_definition:'1',need_mp4_align:'0',use_os_player:'0',video_platform:'1024',source:'0',from_video_id:''}:{})},body:videoTab?null:body,now:Date.now()});
  const response=await fetch(signed.url,{method:videoTab?'GET':'POST',body:videoTab?undefined:body,signal:AbortSignal.timeout(25000),headers:{...signed.headers,
   'user-agent':videoTab?'com.phoenix.read/73932 (Linux; U; Android 16; zh_CN; 25053RT47C; Build/BP2A.250605.031.A3; Cronet/TTNetVersion:04657795 2026-01-23 QuicVersion:c67e9834 2025-09-08)':'com.phoenix.read/73932 (Linux; U; Android 12; zh_CN_#Hans; PGT-AN10; Build/V417IR;tt-ok/3.12.13.20)',
   accept:'application/json',...(videoTab?{}:{'content-type':'application/json; charset=utf-8','content-encoding':'gzip'})}})
   .catch(()=>{throw new AppError('NETWORK','播放资源连接失败，请重试当前集')});
  if(!response.ok)throw new AppError('API_HTTP',`播放资源暂不可用（${response.status}）`);
  const text=await response.text();if(!text.trim())continue;
  if(text.length>8*1024*1024)throw new AppError('API_FORMAT','播放资源响应过大');
  let result:any;try{result=safeJson(text)}catch{throw new AppError('API_FORMAT','播放资源的数据格式发生变化')}
  const code=result.code??result.Code??result.BaseResp?.StatusCode;
  if(code!==0)throw new AppError('API_UNAVAILABLE','本集播放资源暂不可用');
  const entries=result.data?.['1004']??result.data?.video_model_data??result.data;
  const item=entries?.[episodeId];
  if(!item||typeof item!=='object'||!item.video_model)throw new AppError('API_FORMAT','来源未返回所选分集的播放资源');
  return {code:0,data:item};
 }
 throw new AppError('API_EMPTY','本集播放资源返回空结果，请重试当前集');
}
// Some registered identities stop working after one model lookup. Recovery owns
// a fresh identity for this request, including concurrent background requests.
export async function registeredPlayback(episodeId:string) {
 try{return await registeredPlayerPlayback(episodeId)}
 catch(error){if(!(error instanceof AppError)||error.code!=='API_EMPTY')throw error}

 // The older POST path remains a separate fallback and gets its own identity.
 const identity=await registerPlayer();
 const values={...identity,aid:'8662',app_name:'novelread',version_code:'73932',
  version_name:'7.3.9.32',manifest_version_code:'73932',update_version_code:'73932',
  channel:'update_64',device_platform:'android',os:'android',ssmix:'a',
  device_type:'25053RT47C',device_brand:'Redmi',language:'zh',os_api:'36',
  os_version:'16',resolution:'1280*2772',dpi:'520',ac:'wifi'};
 const body=Buffer.from(JSON.stringify({
  biz_param:{detail_page_version:0,device_level:1,disable_digg_stat:false,
   need_all_video_definition:true,need_mp4_align:false,use_os_player:false,
   use_server_dns:false,video_platform:1024},
  mixed_video_id_map:{'1004':[episodeId]},
 }));
 const request=signPlayback('https://api5-normal-sinfonlineb.fqnovel.com/novel/player/multi_video_model/v1/',values,Date.now(),Math.random,body);
 const response=await fetch(request.url,{
  method:'POST',body,signal:AbortSignal.timeout(25000),headers:{...request.headers,
   'content-type':'application/json; charset=utf-8',
   'x-ss-stub':createHash('md5').update(body).digest('hex').toUpperCase()},
 }).catch(()=>{throw new AppError('NETWORK','播放资源连接失败，请重试当前集')});
 if(!response.ok)throw new AppError('API_HTTP',`播放资源暂不可用（${response.status}）`);
 const text=await response.text();
 if(!text.trim())throw new AppError('API_EMPTY','本集播放资源返回空结果，请重试当前集');
 if(text.length>8*1024*1024)throw new AppError('API_FORMAT','播放资源响应过大');
 let result:any;
 try{result=safeJson(text)}catch{throw new AppError('API_FORMAT','播放资源的数据格式发生变化')}
 const code=result.code??result.Code??result.BaseResp?.StatusCode;
 if(code!==0)throw new AppError('API_UNAVAILABLE','本集播放资源暂不可用');
 const item=result.data?.[episodeId];
 if(!item||typeof item!=='object'||!item.video_model)throw new AppError('API_FORMAT','来源未返回所选分集的播放资源');
 return {code:0,data:item};
}
