// The snowed-in look of the menus after the storm.
import {G} from './state.js';
import {ctx, grass} from './canvas.js';
import {drawFlakes, drawLight, drawSea, drawWall} from './draw.js';
import {drawLighthouse} from './fog.js';

// ---------- Winter: after the storm, the title, map and shed sit over a snowed-in lawn.
export const winterView=()=>!!G.store.beatBoss&&['title','map','options','shed'].includes(G.state);

export function drawWinter(){
  ctx.setTransform(1,0,0,1,0,0); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  ctx.drawImage(grass,0,0);
  ctx.setTransform(G.DPR,0,0,G.DPR,0,0);
  ctx.fillStyle='rgba(240,244,250,0.95)'; ctx.fillRect(0,0,G.W,G.H);
  drawSea(); drawWall();
  ctx.fillStyle='rgba(255,255,255,0.9)';
  for(const st of G.stones){ctx.beginPath(); ctx.ellipse(st.x,st.y-st.ry*0.4,st.rx*0.8,st.ry*0.5,st.a,0,6.283); ctx.fill();}
  drawLighthouse();
  ctx.lineCap='round';
  for(const t of G.trees){
    for(const b of t.br){
      const ex=t.x+Math.cos(b.a)*b.l, ey=t.y+Math.sin(b.a)*b.l, mx=t.x+Math.cos(b.a)*b.l*0.55, my=t.y+Math.sin(b.a)*b.l*0.55;
      ctx.strokeStyle='#4a3626'; ctx.lineWidth=(3+4*b.k)*G.K;
      ctx.beginPath(); ctx.moveTo(t.x,t.y); ctx.lineTo(ex,ey); ctx.moveTo(mx,my); ctx.lineTo(mx+Math.cos(b.a+0.6)*b.l*0.35,my+Math.sin(b.a+0.6)*b.l*0.35); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=1.6*G.K;
      ctx.beginPath(); ctx.moveTo(t.x,t.y-2); ctx.lineTo(ex,ey-2); ctx.stroke();
    }
    ctx.fillStyle='#3d2c1f'; ctx.beginPath(); ctx.arc(t.x,t.y,t.r*0.16,0,6.283); ctx.fill();
  }
  const sa=G.snowAmt; G.snowAmt=1; drawFlakes(); G.snowAmt=sa;
  drawLight(0.12);
}
