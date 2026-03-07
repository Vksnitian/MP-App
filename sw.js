// GLS MP System — Service Worker v1.0
const CACHE = 'gls-mp-v1';
const OFFLINE_URL = '/MP-App/';

// Files to cache
const CACHE_FILES = [
  '/MP-App/',
  '/MP-App/index.html',
];

// Install — cache files
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(cache=>{
      return cache.addAll(CACHE_FILES).catch(()=>{});
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', e=>{
  // Skip non-GET and Firebase/API calls
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('firebase') || 
     e.request.url.includes('googleapis') ||
     e.request.url.includes('api.github')) return;

  e.respondWith(
    fetch(e.request)
      .then(res=>{
        // Cache successful responses
        if(res && res.status === 200){
          const clone = res.clone();
          caches.open(CACHE).then(cache=> cache.put(e.request, clone));
        }
        return res;
      })
      .catch(()=> caches.match(e.request).then(cached=> cached || caches.match(OFFLINE_URL)))
  );
});
