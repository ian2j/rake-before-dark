// Dale, the rival raker on Thursdays.
import {G} from './state.js';
import {ctx} from './canvas.js';
import {drawRakeAt} from './draw.js';
import {lanterns} from './kids.js';
import {inCanopy, inTarp, onWall} from './lawn.js';
import {rakeLeaves, scrapeStroke} from './round.js';
import {CELL, EMOJI_FONT, clamp} from '../lib/util.js';

// ---------- Dale, the rival raker (every Thursday). He rakes toward his own tarp with the same rake physics,
// walks around walls, and whoever bags more by dusk wins.
export const inRivalTarp=(x,y,m)=>{const r=G.rival.tarp; return x>r.x-m&&x<r.x+r.w+m&&y>r.y-m&&y<r.y+r.h+m;};

export function placeRivalTarp(){
  const w=clamp(Math.min(G.W,G.SEAX)*0.42,160,300)*0.62, h=w*0.52;
  const cands=[[G.MAXX-w-8,G.MINY+34*G.K],[G.MAXX-w-8,G.MINY+(G.MAXY-G.MINY)*0.3],[G.MINX+8,G.MINY+(G.MAXY-G.MINY)*0.42],[G.MINX+8,G.MINY+(G.MAXY-G.MINY)*0.62],[G.MAXX-w-8,G.MINY+(G.MAXY-G.MINY)*0.55]];
  for(const [x,y] of cands){
    if(x+w>Math.min(G.MAXX,G.SEAX-12)) continue;
    if(G.LV.fog&&x+w>G.W-70*G.K&&y<G.MINY+70*G.K) continue;
    const pts=[[x,y],[x+w,y],[x,y+h],[x+w,y+h],[x+w/2,y+h/2],[x+w/2,y],[x+w/2,y+h]];
    if(pts.some(([a,b])=>onWall(a,b,16)||inCanopy(a,b)||inTarp(a,b,24)||lanterns().some(([lx,ly])=>G.LV.kids&&Math.hypot(a-lx,b-ly)<30))) continue;
    return {x,y,w,h};
  }
  return {x:G.MINX+8,y:G.MINY+(G.MAXY-G.MINY)*0.5,w,h};
}

// Breadth-first path on a coarse grid around walls; a straight line when there are none.
export function routePath(x0,y0,x1,y1){
  if(!G.walls.length) return [[x1,y1]];
  const C=14, gw2=Math.ceil(G.W/C), gh2=Math.ceil(G.H/C), id=(x,y)=>y*gw2+x;
  const free=(x,y)=>x>=0&&y>=0&&x<gw2&&y<gh2&&!onWall(x*C+C/2,y*C+C/2,8);
  const s=[clamp(Math.floor(x0/C),0,gw2-1),clamp(Math.floor(y0/C),0,gh2-1)], g=[clamp(Math.floor(x1/C),0,gw2-1),clamp(Math.floor(y1/C),0,gh2-1)];
  const prev=new Map([[id(...s),-1]]), q=[s];
  for(let qi=0;qi<q.length;qi++){
    const [x,y]=q[qi];
    if(x===g[0]&&y===g[1]) break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx, ny=y+dy, k=id(nx,ny); if(free(nx,ny)&&!prev.has(k)){prev.set(k,id(x,y)); q.push([nx,ny]);}}
  }
  if(!prev.has(id(...g))) return [[x1,y1]];
  const path=[];
  for(let k=id(...g);k!==-1;k=prev.get(k)) path.push([(k%gw2)*C+C/2,Math.floor(k/gw2)*C+C/2]);
  path.reverse(); path.push([x1,y1]);
  return path.filter((_,i)=>i%2===1||i===path.length-1);
}

export function makeRival(){
  const t=placeRivalTarp();
  G.rival={tarp:t,x:t.x+t.w/2,y:t.y-20*G.K,dir:[0,1],mode:'wait',waitT:2,path:[],pi:0,lastC:0,next:null};
}

export function updateRival(dt){
  const R=G.rival;
  if(R.mode==='wait'){R.waitT-=dt; if(R.waitT<=0) R.mode='idle'; return;}
  if(R.mode==='idle'){
    let best=null, bs=-1;
    for(let i=0;i<40;i++){
      const l=G.leaves[(Math.random()*G.leaves.length)|0];
      if(!l||l.st!==0||inTarp(l.x,l.y,8)||inRivalTarp(l.x,l.y,8)) continue;
      const n=G.grid[(l.y/CELL|0)*G.gw+(l.x/CELL|0)], s=n/(1+Math.hypot(l.x-R.x,l.y-R.y)/(160*G.K));
      if(s>bs){bs=s; best=l;}
    }
    if(!best){R.mode='wait'; R.waitT=0.5; return;}
    const tc=[R.tarp.x+R.tarp.w/2,R.tarp.y+R.tarp.h/2], d=Math.hypot(best.x-tc[0],best.y-tc[1])||1;
    const st=[clamp(best.x+(best.x-tc[0])/d*28*G.K,G.MINX,G.MAXX),clamp(best.y+(best.y-tc[1])/d*28*G.K,G.MINY,G.MAXY)];
    R.path=routePath(R.x,R.y,st[0],st[1]); R.pi=0; R.mode='walk';
    R.next=()=>{R.path=routePath(st[0],st[1],tc[0],tc[1]); R.pi=0; R.mode='rake'; R.lastC=0;};
  }
  const ox=R.x, oy=R.y;
  let move=(R.mode==='walk'?520:380)*G.K*G.D.rival*dt;
  while(move>0&&R.pi<R.path.length){
    const [tx,ty]=R.path[R.pi], dx=tx-R.x, dy=ty-R.y, d=Math.hypot(dx,dy);
    if(d<=move){R.x=tx; R.y=ty; move-=d; R.pi++;} else{R.x+=dx/d*move; R.y+=dy/d*move; move=0;}
  }
  const L=Math.hypot(R.x-ox,R.y-oy);
  if(L>0.01){
    R.dir=[(R.x-ox)/L,(R.y-oy)/L];
    if(R.mode==='rake'){R.lastC=rakeLeaves(ox,oy,R.x,R.y,dt,30*G.K,R.lastC); scrapeStroke(ox,oy,R.x,R.y,R.dir[0],R.dir[1],30*G.K);}
  }
  if(R.pi>=R.path.length){if(R.mode==='walk') R.next(); else{R.mode='wait'; R.waitT=0.1;}}
}

export function drawRival(){
  if(!G.rival) return;
  const t=G.rival.tarp;
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(t.x+4,t.y+5,t.w,t.h);
  ctx.fillStyle='#5b3f8c'; ctx.fillRect(t.x,t.y,t.w,t.h);
  ctx.strokeStyle='#8d72c0'; ctx.lineWidth=2; ctx.strokeRect(t.x+1,t.y+1,t.w-2,t.h-2);
  ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font=`700 ${11*G.K}px Karla, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('DALE',t.x+t.w/2,t.y+t.h/2);
}

export function drawRivalRaker(){
  if(!G.rival) return;
  const [dx,dy]=G.rival.dir, hl=110*G.K;
  drawRakeAt(G.rival.x,G.rival.y,dx,dy,30*G.K,'#7a6a9a',1,false);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font=`${24*G.K}px ${EMOJI_FONT}`;
  ctx.fillText('🧒',G.rival.x-dx*hl,G.rival.y-dy*hl);
}
