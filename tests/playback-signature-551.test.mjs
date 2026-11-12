import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {signPlayer} from '../src/main/vendor/playback-signature-551.js';

test('551 signing matches pinned upstream oracle digests for a synthetic GET and body',()=>{
 const bodies=[null,Buffer.from(JSON.stringify({synthetic:true}))];
 // SHA-256 of upstream 3f5927d headers; no real identities or signatures stored.
 const expected=['403dfe7b4e5413af904539ea11684673ebf4de221beb77f22acda7299bce6182','98e6201c6adc86ac8eb09b9660f9d8bc74b899feba0c782ed02674b05269d65d'];
 for(const [index,body]of bodies.entries()){
  const headers=signPlayer({query:'aid=8662&device_id=1000000000000001&version_name=7.3.9.32&video_id=1000000000000002',body,ts:1700000000,randField:-12345,ladonRandom:Buffer.from('01020304','hex')});
  assert.equal(createHash('sha256').update(JSON.stringify(headers)).digest('hex'),expected[index]);
 }
});

test('551 Argus binds the exact encoded query and body',()=>{
 const sign=(query,body)=>signPlayer({query,body,ts:1700000000,randField:12345,ladonRandom:Buffer.alloc(4)});
 const one=sign('aid=8662&video_id=1000000000000001',null);
 const two=sign('aid=8662&video_id=1000000000000002',null);
 assert.notEqual(one['x-argus'],two['x-argus']);
 assert.notEqual(one['x-argus'],sign('aid=8662&video_id=1000000000000001',Buffer.from('body'))['x-argus']);
});
