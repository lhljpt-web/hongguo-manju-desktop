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
 const version='73932';
 const header={
  app_version_minor:'7.3.9.32',
  git_hash:'3a88f4e',
  release_build:'b5e187f',
  not_request_sender:0,
  carrier:'CHINA MOBILE',
  mcc_mnc:'46000',
  rom:'eng.root.20231116.160340',
  rom_version:'W528JS release-keys',
  ipv6_list:[],
  sim_region:'cn',
  sim_serial_number:[],
  oaid_may_support:false,
  req_id:randomUUID(),
  device_platform:'android',
  custom:{account_region_src:'fallback',
  host_bit:64,
  account_region:'cn',
  dragon_device_type:'phone'},
  pre_installed_channel:'',
  apk_first_install_time:Date.now(),
  is_system_app:0,
  sdk_flavor:'china',
  guest_mode:0,
  display_name:'红果免费短剧',
  aid:8662,
  package:'com.phoenix.read',
  sig_hash:'56a962410c494bbaf0b58dba20cae56f',
  app_version:'7.3.9.32',
  version_code:version,
  manifest_version_code:version,
  update_version_code:version,
  channel:'update_64',
  sdk_version:'3.7.0-rc.34-fanqie-xiaoshuo',
  sdk_target_version:29,
  os:'Android',
  os_version:'16',
  os_api:36,
  device_model:'25053RT47C',
  device_brand:'Redmi',
  device_manufacturer:'Xiaomi',
  device_category:'phone',
  cpu_abi:'arm64-v8a',
  density_dpi:520,
  display_density:'mdpi',
  resolution:'1280x2772',
  language:'zh',
  timezone:8,
  access:'wifi',
  region:'CN',
  tz_name:'Asia/Shanghai',
  tz_offset:28800,
  ...device
 };
 const url=new URL('https://log5-applog-lf.fqnovel.com/service/2/device_register/?tt_data=a&cronet_version=8d40f833_2026-03-03&ttnet_version=4.2.243.31-douyin&use_store_region_cookie=1');
 const body=packet(gzipSync(Buffer.from(JSON.stringify({magic_tag:'ss_app_log',header,_gen_time:Date.now()}))));
 const response=await fetch(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'content-type':'application/octet-stream;tt-data=a','user-agent':'com.phoenix.read/73532 (Linux; U; Android 16; zh_CN; 25053RT47C)','log-encode-type':'gzip','x-ss-dp':'8662','x-ss-req-ticket':String(Date.now()),'x-vc-bdturing-sdk-version':'4.0.3.cn',lc:'101','sdk-version':'2','passport-sdk-version':'5051452','x-neptune':'-8|50:51:59:30:40:47:49:39','x-ss-stub':createHash('md5').update(body).digest('hex').toUpperCase()},body});
 if(!response.ok)throw new AppError('PLAYER_REGISTRATION','播放设备登记失败');
 const text=await response.text();if(text.length>65536)throw new AppError('PLAYER_REGISTRATION','播放设备登记响应异常');
 let value:any;try{value=safeJson(text)}catch{throw new AppError('PLAYER_REGISTRATION','播放设备登记响应异常')}
 const device_id=String(value.device_id_str||value.device_id||''),iid=String(value.install_id_str||value.install_id||'');
 if(!/^[1-9]\d{15,19}$/.test(device_id)||!/^[1-9]\d{15,19}$/.test(iid))throw new AppError('PLAYER_REGISTRATION','播放设备登记未返回有效标识');
 return {device_id,iid};
}
