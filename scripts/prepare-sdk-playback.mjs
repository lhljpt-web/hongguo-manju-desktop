import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {t as readTar} from 'tar';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(path.join(root,'scripts/sdk-playback-assets.json'),'utf8'));
const stage=path.join(root,'work/sdk-playback',manifest.release);
const destination=path.join(root,'sdk-playback');
const sources=path.join(stage,'sources');
const notices=path.join(destination,'notices');
const hash=data=>createHash('sha256').update(data).digest('hex');
const require=createRequire(import.meta.url);
const licenses=[];
const {getPath7za}=require('app-builder-lib/out/toolsets/7zip.js');
if(process.platform!=='win32'||process.arch!=='x64')throw Error('Windows x64 is required');
await Promise.all([mkdir(stage,{recursive:true}),mkdir(sources,{recursive:true}),mkdir(notices,{recursive:true})]);
const sevenZip=await getPath7za();
function extract(archive,target,member){
 const result=spawnSync(sevenZip,['x',archive,`-o${target}`,...(Array.isArray(member)?member:[member]),'-y'],{windowsHide:true,encoding:'utf8'});
 if(result.status!==0)throw Error('SDK component extraction failed');
}
async function download(asset,directory=stage){
 const file=path.join(directory,asset.file);let bytes;
 try{bytes=await readFile(file)}catch(error){if(error.code!=='ENOENT')throw error}
 if(!bytes){
  const response=await fetch(asset.url??asset.source,{signal:AbortSignal.timeout(180000)});
  if(!response.ok)throw Error(`SDK component download failed: ${asset.file}`);
  bytes=Buffer.from(await response.arrayBuffer());
  if(hash(bytes)!==asset.sha256)throw Error(`SDK component checksum mismatch: ${asset.file}`);
  await writeFile(file,bytes);
 }
 if(hash(bytes)!==asset.sha256)throw Error(`SDK component checksum mismatch: ${asset.file}`);
 return file;
}

const archive=await download(manifest.binaryArchive);
extract(archive,stage,manifest.portable);
extract(path.join(stage,manifest.portable),path.join(stage,'helper'),manifest.helperPath.replaceAll('/','\\'));
const helper=path.join(stage,'helper',manifest.helperPath);
if(hash(await readFile(helper))!==manifest.helperSha256)throw Error('SDK executable checksum mismatch');
await copyFile(helper,path.join(destination,'hongguo-sdk-playback.exe'));
const sourceArchive=await download(manifest.sourceArchive);
extract(sourceArchive,path.join(sources,'upstream'),manifest.sourceMembers.map(name=>name.replaceAll('/','\\')));
for(const dependency of manifest.dependencies){
 const file=await download(dependency,sources);
 let index=0;
 await readTar({file,onReadEntry:entry=>{
  const name=path.posix.basename(entry.path);
  if(entry.type!=='File'||!/(?:licen[cs]e|copying|authors)/i.test(name)){entry.resume();return}
  const chunks=[];entry.on('data',chunk=>chunks.push(chunk));
  entry.on('end',()=>licenses.push({file:`${dependency.name}-${index++}-${name.replaceAll(/[^a-zA-Z0-9._-]/g,'_')}`,bytes:Buffer.concat(chunks)}));
 }});
}
await mkdir(path.join(sources,'licenses'),{recursive:true});
for(const asset of manifest.licenses){
 const file=await download(asset,notices);
 await copyFile(file,path.join(sources,'licenses',asset.file));
}
for(const entry of licenses)await writeFile(path.join(notices,entry.file),entry.bytes);
for(const name of ['README.txt','LICENSE.GPL-3.0.txt'])await copyFile(path.join(root,'build/sdk-playback',name),path.join(notices,name));
await copyFile(path.join(root,'scripts/sdk-playback-assets.json'),path.join(notices,'source-manifest.json'));
await copyFile(path.join(root,'build/sdk-playback/README.txt'),path.join(sources,'README.txt'));
await copyFile(path.join(root,'scripts/sdk-playback-assets.json'),path.join(sources,'source-manifest.json'));
console.log('Pinned Windows SDK executable, notices and corresponding source archives verified.');
