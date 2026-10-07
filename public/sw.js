const CACHE_VERSION = "trackdash-shell-v10"
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
    (async () => {
      await self.clients.claim()
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))

      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      await Promise.all(
        windows.map((client) =>
          client.navigate(client.url).catch(() => undefined),
        ),
      )
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return

  event.respondWith(
    fetch(event.request).catch(async () => {
      const fallback = await caches.match(OFFLINE_URL)
      return (
        fallback ??
        new Response("TrackDash is offline", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      )
    }),
  )
})
