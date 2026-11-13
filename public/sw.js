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

self.addEventListener("push", (event) => {
  let payload
  try {
    payload = event.data?.json()
  } catch {
    return
  }
  if (!payload || typeof payload.body !== "string") return
  event.waitUntil(self.registration.showNotification("TrackDash", {
    body: payload.body,
    icon: "/pwa/icon-v7-192.png",
    tag: "trackdash-pilot",
  }))
})

self.addEventListener("notificationclick", (event) => {
  if (event.notification.tag !== "trackdash-pilot") return
  event.notification.close()
  event.waitUntil((async () => {
    const target = new URL("/profile", self.location.origin).href
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
    const existing = clients.find((client) => client.url === target)
    if (existing) return existing.focus()
    return self.clients.openWindow(target)
  })())
})
