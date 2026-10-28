// Generative music. Each town has a theme composed once from a seed (so it's the same tune every visit): a key,
// mode, meter, chord progression, accompaniment style and lead instrument. The melody is built in an AABA form from
// chord tones and stepwise motion, then looped with variations. As dusk closes in the band picks up a shaker and a
// little tempo.
import {G} from './state.js';
import {live, voice, noiseHit} from './audio.js';
import {winterView} from './winter.js';
import {SECS} from './round.js';
import {mulberry32} from '../lib/util.js';

const MAJ=[0,2,4,5,7,9,11], MIN=[0,2,3,5,7,8,10], DOR=[0,2,3,5,7,9,10], MIX=[0,2,4,5,7,9,10], HMIN=[0,2,3,5,7,8,11];

// beats: per bar; comp: accompaniment pattern; lead: instrument; prog: scale degree of each bar's chord.
export const SONGS={
  home:  {root:62,scale:MAJ, bpm:88, beats:3,comp:'waltz', lead:'pluck',   prog:[0,3,4,0,5,3,4,4],seed:11},
  vt:    {root:67,scale:MAJ, bpm:108,beats:4,comp:'strum', lead:'fiddle',  prog:[0,3,0,4,0,3,4,0],seed:21},
  nh:    {root:64,scale:DOR, bpm:92, beats:4,comp:'arp',   lead:'flute',   prog:[0,6,3,0,0,6,4,4],seed:31},
  me:    {root:62,scale:MIX, bpm:150,beats:6,comp:'jig',   lead:'squeeze', prog:[0,6,0,6,3,0,6,0],seed:41},
  ma:    {root:57,scale:HMIN,bpm:100,beats:4,comp:'arp',   lead:'celeste', prog:[0,5,3,4,0,5,1,4],seed:51},
  ct:    {root:65,scale:MAJ, bpm:96, beats:3,comp:'waltz', lead:'flute',   prog:[0,4,5,3,0,3,4,0],seed:61},
  ri:    {root:60,scale:MAJ, bpm:104,beats:4,comp:'strum', lead:'pluck',   prog:[0,5,3,4,0,5,1,4],seed:71},
  nt:    {root:63,scale:MAJ, bpm:70, beats:3,comp:'arp',   lead:'musicbox',prog:[0,5,3,4,0,3,4,0],seed:81},
  ne:    {root:62,scale:MIN, bpm:138,beats:4,comp:'drive', lead:'fiddle',  prog:[0,0,5,6,0,0,3,4],seed:91},
  mo:    {root:55,scale:MIN, bpm:116,beats:4,comp:'oompah',lead:'clarinet',prog:[0,4,0,4,3,0,4,0],seed:101},
  toss:  {root:58,scale:MAJ, bpm:128,beats:4,comp:'oompah',lead:'squeeze', prog:[0,4,4,0,0,3,4,0],seed:111},
  winter:{root:60,scale:MAJ, bpm:96, beats:4,comp:'sleigh',lead:'musicbox',prog:[0,5,3,4,0,5,1,4],seed:121},
};

const hz=m=>440*2**((m-69)/12);
const pitch=(S,deg)=>S.root+12*Math.floor(deg/7)+S.scale[((deg%7)+7)%7];

// Rhythms for one bar, in half-beats (a 6/8 bar counts eighths as beats, so its half-beats are sixteenths).
const RHY={
  3:[[2,2,2],[3,1,2],[2,1,1,2],[4,2],[1,1,2,2]],
  4:[[2,2,2,2],[3,1,2,2],[2,1,1,4],[4,2,2],[1,1,2,2,2],[2,2,4]],
  6:[[2,2,2,2,2,2],[4,2,4,2],[2,2,2,6],[6,6],[4,2,2,2,2]],
};

// Builds the melody: phrases A and B of two bars each, played A A' B A over eight bars.
export function compose(S){
  const rng=mulberry32(S.seed), pick=a=>a[(rng()*a.length)|0], steps=S.beats*2;
  const phrase=(bars,startDeg)=>{
    let deg=startDeg; const out=[];
    bars.forEach((chord,bi)=>{
      let at=0;
      for(const len of pick(RHY[S.beats])){
        const strong=at===0||at===steps/2;
        if(!strong&&rng()<0.12){at+=len; continue;}
        if(strong){const tones=[chord,chord+2,chord+4,chord+7,chord+9,chord+11].filter(d=>d>=5&&d<=13); deg=tones.reduce((b,d)=>Math.abs(d-deg)<Math.abs(b-deg)?d:b,tones[0]);}
        else deg=Math.max(4,Math.min(14,deg+pick([-2,-1,-1,1,1,2])));
        out.push({bar:bi,at,len,deg});
        at+=len;
      }
    });
    return out;
  };
  const p=S.prog, A=phrase([p[0],p[1]],7+p[0]), A2=phrase([p[2],p[3]],9), B=phrase([p[4],p[5]],11);
  // The closing phrase opens like A, and its last note resolves on the tonic.
  const end=[...A.filter(n=>n.bar===0),...phrase([p[6],p[7]],7).filter(n=>n.bar===1)];
  const tail=end.filter(n=>n.bar===1);
  if(tail.length){tail[tail.length-1].deg=7; tail[tail.length-1].len=steps-tail[tail.length-1].at;}
  const ev=[];
  [[A,0],[A2,2],[B,4],[end,6]].forEach(([ph,b0])=>{for(const n of ph) ev.push({...n,bar:n.bar+b0});});
  return ev;
}

// ---------- Instruments
function lead(name,f,t,d,vel,bus){
  const g=0.11*vel;
  switch(name){
    case 'fiddle': return voice({f,t,dur:d*0.9,gain:g*0.55,type:'sawtooth',attack:0.05,release:0.1,lp:2300,q:1.2,vib:0.006,bus});
    case 'flute': return voice({f:f*2,t,dur:d*0.9,gain:g*0.8,attack:0.06,release:0.12,partials:[[1,1],[2,0.12,'triangle']],vib:0.005,bus});
    case 'squeeze': return voice({f,t,dur:d*0.85,gain:g*0.35,type:'square',attack:0.03,release:0.08,lp:1800,partials:[[1,1],[1.004,0.8]],bus});
    case 'clarinet': return voice({f,t,dur:d*0.9,gain:g*0.4,type:'square',attack:0.04,release:0.1,lp:1300,bus});
    case 'celeste': return voice({f:f*2,t,dur:0.5,gain:g*0.8,partials:[[1,1],[4,0.15]],bus});
    case 'musicbox': return voice({f:f*2,t,dur:0.7,gain:g*0.75,partials:[[1,1],[3,0.18],[5.4,0.06]],bus});
    default: return voice({f,t,dur:Math.min(0.6,d),gain:g*1.1,type:'triangle',lp:[3200,700],partials:[[1,1],[2,0.25,'square']],bus});
  }
}
const pluck=(f,t,vel,bus)=>voice({f,t,dur:0.35,gain:0.045*vel,type:'triangle',lp:[2400,500],bus});
const bass=(f,t,d,bus,tuba)=>tuba?voice({f,t,dur:d*0.6,gain:0.11,type:'square',attack:0.02,release:0.06,lp:380,bus}):voice({f,t,dur:Math.min(d,0.5),gain:0.16,type:'triangle',attack:0.01,lp:700,bus});
const pad=(fs,t,d,bus)=>{for(const f of fs) voice({f,t,dur:d*0.8,gain:0.018,type:'sawtooth',attack:d*0.3,release:d*0.3,lp:650,bus});};
const kick=(t,bus)=>voice({f:130,slide:45,t,dur:0.14,gain:0.3,attack:0.003,bus});
const hat=(t,g,bus)=>{const at=t-G.ac.currentTime; if(at>=0) noiseHit(7500,0.8,g,0.05,'highpass',at,bus);};
const snare=(t,bus)=>{const at=t-G.ac.currentTime; if(at>=0) noiseHit(1900,0.8,0.09,0.14,'bandpass',at,bus);};

// Plays the accompaniment and melody for one half-beat step.
function playStep(S,M,t,stepDur){
  const steps=S.beats*2, bar=Math.floor(M.step/steps)%8, s=M.step%steps, loop=Math.floor(M.step/(steps*8));
  const deg=S.prog[bar], chord=[deg,deg+2,deg+4].map(d=>pitch(S,d)), root=pitch(S,deg)-12, bus=M.gain, beat=s/2, on=s%2===0;
  const fifth=pitch(S,deg+4)-12;
  switch(S.comp){
    case 'waltz':
      if(s===0) bass(hz(root),t,stepDur*4,bus);
      else if(on) for(const m of chord) pluck(hz(m),t,0.8,bus);
      break;
    case 'strum':
      if(s===0||s===4) bass(hz(s===0?root:fifth),t,stepDur*4,bus);
      if(on) chord.forEach((m,i)=>pluck(hz(m),t+i*0.012,beat%2?0.6:0.9,bus));
      else if(s===steps-1) chord.forEach((m,i)=>pluck(hz(m),t+i*0.01,0.4,bus));
      break;
    case 'arp':
      if(s===0) {bass(hz(root),t,stepDur*steps,bus); pad(chord.map(hz),t,stepDur*steps,bus);}
      pluck(hz([chord[0],chord[1],chord[2],chord[1]+12][s%4]),t,0.55,bus);
      break;
    case 'jig':
      if(s===0||s===6) bass(hz(s===0?root:fifth),t,stepDur*4,bus);
      if(on) pluck(hz(chord[(s/2)%3]),t,s%6===0?0.9:0.55,bus);
      break;
    case 'oompah':
      if(on&&beat%2===0) bass(hz(beat===0?root:fifth),t,stepDur*2,bus,true);
      else if(on) for(const m of chord) pluck(hz(m),t,0.9,bus);
      if(S===SONGS.toss&&on) hat(t,0.03,bus);
      break;
    case 'drive':
      bass(hz(root),t,stepDur,bus);
      if(beat===0||beat===2) kick(t,bus);
      if(on&&(beat===1||beat===3)) snare(t,bus);
      if(s===0) pad(chord.map(hz),t,stepDur*steps,bus);
      break;
    case 'sleigh':
      if(s===0||s===4) bass(hz(s===0?root:fifth),t,stepDur*4,bus);
      if(on) for(const m of chord) pluck(hz(m),t,0.5,bus);
      hat(t,on?0.04:0.02,bus);
      break;
  }
  // Toward dusk: a shaker on every half-beat.
  if(M.hurry>0) hat(t,0.025*M.hurry*(on?1:0.6),bus);
  // The melody rests every third loop so the tune doesn't wear out; on the second it climbs an octave.
  if(loop%3===2) return;
  for(const n of M.notes[M.step%(steps*8)]||[]) lead(S.lead,hz(pitch(S,n.deg)+(loop%3===1&&S.lead!=='musicbox'?12:0)),t,n.len*stepDur,1,bus);
}

const M={id:null,gain:null,next:0,step:0,notes:null,hurry:0};
export const musicState=M;

// Which song fits the current screen.
export function pickSong(){
  switch(G.state){
    case 'play': case 'paused': return G.LV.boss?'ne':G.LV.moose?'mo':G.LV.night?'nt':SONGS[G.LV.id]?G.LV.id:'home';
    case 'toss': return 'toss';
    case 'ending': return 'winter';
    case 'over': return null;
    default: return winterView()?'winter':'home';
  }
}

function startSong(id){
  const ac=G.ac, t=ac.currentTime;
  if(M.gain){const old=M.gain; old.gain.setTargetAtTime(0,t,0.35); setTimeout(()=>{try{old.disconnect();}catch(_){}},2500);}
  M.id=id; M.gain=null; M.step=0;
  if(!id) return;
  const S=SONGS[id], steps=S.beats*2;
  M.gain=ac.createGain(); M.gain.gain.value=0; M.gain.connect(G.musBus); M.gain.gain.setTargetAtTime(1,t,0.4);
  M.notes=[]; for(const n of compose(S)) (M.notes[n.bar*steps+n.at]??=[]).push(n);
  M.next=t+0.15;
}

// Called every frame: switches songs when the screen changes and schedules the next ~200 ms of notes.
export function musicTick(){
  if(!G.ac) return;
  const want=pickSong();
  if(want!==M.id) startSong(want);
  if(!M.id||!live()) return;
  const S=SONGS[M.id], ac=G.ac, now=ac.currentTime;
  const p=G.state==='play'?Math.min(G.elapsed/SECS(),1):0;
  M.hurry=G.state==='play'&&!G.LV.night?Math.max(0,(p-0.78)/0.22):0;
  M.gain.gain.setTargetAtTime(G.state==='paused'?0.35:G.state==='play'?0.75:1,now,0.2);
  if(M.next<now-0.3) M.next=now+0.05;
  const stepDur=60/(S.bpm*(1+0.06*M.hurry))/2;
  while(M.next<now+0.2){playStep(S,M,M.next,stepDur); M.next+=stepDur; M.step++;}
}
