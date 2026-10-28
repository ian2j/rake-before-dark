// Small helpers: DOM lookup, math, formatting, seeded randomness, and game-wide constants.

export const $=id=>document.getElementById(id);

export const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

export const TZ='America/New_York', LEAD_MIN=40, BAG_SIZE=100, LEAF_PTS=10, FIND_PTS=250, DAYLIGHT_PTS=40, EDGE=28, rad=Math.PI/180;

export const clamp=(v,a,b)=>v<a?a:v>b?b:v;

export const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};

export const lerp=(a,b,t)=>a+(b-a)*t;

export const gauss=()=>Math.sqrt(-2*Math.log(1-Math.random()))*Math.cos(2*Math.PI*Math.random());

export const fmtTime=new Intl.DateTimeFormat('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'});

export const fmtShort=ms=>fmtTime.format(ms).replace(/\s?[AP]M$/,'');

export const num=n=>n.toLocaleString('en-US');

export const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export const EMOJI_FONT='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

export const CELL=32;

// ---------- The daily lawn: one town and weekday per date, with the lawn laid out from a seed so everyone gets the same one.
export function mulberry32(a){return ()=>{a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296;};}

export function withSeed(seed,fn){const r=Math.random; Math.random=mulberry32(seed); try{fn();}finally{Math.random=r;}}

export const easeOutBack=u=>{const c1=1.70158, c3=c1+1; return 1+c3*Math.pow(u-1,3)+c1*Math.pow(u-1,2);};
