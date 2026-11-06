import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {Signer,Transport} from '../src/main/transport';
test('playback signs the final episode query with the persisted profile without the catalog SDK',async t=>{
 const dir=await mkdtemp(path.join(tmpdir(),'manju-signed-'));try{
 await writeFile(path.join(dir,'player-profile.json'),JSON.stringify({device_id:'1123456789012345678',iid:'1123456789012345679',registered:true}));
 const signer=new Signer('unused');const legacy=t.mock.method(signer,'sign',async()=>{throw Error('wrong SDK')});let sent:any;
 t.mock.method(globalThis,'fetch',async(input:any,init:any)=>{sent={url:new URL(String(input)),init};return Response.json({code:0,data:{video_model_data:{'7695386701635537945':{video_model:{}}}}})});
 await new Transport(signer,dir).request('/novel/player/video_model/v1/',{video_id:'7695386701635537945'});
 const u=sent.url,h=new Headers(sent.init.headers);for(const key of ['x-gorgon','x-medusa','x-argus','x-ladon','x-helios','x-khronos'])assert.ok(h.get(key),`missing ${key}`);assert.equal(u.searchParams.get('device_id'),'1123456789012345678');assert.equal(u.searchParams.get('_rticket'),h.get('x-ss-req-ticket'));assert.equal(u.searchParams.has('ts'),false);assert.equal(sent.init.method,'GET');assert.equal(sent.init.body,undefined);assert.equal(legacy.mock.callCount(),0);
 }finally{await rm(dir,{recursive:true,force:true})}
});

import {signPlayback} from '../src/main/vendor/playback-signing.js';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
test('playback signing matches independent upstream oracle vectors for query bytes and profile binding',async()=>{
 const {vectors}=JSON.parse(await readFile(new URL('./fixtures/playback-signing.json',import.meta.url),'utf8'));
 for(const v of vectors){const signed=signPlayback('https://example.test/model',v.values,v.now,()=>.5);assert.equal(signed.url,v.url);for(const [header,hash] of Object.entries(v.hashes))assert.equal(createHash('sha256').update(signed.headers[header as keyof typeof signed.headers]).digest('hex'),hash);}
});
test('a changed episode and a new request time both produce fresh playback signatures',()=>{
 const values={device_id:'1123456789012345678',iid:'1123456789012345677',version_name:'7.3.5.32',video_id:'7695386701635537945'};const time=1793912345123;
 const original=signPlayback('https://example.test/model',values,time,()=>.5);for(const changed of [signPlayback('https://example.test/model',{...values,video_id:'7695386745180785689'},time,()=>.5),signPlayback('https://example.test/model',values,time+2000,()=>.5)]){assert.notEqual(changed.headers['x-gorgon'],original.headers['x-gorgon']);assert.notEqual(changed.headers['x-medusa'],original.headers['x-medusa']);}
});

test('an empty signed response retries another source host with a fresh signature and the same identity',async t=>{
 const dir=await mkdtemp(path.join(tmpdir(),'manju-retry-'));try{await writeFile(path.join(dir,'player-profile.json'),JSON.stringify({device_id:'1123456789012345678',iid:'1123456789012345679',registered:true}));const requests:{url:URL;headers:Headers}[]=[];
 t.mock.method(globalThis,'fetch',async(input:any,init:any)=>{requests.push({url:new URL(String(input)),headers:new Headers(init.headers)});return requests.length<2?new Response(''):Response.json({code:0,data:{video_model_data:{'7695386701635537945':{video_model:{}}}}})});
 const result=await new Transport(new Signer('unused'),dir).request('/novel/player/video_model/v1/',{video_id:'7695386701635537945'});assert.equal(result.code,0);assert.equal(requests.length,2);assert.notEqual(requests[0].url.host,requests[1].url.host);assert.equal(requests[0].url.searchParams.get('device_id'),requests[1].url.searchParams.get('device_id'));assert.notEqual(requests[0].headers.get('x-medusa'),requests[1].headers.get('x-medusa'));for(const r of requests)assert.equal(r.url.searchParams.get('_rticket'),r.headers.get('x-ss-req-ticket'));
 }finally{await rm(dir,{recursive:true,force:true})}
});

import crypto from 'node:crypto';
test('playback signing remains correct when the desktop crypto provider does not support SM3',async t=>{
 const native=crypto.createHash.bind(crypto);t.mock.method(crypto,'createHash',((name:string,...args:any[])=>{if(name==='sm3')throw Error('unsupported digest in Electron');return native(name,...args as [])}) as typeof crypto.createHash);
 const {vectors}=JSON.parse(await readFile(new URL('./fixtures/playback-signing.json',import.meta.url),'utf8'));const v=vectors[0];const signed=signPlayback('https://example.test/model',v.values,v.now,()=>.5);assert.equal(native('sha256').update(signed.headers['x-medusa']).digest('hex'),v.hashes['x-medusa']);
});
