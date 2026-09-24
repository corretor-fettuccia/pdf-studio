/* PDF Studio v1.7.0 - Service Worker */
const CACHE_NAME = 'pdf-studio-v1.7.0';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];
const EXTERNAL_PDF_LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    // CDN: resposta pode ser opaque; cache.put aceita esse formato e permite replay offline.
    await Promise.allSettled(EXTERNAL_PDF_LIBS.map(async url => {
      const req = new Request(url, { mode:'no-cors', cache:'reload' });
      const res = await fetch(req);
      await cache.put(req, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('pdf-studio-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Navegação: tenta rede para atualização, mas cai no app local sem conexão.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch (_) {
        return (await caches.match(request)) || (await caches.match('./index.html'));
      }
    })());
    return;
  }

  // Recursos do próprio Studio e bibliotecas externas: cache-first.
  const isPdfLibrary = EXTERNAL_PDF_LIBS.includes(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isPdfLibrary && !isSameOrigin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const fresh = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone()).catch(() => {});
      return fresh;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
