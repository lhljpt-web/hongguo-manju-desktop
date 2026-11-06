// Actual production main, preload, renderer and IPC; only ContentProvider is replaced.
// Run after `npm run build`. The QA runner deliberately does not rebuild shared dist.
import {_electron as electron} from 'playwright-core';
import {build} from 'esbuild';
import {mkdir,writeFile,readFile,cp,copyFile,symlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';

const output=path.resolve(process.env.QA_OUTPUT||`outputs/continuous-playback-qa-${Date.now()}`);
const main=path.join(output,'main/main.cjs'),profile=path.join(output,'profile');
const duration=6;
const ids=['7695370827507698701','7695370827507698702','7695370827507698703'];
const titles=['云海来信第一季','云海来信第二季','长街末世冒险'];
const works=ids.map((id,n)=>({id,title:titles[n],cover:'',description:'末世冒险，本地 H264/AAC 验收素材',categories:['冒险'],total:2,episodes:Array.from({length:2},(_,i)=>({id:String(7695386527160863700n+BigInt(n*10+i)),order:i+1,duration}))}));
const events=[],errors=[];
let app,page,snapshot;
await mkdir(path.dirname(main),{recursive:true});await mkdir(profile,{recursive:true});
const clips={};
for(const [quality,size] of [['720p','1280x720'],['480p','854x480']]){
 const file=path.join(output,`fixture-${quality}.mp4`);clips[quality]=file;
 execFileSync(path.resolve('runtime-bundle/ffmpeg.exe'),['-hide_banner','-loglevel','error','-y','-f','lavfi','-i',`testsrc2=s=${size}:r=24`,'-f','lavfi','-i','sine=frequency=440:sample_rate=44100','-t',String(duration),'-c:v','libx264','-preset','ultrafast','-crf','29','-g','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','64k','-movflags','+faststart',file],{stdio:'pipe',windowsHide:true});
}
// Historical B2 must never win over an automatic/manual recommendation first-episode start.
await writeFile(path.join(profile,'library.json'),JSON.stringify({favorites:[],history:[{seriesId:ids[1],episodeId:works[1].episodes[1].id,order:2,time:2,duration,updatedAt:Date.now(),work:works[1]}]}));
const provider=String.raw`
const fs=require('node:fs/promises'),http=require('node:http');
export class ProviderError extends Error{constructor(code,message){super(message);this.code=code}}
const works=${JSON.stringify(works)},files=${JSON.stringify(clips)};
const fixture={delayMs:0,inFlight:0,failRecommendations:false,requests:[],resources:[],active:0,maxActive:0};global.fixture=fixture;
let server,bytes;
const ready=(async()=>{
 bytes=Object.fromEntries(await Promise.all(Object.entries(files).map(async([k,v])=>[k,await fs.readFile(v)])));
 server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://local'),quality=url.searchParams.get('quality')==='480p'?'480p':'720p',body=bytes[quality],etag='"qa-'+quality+'-v1"';
  const match=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let start=match?Number(match[1]):0,end=match&&match[2]?Number(match[2]):body.length-1;
  if(req.headers['if-range']&&req.headers['if-range']!==etag)start=0;
  end=Math.min(end,body.length-1);if(start>=body.length){res.writeHead(416,{'Content-Range':'bytes */'+body.length});res.end();return}
  const ranged=!!match&&(!req.headers['if-range']||req.headers['if-range']===etag);
  fixture.requests.push({path:url.pathname,quality,range:req.headers.range||'',status:ranged?206:200});fixture.active++;fixture.maxActive=Math.max(fixture.maxActive,fixture.active);
  let timer;res.once('close',()=>{fixture.active--;clearTimeout(timer)});
  res.writeHead(ranged?206:200,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','ETag':etag,'Content-Length':end-start+1,...(ranged?{'Content-Range':'bytes '+start+'-'+end+'/'+body.length}:{})});
  if(req.method==='HEAD'){res.end();return}
  let cursor=start;const send=()=>{if(res.destroyed)return;const next=Math.min(cursor+65536,end+1);res.write(body.subarray(cursor,next));cursor=next;if(cursor>end){res.end();return}timer=setTimeout(send,25)};send();
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return bytes;
})();
async function recommendationDelay(){const delay=fixture.delayMs;fixture.inFlight++;try{if(delay)await new Promise(resolve=>setTimeout(resolve,delay));if(fixture.failRecommendations)throw new ProviderError('QA_SOURCE_OFFLINE','推荐来源暂时不可用')}finally{fixture.inFlight--}}
export class ContentProvider{
 constructor(){}
 async catalog(){await ready;await recommendationDelay();return {items:works,hasMore:false,nextOffset:3,label:'本地连播验收',source:'fixture'}}
 async search(){return this.catalog()}
 async getSeries(id){await ready;const work=works.find(item=>item.id===id);if(!work)throw new ProviderError('NOT_FOUND','本地作品不存在');return structuredClone(work)}
 async resolveShare(text){return this.getSeries(text.includes('A2')?works[1].id:text.includes('similar')?works[2].id:works[0].id)}
 async getResource(id,quality='auto'){await ready;const selected=quality==='480p'||quality==='360p'?'480p':'720p';fixture.resources.push({id,requested:quality,selected});return {episodeId:id,duration:${duration},definition:selected,availableQualities:['720p','480p'],codec:'h264',encrypted:false,size:bytes[selected].length,url:'http://127.0.0.1:'+server.address().port+'/'+id+'?quality='+selected+'&token=QA_SECRET_DO_NOT_EXPORT'}}
}
`;
await build({entryPoints:['src/main/main.ts'],outfile:main,bundle:true,platform:'node',format:'cjs',external:['electron'],logLevel:'silent',plugins:[{name:'continuous-playback-fixture',setup(builder){builder.onLoad({filter:/[\\/]main[\\/]provider\.ts$/},()=>({contents:provider,loader:'js'}))}}]});
await copyFile('dist/main/preload.cjs',path.join(output,'main/preload.cjs'));
await cp('dist/renderer',path.join(output,'renderer'),{recursive:true});
await symlink(path.resolve('runtime-bundle'),path.join(output,'main/runtime-bundle'),'junction');
const record=(step,data={})=>{events.push({step,...data});console.log(JSON.stringify(events.at(-1)))};
const state=async()=>{const result=await page.evaluate(()=>window.desktop.cacheState());assert.equal(result.ok,true,result.error?.message);snapshot=result.data;return snapshot};
const until=async(check,label,timeout=45000)=>{
 const deadline=Date.now()+timeout;while(Date.now()<deadline){const value=await state();if(check(value))return value;await page.waitForTimeout(100)}
 throw new Error(`Timeout: ${label}; cache=${JSON.stringify(snapshot)}`);
};
const launch=async()=>{
 app=await electron.launch({executablePath:path.resolve('node_modules/electron/dist/electron.exe'),args:[main],env:{...process.env,HONGGUO_TEST_DATA:profile}});
 page=await app.firstWindow();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));
 await page.locator('.work-grid .work-card').first().waitFor();
};
const quit=async()=>{if(!app)return;const instance=app;app=null;const closed=instance.waitForEvent('close',{timeout:30000});await instance.evaluate(({app})=>{setTimeout(()=>app.quit(),0)});await closed};
const ready=async(seriesIndex,order,{pause=true}={})=>{
 await page.waitForFunction(({title,order})=>document.querySelector('.detail-heading h1')?.textContent===title&&document.querySelector('.player')?.getAttribute('aria-label')===`第${order}集播放器`&&(()=>{const v=document.querySelector('video');return v&&v.readyState>=3&&!v.paused&&v.currentTime>.03&&v.videoWidth>0&&v.webkitDecodedFrameCount>0})(),{title:titles[seriesIndex],order},{timeout:60000});
 if(pause)await page.locator('video').evaluate(video=>video.pause());
 return page.locator('video').evaluate(video=>({time:video.currentTime,duration:video.duration,width:video.videoWidth,height:video.videoHeight,rate:video.playbackRate,volume:video.volume,muted:video.muted,frames:video.webkitDecodedFrameCount,audioBytes:video.webkitAudioDecodedByteCount}));
};
const open=async(seriesIndex,order=1)=>{if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());await page.getByRole('button',{name:'发现',exact:true}).click();await page.locator('.work-grid .work-card').filter({hasText:titles[seriesIndex]}).click();return ready(seriesIndex,order)};
const finish=async()=>{
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&Number.isFinite(v.duration)&&v.duration>0&&v.buffered.length&&v.buffered.end(v.buffered.length-1)>=v.duration-.2},{},{timeout:45000});
 await page.locator('video').evaluate(video=>{video.currentTime=video.duration-.12;void video.play()});
};
const selectEpisode=async(seriesIndex,order)=>{if(await page.locator('.player').getAttribute('aria-label')===`第${order}集播放器`)await page.locator('video').evaluate(v=>v.play());else await page.getByRole('button',{name:`播放第${order}集`,exact:true}).click();return ready(seriesIndex,order)};
const assertPrefs=async()=>{const value=await page.locator('video').evaluate(v=>({rate:v.playbackRate,volume:v.volume,muted:v.muted}));assert.equal(value.rate,2);assert.ok(Math.abs(value.volume-.35)<.001);assert.equal(value.muted,true);return value};
const reveal=async()=>page.locator('.player-surface').hover({position:{x:20,y:20}});
const setAutoNext=async(value)=>{const input=page.getByRole('checkbox');if(await input.isChecked()!==value)await page.locator('.now-playing .toggle-label').click();assert.equal(await input.isChecked(),value)};
try{
 await launch();
 await page.getByRole('button',{name:'缓存中心',exact:true}).click();
 await page.getByRole('spinbutton',{name:'缓存总额度 GiB',exact:true}).fill('0.25');
 await page.getByRole('spinbutton',{name:'总下载限速 MiB/s',exact:true}).fill('2');
 // A poll must not overwrite an unsaved form edit.
 await page.waitForTimeout(1200);assert.equal(await page.getByRole('spinbutton',{name:'缓存总额度 GiB',exact:true}).inputValue(),'0.25');
 await page.getByRole('button',{name:'保存设置',exact:true}).click();await until(s=>s.limits?.maxGiB===.25&&s.limits?.bandwidthMiB===2,'limits saved');
 await page.getByRole('textbox',{name:'后台缓存分享链接',exact:true}).fill('fixture-A1');await page.getByRole('button',{name:'添加缓存',exact:true}).click();
 await until(s=>s.tasks.some(t=>t.series.id===ids[0]&&t.registered),'A1 registered');
 await page.getByRole('combobox',{name:`${titles[0]}缓存优先级`,exact:true}).selectOption('high');await until(s=>s.tasks.find(t=>t.series.id===ids[0])?.priority==='high','priority saved');
 record('cache form edits survive polling; limits and per-series priority saved via production IPC');
 await page.getByRole('button',{name:'发现',exact:true}).click();await page.locator('.work-grid .work-card').filter({hasText:titles[0]}).click();
 const initial=await ready(0,1);assert.ok(initial.audioBytes>0);record('actual H264/AAC first episode decodes',initial);
 const quality=page.getByRole('combobox',{name:'画质上限',exact:true});assert.deepEqual(await quality.locator('option').evaluateAll(options=>options.map(option=>option.value)),['auto','720p','480p']);
 await quality.selectOption('480p');const low=await ready(0,1);assert.equal(low.width,854);assert.equal(await page.locator('.definition-label').innerText(),'480p');
 assert.ok((await app.evaluate(()=>global.fixture.resources)).some(r=>r.requested==='480p'&&r.selected==='480p'));
 record('quality selector uses actual available choices and reloads the requested 480p source',low);
 await page.getByRole('combobox',{name:'播放倍速',exact:true}).selectOption('2');await page.getByRole('slider',{name:'音量',exact:true}).fill('0.35');await page.getByRole('button',{name:'静音',exact:true}).click();
 assert.equal(await page.getByRole('checkbox').isChecked(),true);await assertPrefs();
 await page.getByRole('button',{name:'下一集',exact:true}).click();await ready(0,2);await assertPrefs();
 await page.getByRole('button',{name:'切换全屏',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.evaluate(()=>{window.qaFullscreen=document.fullscreenElement});
 await finish();const nextSeason=await ready(1,1);await assertPrefs();assert.equal(await page.evaluate(()=>document.fullscreenElement===window.qaFullscreen),true);
 assert.ok(nextSeason.time<1,'next season starts at first episode, not historical B2');
 await until(s=>s.tasks.some(task=>task.series.id===ids[1]&&task.registered),'next season registered');
 assert.equal(snapshot.tasks.filter(task=>task.series.id===ids[1]).length,1);
 record('automatic season transition starts B1 despite B2 history; same fullscreen element, volume, mute, 2x and autoNext persist',nextSeason);
 await reveal();const pipSupported=await page.evaluate(()=>document.pictureInPictureEnabled);
 if(pipSupported){await page.getByRole('button',{name:'画中画',exact:true}).click();await page.waitForFunction(()=>!!document.pictureInPictureElement);await page.getByRole('button',{name:'退出画中画',exact:true}).click();await page.waitForFunction(()=>!document.pictureInPictureElement);record('actual Picture-in-Picture enter and exit succeeds')}
 else{assert.equal(await page.getByRole('button',{name:'画中画',exact:true}).isDisabled(),true);record('Picture-in-Picture explicitly unsupported and disabled')}
 if(!await page.evaluate(()=>!!document.fullscreenElement)){await page.getByRole('button',{name:'切换全屏',exact:true}).click();await page.waitForFunction(()=>document.fullscreenElement===window.qaFullscreen)}
 await reveal();await page.getByRole('button',{name:'下一集',exact:true}).click();await ready(1,2);await finish();
 await page.locator('.season-end-overlay .end-recommendations button').filter({hasText:titles[2]}).waitFor();assert.ok(await page.locator('.end-recommendations button').count()<=6);assert.equal(await page.evaluate(()=>document.fullscreenElement===window.qaFullscreen),true);
 await page.screenshot({path:path.join(output,'fullscreen-series-ended.png')});
 await page.locator('.season-end-overlay .end-recommendations button').filter({hasText:titles[2]}).click();await ready(2,1);await assertPrefs();assert.equal(await page.evaluate(()=>document.fullscreenElement===window.qaFullscreen),true);
 record('final season displays similar cards inside fullscreen; clicking opens correct work at first episode and keeps fullscreen');
 await open(0,2);await setAutoNext(false);await selectEpisode(0,2);await finish();await page.locator('.season-end-overlay').waitFor();await page.waitForTimeout(800);assert.equal(await page.locator('.detail-heading h1').innerText(),titles[0]);assert.equal(await page.locator('.player').getAttribute('aria-label'),'第2集播放器');
 record('autoNext off prevents crossing into the known next season');
 await setAutoNext(true);await page.getByRole('combobox',{name:'睡眠定时',exact:true}).selectOption('episodes-1');await page.getByRole('button',{name:'重播本集',exact:true}).click();await ready(0,2);await finish();await page.waitForFunction(()=>[...document.querySelectorAll('[aria-label="睡眠定时"]')].some(s=>s.value==='stopped'));await page.waitForTimeout(800);assert.equal(await page.locator('.detail-heading h1').innerText(),titles[0]);
 record('sleep after current episode reaches terminal stopped state and blocks next-season autoplay');
 // Repeat with a recommendation refresh still in flight at the ending boundary.
 await page.getByRole('button',{name:'重播本集',exact:true}).click();await ready(0,2);await app.evaluate(()=>{global.fixture.delayMs=1200});
 await page.getByRole('combobox',{name:'睡眠定时',exact:true}).selectOption('episodes-1');await page.getByRole('button',{name:'重新获取推荐',exact:true}).click();
 assert.ok(await app.evaluate(()=>global.fixture.inFlight)>0);await finish();await page.waitForFunction(()=>[...document.querySelectorAll('[aria-label="睡眠定时"]')].some(s=>s.value==='stopped'));
 await page.getByRole('button',{name:'重新获取推荐',exact:true}).waitFor({timeout:20000});assert.equal(await page.locator('.detail-heading h1').innerText(),titles[0]);await app.evaluate(()=>{global.fixture.delayMs=0});
 record('late recommendation result cannot reopen terminal sleep state or trigger cross-season playback');
 // Source failure must be explicit and retryable, never reported as no next season.
 await app.evaluate(()=>{global.fixture.failRecommendations=true});await page.getByRole('button',{name:'重新获取推荐',exact:true}).click();await page.getByRole('button',{name:'重试查找后续作品',exact:true}).waitFor();await page.locator('.season-end-overlay').getByText(/推荐来源暂时不可用/).waitFor();assert.equal(await page.locator('.season-end-overlay').getByText('本季已完结',{exact:true}).count(),0);
 await app.evaluate(()=>{global.fixture.failRecommendations=false});await page.getByRole('button',{name:'重试查找后续作品',exact:true}).click();await page.locator('.season-end-overlay').getByRole('button',{name:`播放 ${titles[1]}`,exact:true}).waitFor();
 record('recommendation source failure is labeled as failure; retry restores a manually selectable next season without restarting sleep');
 await page.getByRole('button',{name:'重播本集',exact:true}).click();await ready(0,2);await assertPrefs();assert.equal(await page.getByRole('combobox',{name:'睡眠定时',exact:true}).inputValue(),'off');await setAutoNext(false);
 record('explicit replay resumes after terminal sleep and clears session stop; autoNext disabled for persisted preference check');
 const diagnosticFile=path.join(output,'diagnostics.json');
 await app.evaluate(({dialog})=>{dialog.showSaveDialog=async()=>({canceled:true})});await page.getByRole('button',{name:'导出诊断',exact:true}).click();
 await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file})},diagnosticFile);
 // Create an actual IPC diagnostic error containing no user-controlled text.
 const invalid=await page.evaluate(()=>window.desktop.videoQuality('invalid-quality'));assert.equal(invalid.ok,false);
 await page.getByRole('button',{name:'导出诊断',exact:true}).click();await page.getByRole('status').filter({hasText:'诊断信息已导出'}).waitFor();
 const diagnosticText=await readFile(diagnosticFile,'utf8'),diagnostic=JSON.parse(diagnosticText);
 assert.deepEqual(Object.keys(diagnostic).sort(),['arch','events','platform','schema','version']);assert.equal(diagnostic.schema,1);assert.ok(diagnostic.events.length>0);
 for(const event of diagnostic.events){assert.ok(Object.keys(event).every(key=>['at','stage','code','ms'].includes(key)));assert.match(event.code,/^[A-Z0-9_]{1,50}$/);assert.ok(Number.isFinite(Date.parse(event.at)))}
 assert.ok(!diagnosticText.includes('QA_SECRET_DO_NOT_EXPORT'));assert.ok(!diagnosticText.includes(profile));assert.ok(!/https?:|authorization|cookie|spade|token=/i.test(diagnosticText));
 record('diagnostic save dialog supports cancel; exported JSON has strict whitelist and contains no URL, token, path or key material',{events:diagnostic.events.length});
 // Stop playback immediately before orderly app quit, avoiding an unrelated natural ending.
 await page.locator('video').evaluate(video=>video.pause());await quit();await launch();
 await page.getByRole('button',{name:'缓存中心',exact:true}).click();await until(s=>s.limits?.maxGiB===.25&&s.limits?.bandwidthMiB===2,'restart limits persisted');assert.equal(snapshot.tasks.find(task=>task.series.id===ids[0])?.priority,'high');
 await page.waitForFunction(()=>document.querySelector('[aria-label="缓存总额度 GiB"]')?.value==='0.25'&&document.querySelector('[aria-label="总下载限速 MiB/s"]')?.value==='2');assert.equal(await page.getByRole('spinbutton',{name:'缓存总额度 GiB',exact:true}).inputValue(),'0.25');assert.equal(await page.getByRole('spinbutton',{name:'总下载限速 MiB/s',exact:true}).inputValue(),'2');
 await page.getByRole('button',{name:'发现',exact:true}).click();await page.locator('.work-grid .work-card').filter({hasText:titles[0]}).click();await ready(0,2);await assertPrefs();assert.equal(await page.getByRole('combobox',{name:'画质上限',exact:true}).inputValue(),'480p');assert.equal(await page.getByRole('checkbox').isChecked(),false);assert.equal(await page.getByRole('combobox',{name:'睡眠定时',exact:true}).inputValue(),'off');
 record('orderly restart preserves quality, volume, mute, 2x, autoNext, limits and priority; sleep remains session-only');
 assert.deepEqual(errors,[]);await page.screenshot({path:path.join(output,'restart-preferences.png')});
 await page.locator('video').evaluate(video=>video.pause());await quit();
 const libraryFile=path.join(profile,'library.json'),library=JSON.parse(await readFile(libraryFile,'utf8'));
 const missing={...library.history.find(item=>item.seriesId===ids[0]),episodeId:'7695386582622145561',order:78,time:12,duration:45};
 library.history=library.history.map(item=>item.seriesId===ids[0]?missing:item);await writeFile(libraryFile,JSON.stringify(library));
 await launch();await page.locator('.work-grid .work-card').filter({hasText:titles[0]}).click();
 await page.getByText('暂时无法继续上次分集',{exact:true}).waitFor();assert.equal(await page.locator('video').count(),0);
 const unchanged=await page.evaluate(()=>window.desktop.library());assert.equal(unchanged.data.history.find(item=>item.seriesId===missing.seriesId)?.episodeId,missing.episodeId);
 await page.screenshot({path:path.join(output,'missing-saved-episode.png')});
 await page.getByRole('button',{name:'播放第1集',exact:true}).click();await ready(0,1);
 record('a removed saved episode shows a clear prompt without autoplay or history replacement; manual selection still plays');
 await writeFile(path.join(output,'report.json'),JSON.stringify({passed:true,events,errors,snapshot},null,2));console.log(JSON.stringify({passed:true,output,events},null,2));
}catch(error){
 const text=await page?.locator('body').innerText().catch(()=>null);await page?.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
 await writeFile(path.join(output,'report.json'),JSON.stringify({passed:false,events,errors,snapshot,failure:error.stack||error.message,text},null,2));console.error(JSON.stringify({passed:false,output,failure:error.message},null,2));throw error;
}finally{await quit()}
