import {createHash,createCipheriv,randomBytes,randomUUID} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {safeJson} from './json';
import {AppError} from './errors';

// Registration wire format: magic + random salt + AES-CBC(SHA512(gzip) + gzip).
// Hash-derived key/IV and the protocol constant are independent of user identity.
const PROTOCOL_SEED=Buffer.from('4dd4c2e6b83162090e52b3c7a6733ba41cb2462b829ab58a196b39db57177524f49baf7f08e8d68d26a72e37c1a95a2f1f05a51892aef2949732b62a38aadd58','hex');
const hash=(data:Uint8Array)=>createHash('sha512').update(data).digest();
function packet(data:Buffer){
 const salt=randomBytes(32),material=hash(Buffer.concat([hash(salt),PROTOCOL_SEED]));
 const cipher=createCipheriv('aes-128-cbc',material.subarray(0,16),material.subarray(16,32));
 return Buffer.concat([Buffer.from([116,99,5,16,0,0]),salt,cipher.update(Buffer.concat([hash(data),data])),cipher.final()]);
}
export async function registerPlayer():Promise<{device_id:string;iid:string}>{
 const device={openudid:randomBytes(8).toString('hex'),clientudid:randomUUID(),cdid:randomUUID()};
 const version='73532';
 const header={display_name:'红果免费短剧',aid:8662,package:'com.phoenix.read',sig_hash:'56a962410c494bbaf0b58dba20cae56f',app_version:'7.3.5.32',version_code:version,manifest_version_code:version,update_version_code:version,channel:'update_64',sdk_version:'3.7.3',sdk_target_version:36,os:'Android',os_version:'16',os_api:36,device_model:'25053RT47C',device_brand:'Redmi',device_manufacturer:'Xiaomi',device_category:'phone',cpu_abi:'arm64-v8a',density_dpi:520,display_density:'mdpi',resolution:'1280x2772',language:'zh',timezone:8,access:'wifi',region:'CN',tz_name:'Asia/Shanghai',tz_offset:28800,...device};
 const params={aid:'8662',package:header.package,version_code:version,manifest_version_code:version,update_version_code:version,channel:header.channel,os_version:'16',os_api:'36',device_brand:'Redmi',language:'zh',app_name:'novelread',version_name:header.app_version,device_type:header.device_model,device_platform:'android',os:'android',tt_data:'a',ssmix:'a',_rticket:String(Date.now()),ts:String(Math.floor(Date.now()/1000)),...device};
 const url=new URL('https://log.snssdk.com/service/2/device_register/');url.search=new URLSearchParams(params).toString();
 const body=packet(gzipSync(Buffer.from(JSON.stringify({magic_tag:'ss_app_log',header,_gen_time:Date.now()}))));
 const response=await fetch(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'content-type':'application/octet-stream;tt-data=a','user-agent':'com.phoenix.read/73532 (Linux; U; Android 16; zh_CN; 25053RT47C)','accept-encoding':'gzip'},body});
 if(!response.ok)throw new AppError('PLAYER_REGISTRATION','播放设备登记失败');
 const text=await response.text();if(text.length>65536)throw new AppError('PLAYER_REGISTRATION','播放设备登记响应异常');
 const value=safeJson(text),device_id=String(value.device_id??''),iid=String(value.install_id??'');
 if(!/^[1-9]\d{15,19}$/.test(device_id)||!/^[1-9]\d{15,19}$/.test(iid))throw new AppError('PLAYER_REGISTRATION','播放设备登记未返回有效标识');
 return {device_id,iid};
}
