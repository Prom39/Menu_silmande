/* Service worker — menu Sopatel Silmandé.
   Objectif : affichage instantané aux visites suivantes (un QR code est scanné
   plusieurs fois par le même client) et consultation possible hors ligne.

   - HTML   : réseau d'abord, cache en secours  -> les prix sont toujours à jour.
   - Images
     polices: cache d'abord, réseau en secours  -> fichiers immuables.

   ⚠️ INCRÉMENTER VERSION À CHAQUE MISE À JOUR D'UNE IMAGE OU D'UNE POLICE.
      Sans cela, les visiteurs déjà venus conservent l'ancienne version en cache.
      (Le HTML, lui, est repris du réseau à chaque visite.) */

var VERSION = "silmande-v3";

/* Mise en cache en deux temps — indispensable sur réseau faible.
   addAll() est atomique : une seule requête en échec annule toute l'installation.
   On n'y met donc que le strict nécessaire au premier écran. */
var CRITICAL = [
  "./",
  "./index.html",
  "./font/jost.woff2",
  "./font/cormorant.woff2",
  "./img/hero.webp",
  "./img/logo.webp"
];

/* Le reste est chargé après activation, en tâche de fond, sans rien bloquer :
   c'est ce qui rend les onglets Bar et Hôtel instantanés sans prefetch JS. */
var DEFERRED = [
  "./img/mark.webp",
  "./img/s-entrees.webp",
  "./img/s-mer.webp",
  "./img/s-grill.webp",
  "./img/s-desserts.webp",
  "./img/b-wango.webp",
  "./img/b-hotel.webp",
  "./img/petit-dejeuner.webp",
  "./img/t-samandin.webp",
  "./img/t-beli.webp",
  "./img/t-wango.webp"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CRITICAL); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) { return k === VERSION ? null : caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
      .then(function () {
        // Chaque image est ajoutée indépendamment : un échec n'annule pas les autres.
        return caches.open(VERSION).then(function (c) {
          return Promise.all(DEFERRED.map(function (u) { return c.add(u).catch(function () {}); }));
        });
      })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  if (req.mode === "navigate") {                       // HTML : réseau d'abord
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (r) { return r || caches.match("./index.html"); });
        })
    );
    return;
  }

  e.respondWith(                                       // Assets : cache d'abord
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      });
    })
  );
});
