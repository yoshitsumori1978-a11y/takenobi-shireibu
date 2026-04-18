// タケノビファミリー司令部 — Service Worker
var CACHE_NAME = 'takenobi-shireibu-v7';
var URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// インストール時にキャッシュ
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 古いキャッシュの削除
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// キャッシュ優先 → バックグラウンドで更新（Stale While Revalidate）
self.addEventListener('fetch', function(event) {
  // Google API・外部CDNはキャッシュしない
  if (event.request.url.indexOf('googleapis.com') >= 0 ||
      event.request.url.indexOf('accounts.google.com') >= 0 ||
      event.request.url.indexOf('cdn.jsdelivr.net') >= 0) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      // バックグラウンドで最新版を取得してキャッシュ更新
      var fetchPromise = fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function() {
        return cachedResponse;
      });

      // キャッシュがあればすぐ返す、なければネットワークを待つ
      return cachedResponse || fetchPromise;
    })
  );
});
