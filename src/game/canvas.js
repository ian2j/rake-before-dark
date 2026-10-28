// The visible canvas and the offscreen layers drawn into it.
import {$} from '../lib/util.js';

export const cv=$('lawn'), ctx=cv.getContext('2d');

export const grass=document.createElement('canvas'), gctx=grass.getContext('2d');

export const scrape=document.createElement('canvas'), sctx=scrape.getContext('2d');

export const snow=document.createElement('canvas'), nctx=snow.getContext('2d');

// Fog: two drifting layers of soft blobs at half resolution, with the lighthouse beam cut out of them.
export const fogTex=document.createElement('canvas'), fctx=fogTex.getContext('2d');

export const fogWork=document.createElement('canvas'), wctx=fogWork.getContext('2d');

// ---------- Moonlight: a dark overlay with the lantern on the rake, the porch light and the moon cut out of it.
export const darkC=document.createElement('canvas'), dctx=darkC.getContext('2d');

// The snow day: drag to roll snowballs (they grow as they pick up snow and leave a green trail), stack three,
// then push the snowman off the edge of the hill.
export const trailC=document.createElement('canvas'), tctx=trailC.getContext('2d');
