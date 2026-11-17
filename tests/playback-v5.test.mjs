import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {gzipSync} from 'node:zlib';

test('V5 matches pinned upstream synthetic oracle digests',async t=>{
 t.mock.method(crypto,'randomBytes',size=>Buffer.alloc(size,0x42));t.mock.method(Date,'now',()=>1700000000000);
 const {signPlaybackV5}=await import('../src/main/vendor/playback-v5.js');
 const expected=['ea262a96adb2ba08d70de0d35ea6c259456d969915c454393924c776752e8206','c85852bd4ee5d1cd68c43b59bb1d16258a51e652b68952cd61364d085ae30e2c'];
 for(const [i,id]of ['1000000000000002','1000000000000003'].entries()){
  const result=signPlaybackV5({base:'https://example.test/model',values:{aid:'8662',device_id:'1000000000000001',iid:'1000000000000004',cdid:'00000000-0000-4000-8000-000000000000',version_name:'7.4.3.32',channel:'test',os_version:'12',device_type:'test'},body:gzipSync(Buffer.from(JSON.stringify({id}))),now:1700000000000});
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex'),expected[i]);
 }
});
