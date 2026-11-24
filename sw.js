/* Nhật ký Đà Lạt — chạy được khi không có mạng.
   Khung trang nạp sẵn lúc cài; ảnh lưu lại dần khi xem qua. */
var V = "dalat-v1";
var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(V).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: "reload" })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return k === V ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  // Mở app: luôn ưu tiên bản đã lưu, không có mạng vẫn vào được
  if (req.mode === "navigate") {
    e.respondWith(
      caches.match("./index.html").then(function (hit) {
        return hit || fetch(req).catch(function () { return caches.match("./"); });
      })
    );
    return;
  }

  // Mọi thứ còn lại, kể cả ảnh trên Blogspot: có trong kho thì lấy ra,
  // chưa có thì tải về rồi giữ lại cho lần sau
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) {
          var copy = res.clone();
          caches.open(V).then(function (c) { c.put(req, copy).catch(function () {}); });
        }
        return res;
      });
    })
  );
});
