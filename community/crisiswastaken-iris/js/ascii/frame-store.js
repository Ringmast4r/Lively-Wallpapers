/**
 * Load ANSI frames for all eye states.
 * Port of web-tracker/src/lib/ascii/frame-store.ts.
 *
 * The web version fetches all sixteen over HTTP. Here they are JavaScript files
 * that assign into `window.IRIS_ANSI` — the one way to read ~17 MB of local text
 * that Lively's WebView2 player does not block as a cross-origin request.
 *
 * They are injected on demand rather than sitting in index.html: the wallpaper
 * may well spend its whole life in PNG mode, and 17 MB of string literals is not
 * something to parse for nothing.
 */

(function (Iris) {
  "use strict";

  var states = Iris.states;

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = url;
      script.async = false;
      script.onload = function () {
        resolve();
      };
      script.onerror = function () {
        reject(
          new Error(
            "Failed to load " + url + " — run `node scripts/build-assets.mjs`.",
          ),
        );
      };
      document.head.appendChild(script);
    });
  }

  /** Pull in every frame script that is not already in the registry. */
  function ensureAnsiLoaded(onProgress) {
    var base = Iris.config.ANSI_ASSET_BASE;
    var keys = states.ALL_KEYS;
    var total = keys.length;
    var loaded = 0;

    return Promise.all(
      keys.map(function (key) {
        var already = window.IRIS_ANSI && window.IRIS_ANSI[key];
        var pending = already
          ? Promise.resolve()
          : loadScript(base + "/" + key + ".js");
        return pending.then(function () {
          loaded += 1;
          if (onProgress) {
            onProgress(loaded, total);
          }
        });
      }),
    );
  }

  function FrameStore() {
    this.gazeFrames = {};
    this.blinkFrames = {};
    this.expressionFrames = {};
    this.rows = 0;
    this.cols = 0;
  }

  function buildStore() {
    var keys = states.ALL_KEYS;
    var byKey = {};
    for (var i = 0; i < keys.length; i += 1) {
      byKey[keys[i]] = Iris.ascii.readAnsi(keys[i]);
    }

    var store = new FrameStore();

    // Gaze frames define the reference shape; everything else must match it.
    var reference = byKey[states.GAZE_KEYS[0]];
    store.rows = reference.rows;
    store.cols = reference.cols;

    for (var k = 0; k < keys.length; k += 1) {
      var grid = byKey[keys[k]];
      if (grid.rows !== store.rows || grid.cols !== store.cols) {
        throw new Error(
          "Frame " +
            keys[k] +
            " has shape " +
            grid.rows +
            "x" +
            grid.cols +
            ", expected " +
            store.rows +
            "x" +
            store.cols,
        );
      }
    }

    states.GAZE_KEYS.forEach(function (key) {
      store.gazeFrames[key] = byKey[key];
    });
    states.BLINK_KEYS.forEach(function (key) {
      store.blinkFrames[key] = byKey[key];
    });
    states.EXPRESSION_KEYS.forEach(function (key) {
      store.expressionFrames[key] = byKey[key];
    });

    return store;
  }

  FrameStore.load = function (onProgress) {
    return ensureAnsiLoaded(onProgress).then(buildStore);
  };

  Iris.ascii = Iris.ascii || {};
  Iris.ascii.FrameStore = FrameStore;
})((window.Iris = window.Iris || {}));
