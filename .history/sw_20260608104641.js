const CACHE_NAME = 'ios-store-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/components.css',
  '/css/landing.css',
  '/css/catalog.css',
  '/css/admin.css',
  '/js/storage.js',
  '/js/app.js',
  '/js/utils/theme.js',
  '/js/modules/auth.js',
  '/js/modules/catalog.js',
  '/js/modules/cart.js',
  '/js/modules/sync.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});