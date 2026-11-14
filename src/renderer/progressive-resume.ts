import type {BufferState,Playback} from '../shared/types';

export function playbackDuration(resource:Pick<Playback,'duration'|'progressive'>|null,browserDuration:number,fallback:number,complete=false):number{
 const source=resource&&Number.isFinite(resource.duration)&&resource.duration>0?resource.duration:0;
 if(resource?.progressive&&!complete&&source)return source;
 // Native metadata can briefly describe the old fragment even after a completed
 // source replaces it. Preserve the verified source floor; encoded padding may
 // legitimately make the final browser duration slightly longer.
 return Number.isFinite(browserDuration)&&browserDuration>0?Math.max(browserDuration,source):source||fallback;
}

export async function completedResumeResource(options:{episodeId:string;url:string;getState:()=>Promise<BufferState>;getPlayback:()=>Promise<Playback>;isCurrent:()=>boolean}):Promise<Playback|undefined>{
 const state=await options.getState();
 // A progressive job is already active when its Playback is returned. Once it
 // disappears without failures, a ready entry can be queried without forcing a
 // new transfer. The returned identity is still checked before replacing it.
 if(!options.isCurrent()||state.ready<1||state.failed||!state.activities||state.activities.some(item=>item.episodeId===options.episodeId))return;
 const playback=await options.getPlayback();
 if(options.isCurrent()&&!playback.progressive&&playback.episodeId===options.episodeId&&playback.url===options.url){
  // Chromium can retain the finite first fragment across load() on the same URL.
  // A completed-cache URL forces metadata and ranges to be read from the full file.
  const url=new URL(playback.url);url.searchParams.set('complete','1');
  return {...playback,url:url.href};
 }
}
