// A minimal browser stand-in so the game modules run under Node: stub elements that record listeners,
// a canvas context that accepts any call, localStorage in memory, and no animation frames.
const noop=()=>{};
const gradient={addColorStop:noop};
const ctx2d=new Proxy({},{
  get:(t,k)=>k in t?t[k]:(k==='createRadialGradient'||k==='createLinearGradient')?()=>gradient:k==='measureText'?()=>({width:50}):noop,
  set:(t,k,v)=>(t[k]=v,true)
});
function element(){
  return {
    style:{},hidden:false,textContent:'',innerHTML:'',className:'',checked:false,dataset:{},offsetHeight:0,offsetWidth:0,width:0,height:0,
    classList:{add:noop,remove:noop},
    listeners:{},
    addEventListener(type,fn){this.listeners[type]=fn;},
    getContext:()=>ctx2d,setAttribute:noop,getAttribute:()=>'',focus:noop,setPointerCapture:noop,insertAdjacentHTML:noop,
    querySelectorAll:()=>[],querySelector:()=>element(),getBoundingClientRect:()=>({bottom:62})
  };
}
const els={};
const memory={};
Object.assign(globalThis,{
  window:globalThis,innerWidth:390,innerHeight:844,devicePixelRatio:2,
  document:{getElementById:id=>els[id]??=element(),createElement:()=>element(),addEventListener:noop,querySelectorAll:()=>[],querySelector:()=>element(),hidden:false},
  localStorage:{getItem:k=>memory[k]??null,setItem:(k,v)=>{memory[k]=String(v);},removeItem:k=>{delete memory[k];},clear:()=>{for(const k in memory) delete memory[k];}},
  history:{pushState:noop,back:noop},
  matchMedia:()=>({matches:false}),
  addEventListener:noop,
  requestAnimationFrame:noop
});
Object.defineProperty(globalThis,'navigator',{value:{},configurable:true,writable:true});
globalThis.__els=els;

// Seeded randomness, so the scripted player and the game make the same choices on every run.
let seed=20261029;
Math.random=()=>{seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296;};
