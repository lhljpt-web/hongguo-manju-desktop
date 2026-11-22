export function encodingRateArgs(duration:number,maxBytes:number):string[]{
 // Leave room for AAC, MP4 overhead and the two-second VBV buffer; -fs alone truncates valid long episodes.
 const audioRate=128000,videoRate=Math.floor(maxBytes*8*.9/(duration+2)-audioRate);
 return ['-maxrate',String(videoRate),'-bufsize',String(videoRate*2),'-b:a',String(audioRate)];
}
