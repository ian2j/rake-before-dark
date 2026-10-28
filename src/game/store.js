// Saved progress in localStorage: options, bests, unlocks, the shed, and an interrupted round.
import {G} from './state.js';
import {DIFFS, LEVELS} from '../data/levels.js';

export const weekDone=id=>Object.keys(DIFFS).some(d=>(G.store.best[`${id}:d5:${d}`]?.stars||0)>=1);

export const totalStars=()=>Object.keys(LEVELS).reduce((t,id)=>t+[1,2,3,4,5].reduce((u,d)=>u+Math.max(0,...Object.keys(DIFFS).map(df=>G.store.best[`${id}:d${d}:${df}`]?.stars||0)),0),0);

// The moose opens halfway (three weeks), the storm after all six, the moonlit lawn at 90 stars.
export const specialOpen=id=>!!G.store.playtest||(id==='ne'?Object.keys(LEVELS).every(weekDone):id==='mo'?Object.keys(LEVELS).filter(weekDone).length>=3:id==='nt'?totalStars()>=90:false);

export const bossOpen=()=>specialOpen('ne');

// Saved per viewer: options, best score and stars per town, day and difficulty, days unlocked, the finds shelf,
// the shed (leaves to spend, lifetime total, upgrades, cosmetics), and an interrupted round.
export const KEY='rake-before-dark:v1', ROUND_KEY='rake-before-dark:round';

export const blankStore=()=>({best:{},finds:{},unlocked:{},bank:0,total:0,up:{},owned:['blue','ash'],cos:{tarp:'blue',rake:'ash'},stats:{},ach:{},dale:[],dailyLog:{},opts:{diff:'standard',muted:false,vibrate:true,last:'vt'}});

export const U=k=>G.store.up[k]||0;

export function save(){try{localStorage.setItem(KEY,JSON.stringify(G.store));}catch(_){}}

export function loadRound(){try{return JSON.parse(localStorage.getItem(ROUND_KEY));}catch(_){return null;}}

export function clearRound(){try{localStorage.removeItem(ROUND_KEY);}catch(_){}}

// Loads saved progress, migrating older saves (one best per town, then per town and difficulty) to Monday’s.
export function loadStore(){
  try{const s=JSON.parse(localStorage.getItem(KEY)); if(s&&s.best&&s.finds){const b=blankStore(); G.store={...b,...s,cos:{...b.cos,...(s.cos||{})},opts:{...b.opts,...(s.opts||{})}};}}catch(_){}
  for(const id of Object.keys(LEVELS)){
    if(G.store.best[id]){G.store.best[id+':standard']??=G.store.best[id]; delete G.store.best[id];}
    for(const d of Object.keys(DIFFS)){const k=`${id}:${d}`; if(G.store.best[k]){G.store.best[`${id}:d1:${d}`]??=G.store.best[k]; delete G.store.best[k];}}
  }
}
