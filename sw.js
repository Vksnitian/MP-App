// GLS MP System — Service Worker
// Caches the app shell for offline use & fast loading

const CACHE_NAME = 'gls-mp-v4';
const CACHE_URLS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
];

// ── Install: cache app shell ──
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(err => {
        console.log('SW: cache addAll partial error (ok):', err);
      });
    })
  );
});

// ── Activate: delete old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ──
// For Firebase/CDN requests: Network first (always fresh data)
// For app shell (HTML/icons/manifest): Cache first, fallback to network
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Skip non-GET and chrome-extension
  if (event.request.method !== 'GET') return;
  if (url.startsWith('chrome-extension')) return;

  // Firebase, Fast2SMS, Razorpay, CDN — always network (live data)
  const networkOnly = [
    'firebaseio.com',
    'firebasedatabase.app',
    'googleapis.com',
    'gstatic.com',
    'fast2sms.com',
    'razorpay.com',
    'cdnjs.cloudflare.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ];
  if (networkOnly.some(domain => url.includes(domain))) {
    return; // let browser handle normally
  }

  // App shell — Cache first, then network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses for app shell files
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — return cached index
        if (url.includes('.html') || url.endsWith('/')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
