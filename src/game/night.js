// Stowe by moonlight.
import {G} from './state.js';
import {ctx, cv, darkC, dctx} from './canvas.js';

export function drawNight(){
  if(!G.LV.night) return;
  const w=darkC.width, h=darkC.height, s=w/G.W;
  dctx.setTransform(1,0,0,1,0,0); dctx.globalCompositeOperation='source-over'; dctx.clearRect(0,0,w,h);
  dctx.fillStyle='rgba(4,6,18,0.9)'; dctx.fillRect(0,0,w,h);
  dctx.globalCompositeOperation='destination-out';
  const hole=(x,y,r,a)=>{const g=dctx.createRadialGradient(x*s,y*s,0,x*s,y*s,r*s); g.addColorStop(0,`rgba(0,0,0,${a})`); g.addColorStop(0.55,`rgba(0,0,0,${a*0.85})`); g.addColorStop(1,'rgba(0,0,0,0)'); dctx.fillStyle=g; dctx.fillRect((x-r)*s,(y-r)*s,2*r*s,2*r*s);};
  hole(G.rx,G.ry,120*G.K,1);
  hole(G.tp.x+G.tp.w/2,G.H+10,G.tp.w*0.95,0.8);
  hole(G.W-46*G.K,G.MINY+40*G.K,90*G.K,0.5);
  for(const u of G.pickups) hole(u.x,u.y,26*G.K,0.8);
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(darkC,0,0,cv.width,cv.height); ctx.restore();
  ctx.globalCompositeOperation='lighter';
  const g=ctx.createRadialGradient(G.rx,G.ry,0,G.rx,G.ry,90*G.K); g.addColorStop(0,'rgba(255,190,110,0.22)'); g.addColorStop(1,'rgba(255,190,110,0)');
  ctx.fillStyle=g; ctx.fillRect(G.rx-90*G.K,G.ry-90*G.K,180*G.K,180*G.K);
  ctx.globalCompositeOperation='source-over';
  const mx=G.W-46*G.K, my=G.MINY+40*G.K, mg=ctx.createRadialGradient(mx,my,0,mx,my,60*G.K);
  mg.addColorStop(0,'rgba(240,236,214,0.5)'); mg.addColorStop(1,'rgba(240,236,214,0)');
  ctx.fillStyle=mg; ctx.fillRect(mx-60*G.K,my-60*G.K,120*G.K,120*G.K);
  ctx.fillStyle='#f3eedb'; ctx.beginPath(); ctx.arc(mx,my,15*G.K,0,6.283); ctx.fill();
}
