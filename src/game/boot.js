// Starts the game: fills in initial state, loads saved progress, wires up events, and starts the frame loop.
import {G} from './state.js';
import {DIFFS, LEVELS, dayParams} from '../data/levels.js';
import {bindAudioLifecycle} from './audio.js';
import {bindInput} from './input.js';
import {layout} from './lawn.js';
import {frame} from './loop.js';
import {reset} from './round.js';
import {bindUi, goTitle} from './screens.js';
import {blankStore, loadStore} from './store.js';

export function boot(){
  G.store=blankStore();
  loadStore();
  G.selected=LEVELS[G.store.opts.last]?G.store.opts.last:'vt';
  G.mapSel=G.selected;
  G.LV=LEVELS[G.selected];
  G.D=DIFFS[G.store.opts.diff]||DIFFS.standard;
  G.DP=dayParams(G.LV,1);
  bindUi(); bindAudioLifecycle(); bindInput();
  layout(); reset(); goTitle();
  requestAnimationFrame(frame);
}
