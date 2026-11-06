// NanoPay Service Worker for Offline Caching
const CACHE_NAME = 'nanopay-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let Firebase Firestore handle its own network/cache persistence.
  // Cache app shell assets if needed.
  if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
