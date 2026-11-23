import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {Signer,Transport} from '../src/main/transport';

test('an exhausted GET route recovers each episode with a separate registered signed POST',async t=>{
 const dir=await mkdtemp(path.join(tmpdir(),'manju-request-session-'));
 try{
  const file=path.join(dir,'player-profile.json');
  const saved=JSON.stringify({device_id:'1123456789012345678',iid:'1123456789012345679',registered:true});
  await writeFile(file,saved);
  let registrations=0;const posts:any[]=[],getIdentities:string[]=[];
  t.mock.method(globalThis,'fetch',async(input:any,init:any)=>{
   const url=new URL(String(input));
   if(url.pathname==='/service/2/device_register/')return Response.json({device_id:String(7123456789012345n+BigInt(++registrations)),install_id:'7123456789012346'});
   if(url.pathname==='/reading/bookapi/video_tab/multi_video_model/v1/'){getIdentities.push(url.searchParams.get('device_id')!);return new Response('')}
   if(url.pathname==='/novel/player/multi_video_model/player/v1')return new Response('');
   posts.push({url,init});const body=JSON.parse(Buffer.from(init.body).toString());const id=body.mixed_video_id_map['1004'][0];
   return Response.json({code:0,data:{[id]:{video_model:{video_id:id}}}});
  });
  const transport=new Transport(new Signer('unused'),dir);
  await Promise.all(['7695629171300502552','7685228691239996440'].map(async id=>{
   const result=await transport.request('/novel/player/video_model/v1/',{video_id:id});assert.equal(result.data.video_model.video_id,id);
  }));
  assert.equal(registrations,4);assert.equal(posts.length,2);
  assert.notEqual(posts[0].url.searchParams.get('device_id'),posts[1].url.searchParams.get('device_id'));
  for(const post of posts)assert.ok(getIdentities.includes(post.url.searchParams.get('device_id')!)===false);
  for(const post of posts){assert.equal(post.url.pathname,'/novel/player/multi_video_model/v1/');assert.ok(new Headers(post.init.headers).has('x-medusa'))}
  assert.equal(await readFile(file,'utf8'),saved);
 }finally{await rm(dir,{recursive:true,force:true})}
});

test('failed registration preserves stored identity and a later user action can retry',async t=>{
 const dir=await mkdtemp(path.join(tmpdir(),'manju-reg-fail-'));
 try{
 const file=path.join(dir,'player-profile.json'),original=JSON.stringify({device_id:'1123456789012345678',iid:'1123456789012345679',registered:true});
 await writeFile(file,original);let registrations=0;
 t.mock.method(globalThis,'fetch',async(input:any)=>{if(new URL(String(input)).pathname==='/service/2/device_register/'){registrations++;return Response.json({device_id:0,install_id:0})}return new Response('')});
 const transport=new Transport(new Signer('unused'),dir);
 for(let i=0;i<2;i++)await assert.rejects(transport.request('/novel/player/video_model/v1/',{video_id:'7695629171300502552'}),{code:'PLAYER_REGISTRATION'});
 assert.equal(registrations,2);assert.equal(await readFile(file,'utf8'),original);
 }finally{await rm(dir,{recursive:true,force:true})}
});

import {signPlayback} from '../src/main/vendor/playback-signing.js';
import {registeredPlayback} from '../src/main/registered-playback';
test('two empty player POSTs recover through one bodyless V5 video_tab GET with the same identity',async t=>{
 let registrations=0;const requests:URL[]=[];const id='7695629171300502552';
 t.mock.method(globalThis,'fetch',async(input:any,init:any)=>{
  const url=new URL(String(input));
  if(url.pathname==='/service/2/device_register/'){registrations++;return Response.json({device_id:'7123456789012345',install_id:'7123456789012346'})}
  requests.push(url);
  if(url.pathname==='/novel/player/multi_video_model/player/v1')return new Response('');
  assert.equal(url.pathname,'/reading/bookapi/video_tab/multi_video_model/v1/');
  assert.equal(init.method,'GET');assert.equal(init.body,undefined);
  const headers=new Headers(init.headers);
  for(const key of ['x-khronos','x-helios','x-medusa'])assert.ok(headers.has(key));
  for(const key of ['content-type','content-encoding','x-ss-stub','x-ss-req-ticket','x-argus','x-ladon'])assert.equal(headers.has(key),false);
  assert.equal(url.searchParams.get('video_id'),id);assert.equal(url.searchParams.get('device_level'),'1');
  assert.equal(url.searchParams.get('need_all_video_definition'),'1');
  return Response.json({code:0,data:{[id]:{video_model:{video_id:id}}}});
 });
 const result=await registeredPlayback(id);assert.equal(result.data.video_model.video_id,id);
 assert.equal(registrations,1);assert.equal(requests.length,3);
 for(const key of ['device_id','iid','cdid'])assert.equal(new Set(requests.map(url=>url.searchParams.get(key))).size,1);
});

test('video_tab refusal, malformed data and wrong episodes stop without legacy recovery',async t=>{
 for(const [response,code]of [[()=>new Response('',{status:429}),'API_HTTP'],[()=>Response.json({code:110001}),'API_UNAVAILABLE'],[()=>new Response('<invalid>'),'API_FORMAT'],[()=>Response.json({code:0,data:{other:{video_model:{}}}}),'API_FORMAT']] as const){
  let requests=0;
  t.mock.method(globalThis,'fetch',async(input:any)=>{
   const url=new URL(String(input));if(url.pathname==='/service/2/device_register/')return Response.json({device_id:'7123456789012345',install_id:'7123456789012346'});
   requests++;if(url.pathname==='/novel/player/multi_video_model/player/v1')return new Response('');
   assert.equal(url.pathname,'/reading/bookapi/video_tab/multi_video_model/v1/');return response();
  });
  await assert.rejects(registeredPlayback('7695629171300502552'),{code});assert.equal(requests,3);t.mock.restoreAll();
 }
});

test('an empty legacy request recovers through a registered gzip V5 player POST',async t=>{
 let registrations=0,gets=0,posts=0;
 t.mock.method(globalThis,'fetch',async(input:any,init:any)=>{
  const url=new URL(String(input));
  if(url.pathname==='/service/2/device_register/'){registrations++;return Response.json({device_id:'7123456789012345',install_id:'7123456789012346'})}
  if(url.pathname==='/novel/player/multi_video_model/player/v1'){
   gets++;assert.equal(init.method,'POST');assert.equal(url.searchParams.get('version_code'),'74332');assert.match(url.searchParams.get('cdid')!,/^[a-f0-9-]{36}$/);
   assert.equal(init.headers['content-encoding'],'gzip');assert.ok(init.headers['x-medusa']);
   const payload=JSON.parse(gunzipSync(init.body).toString());assert.equal(payload.dr_scene,'player');assert.deepEqual(payload.mixed_video_id_map,{'1004':['7695629171300502552']});
   return Response.json({code:0,data:{'1004':{'7695629171300502552':{video_model:{status:10}}}}});
  }
  if(url.pathname==='/novel/player/multi_video_model/v1/')posts++;
  return new Response('');
 });
 const result=await registeredPlayback('7695629171300502552');
 assert.equal(result.data.video_model.status,10);assert.equal(registrations,1);assert.equal(gets,1);assert.equal(posts,0);
});
test('POST signature binds the body and cannot reuse a signature for another episode',()=>{
 const values={device_id:'7123456789012345',iid:'7123456789012346',version_name:'7.3.9.32'};
 const one=signPlayback('https://example.test/model',values,1793912345123,()=>.5,Buffer.from('{"id":"1"}'));
 const two=signPlayback('https://example.test/model',values,1793912345123,()=>.5,Buffer.from('{"id":"2"}'));
 assert.notEqual(one.headers['x-gorgon'],two.headers['x-gorgon']);assert.notEqual(one.headers['x-medusa'],two.headers['x-medusa']);
});
test('POST recovery rejects another episode and stops after a single empty model response',async t=>{
 for(const returned of ['other','empty']){
  let posts=0;
  t.mock.method(globalThis,'fetch',async(input:any)=>{
   const url=new URL(String(input));
   if(url.pathname==='/service/2/device_register/')return Response.json({device_id:'7123456789012345',install_id:'7123456789012346'});
   if(url.pathname==='/reading/bookapi/video_tab/multi_video_model/v1/')return new Response('');
   if(url.pathname==='/novel/player/multi_video_model/player/v1')return new Response('');
   posts++;return returned==='empty'?new Response(''):Response.json({code:0,data:{other:{video_model:{}}}});
  });
  await assert.rejects(registeredPlayback('7695629171300502552'),{code:returned==='empty'?'API_EMPTY':'API_FORMAT'});assert.equal(posts,1);t.mock.restoreAll();
 }
});

test('V5 retries only an empty primary on the alternate host with the same registration',async t=>{
 let registrations=0;const models:URL[]=[];
 t.mock.method(globalThis,'fetch',async(input:any)=>{
  const url=new URL(String(input));
  if(url.pathname==='/service/2/device_register/'){registrations++;return Response.json({device_id:'71234567890123',install_id:'71234567890124'})}
  models.push(url);if(models.length===1)return new Response('');
  return Response.json({code:0,data:{'7695629171300502552':{video_model:{status:10}}}});
 });
 const r=await registeredPlayback('7695629171300502552');assert.equal(r.data.video_model.status,10);assert.equal(registrations,1);assert.equal(models.length,2);
 assert.notEqual(models[0].hostname,models[1].hostname);assert.equal(models[0].searchParams.get('device_id'),models[1].searchParams.get('device_id'));
});

test('V5 HTTP, business and wrong-episode responses stop without another request',async t=>{
 for(const [response,code]of [[()=>new Response('',{status:403}),'API_HTTP'],[()=>Response.json({code:5}),'API_UNAVAILABLE'],[()=>Response.json({code:0,data:{other:{video_model:{}}}}),'API_FORMAT']] as const){
  let models=0;
  t.mock.method(globalThis,'fetch',async(input:any)=>{if(new URL(String(input)).pathname==='/service/2/device_register/')return Response.json({device_id:'7123456789012345',install_id:'7123456789012346'});models++;return response()});
  await assert.rejects(registeredPlayback('7695629171300502552'),{code});assert.equal(models,1);t.mock.restoreAll();
 }
});
