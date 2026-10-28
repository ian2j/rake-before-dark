// The animation frame loop.
import {G} from './state.js';
import {cv} from './canvas.js';
import {draw} from './draw.js';
import {drawFirstSnow, updateEnding} from './ending.js';
import {animateFlakes, update} from './round.js';
import {drawSnowmanScene} from './snowman.js';
import {drawToss, updateToss} from './toss.js';
import {winterView} from './winter.js';
import {musicTick} from './music.js';

export function frame(now){
  const dt=Math.min((now-G.last)/1000,1/30); G.last=now;
  if(G.state==='play'&&dt>0) update(dt);
  else if(G.state==='ending'&&dt>0) updateEnding(dt);
  else if(G.state==='toss'&&dt>0) updateToss(dt);
  else if(winterView()&&dt>0) animateFlakes(dt);
  if(G.state==='toss') drawToss();
  else if(G.state==='ending'&&G.ending&&G.ending.sub==='snowman') drawSnowmanScene(); else{draw(); if(G.state==='ending'&&G.ending) drawFirstSnow();}
  musicTick();
  if(G.shakeAmt>0.3){cv.style.transform=`translate(${(Math.random()-0.5)*G.shakeAmt}px,${(Math.random()-0.5)*G.shakeAmt}px)`; G.shakeAmt*=Math.exp(-9*dt);}
  else if(G.shakeAmt){G.shakeAmt=0; cv.style.transform='';}
  requestAnimationFrame(frame);
}
