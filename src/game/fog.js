// Bass Harbor: fog banks and the lighthouse beam.
import {G} from './state.js';
import {ctx, cv, fctx, fogTex, fogWork, wctx} from './canvas.js';
import {smooth} from '../lib/util.js';

export const bump=(p,c,w)=>smooth(1-Math.abs(p-c)/w);

export const fogAt=p=>G.LV.boss?(G.boss?G.boss.fog:0):G.LV.fog?Math.min(0.92,G.DP.fogBase*smooth(p/0.1)+G.DP.fogPeak*G.DP.fogBanks.reduce((m,[c,w])=>Math.max(m,bump(p,c,w)),0)):0;

export const lighthouse=()=>({x:G.W-14*G.K,y:G.MINY+14*G.K});

export const beamAngle=()=>G.playT*2*Math.PI/G.DP.beamPeriod;

export function paintFog(){
  const fw=Math.ceil(G.W/2), fh=Math.ceil(G.H/2);
  fogTex.width=fogWork.width=fw; fogTex.height=fogWork.height=fh;
  for(let i=0;i<70;i++){
    const x=Math.random()*fw, y=Math.random()*fh, r=40+Math.random()*90;
    for(const ox of [-fw,0,fw]) for(const oy of [-fh,0,fh]){
      const cx=x+ox, cy=y+oy;
      if(cx+r<0||cx-r>fw||cy+r<0||cy-r>fh) continue;
      const g=fctx.createRadialGradient(cx,cy,0,cx,cy,r);
      g.addColorStop(0,'rgba(228,233,238,0.5)'); g.addColorStop(1,'rgba(228,233,238,0)');
      fctx.fillStyle=g; fctx.fillRect(cx-r,cy-r,2*r,2*r);
    }
  }
}

export function beamPath(c,scale,len,spread){
  const L=lighthouse(), a=beamAngle();
  c.beginPath(); c.moveTo(L.x*scale,L.y*scale);
  c.lineTo((L.x+Math.cos(a-spread)*len)*scale,(L.y+Math.sin(a-spread)*len)*scale);
  c.lineTo((L.x+Math.cos(a+spread)*len)*scale,(L.y+Math.sin(a+spread)*len)*scale);
  c.closePath();
}

export function drawFog(){
  if(G.fogAmt<=0.01) return;
  const fw=fogWork.width, fh=fogWork.height;
  wctx.setTransform(1,0,0,1,0,0);
  wctx.globalCompositeOperation='source-over'; wctx.clearRect(0,0,fw,fh);
  wctx.fillStyle='rgba(225,230,236,0.45)'; wctx.fillRect(0,0,fw,fh);
  const o1=((G.playT*7)%fw+fw)%fw, o2=((-G.playT*4)%fw+fw)%fw, oy=fh*0.37;
  for(const ox of [o1-fw,o1]) wctx.drawImage(fogTex,ox,0);
  for(const ox of [o2-fw,o2]) for(const y of [oy-fh,oy]) wctx.drawImage(fogTex,ox,y);
  if(G.LV.fog){
    wctx.globalCompositeOperation='destination-out';
    wctx.fillStyle='rgba(0,0,0,0.85)';
    beamPath(wctx,0.5,Math.hypot(G.W,G.H),0.17); wctx.fill();
  }
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=G.fogAmt;
  ctx.drawImage(fogWork,0,0,cv.width,cv.height);
  ctx.restore();
}

export function drawLighthouse(){
  if(!G.LV.fog) return;
  const L=lighthouse(), r=12*G.K;
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(L.x+3,L.y+4,r,0,6.283); ctx.fill();
  ctx.fillStyle='#f3efe6'; ctx.beginPath(); ctx.arc(L.x,L.y,r,0,6.283); ctx.fill();
  ctx.fillStyle='#b8322a'; ctx.beginPath(); ctx.arc(L.x,L.y,r*0.62,0,6.283); ctx.fill();
  ctx.fillStyle='#ffe9a8'; ctx.beginPath(); ctx.arc(L.x,L.y,r*0.3,0,6.283); ctx.fill();
}

export function drawBeamGlow(){
  if(!G.LV.fog) return;
  const L=lighthouse(), len=Math.hypot(G.W,G.H);
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const g=ctx.createRadialGradient(L.x,L.y,0,L.x,L.y,len*0.8);
  g.addColorStop(0,'rgba(255,236,190,0.35)'); g.addColorStop(1,'rgba(255,236,190,0)');
  ctx.fillStyle=g; beamPath(ctx,1,len,0.17); ctx.fill();
  ctx.restore();
}
