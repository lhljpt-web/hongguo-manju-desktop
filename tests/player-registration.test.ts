import test from 'node:test';import assert from 'node:assert/strict';import {createHash,createDecipheriv} from 'node:crypto';import {gunzipSync} from 'node:zlib';import {registerPlayer} from '../src/main/player-registration';
test('anonymous registration accepts observed 15 digit numeric identifiers',async t=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json({device_id:712345678901234,install_id:712345678901235}));
 const {cdid,...identity}=await registerPlayer();assert.deepEqual(identity,{device_id:'712345678901234',iid:'712345678901235'});assert.match(cdid,/^[a-f0-9-]{36}$/);
});

test('anonymous registration preserves cdid and accepts observed 14 digit identifiers',async t=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json({device_id_str:'71234567890123',install_id_str:'71234567890124'}));
 const result=await registerPlayer();assert.equal(result.device_id,'71234567890123');assert.equal(result.iid,'71234567890124');assert.match(result.cdid,/^[a-f0-9-]{36}$/);
});
test('anonymous registration includes the required application signing fingerprint in the encrypted header',async t=>{
 let wire!:Buffer;t.mock.method(globalThis,'fetch',async(_input:any,init:any)=>{wire=Buffer.from(init.body);return Response.json({device_id:'7123456789012345',install_id:'7123456789012346'})});const registered=await registerPlayer();
 const hash=(v:Buffer)=>createHash('sha512').update(v).digest();const seed=Buffer.from('4dd4c2e6b83162090e52b3c7a6733ba41cb2462b829ab58a196b39db57177524f49baf7f08e8d68d26a72e37c1a95a2f1f05a51892aef2949732b62a38aadd58','hex');const key=hash(Buffer.concat([hash(wire.subarray(6,38)),seed]));const decipher=createDecipheriv('aes-128-cbc',key.subarray(0,16),key.subarray(16,32));const plain=Buffer.concat([decipher.update(wire.subarray(38)),decipher.final()]);const payload=JSON.parse(gunzipSync(plain.subarray(64)).toString());assert.equal(payload.header.cdid,registered.cdid);assert.equal(payload.header.sig_hash,'56a962410c494bbaf0b58dba20cae56f');assert.equal(payload.header.device_id,undefined);assert.equal(payload.header.install_id,undefined);
});
