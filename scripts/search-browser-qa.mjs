import {spawn} from 'node:child_process';import {build} from 'esbuild';import {mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const root=path.resolve(`outputs/search-browser-qa-${Date.now()}`);await mkdir(root,{recursive:true});
const checks=async()=>{
 const events=[];
 const first=await globalThis.searchProvider.search('末世');
 if(!first.items.length||!first.hasMore)throw Error('missing first page');
 const next=await globalThis.searchProvider.search('末世',first.nextOffset);
 if(!next.items.length||JSON.stringify(first.items.map(w=>w.id))===JSON.stringify(next.items.map(w=>w.id)))throw Error('repeated page');
 events.push({name:'live-pagination',first:first.items.length,next:next.items.length});
 const target=await globalThis.searchProvider.search('到末世十年后竟然遇到四个尸王');
 if(!target.items.some(w=>w.id==='7695370827507698713'))throw Error('known work missing');
 events.push({name:'known-work',match:true});
 const pending=globalThis.searchProvider.search('重生').catch(e=>({code:e.code}));setTimeout(()=>globalThis.searchBrowser.close(),25);
 if((await pending).code!=='CANCELLED')throw Error('search did not cancel');
 events.push({name:'close-cancels-search'});return events;
};
await build({stdin:{contents:`import {app,BrowserWindow} from 'electron';import {writeFile} from 'node:fs/promises';import {SearchBrowser} from './src/main/search-browser';import {ContentProvider} from './src/main/provider';app.setPath('userData',${JSON.stringify(path.join(root,'profile'))});app.whenReady().then(async()=>{const anchor=new BrowserWindow({show:false});globalThis.searchBrowser=new SearchBrowser();globalThis.searchProvider=new ContentProvider({request:async()=>{throw Error('unexpected native request')}},{searchPage:url=>globalThis.searchBrowser.read(url)});let report;try{report={passed:true,events:await (${checks.toString()})()};}catch(e){report={passed:false,error:e.message};}finally{globalThis.searchBrowser.close();await writeFile(${JSON.stringify(path.join(root,'report.json'))},JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.passed?0:1);}});`,resolveDir:process.cwd(),loader:'ts'},outfile:path.join(root,'main.cjs'),bundle:true,platform:'node',format:'cjs',external:['electron'],logLevel:'silent'});
const exit=await new Promise((resolve,reject)=>{const child=spawn(path.resolve('node_modules/electron/dist/electron.exe'),[path.join(root,'main.cjs')],{windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.on('data',data=>process.stdout.write(data));child.stderr.resume();child.on('error',reject);child.on('close',resolve)});assert.equal(exit,0);console.log(root);
