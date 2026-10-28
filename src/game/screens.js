// Menus and overlays: title, map, place cards, shed, options, pause, and starting rounds.
import {G} from './state.js';
import {ACH, BOSS, COMPOST, DAY_DESC, DAY_NAMES, DIFFS, LEVELS, MOOSE, PLACES, RAKES, SPECIAL, TARPS, UPGRADES, VAC_PRICE} from '../data/levels.js';
import {MAP} from '../data/map.js';
import {audioTick, initAudio} from './audio.js';
import {dailyInfo, dailyStreak} from './daily.js';
import {buzz} from './polish.js';
import {SECS, reset, restoreRound, saveRound} from './round.js';
import {startSnowman} from './snowman.js';
import {U, blankStore, bossOpen, clearRound, loadRound, save, specialOpen, totalStars, weekDone} from './store.js';
import {endToss, startToss} from './toss.js';
import {vacAvailable, vacOn} from './vacuum.js';
import {sunTimes} from '../lib/sun.js';
import {$, esc, fmtTime, num, withSeed} from '../lib/util.js';

export function beginDaily(){
  initAudio();
  const d=dailyInfo(); G.DAILY=d; G.selected=d.id; G.DAY=d.day;
  withSeed(d.seed,reset); G.state='play'; show(null); pushTrap(); syncTool();
}

// ---------- Screens
export const OVERLAYS=['title','mapScreen','options','pause','end','shed','credits','thanks'];

export function show(id){for(const o of OVERLAYS) $(o).hidden=o!==id; $('hud').style.visibility=(id===null&&G.state!=='ending')||id==='pause'||id==='end'?'visible':'hidden';}

export function renderTitle(){
  const now=new Date();
  $('datelabel').textContent=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const r=loadRound();
  $('contBtn').hidden=!(r&&LEVELS[r.lvl]);
  if(r&&LEVELS[r.lvl]) $('contInfo').textContent=`${LEVELS[r.lvl].town} ${DAY_NAMES[(r.day||1)-1]} · ${fmtTime.format(r.clock)} · ${num(r.score)} pts`;
  $('shedInfo').textContent=`${num(G.store.bank)} leaves to spend`;
  $('tossInfo').textContent=G.store.tossBest?`best ${num(G.store.tossBest)}`:'a fair game of cornhole with leaf bags';
  const di=dailyInfo(), db=G.store.best[`daily:${di.key}`], streak=dailyStreak();
  $('dailyInfo').textContent=`${LEVELS[di.id].town} · ${DAY_NAMES[di.day-1]} · ${db?`best ${num(db.score)}`:'not raked yet'}${streak>1?` · ${streak}-day streak`:''}`;
}

export function renderMap(){
  $('diffTag').textContent=`${DIFFS[G.store.opts.diff].name} difficulty`;
  const svg=$('mapSvg');
  svg.setAttribute('class',G.store.beatBoss?'winter':'');
  const open=bossOpen();
  svg.innerHTML=MAP.states.map(s=>`<path class="st" d="${s.d}"/>`).join('')
    +Object.entries(MAP.labels).map(([k,[x,y]])=>`<text class="lab" x="${k==='NH'?x-6:k==='ME'?x+12:k==='RI'?x-3:x}" y="${k==='NH'?y+22:k==='RI'?y-14:k==='ME'?y+30:y}" text-anchor="middle">${k}</text>`).join('')
    +PLACES.map(p=>{const [x,y]=MAP.pts[p.id], cls=['dot',p.level?'':'soon',p.id===G.mapSel?'sel':''].join(' ');
      return `<g class="${cls}" data-id="${p.id}" tabindex="0" role="button" aria-pressed="${p.id===G.mapSel}" aria-label="${esc(p.town+', '+p.state+(p.level?'':' (coming soon)'))}" transform="translate(${x} ${y})"><circle class="halo" r="12"/><circle r="5.5"/></g>`;}).join('')
    +`<g class="dot boss ${specialOpen('mo')?'':'soon'} ${G.mapSel==='mo'?'sel':''}" data-id="mo" tabindex="0" role="button" aria-pressed="${G.mapSel==='mo'}" aria-label="The Greenville moose${specialOpen('mo')?'':' (locked)'}" transform="translate(180.6 114.7)"><circle class="halo" r="12"/><circle r="6"/><text x="0" y="-12" text-anchor="middle" class="lab">MOOSE</text></g>`
    +`<g class="dot boss ${open?'':'soon'} ${G.mapSel==='ne'?'sel':''}" data-id="ne" tabindex="0" role="button" aria-pressed="${G.mapSel==='ne'}" aria-label="The Nor’easter${open?'':' (locked)'}" transform="translate(214 262)"><circle class="halo" r="14"/><circle r="7"/><text x="0" y="24" text-anchor="middle" class="lab">STORM</text></g>`;
  for(const g of svg.querySelectorAll('.dot')){
    const pick=()=>{G.mapSel=g.dataset.id; if(LEVELS[G.mapSel]){G.selected=G.mapSel; G.DAY=G.mapDay=G.store.unlocked[G.mapSel]||1; reset();} else if(SPECIAL[G.mapSel]&&specialOpen(G.mapSel)){G.selected=G.mapSel; G.DAY=1; reset();} renderMap(); svg.querySelector(`[data-id="${G.mapSel}"]`).focus();};
    g.addEventListener('click',pick);
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); pick();}});
  }
  renderPlace();
}

export function renderPlace(){
  if(G.mapSel==='ne') return renderStormPlace();
  if(G.mapSel==='mo') return renderMoosePlace();
  const p=PLACES.find(q=>q.id===G.mapSel);
  let h=`<div><p class="eyebrow">${esc(p.state)}</p><h2>${esc(p.town)}</h2></div>`;
  if(p.level){
    const un=G.store.unlocked[p.id]||1, diff=G.store.opts.diff, best=d=>G.store.best[`${p.id}:d${d}:${diff}`];
    const weekStars=[1,2,3,4,5].reduce((t,d)=>t+(best(d)?.stars||0),0);
    const s=sunTimes(new Date(Date.now()+(G.mapDay-1)*864e5),p.lat,p.lon), b=best(G.mapDay);
    h+=`<p>${esc(p.desc)}</p>`;
    if(G.store.beatBoss) h+=`<p class="tip">Under snow until next fall. Your autumn lawns are still here to replay.</p>`;
    h+=`<p class="label">This week · ★ ${weekStars} of 15</p><div class="days" role="group" aria-label="Days">`
      +[1,2,3,4,5].map(d=>{const bd=best(d), locked=d>un;
        return `<button class="day" type="button" data-day="${d}" aria-pressed="${d===G.mapDay}" ${locked?'disabled':''} aria-label="${DAY_NAMES[d-1]}${locked?', locked':bd?`, ${bd.stars} stars`:''}"><span>${DAY_NAMES[d-1].slice(0,3)}</span><b>${locked?'locked':bd?'★'.repeat(bd.stars)+'☆'.repeat(3-bd.stars):'new'}</b></button>`;}).join('')+'</div>';
    h+=`<p class="daydesc"><strong>${DAY_NAMES[G.mapDay-1]}:</strong> ${esc(DAY_DESC[p.id][G.mapDay-1])}${G.mapDay===4?' And Dale from next door is racing you: bag more than he does by dusk.':''}</p>`;
    h+=`<p class="meta">Sunset ${fmtTime.format(s.sunset)} · ${b?`best ${num(b.score)}`:'Not raked yet'}</p>`;
    h+=`<div class="actions"><button class="primary" id="playLvl" type="button">Rake ${DAY_NAMES[G.mapDay-1]}</button>${p.id==='vt'&&specialOpen('nt')?'<button class="secondary" id="nightBtn" type="button">Rake by moonlight</button>':''}</div>`;
    h+=`<p class="label">About ${esc(p.town)}</p><ul class="facts">${p.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`;
    const got=new Set(G.store.finds[p.id]||[]);
    h+=`<p class="label">Finds · ${got.size} of ${p.finds.length}</p><ul class="findlist">`
      +p.finds.map(f=>got.has(f.id)?`<li><span>${f.e}</span><div><strong>${esc(f.name)}</strong><small>${esc(f.fact)}</small></div></li>`
        :`<li class="missing"><span>?</span><div><strong>Not found yet</strong><small>Hidden somewhere under the leaves.</small></div></li>`).join('')+'</ul>';
  }else{
    h+=`<p class="meta">Coming soon</p><p>${esc(p.soon)}</p><p class="label">About ${esc(p.town)}</p><ul class="facts">${p.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`;
  }
  $('place').innerHTML=h;
  if(!p.level) return;
  $('playLvl').addEventListener('click',begin);
  if($('place').querySelector('#nightBtn')) $('nightBtn').addEventListener('click',()=>{G.mapSel='nt'; begin();});
  for(const btn of $('place').querySelectorAll('.day')) btn.addEventListener('click',()=>{
    G.mapDay=G.DAY=+btn.dataset.day; reset(); renderPlace();
    $('place').querySelector(`[data-day="${G.mapDay}"]`).focus();
  });
}

export function renderMoosePlace(){
  const open=specialOpen('mo'), b=G.store.best[`mo:d1:${G.store.opts.diff}`];
  let h=`<div><p class="eyebrow">${MOOSE.state}</p><h2>The ${MOOSE.town} moose</h2></div><p>${esc(MOOSE.desc)}</p>`;
  if(!open){
    h+=`<p class="meta">Finish three weeks to meet the moose · ${Object.keys(LEVELS).filter(weekDone).length} of 3</p>`;
  }else{
    h+=`<p class="meta">${b?`${'★'.repeat(b.stars)}${'☆'.repeat(3-b.stars)} best ${num(b.score)}`:'Not raked yet'}</p><div class="actions"><button class="primary" id="playLvl" type="button">Rake with the moose</button></div>`;
  }
  h+=`<p class="label">About ${MOOSE.town}</p><ul class="facts">${MOOSE.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`;
  $('place').innerHTML=h;
  if(open) $('playLvl').addEventListener('click',begin);
}

export function renderStormPlace(){
  const open=bossOpen();
  let h=`<div><p class="eyebrow">${BOSS.state}</p><h2>${BOSS.town}</h2></div><p>${esc(BOSS.desc)}</p>`;
  if(!open){
    h+=`<p class="meta">Finish all six weeks to face the storm · ${Object.keys(LEVELS).filter(weekDone).length} of 6</p><ul class="facts">`
      +Object.values(LEVELS).map(l=>`<li>${weekDone(l.id)?'✓':'·'} ${l.town}, ${l.state}</li>`).join('')+'</ul>';
  }else{
    h+=`<div class="actions"><button class="primary" id="playLvl" type="button">${G.store.beatBoss?'Face the storm again':'Face the storm'}</button>${G.store.beatBoss?'<button class="secondary" id="snowDay" type="button">Build a snowman</button>':''}</div>`;
  }
  h+=`<p class="label">About nor’easters</p><ul class="facts">${BOSS.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`;
  $('place').innerHTML=h;
  if(open) $('playLvl').addEventListener('click',begin);
  if(open&&G.store.beatBoss) $('snowDay').addEventListener('click',startSnowman);
}

// ---------- The shed
export function renderShed(){
  $('bank').textContent=num(G.store.bank);
  $('lifetime').textContent=`${num(G.store.total)} raked all time`;
  $('ups').innerHTML=Object.entries(UPGRADES).map(([k,u])=>{
    const lv=U(k), cost=u.cost[lv], max=lv>=u.cost.length;
    return `<div class="up"><strong>${u.name} <span class="pips" aria-label="level ${lv} of ${u.cost.length}">${'●'.repeat(lv)}${'○'.repeat(u.cost.length-lv)}</span></strong>
      <button class="buy" type="button" data-up="${k}" ${max||G.store.bank<cost?'disabled':''}>${max?'Maxed':`Buy · ${num(cost)}`}</button><small>${u.desc}</small></div>`;
  }).join('');
  const swatches=(set,slot,color)=>Object.entries(set).map(([k,c])=>{
    const owned=G.store.owned.includes(k)||(c.milestone&&G.store.total>=c.milestone)||(c.prize&&totalStars()>=c.prize), on=G.store.cos[slot]===k;
    const label=on?'In use':owned?'Use':c.milestone?`at ${num(c.milestone)} raked`:c.prize?`for ${c.prize} stars`:num(c.price);
    const off=!owned&&(c.milestone||c.prize||G.store.bank<c.price);
    return `<button class="swatch" type="button" data-slot="${slot}" data-id="${k}" aria-pressed="${on}" ${off?'disabled':''}><i style="background:${color(c)}"></i>${c.name} <small>${label}</small></button>`;
  }).join('');
  const vacOwned=G.store.owned.includes('vacuum');
  $('tools').innerHTML=`<div class="up"><strong>Leaf vacuum</strong><button class="buy" type="button" id="buyVac" ${vacOwned||G.store.bank<VAC_PRICE?'disabled':''}>${vacOwned?'Owned':`Buy · ${num(VAC_PRICE)}`}</button><small>Hold your finger down to pull in leaves within reach. Leaves go straight into the bag, no raking needed. No pile bonuses. Free on Relaxed.</small></div>`;
  $('buyVac').addEventListener('click',()=>{if(vacOwned||G.store.bank<VAC_PRICE) return; G.store.bank-=VAC_PRICE; G.store.owned.push('vacuum'); G.store.opts.tool='vac'; save(); renderShed();});
  $('tarps').innerHTML=swatches(TARPS,'tarp',c=>c.milestone?`repeating-linear-gradient(90deg,${c.fill} 0 6px,${c.edge} 6px 12px)`:c.fill);
  $('rakes').innerHTML=swatches(RAKES,'rake',c=>c.c);
  const top=COMPOST[COMPOST.length-1][0];
  $('compostFill').style.width=Math.min(100,100*G.store.total/top)+'%';
  $('milestones').innerHTML=COMPOST.map(([n,t])=>`<li class="${G.store.total>=n?'done':''}"><b>${num(n)}</b> ${G.store.total>=n?'✓':'·'} ${t}</li>`).join('');
  $('shelf').innerHTML=Object.values(LEVELS).map(l=>{
    const got=new Set(G.store.finds[l.id]||[]);
    return `<div class="shelfrow"><p>${l.state} · ${got.size} of ${l.finds.length}</p><div class="plank">`
      +l.finds.map(f=>got.has(f.id)?`<button class="slot" type="button" data-fact="${esc(f.name+': '+f.fact)}" aria-label="${esc(f.name)}">${f.e}</button>`:`<button class="slot" type="button" disabled aria-label="Not found yet">?</button>`).join('')+'</div></div>';
  }).join('');
  for(const b of $('ups').querySelectorAll('.buy')) b.addEventListener('click',()=>{
    const k=b.dataset.up, cost=UPGRADES[k].cost[U(k)];
    if(cost===undefined||G.store.bank<cost) return;
    G.store.bank-=cost; G.store.up[k]=U(k)+1; save(); renderShed();
    $('ups').querySelector(`[data-up="${k}"]`)?.focus();
  });
  for(const b of document.querySelectorAll('#tarps .swatch,#rakes .swatch')) b.addEventListener('click',()=>{
    const {slot,id}=b.dataset, set=slot==='tarp'?TARPS:RAKES, c=set[id];
    if(!G.store.owned.includes(id)&&!(c.milestone&&G.store.total>=c.milestone)&&!(c.prize&&totalStars()>=c.prize)){
      if(c.milestone||c.prize||G.store.bank<c.price) return;
      G.store.bank-=c.price; G.store.owned.push(id);
    }
    G.store.cos[slot]=id; save(); renderShed();
    document.querySelector(`#${slot==='tarp'?'tarps':'rakes'} [data-id="${id}"]`)?.focus();
  });
  const got=Object.keys(ACH).filter(k=>G.store.ach[k]).length;
  $('achLabel').textContent=`Achievements · ${got} of ${Object.keys(ACH).length}`;
  $('achs').innerHTML=Object.entries(ACH).map(([k,a])=>`<li class="${G.store.ach[k]?'got':''}"><span>${G.store.ach[k]?'✓':'·'}</span><div><b>${a.name}</b>${a.desc}</div></li>`).join('');
  if(G.store.finds.winter) $('shelf').insertAdjacentHTML('beforeend',`<div class="shelfrow"><p>Winter · 1 of 1</p><div class="plank"><button class="slot" type="button" data-fact="The last leaf of fall: found frozen in the snow on the first day of winter." aria-label="The last leaf of fall">🍁</button></div></div>`);
  for(const b of $('shelf').querySelectorAll('.slot:not(:disabled)')) b.addEventListener('click',()=>{$('shelfFact').textContent=b.dataset.fact;});
}

export function renderOptions(){
  $('diffOpts').innerHTML=Object.entries(DIFFS).map(([k,d])=>`<label><input type="radio" name="diff" id="diff-${k}" value="${k}" ${k===G.store.opts.diff?'checked':''}><span>${d.name}</span></label>`).join('');
  for(const r of $('diffOpts').querySelectorAll('input')) r.addEventListener('change',()=>{G.store.opts.diff=r.value; save(); G.D=DIFFS[r.value]; $('diffDesc').textContent=G.D.desc;});
  $('diffDesc').textContent=DIFFS[G.store.opts.diff].desc;
  $('soundOpt').checked=!G.store.opts.muted;
  $('resetAsk').hidden=true; $('resetDone').hidden=true; $('resetBtn').hidden=false;
  $('vibOpt').checked=G.store.opts.vibrate!==false;
  $('testAsk').hidden=true; $('testDone').hidden=true; $('testBtn').hidden=false;
}

export function goTitle(){G.state='title'; renderTitle(); show('title'); $('playBtn').focus();}

export function goMap(){G.DAILY=null; G.TOSS=null; if(!LEVELS[G.selected]&&G.selected!=='ne'&&G.selected!=='mo') G.selected='vt'; G.state='map'; G.mapSel=G.selected; G.DAY=G.mapDay=Math.min(G.DAY,G.store.unlocked[G.selected]||1); reset(); renderMap(); show('mapScreen');}

// A history entry during play turns the phone's back gesture into Pause instead of leaving the page.
export function pushTrap(){if(G.trapped) return; try{history.pushState({rake:1},''); G.trapped=true;}catch(_){}}

export function leaveTrap(){if(!G.trapped) return; G.trapped=false; G.ignorePop=true; try{history.back();}catch(_){G.ignorePop=false;}}

export function syncTool(){const ok=vacAvailable(); $('toolBtn').hidden=!ok; if(!ok) G.store.opts.tool='rake'; $('toolBtn').textContent=vacOn()?'Vacuum':'Rake'; $('toolBtn').setAttribute('aria-label',`Tool: ${vacOn()?'leaf vacuum':'rake'}. Tap to switch.`);}

export function begin(){
  initAudio();
  G.DAILY=null;
  if(LEVELS[G.mapSel]){G.selected=G.mapSel; G.DAY=G.mapDay;} else if(SPECIAL[G.mapSel]&&specialOpen(G.mapSel)){G.selected=G.mapSel; G.DAY=1;}
  G.store.opts.last=G.selected; save();
  clearRound(); reset(); G.state='play'; show(null); pushTrap(); syncTool();
}

export function pause(){
  if(G.state!=='play'&&G.state!=='paused') return;
  G.drag=false; G.pid=null; G.showRake=false; G.state='paused';
  saveRound();
  $('pauseWhere').textContent=`${G.LV.town}, ${G.LV.state} · ${DAY_NAMES[G.DAY-1]} · ${fmtTime.format(G.T0+(G.T1-G.T0)*Math.min(G.elapsed/SECS(),1))}`;
  $('soundPause').checked=!G.store.opts.muted;
  show('pause'); $('resumeBtn').focus(); audioTick();
}

export function resume(){initAudio(); syncTool(); G.state='play'; G.last=performance.now(); show(null); pushTrap();}

export function setMuted(m){G.store.opts.muted=m; save(); audioTick();}

// Wires up the buttons and the back-gesture trap.
// Phones get the share sheet; elsewhere the result is copied. If neither is allowed, the text is selected to copy by hand.
async function shareResult(){
  const text=G.shareText;
  if(navigator.share&&matchMedia('(pointer: coarse)').matches){
    try{await navigator.share({text}); $('shareStatus').textContent='Shared'; return;}
    catch(e){if(e&&e.name==='AbortError') return;}
  }
  try{await navigator.clipboard.writeText(text); $('shareBtn').textContent='Copied'; $('shareStatus').textContent='Paste it anywhere.';}
  catch(_){
    const r=document.createRange(); r.selectNodeContents($('shareText'));
    const sel=getSelection(); sel.removeAllRanges(); sel.addRange(r);
    $('shareStatus').textContent='Selected. Copy it to share.';
  }
}

export function bindUi(){
  $('shareBtn').addEventListener('click',shareResult);
  addEventListener('popstate',()=>{
    if(G.ignorePop){G.ignorePop=false; return;}
    G.trapped=false;
    if(G.state==='play'||G.state==='paused'){pause(); pushTrap();}
    else if(G.state==='toss') endToss(true);
  });
  $('playBtn').addEventListener('click',()=>{G.DAY=G.store.unlocked[G.selected]||1; goMap();});
  $('optBtn').addEventListener('click',()=>{G.state='options'; renderOptions(); show('options');});
  $('contBtn').addEventListener('click',()=>{const r=loadRound(); if(!r) return renderTitle(); restoreRound(r); G.state='paused'; pause(); pushTrap();});
  $('mapBack').addEventListener('click',goTitle);
  $('optBack').addEventListener('click',goTitle);
  $('pauseBtn').addEventListener('click',pause);
  $('resumeBtn').addEventListener('click',resume);
  $('restartBtn').addEventListener('click',()=>{if(G.DAILY) return beginDaily(); G.mapSel=G.selected; G.mapDay=G.DAY; begin();});
  $('quitBtn').addEventListener('click',()=>{clearRound(); leaveTrap(); goMap();});
  $('again').addEventListener('click',()=>{if(G.TOSS) return startToss(); if(G.DAILY) return beginDaily(); G.mapSel=G.selected; G.mapDay=G.DAY; begin();});
  $('nextDay').addEventListener('click',()=>{G.mapSel=G.selected; G.mapDay=Math.min(5,G.DAY+1); begin();});
  $('dailyBtn').addEventListener('click',beginDaily);
  $('toolBtn').addEventListener('click',()=>{G.store.opts.tool=vacOn()?'rake':'vac'; save(); syncTool();});
  $('tossBtn').addEventListener('click',startToss);
  $('tossQuit').addEventListener('click',()=>endToss(true));
  $('shedBtn').addEventListener('click',()=>{G.state='shed'; renderShed(); show('shed'); $('shedBack').focus();});
  $('shedBack').addEventListener('click',goTitle);
  $('toMap').addEventListener('click',()=>{if(G.TOSS){G.TOSS=null; return goTitle();} goMap();});
  $('resetBtn').addEventListener('click',()=>{$('resetAsk').hidden=false; $('resetBtn').hidden=true; $('resetNo').focus();});
  $('resetNo').addEventListener('click',()=>{$('resetAsk').hidden=true; $('resetBtn').hidden=false;});
  $('resetYes').addEventListener('click',()=>{G.store={...blankStore(),opts:G.store.opts}; save(); clearRound(); $('resetAsk').hidden=true; $('resetDone').hidden=false; $('resetBtn').hidden=false;});
  $('soundOpt').addEventListener('change',e=>setMuted(!e.target.checked));
  $('vibOpt').addEventListener('change',e=>{G.store.opts.vibrate=e.target.checked; save(); buzz(30);});
  $('testBtn').addEventListener('click',()=>{$('testAsk').hidden=false; $('testBtn').hidden=true; $('testNo').focus();});
  $('testNo').addEventListener('click',()=>{$('testAsk').hidden=true; $('testBtn').hidden=false;});
  $('testYes').addEventListener('click',()=>{for(const id of Object.keys(LEVELS)) G.store.unlocked[id]=5; G.store.playtest=true; save(); $('testAsk').hidden=true; $('testDone').hidden=false; $('testBtn').hidden=false;});
  $('skipCredits').addEventListener('click',startSnowman);
  $('roll').addEventListener('animationend',()=>{if(G.state==='ending'&&G.ending.sub==='credits') startSnowman();});
  $('thanksMap').addEventListener('click',()=>{G.ending=null; G.DAY=G.store.unlocked[G.selected]||1; goMap();});
  $('thanksAgain').addEventListener('click',startSnowman);
  $('soundPause').addEventListener('change',e=>setMuted(!e.target.checked));
}
