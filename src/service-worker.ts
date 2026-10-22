/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';
const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `linkcraft-${version}`;
const assets = [...build, ...files];
worker.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(assets)));
});
worker.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith('linkcraft-') && key !== CACHE) await caches.delete(key);
      await worker.clients.claim();
    })()
  );
});
worker.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Never cache authentication, Convex, APIs, or user-specific responses.
  if (
    request.method !== 'GET' ||
    url.origin !== worker.location.origin ||
    url.pathname.startsWith('/api/')
  )
    return;
  if (assets.includes(url.pathname)) {
    event.respondWith(
      (async () =>
        (await caches.open(CACHE))
          .match(url.pathname)
          .then((response) => response ?? fetch(request)))()
    );
  } else if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () =>
        (await caches.open(CACHE))
          .match('/offline.html')
          .then((response) => response ?? new Response('Offline', { status: 503 }))
      )
    );
  }
});
