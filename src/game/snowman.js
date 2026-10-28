// The snow day: roll a snowman and send it down the hill.
import {G} from './state.js';
import {SM_TARGET, TARPS} from '../data/levels.js';
import {initAudio, tones, whee} from './audio.js';
import {ctx, cv, tctx, trailC} from './canvas.js';
import {drawFlakes} from './draw.js';
import {SPRITES} from './leaves.js';
import {award, buzz} from './polish.js';
import {animateFlakes} from './round.js';
import {leaveTrap, show} from './screens.js';
import {save} from './store.js';
import {$, clamp, easeOutBack, lerp} from '../lib/util.js';

export function smSpot(avoid){
  for(let i=0;i<80;i++){
    const x=G.W*(0.12+Math.random()*0.55), y=G.SM.HZ+(G.H-G.SM.HZ)*(0.35+Math.random()*0.5);
    if(!avoid||Math.hypot(x-avoid.x,y-avoid.y)>avoid.rb*3.2) return [x,y];
  }
  return [G.W*0.25,G.H*0.8];
}

export function startSnowman(){
  initAudio(); G.state='ending'; G.ending={sub:'snowman',t:0}; show(null); leaveTrap();
  trailC.width=cv.width; trailC.height=cv.height; tctx.setTransform(G.DPR,0,0,G.DPR,0,0); tctx.clearRect(0,0,G.W,G.H);
  G.SM={HZ:Math.max(G.H*0.3,G.MINY+60),edgeX:G.W*0.8,stage:'base',balls:[],stack:null,decoT:0,grab:null,slideT:0,pauseT:0,flyT:0,parts:[],thanks:false,t:0,flashT:0,
    msg:'Touch and drag: the snowball rolls after your finger and picks up snow as it goes.',
    pines:Array.from({length:8},(_,i)=>({x:G.W*(i+Math.random()*0.6)/8,h:(26+Math.random()*24)*G.K}))};
  G.SM.balls=[{x:G.W*0.32,y:G.SM.HZ+(G.H-G.SM.HZ)*0.55,r:9*G.K,roll:0}];
  const [lx,ly]=smSpot(); G.SM.leaf={x:lx,y:ly,found:!!G.store.finds.winter};
}

// The ball rolls toward wherever your finger is, a little behind it, so it sits under your finger as it grows.
export function smDown(x,y){if(G.SM) G.SM.grab={x,y};}

export function smMove(x,y){if(G.SM&&G.SM.grab){G.SM.grab.x=x; G.SM.grab.y=y;}}

export function smSteer(dt){
  const g=G.SM.grab;
  if(!g) return;
  if(G.SM.stage==='base'||G.SM.stage==='middle'||G.SM.stage==='head'){
    const b=G.SM.balls[0];
    if(!b) return;
    const tx=clamp(g.x,b.r+6,G.SM.edgeX-b.r*0.6), ty=clamp(g.y+b.r,G.SM.HZ+b.r*0.5+8,G.H-8);
    let dx=tx-b.x, dy=ty-b.y;
    const dist=Math.hypot(dx,dy), step=Math.min(dist,Math.max(dist*Math.min(1,dt*16),0),1100*G.K*dt);
    if(dist<0.3) return;
    const ox=b.x, oy=b.y;
    b.x+=dx/dist*step; b.y+=dy/dist*step;
    const tgt=SM_TARGET[G.SM.stage]*G.K;
    if(b.r<tgt) b.r=Math.min(tgt,Math.sqrt(b.r*b.r+step*2.4*G.K));
    b.roll+=step/b.r; b.dir=Math.atan2(dy,dx);
    tctx.strokeStyle='rgba(104,136,78,0.6)'; tctx.lineCap='round'; tctx.lineWidth=b.r*1.05;
    tctx.beginPath(); tctx.moveTo(ox,oy-b.r*0.2); tctx.lineTo(b.x,b.y-b.r*0.2); tctx.stroke();
    if(!G.SM.leaf.found&&Math.hypot(b.x-G.SM.leaf.x,b.y-b.r*0.2-G.SM.leaf.y)<b.r*0.7){
      G.SM.leaf.found=true; G.SM.flashT=2.8; G.store.finds.winter=['lastleaf']; save(); tones([659,880]); buzz(30);
      const sp=SPRITES[1], S=sp.size;
      tctx.save(); tctx.translate(G.SM.leaf.x,G.SM.leaf.y); tctx.rotate(0.4); tctx.scale(2.6,2.6); tctx.drawImage(sp.c,-S/2,-S/2,S,S); tctx.restore();
    }
    smStage();
  }else if(G.SM.stage==='push'){
    const s=G.SM.stack, tx=Math.max(s.rb+6,g.x), ty=clamp(g.y+s.rb*0.5,G.SM.HZ+s.rb+10,G.H-8);
    const dx=tx-s.x, dy=ty-s.y, dist=Math.hypot(dx,dy), step=Math.min(dist,dist*Math.min(1,dt*10),700*G.K*dt);
    if(dist<0.3) return;
    const ox=s.x, oy=s.y;
    s.x+=dx/dist*step; s.y+=dy/dist*step;
    tctx.strokeStyle='rgba(104,136,78,0.45)'; tctx.lineWidth=s.rb*1.2; tctx.beginPath(); tctx.moveTo(ox,oy-s.rb*0.2); tctx.lineTo(s.x,s.y-s.rb*0.2); tctx.stroke();
    if(s.x>G.SM.edgeX){G.SM.stage='slide'; G.SM.slideT=0; G.SM.grab=null; G.SM.msg=''; whee(); buzz([20,20,20,20,40]);}
  }
}

export function smStage(){
  const b=G.SM.balls[0], full=b.r>=SM_TARGET[G.SM.stage]*G.K-0.5;
  if(G.SM.stage==='base'){
    if(!full) return;
    G.SM.stack={x:b.x,y:b.y,rb:b.r,rm:0,rh:0,hop:1};
    const [x,y]=smSpot(G.SM.stack); G.SM.balls=[{x,y,r:9*G.K,roll:0}]; G.SM.stage='middle'; G.SM.grab=null;
    G.SM.msg='A good base. Roll a smaller ball, then push it onto the base.'; tones([523,659]); buzz(20);
    return;
  }
  if(full&&!b.ready){b.ready=true; G.SM.msg=G.SM.stage==='middle'?'Big enough. Push it onto the base.':'Push the head on top.';}
  if(full&&Math.hypot(b.x-G.SM.stack.x,b.y-G.SM.stack.y)<G.SM.stack.rb*1.05){
    if(G.SM.stage==='middle'){G.SM.stack.rm=b.r; const [x,y]=smSpot(G.SM.stack); G.SM.balls=[{x,y,r:9*G.K,roll:0}]; G.SM.stage='head'; G.SM.msg='Now a small one for the head.';}
    else{G.SM.stack.rh=b.r; G.SM.balls=[]; G.SM.stage='decorate'; G.SM.decoT=0; G.SM.msg='';}
    G.SM.stack.hop=1; G.SM.grab=null; tones([523,659,784]); buzz(25);
  }
}

export function updateSnowman(dt){
  G.SM.t+=dt; animateFlakes(dt); smSteer(dt);
  if(G.SM.stack) G.SM.stack.hop=Math.max(0,G.SM.stack.hop-dt*3);
  G.SM.flashT=Math.max(0,G.SM.flashT-dt);
  if(G.SM.stage==='decorate'){G.SM.decoT+=dt; if(G.SM.decoT>2.6){G.SM.stage='push'; G.SM.msg='Push the snowman over the edge of the hill →';}}
  else if(G.SM.stage==='slide'){
    G.SM.slideT+=dt;
    const e=Math.min(1,G.SM.slideT/1.9), x=G.SM.edgeX+e*G.W*0.5, y=G.SM.stack.y+e*e*G.H*0.5;
    for(let i=0;i<3;i++) G.SM.parts.push({x:x-G.SM.stack.rb*0.8,y,vx:-(60+Math.random()*140)*G.K,vy:-(40+Math.random()*140)*G.K,life:0.8,r:(2+Math.random()*3)*G.K});
    if(G.SM.slideT>1.9){G.SM.stage='pause'; G.SM.pauseT=0;}
  }else if(G.SM.stage==='pause'){
    G.SM.pauseT+=dt;
    if(G.SM.pauseT>0.5){G.SM.stage='fly'; G.SM.flyT=0; tones([523,659,784,1047],'triangle',0.13,0.6,0.18); award('snowman');}
  }else if(G.SM.stage==='fly'){
    G.SM.flyT+=dt;
    if(G.SM.flyT>1.5&&!G.SM.thanks){G.SM.thanks=true; show('thanks'); $('thanksMap').focus();}
    if(G.SM.flyT<4&&Math.random()<0.6) G.SM.parts.push({x:Math.random()*G.W,y:-10,vx:(Math.random()-0.5)*40*G.K,vy:(60+Math.random()*80)*G.K,life:6,r:0,leaf:(Math.random()*SPRITES.length)|0,a:Math.random()*6});
  }
  for(const q of G.SM.parts){q.x+=q.vx*dt; q.y+=q.vy*dt; if(!q.leaf&&q.leaf!==0) q.vy+=300*G.K*dt; else q.a+=dt*2; q.life-=dt;}
  G.SM.parts=G.SM.parts.filter(q=>q.life>0&&q.y<G.H+20);
}

export function shadeBall(x,cy,r){
  const g=ctx.createRadialGradient(x-r*0.35,cy-r*0.35,r*0.1,x,cy,r);
  g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#c9d5e4');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,cy,r,0,6.283); ctx.fill();
}

export function drawBall(b){
  ctx.fillStyle='rgba(90,110,140,0.18)'; ctx.beginPath(); ctx.ellipse(b.x,b.y,b.r*0.95,b.r*0.28,0,0,6.283); ctx.fill();
  shadeBall(b.x,b.y-b.r,b.r);
  // Specks of grass and snow turning with the roll, so the ball reads as rolling.
  ctx.fillStyle='rgba(120,140,110,0.35)';
  for(let i=0;i<4;i++){const a=b.roll+i*1.57, c=Math.cos(a); if(c<0) continue; const off=Math.sin(a)*b.r*0.75; ctx.beginPath(); ctx.ellipse(b.x+Math.cos(b.dir||0)*off,b.y-b.r+Math.sin(b.dir||0)*off,b.r*0.08*c+0.5,b.r*0.08+0.5,0,0,6.283); ctx.fill();}
  if(b.ready){ctx.strokeStyle=`rgba(255,210,122,${0.6+0.4*Math.sin(G.SM.t*6)})`; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(b.x,b.y-b.r,b.r+3,0,6.283); ctx.stroke();}
}

export function smOpts(){const s=G.SM.stack; return {rb:s.rb,rm:s.rm,rh:s.rh,hop:s.hop,deco:G.SM.stage==='decorate'?Math.floor(G.SM.decoT/0.45):s.rh?5:0,armA:0,rot:0,smile:1};}

export function drawSnowman(x,y,sc,o){
  ctx.save(); ctx.translate(x,y); ctx.rotate(o.rot||0); ctx.scale(sc,sc);
  const {rb,rm,rh}=o, hop=(o.hop||0)*6*G.K, c1=-rb, c2=c1-rb*0.82-rm*0.82-hop, c3=c2-rm*0.82-rh*0.82;
  ctx.fillStyle='rgba(90,110,140,0.2)'; ctx.beginPath(); ctx.ellipse(0,0,rb*1.05,rb*0.3,0,0,6.283); ctx.fill();
  const d=o.deco;
  if(rm&&d>=4){
    ctx.strokeStyle='#5a3d22'; ctx.lineCap='round';
    for(const s of [-1,1]){
      const a=0.55+(s<0?o.armA:-o.armA), L=rm*1.5, x0=s*rm*0.8, x1=x0+s*Math.cos(a)*L, y1=c2-Math.sin(a)*L;
      ctx.lineWidth=3.2*G.K; ctx.beginPath(); ctx.moveTo(x0,c2); ctx.lineTo(x1,y1);
      const mx=lerp(x0,x1,0.65), my=lerp(c2,y1,0.65);
      ctx.moveTo(mx,my); ctx.lineTo(mx+s*rm*0.25,my-rm*0.35); ctx.stroke();
    }
  }
  shadeBall(0,c1,rb);
  if(rm) shadeBall(0,c2,rm);
  if(rh) shadeBall(0,c3,rh);
  ctx.fillStyle='#22201f';
  if(rm&&d>=1) for(const yy of [c2-rm*0.25,c2+rm*0.2,c1-rb*0.35]){ctx.beginPath(); ctx.arc(0,yy,Math.max(1.5,rh*0.1),0,6.283); ctx.fill();}
  if(rh&&d>=1) for(const s of [-1,1]){ctx.beginPath(); ctx.arc(s*rh*0.33,c3-rh*0.18,rh*0.11,0,6.283); ctx.fill();}
  if(rh&&d>=2){ctx.fillStyle='#e8761f'; ctx.beginPath(); ctx.moveTo(-rh*0.08,c3); ctx.lineTo(rh*0.85,c3+rh*0.12); ctx.lineTo(-rh*0.08,c3+rh*0.18); ctx.closePath(); ctx.fill();}
  if(rh&&d>=3){
    ctx.fillStyle='#22201f'; const w=0.5*(o.smile||1);
    for(let i=0;i<5;i++){const a=Math.PI*(0.18+0.64*i/4); ctx.beginPath(); ctx.arc(-Math.cos(a)*rh*w,c3+rh*0.25+Math.sin(a)*rh*0.25*(o.smile||1),rh*0.07,0,6.283); ctx.fill();}
  }
  if(rh&&d>=5){
    const tc=TARPS[G.store.cos.tarp]||TARPS.blue, ny=c2-rm*0.78;
    ctx.fillStyle=tc.fill; ctx.beginPath(); ctx.ellipse(0,ny,rm*0.72,rh*0.2,0,0,6.283); ctx.fill();
    ctx.fillRect(rm*0.2,ny,rh*0.32,rm*0.75);
    ctx.fillStyle=tc.edge; ctx.fillRect(rm*0.2,ny+rm*0.55,rh*0.32,rh*0.12);
  }
  ctx.restore();
}

export function wrapText(t,x,y,maxW,lh){
  const words=t.split(' '), lines=[];
  let cur='';
  for(const w of words){const n=cur?cur+' '+w:w; if(ctx.measureText(n).width>maxW&&cur){lines.push(cur); cur=w;} else cur=n;}
  if(cur) lines.push(cur);
  lines.forEach((l,i)=>{ctx.strokeText(l,x,y+i*lh); ctx.fillText(l,x,y+i*lh);});
}

export function drawSnowmanScene(){
  ctx.setTransform(G.DPR,0,0,G.DPR,0,0); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  const HZ=G.SM.HZ;
  const sky=ctx.createLinearGradient(0,0,0,HZ); sky.addColorStop(0,'#26355f'); sky.addColorStop(1,'#e8a98f');
  ctx.fillStyle=sky; ctx.fillRect(0,0,G.W,HZ+2);
  const sg=ctx.createRadialGradient(G.W*0.22,HZ-6,0,G.W*0.22,HZ-6,70*G.K); sg.addColorStop(0,'rgba(255,220,160,0.9)'); sg.addColorStop(1,'rgba(255,220,160,0)');
  ctx.fillStyle=sg; ctx.fillRect(0,0,G.W,HZ);
  ctx.fillStyle='#c4d0e2'; ctx.beginPath(); ctx.moveTo(0,HZ);
  for(let x=0;x<=G.W;x+=8) ctx.lineTo(x,HZ-18*G.K-Math.sin(x*0.011)*14*G.K-Math.sin(x*0.031)*5*G.K);
  ctx.lineTo(G.W,HZ); ctx.fill();
  for(const p of G.SM.pines){
    ctx.fillStyle='#2f4a3a'; ctx.beginPath(); ctx.moveTo(p.x,HZ-p.h); ctx.lineTo(p.x-p.h*0.32,HZ+2); ctx.lineTo(p.x+p.h*0.32,HZ+2); ctx.fill();
    ctx.fillStyle='#f4f7fb'; ctx.beginPath(); ctx.moveTo(p.x,HZ-p.h); ctx.lineTo(p.x-p.h*0.12,HZ-p.h*0.62); ctx.lineTo(p.x+p.h*0.12,HZ-p.h*0.62); ctx.fill();
  }
  const fg=ctx.createLinearGradient(0,HZ,0,G.H); fg.addColorStop(0,'#e1e9f3'); fg.addColorStop(1,'#fbfdff');
  ctx.fillStyle=fg; ctx.fillRect(0,HZ,G.W,G.H-HZ);
  ctx.fillStyle='rgba(140,165,198,0.38)'; ctx.beginPath(); ctx.moveTo(G.SM.edgeX,HZ); ctx.lineTo(G.W,HZ); ctx.lineTo(G.W,G.H); ctx.lineTo(G.SM.edgeX+26*G.K,G.H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.95)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(G.SM.edgeX,HZ); ctx.lineTo(G.SM.edgeX+26*G.K,G.H); ctx.stroke();
  ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(trailC,0,0); ctx.setTransform(G.DPR,0,0,G.DPR,0,0);
  const things=G.SM.balls.map(b=>({y:b.y,f:()=>drawBall(b)}));
  if(G.SM.stack&&['base','middle','head','decorate','push'].includes(G.SM.stage)) things.push({y:G.SM.stack.y,f:()=>drawSnowman(G.SM.stack.x,G.SM.stack.y,1,smOpts())});
  things.sort((a,b)=>a.y-b.y).forEach(t=>t.f());
  if(G.SM.stage==='slide'){
    const e=Math.min(1,G.SM.slideT/1.9);
    drawSnowman(G.SM.edgeX+e*G.W*0.5,G.SM.stack.y+e*e*G.H*0.5,1-0.45*e,{...smOpts(),rot:-0.45,armA:Math.sin(G.SM.slideT*22)*0.9});
  }
  if(G.SM.stage==='fly'){
    const u=Math.min(1,G.SM.flyT/1.1), e=easeOutBack(u), s=G.SM.stack, tall=(s.rb+s.rm+s.rh)*1.7;
    const sc=lerp(0.5,Math.min(1.9,G.H*0.5/tall),e), by=lerp(G.H+s.rb*4,G.H*0.64,e)+(u>=1?Math.sin(G.SM.flyT*3)*4*G.K:0);
    drawSnowman(G.W/2,by,sc,{...smOpts(),armA:Math.sin(G.SM.flyT*10)*0.7,smile:1.4,rot:Math.sin(G.SM.flyT*2)*0.05});
  }
  if(G.SM.stage==='push'){
    const s=G.SM.stack, ay=s.y-s.rb*2.2, a=0.55+0.45*Math.sin(G.SM.t*5);
    ctx.fillStyle=`rgba(240,136,58,${a})`; ctx.beginPath(); ctx.moveTo(G.SM.edgeX-4,ay); ctx.lineTo(G.SM.edgeX-22*G.K,ay-12*G.K); ctx.lineTo(G.SM.edgeX-22*G.K,ay+12*G.K); ctx.closePath(); ctx.fill();
  }
  for(const q of G.SM.parts){
    if(q.leaf!==undefined){const sp=SPRITES[q.leaf], S=sp.size, c=Math.cos(q.a)*G.K*1.4, si=Math.sin(q.a)*G.K*1.4; ctx.setTransform(c*G.DPR,si*G.DPR,-si*G.DPR,c*G.DPR,q.x*G.DPR,q.y*G.DPR); ctx.drawImage(sp.c,-S/2,-S/2,S,S); ctx.setTransform(G.DPR,0,0,G.DPR,0,0);}
    else{ctx.fillStyle='rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(q.x,q.y,q.r,0,6.283); ctx.fill();}
  }
  const sa=G.snowAmt; G.snowAmt=0.8; drawFlakes(); G.snowAmt=sa;
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round'; ctx.lineWidth=4; ctx.strokeStyle='rgba(28,21,48,0.75)';
  if(G.SM.msg){ctx.font=`700 ${Math.max(13,15*G.K)}px Karla, system-ui, sans-serif`; ctx.fillStyle='#fbf1e1'; wrapText(G.SM.msg,G.W/2,HZ+26*G.K,G.W-48,20*G.K);}
  if(G.SM.flashT>0){ctx.globalAlpha=Math.min(1,G.SM.flashT); ctx.font=`700 ${16*G.K}px Karla, system-ui, sans-serif`; ctx.fillStyle='#ffd27a'; ctx.strokeText('Found: the last leaf of fall',G.W/2,HZ+70*G.K); ctx.fillText('Found: the last leaf of fall',G.W/2,HZ+70*G.K); ctx.globalAlpha=1;}
}
