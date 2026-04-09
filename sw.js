// タケノビファミリー司令部 — Service Worker
var CACHE_NAME = 'takenobi-shireibu-v2';
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

// ネットワーク優先、失敗時にキャッシュ（常に最新を取得しつつオフライン対応）
self.addEventListener('fetch', function(event) {
  // Google API・外部CDNはキャッシュしない
  if (event.request.url.indexOf('googleapis.com') >= 0 ||
      event.request.url.indexOf('accounts.google.com') >= 0 ||
      event.request.url.indexOf('cdn.jsdelivr.net') >= 0) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(function(response) {
      // 正常レスポンスをキャッシュに保存
      if (response && response.status === 200) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function() {
      // オフライン時はキャッシュから返す
      return caches.match(event.request);
    })
  );
});
