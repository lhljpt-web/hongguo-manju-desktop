import test from 'node:test';
import assert from 'node:assert/strict';
import {playbackDuration,completedResumeResource} from '../src/renderer/progressive-resume';
import {resumeTime} from '../src/renderer/playback-state';
import type {BufferState,Playback} from '../src/shared/types';

const resource:Playback={url:'manju-media://local/finished',episodeId:'episode',duration:60,definition:'480p',progressive:true};
const completed:BufferState={status:'preparing',total:4,ready:1,failed:0,activities:[],message:''};

test('a finite first-fragment duration cannot reset the history target or mark an early finish',()=>{
 const total=playbackDuration(resource,1.439,60);
 assert.equal(total,60);assert.equal(resumeTime(45,total),45);assert.ok(1.4/total<.95);
 assert.equal(playbackDuration(resource,Infinity,0),60);
 assert.equal(playbackDuration({...resource,progressive:false},60.034,60),60.034);
 assert.equal(playbackDuration(resource,60.034,60,true),60.034);
});

test('completed reload never shrinks verified source duration while native metadata catches up',()=>{
 const full={...resource,duration:20};
 assert.equal(playbackDuration(full,17.481608,20,true),20);
 assert.equal(playbackDuration({...full,progressive:false},17.481608,20),20);
 assert.equal(playbackDuration({...full,progressive:false},20.034,20),20.034);
 assert.equal(resumeTime(15,playbackDuration({...full,progressive:false},15.5,20)),15);
});

test('a stalled resume obtains the completed source with a fresh URL once its active job disappears',async()=>{
 let probes=0;const full={...resource,progressive:false};
 const result=await completedResumeResource({episodeId:resource.episodeId,url:resource.url,getState:async()=>completed,getPlayback:async()=>{probes++;return full},isCurrent:()=>true});
 assert.deepEqual(result,{...full,url:full.url+'?complete=1'});assert.equal(probes,1);
});

test('completion probing never starts another source while still active, failed, or unknown',async()=>{
 for(const state of [{...completed,activities:[{episodeId:resource.episodeId}]},{...completed,failed:1},{...completed,ready:0},{...completed,activities:undefined}]){
  const result=await completedResumeResource({episodeId:resource.episodeId,url:resource.url,getState:async()=>state,getPlayback:async()=>assert.fail('must not fetch playback'),isCurrent:()=>true});
  assert.equal(result,undefined);
 }
});

test('a completed lookup arriving after a manual restart or source change cannot replace playback',async()=>{
 let release!:(playback:Playback)=>void,current=true;
 const pending=completedResumeResource({episodeId:resource.episodeId,url:resource.url,getState:async()=>completed,getPlayback:()=>new Promise(resolve=>{release=resolve}),isCurrent:()=>current});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof release,'function');current=false;release({...resource,progressive:false});assert.equal(await pending,undefined);
 for(const playback of [resource,{...resource,progressive:false,url:'manju-media://local/other'},{...resource,progressive:false,episodeId:'other'}]){
  assert.equal(await completedResumeResource({episodeId:resource.episodeId,url:resource.url,getState:async()=>completed,getPlayback:async()=>playback,isCurrent:()=>true}),undefined);
 }
});
