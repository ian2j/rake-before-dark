// The daily lawn: one seeded town and weekday per date.
import {G} from './state.js';
import {LEVELS} from '../data/levels.js';

export function dailyInfo(date=new Date()){
  const y=date.getFullYear(), m=date.getMonth(), d=date.getDate(), n=Math.floor(Date.UTC(y,m,d)/864e5), ids=Object.keys(LEVELS), wd=date.getDay();
  return {key:`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,id:ids[n%ids.length],day:wd>=1&&wd<=5?wd:5,seed:Math.imul(n,2654435761)>>>0};
}

const STATE_ABBR={Vermont:'VT','New Hampshire':'NH',Maine:'ME',Massachusetts:'MA',Connecticut:'CT','Rhode Island':'RI'};
export const SHARE_URL='https://ian2j.github.io/rake-before-dark/';

// The result people paste into a chat: one leaf per star, the score, and anything notable about the evening.
export function shareText(r){
  const date=new Date(`${r.key}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const lines=[`Rake Before Dark 🍂 Daily · ${date}`,`${r.town}, ${STATE_ABBR[r.state]||r.state} · ${r.dayName}`,
    `${'🍂'.repeat(r.stars)}${'▫️'.repeat(3-r.stars)} ${r.pct}% clear · ${r.score.toLocaleString('en-US')} pts`];
  if(r.early) lines.push(`☀️ Beat the sun by ${r.minsLeft} min`);
  if(r.dale) lines.push(r.dale.won?`🏁 Beat Dale ${r.dale.you}–${r.dale.him}`:`🏁 Dale won ${r.dale.him}–${r.dale.you}`);
  if(r.finds) lines.push(`🔎 ${r.finds} ${r.finds===1?'find':'finds'}`);
  if(r.streak>1) lines.push(`🔥 ${r.streak}-day streak`);
  lines.push(SHARE_URL);
  return lines.join('\n');
}

export function dailyStreak(){
  let n=0;
  for(let i=0;i<400;i++){if(G.store.dailyLog[dailyInfo(new Date(Date.now()-i*864e5)).key]) n++; else if(i>0) break;}
  return n;
}
