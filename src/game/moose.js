// The Greenville moose.
import {G} from './state.js';
import {bellow, noiseHit, tones} from './audio.js';
import {ctx} from './canvas.js';
import {densestPile} from './kids.js';
import {inTarp, lawnSpot} from './lawn.js';
import {award, buzz, shake} from './polish.js';
import {popup, scatterAt} from './round.js';

// ---------- The Greenville moose: wanders to your biggest pile and tramples it, charges the tarp now and then,
// and runs off when a thrown bag hits him. Five hits and he leaves for good.
export function initMoose(){return {x:-60,y:G.MINY+(G.MAXY-G.MINY)*0.4,dir:[1,0],hp:5,mode:'wander',t:0,away:0,charge:9,trample:0,flash:0,home:null};}

export function updateMoose(dt){
  const M=G.moose; M.t+=dt; M.flash=Math.max(0,M.flash-dt*3);
  if(M.mode==='gone') return;
  if(M.mode==='away'){
    M.away-=dt;
    if(M.away<=0){const left=Math.random()<0.5; M.x=left?-60:G.W+60; M.y=G.MINY+(G.MAXY-G.MINY)*(0.2+Math.random()*0.5); M.mode='wander'; M.charge=10+Math.random()*6;}
    return;
  }
  let tgt, sp=55*G.K*G.D.rival;
  if(M.mode==='flee'){tgt=[M.x<G.W/2?-100:G.W+100,M.y]; sp=220*G.K;}
  else if(M.mode==='charge'){tgt=[G.tp.x+G.tp.w/2,G.tp.y+G.tp.h/2]; sp=170*G.K*G.D.rival;}
  else tgt=densestPile(10)||M.home||(M.home=lawnSpot(40));
  const dx=tgt[0]-M.x, dy=tgt[1]-M.y, d=Math.hypot(dx,dy);
  if(d>1){M.dir=[dx/d,dy/d]; const m=Math.min(d,sp*dt); M.x+=M.dir[0]*m; M.y+=M.dir[1]*m;}
  if(M.mode==='flee'&&(M.x<-90||M.x>G.W+90)){M.mode=M.hp<=0?'gone':'away'; M.away=8; return;}
  if(M.mode==='charge'&&d<14){
    for(const l of G.leaves) if(l.st===0&&inTarp(l.x,l.y,6)){const a=Math.atan2(l.y-M.y,l.x-M.x)+(Math.random()-0.5); l.vx+=Math.cos(a)*420*G.K; l.vy+=Math.sin(a)*420*G.K; l.rest=0;}
    popup('The moose charged the tarp!',M.x,M.y-40*G.K,false); shake(6); buzz([40,30,40]); noiseHit(120,0.7,0.4,0.6,'lowpass');
    M.mode='wander'; M.charge=10+Math.random()*5; M.home=null;
  }
  if(M.mode==='wander'){
    M.charge-=dt;
    if(M.charge<=0){M.mode='charge'; bellow();}
    if(d<10) M.home=null;
  }
  M.trample-=dt;
  if(M.trample<=0&&M.mode!=='flee'){M.trample=0.25; scatterAt(M.x+M.dir[0]*16*G.K,M.y+M.dir[1]*16*G.K,24*G.K,0.55);}
}

export function hitMoose(){
  const M=G.moose;
  M.hp--; M.flash=1; M.mode='flee'; shake(5); buzz(50); tones([196,147],'sawtooth',0.12,0.3,0.1);
  if(M.hp<=0){G.score+=1500; popup('The moose heads back into the woods  +1500',M.x,M.y-36*G.K,true); award('moose');}
  else popup(`Bonk! ${M.hp} to go`,M.x,M.y-36*G.K,true);
}

export function drawMoose(){
  const M=G.moose;
  if(!M||M.mode==='gone'||M.mode==='away') return;
  const step=Math.sin(M.t*(M.mode==='wander'?6:14));
  ctx.save(); ctx.translate(M.x,M.y); ctx.rotate(Math.atan2(M.dir[1],M.dir[0])); ctx.scale(G.K,G.K);
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(4,6,40,18,0,0,6.283); ctx.fill();
  ctx.fillStyle='#2e1d10';
  for(const [lx,ly,s] of [[-18,-13,1],[-18,13,-1],[18,-13,-1],[18,13,1]]){ctx.beginPath(); ctx.arc(lx+step*4*s,ly,4.5,0,6.283); ctx.fill();}
  ctx.fillStyle='#5a3a22'; ctx.beginPath(); ctx.ellipse(0,0,30,15,0,0,6.283); ctx.fill();
  ctx.fillStyle='#432a17'; ctx.beginPath(); ctx.ellipse(8,0,14,11,0,0,6.283); ctx.fill();
  ctx.fillStyle='#4a2f1b'; ctx.beginPath(); ctx.ellipse(34,0,13,8,0,0,6.283); ctx.fill();
  ctx.fillStyle='#3a2414'; ctx.beginPath(); ctx.ellipse(45,0,7,6,0,0,6.283); ctx.fill();
  ctx.fillStyle='#cdb88f';
  for(const s of [-1,1]){
    ctx.beginPath(); ctx.moveTo(30,s*6); ctx.quadraticCurveTo(26,s*22,18,s*30); ctx.lineTo(24,s*25); ctx.lineTo(27,s*33); ctx.lineTo(31,s*26); ctx.lineTo(36,s*32); ctx.lineTo(37,s*22); ctx.quadraticCurveTo(36,s*12,32,s*6); ctx.closePath(); ctx.fill();
  }
  if(M.flash>0){ctx.globalAlpha=M.flash*0.7; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(10,0,42,18,0,0,6.283); ctx.fill();}
  ctx.restore();
}
