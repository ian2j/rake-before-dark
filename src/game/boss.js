// The Nor’easter, and the bag throwing it shares with the moose.
import {G} from './state.js';
import {BAG_LEAVES, BOSS, BOSS_HP} from '../data/levels.js';
import {noiseHit, thunder, tones} from './audio.js';
import {ctx} from './canvas.js';
import {densestPile} from './kids.js';
import {lawnSpot} from './lawn.js';
import {newLeaf} from './leaves.js';
import {hitMoose} from './moose.js';
import {award, buzz, shake} from './polish.js';
import {popup, scatterAt} from './round.js';
import {leaveTrap, show} from './screens.js';
import {save} from './store.js';
import {$, clamp, fmtTime, gauss, lerp, num} from '../lib/util.js';

export function initBoss(){return {x:G.W/2,y:G.MINY+64*G.K,r:58*G.K,hp:BOSS_HP,t:0,flash:0,strike:null,nextStrike:5,nextWave:2,phase:1,screen:0,fog:0,fade:0};}

export const bagSlot=i=>[G.tp.x+G.tp.w*(0.2+0.3*i),G.tp.y+G.tp.h*0.45];

export function spawnBag(){
  const B=G.TH;
  while(B.fill>=BAG_LEAVES&&B.bags.length<3){
    B.fill-=BAG_LEAVES;
    const i=[0,1,2].find(j=>!B.bags.some(b=>b.i===j)), [x,y]=bagSlot(i);
    B.bags.push({i,x,y});
    if(!B.ready){B.ready=true; popup(G.LV.moose?'Bag full! Flick it at the moose':'Bag full! Flick it up at the storm',G.tp.x+G.tp.w/2,G.tp.y-24*G.K,true); buzz(25);}
  }
}

export function thBagged(){G.TH.fill++; spawnBag();}

export function releaseBag(){
  const g=G.grab; G.grab=null;
  const now=g.pts[g.pts.length-1];
  let old=g.pts[0];
  for(const q of g.pts) if(now[2]-q[2]<=90){old=q; break;}
  const t=Math.max(16,now[2]-old[2])/1000, vx=(now[0]-old[0])/t, vy=(now[1]-old[1])/t;
  if(G.LV.boss?vy<-250:Math.hypot(vx,vy)>300) launchBag(g.b,vx,vy);
  else{const [x,y]=bagSlot(g.b.i); g.b.x=x; g.b.y=y;}
}

export function launchBag(b,vx,vy){
  const B=G.TH, L=Math.hypot(vx,vy)||1, sp=clamp(L,800,1600)*G.K;
  B.bags=B.bags.filter(o=>o!==b);
  B.proj.push({x:b.x,y:b.y,vx:vx/L*sp,vy:vy/L*sp,rot:0});
  noiseHit(600,0.6,0.25,0.3); spawnBag();
}

export function updateBoss(dt){
  const B=G.boss;
  B.t+=dt; B.flash=Math.max(0,B.flash-dt*3); B.screen=Math.max(0,B.screen-dt*2.5);
  B.phase=B.hp>8?1:B.hp>4?2:3;
  B.fog+=((B.phase===3?0.45:0)-B.fog)*Math.min(1,dt*0.5);
  B.x=G.W/2+Math.sin(B.t*(0.45+0.12*B.phase))*(G.W/2-B.r-16);
  if(G.playT>=B.nextWave){
    const n=Math.round((16+6*B.phase)*Math.max(1,G.W*G.H/330000));
    for(let i=0;i<n;i++){
      const l=newLeaf(clamp(B.x+gauss()*B.r*0.5,G.MINX,G.MAXX),clamp(B.y+B.r*0.5,G.MINY,G.MAXY),true);
      l.fx=gauss()*70*G.K; l.fy=(60+Math.random()*120)*G.K; G.leaves.push(l);
    }
    G.fell+=n; B.nextWave=G.playT+5.2-0.9*B.phase;
  }
  if(B.phase===3){
    if(!B.strike&&G.playT>=B.nextStrike){const t=densestPile(8)||lawnSpot(40); B.strike={x:t[0],y:t[1],t:0,hit:false};}
    if(B.strike){
      B.strike.t+=dt;
      if(B.strike.t>=1.1&&!B.strike.hit){B.strike.hit=true; scatterAt(B.strike.x,B.strike.y,70*G.K,1.4); B.screen=1; shake(9); buzz([50,40,80]); thunder();}
      if(B.strike.t>1.5){B.strike=null; B.nextStrike=G.playT+5+Math.random()*3;}
    }
  }
}

// Thrown bags fly straight; they hit the storm or a moose that isn't already running off.
export function updateThrows(dt){
  const B=G.TH, tgt=G.boss?{x:G.boss.x,y:G.boss.y,r:G.boss.r*0.95}:G.moose&&['wander','charge'].includes(G.moose.mode)?{x:G.moose.x,y:G.moose.y,r:32*G.K}:null;
  for(const pr of B.proj){
    pr.x+=pr.vx*dt; pr.y+=pr.vy*dt; pr.rot+=dt*9;
    if(tgt&&Math.hypot(pr.x-tgt.x,pr.y-tgt.y)<tgt.r){pr.done=true; if(G.boss) hitBoss(); else hitMoose(); if(G.state!=='play') return;}
    else if(pr.y<-60||pr.y>G.H+60||pr.x<-60||pr.x>G.W+60){pr.done=true; popup('Missed',clamp(pr.x,50,G.W-50),clamp(pr.y,G.MINY+30*G.K,G.MAXY-30*G.K),false);}
  }
  B.proj=B.proj.filter(pr=>!pr.done);
}

export function hitBoss(){
  const B=G.boss;
  B.hp--; B.flash=1; shake(8); buzz(60); tones([392,523],'square',0.08,0.25,0.1);
  popup(B.hp===8?'Hit! Sleet is coming':B.hp===4?'Hit! Fog and lightning':B.hp>0?'Direct hit!':'The storm breaks!',B.x,B.y+B.r+16*G.K,true);
  if(B.hp<=0) bossWon();
}

export function drawLaunchBag(x,y,s,rot){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.scale(s*G.K,s*G.K);
  ctx.fillStyle=`rgba(255,210,122,${0.22+0.15*Math.sin(G.playT*6)})`; ctx.beginPath(); ctx.arc(0,0,24,0,6.283); ctx.fill();
  ctx.fillStyle='#b98a55'; ctx.fillRect(-13,-16,26,32);
  ctx.fillStyle='#8a6438'; ctx.fillRect(-13,-16,26,4);
  for(const [lx,c] of [[-7,'#c94c20'],[0,'#e5832a'],[7,'#efb13c']]){ctx.fillStyle=c; ctx.beginPath(); ctx.arc(lx,-17-(lx?0:2),4.5,0,6.283); ctx.fill();}
  ctx.strokeStyle='#7e5a33'; ctx.lineWidth=1.5; ctx.strokeRect(-13,-16,26,32);
  ctx.restore();
}

export function drawBossLow(){
  if(!G.TH||G.state==='ending') return;
  const B=G.boss;
  if(B&&B.strike&&!B.strike.hit){
    ctx.strokeStyle=`rgba(255,80,60,${0.45+0.4*Math.sin(B.strike.t*22)})`; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(B.strike.x,B.strike.y,(72-30*B.strike.t)*G.K,0,6.283); ctx.stroke();
  }
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(G.tp.x,G.tp.y+G.tp.h+4,G.tp.w,5*G.K);
  ctx.fillStyle='#c9622a'; ctx.fillRect(G.tp.x,G.tp.y+G.tp.h+4,G.tp.w*Math.min(1,G.TH.fill/BAG_LEAVES),5*G.K);
  for(const b of G.TH.bags) drawLaunchBag(b.x,b.y,1,0);
}

export const PUFFS=[[-0.7,0.12,0.5],[-0.38,-0.22,0.58],[0.08,-0.34,0.64],[0.5,-0.16,0.55],[0.78,0.14,0.44],[0,0.14,0.7],[-0.4,0.22,0.5],[0.42,0.22,0.5]];

export function drawBossHigh(){
  if(!G.boss) return;
  const B=G.boss, fade=1-B.fade;
  if(fade<=0) return;
  ctx.save(); ctx.globalAlpha=fade;
  if(B.strike&&B.strike.hit&&B.strike.t<1.35){
    ctx.strokeStyle='#fffbe0'; ctx.lineWidth=3.5*G.K; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(B.x,B.y+B.r*0.5);
    for(let i=1;i<=7;i++){const f=i/7; ctx.lineTo(lerp(B.x,B.strike.x,f)+(i<7?(Math.random()-0.5)*30*G.K:0),lerp(B.y+B.r*0.5,B.strike.y,f));}
    ctx.stroke();
  }
  const cx=B.x+(B.flash>0?(Math.random()-0.5)*8*B.flash:0), cy=B.y, r=B.r;
  const body=B.phase===1?'#5d6475':B.phase===2?'#4d5364':'#3c4150';
  ctx.fillStyle='rgba(0,0,0,0.18)';
  for(const [ox,oy,rr] of PUFFS){ctx.beginPath(); ctx.arc(cx+ox*r+6,cy+oy*r+10,rr*r,0,6.283); ctx.fill();}
  ctx.fillStyle=body;
  for(const [ox,oy,rr] of PUFFS){ctx.beginPath(); ctx.arc(cx+ox*r,cy+oy*r,rr*r,0,6.283); ctx.fill();}
  ctx.fillStyle='rgba(255,255,255,0.12)';
  for(const [ox,oy,rr] of PUFFS.slice(0,5)){ctx.beginPath(); ctx.arc(cx+ox*r-rr*r*0.2,cy+oy*r-rr*r*0.25,rr*r*0.55,0,6.283); ctx.fill();}
  ctx.fillStyle='#f4f1ea';
  for(const s of [-1,1]){ctx.beginPath(); ctx.ellipse(cx+s*r*0.28,cy+r*0.02,r*0.13,r*0.08,s*0.35,0,6.283); ctx.fill();}
  ctx.fillStyle='#1c1530';
  for(const s of [-1,1]){ctx.beginPath(); ctx.arc(cx+s*r*0.25,cy+r*0.04,r*0.045,0,6.283); ctx.fill();}
  ctx.strokeStyle='#1c1530'; ctx.lineWidth=3*G.K; ctx.lineCap='round'; ctx.beginPath();
  for(const s of [-1,1]){ctx.moveTo(cx+s*r*0.12,cy-r*0.1); ctx.lineTo(cx+s*r*0.42,cy-r*0.2);}
  ctx.moveTo(cx-r*0.18,cy+r*0.3); ctx.quadraticCurveTo(cx,cy+r*0.18,cx+r*0.18,cy+r*0.3);
  ctx.stroke();
  if(B.flash>0){
    ctx.globalAlpha=fade*B.flash*0.8; ctx.fillStyle='#ffffff';
    for(const [ox,oy,rr] of PUFFS){ctx.beginPath(); ctx.arc(cx+ox*r,cy+oy*r,rr*r,0,6.283); ctx.fill();}
    ctx.globalAlpha=fade;
  }
  const bw=130*G.K, bx=cx-bw/2, by=cy+r*0.75+10;
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx-2,by-2,bw+4,9);
  ctx.fillStyle='#e05a3a'; ctx.fillRect(bx,by,bw*Math.max(0,B.hp)/BOSS_HP,5);
  ctx.restore();
}

export function drawProj(){if(G.TH) for(const pr of G.TH.proj) drawLaunchBag(pr.x,pr.y,0.9,pr.rot);}

export function bossWon(){
  G.state='ending'; G.drag=false; G.showRake=false; G.grab=null; G.active={}; G.gust=null; G.env=0; G.wx=G.wy=0;
  $('chips').innerHTML=''; G.chipKey=''; leaveTrap();
  G.store.bank+=G.bagged; G.store.total+=G.bagged; G.store.beatBoss=true; save(); award('storm');
  G.TH.proj=[]; G.TH.bags=[]; G.boss.strike=null;
  tones([392,523,659,784],'triangle',0.14,0.5,0.16);
  G.ending={sub:'snow',t:0}; show(null);
}

export function bossLost(){
  G.state='over'; G.drag=false; G.showRake=false; G.grab=null; G.active={}; $('chips').innerHTML=''; G.chipKey=''; leaveTrap();
  G.store.bank+=G.bagged; G.store.total+=G.bagged; save();
  $('verdict').textContent='The Nor’easter wins this time';
  $('endtime').textContent=`${BOSS.town} · dusk ${fmtTime.format(G.T1)}`;
  $('stars').innerHTML=''; $('statsRow').hidden=true; $('shareCard').hidden=true; $('rFinds').innerHTML='';
  $('breakdown').innerHTML=`<dt>Hits on the storm</dt><dd>${BOSS_HP-G.boss.hp} of ${BOSS_HP}</dd><dt>Leaves bagged</dt><dd>${num(G.bagged)}</dd>`;
  $('rNote').textContent=`+${num(G.bagged)} leaves to the shed. Fill bags quickly in the first phase, and aim where the storm is heading.`;
  $('nextDay').hidden=true; $('again').textContent='Try again'; $('again').className='primary'; $('toMap').textContent='Map';
  setTimeout(()=>{if(G.state==='over'){show('end'); $('again').focus();}},700);
}
