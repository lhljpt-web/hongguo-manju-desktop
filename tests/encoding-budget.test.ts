import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {encodingRateArgs} from '../src/main/encoding-budget';

const ffmpeg=path.resolve('runtime-bundle/ffmpeg.exe');
test('high-motion video completes within the output budget in both cache formats',{skip:!existsSync(ffmpeg)},async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'manju-encoding-'));
 const limit=1024*1024,duration=8;
 try{
  for(const fragmented of [false,true]){
   const file=path.join(directory,fragmented?'growing.mp4':'complete.mp4');
   const encode=spawnSync(ffmpeg,['-v','error','-f','lavfi','-i','testsrc2=size=640x360:rate=30,noise=alls=45:allf=t+u','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t',String(duration),'-c:v','libx264','-preset','veryfast','-threads','2','-crf','20',...encodingRateArgs(duration,limit),'-c:a','aac','-movflags',fragmented?'+empty_moov+default_base_moof':'+faststart',...(fragmented?['-frag_duration','500000']:[]),'-fs',String(limit+1),'-y',file],{windowsHide:true,encoding:'utf8',timeout:60000});
   assert.equal(encode.status,0,encode.stderr);
   assert.ok((await stat(file)).size<=limit,'rate control must avoid hitting the hard output cap');
   const decode=spawnSync(ffmpeg,['-v','error','-xerror','-i',file,'-map','0:v:0','-map','0:a:0','-progress','pipe:1','-f','null','-'],{windowsHide:true,encoding:'utf8',timeout:60000});
   assert.equal(decode.status,0,decode.stderr);
   const end=Number([...decode.stdout.matchAll(/out_time_us=(\d+)/g)].at(-1)?.[1])/1e6;
   assert.ok(end>=duration-.2,`full audio/video timeline required, got ${end}`);
  }
 }finally{await rm(directory,{recursive:true,force:true})}
});
