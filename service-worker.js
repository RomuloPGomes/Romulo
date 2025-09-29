const CACHE_NAME = 'romulo-cache-v1';
const urlsToCache = [
  '/',
  '/Romulo/index.html',
  '/Romulo/manifest.json',
  '/Romulo/icons/icon-192.png',
  '/Romulo/icons/icon-512.png',
  // URLs das bibliotecas externas adicionadas para funcionamento offline:
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://unpkg.com/dexie@3/dist/dexie.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});