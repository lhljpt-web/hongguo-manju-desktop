import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Signer,Transport} from '../src/main/transport';

test('an exhausted GET route recovers each episode with a separate registered signed POST',async t=>{
 const dir=await mkdtemp(path.join(tmpdir(),'manju-request-session-'));
 try{
  const file=path.join(dir,'player-profile.json');
  const saved=JSON.stringify({device_id:'1123456789012345678',iid:'1123456789012345679',registered:true});
  await writeFile(file,saved);
  let registrations=0;const posts:any[]=[];
  t.mock.method(globalThis,'fetch',async(input:any,init:any)=>{
   const url=new URL(String(input));
   if(url.pathname==='/service/2/device_register/')return Response.json({device_id:String(7123456789012345n+BigInt(++registrations)),install_id:'7123456789012346'});
   if(init.method==='GET')return new Response('');
   posts.push({url,init});const body=JSON.parse(Buffer.from(init.body).toString());const id=body.mixed_video_id_map['1004'][0];
   return Response.json({code:0,data:{[id]:{video_model:{video_id:id}}}});
  });
  const transport=new Transport(new Signer('unused'),dir);
  await Promise.all(['7695629171300502552','7685228691239996440'].map(async id=>{
   const result=await transport.request('/novel/player/video_model/v1/',{video_id:id});assert.equal(result.data.video_model.video_id,id);
  }));
  assert.equal(registrations,2);assert.equal(posts.length,2);
  assert.notEqual(posts[0].url.searchParams.get('device_id'),posts[1].url.searchParams.get('device_id'));
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
   if(new URL(String(input)).pathname==='/service/2/device_register/')return Response.json({device_id:'7123456789012345',install_id:'7123456789012346'});
   posts++;return returned==='empty'?new Response(''):Response.json({code:0,data:{other:{video_model:{}}}});
  });
  await assert.rejects(registeredPlayback('7695629171300502552'),{code:returned==='empty'?'API_EMPTY':'API_FORMAT'});assert.equal(posts,1);t.mock.restoreAll();
 }
});
