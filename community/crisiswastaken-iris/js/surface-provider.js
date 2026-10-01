/**
 * The seam between the transition controller and a render mode.
 * Port of web-tracker/src/lib/eyes/surface-provider.ts.
 *
 * A provider exposes `getGazeSurface`, `getExpressionSurface`,
 * `getBlinkSurface`, `blendSurfaces`, `renderFrame`, `size`, and `dispose`.
 * Gaze is a point in a (-1..1, -1..1) field and every frame is a fresh bilinear
 * blend of the four surrounding grid frames, whatever the frames happen to be
 * made of.
 *
 * `getExpressionSurface` is `renderFrame` written to its own scratch buffer, so
 * it can be handed straight to `blendSurfaces` without aliasing that call's
 * output — which is what lets a blink depart from an expression.
 *
 * Implementations return **internal scratch buffers**, valid only until the
 * next call. Draw them immediately; never hold on to one.
 */

(function (Iris) {
  "use strict";

  /** Alpha-blend `a` → `b` at weight `t` into the scratch canvas `out`. */
  function lerpInto(a, b, t, out) {
    var ctx = out.getContext("2d");
    var ti = Math.round(Math.max(0, Math.min(1, t)) * 255);

    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, out.width, out.height);

    if (ti >= 255) {
      ctx.drawImage(b, 0, 0, out.width, out.height);
      return out;
    }

    ctx.drawImage(a, 0, 0, out.width, out.height);
    if (ti <= 0) {
      return out;
    }

    ctx.globalAlpha = ti / 255;
    ctx.drawImage(b, 0, 0, out.width, out.height);
    ctx.globalAlpha = 1;
    return out;
  }

  /** A canvas sized for one full frame. */
  function createSurface(width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  Iris.lerpInto = lerpInto;
  Iris.createSurface = createSurface;
})((window.Iris = window.Iris || {}));
