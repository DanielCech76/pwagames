const PREFIX = 'letadlo-shell:';
const CACHE = PREFIX + '__BUILD_HASH__';
const FILES = __SHELL_FILES__;
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
