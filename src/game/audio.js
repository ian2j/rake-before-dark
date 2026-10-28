// Sound, all synthesized with Web Audio.
import {G} from './state.js';
import {vacOn} from './vacuum.js';

// ---------- Sound
export function initAudio(){
  if(G.ac){if(G.ac.state==='suspended') G.ac.resume(); return;}
  try{
    G.ac=new (window.AudioContext||window.webkitAudioContext)();
    const buf=G.noiseBuf=G.ac.createBuffer(1,G.ac.sampleRate*2,G.ac.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const mk=(type,freq,q)=>{
      const src=G.ac.createBufferSource(); src.buffer=buf; src.loop=true;
      const f=G.ac.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q;
      const g=G.ac.createGain(); g.gain.value=0;
      src.connect(f).connect(g).connect(G.ac.destination); src.start();
      return g;
    };
    G.rustle=mk('bandpass',2600,0.8); G.whoosh=mk('lowpass',420,0.7);
  }catch(e){G.ac=null;}
}

export function audioTick(){
  if(!G.ac) return;
  const on=!G.store.opts.muted&&G.state==='play', t=G.ac.currentTime;
  G.rustle.gain.setTargetAtTime(on&&G.drag?Math.min(G.rakeSpeed/1600,1)*(G.carried>0?0.22:0.08):0,t,0.04);
  G.whoosh.gain.setTargetAtTime(on?Math.max(G.env*0.3,G.drag&&vacOn()?0.13:0):0,t,0.15);
}

export function chime(good){
  if(!G.ac||G.store.opts.muted) return;
  const t=G.ac.currentTime, notes=good?[784,1175]:[220,165];
  notes.forEach((f,i)=>{
    const o=G.ac.createOscillator(), g=G.ac.createGain();
    o.type=good?'sine':'triangle'; o.frequency.value=f;
    g.gain.setValueAtTime(0,t+i*0.09); g.gain.linearRampToValueAtTime(0.18,t+i*0.09+0.01); g.gain.exponentialRampToValueAtTime(0.001,t+i*0.09+0.35);
    o.connect(g).connect(G.ac.destination); o.start(t+i*0.09); o.stop(t+i*0.09+0.4);
  });
}

export function foghorn(){
  if(!G.ac||G.store.opts.muted) return;
  const t=G.ac.currentTime, f=G.ac.createBiquadFilter(), g=G.ac.createGain();
  f.type='lowpass'; f.frequency.value=400;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.16,t+0.25); g.gain.setValueAtTime(0.16,t+1.6); g.gain.exponentialRampToValueAtTime(0.001,t+2.6);
  f.connect(g).connect(G.ac.destination);
  for(const hz of [98,123]){const o=G.ac.createOscillator(); o.type='sawtooth'; o.frequency.value=hz; o.connect(f); o.start(t); o.stop(t+2.7);}
}

export function noiseHit(freq,q,gain,dur,type='bandpass',at=0){
  if(!G.ac||!G.noiseBuf||G.store.opts.muted) return;
  const t=G.ac.currentTime+at, src=G.ac.createBufferSource(), f=G.ac.createBiquadFilter(), g=G.ac.createGain();
  src.buffer=G.noiseBuf; f.type=type; f.frequency.value=freq; f.Q.value=q;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+0.01); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f).connect(g).connect(G.ac.destination); src.start(t,Math.random()); src.stop(t+dur+0.05);
}

export function crunch(n){for(let i=0;i<Math.min(4,1+Math.floor(n/20));i++) noiseHit(1800+Math.random()*1800,1.2,0.22,0.12,'bandpass',i*0.05);}

export function thunder(){noiseHit(140,0.7,0.5,1.8,'lowpass'); noiseHit(900,0.8,0.25,0.25,'bandpass');}

export function tones(notes,type='triangle',step=0.12,len=0.4,gain=0.16){
  if(!G.ac||G.store.opts.muted) return;
  const t=G.ac.currentTime;
  notes.forEach((f,i)=>{
    const o=G.ac.createOscillator(), g=G.ac.createGain(), t0=t+i*step;
    o.type=type; o.frequency.value=f;
    g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(gain,t0+0.02); g.gain.exponentialRampToValueAtTime(0.001,t0+len);
    o.connect(g).connect(G.ac.destination); o.start(t0); o.stop(t0+len+0.05);
  });
}

export function whee(){
  if(!G.ac||G.store.opts.muted) return;
  const t=G.ac.currentTime, o=G.ac.createOscillator(), g=G.ac.createGain();
  o.type='sine'; o.frequency.setValueAtTime(330,t); o.frequency.exponentialRampToValueAtTime(990,t+0.9);
  g.gain.setValueAtTime(0.12,t); g.gain.exponentialRampToValueAtTime(0.001,t+1.1);
  o.connect(g).connect(G.ac.destination); o.start(t); o.stop(t+1.2);
}
