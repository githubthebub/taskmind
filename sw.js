/**
 * Offline-first service worker: precaches the full app shell on install and
 * serves cache-first thereafter. There are no runtime network dependencies —
 * this cache IS the entire application.
 */
const CACHE = 'stillpoint-v4';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './dist/main.js',
  './dist/types.js',
  './dist/state/bus.js',
  './dist/state/store.js',
  './dist/state/avatarStateMachine.js',
  './dist/data/avatarMachine.js',
  './dist/data/dialogue.js',
  './dist/data/prompts.js',
  './dist/data/mudras.js',
  './dist/engine/breath.js',
  './dist/engine/haptics.js',
  './dist/engine/audio.js',
  './dist/engine/milestones.js',
  './dist/ui/avatar.js',
  './dist/ui/breathRing.js',
  './dist/ui/promptGrid.js',
  './dist/ui/neuroPanel.js',
  './dist/ui/mudraPanel.js',
  './dist/ui/personaPicker.js',
  './dist/ui/hud.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
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
      (cached) =>
        cached ??
        fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        }),
    ),
  );
});
