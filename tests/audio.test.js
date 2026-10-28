// Sound and music, run against a stand-in AudioContext that checks every scheduled value the way a browser would
// (an exponential ramp to zero, a NaN time or frequency, or stopping before starting all throw).
import {describe,it,expect,beforeAll} from 'vitest';
import {G} from '../src/game/state.js';
import {start,playDay} from './helpers.js';
import {initAudio,applyVolumes,sparkle,stinger,bell,giggle,bellow,uiTick} from '../src/game/audio.js';
import {SONGS,compose,musicTick,musicState,pickSong} from '../src/game/music.js';
import {goMap,goTitle} from '../src/game/screens.js';

const log={osc:[],noise:0,errors:[]};
const num=(v,what)=>{if(!Number.isFinite(v)) log.errors.push(`${what}: ${v}`);};
function param(v=0){
  return {value:v,
    setValueAtTime(x,t){num(x,'set value'); num(t,'set time'); this.value=x;},
    linearRampToValueAtTime(x,t){num(x,'linear value'); num(t,'linear time');},
    exponentialRampToValueAtTime(x,t){num(x,'exp value'); num(t,'exp time'); if(!(x>0)) log.errors.push(`exp ramp to ${x}`);},
    setTargetAtTime(x,t,c){num(x,'target value'); num(t,'target time'); if(!(c>0)) log.errors.push(`time constant ${c}`);}};
}
function node(extra={}){
  return {connect(n){return n;},disconnect(){},gain:param(1),frequency:param(440),Q:param(1),threshold:param(),ratio:param(),
    start(t=0){num(t,'start'); this.t0=t;},stop(t){num(t,'stop'); if(t<(this.t0??0)) log.errors.push('stop before start');},...extra};
}
class FakeAC{
  constructor(){this.currentTime=0; this.state='running'; this.sampleRate=8000; this.destination=node();}
  createGain(){return node();} createBiquadFilter(){return node();} createDynamicsCompressor(){return node();}
  createOscillator(){const o=node(); log.osc.push(o); return o;}
  createBufferSource(){log.noise++; return node();}
  createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)};}
  resume(){} suspend(){}
}

beforeAll(()=>{
  start(); globalThis.AudioContext=FakeAC; G.ac=null; initAudio();
});

const run=(secs,each)=>{for(let i=0;i<secs*60;i++){G.ac.currentTime+=1/60; each?.(); musicTick();}};

describe('music',()=>{
  it('composes every song as eight full bars in a singable range, ending on the tonic',()=>{
    for(const [id,S] of Object.entries(SONGS)){
      const ev=compose(S), steps=S.beats*2;
      expect(new Set(ev.map(n=>n.bar)).size,id).toBe(8);
      for(const n of ev){expect(n.at+n.len,id).toBeLessThanOrEqual(steps); expect(n.deg,id).toBeGreaterThanOrEqual(4); expect(n.deg,id).toBeLessThanOrEqual(14);}
      expect(ev[ev.length-1].deg,id).toBe(7);
      expect(compose(S),id).toEqual(ev);
    }
  });
  it('plays the right song for each screen and keeps the beat',()=>{
    goTitle(); run(0.1);
    expect(musicState.id).toBe('home');
    const before=log.osc.length; run(4);
    expect(log.osc.length-before).toBeGreaterThan(20);
    const bars=Math.floor(musicState.step/(SONGS.home.beats*2));
    expect(bars).toBeGreaterThanOrEqual(Math.floor(4*SONGS.home.bpm/60/3)-1);
    goMap(); G.mapSel='ma'; G.mapDay=1;
    expect(pickSong()).toBe('home');
  });
  it('stays quiet when muted and picks back up after',()=>{
    goTitle(); run(0.5);
    G.store.opts.muted=true; applyVolumes();
    const n=log.osc.length; run(2);
    expect(log.osc.length).toBe(n);
    G.store.opts.muted=false; applyVolumes(); run(1);
    expect(log.osc.length).toBeGreaterThan(n);
  });
});

describe('a round with sound on',()=>{
  it('plays each town with its own theme and ambience, and rings the bell at sunset',()=>{
    let rung=0;
    for(const id of ['vt','me','ma','nh']){
      const songs=new Set(), o0=log.osc.length;
      const r=playDay(id,1,'smart',{each:()=>{G.ac.currentTime+=1/60; musicTick(); songs.add(musicState.id);}});
      const rang=log.osc.slice(o0).some(o=>o.frequency.value===131);
      expect(r.state).toBe('over');
      expect([...songs][0]).toBe(id);
      expect(rang,id).toBe(r.secs>G.pSun*G.D.secs);
      rung+=rang;
      run(0.5);
      expect(musicState.id).toBeNull();
    }
    expect(rung).toBeGreaterThan(0);
    expect(log.errors).toEqual([]);
  });
  it('schedules every effect without bad values',()=>{
    sparkle(); stinger(3); stinger(0); bell(); giggle(); bellow(); uiTick();
    expect(log.errors).toEqual([]);
    expect(log.noise).toBeGreaterThan(0);
  });
});
