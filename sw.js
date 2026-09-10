const CACHE = 'gft-stripe-redemption-pwa-v6';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest', './assets/icon-192.png', './assets/icon-512.png', './assets/reference-flow.png', './assets/usdc-logo.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
    return response;
  }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
});
