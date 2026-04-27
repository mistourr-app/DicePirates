const CACHE = 'pirates-v2';
const BASE  = '/DicePirates';
const ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/css/style.css`,
  `${BASE}/js/app.js`,
  `${BASE}/js/game.js`,
  `${BASE}/js/dice.js`,
  `${BASE}/js/combat.js`,
  `${BASE}/js/ui.js`,
  `${BASE}/js/physics.js`,
  `${BASE}/manifest.json`,
];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));

self.addEventListener('activate', e =>
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  )));

self.addEventListener('fetch', e =>
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
