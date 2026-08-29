/* MASTER AI — Service Worker
   Enables "Add to Home Screen" installability and basic offline
   caching of the app shell. This does NOT give the website any
   phone-control abilities — it only caches files locally. */

const CACHE_NAME = "master-ai-shell-v1";
const SHELL_FILES = [
  "./index.html",
  "./style.css",
  "./api-config.js",
  "./mastermind.js",
  "./app.js",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  // Network-first for API calls, cache-first for the app shell.
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
