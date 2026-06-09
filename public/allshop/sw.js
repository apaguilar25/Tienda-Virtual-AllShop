// AllShop Service Worker — caché simple para modo offline
const CACHE = "allshop-v1";
const ASSETS = [
  "/allshop/index.html",
  "/allshop/catalog.html",
  "/allshop/product.html",
  "/allshop/cart.html",
  "/allshop/checkout.html",
  "/allshop/login.html",
  "/allshop/register.html",
  "/allshop/forgot.html",
  "/allshop/profile.html",
  "/allshop/admin.html",
  "/allshop/css/styles.css",
  "/allshop/js/db.js",
  "/allshop/js/app.js",
  "/allshop/js/landing.js",
  "/allshop/js/catalog.js",
  "/allshop/js/product.js",
  "/allshop/js/cart.js",
  "/allshop/js/checkout.js",
  "/allshop/js/auth.js",
  "/allshop/js/profile.js",
  "/allshop/js/admin.js",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        if (res && res.status === 200 && (req.url.startsWith(self.location.origin) || req.url.includes("fakestoreapi"))) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});