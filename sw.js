const CACHE_NAME = 'ses-calk-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.v3.js',
  './constants.js',
  './fileSystem.js',
  './exportExcel.js',
  './exportPdf.js',
  './SolarLogo3.png',
  './SolarLogo2.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
