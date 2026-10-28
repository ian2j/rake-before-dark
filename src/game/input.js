// Pointer, keyboard and window events.
import {G} from './state.js';
import {initAudio} from './audio.js';
import {releaseBag} from './boss.js';
import {cv} from './canvas.js';
import {layout} from './lawn.js';
import {saveRound} from './round.js';
import {pause, resume} from './screens.js';
import {smDown, smMove} from './snowman.js';
import {tossDown, tossMove, tossUp} from './toss.js';

// ---------- Input
export function pos(e){return [e.clientX,e.clientY];}

export const lift=e=>{
  if(G.state==='toss'){tossUp(e.pointerId); return;}
  if(G.state==='ending'&&G.SM){G.SM.grab=null; return;}
  if(G.grab&&e.pointerId===G.grab.id){releaseBag(); return;}
  if(e.pointerId===G.pid){G.drag=false; G.pid=null; if(e.pointerType!=='mouse') G.showRake=false;}};

// Wires up pointer, keyboard, visibility and resize events.
export function bindInput(){
  cv.addEventListener('pointerdown',e=>{
    if(G.state==='toss'){initAudio(); tossDown(...pos(e),e.pointerId); try{cv.setPointerCapture(e.pointerId);}catch(_){} return;}
    if(G.state==='ending'&&G.ending&&G.ending.sub==='snowman'){initAudio(); smDown(...pos(e)); try{cv.setPointerCapture(e.pointerId);}catch(_){} return;}
    if(G.state==='play'&&G.TH&&!G.grab){
      const [x,y]=pos(e), b=G.TH.bags.find(o=>Math.hypot(o.x-x,o.y-y)<34*G.K);
      if(b){G.grab={b,id:e.pointerId,pts:[[x,y,performance.now()]]}; try{cv.setPointerCapture(e.pointerId);}catch(_){} return;}
    }
    if(G.state!=='play'||G.drag) return;
    G.drag=true; G.pid=e.pointerId; G.showRake=true; G.lastCarried=0;
    try{cv.setPointerCapture(e.pointerId);}catch(_){}
    [G.rx,G.ry]=pos(e); G.px=G.rx; G.py=G.ry;
  });
  cv.addEventListener('pointermove',e=>{
    if(G.state==='toss'){tossMove(...pos(e),e.pointerId); return;}
    if(G.state==='ending'&&G.ending&&G.ending.sub==='snowman'){smMove(...pos(e)); return;}
    if(G.grab&&e.pointerId===G.grab.id){const [x,y]=pos(e); G.grab.b.x=x; G.grab.b.y=y; G.grab.pts.push([x,y,performance.now()]); if(G.grab.pts.length>8) G.grab.pts.shift(); return;}
    if(G.drag&&e.pointerId!==G.pid) return;
    [G.rx,G.ry]=pos(e);
    if(!G.drag){G.px=G.rx; G.py=G.ry; G.showRake=e.pointerType==='mouse';}
  });
  cv.addEventListener('pointerup',lift);
  cv.addEventListener('pointercancel',lift);
  cv.addEventListener('pointerleave',e=>{if(!G.drag&&e.pointerType==='mouse') G.showRake=false;});
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('visibilitychange',()=>{if(document.hidden) pause();});
  addEventListener('pagehide',saveRound);
  addEventListener('keydown',e=>{if(e.key==='Escape'){if(G.state==='play') pause(); else if(G.state==='paused') resume();}});
  addEventListener('resize',()=>{clearTimeout(G.resizeTimer); G.resizeTimer=setTimeout(layout,120);});
}
