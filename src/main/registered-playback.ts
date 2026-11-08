import {createHash} from 'node:crypto';
import {registerPlayer} from './player-registration';
import {signPlayback} from './vendor/playback-signing.js';
import {safeJson} from './json';
import {AppError} from './errors';

// Some registered identities stop working after one model lookup. Recovery owns
// a fresh identity for this request, including concurrent background requests.
export async function registeredPlayback(episodeId:string) {
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
