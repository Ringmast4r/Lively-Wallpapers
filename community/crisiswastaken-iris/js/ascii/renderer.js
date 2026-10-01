/**
 * Canvas renderer for ANSI grids.
 * Port of web-tracker/src/lib/ascii/renderer.ts.
 *
 * "Courier New" ships with Windows, so unlike the web version there is nothing
 * to wait on — but `ensureFont` is kept so the boot sequence reads the same and
 * the first rasterize never races a font swap.
 */

(function (Iris) {
  "use strict";

  var config = Iris.config;
  var FONT_FAMILY = '"Courier New", Courier, monospace';

  function buildBrightnessLut() {
    var lut = new Uint8Array(256);
    for (var i = 0; i < 256; i += 1) {
      var adjusted =
        Math.pow(i / 255.0, config.ASCII_BRIGHTNESS_GAMMA) *
        255.0 *
        config.ASCII_BRIGHTNESS_GAIN;
      lut[i] = Math.min(255, Math.max(0, Math.round(adjusted)));
    }
    return lut;
  }

  function AsciiRenderer(rows, cols, outputSize, fontSize) {
    fontSize = fontSize === undefined ? config.ASCII_FONT_SIZE : fontSize;

    this.rows = rows;
    this.cols = cols;
    this.fontSize = fontSize;
    this.outputW = outputSize[0];
    this.outputH = outputSize[1];
    this.cellW = Math.max(1, Math.round(fontSize / config.ASCII_CHAR_RATIO));
    this.cellH = fontSize;
    this.gridW = cols * this.cellW;
    this.gridH = rows * this.cellH;

    this._lut = buildBrightnessLut();
    this._glyphCache = new Map();
    this._tintCache = new Map();
    this._fontReady = false;

    this._gridCanvas = document.createElement("canvas");
    this._gridCanvas.width = this.gridW;
    this._gridCanvas.height = this.gridH;
    this._gridCtx = this._gridCanvas.getContext("2d");
  }

  AsciiRenderer.prototype.ensureFont = function () {
    var self = this;
    if (this._fontReady) {
      return Promise.resolve();
    }
    if (typeof document !== "undefined" && document.fonts) {
      return document.fonts
        .load("bold " + this.fontSize + "px " + FONT_FAMILY)
        .then(function () {
          return document.fonts.ready;
        })
        .then(function () {
          self._fontReady = true;
        });
    }
    this._fontReady = true;
    return Promise.resolve();
  };

  AsciiRenderer.prototype.newSurface = function () {
    return Iris.createSurface(this.outputW, this.outputH);
  };

  AsciiRenderer.prototype._getGlyph = function (char) {
    var cached = this._glyphCache.get(char);
    if (cached) {
      return cached;
    }

    var canvas = document.createElement("canvas");
    canvas.width = this.cellW;
    canvas.height = this.cellH;
    var ctx = canvas.getContext("2d");
    ctx.font = "bold " + this.fontSize + "px " + FONT_FAMILY;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(char, 0, 0);

    this._glyphCache.set(char, canvas);
    return canvas;
  };

  AsciiRenderer.prototype._getTintedGlyph = function (char, r, g, b) {
    var key = char + ":" + r + "," + g + "," + b;
    var cached = this._tintCache.get(key);
    if (cached) {
      return cached;
    }

    var base = this._getGlyph(char);
    var canvas = document.createElement("canvas");
    canvas.width = this.cellW;
    canvas.height = this.cellH;
    var ctx = canvas.getContext("2d");

    ctx.drawImage(base, 0, 0);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
    ctx.fillRect(0, 0, this.cellW, this.cellH);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(base, 0, 0);
    ctx.globalCompositeOperation = "source-over";

    this._tintCache.set(key, canvas);
    return canvas;
  };

  AsciiRenderer.prototype.rasterizeToSurface = function (grid) {
    var ctx = this._gridCtx;
    var bg = config.ASCII_BG;
    var threshold = config.ASCII_DARK_THRESHOLD;

    ctx.fillStyle = "rgb(" + bg.r + "," + bg.g + "," + bg.b + ")";
    ctx.fillRect(0, 0, this.gridW, this.gridH);

    for (var row = 0; row < this.rows; row += 1) {
      var y = row * this.cellH;
      var charRow = grid.chars[row];
      var colorRow = grid.colors[row];
      for (var col = 0; col < this.cols; col += 1) {
        var ch = charRow[col];
        if (ch === " ") {
          continue;
        }
        var color = colorRow[col];
        var r = color[0];
        var g = color[1];
        var b = color[2];
        if (r < threshold && g < threshold && b < threshold) {
          continue;
        }
        var tinted = this._getTintedGlyph(
          ch,
          this._lut[r],
          this._lut[g],
          this._lut[b],
        );
        ctx.drawImage(tinted, col * this.cellW, y);
      }
    }

    var output = this.newSurface();
    var outCtx = output.getContext("2d");
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = "high";
    outCtx.drawImage(this._gridCanvas, 0, 0, this.outputW, this.outputH);
    return output;
  };

  Iris.ascii = Iris.ascii || {};
  Iris.ascii.AsciiRenderer = AsciiRenderer;
})((window.Iris = window.Iris || {}));
