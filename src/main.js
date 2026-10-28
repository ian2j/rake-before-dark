import './styles.css';
import {boot} from './game/boot.js';

boot();

// The installed web app works offline through a service worker generated at build time.
// The single-file artifact build leaves it out.
if(import.meta.env.PROD&&import.meta.env.MODE!=='artifact'&&'serviceWorker' in navigator){
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
}
