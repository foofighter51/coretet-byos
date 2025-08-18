// Service Worker for CoreTet PWA
const CACHE_VERSION = 'v1755535872785'; // Increment this on each deployment
const CACHE_NAME = `coretet-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache only essential files
self.addEventListener('install', event => {
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for API requests
  if (url.pathname.includes('/rest/') || 
      url.pathname.includes('/auth/') ||
      url.pathname.includes('/storage/') ||
      url.pathname.includes('/functions/') ||
      url.hostname.includes('supabase')) {
    event.respondWith(fetch(request));
    return;
  }

  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // IMPORTANT: Skip caching for JavaScript and CSS bundles
  // These files have hashes in their names for cache busting
  if (url.pathname.includes('/assets/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css')) {
    event.respondWith(fetch(request));
    return;
  }

  // For navigation requests, always try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Update the cached index.html with the fresh version
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Only use cache if network fails
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For other requests (images, fonts), try cache first, then network
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          // Return cached version and update cache in background
          fetch(request).then(fetchResponse => {
            if (fetchResponse.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, fetchResponse.clone());
              });
            }
          }).catch(() => {});
          return response;
        }

        return fetch(request).then(response => {
          // Only cache successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Only cache specific file types (images, fonts)
          const contentType = response.headers.get('content-type') || '';
          const shouldCache = contentType.includes('image/') || 
                            contentType.includes('font/');

          if (shouldCache) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });
          }

          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page for navigation
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Activate event - clean up old caches immediately
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    Promise.all([
      // Clean up ALL old caches immediately
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      clients.claim()
    ])
  );
});

// Listen for messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle version check
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});