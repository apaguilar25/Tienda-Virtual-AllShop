const CACHE_NAME = 'ios-shop-cache-v1';
const ASSETS = [
    './',
    './index.html',
    './auth.html',
    './catalog.html',
    './admin.html',
    './css/global.css',
    './css/components.css',
    './css/landing.css',
    './css/auth.css',
    './css/catalog.css',
    './css/admin.css',
    './js/app.js',
    './js/storage.js',
    './js/auth.js',
    './js/catalog.js',
    './js/cart.js',
    './js/admin.js',
    './manifest.json'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            return cachedResponse || fetch(e.request);
        })
    );
});