/**
 * Bilinear gaze blending over the photographic eye frames.
 * Port of web-tracker/src/lib/png/surface-cache.ts.
 *
 * Same grid, same fast paths, same frame memo as the ASCII cache, just with
 * images instead of glyphs. Blending runs at the provider's own size rather than
 * the source 1280x720: the frame is scaled to the canvas anyway, so there is
 * nothing to gain from blending four full-resolution frames every tick.
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

  var BLINK_KEYS = Iris.states.BLINK_KEYS;
  var EXPRESSION_KEYS = Iris.states.EXPRESSION_KEYS;

  function PngSurfaceCache(images, size) {
    this.size = size;

    var w = size[0];
    var h = size[1];
    this._rowScratch = [];
    for (var i = 0; i < GRID_ROWS; i += 1) {
      this._rowScratch.push(Iris.createSurface(w, h));
    }
    this._gazeScratch = Iris.createSurface(w, h);
    this._exprScratch = Iris.createSurface(w, h);
    this._finalScratch = Iris.createSurface(w, h);
    this._frameKey = null;

    /** Frames pre-scaled to the working size so no tick pays for a downscale. */
    this._scaled = new Map();
    images.forEach(function (image, key) {
      var canvas = Iris.createSurface(w, h);
      var ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, w, h);
      this._scaled.set(key, canvas);
    }, this);
  }

  PngSurfaceCache.load = function (size, onProgress) {
    return Iris.png
      .loadFrameImages(undefined, onProgress)
      .then(function (images) {
        return new PngSurfaceCache(images, size);
      });
  };

  PngSurfaceCache.prototype._frame = function (key) {
    return this._scaled.get(key);
  };

  PngSurfaceCache.prototype._surfaceAt = function (col, row) {
    var key = gazeMap.gridCell(col, row);
    return key === null ? null : this._frame(key);
  };

  /** Blend along one grid row. May return a cached frame rather than scratch. */
  PngSurfaceCache.prototype._lerpRow = function (row, colF) {
    var i0 = Math.max(0, Math.min(GRID_COLS - 2, Math.floor(colF)));
    var wx = colF - i0;

    var s0 = this._surfaceAt(i0, row);
    var s1 = this._surfaceAt(i0 + 1, row);

    if (s0 === null && s1 === null) {
      return this._frame("center");
    }
    if (s0 === null) {
      return s1;
    }
    if (s1 === null) {
      return s0;
    }
    if (wx <= config.BLEND_EPS) {
      return s0;
    }
    if (wx >= 1 - config.BLEND_EPS) {
      return s1;
    }
    return Iris.lerpInto(s0, s1, wx, this._rowScratch[row]);
  };

  PngSurfaceCache.prototype._gazeInto = function (gazeX, gazeY, out) {
    var cx = Math.max(-1, Math.min(1, gazeX));
    var cy = Math.max(-1, Math.min(1, gazeY));

    var colF = ((cx + 1) * (GRID_COLS - 1)) / 2;
    var rowF = ((cy + 1) * (GRID_ROWS - 1)) / 2;

    var j0 = Math.max(0, Math.min(GRID_ROWS - 2, Math.floor(rowF)));
    var wy = rowF - j0;

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

  PngSurfaceCache.prototype._copyInto = function (source, out) {
    var ctx = out.getContext("2d");
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, out.width, out.height);
    ctx.drawImage(source, 0, 0, out.width, out.height);
    return out;
  };

  PngSurfaceCache.prototype.getGazeSurface = function (gazeX, gazeY) {
    this._frameKey = null;
    return this._gazeInto(gazeX, gazeY, this._gazeScratch);
  };

  PngSurfaceCache.prototype.getExpressionSurface = function (
    gazeX,
    gazeY,
    overlayKey,
    overlayWeight,
  ) {
    overlayKey = overlayKey === undefined ? null : overlayKey;
    overlayWeight = overlayWeight === undefined ? 0 : overlayWeight;

    var isOverlay =
      overlayKey !== null &&
      (BLINK_KEYS.indexOf(overlayKey) !== -1 ||
        EXPRESSION_KEYS.indexOf(overlayKey) !== -1);

    if (!isOverlay || overlayWeight <= 0) {
      return this._gazeInto(gazeX, gazeY, this._exprScratch);
    }
    if (overlayWeight >= 1) {
      return this._copyInto(this._frame(overlayKey), this._exprScratch);
    }
    var gaze = this._gazeInto(gazeX, gazeY, this._gazeScratch);
    return Iris.lerpInto(
      gaze,
      this._frame(overlayKey),
      overlayWeight,
      this._exprScratch,
    );
  };

  PngSurfaceCache.prototype.getBlinkSurface = function (key) {
    return this._frame(key);
  };

  PngSurfaceCache.prototype.blendSurfaces = function (a, b, t) {
    this._frameKey = null;
    return Iris.lerpInto(a, b, t, this._finalScratch);
  };

  PngSurfaceCache.prototype.renderFrame = function (
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

    var isOverlay =
      overlayKey !== null &&
      (BLINK_KEYS.indexOf(overlayKey) !== -1 ||
        EXPRESSION_KEYS.indexOf(overlayKey) !== -1);

    if (!isOverlay || overlayWeight <= 0) {
      this._gazeInto(gazeX, gazeY, this._finalScratch);
    } else if (overlayWeight >= 1) {
      this._copyInto(this._frame(overlayKey), this._finalScratch);
    } else {
      var gaze = this._gazeInto(gazeX, gazeY, this._gazeScratch);
      Iris.lerpInto(
        gaze,
        this._frame(overlayKey),
        overlayWeight,
        this._finalScratch,
      );
    }

    this._frameKey = key;
    return this._finalScratch;
  };

  PngSurfaceCache.prototype.dispose = function () {
    // Nothing to close: these are <img> elements and plain canvases, not
    // ImageBitmaps, so the GC handles them.
    this._scaled.clear();
    this._frameKey = null;
  };

  Iris.png = Iris.png || {};
  Iris.png.PngSurfaceCache = PngSurfaceCache;
})((window.Iris = window.Iris || {}));
