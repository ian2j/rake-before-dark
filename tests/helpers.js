// Shared test helpers: boots the game once, and a scripted player that rakes the way a quick, accurate person would.
import {G} from '../src/game/state.js';
import {boot} from '../src/game/boot.js';
import {update} from '../src/game/round.js';
import {inTarp, onWall} from '../src/game/lawn.js';
import {begin} from '../src/game/screens.js';
import {lerp} from '../src/lib/util.js';

export const els=globalThis.__els;
let booted=false;
export function start(){if(!booted){boot(); booted=true;}}
export const pointer=(type,x,y)=>els.lawn.listeners[type]({pointerId:1,clientX:x,clientY:y,pointerType:'touch'});

// Breadth-first path around stone walls on a coarse grid, so the player can route leaves through the gaps.
function route(x0,y0,x1,y1){
  if(!G.walls.length) return [[x0,y0],[x1,y1]];
  const C=14, gw=Math.ceil(G.W/C), gh=Math.ceil(G.H/C), id=(x,y)=>y*gw+x, free=(x,y)=>x>=0&&y>=0&&x<gw&&y<gh&&!onWall(x*C+C/2,y*C+C/2,6);
  const s=[Math.floor(x0/C),Math.floor(y0/C)], g=[Math.floor(x1/C),Math.floor(y1/C)], prev=new Map([[id(...s),-1]]), q=[s];
  for(let i=0;i<q.length;i++){const [x,y]=q[i]; if(x===g[0]&&y===g[1]) break; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx, ny=y+dy, k=id(nx,ny); if(free(nx,ny)&&!prev.has(k)){prev.set(k,id(x,y)); q.push([nx,ny]);}}}
  if(!prev.has(id(...g))) return [[x0,y0],[x1,y1]];
  const path=[]; for(let k=id(...g);k!==-1;k=prev.get(k)) path.push([(k%gw)*C+C/2,Math.floor(k/gw)*C+C/2]);
  return path.reverse();
}
function along(path,t){
  const seg=[]; let L=0;
  for(let i=1;i<path.length;i++){const d=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]); seg.push(d); L+=d;}
  let r=t*L;
  for(let i=0;i<seg.length;i++){if(r<=seg[i]||i===seg.length-1){const f=seg[i]?Math.min(1,r/seg[i]):1; return [lerp(path[i][0],path[i+1][0],f),lerp(path[i][1],path[i+1][1],f)];} r-=seg[i];}
  return path[path.length-1];
}
// One frame of the scripted player. 'smart' picks a leaf off the tarp and drags it to the tarp; 'random' swipes anywhere.
let stroke=null;
export function botFrame(f,mode){
  const cycle=G.walls.length&&mode==='smart'?70:40, ph=f%cycle, tx=G.tp.x+G.tp.w/2, ty=G.tp.y+G.tp.h/2;
  if(ph===0){
    let x,y;
    if(mode==='smart'){
      const ground=G.leaves.filter(l=>l.st===0&&!inTarp(l.x,l.y,0)), l=ground[(Math.random()*ground.length)|0]||{x:G.W/2,y:G.H/2}, d=Math.hypot(l.x-tx,l.y-ty)||1;
      x=l.x+(l.x-tx)/d*30; y=l.y+(l.y-ty)/d*30;
    }else{x=G.MINX+Math.random()*(G.MAXX-G.MINX); y=G.MINY+Math.random()*(G.tarp.y-G.MINY-40);}
    stroke=mode==='smart'?route(x,y,tx,ty):[[x,y],[tx,ty]];
    pointer('pointerdown',x,y);
  }else if(ph<cycle-10){const [x,y]=along(stroke,ph/(cycle-11)); pointer('pointermove',x,y);}
  else if(ph===cycle-10) pointer('pointerup',0,0);
}
// Plays a town's day to the end and reports what happened.
export function playDay(id,day,mode='smart',opts={}){
  start();
  G.mapSel=id; G.mapDay=day; begin();
  const checks={nan:0,inWall:0};
  for(let f=0;f<60*200&&G.state==='play';f++){
    botFrame(f,mode); update(1/60); opts.each?.(f);
    for(const l of G.leaves){if(!Number.isFinite(l.x)||!Number.isFinite(l.y)) checks.nan++; if(l.st===0&&G.walls.length&&onWall(l.x,l.y,-1.5)) checks.inWall++;}
  }
  return {state:G.state,secs:G.elapsed,bagged:G.bagged,lost:G.lost,rival:G.rivalBagged,pct:+els.rPct.textContent.replace('%',''),stars:(els.stars.innerHTML.split('<')[0].match(/★/g)||[]).length,...checks};
}
