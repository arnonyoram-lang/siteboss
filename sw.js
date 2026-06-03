// דקה — Service Worker (network-first) — מבטיח שמנהלים תמיד מקבלים את הגרסה העדכנית
const CACHE = 'dk-cache-v1';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  // רק בקשות מאותו מקור (לא Firebase/gstatic — אלה ינוהלו ע"י הדפדפן)
  try{ if(new URL(req.url).origin !== self.location.origin) return; }catch(_){ return; }
  // network-first: תמיד מנסה רשת (גרסה עדכנית), נופל למטמון רק כשאין רשת
  e.respondWith(
    fetch(req).then(function(res){
      try{ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }catch(_){}
      return res;
    }).catch(function(){ return caches.match(req); })
  );
});
