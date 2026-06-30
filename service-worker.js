const CACHE_VERSION = "v1";
const STATIC_CACHE_NAME = "khaophang-report-static-" + CACHE_VERSION;

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./report.html",
  "./track.html",
  "./faq.html",
  "./contact.html",
  "./report-success.html",
  "./assets/css/variables.css",
  "./assets/css/reset.css",
  "./assets/css/base.css",
  "./assets/css/components.css",
  "./assets/css/utilities.css",
  "./assets/css/public.css",
  "./assets/js/config.js",
  "./assets/js/api.js",
  "./assets/js/utils.js",
  "./assets/js/install-app.js",
  "./assets/js/public/home.js",
  "./assets/js/public/report.js",
  "./assets/js/public/track.js",
  "./assets/js/public/faq.js",
  "./assets/icons/icon-khophangreport.png",
  "./assets/images/home-hero.jpg",
  "./assets/images/hero-images-report.jpg",
  "./assets/images/hero-images-track.jpg",
  "./assets/images/hero-images-faqt.jpg",
  "./assets/images/hero-images-contact.jpg",
  "./manifest.webmanifest"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(cacheNames.map(function (cacheName) {
        if (cacheName.indexOf("khaophang-report-") === 0 && cacheName !== STATIC_CACHE_NAME) {
          return caches.delete(cacheName);
        }

        return Promise.resolve();
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || url.pathname.indexOf("/admin/") !== -1) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match("./index.html");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request);
    })
  );
});
