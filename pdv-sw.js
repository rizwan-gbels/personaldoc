// Personal Docs Vault Service Worker - offline caching
// GitHub Pages variant: this always serves index.html (a fixed filename),
// so unlike the Termux/local-server variant there's no need to update a
// build-numbered filename here or re-add the home screen icon after every
// build. Just bump CACHE_NAME (e.g. pdv-v100) each time you deploy a new
// build so returning visitors pick up the update instead of a stale cache.
const CACHE_NAME = 'pdv-v100';
const FILES_TO_CACHE = [
  './index.html',
  './pdv-manifest.json',
  './pdv-icon-192.png',
  './pdv-icon-512.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean up old caches from previous BUILD versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, falling back to network, so the app opens instantly
// and still works with no internet connection.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
