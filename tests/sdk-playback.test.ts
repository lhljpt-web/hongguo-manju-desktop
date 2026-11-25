import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {SdkPlayback} from '../src/main/sdk-playback';
import {MediaCache} from '../src/main/media';
import {ContentProvider} from '../src/main/provider';
import {Signer,Transport} from '../src/main/transport';

const VID='7709765743432174616';
async function fixture(source:string,run:(sdk:SdkPlayback,dir:string)=>Promise<void>,timeout=5000){
 const dir=await mkdtemp(path.join(tmpdir(),'manju-sdk-'));
 const file=path.join(dir,'helper.cjs');await writeFile(file,source);
 const sdk=new SdkPlayback(process.execPath,path.join(dir,'anonymous'),[file],timeout);
 try{await run(sdk,dir)}finally{await sdk.shutdown();await rm(dir,{recursive:true,force:true})}
}
test('SDK subprocess binds its model to the exact requested episode and isolated cache',async()=>fixture(`
 const fs=require('node:fs'),path=require('node:path');
 fs.writeFileSync(path.join(__dirname,'args.json'),JSON.stringify(process.argv.slice(2)));
 console.log(JSON.stringify({ok:true,models:{'${VID}':{video_list:[],status:10}},userAgent:'test'}));
`,async(sdk,dir)=>{
 assert.deepEqual(await sdk.resolve(VID),{code:0,data:{video_model:{video_list:[],status:10}}});
 assert.deepEqual(JSON.parse(await readFile(path.join(dir,'args.json'),'utf8')),['--videos',VID,'--cache',path.join(dir,'anonymous')]);
}));
test('SDK refuses a model for another episode',async()=>fixture(`console.log(JSON.stringify({ok:true,models:{'7705003745142131736':{status:10}}}))`,async sdk=>{
 await assert.rejects(sdk.resolve(VID),{code:'SDK_MODEL'});
}));
test('SDK error output never becomes a user message',async()=>fixture(`console.error('private-key-and-url');console.log(JSON.stringify({ok:false,error:'private-key-and-url'}));process.exitCode=1`,async sdk=>{
 await assert.rejects(sdk.resolve(VID),(error:any)=>error.code==='SDK_FAILED'&&!String(error).includes('private-key-and-url'));
}));
test('SDK timeout terminates an owned process tree',async()=>fixture(`
 const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
 const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore',windowsHide:true});
 fs.writeFileSync(path.join(__dirname,'pid'),String(child.pid));setInterval(()=>{},1000);
`,async(sdk,dir)=>{
 await assert.rejects(sdk.resolve(VID),{code:'SDK_TIMEOUT'});
 const pid=Number(await readFile(path.join(dir,'pid'),'utf8'));
 assert.throws(()=>process.kill(pid,0));
},1500));
test('SDK bounds subprocess output',async()=>fixture(`process.stdout.write('x'.repeat(600000));setInterval(()=>{},1000)`,async sdk=>{
 await assert.rejects(sdk.resolve(VID),{code:'SDK_OUTPUT'});
}));
test('SDK shutdown cancels active work and rejects later requests',async()=>fixture(`require('node:fs').writeFileSync(require('node:path').join(__dirname,'ready'),'1');setInterval(()=>{},1000)`,async(sdk,dir)=>{
 const result=assert.rejects(sdk.resolve(VID),{code:'CANCELLED'});
 for(let i=0;i<100;i++){try{await readFile(path.join(dir,'ready'));break}catch{await delay(20)}}
 assert.equal(await readFile(path.join(dir,'ready'),'utf8'),'1');
 await sdk.shutdown();await result;
 await assert.rejects(sdk.resolve(VID),{code:'CANCELLED'});
}));
test('cancelling a single request stops its helper without stopping the service',async()=>fixture(`require('node:fs').writeFileSync(require('node:path').join(__dirname,'ready'),'1');setInterval(()=>{},1000)`,async(sdk,dir)=>{
 const controller=new AbortController();const result=assert.rejects(sdk.resolve(VID,controller.signal),{code:'CANCELLED'});
 for(let i=0;i<100;i++){try{await readFile(path.join(dir,'ready'));break}catch{await delay(20)}}
 assert.equal(await readFile(path.join(dir,'ready'),'utf8'),'1');controller.abort();await result;
 await writeFile(path.join(dir,'helper.cjs'),`console.log(JSON.stringify({ok:true,models:{'${VID}':{status:10}}}))`);
 assert.equal((await sdk.resolve(VID)).data.video_model.status,10);
}));
test('media cancellation reaches the actual SDK subprocess through provider and transport',async()=>fixture(`require('node:fs').writeFileSync(require('node:path').join(__dirname,'pid'),String(process.pid));setInterval(()=>{},1000)`,async(sdk,dir)=>{
 const provider=new ContentProvider(new Transport(new Signer('unused'),dir,sdk));
 const media=new MediaCache(path.join(dir,'media'),'unused',(id,quality,signal)=>provider.getResource(id,quality,signal));
 await media.init();
 try{
  const result=assert.rejects(media.prepare(VID),{code:'CANCELLED'});
  for(let i=0;i<100;i++){try{await readFile(path.join(dir,'pid'));break}catch{await delay(20)}}
  const pid=Number(await readFile(path.join(dir,'pid'),'utf8'));await media.close();await result;
  for(let i=0;i<100;i++){try{process.kill(pid,0);await delay(20)}catch{break}}
  assert.throws(()=>process.kill(pid,0));
 }finally{await media.close()}
}));
