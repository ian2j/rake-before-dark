// Screen shake, vibration, stats and achievements.
import {G} from './state.js';
import {ACH} from '../data/levels.js';
import {save} from './store.js';
import {$, reduceMotion} from '../lib/util.js';

// ---------- Polish: screen shake, phone vibration, achievements.
export const shake=px=>{if(!reduceMotion) G.shakeAmt=Math.max(G.shakeAmt,px);};

export function buzz(pattern){if(G.store.opts.vibrate===false) return; try{navigator.vibrate&&navigator.vibrate(pattern);}catch(_){}}

export function stat(k,n=1){G.store.stats[k]=(G.store.stats[k]||0)+n; if(k==='shoo'&&G.store.stats.shoo>=25) award('shoo');}

export function award(id){
  if(G.store.ach[id]) return;
  G.store.ach[id]=Date.now(); save();
  const el=$('toast'); el.textContent=`Achievement: ${ACH[id].name}`; el.hidden=false;
  clearTimeout(G.toastT); G.toastT=setTimeout(()=>{el.hidden=true;},2800);
  buzz(30);
}
