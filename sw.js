/* Service worker du menu Sopatel Silmandé.
   Objectif : affichage instantané aux visites suivantes (QR code scanné plusieurs fois)
   et consultation possible même avec une connexion très faible ou absente.
   - HTML  : réseau d'abord (prix toujours à jour), cache en secours.
   - Assets: cache d'abord (images, polices — immuables), réseau en secours.
   Incrémenter VERSION à chaque mise à jour des images ou des polices. */
var VERSION = "silmande-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./font/jost.woff2",
  "./font/cormorant.woff2",
  "./img/hero.webp",
  "./img/logo.webp",
  "./img/wraps.webp",
  "./img/poisson.webp",
  "./img/brochettes.webp",
  "./img/desserts.webp",
  "./img/bar.webp",
  "./img/piscine.webp",
  "./img/petit-dejeuner.webp",
  "./img/t-maze.webp",
  "./img/t-beli.webp",
  "./img/t-wango.webp"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ASSETS); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === VERSION ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match("./index.html"); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      });
    })
  );
});
