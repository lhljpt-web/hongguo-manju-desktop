const fs=require('node:fs/promises');
const path=require('node:path');
const {createHash}=require('node:crypto');
module.exports=async function(context){
 const bundle=path.join(context.appOutDir,'resources','runtime-bundle');
 const manifest=JSON.parse(await fs.readFile(path.join(bundle,'notices','build-manifest.json'),'utf8'));
 for(const name of ['java/bin/java.exe','dependencies.jar','classes/app/hongguo/runtime/SignerBridge.class','ffmpeg.exe']){
  const info=await fs.stat(path.join(bundle,name));if(!info.isFile()||!info.size)throw new Error(`Missing packaged runtime file: ${name}`);
 }
 for(const entry of manifest.sdk){const hash=createHash('sha256').update(await fs.readFile(path.join(bundle,'sdk',entry.filename))).digest('hex');if(hash!==entry.sha256)throw new Error(`SDK hash mismatch: ${entry.filename}`)}
 const sdk=JSON.parse(await fs.readFile(path.join(__dirname,'sdk-playback-assets.json'),'utf8'));
 const helper=path.join(context.appOutDir,'resources','sdk-playback','hongguo-sdk-playback.exe');
 if(createHash('sha256').update(await fs.readFile(helper)).digest('hex')!==sdk.helperSha256)throw new Error('Packaged playback helper checksum mismatch');
 await fs.access(path.join(context.appOutDir,'resources','sdk-playback','notices','README.txt'));
 for(const license of sdk.licenses){
  const file=path.join(context.appOutDir,'resources','sdk-playback','notices',license.file);
  if(createHash('sha256').update(await fs.readFile(file)).digest('hex')!==license.sha256)throw new Error(`Packaged SDK notice checksum mismatch: ${license.file}`);
 }
 console.log('Packaged runtime files and SDK checksums verified.');
};
