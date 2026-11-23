import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {gzipSync} from 'node:zlib';

test('V5 matches pinned upstream POST and bodyless GET synthetic oracle digests',async t=>{
 t.mock.method(crypto,'randomBytes',size=>Buffer.alloc(size,0x42));t.mock.method(Date,'now',()=>1700000000000);
 const {signPlaybackV5}=await import('../src/main/vendor/playback-v5.js');
 const expected=['ea262a96adb2ba08d70de0d35ea6c259456d969915c454393924c776752e8206','c85852bd4ee5d1cd68c43b59bb1d16258a51e652b68952cd61364d085ae30e2c'];
 for(const [i,id]of ['1000000000000002','1000000000000003'].entries()){
  const result=signPlaybackV5({base:'https://example.test/model',values:{aid:'8662',device_id:'1000000000000001',iid:'1000000000000004',cdid:'00000000-0000-4000-8000-000000000000',version_name:'7.4.3.32',channel:'test',os_version:'12',device_type:'test'},body:gzipSync(Buffer.from(JSON.stringify({id}))),now:1700000000000});
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex'),expected[i]);
 }
 const getExpected=['35d1e700f78996527c335abc0b829b74c45e4d0724d6e96ae7baa53852adf762','3def1ca7e2212ac7a08adc3a4cebdfc98d1735d8ddb2a881c73c5f704b37f163'];
 for(const [i,id]of ['1000000000000002','1000000000000003'].entries()){
  const result=signPlaybackV5({base:'https://example.test/model',values:{aid:'8662',device_id:'1000000000000001',iid:'1000000000000004',cdid:'00000000-0000-4000-8000-000000000000',version_name:'7.4.3.32',channel:'test',os_version:'12',device_type:'test',video_id:id,video_id_type:'0',device_level:'1',need_all_video_definition:'1'},body:null,now:1700000000000});
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex'),getExpected[i]);
 }
});

test('bodyless V5 GET omits body-only headers and still rejects an omitted body argument',async()=>{
 const {signPlaybackV5}=await import('../src/main/vendor/playback-v5.js');
 const options={base:'https://example.test/model',values:{aid:'8662',device_id:'1000000000000001',iid:'1000000000000004',cdid:'00000000-0000-4000-8000-000000000000',version_name:'7.4.3.32',channel:'test',os_version:'12',device_type:'test'},now:1700000000000};
 const result=signPlaybackV5({...options,body:null});
 assert.deepEqual(Object.keys(result.headers).sort(),['x-helios','x-khronos','x-medusa']);
 assert.throws(()=>signPlaybackV5(options),TypeError);
});
