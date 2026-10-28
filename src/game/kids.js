// Salem: trick-or-treaters and jack-o’-lanterns.
import {G} from './state.js';
import {KID_COSTUMES} from '../data/levels.js';
import {chime} from './audio.js';
import {ctx} from './canvas.js';
import {inTarp, lawnSpot} from './lawn.js';
import {shake} from './polish.js';
import {popup, scatterAt} from './round.js';
import {CELL, EMOJI_FONT, smooth} from '../lib/util.js';

// Trick-or-treaters come out early in the evening, walk to the densest patch of leaves off the tarp, jump in and scatter it.
export function densestPile(min){
  let best=min-1, at=null;
  const gh=G.grid.length/G.gw;
  for(let cy=0;cy<gh;cy++) for(let cx=0;cx<G.gw;cx++){
    const n=G.grid[cy*G.gw+cx];
    if(n<=best) continue;
    const x=(cx+0.5)*CELL, y=(cy+0.5)*CELL;
    if(inTarp(x,y,10)||x<G.MINX||x>G.MAXX||y<G.MINY||y>G.MAXY) continue;
    best=n; at=[x,y];
  }
  return at;
}

export function updateKids(dt,p){
  // They come out early in the evening. With no real pile on the lawn a kid heads for the leafiest patch, or failing that a random spot.
  if(p>G.DP.kidStart&&G.playT>=G.nextKid){
    const left=Math.random()<0.5;
    G.kids.push({x:left?-24:G.W+24,y:G.MINY+60+Math.random()*Math.max(1,G.MAXY-G.MINY-200),e:KID_COSTUMES[(Math.random()*KID_COSTUMES.length)|0],st:'seek',t:0,jt:0,ph:Math.random()*6.283,home:lawnSpot(40)});
    G.nextKid=G.playT+(7+Math.random()*4)*G.D.gustGap*G.DP.kidGap;
    if(G.kidsT<0) G.kidsT=G.playT;
  }
  const pile=G.kids.some(k=>k.st==='seek')?densestPile(12)||densestPile(4):null;
  for(const k of G.kids){
    k.t+=dt;
    if(k.st==='seek'){
      const target=pile||k.home;
      const dx=target[0]-k.x, dy=target[1]-k.y, d=Math.hypot(dx,dy), sp=90*G.K*dt;
      if(d<=sp+2){
        k.x=target[0]; k.y=target[1]; k.st='jump'; k.jt=0;
        scatterAt(k.x,k.y,48*G.K,1);
        popup('Wheee!',k.x,k.y-26*G.K,false); chime(false); shake(2);
      }else{k.x+=dx/d*sp; k.y+=dy/d*sp;}
    }else if(k.st==='jump'){
      k.jt+=dt; if(k.jt>0.7) k.st='leave';
    }else{
      k.x+=(k.x<G.W/2?-1:1)*(k.st==='shoo'?210:95)*G.K*dt;
    }
  }
  G.kids=G.kids.filter(k=>k.x>-60&&k.x<G.W+60);
}

export const lanterns=()=>[[G.MINX+14*G.K,G.MAXY-16*G.K],[G.MAXX-14*G.K,G.MINY+(G.MAXY-G.MINY)*0.45]];

export function drawLanterns(p){
  if(!G.LV.kids) return;
  const lit=Math.max(0.6,smooth((p-G.pSun+0.05)/0.1));
  for(const [x,y] of lanterns()){
    const r=11*G.K;
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x+3,y+4,r*1.1,r*0.9,0,0,6.283); ctx.fill();
    ctx.fillStyle='#e0761f'; ctx.beginPath(); ctx.ellipse(x,y,r*1.1,r*0.9,0,0,6.283); ctx.fill();
    ctx.strokeStyle='#b4561a'; ctx.lineWidth=1.2; ctx.beginPath();
    for(const o of [-0.45,0,0.45]){ctx.moveTo(x+o*r,y-r*0.85); ctx.quadraticCurveTo(x+o*r*1.6,y,x+o*r,y+r*0.85);}
    ctx.stroke();
    ctx.fillStyle='#4a6b2a'; ctx.fillRect(x-1.5*G.K,y-r*1.15,3*G.K,4*G.K);
    ctx.fillStyle=lit>0.05?`rgb(255,${Math.round(150+70*lit)},${Math.round(60*lit)})`:'#5a2a0c';
    ctx.beginPath();
    for(const s of [-1,1]){ctx.moveTo(x+s*r*0.45,y-r*0.35); ctx.lineTo(x+s*r*0.25,y-r*0.05); ctx.lineTo(x+s*r*0.65,y-r*0.05); ctx.closePath();}
    ctx.moveTo(x-r*0.55,y+r*0.25); ctx.quadraticCurveTo(x,y+r*0.7,x+r*0.55,y+r*0.25); ctx.quadraticCurveTo(x,y+r*0.45,x-r*0.55,y+r*0.25);
    ctx.fill();
  }
}

export function drawKids(){
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const k of G.kids){
    const hop=k.st==='jump'?Math.sin(Math.PI*Math.min(k.jt/0.5,1)):0, bob=k.st==='jump'?0:Math.abs(Math.sin(k.t*9+k.ph))*3*G.K;
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(k.x+4,k.y+12*G.K,10*G.K*(1-0.3*hop),5*G.K,0,0,6.283); ctx.fill();
    ctx.font=`${26*G.K*(1+0.45*hop)}px ${EMOJI_FONT}`;
    ctx.fillText(k.e,k.x,k.y-bob-hop*22*G.K);
  }
}

export function drawHalloweenLight(q){
  if(!G.LV.kids) return;
  q=Math.max(q,0.55);
  ctx.globalCompositeOperation='lighter';
  const glow=(x,y,r,a)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,`rgba(255,170,70,${a})`); g.addColorStop(1,'rgba(255,170,70,0)'); ctx.fillStyle=g; ctx.fillRect(x-r,y-r,2*r,2*r);};
  for(const [x,y] of lanterns()) glow(x,y,70*G.K,0.3*q);
  for(const k of G.kids) glow(k.x,k.y,45*G.K,0.16*q);
  ctx.globalCompositeOperation='source-over';
}
