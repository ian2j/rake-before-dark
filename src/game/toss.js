// Bag toss at the fall fair.
import {G} from './state.js';
import {TOSS_SECS} from '../data/levels.js';
import {initAudio, noiseHit, tones} from './audio.js';
import {drawLaunchBag} from './boss.js';
import {ctx, grass} from './canvas.js';
import {drawPopups} from './draw.js';
import {award, buzz, shake} from './polish.js';
import {popup} from './round.js';
import {goTitle, leaveTrap, pushTrap, show} from './screens.js';
import {save} from './store.js';
import {$, clamp, num} from '../lib/util.js';

export function startToss(){
  initAudio(); G.state='toss'; G.popups=[]; leaveTrap(); show(null); $('hud').style.visibility='hidden'; $('tossQuit').hidden=false; pushTrap();
  G.TOSS={t:0,score:0,throws:0,hits:0,bag:null,fly:[],landed:[],grab:null,wind:0,cart:{x:G.W*0.3,dir:1},over:false,
    rings:[[0.28,0.66,42,10],[0.72,0.64,42,10],[0.5,0.47,36,25],[0.27,0.27,30,50],[0.73,0.25,30,50]].map(([x,y,r,pts])=>({x:G.W*x,y:G.MINY+(G.H-G.MINY)*y*0.92,r:r*G.K,pts}))};
  tossNextBag();
}

export function tossNextBag(){G.TOSS.bag={x:G.W/2,y:G.H-G.SAFE_B-64*G.K,hx:G.W/2,hy:G.H-G.SAFE_B-64*G.K}; G.TOSS.wind=G.TOSS.throws<2?0:(Math.random()-0.5)*1.4;}

// Drag the bag back toward you to aim: the pull sets direction and distance, and a preview shows where it lands, wind included.
// A quick upward flick still throws too.
export const PULL_MAX=()=>Math.min(190*G.K,(G.H-G.MINY)*0.3), TOSS_RANGE=()=>(G.H-G.MINY)*0.82;

export function tossAim(b){
  const px=b.hx-b.x, py=b.hy-b.y, pl=Math.hypot(px,py);
  if(pl<18*G.K||py>-4*G.K) return null;
  const f=Math.min(1,pl/PULL_MAX()), range=40*G.K+f*(TOSS_RANGE()-40*G.K);
  return {dx:px/pl,dy:py/pl,range};
}

export const tossLand=(b,a)=>[b.hx+a.dx*a.range+G.TOSS.wind*55*G.K,b.hy+a.dy*a.range];

export function tossDown(x,y,id){const b=G.TOSS.bag; if(!b||G.TOSS.over) return; if(Math.hypot(x-b.x,y-b.y)<70*G.K) G.TOSS.grab={id,pts:[[x,y,performance.now()]]};}

export function tossMove(x,y,id){const g=G.TOSS&&G.TOSS.grab; if(!g||g.id!==id) return; const b=G.TOSS.bag, dx=x-b.hx, dy=y-b.hy, dl=Math.hypot(dx,dy), m=Math.min(1,PULL_MAX()/(dl||1)); b.x=dy>0?b.hx+dx*m:x; b.y=dy>0?b.hy+dy*m:y; g.pts.push([x,y,performance.now()]); if(g.pts.length>8) g.pts.shift();}

export function tossUp(id){
  const g=G.TOSS&&G.TOSS.grab; if(!g||g.id!==id) return; G.TOSS.grab=null;
  const now=g.pts[g.pts.length-1]; let old=g.pts[0];
  for(const q of g.pts) if(now[2]-q[2]<=90){old=q; break;}
  const t=Math.max(16,now[2]-old[2])/1000, vx=(now[0]-old[0])/t, vy=(now[1]-old[1])/t;
  const aim=tossAim(G.TOSS.bag);
  if(aim) tossSling(aim);
  else if(vy<-200) tossThrow(vx,vy);
  else{G.TOSS.bag.x=G.TOSS.bag.hx; G.TOSS.bag.y=G.TOSS.bag.hy;}
}

export function tossSling(a){const b=G.TOSS.bag; b.x=b.hx; b.y=b.hy; tossLaunch(a.dx,a.dy,a.range);}

export function tossThrow(vx,vy){
  const sp=Math.hypot(vx,vy)||1;
  tossLaunch(vx/sp,vy/sp,clamp(sp*0.28*G.K,60*G.K,TOSS_RANGE()));
}

export function tossLaunch(dx,dy,range){
  const b=G.TOSS.bag;
  G.TOSS.fly.push({x0:b.x,y0:b.y,dx,dy,range,u:0,drift:G.TOSS.wind*55*G.K,rot:0});
  G.TOSS.throws++; G.TOSS.bag=null; noiseHit(600,0.6,0.22,0.25);
  setTimeout(()=>{if(G.TOSS&&!G.TOSS.over) tossNextBag();},350);
}

export function updateToss(dt){
  const T=G.TOSS; T.t+=dt; G.playT+=dt;
  const c=T.cart; c.x+=c.dir*70*G.K*dt; if(c.x>G.W*0.85) c.dir=-1; else if(c.x<G.W*0.15) c.dir=1;
  for(const f of T.fly){
    f.u+=dt/0.75; f.rot+=dt*8;
    if(f.u>=1){
      f.done=true;
      const x=f.x0+f.dx*f.range+f.drift, y=f.y0+f.dy*f.range;
      const cartY=G.MINY+(G.H-G.MINY)*0.36*0.92+0;
      let best=0;
      for(const r of [...T.rings,{x:c.x,y:cartY,r:26*G.K,pts:100}]){const d=Math.hypot(x-r.x,y-r.y); if(d<r.r) best=Math.max(best,r.pts===100?100:d<r.r*0.45?r.pts*2:r.pts);}
      T.landed.push({x,y,t:0,rot:f.rot,pts:best});
      if(best){T.score+=best; T.hits++; popup(`+${best}`,x,y-20*G.K,best>=50); tones(best>=50?[523,659,784]:[523,659],'triangle',0.08,0.3,0.14); if(best>=50){shake(3); buzz(25);}}
      else{popup('Miss',x,y-16*G.K,false); noiseHit(300,0.6,0.15,0.15);}
    }
  }
  T.fly=T.fly.filter(f=>!f.done);
  for(const l of T.landed) l.t+=dt;
  T.landed=T.landed.filter(l=>l.t<5);
  for(const pp of G.popups) pp.t+=dt;
  G.popups=G.popups.filter(pp=>pp.t<1.8);
  if(T.t>=TOSS_SECS&&!T.fly.length&&!T.over) endToss(false);
}

export function endToss(quit){
  const T=G.TOSS; if(!T) return;
  T.over=true; $('tossQuit').hidden=true; leaveTrap();
  const earned=Math.round(T.score/4), best=T.score>(G.store.tossBest||0);
  G.store.bank+=earned; if(best) G.store.tossBest=T.score; save();
  if(T.score>=500) award('toss');
  if(quit){G.TOSS=null; return goTitle();}
  G.state='over';
  $('verdict').innerHTML=(T.score>=500?'Blue ribbon':T.score>=250?'Red ribbon':'Thanks for playing the fair')+(best&&T.score>0?'<span class="best">New best</span>':'');
  $('endtime').textContent='Bag toss at the fall fair';
  $('stars').innerHTML=''; $('statsRow').hidden=true; $('shareCard').hidden=true; $('rFinds').innerHTML='';
  $('breakdown').innerHTML=`<dt>Score</dt><dd>${num(T.score)}</dd><dt>Bags on target</dt><dd>${T.hits} of ${T.throws}</dd><dt>Leaves to the shed</dt><dd>+${num(earned)}</dd>`;
  $('rNote').textContent='New England fall fairs run deep: the Topsfield Fair in Massachusetts has been held since 1818.';
  $('nextDay').hidden=true; $('again').textContent='Toss again'; $('again').className='primary'; $('toMap').textContent='Menu';
  show('end'); $('again').focus();
}

export function drawToss(){
  const T=G.TOSS;
  ctx.setTransform(1,0,0,1,0,0); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.drawImage(grass,0,0);
  ctx.setTransform(G.DPR,0,0,G.DPR,0,0);
  ctx.fillStyle='rgba(255,220,150,0.12)'; ctx.fillRect(0,0,G.W,G.H);
  const flagY=G.MINY-6;
  ctx.strokeStyle='#6b4a2b'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,flagY); ctx.quadraticCurveTo(G.W/2,flagY+18*G.K,G.W,flagY); ctx.stroke();
  const fc=['#c0392b','#e5832a','#efb13c','#2f6b46','#2f62a3'];
  for(let i=0;i<14;i++){const x=G.W*(i+0.5)/14, y=flagY+18*G.K*4*(x/G.W)*(1-x/G.W); ctx.fillStyle=fc[i%5]; ctx.beginPath(); ctx.moveTo(x-8*G.K,y); ctx.lineTo(x+8*G.K,y); ctx.lineTo(x,y+14*G.K); ctx.fill();}
  for(const r of T.rings){
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(r.x+3,r.y+5,r.r*1.25,r.r*0.95,0,0,6.283); ctx.fill();
    ctx.fillStyle='#d9b45a'; ctx.beginPath(); ctx.ellipse(r.x,r.y,r.r*1.25,r.r*0.95,0,0,6.283); ctx.fill();
    ctx.fillStyle='#f3e1ae'; ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,6.283); ctx.fill();
    ctx.fillStyle='#c0392b'; ctx.beginPath(); ctx.arc(r.x,r.y,r.r*0.45,0,6.283); ctx.fill();
    ctx.fillStyle='#5a3d22'; ctx.font=`700 ${11*G.K}px Karla, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(r.pts,r.x,r.y+r.r*0.72);
  }
  const cy=G.MINY+(G.H-G.MINY)*0.36*0.92, cx=T.cart.x;
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(cx-26*G.K+3,cy-14*G.K+5,52*G.K,28*G.K);
  ctx.fillStyle='#8a5a2e'; ctx.fillRect(cx-26*G.K,cy-14*G.K,52*G.K,28*G.K);
  ctx.strokeStyle='#5e3a1c'; ctx.lineWidth=2; ctx.strokeRect(cx-26*G.K,cy-14*G.K,52*G.K,28*G.K);
  ctx.fillStyle='#e0761f'; ctx.beginPath(); ctx.ellipse(cx,cy,15*G.K,12*G.K,0,0,6.283); ctx.fill();
  ctx.fillStyle='#4a6b2a'; ctx.fillRect(cx-1.5*G.K,cy-15*G.K,3*G.K,5*G.K);
  ctx.fillStyle='#fbf1e1'; ctx.font=`700 ${10*G.K}px Karla, sans-serif`; ctx.textAlign='center'; ctx.fillText('100',cx,cy+22*G.K);
  for(const l of T.landed){ctx.globalAlpha=Math.min(1,(5-l.t)/1.5); drawLaunchBag(l.x,l.y,0.8,l.rot); ctx.globalAlpha=1;}
  const by=G.H-G.SAFE_B-64*G.K;
  ctx.fillStyle='#d9b45a'; ctx.fillRect(G.W/2-34*G.K,by+10*G.K,68*G.K,22*G.K); ctx.strokeStyle='#a8873c'; ctx.strokeRect(G.W/2-34*G.K,by+10*G.K,68*G.K,22*G.K);
  if(T.bag){
    const a=T.grab&&tossAim(T.bag);
    if(a){
      const [lx,ly]=tossLand(T.bag,a);
      ctx.strokeStyle='rgba(255,240,210,0.8)'; ctx.lineWidth=2; ctx.setLineDash([5,7]); ctx.beginPath(); ctx.moveTo(T.bag.hx,T.bag.hy);
      for(let i=1;i<=20;i++){const u=i/20; ctx.lineTo(T.bag.hx+a.dx*a.range*u+T.wind*55*G.K*u*u,T.bag.hy+a.dy*a.range*u-4*u*(1-u)*70*G.K);}
      ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle='#ffd27a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(lx,ly,14*G.K,9*G.K,0,0,6.283); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx-5*G.K,ly); ctx.lineTo(lx+5*G.K,ly); ctx.moveTo(lx,ly-4*G.K); ctx.lineTo(lx,ly+4*G.K); ctx.stroke();
      ctx.strokeStyle='rgba(90,61,34,0.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(T.bag.hx-20*G.K,T.bag.hy+8*G.K); ctx.lineTo(T.bag.x,T.bag.y); ctx.lineTo(T.bag.hx+20*G.K,T.bag.hy+8*G.K); ctx.stroke();
    }
    drawLaunchBag(T.bag.x,T.bag.y,1,0);
  }
  for(const f of T.fly){
    const u=f.u, gx=f.x0+f.dx*f.range*u+f.drift*u*u, gy=f.y0+f.dy*f.range*u, z=4*u*(1-u);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(gx,gy,12*G.K,6*G.K,0,0,6.283); ctx.fill();
    drawLaunchBag(gx,gy-z*70*G.K,1+z*0.6,f.rot);
  }
  drawPopups();
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round'; ctx.lineWidth=4; ctx.strokeStyle='rgba(28,21,48,0.8)';
  const left=Math.max(0,Math.ceil(TOSS_SECS-T.t)), top=Math.max(18,G.MINY*0.45);
  ctx.font=`500 ${18*G.K}px "DM Mono", monospace`; ctx.fillStyle='#ffd27a';
  ctx.strokeText(`${num(T.score)}`,G.W/2,top); ctx.fillText(`${num(T.score)}`,G.W/2,top);
  ctx.font=`600 ${13*G.K}px Karla, sans-serif`; ctx.fillStyle='#fbf1e1';
  const windTxt=Math.abs(T.wind)<0.08?'Calm':`Wind ${Math.round(Math.abs(T.wind)*12)} mph ${T.wind>0?'→':'←'}`;
  ctx.strokeText(`${left}s · ${windTxt}`,G.W/2,top+20*G.K); ctx.fillText(`${left}s · ${windTxt}`,G.W/2,top+20*G.K);
  if(T.throws===0&&T.bag) {ctx.font=`700 ${14*G.K}px Karla, sans-serif`; ctx.fillStyle='#ffd27a'; const tip='Pull the bag back to aim, then let go.'; ctx.strokeText(tip,G.W/2,by-30*G.K); ctx.fillText(tip,G.W/2,by-30*G.K);}
  if(G.shakeAmt) {}
}
