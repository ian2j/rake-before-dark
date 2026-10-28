import {describe,it,expect} from 'vitest';
import {sunTimes} from '../src/lib/sun.js';
import {LEVELS,DAY_DESC,DAY_NAMES,dayParams,levelOf,SPECIAL} from '../src/data/levels.js';
import {dailyInfo} from '../src/game/daily.js';
import {mulberry32} from '../src/lib/util.js';

const eastern=ms=>new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}).format(ms);

describe('sun',()=>{
  it('gives Stowe’s sunset and civil dusk for October 26, 2026',()=>{
    const s=sunTimes(new Date('2026-10-26T12:00:00'),44.4654,-72.6874);
    expect(eastern(s.sunset)).toBe('5:49 PM');
    expect(eastern(s.dusk)).toBe('6:19 PM');
  });
  it('puts sunset later in June than in December',()=>{
    const june=sunTimes(new Date('2026-06-21T12:00:00'),44.4654,-72.6874), dec=sunTimes(new Date('2026-12-21T12:00:00'),44.4654,-72.6874);
    expect(eastern(june.sunset)).toBe('8:38 PM');
    expect(eastern(dec.sunset)).toBe('4:13 PM');
  });
});

describe('towns and weeks',()=>{
  it('has six towns, each with three facts, five finds with facts, and five day descriptions',()=>{
    expect(Object.keys(LEVELS)).toHaveLength(6);
    for(const l of Object.values(LEVELS)){
      expect(l.facts).toHaveLength(3);
      expect(l.finds).toHaveLength(5);
      for(const f of l.finds) expect(f.fact.length).toBeGreaterThan(20);
      expect(DAY_DESC[l.id]).toHaveLength(DAY_NAMES.length);
    }
  });
  it('makes every later day bring more leaves, faster falls and stronger wind',()=>{
    for(const l of Object.values(LEVELS)) for(let d=2;d<=5;d++){
      const a=dayParams(l,d-1), b=dayParams(l,d);
      expect(b.leafMul).toBeGreaterThan(a.leafMul); expect(b.fall).toBeGreaterThan(a.fall); expect(b.wind).toBeGreaterThanOrEqual(a.wind);
    }
  });
  it('puts Dale on Thursdays only, and gives Kent five different wall layouts',()=>{
    for(let d=1;d<=5;d++) expect(dayParams(LEVELS.vt,d).rival).toBe(d===4);
    expect(new Set([1,2,3,4,5].map(d=>dayParams(LEVELS.ct,d).walls)).size).toBe(5);
  });
  it('finds special lawns by id',()=>{
    for(const id of Object.keys(SPECIAL)) expect(levelOf(id).special).toBe(true);
    expect(levelOf('nope')).toBe(null);
  });
});

describe('daily lawn',()=>{
  it('is the same for the same date and rotates through all six towns',()=>{
    const d=new Date('2026-10-29T15:00:00');
    expect(dailyInfo(d)).toEqual(dailyInfo(new Date('2026-10-29T08:00:00')));
    const towns=new Set(Array.from({length:6},(_,i)=>dailyInfo(new Date(d.getTime()+i*864e5)).id));
    expect(towns.size).toBe(6);
  });
  it('uses the real weekday, and Friday’s lawn on weekends',()=>{
    expect(dailyInfo(new Date('2026-10-29T12:00:00')).day).toBe(4);
    expect(dailyInfo(new Date('2026-10-31T12:00:00')).day).toBe(5);
  });
  it('seeds a repeatable random sequence',()=>{
    const a=mulberry32(42), b=mulberry32(42);
    expect([a(),a(),a()]).toEqual([b(),b(),b()]);
  });
});

import {shareText} from '../src/game/daily.js';
describe('share card',()=>{
  it('reads like a result people would paste, with only the lines that apply',()=>{
    const t=shareText({key:'2026-10-29',town:'Newport',state:'Rhode Island',dayName:'Thursday',stars:2,pct:88,score:41200,early:false,minsLeft:0,
      dale:{won:true,you:812,him:640},finds:1,streak:4});
    expect(t).toBe(['Rake Before Dark 🍂 Daily · Oct 29','Newport, RI · Thursday','🍂🍂▫️ 88% clear · 41,200 pts','🏁 Beat Dale 812–640','🔎 1 find','🔥 4-day streak','https://ian2j.github.io/rake-before-dark/'].join('\n'));
    const plain=shareText({key:'2026-10-30',town:'Stowe',state:'Vermont',dayName:'Friday',stars:3,pct:98,score:30000,early:true,minsLeft:12,dale:null,finds:0,streak:1});
    expect(plain.split('\n')).toEqual(['Rake Before Dark 🍂 Daily · Oct 30','Stowe, VT · Friday','🍂🍂🍂 98% clear · 30,000 pts','☀️ Beat the sun by 12 min','https://ian2j.github.io/rake-before-dark/']);
  });
});
