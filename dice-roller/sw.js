const CACHE_NAME = 'dice-roller-cache-v2'; // Bump version to ensure update
const APP_SHELL_URLS = [
    './index.html',
    './styles/style.css',
    './scripts/main.js',
    './manifest.json'
];

// Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache and caching app shell');
                return cache.addAll(APP_SHELL_URLS);
            })
    );
});

// Intercept fetch requests and serve from cache if available
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    // If we found a match in the cache, return it
                    return response;
                }
                // If not in cache, fetch from the network
                return fetch(event.request);
            })
    );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
