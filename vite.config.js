import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';
import crypto from 'crypto';

// Writes sw.js after the bundle: pages network-first, everything else cache-first, fonts stale-while-revalidate.
// The cache name is a hash of the emitted files, so every deploy replaces the old cache.
function serviceWorker(){
  return {
    name:'rake-service-worker',
    apply:'build',
    generateBundle(_,bundle){
      const files=Object.keys(bundle).filter(f=>!f.endsWith('.map'));
      const hash=crypto.createHash('sha256').update(files.sort().join('|')+Object.values(bundle).map(b=>b.code||b.source||'').join('')).digest('hex').slice(0,10);
      const precache=['./','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/maskable-512.png',...files];
      this.emitFile({type:'asset',fileName:'sw.js',source:`const CACHE='rake-${hash}', FONTS='rake-fonts';
const PRECACHE=${JSON.stringify(precache)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==FONTS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET') return;
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(async c=>{const hit=await c.match(req); const net=fetch(req).then(r=>{if(r.ok||r.type==='opaque') c.put(req,r.clone()); return r;}).catch(()=>hit); return hit||net;}));
    return;
  }
  if(url.origin!==location.origin) return;
  if(req.mode==='navigate'){e.respondWith(fetch(req).then(r=>{const copy=r.clone(); caches.open(CACHE).then(c=>c.put('./',copy)); return r;}).catch(()=>caches.match('./')));return;}
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
});
`});
    }
  };
}

// The artifact build is one self-contained page with no web-app manifest, icons or service worker.
function artifactPage(){
  return {
    name:'rake-artifact-page',
    transformIndexHtml(html){return html.replace(/^.*data-pwa.*\n/gm,'');}
  };
}

export default defineConfig(({mode})=>mode==='artifact'
  ?{base:'./',plugins:[artifactPage(),viteSingleFile()],publicDir:false,build:{outDir:'dist-artifact',emptyOutDir:true}}
  :{base:'./',plugins:[serviceWorker()],build:{outDir:'dist',emptyOutDir:true}});
