// The sound of each lawn: birds that quiet down toward sunset, crickets that take over at dusk, surf and gulls on
// the coast, crows in Salem, loons on Moosehead Lake, an owl under the moon, and a church bell when the sun sets.
import {G} from './state.js';
import {live, noiseHit, voice, bell} from './audio.js';

const rnd=(a,b)=>a+Math.random()*(b-a);

function robin(t){
  const base=rnd(2300,2900);
  for(let i=0;i<rnd(3,6);i++){const up=i%2===0; voice({f:base*(up?0.9:1.15),slide:base*(up?1.15:0.9),t:t+i*0.16,dur:0.09,gain:0.035,bus:G.ambBus});}
}
// Chickadee: "fee-bee", two clear whistles a step apart.
function chickadee(t){
  const f=rnd(3600,4000);
  voice({f,t,dur:0.32,gain:0.03,attack:0.04,release:0.06,bus:G.ambBus});
  voice({f:f*0.86,t:t+0.42,dur:0.3,gain:0.028,attack:0.04,release:0.06,bus:G.ambBus});
}
function cricket(t,gain){
  const f=rnd(4300,4900);
  for(let i=0;i<3;i++) voice({f,t:t+i*0.045,dur:0.018,gain,attack:0.004,bus:G.ambBus});
}
function gull(t){
  for(let i=0;i<rnd(2,4);i++) voice({f:rnd(1500,1800),slide:rnd(900,1100),t:t+i*0.32,dur:0.24,gain:0.03,type:'sawtooth',lp:2600,q:4,vib:0.03,bus:G.ambBus});
}
function crow(t){
  for(let i=0;i<rnd(2,4);i++) voice({f:rnd(520,620),slide:380,t:t+i*0.42,dur:0.22,gain:0.04,type:'sawtooth',lp:1300,q:6,bus:G.ambBus});
}
// The common loon's wail: a slow rise to a held note and back down.
function loon(t){
  voice({f:620,slide:930,t,dur:0.9,gain:0.04,attack:0.3,release:0.1,vib:0.012,bus:G.ambBus});
  voice({f:930,slide:700,t:t+1,dur:1.1,gain:0.04,attack:0.05,release:0.5,vib:0.015,bus:G.ambBus});
}
function owl(t){
  for(const [d,f] of [[0,392],[0.5,370],[0.8,370],[1.25,349]]) voice({f,slide:f*0.94,t:t+d,dur:0.22,gain:0.05,attack:0.05,lp:900,bus:G.ambBus});
}

// Called every play frame with p, the share of the round gone by.
export function ambTick(dt,p){
  if(!live()) return;
  const t=G.ac.currentTime, LV=G.LV, A=G.amb||(G.amb={bird:rnd(0.5,2),crk:0,call:rnd(4,9),pSun:p});
  const coast=LV.sea||LV.fog, snowing=LV.snow&&(G.snowAmt||0)>0.3;
  // The bell rings once, as the clock passes sunset.
  if(G.pSun>0&&A.pSun<G.pSun&&p>=G.pSun) bell(3);
  A.pSun=p;

  if(LV.boss){
    G.storm.gain.setTargetAtTime(0.05+0.08*G.env,t,0.3); G.rain.gain.setTargetAtTime(0.03+0.03*(G.boss?G.boss.phase:1),t,0.5);
    return;
  }
  G.surf.gain.setTargetAtTime(coast?0.07+0.06*Math.sin(G.playT*0.8)**2:0,t,0.4);
  G.rain.gain.setTargetAtTime(0,t,0.3); G.storm.gain.setTargetAtTime(snowing?0.025:0,t,0.6);

  // Birds thin out as the light goes.
  const day=LV.night?0:Math.max(0,1-p/0.6);
  if((A.bird-=dt)<=0){
    A.bird=rnd(1.5,4.5)/Math.max(day,0.15);
    if(Math.random()<day&&!snowing) (Math.random()<0.55?robin:chickadee)(t);
  }
  // Crickets come up as it gets dark (not in the snow).
  const dusk=LV.night?0.7:Math.max(0,(p-0.5)/0.5);
  if(dusk>0&&!snowing&&(A.crk-=dt)<=0){A.crk=rnd(0.5,1.1); cricket(t,0.008+0.02*dusk); if(Math.random()<dusk*0.6) cricket(t+rnd(0.15,0.35),0.006+0.012*dusk);}
  // Each town's own voice.
  if((A.call-=dt)<=0){
    A.call=rnd(7,15);
    if(LV.moose) loon(t);
    else if(LV.night) owl(t);
    else if(LV.kids) crow(t);
    else if(coast) gull(t);
    else if(Math.random()<0.3) noiseHit(rnd(2500,4000),1,0.015,0.6,'bandpass',0,G.ambBus);
  }
}
