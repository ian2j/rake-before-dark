// Sound, all synthesized with Web Audio. Effects, ambience and music each get a bus, mixed through a master gain
// and a gentle compressor so stacked sounds never clip.
import {G} from './state.js';
import {vacOn} from './vacuum.js';

// ---------- Sound
export const live=()=>!!G.ac&&!G.store.opts.muted;

export function initAudio(){
  if(G.ac){if(G.ac.state==='suspended') G.ac.resume(); return;}
  try{
    const ac=G.ac=new (window.AudioContext||window.webkitAudioContext)();
    const comp=ac.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4;
    G.master=ac.createGain(); G.master.connect(comp).connect(ac.destination);
    for(const b of ['sfxBus','ambBus','musBus']){G[b]=ac.createGain(); G[b].connect(G.master);}
    const buf=G.noiseBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const mk=(type,freq,q,bus)=>{
      const src=ac.createBufferSource(); src.buffer=buf; src.loop=true;
      const f=ac.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q;
      const g=ac.createGain(); g.gain.value=0;
      src.connect(f).connect(g).connect(bus); src.start(0,Math.random());
      return g;
    };
    G.rustle=mk('bandpass',2600,0.8,G.sfxBus); G.whoosh=mk('lowpass',420,0.7,G.sfxBus);
    G.surf=mk('lowpass',520,0.5,G.ambBus); G.rain=mk('highpass',3800,0.4,G.ambBus); G.storm=mk('bandpass',700,0.6,G.ambBus);
    // The vacuum's motor: two detuned saws through a low filter.
    const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900;
    G.hum=ac.createGain(); G.hum.gain.value=0; lp.connect(G.hum).connect(G.sfxBus);
    for(const hz of [118,119.6]){const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=hz; o.connect(lp); o.start();}
    applyVolumes();
  }catch(e){G.ac=null;}
}

export function applyVolumes(){
  if(!G.ac) return;
  const o=G.store.opts, t=G.ac.currentTime;
  G.master.gain.setTargetAtTime(o.muted?0:1,t,0.05);
  G.sfxBus.gain.setTargetAtTime(o.sfx,t,0.05);
  G.ambBus.gain.setTargetAtTime(0.8*o.sfx,t,0.05);
  G.musBus.gain.setTargetAtTime(0.5*o.music,t,0.05);
}

// Phones keep an audio context running in the background unless it's suspended.
export function bindAudioLifecycle(){
  document.addEventListener('visibilitychange',()=>{if(!G.ac) return; if(document.hidden) G.ac.suspend(); else G.ac.resume();});
  // Browsers only start audio after a gesture, so the first tap anywhere starts the menu music.
  document.addEventListener('pointerdown',initAudio,true);
  document.addEventListener('keydown',initAudio,true);
}

export function audioTick(){
  if(!G.ac) return;
  const on=!G.store.opts.muted&&G.state==='play', t=G.ac.currentTime, vac=G.drag&&vacOn();
  G.rustle.gain.setTargetAtTime(on&&G.drag&&!vac?Math.min(G.rakeSpeed/1600,1)*(G.carried>0?0.22:0.08):0,t,0.04);
  G.whoosh.gain.setTargetAtTime(on?Math.max(G.env*0.3,vac?0.07:0):0,t,0.15);
  G.hum.gain.setTargetAtTime(on&&vac?0.05:0,t,0.08);
  if(G.state!=='play') for(const g of [G.surf,G.rain,G.storm]) g.gain.setTargetAtTime(0,t,0.3);
}

// One synthesized note: an oscillator (or a stack of partials) through an optional filter and an envelope.
// With `release` the note holds for `dur` then fades; without it, it decays from the attack like a plucked string.
export function voice({f,t,dur=0.3,gain=0.15,type='sine',attack=0.01,release,lp,q=0.7,partials,vib=0,bus=G.sfxBus,slide}){
  if(!live()) return;
  const ac=G.ac, g=ac.createGain(), end=t+dur+(release??dur*0.6);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+attack);
  if(release!=null) g.gain.setValueAtTime(gain,t+dur);
  g.gain.exponentialRampToValueAtTime(0.0008,end);
  let out=g;
  if(lp){
    const fl=ac.createBiquadFilter(); fl.type='lowpass'; fl.Q.value=q;
    if(Array.isArray(lp)){fl.frequency.setValueAtTime(lp[0],t); fl.frequency.exponentialRampToValueAtTime(lp[1],t+Math.max(dur,0.05));} else fl.frequency.value=lp;
    fl.connect(g); out=fl;
  }
  g.connect(bus);
  let depth=null;
  if(vib){
    const lfo=ac.createOscillator(); lfo.frequency.value=5.4; depth=ac.createGain();
    depth.gain.setValueAtTime(0,t); depth.gain.linearRampToValueAtTime(f*vib,t+Math.min(0.25,dur));
    lfo.connect(depth); lfo.start(t); lfo.stop(end+0.05);
  }
  for(const [mult,amp,ty] of partials||[[1,1]]){
    const o=ac.createOscillator(), a=ac.createGain(); o.type=ty||type; o.frequency.setValueAtTime(f*mult,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(slide*mult,t+dur);
    if(depth){const m=ac.createGain(); m.gain.value=mult; depth.connect(m).connect(o.frequency);}
    a.gain.value=amp; o.connect(a).connect(out); o.start(t); o.stop(end+0.05);
  }
}

export function noiseHit(freq,q,gain,dur,type='bandpass',at=0,bus=G.sfxBus){
  if(!live()) return;
  const t=G.ac.currentTime+at, src=G.ac.createBufferSource(), f=G.ac.createBiquadFilter(), g=G.ac.createGain();
  src.buffer=G.noiseBuf; f.type=type; f.frequency.value=freq; f.Q.value=q;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+0.01); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f).connect(g).connect(bus||G.sfxBus); src.start(t,Math.random()); src.stop(t+dur+0.05);
}

export function tones(notes,type='triangle',step=0.12,len=0.4,gain=0.16,at=0){
  if(!live()) return;
  const t=G.ac.currentTime+at;
  notes.forEach((f,i)=>voice({f,t:t+i*step,dur:len*0.6,gain,type,attack:0.02}));
}

export function chime(good){if(good) tones([784,1175],'sine',0.09,0.35,0.18); else tones([220,165],'triangle',0.09,0.35,0.18);}

export function foghorn(){
  if(!live()) return;
  const t=G.ac.currentTime;
  for(const hz of [98,123]) voice({f:hz,t,dur:1.6,gain:0.08,type:'sawtooth',attack:0.25,release:1,lp:400,bus:G.ambBus});
}

export function crunch(n){for(let i=0;i<Math.min(4,1+Math.floor(n/20));i++) noiseHit(1800+Math.random()*1800,1.2,0.22,0.12,'bandpass',i*0.05);}

export function thunder(){noiseHit(140,0.7,0.5,1.8,'lowpass'); noiseHit(900,0.8,0.25,0.25,'bandpass');}

export function whee(){if(live()) voice({f:330,slide:990,t:G.ac.currentTime,dur:0.9,gain:0.12,release:0.2});}

// A find turning up: a little glint of bells.
export function sparkle(){
  if(!live()) return;
  const t=G.ac.currentTime;
  [1568,2093,2637].forEach((f,i)=>voice({f,t:t+i*0.07,dur:0.25,gain:0.09,partials:[[1,1],[2.76,0.25]]}));
  noiseHit(8000,0.7,0.05,0.3,'highpass');
}

export function achSound(){tones([784,988,1175,1568],'square',0.08,0.25,0.05,0.1);}

export function uiTick(){if(live()) voice({f:1400,t:G.ac.currentTime,dur:0.03,gain:0.04,type:'triangle'});}

// A kid landing in a pile: a run of giggly hops.
export function giggle(){
  if(!live()) return;
  const t=G.ac.currentTime, base=880+Math.random()*300;
  for(let i=0;i<5;i++) voice({f:base*(1+0.12*(i%2)),slide:base*0.85,t:t+i*0.085,dur:0.06,gain:0.05,type:'triangle'});
}

export function bellow(){
  if(!live()) return;
  voice({f:92,slide:68,t:G.ac.currentTime,dur:1.1,gain:0.16,type:'sawtooth',attack:0.12,release:0.3,lp:520,q:3,vib:0.04});
}

// A distant church bell: inharmonic partials with a long ring.
export function bell(times=3,gain=0.09){
  if(!live()) return;
  const t=G.ac.currentTime;
  for(let i=0;i<times;i++) voice({f:262,t:t+i*1.7,dur:2.8,gain,attack:0.005,partials:[[0.5,0.6],[1,1],[1.19,0.5],[1.5,0.35],[2,0.3],[2.52,0.2]],bus:G.ambBus});
}

// The results screen: one ping per star as it appears, then a short tune that matches how it went.
export function stinger(stars,at=0.75){
  if(!live()) return;
  const t=G.ac.currentTime+at;
  for(let i=0;i<stars;i++) voice({f:[1047,1319,1568][i],t:t+i*0.2,dur:0.4,gain:0.1,partials:[[1,1],[3,0.2]]});
  const tune=stars>=3?[523,659,784,1047]:stars===2?[523,659,784]:stars===1?[523,587,659]:[392,370,349,330];
  tune.forEach((f,i)=>voice({f,t:t+stars*0.2+0.2+i*(stars?0.12:0.28),dur:stars?0.18:0.3,gain:0.1,type:'triangle',lp:2400}));
}
