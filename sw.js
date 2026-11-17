// MultiTool Hub — Hardened Application Shell Service Worker
// Cache Version: multitool-shell-v6
const CACHE_NAME = "multitool-shell-v6";

// Explicit allowlist of approved same-origin static shell assets
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/logo.svg",
  "/favicon.svg",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon-48x48.png",
  "/favicon-32.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/manifest.json",
  "/assets/hero-workspace.jpg",
  "/assets/images/tools/metaclean-art.svg",
  "/assets/images/tools/sendanywhere-art.svg",
  "/assets/images/tools/ytmp34-art.svg",
  "/assets/brand-logo.png"
];

const SHELL_SET = new Set(SHELL_ASSETS);

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    }).catch(function () {
      // Gracefully handle partial installation issues
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME && key.startsWith("multitool-")) {
            return caches.delete(key);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;

  // 1. Only process GET requests
  if (request.method !== "GET") {
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(request.url);
  } catch (err) {
    return;
  }

  // 2. Restrict caching to same-origin requests
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // 3. Prevent cache poisoning: Do not cache arbitrary query-driven endpoints
  if (requestUrl.search) {
    return;
  }

  // 4. Verify request path belongs to approved application shell allowlist
  const pathname = requestUrl.pathname;
  if (!SHELL_SET.has(pathname)) {
    return;
  }

  // 5. Stale-while-revalidate for approved shell assets with strict response validation
  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(request).then(function (cachedResponse) {
        const networkFetch = fetch(request).then(function (networkResponse) {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const cacheControl = networkResponse.headers.get("Cache-Control") || "";
            if (!cacheControl.includes("no-store") && !cacheControl.includes("no-cache")) {
              cache.put(request, networkResponse.clone());
            }
          }
          return networkResponse;
        }).catch(function () {
          return cachedResponse;
        });

        return cachedResponse || networkFetch;
      });
    }).catch(function () {
      if (request.mode === "navigate") {
        return caches.match("/index.html");
      }
      return new Response("Service Unavailable", { status: 503, statusText: "Service Unavailable" });
    })
  );
});
