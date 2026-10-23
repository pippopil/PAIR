// KinoMatch Service Worker with Offline API Caching & Seamless In-App Updates
const STATIC_CACHE_NAME = 'kinomatch-static-v2';
const API_CACHE_NAME = 'kinomatch-api-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
];

// Install: precache essential app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Some precache assets failed:', err);
      });
    })
  );
});

// Activate: clean up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== API_CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for SKIP_WAITING message for instant in-app update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Navigation requests (HTML SPA) -> Network-first, fallback to /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // 2. API requests -> Network-first with Cache API fallback and offline header
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET and POST recommendations/searches
    const isCacheableApi =
      url.pathname.includes('/api/recommendations') ||
      url.pathname.includes('/api/search') ||
      url.pathname.includes('/api/tmdb/trending') ||
      url.pathname.includes('/api/meta') ||
      url.pathname.includes('/api/movies/poster');

    if (!isCacheableApi) {
      return; // pass through
    }

    event.respondWith(
      fetch(event.request.clone())
        .then(async (networkResponse) => {
          if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE_NAME);
            // Use URL + request body hash or simple pathname key for caching
            const cacheKey = event.request.method === 'POST'
              ? new Request(url.pathname, { method: 'GET' })
              : event.request;
            cache.put(cacheKey, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(API_CACHE_NAME);
          const cacheKey = event.request.method === 'POST'
            ? new Request(url.pathname, { method: 'GET' })
            : event.request;
          const cachedResponse = await cache.match(cacheKey);

          if (cachedResponse) {
            // Clone and add header indicating offline cache
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-From-Cache', 'true');
            headers.set('X-Offline-Mode', 'true');

            const body = await cachedResponse.blob();
            return new Response(body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers,
            });
          }

          // Fallback empty response
          return new Response(
            JSON.stringify({
              offline: true,
              fromCache: true,
              source: 'offline_cache',
              recommendations: [],
              message: 'Офлайн: данные пока недоступны',
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'X-From-Cache': 'true',
              },
            }
          );
        })
    );
    return;
  }

  // 3. Static assets (JS, CSS, images, fonts) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
