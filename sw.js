/* Sensory Rewire — offline-first service worker (cache-first, versioned). */
const CACHE = 'sensory-rewire-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './dist/main.js',
  './dist/portal.js',
  './dist/session.js',
  './dist/breath.js',
  './dist/audio.js',
  './dist/haptics.js',
  './dist/lexicon.js',
  './dist/states.js',
  './dist/types.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(
      (hit) =>
        hit ??
        fetch(event.request).then((res) => {
          if (res.ok && new URL(event.request.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        }),
    ),
  );
});
