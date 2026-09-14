const CACHE_VERSION = "trackdash-shell-v2"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))),
    ]),
  )
})

// TrackDash deliberately stays network-first. Registering a lightweight
// service worker makes the app installable without risking stale collection,
// marketplace or Price Intelligence data.
self.addEventListener("fetch", () => {})
