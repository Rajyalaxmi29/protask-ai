// SERVICE WORKER SELF-DESTRUCT
// This file is used to forcefully clear any old cached versions on mobile devices.
// Once your mobile browser fetches this new version, it will clear all caches and stop intercepting requests.

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach(client => client.navigate(client.url));
    })
  );
});

// Do nothing on fetch - let the network handle everything for live development
self.addEventListener('fetch', (event) => {
  return; 
});
