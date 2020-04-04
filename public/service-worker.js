const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/css/style.css',
  '/assets/js/db.js',
  '/assets/js/index.js',
  '/assets/js/chart.js',
  '/assets/images/icons/icon-192x192.png',
  '/assets/images/icons/icon-512x512.png'
];

//
const STATIC_CACHE = "static-cache-v2";
const RUNTIME_CACHE = "data-cache-v1";

// install files
self.addEventListener("install", function (evt) {
  evt.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    }).then(() => self.skipWaiting()).catch(err => console.log(err))
  );

  // self.skipWaiting();
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", event => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        // return array of cache names that are old to delete
        return cacheNames.filter(
          cacheName => !currentCaches.includes(cacheName)
        );
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// fetch
self.addEventListener("fetch", function (evt) {
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);
          });
      })
    );

    return;
  }

  evt.respondWith(
    caches.open(STATIC_CACHE).then(cache => {
      return fetch(evt.request).then(response => {
        cache.put(evt.request, response.clone());
        return response;
      }).catch(() => caches.match(evt.request))
    })
  );
});
