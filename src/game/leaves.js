// Leaf sprites and leaf objects.
import {G} from './state.js';
import {LEAF_COLORS} from '../data/levels.js';

export const SPRITES=[];

(function buildSprites(){
  const SP=3;
  for(const [fill,vein] of LEAF_COLORS) for(const kind of [0,1]) for(const s of [7,9.5]){
    const size=Math.ceil(s*2.4), c=document.createElement('canvas');
    c.width=c.height=size*SP;
    const g=c.getContext('2d');
    g.scale(SP,SP); g.translate(size/2,size/2);
    g.fillStyle=fill; g.strokeStyle=vein; g.lineWidth=0.7;
    g.beginPath();
    if(kind===0){
      for(let i=0;i<=80;i++){
        const a=i/80*Math.PI*2, r=s*(0.48+0.52*Math.pow(Math.abs(Math.cos(a*2.5)),2.2));
        const x=Math.sin(a)*r, y=-Math.cos(a)*r;
        i?g.lineTo(x,y):g.moveTo(x,y);
      }
    }else{
      g.moveTo(0,-s); g.quadraticCurveTo(s*0.75,-s*0.1,0,s*0.85); g.quadraticCurveTo(-s*0.75,-s*0.1,0,-s);
    }
    g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0,-s*0.7); g.lineTo(0,s*1.05); g.stroke();
    SPRITES.push({c,size});
  }
})();

export function pickSprite(){
  let r=Math.random(), i=0;
  while(i<G.LV.leafWeights.length-1&&(r-=G.LV.leafWeights[i])>0) i++;
  return i*4+((Math.random()*4)|0);
}

export function newLeaf(x,y,falling,si){
  si=si??pickSprite();
  return {x,y,vx:0,vy:0,a:Math.random()*6.283,va:0,si,s:SPRITES[si],st:falling?1:0,z:falling?1:0,ph:Math.random()*6.283,
    rest:0,restT:0.25+Math.random()*0.4,bt:0,lift:0.6+Math.random()*0.8,b:0,d:Math.random()};
}
