/* 朝暮 PWA service worker
   Same-origin shell is cached for offline opening.
   Supabase requests are cross-origin and are never intercepted. */

const CACHE_PREFIX = "zhaomu-pwa-";
const CACHE_VERSION = "v1";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/style.css",
  "./assets/js/config.js",
  "./assets/js/cloud.js",
  "./assets/js/app.js",
  "./assets/img/favicon.svg",
  "./assets/img/favicon-32.png",
  "./assets/img/apple-touch-icon.png",
  "./assets/img/pwa-192.png",
  "./assets/img/pwa-512.png",
  "./assets/img/pwa-maskable-512.png",
  "./assets/img/hero.svg",
  "./assets/img/sea.svg",
  "./assets/img/rain-cafe.svg",
  "./assets/img/mountain.svg",
  "./assets/img/flowers.svg",
  "./assets/img/fireworks.svg",
  "./assets/img/train.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    if (request.mode === "navigate") {
      const shell = await cache.match("./index.html");
      if (shell) return shell;
    }

    return new Response("当前处于离线状态，联网后再试一次吧。", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/sw.js")) return;

  event.respondWith(networkFirst(request));
});
