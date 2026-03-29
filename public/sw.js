// Simple offline caching service worker for PWABuilder
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('protask-cache').then((cache) => {
      // Don't cache everything right now, just cache the root
      return cache.addAll(['/']);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
