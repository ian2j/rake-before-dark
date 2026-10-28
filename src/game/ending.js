// The ending: first snow and credits.
import {G} from './state.js';
import {DIFFS, LEVELS} from '../data/levels.js';
import {ctx, nctx} from './canvas.js';
import {animateFlakes} from './round.js';
import {show} from './screens.js';
import {updateSnowman} from './snowman.js';
import {$, BAG_SIZE, esc, num, smooth} from '../lib/util.js';

// ---------- The ending: first snow, credits, then a snow day.
export function updateEnding(dt){
  const E=G.ending; E.t+=dt; G.playT+=dt;
  if(E.sub==='snowman') return updateSnowman(dt);
  G.snowAmt=Math.min(1,G.snowAmt+dt*0.3);
  nctx.setTransform(G.DPR,0,0,G.DPR,0,0); nctx.fillStyle='rgba(244,247,255,0.3)'; nctx.beginPath();
  for(let i=0,n=G.W*G.H*0.004*dt;i<n;i++){const x=Math.random()*G.W, y=Math.random()*G.H, r=(3+Math.random()*5)*G.K; nctx.moveTo(x+r,y); nctx.arc(x,y,r,0,6.283);}
  nctx.fill();
  for(const l of G.leaves) if(l.st===0) l.b=Math.min(1,l.b+dt*0.25);
  animateFlakes(dt);
  if(G.boss) G.boss.fade=Math.min(1,G.boss.fade+dt*0.5);
  if(E.sub==='snow'&&E.t>5.5){E.sub='credits'; showCredits();}
}

export function drawFirstSnow(){
  if(G.ending.sub!=='snow') return;
  const a=smooth((G.ending.t-0.8)/0.8)*(1-smooth((G.ending.t-4.4)/0.9));
  if(a<=0) return;
  ctx.setTransform(G.DPR,0,0,G.DPR,0,0); ctx.globalAlpha=a; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
  ctx.font=`400 ${Math.min(30*G.K,G.W/14)}px Shrikhand, Georgia, serif`;
  ctx.lineWidth=6; ctx.strokeStyle='rgba(28,21,48,0.7)'; ctx.strokeText('The first snow of winter',G.W/2,G.H*0.42);
  ctx.fillStyle='#ffd27a'; ctx.fillText('The first snow of winter',G.W/2,G.H*0.42);
  ctx.globalAlpha=1;
}

export function showCredits(){
  const st=G.store.stats, ids=Object.keys(LEVELS);
  const finds=ids.reduce((t,id)=>t+(G.store.finds[id]||[]).length,0);
  const stars=ids.reduce((t,id)=>t+[1,2,3,4,5].reduce((u,d)=>u+Math.max(0,...Object.keys(DIFFS).map(df=>G.store.best[`${id}:d${d}:${df}`]?.stars||0)),0),0);
  const line=(n,t)=>`<p><span class="big">${n}</span>${t}</p>`;
  $('roll').innerHTML=`<h1>Rake Before Dark</h1><h3>A fall in New England</h3>`
    +line(num(G.store.total),'leaves raked')+line(num(Math.floor(G.store.total/BAG_SIZE)),'bags filled')+line(`${stars} of 90`,'stars')
    +line(`${finds} of 30`,'things found under the leaves')+line(num(st.shoo||0),'trick-or-treaters shooed')
    +line(`${G.store.dale.length} of 6`,'towns where you beat Dale')+line(num(st.lost||0),'leaves lost to the Atlantic')
    +`<h3>The towns</h3>`+Object.values(LEVELS).map(l=>`<p><b>${l.town}, ${l.state}</b><br>${esc(l.facts[0])}</p>`).join('')
    +`<h3>Made by</h3><p>Ian Johnston</p><h3>Built with</h3><p>Claude</p>`
    +`<p class="tip">Sunset times from the sunrise equation. State outlines from the US Census atlas. Type in Shrikhand, Karla and DM Mono.</p>`;
  show('credits');
  const r=$('roll'); r.classList.remove('go'); void r.offsetWidth; r.classList.add('go');
  $('skipCredits').focus();
}
