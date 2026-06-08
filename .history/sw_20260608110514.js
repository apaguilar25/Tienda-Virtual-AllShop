const CACHE_KEY = 'premium-retail-cache-v1';
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/tienda.html',
  '/cuenta.html',
  '/admin.html',
  '/manifest.json',
  '/css/global.css',
  '/css/landing.css',
  '/css/tienda.css',
  '/css/cuenta.css',
  '/css/admin.css',
  '/js/storage.js',
  '/js/global.js',
  '/js/modules/auth.js',
  '/js/modules/catalog.js',
  '/js/modules/cart.js',
  '/js/modules/admin.js',
  '/js/pages/landing-page.js',
  '/js/pages/tienda-page.js',
  '/js/pages/cuenta-page.js',
  '/js/pages/admin-page.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_KEY).then(cache => cache.addAll(STATIC_RESOURCES)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(response => response || fetch(e.request)));
});