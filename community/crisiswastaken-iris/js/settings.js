/**
 * The bridge between Lively's Customise pane and the eyes.
 *
 * Lively calls `livelyPropertyListener(name, value)` once per property when the
 * page loads — replaying whatever the user last saved — and again on every
 * change. The keys here must match LivelyProperties.json exactly.
 *
 * Two settings the web app models as `null` have no null in Lively's property
 * types, so each gets a companion checkbox: `tintEnabled` stands in for
 * `hue === null` (no tint filter) and `glowAuto` for `glow === null` (use the
 * render mode's own GLOW_STRENGTH).
 */

(function (Iris) {
  "use strict";

  var config = Iris.config;

  var FPS_CAPS = [30, 60, 0];
  var MODES = ["ascii", "png"];

  function Settings(eyes, dom) {
    this.eyes = eyes;
    this.stage = dom.stage;
    this.funcR = dom.funcR;
    this.funcG = dom.funcG;
    this.funcB = dom.funcB;

    // Defaults mirror LivelyProperties.json, so the wallpaper looks right even
    // if Lively never calls us (a plain browser preview, say).
    this.tintEnabled = false;
    this.tintHue = 0;
    this.tintStrength = 0.85;
    this.glowAuto = true;
    this.glowValue = 1;
    this._trackMouse = true;
    this._trackWebcam = false;
  }

  Settings.prototype._syncTrackingMode = function () {
    if (this._trackWebcam) {
      this.eyes.setTrackWebcam(true);
      return;
    }
    this.eyes.setTrackWebcam(false);
    this.eyes.setTrackPointer(this._trackMouse);
  };

  Settings.prototype.apply = function (name, value) {
    switch (name) {
      case "renderMode":
        this.eyes.setMode(MODES[Number(value)] || "ascii");
        break;

      case "scale":
        this.stage.style.setProperty(
          "--eye-size",
          String(clamp(Number(value) / 100, config.SIZE_MIN, config.SIZE_MAX)),
        );
        break;

      case "tintEnabled":
        this.tintEnabled = !!value;
        this._applyTint();
        break;

      case "tintColor":
        this.tintHue = Iris.hexToHue(value);
        this._applyTint();
        break;

      case "tintStrength":
        this.tintStrength = clamp(Number(value) / 100, 0, 1);
        this._applyTint();
        break;

      case "glowAuto":
        this.glowAuto = !!value;
        this._applyGlow();
        break;

      case "glow":
        this.glowValue = Math.max(0, Number(value) / 100);
        this._applyGlow();
        break;

      case "fpsCap":
        this.eyes.fpsCap = FPS_CAPS[Number(value)] || 0;
        break;

      case "trackMouse":
        this._trackMouse = !!value;
        if (this._trackMouse) {
          this._trackWebcam = false;
        }
        this._syncTrackingMode();
        break;

      case "trackWebcam":
        this._trackWebcam = !!value;
        if (this._trackWebcam) {
          this._trackMouse = false;
        }
        this._syncTrackingMode();
        break;

      case "autoBlink":
        this.eyes.autoBlink = !!value;
        break;

      case "idleDrowsySec":
        // 0 means never — the behavior machine reads it that way.
        this.eyes.setIdleDrowsyMs(Math.max(0, Number(value)) * 1000);
        break;

      default:
        // A label, or a property added to the JSON but not yet handled here.
        break;
    }
  };

  Settings.prototype._applyGlow = function () {
    this.eyes.glow = this.glowAuto ? null : this.glowValue;
  };

  /**
   * Recoloring canvas art with `hue-rotate` rotates whatever hue is already in
   * the source, so the result drifts with the artwork. This does it properly:
   * drop to luminance, then remap that luminance through a per-channel transfer
   * table. Port of web-tracker/src/components/TintFilter.tsx.
   *
   * The table has three stops — black, the chosen color, white — so shadows stay
   * black (the canvas background is black, and the in-canvas bloom composites
   * with `lighter`, so anything else would fog the whole frame) and the hottest
   * cores still blow out to white, which is what makes the eyes read as embers
   * rather than as flat colored text.
   */
  Settings.prototype._applyTint = function () {
    if (!this.tintEnabled) {
      // Swapping the canvas filter wholesale — rather than layering the tint on
      // top of the stock amber-to-red stack — keeps the untinted wallpaper
      // pixel-identical to the untinted web page.
      this.stage.style.removeProperty("--eye-filter");
      return;
    }

    var rgb = Iris.hueToRgb01(this.tintHue);
    var strength = this.tintStrength;
    // Pull the mid stop toward 0.5 — the neutral gray — as strength drops.
    var mid = function (c) {
      return (0.5 + (c - 0.5) * strength).toFixed(4);
    };

    this.funcR.setAttribute("tableValues", "0 " + mid(rgb[0]) + " 1");
    this.funcG.setAttribute("tableValues", "0 " + mid(rgb[1]) + " 1");
    this.funcB.setAttribute("tableValues", "0 " + mid(rgb[2]) + " 1");

    this.stage.style.setProperty(
      "--eye-filter",
      "contrast(1.08) url(#eye-tint)",
    );
  };

  function clamp(value, min, max) {
    if (!isFinite(value)) {
      return min;
    }
    return Math.max(min, Math.min(max, value));
  }

  Iris.Settings = Settings;
})((window.Iris = window.Iris || {}));
