// Service Worker for Offline Route Caching
const CACHE_VERSION = 'hail-crm-v1';
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,
  routes: `${CACHE_VERSION}-routes`,
  leads: `${CACHE_VERSION}-leads`,
  maps: `${CACHE_VERSION}-maps`,
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const cacheName = getCacheNameForRequest(url.pathname);
            if (cacheName) {
              const responseClone = response.clone();
              caches.open(cacheName).then((cache) => {
                cache.put(request, responseClone);
              });
            }
          }
          return response;
        })
        .catch(() => {
          // Return cached response when offline
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache (offline):', url.pathname);
              return cachedResponse;
            }
            // Return offline fallback
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'You are currently offline. Some data may be unavailable.',
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Handle Google Maps API requests
  if (url.hostname.includes('maps.googleapis.com') || url.hostname.includes('maps.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAMES.maps).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (response.ok && shouldCacheAsset(url.pathname)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAMES.static).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'dismiss') {
    return;
  }

  // Handle different notification types
  let url = '/';
  if (data?.type === 'lead-assignment') {
    url = '/leads';
  } else if (data?.type === 'route-update') {
    url = '/map';
  } else if (data?.type === 'territory-conflict') {
    url = '/map';
  } else if (data?.type === 'route-complete') {
    url = '/analytics';
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Message event - handle cache management commands
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'CACHE_ROUTE':
      cacheRouteData(data).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'CACHE_LEADS':
      cacheLeadsData(data).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Helper functions

function getCacheNameForRequest(pathname) {
  if (pathname.includes('/routes')) {
    return CACHE_NAMES.routes;
  }
  if (pathname.includes('/leads')) {
    return CACHE_NAMES.leads;
  }
  return null;
}

function shouldCacheAsset(pathname) {
  const extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];
  return extensions.some((ext) => pathname.endsWith(ext));
}

async function cacheRouteData(routeData) {
  const cache = await caches.open(CACHE_NAMES.routes);
  const request = new Request(`/api/routes/${routeData.id}`);
  const response = new Response(JSON.stringify(routeData), {
    headers: { 'Content-Type': 'application/json' },
  });
  await cache.put(request, response);
  console.log('[SW] Cached route data:', routeData.id);
}

async function cacheLeadsData(leadsData) {
  const cache = await caches.open(CACHE_NAMES.leads);
  for (const lead of leadsData) {
    const request = new Request(`/api/leads/${lead.id}`);
    const response = new Response(JSON.stringify(lead), {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put(request, response);
  }
  console.log('[SW] Cached leads data:', leadsData.length);
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[SW] Cleared all caches');
}

async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}
