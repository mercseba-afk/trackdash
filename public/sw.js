const CACHE_VERSION = "trackdash-shell-v6"
const OFFLINE_URL = "/offline.html"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))),
    ]),
  )
})

// Keep live TrackDash data network-first. We only handle document navigations,
// providing a tiny offline fallback while leaving API, collection, marketplace
// and Price Intelligence requests untouched by the service worker.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return

  event.respondWith(
    fetch(event.request).catch(async () => {
      const fallback = await caches.match(OFFLINE_URL)
      return fallback ?? new Response("TrackDash is offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })
    }),
  )
})
