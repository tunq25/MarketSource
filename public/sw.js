// Service Worker cho QtusDev Market
// Basic service worker để tránh 404 errors

const CACHE_NAME = 'qtusdev-market-v1';
const urlsToCache = [
  '/',
  '/products',
  '/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - Network first strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // ✅ FIX: Ignore Vite-related requests và các file không tồn tại
  if (
    url.pathname.includes('@vite') ||
    url.pathname.includes('@react-refresh') ||
    url.pathname.includes('/src/main.tsx') ||
    url.pathname.includes('vite.svg') ||
    url.pathname.startsWith('/@')
  ) {
    // Return empty response cho các vite requests để tránh 404
    event.respondWith(new Response('', { status: 404 }));
    return;
  }
  
  // ✅ FIX: Redirect icon-192.png to logoqtusdev.png
  if (url.pathname === '/icon-192.png') {
    event.respondWith(
      fetch('/logoqtusdev.png')
        .then((response) => response)
        .catch(() => new Response('', { status: 404 }))
    );
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

