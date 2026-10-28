import {describe,it,expect,beforeEach} from 'vitest';
import {G} from '../src/game/state.js';
import {blankStore,loadStore,KEY} from '../src/game/store.js';

beforeEach(()=>localStorage.clear());

describe('saved progress',()=>{
  it('starts fresh without a save',()=>{
    G.store=blankStore(); loadStore();
    expect(G.store.bank).toBe(0); expect(G.store.opts.diff).toBe('standard');
  });
  it('moves bests from older saves to Monday',()=>{
    localStorage.setItem(KEY,JSON.stringify({best:{vt:{score:100,stars:2},'nh:hard':{score:50,stars:1}},finds:{vt:['cap']}}));
    G.store=blankStore(); loadStore();
    expect(G.store.best['vt:d1:standard']).toEqual({score:100,stars:2});
    expect(G.store.best['nh:d1:hard']).toEqual({score:50,stars:1});
    expect(G.store.finds.vt).toEqual(['cap']);
    expect(G.store.cos.tarp).toBe('blue');
  });
  it('ignores a corrupted save',()=>{
    localStorage.setItem(KEY,'{not json');
    G.store=blankStore(); expect(()=>loadStore()).not.toThrow();
    expect(G.store.best).toEqual({});
  });
});
