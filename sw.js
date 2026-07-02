/* Velvet service worker.
   Navigations: network-first (falls back to cache offline).
   Assets: stale-while-revalidate — serve cache instantly, refresh
   in the background so the next load picks up deployed changes. */
const CACHE = 'velvet-v2';
const ASSETS = [
  '.',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/audio.js',
  'js/data.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('index.html', copy));
          return res;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const refresh = fetch(e.request)
      .then(res => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      })
      .catch(() => null);
    if (hit) {
      e.waitUntil(refresh); // background revalidate
      return hit;
    }
    return (await refresh) || Response.error();
  })());
});
