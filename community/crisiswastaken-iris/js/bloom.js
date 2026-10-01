/**
 * Additive bloom for the eye canvas.
 * Port of web-tracker/src/lib/eyes/bloom.ts.
 *
 * The frames sit on opaque black, so a CSS `drop-shadow` has a solid rectangle
 * to work with and glows nothing. Compositing blurred copies back over the frame
 * with `lighter` gives a real bloom instead: black adds zero, so only the lit
 * glyphs throw light.
 *
 * Both tiers are blurred at a fraction of the frame size and scaled back up — an
 * eighth-size blur costs almost nothing and reads softer than a full-size one,
 * which is the usual trade in a bloom pass.
 */

(function (Iris) {
  "use strict";

  /**
   * A tight halo that hugs the strokes, then a wide atmospheric spill.
   *
   * The tight tier is kept near full resolution on purpose: sampled any coarser,
   * it stops tracing the glyphs and starts filling the gaps between them, and the
   * ASCII texture dissolves into a solid blob. The wide tier is where the actual
   * glow comes from — it is diffuse enough to spill light without closing those
   * gaps.
   */
  var TIERS = [
    { divisor: 2, blurPx: 2, alpha: 0.28 },
    { divisor: 8, blurPx: 12, alpha: 0.55 },
  ];

  function Bloom(width, height) {
    this._width = width;
    this._height = height;
    this._layers = TIERS.map(function (tier) {
      return Iris.createSurface(
        Math.max(1, Math.round(width / tier.divisor)),
        Math.max(1, Math.round(height / tier.divisor)),
      );
    });
  }

  /**
   * Read the already-drawn frame off `ctx`'s own canvas and add the glow on top.
   * Call this after the frame (and any crossfade) has been composited.
   */
  Bloom.prototype.apply = function (ctx, strength) {
    if (strength <= 0) {
      return;
    }

    // Chain the downsamples: each tier feeds the next, so the wide tier is
    // already smooth before it is blurred.
    var previous = ctx.canvas;
    for (var i = 0; i < this._layers.length; i += 1) {
      var layer = this._layers[i];
      var layerCtx = layer.getContext("2d");
      layerCtx.globalAlpha = 1;
      layerCtx.globalCompositeOperation = "source-over";
      layerCtx.clearRect(0, 0, layer.width, layer.height);
      layerCtx.drawImage(previous, 0, 0, layer.width, layer.height);
      previous = layer;
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var j = 0; j < this._layers.length; j += 1) {
      var tier = TIERS[j];
      ctx.globalAlpha = Math.min(1, tier.alpha * strength);
      ctx.filter = "blur(" + tier.blurPx + "px)";
      ctx.drawImage(this._layers[j], 0, 0, this._width, this._height);
    }
    ctx.restore();
  };

  Iris.Bloom = Bloom;
})((window.Iris = window.Iris || {}));
