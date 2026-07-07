// This is the service worker with the Cache-first network

const CACHE = "pwabuilder-precache-v2";
const precacheFiles = [
  /* Add an array of files to precache for your app */
];

self.addEventListener("install", function (event) {
  console.log("[PWA Builder] Install Event processing");

  console.log("[PWA Builder] Skip waiting on install");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[PWA Builder] Caching pages during install");
      return cache.addAll(precacheFiles);
    })
  );
});

// Allow sw to control of current page
self.addEventListener("activate", function (event) {
  console.log("[PWA Builder] Claiming clients for current page");
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          // Only prune stale *precaches* from older SW versions. Do NOT delete
          // the app's own runtime caches (e.g. the multi-GB model weights in
          // ablation-weights-*, or transformers-cache) — those are expensive to
          // rebuild and are managed by the app, not the service worker.
          .filter(function (key) {
            return key !== CACHE && key.indexOf("pwabuilder-precache") === 0;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  // Never cache the live-ablation demo assets (module code, direction JSON,
  // locally-mirrored model files). They change as the demo is tuned, and the
  // stale-while-revalidate strategy below would otherwise serve a version one
  // load behind — silently running old code/config. Always hit the network.
  var url = new URL(event.request.url);
  if (url.pathname.indexOf("/assets/posts/ablation/") === 0) return;

  event.respondWith(
    fromCache(event.request).then(
      function (response) {
        // The response was found in the cache so we responde with it and update the entry

        // This is where we call the server to get the newest version of the
        // file to use the next time we show view
        event.waitUntil(
          fetch(event.request).then(function (response) {
            return updateCache(event.request, response);
          })
        );

        return response;
      },
      function () {
        // The response was not found in the cache so we look for it on the server
        return fetch(event.request)
          .then(function (response) {
            // If request was success, add or update it in the cache
            event.waitUntil(updateCache(event.request, response.clone()));

            return response;
          })
          .catch(function (error) {
            console.log("[PWA Builder] Network request failed and no cache." + error);
          });
      }
    )
  );
});

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }

      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}
