// Lawn layout: screen bounds, trees, tarp, stone walls, cliff and sea, and the grass texture.
import {G} from './state.js';
import {cv, darkC, gctx, grass, scrape, snow} from './canvas.js';
import {paintFog} from './fog.js';
import {inRivalTarp} from './rival.js';
import {U} from './store.js';
import {$, CELL, EDGE, clamp} from '../lib/util.js';

export const inTarp=(x,y,m)=>x>G.tp.x-m&&x<G.tp.x+G.tp.w+m&&y>G.tp.y-m&&y<G.tp.y+G.tp.h+m;

export const inCanopy=(x,y)=>G.trees.some(t=>Math.hypot(x-t.x,y-t.y)<t.r*0.95);

export const rakeHalf=()=>34*G.K*(1+0.08*U('rake'))*(G.active.R?1.9:1)*(G.active.P?0.55:1);

// Trees overhang the left edge; each drops leaves across its own arc (a0..a1) of the lawn.
export function placeTrees(){
  const m=Math.min(G.W,G.H);
  G.trees=[{x:-m*0.06,y:-m*0.04,r:m*0.32,a0:0,a1:Math.PI/2}];
  if(G.DP.trees>1) G.trees.push({x:-m*0.1,y:G.MINY+(G.MAXY-G.MINY)*0.52,r:m*0.24,a0:-1.1,a1:1.1});
  G.tree=G.trees[0];
  for(const t of G.trees){
    t.br=Array.from({length:11},()=>({a:t.a0-0.25+Math.random()*(t.a1-t.a0+0.5),l:t.r*(0.5+Math.random()*0.5),k:Math.random()}));
    t.blobs=[];
    for(let i=0;i<18;i++){
      const a=t.a0-0.3+Math.random()*(t.a1-t.a0+0.6), rr=t.r*(0.15+Math.random()*0.7);
      t.blobs.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr,r:t.r*(0.22+Math.random()*0.2),c:G.LV.tree[i%G.LV.tree.length]});
    }
  }
}

export const pickTree=()=>G.trees[(Math.random()*G.trees.length)|0];

// Per-lawn layout: the tarp and bag, Connecticut's stone walls (a different layout each day), Rhode Island's cliff and sea.
export function wallLayout(d){
  const T=9*G.K, gap=52*G.K, X=f=>G.MINX+(G.MAXX-G.MINX)*f, Y=f=>G.MINY+(G.MAXY-G.MINY)*f;
  const hw=(y,x0,x1)=>({x0,x1,y0:y-T,y1:y+T}), vw=(x,y0,y1)=>({x0:x-T,x1:x+T,y0,y1});
  const row=(y,gaps)=>{const r=[]; let x=-20; for(const g of gaps){r.push(hw(y,x,X(g)-gap)); x=X(g)+gap;} r.push(hw(y,x,G.W+20)); return r;};
  if(d===1) return row(Y(0.46),[0.28,0.74]);
  if(d===2) return row(Y(0.46),[0.84]);
  if(d===3) return [hw(Y(0.4),-20,X(0.62)),vw(X(0.62),Y(0.4)-T,Y(0.78))];
  if(d===4){
    const x0=G.tarp.x-34*G.K, x1=G.bag.x+34*G.K, y0=G.tarp.y-38*G.K, cx=G.tarp.x+G.tarp.w/2;
    return [hw(y0,x0-T,cx-gap*1.1),hw(y0,cx+gap*1.1,x1+T),vw(x0,y0-T,G.H+20),vw(x1,y0-T,G.H+20)];
  }
  return [...row(Y(0.33),[0.82]),...row(Y(0.62),[0.18])];
}

export function placeGeom(){
  G.MINX=EDGE; G.MAXX=G.W-EDGE; G.SEAX=Infinity;
  if(G.LV.sea){G.SEAX=G.W-Math.max(56,70*G.K)-G.DP.cliff*G.K; G.MAXX=G.W;}
  const right=Math.min(G.W,G.SEAX), tw=clamp(right*0.42,160,300)*(1+0.1*U('tarp')), th=tw*0.52;
  G.tarp={w:tw,h:th,x:(G.MINX+right-tw)/2-18*G.K,y:G.H-th-G.SAFE_B-24};
  G.tarpScale=1; placeTarp();
  G.bag={x:G.tarp.x+G.tarp.w+30*G.K,y:G.tarp.y+G.tarp.h*0.55};
  G.walls=G.LV.wall?wallLayout(G.DP.walls):[]; G.stones=[];
  const greys=['#8d8a83','#a19d94','#77746e','#b3aea3','#6a6862'];
  for(const r of G.walls){
    const horiz=r.x1-r.x0>r.y1-r.y0, cx=(r.x0+r.x1)/2, cy=(r.y0+r.y1)/2;
    const a0=Math.max(horiz?r.x0:r.y0,0), a1=Math.min(horiz?r.x1:r.y1,horiz?G.W:G.H);
    for(let a=a0;a<a1;a+=9*G.K) for(const s of [-1,1]){
      const along=a+(Math.random()-0.5)*4*G.K, off=s*4*G.K+(Math.random()-0.5)*3*G.K;
      G.stones.push({x:horiz?along:cx+off,y:horiz?cy+off:along,rx:(5+Math.random()*3)*G.K,ry:(3.5+Math.random()*2)*G.K,a:(horiz?0:Math.PI/2)+Math.random()*0.6-0.3,c:greys[(Math.random()*greys.length)|0]});
    }
  }
  placeTrees();
}

export const onWall=(x,y,m)=>G.walls.some(r=>x>r.x0-m&&x<r.x1+m&&y>r.y0-m&&y<r.y1+m);

// Liang-Barsky: does the move from (x0,y0) to (x1,y1) pass through rectangle r?
export function segHits(x0,y0,x1,y1,r){
  let t0=0, t1=1;
  const dx=x1-x0, dy=y1-y0;
  for(const [p,q] of [[-dx,x0-r.x0],[dx,r.x1-x0],[-dy,y0-r.y0],[dy,r.y1-y0]]){
    if(p===0){if(q<0) return false; continue;}
    const t=q/p;
    if(p<0){if(t>t1) return false; if(t>t0) t0=t;}
    else{if(t<t0) return false; if(t<t1) t1=t;}
  }
  return true;
}

// A leaf that enters or crosses a wall this frame goes back to the face it came from.
export function wallCollide(l){
  if(l.px===undefined){l.px=l.x; l.py=l.y;}
  // Two passes, so a leaf pushed out of one wall piece into a joining piece gets pushed out again.
  for(let pass=0;pass<2;pass++) for(const r of G.walls){
    const inside=l.x>r.x0&&l.x<r.x1&&l.y>r.y0&&l.y<r.y1;
    if(!inside&&!segHits(l.px,l.py,l.x,l.y,r)) continue;
    if(l.py<=r.y0){l.y=r.y0-0.5; l.vy=Math.min(0,l.vy);}
    else if(l.py>=r.y1){l.y=r.y1+0.5; l.vy=Math.max(0,l.vy);}
    else if(l.px<=r.x0){l.x=r.x0-0.5; l.vx=Math.min(0,l.vx);}
    else if(l.px>=r.x1){l.x=r.x1+0.5; l.vx=Math.max(0,l.vx);}
    else{
      const d=[l.y-r.y0,r.y1-l.y,l.x-r.x0,r.x1-l.x], m=Math.min(...d);
      if(m===d[0]) l.y=r.y0-0.5; else if(m===d[1]) l.y=r.y1+0.5; else if(m===d[2]) l.x=r.x0-0.5; else l.x=r.x1+0.5;
    }
  }
}

export function placeTarp(){
  const cx=G.tarp.x+G.tarp.w/2, bottom=G.tarp.y+G.tarp.h;
  let w=G.tarp.w*G.tarpScale, h=G.tarp.h*G.tarpScale;
  w=Math.min(w,G.W-EDGE); h=Math.min(h,bottom-G.MINY);
  G.tp={w,h,x:clamp(cx-w/2,EDGE/2,G.W-EDGE/2-w),y:bottom-h};
}

export function layout(){
  G.DPR=Math.min(window.devicePixelRatio||1,2);
  G.W=innerWidth; G.H=innerHeight;
  cv.width=Math.round(G.W*G.DPR); cv.height=Math.round(G.H*G.DPR);
  const m=Math.min(G.W,G.H);
  G.K=clamp(m/520,0.8,1.35);
  G.SAFE_B=$('safe').offsetHeight;
  // Keep leaves out of the strips where phones take edge swipes as back or home gestures, and out from under the HUD.
  G.MINY=Math.max(56,$('hud').getBoundingClientRect().bottom-14); G.MAXY=G.H-G.SAFE_B-20;
  placeGeom();
  paintGrass(); paintFog(); darkC.width=Math.ceil(G.W/2); darkC.height=Math.ceil(G.H/2);
  scrape.width=snow.width=cv.width; scrape.height=snow.height=cv.height;
  for(const l of G.leaves){l.x=clamp(l.x,G.MINX,G.MAXX); l.y=clamp(l.y,G.MINY,G.MAXY);}
  G.gw=Math.ceil(G.W/CELL)+1;
  G.grid=new Uint16Array(G.gw*(Math.ceil(G.H/CELL)+1));
  G.streaks=Array.from({length:36},()=>({x:Math.random()*G.W,y:Math.random()*G.H,len:30+Math.random()*70}));
  G.flakes=Array.from({length:Math.round(clamp(G.W*G.H/2500,80,260))},()=>({x:Math.random()*G.W,y:Math.random()*G.H,r:0.8+Math.random()*1.8,v:30+Math.random()*50,ph:Math.random()*6.283}));
}

export function paintGrass(){
  grass.width=cv.width; grass.height=cv.height;
  const g=gctx;
  g.setTransform(G.DPR,0,0,G.DPR,0,0);
  g.fillStyle='#55743a'; g.fillRect(0,0,G.W,G.H);
  const band=Math.max(46,G.W/9);
  g.fillStyle='rgba(255,255,220,0.045)';
  for(let x=-G.H;x<G.W+G.H;x+=band*2){g.beginPath();g.moveTo(x,0);g.lineTo(x+band,0);g.lineTo(x+band+G.H*0.35,G.H);g.lineTo(x+G.H*0.35,G.H);g.fill();}
  const tones=['#3f5c2a','#4b6a31','#6a8a45','#7d9a52','#5d7c3c'], n=(G.W*G.H/35)|0;
  g.lineWidth=1; g.lineCap='round';
  for(let i=0;i<n;i++){
    const x=Math.random()*G.W, y=Math.random()*G.H;
    g.strokeStyle=tones[i%5]; g.globalAlpha=0.35+Math.random()*0.4;
    g.beginPath(); g.moveTo(x,y); g.lineTo(x+(Math.random()-0.5)*3,y-2-Math.random()*4); g.stroke();
  }
  g.globalAlpha=1;
}

export function lawnSpot(margin){
  for(let i=0;i<500;i++){
    const x=G.MINX+margin+Math.random()*(Math.min(G.MAXX,G.SEAX-20)-G.MINX-2*margin), y=G.MINY+margin+Math.random()*(G.MAXY-G.MINY-2*margin);
    if(!inTarp(x,y,30)&&!inCanopy(x,y)&&!onWall(x,y,20)&&!(G.rival&&inRivalTarp(x,y,24))&&Math.hypot(x-G.bag.x,y-G.bag.y)>40) return [x,y];
  }
  return [G.W/2,G.H/2];
}
