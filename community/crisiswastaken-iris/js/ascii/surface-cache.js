/**
 * Bilinear gaze blending over the pre-rasterized ANSI grid frames.
 * Port of web-tracker/src/lib/ascii/surface-cache.ts.
 *
 * This stays a near-twin of js/png/surface-cache.js on purpose: upstream keeps
 * the two apart (they descend from separate files in user-tracker), and holding
 * the same shape here means a change on either side ports across one-for-one.
 *
 * Returned surfaces are internal scratch buffers, valid only until the next
 * call — draw them straight to the screen, do not hold on to them.
 */

(function (Iris) {
  "use strict";

  var config = Iris.config;
  var gazeMap = Iris.gazeMap;
  var GRID_COLS = gazeMap.GRID_COLS;
  var GRID_ROWS = gazeMap.GRID_ROWS;

  function AsciiSurfaceCache(renderer, store) {
    this._renderer = renderer;
    this._store = store;
    this.size = [renderer.outputW, renderer.outputH];

    var w = renderer.outputW;
    var h = renderer.outputH;
    this._surfaces = new Map();
    this._rowScratch = [];
    for (var i = 0; i < GRID_ROWS; i += 1) {
      this._rowScratch.push(Iris.createSurface(w, h));
    }
    this._gazeScratch = Iris.createSurface(w, h);
    this._exprScratch = Iris.createSurface(w, h);
    this._finalScratch = Iris.createSurface(w, h);
    this._frameKey = null;

    this._buildCache();
  }

  AsciiSurfaceCache.prototype._buildCache = function () {
    var self = this;
    function rasterize(prefix, frames) {
      Object.keys(frames).forEach(function (key) {
        self._surfaces.set(
          prefix + ":" + key,
          self._renderer.rasterizeToSurface(frames[key]),
        );
      });
    }
    rasterize("gaze", this._store.gazeFrames);
    rasterize("blink", this._store.blinkFrames);
    rasterize("expr", this._store.expressionFrames);
  };

  AsciiSurfaceCache.prototype._surfaceAt = function (col, row) {
    var key = gazeMap.gridCell(col, row);
    if (key === null) {
      return null;
    }
    return this._surfaces.get("gaze:" + key) || null;
  };

  /** Blend along one grid row. May return a cached frame rather than scratch. */
  AsciiSurfaceCache.prototype._lerpRow = function (row, colF) {
    var i0 = Math.max(0, Math.min(GRID_COLS - 2, Math.floor(colF)));
    var wx = colF - i0;

    var s0 = this._surfaceAt(i0, row);
    var s1 = this._surfaceAt(i0 + 1, row);

    if (s0 === null && s1 === null) {
      return this._surfaces.get("gaze:center");
    }
    if (s0 === null) {
      return s1;
    }
    if (s1 === null) {
      return s0;
    }
    // Sitting on a grid column: hand back the frame rather than blending it.
    if (wx <= config.BLEND_EPS) {
      return s0;
    }
    if (wx >= 1 - config.BLEND_EPS) {
      return s1;
    }
    return Iris.lerpInto(s0, s1, wx, this._rowScratch[row]);
  };

  AsciiSurfaceCache.prototype._gazeInto = function (gazeX, gazeY, out) {
    var cx = Math.max(-1, Math.min(1, gazeX));
    var cy = Math.max(-1, Math.min(1, gazeY));

    var colF = ((cx + 1) * (GRID_COLS - 1)) / 2;
    var rowF = ((cy + 1) * (GRID_ROWS - 1)) / 2;

    var j0 = Math.max(0, Math.min(GRID_ROWS - 2, Math.floor(rowF)));
    var wy = rowF - j0;

    // Sitting on a grid row: only one row blend is needed.
    if (wy <= config.BLEND_EPS) {
      return this._copyInto(this._lerpRow(j0, colF), out);
    }
    if (wy >= 1 - config.BLEND_EPS) {
      return this._copyInto(this._lerpRow(j0 + 1, colF), out);
    }

    var top = this._lerpRow(j0, colF);
    var bot = this._lerpRow(j0 + 1, colF);
    return Iris.lerpInto(top, bot, wy, out);
  };

  AsciiSurfaceCache.prototype._copyInto = function (source, out) {
    var ctx = out.getContext("2d");
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, out.width, out.height);
    ctx.drawImage(source, 0, 0, out.width, out.height);
    return out;
  };

  AsciiSurfaceCache.prototype._overlaySurface = function (key) {
    if (key in this._store.blinkFrames) {
      return this._surfaces.get("blink:" + key) || null;
    }
    if (key in this._store.expressionFrames) {
      return this._surfaces.get("expr:" + key) || null;
    }
    return null;
  };

  AsciiSurfaceCache.prototype.getGazeSurface = function (gazeX, gazeY) {
    this._frameKey = null;
    return this._gazeInto(gazeX, gazeY, this._gazeScratch);
  };

  AsciiSurfaceCache.prototype.getExpressionSurface = function (
    gazeX,
    gazeY,
    overlayKey,
    overlayWeight,
  ) {
    overlayKey = overlayKey === undefined ? null : overlayKey;
    overlayWeight = overlayWeight === undefined ? 0 : overlayWeight;

    var overlay = overlayKey === null ? null : this._overlaySurface(overlayKey);

    if (overlay === null || overlayWeight <= 0) {
      return this._gazeInto(gazeX, gazeY, this._exprScratch);
    }
    if (overlayWeight >= 1) {
      return this._copyInto(overlay, this._exprScratch);
    }
    var gaze = this._gazeInto(gazeX, gazeY, this._gazeScratch);
    return Iris.lerpInto(gaze, overlay, overlayWeight, this._exprScratch);
  };

  AsciiSurfaceCache.prototype.getBlinkSurface = function (key) {
    return this._surfaces.get("blink:" + key);
  };

  AsciiSurfaceCache.prototype.blendSurfaces = function (a, b, t) {
    this._frameKey = null;
    return Iris.lerpInto(a, b, t, this._finalScratch);
  };

  AsciiSurfaceCache.prototype.renderFrame = function (
    gazeX,
    gazeY,
    overlayKey,
    overlayWeight,
  ) {
    overlayKey = overlayKey === undefined ? null : overlayKey;
    overlayWeight = overlayWeight === undefined ? 0 : overlayWeight;

    var key =
      gazeX.toFixed(3) +
      "|" +
      gazeY.toFixed(3) +
      "|" +
      overlayKey +
      "|" +
      overlayWeight.toFixed(3);
    if (key === this._frameKey) {
      return this._finalScratch;
    }
    this._frameKey = null;

    var overlay = overlayKey === null ? null : this._overlaySurface(overlayKey);

    if (overlay === null || overlayWeight <= 0) {
      this._gazeInto(gazeX, gazeY, this._finalScratch);
    } else if (overlayWeight >= 1) {
      this._copyInto(overlay, this._finalScratch);
    } else {
      var gaze = this._gazeInto(gazeX, gazeY, this._gazeScratch);
      Iris.lerpInto(gaze, overlay, overlayWeight, this._finalScratch);
    }

    this._frameKey = key;
    return this._finalScratch;
  };

  AsciiSurfaceCache.prototype.dispose = function () {
    this._surfaces.clear();
    this._frameKey = null;
  };

  /** Parse the ANSI frames, rasterize them, and hand back a ready provider. */
  function createAsciiProvider(size, onProgress) {
    return Iris.ascii.FrameStore.load(onProgress).then(function (store) {
      var renderer = new Iris.ascii.AsciiRenderer(store.rows, store.cols, [
        size[0],
        size[1],
      ]);
      return renderer.ensureFont().then(function () {
        return new AsciiSurfaceCache(renderer, store);
      });
    });
  }

  Iris.ascii = Iris.ascii || {};
  Iris.ascii.AsciiSurfaceCache = AsciiSurfaceCache;
  Iris.ascii.createAsciiProvider = createAsciiProvider;
})((window.Iris = window.Iris || {}));
