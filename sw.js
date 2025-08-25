// Define um nome e versão para o cache. Mudar a versão força a atualização.
const CACHE_NAME = 'inspecao-oae-cache-v3';
const STATIC_CACHE_NAME = 'inspecao-oae-static-v3';
const DYNAMIC_CACHE_NAME = 'inspecao-oae-dynamic-v3';

// Lista dos arquivos essenciais para o aplicativo funcionar offline.
const STATIC_URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-512x512.png'
];

// Evento de Instalação: Salva os arquivos principais em cache.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache estático aberto e arquivos essenciais salvos.');
        return cache.addAll(STATIC_URLS_TO_CACHE);
      })
      .then(() => {
        console.log('Service Worker: Instalação concluída.');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Erro na instalação:', error);
      })
  );
});

// Evento de Ativação: Limpa os caches antigos e assume controle imediatamente.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Ativação concluída.');
      return self.clients.claim();
    })
  );
});

// Evento Fetch: Estratégia Cache First com fallback para rede
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Estratégia para arquivos estáticos: Cache First
  if (STATIC_URLS_TO_CACHE.some(urlToCache => 
    request.url.includes(urlToCache) || 
    request.url.endsWith(urlToCache.replace('./', ''))
  )) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('Service Worker: Retornando do cache estático:', request.url);
            return response;
          }
          
          // Se não está no cache, busca na rede e salva
          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(STATIC_CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                    console.log('Service Worker: Salvando no cache estático:', request.url);
                  });
              }
              return networkResponse;
            })
            .catch(() => {
              // Se falhar na rede e for HTML, retorna a página principal
              if (request.destination === 'document') {
                return caches.match('./index.html');
              }
              return new Response('Offline - Arquivo não disponível', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }

  // Para outros recursos: Network First com fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se a rede funcionou, salva no cache dinâmico
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Se a rede falhou, tenta buscar do cache
        return caches.match(request)
          .then((response) => {
            if (response) {
              console.log('Service Worker: Retornando do cache dinâmico:', request.url);
              return response;
            }
            
            // Se não está em nenhum cache, retorna erro offline
            return new Response('Offline - Recurso não disponível', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Evento de mensagem para comunicação com a aplicação
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});