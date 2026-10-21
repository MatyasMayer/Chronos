// Network-first with a cache fallback, so the app can be reopened offline after one online visit.
const CACHE = "chronos-smoke-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.registration.scope)) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches.match(request, { ignoreSearch: request.mode === "navigate" }).then(
          (hit) => hit || caches.match(self.registration.scope),
        ),
      ),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Chronos smoke test", body: "Push arrived (no payload)" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/Chronos/icon-192.png",
      data,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windows) =>
      windows.length ? windows[0].focus() : self.clients.openWindow(self.registration.scope),
    ),
  );
});
