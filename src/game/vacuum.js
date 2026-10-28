// The leaf vacuum tool.
import {G} from './state.js';
import {ctx, nctx} from './canvas.js';
import {stat} from './polish.js';
import {activate, popup} from './round.js';
import {U} from './store.js';
import {BAG_SIZE} from '../lib/util.js';

export const vacAvailable=()=>G.store.owned.includes('vacuum')||G.store.opts.diff==='relaxed';

export const vacOn=()=>G.store.opts.tool==='vac'&&vacAvailable();

export const vacR=()=>80*G.K*(1+0.08*U('rake'))*(G.active.R?1.5:1)*(G.active.P?0.6:1);

export function vacuum(dt){
  const R=vacR(), r2=R*R;
  G.suck=Math.min(10,G.suck+dt*60);
  for(const l of G.leaves){
    if(l.st!==0) continue;
    const dx=G.rx-l.x, dy=G.ry-l.y, d2=dx*dx+dy*dy;
    if(d2>r2) continue;
    const d=Math.sqrt(d2)||1, f=1-d/R;
    l.vx+=dx/d*3600*G.K*(0.35+f)*dt; l.vy+=dy/d*3600*G.K*(0.35+f)*dt; l.va+=(Math.random()-0.5)*12*dt; l.b=Math.max(0,l.b-dt*2);
    if(d<26*G.K&&G.suck>=1){G.suck--; l.st=2; l.bt=0; l.vac=true; G.vacTally++; G.vacTallyT=1.2;}
  }
  for(const it of G.items) if(!it.raked&&Math.hypot(it.x-G.rx,it.y-G.ry)<R) it.raked=true;
  for(const u of G.pickups) if(u.z<=0&&!u.got&&Math.hypot(u.x-G.rx,u.y-G.ry)<R*0.6) activate(u);
  for(const k of G.kids) if(k.st==='seek'&&Math.hypot(k.x-G.rx,k.y-G.ry)<R*0.7){k.st='shoo'; G.score+=50; stat('shoo'); popup('Shoo!  +50',k.x,k.y-24*G.K,false);}
  if(G.LV.snow||G.LV.boss){nctx.setTransform(G.DPR,0,0,G.DPR,0,0); nctx.globalCompositeOperation='destination-out'; nctx.fillStyle='rgba(0,0,0,0.5)'; nctx.beginPath(); nctx.arc(G.rx,G.ry,R*0.5,0,6.283); nctx.fill(); nctx.globalCompositeOperation='source-over';}
  G.rakeSpeed=G.drag?400:0; G.carried=1;
  G.vacTallyT-=dt; if(G.vacTallyT<=0) G.vacTally=0;
}

export function drawVacuum(){
  const R=vacR(), hx=G.rx+70*G.K, hy=G.ry+120*G.K;
  ctx.save(); ctx.lineCap='round';
  if(G.drag) for(let i=0;i<3;i++){
    const f=((G.playT*1.6+i/3)%1), rr=R*(1-f);
    ctx.strokeStyle=`rgba(255,240,210,${0.35*f})`; ctx.lineWidth=1.5; ctx.setLineDash([4,6]);
    ctx.beginPath(); ctx.arc(G.rx,G.ry,rr,0,6.283); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=7*G.K; ctx.beginPath(); ctx.moveTo(G.rx+4,G.ry+6); ctx.quadraticCurveTo(G.rx+10*G.K,hy-30*G.K,hx+4,hy+6); ctx.stroke();
  ctx.strokeStyle='#3a3f48'; ctx.lineWidth=6*G.K; ctx.beginPath(); ctx.moveTo(G.rx,G.ry); ctx.quadraticCurveTo(G.rx+6*G.K,hy-34*G.K,hx,hy); ctx.stroke();
  ctx.fillStyle='#c0392b'; ctx.beginPath(); ctx.ellipse(hx+8*G.K,hy+8*G.K,16*G.K,11*G.K,0.4,0,6.283); ctx.fill();
  const fill=(G.bagged%BAG_SIZE)/BAG_SIZE;
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(hx-6*G.K,hy+22*G.K,28*G.K,4*G.K);
  ctx.fillStyle='#ffd27a'; ctx.fillRect(hx-6*G.K,hy+22*G.K,28*G.K*fill,4*G.K);
  ctx.fillStyle='#2b2f36'; ctx.beginPath(); ctx.ellipse(G.rx,G.ry,13*G.K,9*G.K,0,0,6.283); ctx.fill();
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.ellipse(G.rx,G.ry,7*G.K,4.5*G.K,0,0,6.283); ctx.fill();
  if(G.vacTally>0){
    ctx.globalAlpha=Math.min(1,G.vacTallyT*2); ctx.font=`700 ${14*G.K}px Karla, system-ui, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineJoin='round'; ctx.lineWidth=4; ctx.strokeStyle='rgba(28,21,48,0.85)'; ctx.fillStyle='#ffd27a';
    const t=`+${G.vacTally} bagged`; ctx.strokeText(t,G.rx,G.ry-30*G.K); ctx.fillText(t,G.rx,G.ry-30*G.K); ctx.globalAlpha=1;
  }
  ctx.restore();
}
