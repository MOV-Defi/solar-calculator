const CACHE_NAME = 'ses-calk-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
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

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
