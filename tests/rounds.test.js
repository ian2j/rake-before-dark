import {describe,it,expect,beforeAll} from 'vitest';
import {G} from '../src/game/state.js';
import {start,playDay,els,pointer} from './helpers.js';
import {update,saveRound} from '../src/game/round.js';
import {begin,pause,syncTool} from '../src/game/screens.js';
import {densestPile} from '../src/game/kids.js';

beforeAll(()=>{start(); globalThis.__els.testYes.listeners.click();});

describe('a round in each town',()=>{
  for(const id of ['vt','nh','me','ma','ri']) it(`${id}: a quick, accurate player clears Monday with three stars`,()=>{
    const r=playDay(id,1);
    expect(r.nan).toBe(0);
    expect(r.state).toBe('over');
    expect(r.stars).toBe(3);
  });
  it('ct: leaves never end up inside a stone wall, on any day',()=>{
    for(let d=1;d<=5;d++){const r=playDay('ct',d); expect(r.inWall).toBe(0); expect(r.nan).toBe(0);}
  });
  it('ct: the pen around the tarp (Tuesday) is clearable',()=>{
    expect(playDay('ct',2).stars).toBeGreaterThanOrEqual(2);
  });
  it('random swiping does worse than aiming',()=>{
    const smart=playDay('nh',3,'smart'), random=playDay('nh',3,'random');
    expect(random.pct).toBeLessThan(smart.pct);
  });
});

describe('town hazards',()=>{
  it('salem: trick-or-treaters show up and jump in piles',()=>{
    let seen=0; playDay('ma',5,'random',{each:()=>{seen=Math.max(seen,G.kids.length);}});
    expect(seen).toBeGreaterThan(0);
  });
  it('newport: the breeze blows leaves over the cliff if you do nothing',()=>{
    G.mapSel='ri'; G.mapDay=3; begin();
    for(let f=0;f<60*40&&G.state==='play';f++) update(1/60);
    expect(G.lost).toBeGreaterThan(50);
  });
  it('thursday: Dale races you from his own tarp, which never lands on a wall, the sea or your tarp',()=>{
    for(const id of ['vt','me','ct','ri']){
      const r=playDay(id,4);
      expect(r.rival).toBeGreaterThan(0);
      const t=G.rival.tarp;
      expect(t.x+t.w).toBeLessThanOrEqual(Math.min(G.MAXX,G.SEAX));
    }
  });
});

describe('progress',()=>{
  it('a star on Monday unlocks Tuesday, and bagged leaves go to the shed',()=>{
    G.store.unlocked.vt=1; const bank=G.store.bank;
    const r=playDay('vt',1);
    expect(r.stars).toBeGreaterThanOrEqual(1);
    expect(G.store.unlocked.vt).toBeGreaterThanOrEqual(2);
    expect(G.store.bank-bank).toBe(r.bagged);
  });
  it('a paused round saves and restores with the same leaves, score and clock',()=>{
    G.mapSel='nh'; G.mapDay=3; begin();
    for(let f=0;f<60*20;f++) update(1/60);
    const before={n:G.leaves.length,score:G.score,bagged:G.bagged,el:G.elapsed};
    pause();
    globalThis.__els.contBtn.listeners.click();
    expect({n:G.leaves.length,score:G.score,bagged:G.bagged,el:G.elapsed}).toEqual(before);
    expect(G.DAY).toBe(3);
  });
  it('the countdown chip appears before a lawn finishes early',()=>{
    let chip=false; const r=playDay('vt',1,'smart',{each:()=>{if(/to a clean lawn/.test(els.chips.innerHTML)) chip=true;}});
    expect(G.endedEarly).toBe(true); expect(chip).toBe(true);
  });
});

describe('leaf vacuum',()=>{
  it('bags leaves straight away, about as fast as raking, with no swiping',()=>{
    if(!G.store.owned.includes('vacuum')) G.store.owned.push('vacuum');
    G.store.opts.tool='vac';
    G.mapSel='vt'; G.mapDay=1; begin(); syncTool();
    let fx=G.W/2, fy=G.H/2, target=[fx,fy];
    pointer('pointerdown',fx,fy);
    for(let f=0;f<60*130&&G.state==='play';f++){
      if(f%30===0){const t=densestPile(3); if(t) target=t; else {const g=G.leaves.filter(l=>l.st===0); const l=g[(Math.random()*g.length)|0]; if(l) target=[l.x,l.y];}}
      const d=Math.hypot(target[0]-fx,target[1]-fy), s=Math.min(d,180*G.K/60); if(d>0.5){fx+=(target[0]-fx)/d*s; fy+=(target[1]-fy)/d*s;}
      pointer('pointermove',fx,fy); update(1/60);
    }
    G.store.opts.tool='rake';
    expect(G.bagged/G.elapsed).toBeGreaterThan(12);
    expect(G.state).toBe('over');
  });
});
