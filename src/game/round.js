// A round: setup, saving and restoring, the per-frame simulation, scoring and the results screen.
import {G} from './state.js';
import {DAY_NAMES, DIFFS, LEVELS, POWERS, dayParams, levelOf} from '../data/levels.js';
import {audioTick, chime, crunch, foghorn, sparkle, stinger} from './audio.js';
import {ambTick} from './ambience.js';
import {bossLost, initBoss, thBagged, updateBoss, updateThrows} from './boss.js';
import {nctx, scrape, sctx, snow} from './canvas.js';
import {dailyStreak, shareText} from './daily.js';
import {updateKids} from './kids.js';
import {inCanopy, inTarp, lawnSpot, onWall, pickTree, placeGeom, placeTarp, rakeHalf, wallCollide} from './lawn.js';
import {newLeaf} from './leaves.js';
import {initMoose, updateMoose} from './moose.js';
import {award, buzz, shake, stat} from './polish.js';
import {inRivalTarp, makeRival, updateRival} from './rival.js';
import {leaveTrap, show} from './screens.js';
import {ROUND_KEY, U, clearRound, save} from './store.js';
import {vacOn, vacuum} from './vacuum.js';
import {sunTimes} from '../lib/sun.js';
import {$, BAG_SIZE, CELL, DAYLIGHT_PTS, FIND_PTS, LEAD_MIN, LEAF_PTS, clamp, esc, fmtShort, fmtTime, gauss, num, smooth} from '../lib/util.js';

export const SECS=()=>G.D.secs*(G.LV&&G.LV.boss?1.7:G.LV&&G.LV.moose?1.3:1);

export function popup(text,x,y,big){G.popups.push({text,x,y,t:0,big:!!big});}

export function reset(){
  G.LV=levelOf(G.selected)||LEVELS.vt; G.D=G.DAILY?DIFFS.standard:(DIFFS[G.store.opts.diff]||DIFFS.standard); G.DP=dayParams(G.LV,G.DAY);
  placeGeom(); G.hornAt=-1;
  G.rival=null; G.rivalBagged=0; if(G.DP.rival) makeRival();
  G.sun=sunTimes(new Date(Date.now()+(G.DAY-1)*864e5),G.LV.lat,G.LV.lon);
  G.T1=G.sun.dusk; G.T0=G.sun.sunset-LEAD_MIN*6e4; G.pSun=(G.sun.sunset-G.T0)/(G.T1-G.T0);
  if(G.LV.night){G.T0=G.sun.dusk; G.T1=G.T0+70*6e4; G.pSun=-1; G.rx=G.W/2; G.ry=G.H*0.55;}
  G.LKEYS=G.LV.night?[[0,[95,105,165],0.72],[1,[75,85,140],0.78]]:G.LV.boss?[[0,[190,190,205],0.4],[G.pSun,[150,150,175],0.55],[1,[40,42,80],0.85]]:G.LV.snow
    ?[[0,[226,226,236],0.3],[G.pSun,[196,188,210],0.45],[G.pSun+(1-G.pSun)*0.45,[125,122,165],0.6],[1,[36,40,82],0.82]]
    :[[0,[255,224,170],0.22],[G.pSun*0.8,[255,190,120],0.32],[G.pSun,[240,130,90],0.45],[G.pSun+(1-G.pSun)*0.45,[130,100,175],0.58],[1,[40,42,95],0.8]];
  G.leaves=[]; G.bagged=0; G.fell=0; G.elapsed=0; G.playT=0; G.spawnAcc=0; G.snowAmt=0;
  G.score=G.pileBonus=G.dayBonus=G.findBonus=G.bestPile=0; G.dump={n:0,last:0}; G.endedEarly=false; G.popups=[];
  G.pickups=[]; G.active={}; G.nextPower=10; G.tarpScale=1; placeTarp();
  G.amb=null; G.kids=[]; G.nextKid=0; G.kidsT=-1; G.lost=0; G.lostShown=0;
  $('chips').innerHTML=''; G.chipKey='';
  G.gust=null; G.nextGust=G.LV.gustEvery[0]+3; G.env=0; G.wx=G.wy=0; G.drag=false; G.lastCarried=0;
  G.N0=Math.round(clamp(G.W*G.H/420,560,1400)*(G.LV.leafMul||1)*G.DP.leafMul);
  let guard=0;
  while(G.leaves.length<G.N0&&guard++<20000){
    let x,y;
    if(Math.random()<0.6){
      const t=pickTree(), am=(t.a0+t.a1)/2;
      x=t.x+Math.cos(am)*t.r*1.5+gauss()*G.W*0.25; y=t.y+Math.sin(am)*t.r*1.5+gauss()*G.H*0.22;
    }
    else{x=Math.random()*G.W; y=Math.random()*G.H;}
    if(x<G.MINX||x>Math.min(G.MAXX,G.SEAX-20)||y<G.MINY+4||y>G.MAXY||inTarp(x,y,16)||inCanopy(x,y)||onWall(x,y,4)||(G.rival&&inRivalTarp(x,y,14))) continue;
    G.leaves.push(newLeaf(x,y,false));
  }
  // Three finds per round, unfound ones first, each buried under its own little pile.
  const got=new Set(G.store.finds[G.LV.id]||[]);
  const pool=[...G.LV.finds].sort(()=>Math.random()-0.5).sort((a,b)=>got.has(a.id)-got.has(b.id));
  G.items=pool.slice(0,3).map(f=>{
    const [x,y]=lawnSpot(30);
    for(let i=0;i<16;i++) G.leaves.push(newLeaf(clamp(x+gauss()*7*G.K,G.MINX,G.MAXX),clamp(y+gauss()*7*G.K,G.MINY,G.MAXY),false));
    return {...f,x,y,found:false,clearT:0,raked:false,ft:0};
  });
  G.N0=G.leaves.length;
  G.boss=G.LV.boss?initBoss():null; G.moose=G.LV.moose?initMoose():null;
  G.TH=G.LV.boss||G.LV.moose?{fill:0,bags:[],proj:[],ready:false}:null;
  for(const c of [sctx,nctx]){c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,scrape.width,scrape.height);}
  $('sunlabel').textContent=`${DAY_NAMES[G.DAY-1].slice(0,3)} · Sunset ${fmtShort(G.sun.sunset)} · Dusk ${fmtShort(G.sun.dusk)}`;
  $('sunmark').style.left=(G.pSun*100)+'%'; $('sunmark').hidden=G.pSun<0;
  if(G.LV.night) $('sunlabel').textContent=`Full moon · until ${fmtShort(G.T1)}`;
}

export function snapshot(){
  flushDump();
  const pending=G.leaves.filter(l=>l.st===2).length;
  const daleP=G.leaves.filter(l=>l.st===2&&l.owner).length;
  return {lvl:G.LV.id,day:G.DAY,diff:G.store.opts.diff,W:G.W,H:G.H,elapsed:G.elapsed,playT:G.playT,bagged:G.bagged+pending-daleP,rivalBagged:G.rivalBagged+daleP,fell:G.fell,lost:G.lost,score:G.score,pileBonus:G.pileBonus,findBonus:G.findBonus,bestPile:G.bestPile,spawnAcc:G.spawnAcc,
    nextGust:G.nextGust-G.playT,nextPower:G.nextPower-G.playT,clock:G.T0+(G.T1-G.T0)*Math.min(G.elapsed/SECS(),1),
    items:G.items.map(({id,x,y,found,raked})=>({id,x,y,found,raked})),
    leaves:G.leaves.filter(l=>l.st!==2).map(l=>[Math.round(l.x),Math.round(l.y),+l.a.toFixed(2),l.si,l.st,+l.z.toFixed(2),+l.b.toFixed(2)])};
}

export function saveRound(){
  if(G.state!=='play'&&G.state!=='paused'||G.LV.special||G.DAILY) return;
  try{localStorage.setItem(ROUND_KEY,JSON.stringify(snapshot()));}catch(_){}
}

export function restoreRound(s){
  G.selected=s.lvl; G.DAY=G.mapDay=s.day||1; G.store.opts.diff=s.diff; reset();
  const sx=G.W/s.W, sy=G.H/s.H;
  G.leaves=s.leaves.map(([x,y,a,si,st,z,b])=>{const l=newLeaf(clamp(x*sx,G.MINX,G.MAXX),clamp(y*sy,G.MINY,G.MAXY),st===1,si); l.a=a; l.z=z; l.b=b; return l;});
  G.items=s.items.map(it=>({...G.LV.finds.find(f=>f.id===it.id),x:it.x*sx,y:it.y*sy,found:it.found,raked:it.raked,clearT:0,ft:9}));
  ({elapsed:G.elapsed,playT:G.playT,bagged:G.bagged,fell:G.fell,score:G.score,pileBonus:G.pileBonus,findBonus:G.findBonus,bestPile:G.bestPile,spawnAcc:G.spawnAcc}=s);
  G.nextGust=G.playT+s.nextGust; G.nextPower=G.playT+s.nextPower; G.lost=s.lost||0; G.lostShown=G.lost; G.rivalBagged=s.rivalBagged||0;
  G.N0=G.leaves.length+G.bagged+G.lost+G.rivalBagged;
  if(G.LV.snow){
    G.snowAmt=smooth((G.elapsed/SECS()-G.DP.snowStart)/(0.45/G.DP.snowRate));
    nctx.setTransform(1,0,0,1,0,0); nctx.fillStyle=`rgba(244,247,255,${0.8*G.snowAmt})`; nctx.fillRect(0,0,snow.width,snow.height);
  }
}

export function scrapeStroke(x0,y0,x1,y1,dx,dy,half){
  const g=sctx;
  g.setTransform(G.DPR,0,0,G.DPR,0,0);
  g.globalCompositeOperation='source-over';
  g.strokeStyle='rgba(28,40,14,0.22)'; g.lineWidth=1.1;
  g.beginPath();
  for(let k=-4;k<=4;k++){const o=k*half/4.5, nx=-dy*o, ny=dx*o; g.moveTo(x0+nx,y0+ny); g.lineTo(x1+nx,y1+ny);}
  g.stroke();
  if(G.LV.snow){
    nctx.setTransform(G.DPR,0,0,G.DPR,0,0);
    nctx.globalCompositeOperation='destination-out';
    nctx.strokeStyle='rgba(0,0,0,0.85)'; nctx.lineWidth=half*1.9; nctx.lineCap='round';
    nctx.beginPath(); nctx.moveTo(x0,y0); nctx.lineTo(x1,y1); nctx.stroke();
    nctx.globalCompositeOperation='source-over';
  }
}

export function flushDump(){
  const n=G.dump.n; G.dump.n=0;
  if(!n) return;
  const mult=n>=Math.round(60*G.K)?5:n>=Math.round(35*G.K)?3:n>=Math.round(15*G.K)?2:1;
  const base=n*LEAF_PTS, bonus=base*(mult-1);
  G.score+=base+bonus; G.pileBonus+=bonus; G.bestPile=Math.max(G.bestPile,n);
  if(mult>1) popup(`${mult===5?'Monster pile':mult===3?'Big pile':'Nice pile'}  ${n} × ${mult}`,G.tp.x+G.tp.w/2,G.tp.y-10,true);
  crunch(n);
  if(mult>=3){shake(mult===5?7:3); buzz(mult===5?[30,40,50]:25);}
  if(mult===5) award('monster');
}

export function spawnPickup(){
  const k=Math.random()<0.22*G.D.pine*(1-0.2*U('luck'))?'P':'TRS'[(Math.random()*3)|0];
  const [x,y]=lawnSpot(40);
  G.pickups.push({k,x,y,z:1,life:8,got:false});
}

export function activate(u){
  u.got=true;
  const pw=POWERS[u.k];
  G.active[u.k]=pw.dur*(pw.good?1+0.2*U('power'):1);
  popup(pw.good?`${pw.name}!`:`${pw.name}: rake shrinks`,u.x,u.y-18*G.K,pw.good); buzz(pw.good?20:[20,30,20]);
  chime(pw.good);
}

// The rake pushes every leaf in a box ahead of its head into a band at the tines; the band deepens as the
// load grows, so a big pile rides along instead of spraying out. Past a couple dozen leaves the load starts
// slipping under the tines. Snow-buried leaves first need a pass to break loose. Returns how many it carried.
export function rakeLeaves(x0,y0,x1,y1,dt,HALF,lastC){
  const sx=x1-x0, sy=y1-y0, len=Math.hypot(sx,sy);
  if(len<=0.5) return lastC;
  const dx=sx/len, dy=sy/len;
  let vx=sx/dt, vy=sy/dt;
  const sp=Math.hypot(vx,vy);
  if(sp>2200){vx*=2200/sp; vy*=2200/sp;}
  const lc=Math.min(lastC,160), front=(12+lc*0.25)*G.K;
  let c=0;
  for(const l of G.leaves){
    if(l.st!==0) continue;
    const lx=l.x-x1, ly=l.y-y1, along=lx*dx+ly*dy;
    if(along>front||along<-len-8) continue;
    const across=-lx*dy+ly*dx;
    if(Math.abs(across)>HALF) continue;
    if(l.b>0.5){l.b=0; l.vx=vx*0.12; l.vy=vy*0.12; continue;}
    if(l.slip>G.playT) continue;
    if(lc>20&&Math.random()<(lc-20)/80){l.slip=G.playT+0.5; continue;}
    c++;
    const tgt=(3+l.d*(9+lc*0.22))*G.K;
    if(along<tgt){l.x+=dx*(tgt-along); l.y+=dy*(tgt-along);}
    l.vx=vx*0.45; l.vy=vy*0.45; l.va+=(Math.random()-0.5)*4; l.b=0;
  }
  return c;
}

export function animateFlakes(dt){
  for(const f of G.flakes){
    f.y+=(f.v*G.K+G.wy*0.35)*dt; f.x+=(Math.sin(G.playT*1.3+f.ph)*14+G.wx*0.35)*dt;
    if(f.y>G.H+5)f.y-=G.H+10; else if(f.y<-5)f.y+=G.H+10;
    if(f.x>G.W+5)f.x-=G.W+10; else if(f.x<-5)f.x+=G.W+10;
  }
}

export function update(dt){
  G.playT+=dt;
  for(const k in G.active){G.active[k]-=dt; if(G.active[k]<=0) delete G.active[k];}
  if(!G.active.S) G.elapsed+=dt;
  const p=Math.min(G.elapsed/SECS(),1);
  G.tarpScale+=((G.active.T?2.2:1)-G.tarpScale)*Math.min(1,dt*6);
  placeTarp();

  // Leaves fall through most of the round, then stop so the last stretch can be cleaned up.
  if(p<0.8&&!G.LV.boss){
    G.spawnAcc+=dt*(G.N0/300)*(0.3+0.9*p)*G.D.fall*G.DP.fall;
    while(G.spawnAcc>=1){
      G.spawnAcc--;
      const t=pickTree(), a=t.a0+Math.random()*(t.a1-t.a0), rr=t.r*(0.85+Math.random()*1.1);
      G.leaves.push(newLeaf(clamp(t.x+Math.cos(a)*rr,G.MINX,G.MAXX),clamp(t.y+Math.sin(a)*rr,G.MINY,G.MAXY),true));
      G.fell++;
    }
  }

  if(G.playT>=G.nextPower){spawnPickup(); G.nextPower=G.playT+(14+Math.random()*8)/(G.D.power*(1+0.15*U('luck')));}
  for(const u of G.pickups){if(u.z>0) u.z=Math.max(0,u.z-dt/1.2); else u.life-=dt;}
  G.pickups=G.pickups.filter(u=>u.life>0&&!u.got);

  if(!G.gust&&G.playT>=G.nextGust){
    const ang=G.LV.sea&&Math.random()<0.7?(Math.random()-0.5)*1.6:Math.random()*Math.PI*2;
    G.gust={t:0,dur:3.2,dx:Math.cos(ang),dy:Math.sin(ang),str:(700+Math.random()*400)*G.K*G.LV.wind*G.D.wind*G.DP.wind};
  }
  G.env=0; G.wx=G.wy=0;
  if(G.gust){
    G.gust.t+=dt;
    G.env=Math.sin(Math.PI*Math.min(G.gust.t/G.gust.dur,1));
    G.wx=G.gust.dx*G.gust.str*G.env; G.wy=G.gust.dy*G.gust.str*G.env;
    for(const s of G.streaks){
      s.x+=G.gust.dx*900*G.K*dt; s.y+=G.gust.dy*900*G.K*dt;
      if(s.x<-120)s.x+=G.W+240; else if(s.x>G.W+120)s.x-=G.W+240;
      if(s.y<-120)s.y+=G.H+240; else if(s.y>G.H+120)s.y-=G.H+240;
    }
    if(G.gust.t>=G.gust.dur){G.gust=null; G.nextGust=G.playT+(G.LV.gustEvery[0]+Math.random()*(G.LV.gustEvery[1]-G.LV.gustEvery[0]))*G.D.gustGap*G.DP.gustGap;}
  }

  // Snow settles as speckles on its own layer; the rake scrapes paths through it. The storm brings sleet in its second phase.
  if(G.LV.snow||G.LV.boss){
    G.snowAmt=G.LV.boss?G.snowAmt+((G.boss.phase>=2?0.7:0)-G.snowAmt)*Math.min(1,dt*0.4):smooth((p-G.DP.snowStart)/(0.45/G.DP.snowRate));
    if(G.snowAmt>0){
      nctx.setTransform(G.DPR,0,0,G.DPR,0,0);
      nctx.fillStyle='rgba(244,247,255,0.22)';
      let n=G.W*G.H*0.0016*G.snowAmt*dt; n=Math.floor(n)+(Math.random()<n%1?1:0);
      nctx.beginPath();
      for(let i=0;i<n;i++){const x=Math.random()*G.W, y=Math.random()*G.H, r=(2.5+Math.random()*4)*G.K; nctx.moveTo(x+r,y); nctx.arc(x,y,r,0,6.283);}
      nctx.fill();
    }
    animateFlakes(dt);
  }
  if(G.boss) updateBoss(dt);
  if(G.moose) updateMoose(dt);
  if(G.TH){updateThrows(dt); if(G.state!=='play') return;}

  G.grid.fill(0);
  for(const l of G.leaves) if(l.st===0) G.grid[(l.y/CELL|0)*G.gw+(l.x/CELL|0)]++;

  if(G.walls.length) for(const l of G.leaves){l.px=l.x; l.py=l.y;}
  G.carried=0; G.rakeSpeed*=Math.exp(-10*dt);
  if(G.drag&&vacOn()){vacuum(dt); G.px=G.rx; G.py=G.ry;}
  else if(G.drag){
    const sx=G.rx-G.px, sy=G.ry-G.py, len=Math.hypot(sx,sy);
    if(len>0.5){
      const dx=sx/len, dy=sy/len;
      G.rdx+=(dx-G.rdx)*0.35; G.rdy+=(dy-G.rdy)*0.35;
      const rl=Math.hypot(G.rdx,G.rdy)||1; G.rdx/=rl; G.rdy/=rl;
      G.rakeSpeed=Math.min(len/dt,2200);
      const HALF=rakeHalf();
      G.carried=G.lastCarried=rakeLeaves(G.px,G.py,G.rx,G.ry,dt,HALF,G.lastCarried);
      const inBox=(x,y,pad)=>{const lx=x-G.rx, ly=y-G.ry, al=lx*dx+ly*dy; return al<=14*G.K+pad&&al>=-len-10-pad&&Math.abs(-lx*dy+ly*dx)<=HALF+pad;};
      for(const it of G.items) if(!it.raked&&inBox(it.x,it.y,0)) it.raked=true;
      for(const u of G.pickups) if(u.z<=0&&!u.got&&inBox(u.x,u.y,8*G.K)) activate(u);
      for(const k of G.kids) if(k.st==='seek'&&inBox(k.x,k.y,12*G.K)){k.st='shoo'; G.score+=50; stat('shoo'); popup('Shoo!  +50',k.x,k.y-24*G.K,false);}
      scrapeStroke(G.px,G.py,G.rx,G.ry,dx,dy,HALF);
    }
    G.px=G.rx; G.py=G.ry;
  }
  if(G.rival) updateRival(dt);

  if(G.LV.kids) updateKids(dt,p);

  const spin=Math.exp(-4*dt), bx=G.bag.x, by=G.bag.y-14*G.K, bury=0.045*G.DP.snowRate*G.snowAmt*dt;
  G.groundLeft=0;
  for(let i=G.leaves.length-1;i>=0;i--){
    const l=G.leaves[i];
    if(l.st===1){
      l.z-=dt*0.55;
      l.x+=(Math.sin(G.playT*2.2+l.ph)*40*G.K+18*G.K+(l.fx||0)+G.wx*0.25)*dt;
      l.y+=(26*G.K+(l.fy||0)+G.wy*0.25)*dt;
      l.a+=dt*2*Math.sin(l.ph+G.playT);
      l.x=clamp(l.x,G.MINX,G.MAXX); l.y=clamp(l.y,G.MINY,G.MAXY);
      if(l.z<=0){l.z=0; l.st=0; if(G.walls.length){l.px=undefined; wallCollide(l);}}
      continue;
    }
    if(l.st===2){
      l.bt+=dt*2.2;
      const k=Math.min(1,dt*7);
      const tx=l.vac?G.rx:l.owner?G.rival.tarp.x+G.rival.tarp.w/2:bx, ty=l.vac?G.ry:l.owner?G.rival.tarp.y+G.rival.tarp.h/2:by;
      l.x+=(tx-l.x)*k; l.y+=(ty-l.y)*k; l.a+=dt*6;
      if(l.bt>=(l.vac?0.45:1)){if(l.owner) G.rivalBagged++; else{G.bagged++; if(l.vac) G.score+=LEAF_PTS; if(G.TH) thBagged();} G.leaves[i]=G.leaves[G.leaves.length-1]; G.leaves.pop();}
      continue;
    }
    // Leaves in a dense pile shelter each other from wind and drag on each other, so piles settle fast.
    const n=G.grid[(l.y/CELL|0)*G.gw+(l.x/CELL|0)], sh=1/(1+n/4), lift=l.lift*(1-0.6*l.b);
    l.vx+=(G.wx+(G.LV.sea?G.DP.breeze*G.K:0))*sh*lift*dt; l.vy+=G.wy*sh*lift*dt;
    if(G.env>0) l.va+=(Math.random()-0.5)*G.env*sh*40*dt;
    const damp=Math.exp(-(9+Math.min(n,20)*0.5)*dt);
    l.vx*=damp; l.vy*=damp; l.va*=spin;
    l.x+=l.vx*dt; l.y+=l.vy*dt; l.a+=l.va*dt;
    if(l.x<G.MINX){l.x=G.MINX; l.vx=Math.abs(l.vx)*0.4;} else if(l.x>G.MAXX){l.x=G.MAXX; l.vx=-Math.abs(l.vx)*0.4;}
    if(l.y<G.MINY){l.y=G.MINY; l.vy=Math.abs(l.vy)*0.4;} else if(l.y>G.MAXY){l.y=G.MAXY; l.vy=-Math.abs(l.vy)*0.4;}
    if(G.LV.wall) wallCollide(l);
    if(l.x>G.SEAX){
      G.lost++; G.leaves[i]=G.leaves[G.leaves.length-1]; G.leaves.pop();
      if(G.lost-G.lostShown>=15){G.lostShown=G.lost; popup(`${G.lost} lost to the Atlantic`,G.SEAX-70*G.K,clamp(l.y,G.MINY+30,G.MAXY-30),false);}
      continue;
    }
    if(bury>0) l.b=Math.min(1,l.b+bury);
    if(inTarp(l.x,l.y,-4)){
      if(Math.hypot(l.vx,l.vy)<35) l.rest+=dt; else l.rest=0;
      if(l.rest>l.restT){l.st=2; l.bt=0; G.dump.n++; G.dump.last=G.playT;}
    }else if(G.rival&&inRivalTarp(l.x,l.y,-4)){
      if(Math.hypot(l.vx,l.vy)<35) l.rest+=dt; else l.rest=0;
      if(l.rest>l.restT){l.st=2; l.bt=0; l.owner=1;}
    }else{l.rest=0; G.groundLeft++;}
  }
  if(G.dump.n&&G.playT-G.dump.last>0.5) flushDump();

  // A find counts once no leaves cover it (and, in snow, once the rake has scraped over it).
  const fr=15*G.K;
  for(const it of G.items){
    if(it.found){it.ft+=dt; continue;}
    let covered=false;
    for(const l of G.leaves) if(l.st===0&&Math.abs(l.x-it.x)<fr&&Math.abs(l.y-it.y)<fr){covered=true; break;}
    if(!covered&&(!G.LV.snow||it.raked)) it.clearT+=dt; else it.clearT=0;
    if(it.clearT>0.25){
      it.found=true; G.score+=FIND_PTS; G.findBonus+=FIND_PTS;
      popup(`Found: ${it.name}  +${FIND_PTS}`,it.x,it.y-18*G.K,false); sparkle();
      const got=G.store.finds[G.LV.id]||(G.store.finds[G.LV.id]=[]);
      if(!got.includes(it.id)){got.push(it.id); save();}
    }
  }

  for(const pp of G.popups) pp.t+=dt;
  G.popups=G.popups.filter(pp=>pp.t<1.8);

  sctx.setTransform(1,0,0,1,0,0);
  sctx.globalCompositeOperation='destination-out';
  sctx.fillStyle='rgba(0,0,0,0.02)';
  sctx.fillRect(0,0,scrape.width,scrape.height);

  updateChips(p);
  audioTick(); ambTick(dt,p);
  if(!G.LV.boss&&G.playT>8&&G.groundLeft<=Math.max(4,Math.round(G.N0*0.02))) finish(true);
  else if(G.elapsed>=SECS()) finish(false);
}

export function updateChips(p){
  const list=[];
  if(!G.gust&&G.playT>=G.nextGust-1.6) list.push(['','Gust incoming']);
  else if(G.LV.snow&&p>G.DP.snowStart-0.03&&p<G.DP.snowStart+0.05) list.push(['','Snow moving in']);
  else if(G.LV.kids&&G.kidsT>=0&&G.playT-G.kidsT<2.5) list.push(['bad','Trick-or-treaters!']);
  else if(G.LV.fog){
    const i=G.DP.fogBanks.findIndex(([c,w])=>p>c-w-0.05&&p<c-w*0.4);
    if(i>=0){list.push(['','Fog rolling in']); if(G.hornAt!==i){G.hornAt=i; foghorn();}}
  }
  if(!G.LV.boss&&G.state==='play'){
    const thr=Math.max(4,Math.round(G.N0*0.02));
    if(G.groundLeft<=thr+30&&G.groundLeft>thr) list.push(['good',`${G.groundLeft-thr} leaves to a clean lawn`]);
  }
  if(G.moose&&G.moose.mode!=='gone') list.push([G.moose.mode==='charge'?'bad':'',G.moose.mode==='charge'?'The moose is charging the tarp!':G.moose.mode==='away'||G.moose.mode==='flee'?'The moose ran off. He’ll be back':`Moose: ${G.moose.hp} hits to go`]);
  if(G.rival) list.push([G.bagged>=G.rivalBagged?'good':'bad',`You ${G.bagged} · Dale ${G.rivalBagged}`]);
  for(const k of 'STRP') if(G.active[k]) list.push([POWERS[k].good?'good':'bad',`${POWERS[k].name} ${Math.ceil(G.active[k])}`]);
  const key=list.map(c=>c.join(':')).join('|');
  if(key===G.chipKey) return;
  G.chipKey=key;
  $('chips').innerHTML=list.map(([c,t])=>`<span class="chip ${c}">${t}</span>`).join('');
}

export function starsFor(pct,early){return (early&&pct>=80)||pct>=90?3:pct>=75?2:pct>=50?1:0;}

export const starText=n=>'★'.repeat(n)+`<span class="off">${'★'.repeat(3-n)}</span>`;

export const bestKey=()=>G.DAILY?`daily:${G.DAILY.key}`:`${G.LV.id}:d${G.DAY}:${G.store.opts.diff}`;

export function finish(early){
  if(G.LV.boss) return bossLost();
  G.endedEarly=early; G.state='over'; G.drag=false; G.showRake=false; G.active={}; $('chips').innerHTML=''; G.chipKey='';
  clearRound(); leaveTrap();
  G.endClock=G.T0+(G.T1-G.T0)*Math.min(G.elapsed/SECS(),1);
  // Leaves already on the tarp go in the bag.
  for(const l of G.leaves){
    if(l.st===2&&l.owner||G.rival&&l.st===0&&inRivalTarp(l.x,l.y,-4)){G.rivalBagged++; l.gone=true;}
    else if(l.st===2||(l.st===0&&inTarp(l.x,l.y,-4))){if(l.st===0) G.dump.n++; if(l.vac) G.score+=LEAF_PTS; l.done=true;}
  }
  G.bagged+=G.leaves.filter(l=>l.done).length;
  G.leaves=G.leaves.filter(l=>!l.gone);
  G.leaves=G.leaves.filter(l=>!l.done);
  flushDump();
  const left=G.leaves.length, pct=Math.round(100*(G.bagged+G.rivalBagged)/Math.max(1,G.bagged+G.rivalBagged+left+G.lost));
  const beatDale=G.rival&&G.bagged>G.rivalBagged, daleBonus=beatDale?1000:0;
  G.score+=daleBonus;
  const minsLeft=Math.round((G.T1-G.endClock)/6e4);
  if(early){G.dayBonus=Math.round((SECS()-G.elapsed)*DAYLIGHT_PTS*pct/100); G.score+=G.dayBonus;}
  const stars=G.rival&&!beatDale?Math.min(1,starsFor(pct,early)):starsFor(pct,early);
  const prev=G.store.best[bestKey()], isBest=!prev||G.score>prev.score;
  if(isBest){G.store.best[bestKey()]={score:G.score,stars:Math.max(stars,prev?prev.stars:0)}; save();}
  else if(stars>prev.stars){prev.stars=stars; save();}
  // A star unlocks the next day; every bagged leaf goes to the shed.
  const unlockedNext=!G.DAILY&&!G.LV.special&&stars>=1&&G.DAY<5&&(G.store.unlocked[G.LV.id]||1)<G.DAY+1;
  if(!G.DAILY&&!G.LV.special&&stars>=1&&G.DAY<5) G.store.unlocked[G.LV.id]=Math.max(G.store.unlocked[G.LV.id]||1,G.DAY+1);
  G.store.bank+=G.bagged; G.store.total+=G.bagged;
  stat('lost',G.lost); stat('days');
  if(beatDale&&!G.store.dale.includes(G.LV.id)) G.store.dale.push(G.LV.id);
  if(G.DAILY) G.store.dailyLog[G.DAILY.key]=true;
  save();
  if(G.store.total>=100) award('firstbag');
  if(G.store.total>=50000) award('million');
  if(early&&stars>=1) award('sun');
  if(G.DAILY&&dailyStreak()>=3) award('daily');
  if(G.LV.night&&stars===3) award('night');
  if(G.LV.fog&&stars===3) award('fog');
  if(G.LV.wall&&G.DAY===5&&stars===3) award('stone');
  if(G.LV.sea&&G.lost<20&&stars>=1) award('seawall');
  if(Object.keys(LEVELS).every(id=>G.store.dale.includes(id))) award('dale');
  if(Object.keys(LEVELS).every(id=>(G.store.finds[id]||[]).length>=LEVELS[id].finds.length)) award('curator');

  $('verdict').innerHTML=(G.rival?(beatDale?'You beat Dale':'Dale wins this one'):early?'Lawn clear':pct>=90?'Clean lawn':pct>=70?'Good enough for October':pct>=40?'Half a lawn':'There’s always tomorrow')+(isBest&&G.score>0?'<span class="best">New best</span>':'');
  $('endtime').textContent=`${G.LV.town}${G.LV.special?'':` · ${DAY_NAMES[G.DAY-1]}`} · `+(G.LV.night?(early?`${minsLeft} min of moonlight left`:`moonset ${fmtTime.format(G.T1)}`):early?`beat the sun by ${minsLeft} min`:`civil dusk ${fmtTime.format(G.T1)}`);
  $('stars').innerHTML=starText(stars); $('statsRow').hidden=false; $('again').textContent='Rake again'; $('toMap').textContent='Map';
  $('stars').setAttribute('aria-label',`${stars} of 3 stars`);
  $('rScore').textContent=num(G.score); $('rPct').textContent=pct+'%'; $('rBags').textContent=Math.ceil(G.bagged/BAG_SIZE);
  const rows=[[`Leaves bagged (${num(G.bagged)} × ${LEAF_PTS})`,num(G.bagged*LEAF_PTS)]];
  if(G.pileBonus) rows.push([`Pile bonuses (best pile ${G.bestPile})`,'+'+num(G.pileBonus)]);
  if(G.dayBonus) rows.push([`Daylight left (${minsLeft} min)`,'+'+num(G.dayBonus)]);
  const foundNow=G.items.filter(i=>i.found);
  if(G.findBonus) rows.push([`Finds (${foundNow.length})`,'+'+num(G.findBonus)]);
  if(G.lost) rows.push(['Lost over the cliff',`${num(G.lost)} leaves`]);
  if(G.moose) rows.push([G.moose.mode==='gone'?'Drove off the moose':'The moose stayed all evening',G.moose.mode==='gone'?'+1,500':'—']);
  if(G.rival) rows.push([beatDale?`Beat Dale (${num(G.bagged)} to ${num(G.rivalBagged)})`:`Dale bagged more (${num(G.rivalBagged)} to ${num(G.bagged)}); stars capped at 1`,beatDale?'+'+num(daleBonus):'—']);
  $('breakdown').innerHTML=rows.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('');
  const got=new Set(G.store.finds[G.LV.id]||[]);
  $('rFinds').innerHTML=G.LV.finds.map(f=>got.has(f.id)?`<span class="find">${f.e} ${esc(f.name)}</span>`:`<span class="find missing">? Not found yet</span>`).join('');
  const week=stars>=1&&G.DAY===5?` You finished the ${G.LV.town} week.`:unlockedNext?` ${DAY_NAMES[G.DAY]} is unlocked.`:'';
  $('rNote').textContent=`${G.DAILY?`Daily lawn for ${G.DAILY.key}. `:''}+${num(G.bagged)} leaves to the shed (${num(G.store.bank)} to spend).${week}${G.LV.finds.length?` ${G.LV.state} finds: ${got.size} of ${G.LV.finds.length}.`:''} ${G.D.name} difficulty.`;
  $('shareCard').hidden=!G.DAILY;
  if(G.DAILY){
    G.shareText=shareText({key:G.DAILY.key,town:G.LV.town,state:G.LV.state,dayName:DAY_NAMES[G.DAY-1],stars,pct,score:G.score,early,minsLeft,
      dale:G.rival?{won:beatDale,you:G.bagged,him:G.rivalBagged}:null,finds:G.items.filter(i=>i.found).length,streak:dailyStreak()});
    $('shareText').textContent=G.shareText; $('shareStatus').textContent=''; $('shareBtn').textContent='Share result';
  }
  const canNext=!G.DAILY&&!G.LV.special&&G.DAY<5&&(G.store.unlocked[G.LV.id]||1)>G.DAY;
  $('nextDay').hidden=!canNext;
  if(canNext) $('nextDay').textContent=`Rake ${DAY_NAMES[G.DAY]}`;
  $('again').className=canNext?'secondary':'primary';
  audioTick(); stinger(stars);
  setTimeout(()=>{if(G.state==='over'){show('end'); (canNext?$('nextDay'):$('again')).focus();}},700);
}

// Leaves within R of (x,y) burst outward: a kid landing in a pile, a lightning strike.
export function scatterAt(x,y,R,str){
  for(const l of G.leaves){
    if(l.st!==0) continue;
    const lx=l.x-x, ly=l.y-y, ld=Math.hypot(lx,ly);
    if(ld>R) continue;
    const a=ld>0.5?Math.atan2(ly,lx):Math.random()*6.283, v=(260+Math.random()*260)*G.K*str*(1-0.4*ld/R);
    l.vx+=Math.cos(a)*v; l.vy+=Math.sin(a)*v; l.va+=(Math.random()-0.5)*20;
  }
}
