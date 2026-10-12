const CACHE='biocare-catalog-medical-precision-v5-20261012';
const ASSETS=['./','./index.html','./styles.css','./catalog.js','./catalog-medical-details.js','./catalog-details-ui.js','./app.js','./profile.js','./saleem.js','./services.js','./biocare-cloud.js','./biocare-location.js','./biocare-team-provider.js','./biocare-cms.js','./team.html','./admin.html','./admin.js','./biocare-catalog-admin-v3.js','./manifest.webmanifest','./logo-full.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});

self.addEventListener("push",event=>{let d={};try{d=event.data?.json()||{}}catch{}const title=String(d.title||"بيوكير");const options={body:String(d.body||"لديك تحديث جديد، افتح التطبيق للاطلاع عليه."),icon:"./icon-192.png",badge:"./icon-192.png",tag:String(d.tag||"biocare-update"),data:{url:"./"}};event.waitUntil(self.registration.showNotification(title,options))});
self.addEventListener("notificationclick",event=>{event.notification.close();event.waitUntil(clients.openWindow("./"))});
