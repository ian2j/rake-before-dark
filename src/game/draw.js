// Drawing a round: lawn, leaves, tarp, rake, light and pop-ups.
import {G} from './state.js';
import {RAKES, TARPS} from '../data/levels.js';
import {drawBossHigh, drawBossLow, drawProj} from './boss.js';
import {ctx, grass, scrape, snow} from './canvas.js';
import {drawBeamGlow, drawFog, drawLighthouse, fogAt} from './fog.js';
import {drawHalloweenLight, drawKids, drawLanterns} from './kids.js';
import {rakeHalf} from './lawn.js';
import {drawMoose} from './moose.js';
import {drawNight} from './night.js';
import {drawRival, drawRivalRaker} from './rival.js';
import {SECS} from './round.js';
import {drawVacuum, vacOn} from './vacuum.js';
import {drawWinter, winterView} from './winter.js';
import {$, BAG_SIZE, EMOJI_FONT, clamp, fmtTime, lerp, num, reduceMotion, smooth} from '../lib/util.js';

export function drawWall(){
  if(!G.walls.length) return;
  ctx.fillStyle='rgba(0,0,0,0.22)';
  for(const r of G.walls) ctx.fillRect(r.x0,r.y0+5,r.x1-r.x0,r.y1-r.y0);
  for(const s of G.stones){ctx.fillStyle=s.c; ctx.beginPath(); ctx.ellipse(s.x,s.y,s.rx,s.ry,s.a,0,6.283); ctx.fill();}
  ctx.strokeStyle='rgba(40,38,34,0.45)'; ctx.lineWidth=1; ctx.beginPath();
  for(const s of G.stones){ctx.moveTo(s.x+s.rx*Math.cos(s.a),s.y+s.rx*Math.sin(s.a)); ctx.ellipse(s.x,s.y,s.rx,s.ry,s.a,0,6.283);}
  ctx.stroke();
}

export function drawSea(){
  if(!G.LV.sea) return;
  const g=ctx.createLinearGradient(G.SEAX,0,G.W,0);
  g.addColorStop(0,'#2d5a73'); g.addColorStop(1,'#1d3d55');
  ctx.fillStyle=g; ctx.fillRect(G.SEAX,0,G.W-G.SEAX,G.H);
  ctx.strokeStyle='rgba(220,236,245,0.35)'; ctx.lineWidth=1.4; ctx.beginPath();
  for(let y=-20;y<G.H+20;y+=26*G.K){
    const yy=y+((G.playT*8)%(26*G.K));
    ctx.moveTo(G.SEAX+10*G.K,yy); ctx.quadraticCurveTo(G.SEAX+(G.W-G.SEAX)*0.5,yy+6*G.K+3*Math.sin(G.playT+y),G.W,yy);
  }
  ctx.stroke();
  ctx.fillStyle='#6f6a62'; ctx.fillRect(G.SEAX-5*G.K,0,9*G.K,G.H);
  ctx.fillStyle='#8f897e';
  for(let y=0;y<G.H;y+=11*G.K){ctx.beginPath(); ctx.ellipse(G.SEAX+((y*7)%5-2)*G.K,y,5*G.K,6*G.K,0,0,6.283); ctx.fill();}
}

export function drawLeaf(l,sc){
  sc*=G.K;
  const c=Math.cos(l.a)*sc*G.DPR, s=Math.sin(l.a)*sc*G.DPR, S=l.s.size;
  ctx.setTransform(c,s,-s,c,l.x*G.DPR,l.y*G.DPR);
  ctx.globalAlpha=1-0.8*l.b;
  ctx.drawImage(l.s.c,-S/2,-S/2,S,S);
}

export function drawTarp(){
  const {x,y,w,h}=G.tp;
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(x+4,y+5,w,h);
  const tc=TARPS[G.store.cos.tarp]||TARPS.blue;
  ctx.fillStyle=tc.fill; ctx.fillRect(x,y,w,h);
  if(G.store.cos.tarp==='plaid'){
    ctx.fillStyle='rgba(20,16,16,0.55)';
    for(let i=0;i<w;i+=22*G.K) ctx.fillRect(x+i,y,11*G.K,h);
    for(let j=0;j<h;j+=22*G.K) ctx.fillRect(x,y+j,w,11*G.K);
  }
  if(G.active.T){ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(x,y,w,h);}
  ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x+w*0.33,y); ctx.lineTo(x+w*0.36,y+h); ctx.moveTo(x+w*0.68,y); ctx.lineTo(x+w*0.66,y+h); ctx.moveTo(x,y+h*0.5); ctx.lineTo(x+w,y+h*0.48); ctx.stroke();
  ctx.strokeStyle=G.active.T?'#ffd27a':tc.edge; ctx.lineWidth=2; ctx.strokeRect(x+1,y+1,w-2,h-2);
  ctx.fillStyle='#d8dde4';
  for(const [gx,gy] of [[x+6,y+6],[x+w-6,y+6],[x+6,y+h-6],[x+w-6,y+h-6]]){ctx.beginPath(); ctx.arc(gx,gy,2.2,0,6.283); ctx.fill();}
}

export function drawBag(){
  const bw=30*G.K, bh=40*G.K, x=G.bag.x-bw/2, y=G.bag.y-bh/2;
  const fill=(G.bagged%BAG_SIZE)/BAG_SIZE;
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(x+4,y+5,bw,bh);
  ctx.fillStyle='#b98a55'; ctx.fillRect(x,y,bw,bh);
  ctx.fillStyle='#c9622a'; ctx.fillRect(x+3,y+bh-3-(bh-6)*fill,bw-6,(bh-6)*fill);
  ctx.strokeStyle='#7e5a33'; ctx.lineWidth=1.5; ctx.strokeRect(x,y,bw,bh);
  ctx.fillStyle='#8a6438'; ctx.fillRect(x,y,bw,4*G.K);
  const full=Math.floor(G.bagged/BAG_SIZE);
  if(full>0){ctx.fillStyle='#fbf1e1'; ctx.font=`600 ${11*G.K}px Karla, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillText(`×${full+1}`,G.bag.x,y-6);}
}

export function drawItems(){
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const it of G.items){
    if(it.found&&it.ft>1.2) continue;
    const t=it.found?it.ft/1.2:0, sc=1+t*0.8;
    ctx.globalAlpha=1-t;
    ctx.font=`${20*G.K*sc}px ${EMOJI_FONT}`;
    ctx.fillText(it.e,it.x,it.y);
    if(it.found){ctx.strokeStyle='#ffd27a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(it.x,it.y,(14+t*30)*G.K,0,6.283); ctx.stroke();}
  }
  ctx.globalAlpha=1;
}

export function drawPickups(){
  for(const u of G.pickups){
    const s=G.K*(1+u.z*1.3);
    if(u.z>0){ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(u.x+u.z*20*G.K,u.y+u.z*30*G.K,8*G.K,5*G.K,0,0,6.283); ctx.fill();}
    ctx.save();
    ctx.globalAlpha=u.life<2.5&&!reduceMotion?(Math.sin(G.playT*14)>0?1:0.35):1;
    ctx.translate(u.x,u.y-u.z*24*G.K); ctx.scale(s,s);
    if(u.k==='P'){
      ctx.fillStyle='#6e4a2c'; ctx.beginPath(); ctx.ellipse(0,0,8,13,0.3,0,6.283); ctx.fill();
      ctx.strokeStyle='#3f2a17'; ctx.lineWidth=1.3; ctx.beginPath();
      for(let r=-9;r<=9;r+=4.5){ctx.moveTo(-7,r+2); ctx.quadraticCurveTo(0,r-2,7,r+2);}
      ctx.stroke();
    }else{
      ctx.fillStyle=`rgba(255,210,122,${0.25+0.15*Math.sin(G.playT*5)})`; ctx.beginPath(); ctx.arc(0,1,19,0,6.283); ctx.fill();
      ctx.fillStyle='#c98a45'; ctx.beginPath(); ctx.ellipse(0,4,9,11,0,0,6.283); ctx.fill();
      ctx.fillStyle='#6b4423'; ctx.beginPath(); ctx.ellipse(0,-5,11.5,6.5,0,0,6.283); ctx.fill();
      ctx.fillRect(-1.2,-15,2.4,5);
      ctx.fillStyle='#2a1405'; ctx.font='700 11px Karla, system-ui, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(u.k,0,6);
    }
    ctx.restore();
  }
}

export function drawShadow(p){
  if(G.LV.snow) return;
  const a=0.26*(1-smooth((p-G.pSun+0.08)/0.1));
  if(a<=0.005) return;
  const ps=Math.min(p/G.pSun,1), m=Math.min(G.W,G.H), L=m*(0.25+1.5*ps*ps), dx=0.92, dy=0.39;
  ctx.save();
  ctx.globalAlpha=a; ctx.fillStyle=ctx.strokeStyle='#14210c';
  ctx.lineCap='round'; ctx.lineWidth=16*G.K;
  ctx.beginPath(); ctx.moveTo(G.tree.x,G.tree.y); ctx.lineTo(G.tree.x+dx*L*0.7,G.tree.y+dy*L*0.7); ctx.stroke();
  ctx.translate(G.tree.x+dx*L,G.tree.y+dy*L); ctx.rotate(Math.atan2(dy,dx)); ctx.scale(1+ps*1.1,1);
  ctx.beginPath(); ctx.arc(0,0,G.tree.r*0.8,0,6.283); ctx.fill();
  ctx.restore();
}

export function drawCanopy(){
  for(const t of G.trees){
    ctx.save(); ctx.translate(t.x,t.y);
    ctx.fillStyle=G.LV.treeDark; ctx.beginPath(); ctx.arc(0,0,t.r*0.9,0,6.283); ctx.fill();
    for(const b of t.blobs){ctx.fillStyle=b.c; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,6.283); ctx.fill();}
    if(G.snowAmt>0){
      ctx.globalAlpha=0.55*G.snowAmt; ctx.fillStyle='#f4f7ff';
      for(const b of t.blobs){ctx.beginPath(); ctx.arc(b.x-b.r*0.25,b.y-b.r*0.3,b.r*0.55,0,6.283); ctx.fill();}
    }
    ctx.restore();
  }
}

export function drawFlakes(){
  if(G.snowAmt<=0) return;
  ctx.fillStyle=`rgba(255,255,255,${0.85*G.snowAmt})`;
  ctx.beginPath();
  for(const f of G.flakes){ctx.moveTo(f.x+f.r*G.K,f.y); ctx.arc(f.x,f.y,f.r*G.K,0,6.283);}
  ctx.fill();
}

export function drawRake(){
  if(G.state!=='play'||!G.showRake) return;
  if(vacOn()) return drawVacuum();
  drawRakeAt(G.rx,G.ry,G.rdx,G.rdy,rakeHalf(),(RAKES[G.store.cos.rake]||RAKES.ash).c,G.drag?1:0.5,G.active.P);
}

export function drawRakeAt(x,y,dx,dy,HALF,handle,alpha,sticky){
  const nx=-dy, ny=dx, hl=120*G.K, tines=Math.max(4,Math.round(HALF/5.2));
  ctx.save(); ctx.globalAlpha=alpha; ctx.lineCap='round';
  ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=5*G.K;
  ctx.beginPath(); ctx.moveTo(x+4,y+6); ctx.lineTo(x-dx*hl+4,y-dy*hl+6); ctx.stroke();
  ctx.strokeStyle=handle; ctx.lineWidth=4.5*G.K;
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-dx*hl,y-dy*hl); ctx.stroke();
  ctx.strokeStyle='#d8d2c4'; ctx.lineWidth=1.6*G.K; ctx.beginPath();
  for(let k=-tines;k<=tines;k++){const o=k*HALF/(tines+0.5); ctx.moveTo(x+nx*o,y+ny*o); ctx.lineTo(x+nx*o+dx*9*G.K,y+ny*o+dy*9*G.K);}
  ctx.stroke();
  ctx.strokeStyle=sticky?'#4a3a22':'#5a3d22'; ctx.lineWidth=5*G.K;
  ctx.beginPath(); ctx.moveTo(x+nx*HALF,y+ny*HALF); ctx.lineTo(x-nx*HALF,y-ny*HALF); ctx.stroke();
  ctx.restore();
}

export function drawWind(){
  if(!G.gust||reduceMotion) return;
  ctx.strokeStyle=`rgba(255,250,235,${0.35*G.env})`; ctx.lineWidth=1.2; ctx.beginPath();
  for(const s of G.streaks){ctx.moveTo(s.x,s.y); ctx.lineTo(s.x-G.gust.dx*s.len,s.y-G.gust.dy*s.len);}
  ctx.stroke();
}

// Light keys run golden hour, sunset, blue hour, civil dusk (greyer under storm cloud), multiplied over the scene.
export function lightAt(p){
  const keys=G.LKEYS;
  let i=0; while(i<keys.length-2&&p>keys[i+1][0]) i++;
  const [p0,c0,a0]=keys[i], [p1,c1,a1]=keys[i+1], t=clamp((p-p0)/(p1-p0),0,1);
  const a=lerp(a0,a1,t);
  return c0.map((v,j)=>Math.round(lerp(255,lerp(v,c1[j],t),a)));
}

export function drawLight(p){
  const m=Math.min(G.W,G.H), [r,g,b]=lightAt(p);
  ctx.globalCompositeOperation='multiply';
  ctx.fillStyle=`rgb(${r},${g},${b})`; ctx.fillRect(0,0,G.W,G.H);
  const q=smooth((p-G.pSun)/0.15);
  if(q>0){
    ctx.globalCompositeOperation='lighter';
    const cx=G.tarp.x+G.tarp.w/2, cy=G.H+20, gr=ctx.createRadialGradient(cx,cy,0,cx,cy,m*0.8);
    gr.addColorStop(0,`rgba(255,180,100,${0.26*q})`); gr.addColorStop(1,'rgba(255,180,100,0)');
    ctx.fillStyle=gr; ctx.fillRect(0,0,G.W,G.H);
  }
  drawHalloweenLight(q);
  if(G.boss&&G.boss.screen>0){ctx.globalCompositeOperation='source-over'; ctx.fillStyle=`rgba(255,255,255,${0.6*G.boss.screen})`; ctx.fillRect(0,0,G.W,G.H);}
  ctx.globalCompositeOperation='source-over';
  const vg=ctx.createRadialGradient(G.W/2,G.H/2,m*0.35,G.W/2,G.H/2,Math.hypot(G.W,G.H)*0.6);
  vg.addColorStop(0,'rgba(12,6,22,0)'); vg.addColorStop(1,`rgba(12,6,22,${0.3+0.3*p})`);
  ctx.fillStyle=vg; ctx.fillRect(0,0,G.W,G.H);
}

export function drawPopups(){
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
  for(const pp of G.popups){
    const t=pp.t/1.8, y=pp.y-t*40*G.K;
    ctx.globalAlpha=1-smooth((t-0.6)/0.4);
    ctx.font=`700 ${(pp.big?19:15)*G.K}px Karla, system-ui, sans-serif`;
    const hw=ctx.measureText(pp.text).width/2, x=clamp(pp.x,hw+12,G.W-hw-12);
    ctx.strokeStyle='rgba(28,21,48,0.9)'; ctx.lineWidth=4; ctx.strokeText(pp.text,x,y);
    ctx.fillStyle=pp.big?'#ffd27a':'#fbf1e1'; ctx.fillText(pp.text,x,y);
  }
  ctx.globalAlpha=1;
}

export function draw(){
  if(winterView()) return drawWinter();
  const p=Math.min(G.elapsed/SECS(),1);
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  ctx.drawImage(grass,0,0); ctx.drawImage(scrape,0,0);
  ctx.setTransform(G.DPR,0,0,G.DPR,0,0);
  drawSea(); drawWall(); drawTarp(); drawRival(); drawItems();
  if(G.LV.snow||G.LV.boss){ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=0.92; ctx.drawImage(snow,0,0); ctx.globalAlpha=1; ctx.setTransform(G.DPR,0,0,G.DPR,0,0);}
  drawBag();
  for(const l of G.leaves) if(l.st!==1) drawLeaf(l,l.st===2?1-l.bt*0.8:1);
  ctx.globalAlpha=1; ctx.setTransform(G.DPR,0,0,G.DPR,0,0);
  drawShadow(p);
  ctx.fillStyle='rgba(0,0,0,0.18)';
  for(const l of G.leaves) if(l.st===1){ctx.beginPath(); ctx.ellipse(l.x+l.z*26*G.K,l.y+l.z*34*G.K,5*G.K,3*G.K,0,0,6.283); ctx.fill();}
  for(const l of G.leaves) if(l.st===1) drawLeaf(l,1+l.z*0.9);
  ctx.globalAlpha=1; ctx.setTransform(G.DPR,0,0,G.DPR,0,0);
  drawLanterns(p); drawKids();
  G.fogAmt=fogAt(p);
  drawPickups(); drawMoose(); drawCanopy(); drawBossLow(); drawFlakes(); drawFog(); drawLighthouse(); drawRivalRaker(); drawRake(); drawWind(); drawBossHigh(); drawProj(); drawLight(p); drawBeamGlow(); drawNight(); drawPopups();

  $('clock').textContent=fmtTime.format(G.state==='over'?G.endClock:G.T0+(G.T1-G.T0)*p);
  $('sunfill').style.width=(p*100)+'%';
  $('score').textContent=num(G.score);
  $('clear').textContent=`${Math.round(100*G.bagged/Math.max(1,G.bagged+G.leaves.length+G.lost))}% clear`;
}
