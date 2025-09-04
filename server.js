/* sw.js */
const swVersion = 'v3';
const swScope = (new URL(self.registration.scope)).pathname.replace(/\/$/, ''); // ex: /Romulo
const cacheName = `oae-cache-${swVersion}`;

const CORE_ASSETS = [
  `${swScope}/`,
  `${swScope}/index.html`,
  `${swScope}/manifest.json`,
  `${swScope}/sw.js`,
  // libs de CDN usadas na página (coloque como fallback opcional em cache dinâmico)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k.startsWith('oae-cache-') && k !== cacheName)
        .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Estrategia: network-first
