var cacheName = 'hello-pwa';
var filesToCache = [
  '/menar/',
  '/menar/index.html',
  '/menar/css/main.css',
  '/menar/css/games.css',
  '/menar/js/init.js'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
