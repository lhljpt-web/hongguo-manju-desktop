import {_electron as electron} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const output=path.resolve(process.env.QA_OUTPUT||`outputs/search-qa-${Date.now()}`);await mkdir(output,{recursive:true});
let app,page;const report={passed:false,events:[]};
try{
 app=await electron.launch({executablePath:process.env.QA_EXECUTABLE||path.resolve('release/win-unpacked/红果漫剧桌面版.exe'),args:[],env:{...process.env,HONGGUO_TEST_DATA:path.join(output,'profile')}});page=await app.firstWindow();
 await page.waitForSelector('.work-card',{timeout:60000});
 await page.getByRole('textbox',{name:'搜索漫剧名称'}).fill('末世');await page.getByRole('button',{name:'搜索',exact:true}).click();await page.waitForSelector('.work-grid .work-card',{timeout:60000});
 const titles=await page.locator('.work-grid .work-card h3').allTextContents();assert.ok(titles.length>0);
 await page.getByRole('button',{name:'发现更多',exact:true}).click();await page.waitForFunction(n=>document.querySelectorAll('.work-grid .work-card').length>n,titles.length,{timeout:60000});
 const more=await page.locator('.work-grid .work-card h3').allTextContents();assert.deepEqual(more.slice(0,titles.length),titles);report.events.push({step:'real-search-ui-pagination',before:titles.length,after:more.length,titles});
 await page.locator('.work-grid .work-card').first().click();
 if(!process.env.QA_SEARCH_ONLY)await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.currentTime>.3&&v.webkitDecodedFrameCount>0&&v.webkitAudioDecodedByteCount>0},{},{timeout:120000});
 else await page.locator('.detail-heading h1').waitFor({timeout:60000});
 const title=await page.locator('.detail-heading h1').innerText();assert.equal(title,titles[0]);report.events.push({step:process.env.QA_SEARCH_ONLY?'searched-work-opens-correct-detail':'searched-work-opens-and-plays',title,...(!process.env.QA_SEARCH_ONLY?await page.locator('video').evaluate(v=>({duration:v.duration,frames:v.webkitDecodedFrameCount,audioBytes:v.webkitAudioDecodedByteCount})): {})});
 await page.screenshot({path:path.join(output,'search-playback.png')});report.passed=true;
}catch(e){report.failure=e.message;if(page)report.text=await page.locator('body').innerText().catch(()=>undefined);process.exitCode=1}
finally{if(app)await app.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report))}
