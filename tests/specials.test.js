import {describe,it,expect,beforeAll} from 'vitest';
import {G} from '../src/game/state.js';
import {start,botFrame,els} from './helpers.js';
import {update} from '../src/game/round.js';
import {begin,goMap,beginDaily} from '../src/game/screens.js';
import {launchBag} from '../src/game/boss.js';
import {updateEnding} from '../src/game/ending.js';
import {smDown,smMove,updateSnowman} from '../src/game/snowman.js';
import {startToss,tossDown,tossMove,tossUp,updateToss,tossNextBag,PULL_MAX,TOSS_RANGE,endToss} from '../src/game/toss.js';
import {winterView} from '../src/game/winter.js';
import {lerp} from '../src/lib/util.js';

beforeAll(()=>{start(); els.testYes.listeners.click();});

function playSpecial(id,throwAt,mode){
  G.mapSel=id; begin();
  for(let f=0;f<60*200&&G.state==='play';f++){
    botFrame(f,mode);
    const t=throwAt();
    if(t&&G.TH.bags.length&&f%20===0){const b=G.TH.bags[0]; launchBag(b,(t.x-b.x)*4,(t.y-b.y)*4);}
    update(1/60);
  }
}

describe('the Nor’easter and the ending',()=>{
  it('breaks after twelve hits, going through sleet and then fog and lightning',()=>{
    const phases=new Set();
    G.mapSel='ne'; begin();
    for(let f=0;f<60*200&&G.state==='play';f++){
      botFrame(f,'smart');
      if(G.TH.bags.length&&f%20===0){const b=G.TH.bags[0]; launchBag(b,(G.boss.x-b.x)*4,(G.boss.y-b.y)*4);}
      update(1/60); if(G.boss) phases.add(G.boss.phase);
    }
    expect(G.state).toBe('ending');
    expect([...phases].sort()).toEqual([1,2,3]);
    expect(G.store.beatBoss).toBe(true);
  });
  it('snows, rolls the credits, then builds a snowman that slides off the hill',()=>{
    for(let i=0;i<60*6;i++) updateEnding(1/60);
    expect(G.ending.sub).toBe('credits');
    expect(els.roll.innerHTML).toContain('leaves raked');
    els.skipCredits.listeners.click();
    expect(G.SM.stage).toBe('base');
    let x=G.SM.balls[0].x, y=G.SM.balls[0].y-G.SM.balls[0].r;
    const to=(tx,ty,n)=>{for(let i=1;i<=n;i++){smMove(lerp(x,tx,i/n),lerp(y,ty,i/n)); updateSnowman(1/60);} x=tx; y=ty;};
    smDown(x,y);
    for(let g=0;g<300&&G.SM.stage==='base';g++) to(G.W*(0.15+Math.random()*0.5),G.SM.HZ+(G.H-G.SM.HZ)*(0.3+Math.random()*0.6),12);
    for(const stage of ['middle','head']){
      for(let g=0;g<300&&G.SM.stage===stage&&!G.SM.balls[0]?.ready;g++){const b=G.SM.balls[0]; x=b.x; y=b.y-b.r; smDown(x,y); to(G.W*(0.15+Math.random()*0.5),G.SM.HZ+(G.H-G.SM.HZ)*(0.3+Math.random()*0.6),12);}
      if(G.SM.stage!==stage) continue;
      const b=G.SM.balls[0]; x=b.x; y=b.y-b.r; smDown(x,y); to(G.SM.stack.x,G.SM.stack.y-b.r,30); for(let i=0;i<30;i++) updateSnowman(1/60);
    }
    for(let i=0;i<60*3;i++) updateSnowman(1/60);
    expect(G.SM.stage).toBe('push');
    x=G.SM.stack.x; y=G.SM.stack.y; smDown(x,y); to(G.W*1.1,y,120);
    for(let i=0;i<60*5&&!G.SM.thanks;i++) updateSnowman(1/60);
    expect(G.SM.thanks).toBe(true);
    expect(G.store.ach.snowman).toBeTruthy();
  });
  it('turns the menus to winter afterward',()=>{
    els.thanksMap.listeners.click();
    expect(G.state).toBe('map'); expect(winterView()).toBe(true);
  });
});

describe('the moose',()=>{
  it('leaves for good after five hits',()=>{
    // A casual raker, so the lawn isn't cleared before the fifth throw.
    playSpecial('mo',()=>G.moose&&['wander','charge'].includes(G.moose.mode)?G.moose:null,'random');
    expect(G.moose.hp).toBe(0);
  });
});

describe('moonlight and the map',()=>{
  it('plays the moonlit lawn and returns to the map on Stowe afterward',()=>{
    G.mapSel='nt'; begin();
    for(let f=0;f<60*130&&G.state==='play';f++){botFrame(f,'smart'); update(1/60);}
    expect(G.state).toBe('over');
    expect(()=>els.toMap.listeners.click()).not.toThrow();
    expect(G.state).toBe('map'); expect(G.selected).toBe('vt');
  });
});

describe('daily lawn',()=>{
  it('lays out the same lawn every time it is started',()=>{
    const sig=()=>G.leaves.slice(0,8).map(l=>`${Math.round(l.x)},${Math.round(l.y)}`).join(' ')+G.items.map(i=>i.id).join();
    beginDaily(); const a=sig(); beginDaily(); expect(sig()).toBe(a);
  });
  it('shows a share card after the daily lawn, and not after a regular day',()=>{
    beginDaily();
    for(let f=0;f<60*130&&G.state==='play';f++){botFrame(f,'smart'); update(1/60);}
    expect(els.shareCard.hidden).toBe(false);
    expect(G.shareText).toMatch(/^Rake Before Dark 🍂 Daily/);
    G.mapSel='vt'; G.mapDay=1; begin();
    for(let f=0;f<60*130&&G.state==='play';f++){botFrame(f,'smart'); update(1/60);}
    expect(els.shareCard.hidden).toBe(true);
  });
});

describe('bag toss',()=>{
  it('lands a carefully aimed slingshot throw on every target',()=>{
    startToss(); const T=G.TOSS;
    for(const r of T.rings){
      if(!T.bag) tossNextBag();
      const b=T.bag, dx=r.x-T.wind*55*G.K-b.hx, dy=r.y-b.hy, dist=Math.hypot(dx,dy), pull=(dist-40*G.K)/(TOSS_RANGE()-40*G.K)*PULL_MAX();
      tossDown(b.hx,b.hy,1); tossMove(b.hx-dx/dist*pull,b.hy-dy/dist*pull,1); tossUp(1);
      for(let i=0;i<50;i++) updateToss(1/60);
    }
    expect(T.hits).toBe(T.rings.length);
    endToss(true);
  });
});
