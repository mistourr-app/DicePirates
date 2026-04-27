const CACHE = 'pirates-v1';
const ASSETS = ['/', '/index.html', '/css/style.css',
  '/js/app.js', '/js/game.js', '/js/dice.js', '/js/combat.js', '/js/ui.js', '/js/physics.js'];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));

self.addEventListener('fetch', e =>
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
