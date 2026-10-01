/**
 * Load the WebP eye frames.
 * Port of web-tracker/src/lib/png/image-store.ts.
 *
 * The web version fetches each frame and hands the blob to `createImageBitmap`
 * so decoding lands off the main thread. That path is unavailable here: Lively's
 * WebView2 player gives every local file its own opaque origin, so `fetch()` on a
 * `file://` URL fails CORS. `<img>` has no such restriction, and `decode()` still
 * keeps the decode off the critical path.
 *
 * The images stay cross-origin, so anything they are drawn into is tainted. That
 * is harmless here — the pipeline only ever calls `drawImage`, never
 * `getImageData`.
 */

(function (Iris) {
  "use strict";

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        // `decode()` is the polite path, but it rejects on some engines for
        // images that have already loaded fine. The onload is the real signal.
        if (typeof img.decode === "function") {
          img.decode().then(
            function () {
              resolve(img);
            },
            function () {
              resolve(img);
            },
          );
          return;
        }
        resolve(img);
      };
      img.onerror = function () {
        reject(
          new Error(
            "Failed to load frame: " +
              url +
              " — run `node scripts/build-assets.mjs`.",
          ),
        );
      };
      img.src = url;
    });
  }

  function loadFrameImages(basePath, onProgress) {
    basePath = basePath || Iris.config.PNG_ASSET_BASE;

    var keys = Iris.states.ALL_KEYS;
    var total = keys.length;
    var loaded = 0;

    return Promise.all(
      keys.map(function (key) {
        return loadImage(basePath + "/" + key + ".webp").then(function (img) {
          loaded += 1;
          if (onProgress) {
            onProgress(loaded, total);
          }
          return [key, img];
        });
      }),
    ).then(function (entries) {
      return new Map(entries);
    });
  }

  Iris.png = Iris.png || {};
  Iris.png.loadFrameImages = loadFrameImages;
})((window.Iris = window.Iris || {}));
