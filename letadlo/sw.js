const PREFIX = 'letadlo-shell:';
const CACHE = PREFIX + 'e5718c0092c22e62';
const FILES = ["app.js", "bridge.js", "data-worker.js", "detail-geo.js", "detail-renderer.js", "engine.js", "icon-192.png", "icon-512.png", "icon-maskable.png", "index.html", "install.js", "manifest.webmanifest", "offline.js", "style.css", "tile-paint.js", "tracks.js", "vendor/LICENSE-bootstrap-icons.txt", "vendor/LICENSE-fflate.txt", "vendor/LICENSE-pbf.txt", "vendor/LICENSE-pmtiles.txt", "vendor/LICENSE-point-geometry.txt", "vendor/LICENSE-three.txt", "vendor/LICENSE-vector-tile.txt", "vendor/maps.js", "vendor/three.module.js"];
const scope = new URL(self.registration.scope);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(FILES.map(file => new Request(new URL(file, scope), {cache: 'reload'})));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET' || !request.url.startsWith(scope.href)) return;
  const path = new URL(request.url).pathname.slice(scope.pathname.length);
  const file = path === '' ? 'index.html' : path;
  if (!FILES.includes(file)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(new URL(file, scope)) || fetch(request);
  })());
});
