import test from 'node:test';
import assert from 'node:assert/strict';
import {access,copyFile,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {tmpdir} from 'node:os';
import path from 'node:path';

const script=path.resolve('build/stop-installed-runtime.ps1');
const ffmpeg=path.resolve('runtime-bundle/ffmpeg.exe');
let powershell='powershell.exe';
const run=(args)=>new Promise((resolve,reject)=>{const child=spawn(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',script,...args],{windowsHide:true});let output='';child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);child.once('error',reject);child.once('close',code=>resolve({code,output}))});
const start=async(file)=>{const child=spawn(file,['-nostdin','-hide_banner','-loglevel','error','-re','-f','lavfi','-i','testsrc2=size=16x16:rate=1','-f','null','-'],{windowsHide:true,stdio:'ignore'});await once(child,'spawn');return child};
const stop=async(child)=>{if(child&&child.exitCode===null&&child.signalCode===null){const closed=once(child,'close');child.kill();await closed}};

for(const bits of [64,32])test(`安装预检通过 ${bits} 位 PowerShell 只结束本安装路径组件并保留缓存`, {skip:process.platform!=='win32'},async()=>{
 powershell=bits===32?path.join(process.env.WINDIR,'SysWOW64/WindowsPowerShell/v1.0/powershell.exe'):'powershell.exe';
 await access(script);
 const root=await mkdtemp(path.join(tmpdir(),"manju-install ' qa-"));let residual,sdk,other,main;
 try{
  const install=path.join(root,'app'),runtime=path.join(install,'resources/runtime-bundle'),cache=path.join(root,'HongguoManjuCache');await mkdir(runtime,{recursive:true});await mkdir(cache);
  const sdkDirectory=path.join(install,'resources/sdk-playback');await mkdir(sdkDirectory,{recursive:true});const sdkFile=path.join(sdkDirectory,'hongguo-sdk-playback.exe');await copyFile(ffmpeg,sdkFile);
  const target=path.join(runtime,'ffmpeg.exe');await copyFile(ffmpeg,target);await copyFile(ffmpeg,path.join(install,'ManjuQA.exe'));
  await writeFile(path.join(cache,'complete.mp4'),'complete-keep');await writeFile(path.join(cache,'unfinished.partial.mp4'),'partial-keep');
  const args=['-InstallDirectory',install,'-AppExecutable','ManjuQA.exe','-WaitSeconds','1'];
  main=await start(path.join(install,'ManjuQA.exe'));residual=await start(target);sdk=await start(sdkFile);other=await start(ffmpeg);
  const busy=await run(args);assert.equal(busy.code,10,busy.output);assert.equal(residual.exitCode,null,'do not stop workers before the parent has saved its data');assert.equal(main.exitCode,null,'never force kill the client');
  await stop(main);
  const released=once(residual,'close'),sdkReleased=once(sdk,'close');const success=await run(args);assert.equal(success.code,0,success.output);await released;await Promise.race([sdkReleased,new Promise(resolve=>setTimeout(resolve,1000))]);assert.notEqual(sdk.exitCode,null,'orphaned SDK helper must release the installation');
  assert.equal(other.exitCode,null,'another installation must be untouched');
  assert.equal(await readFile(path.join(cache,'complete.mp4'),'utf8'),'complete-keep');assert.equal(await readFile(path.join(cache,'unfinished.partial.mp4'),'utf8'),'partial-keep');
  assert.equal((await run(args)).code,0,'preflight is idempotent');
 }finally{await stop(main);await stop(residual);await stop(sdk);await stop(other);await rm(root,{recursive:true,force:true})}
});
