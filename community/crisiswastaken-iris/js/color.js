/**
 * Port of web-tracker/src/lib/color.ts, plus the reverse direction.
 *
 * Lively's Customise pane offers a color picker, not the web app's hue wheel, so
 * the wallpaper receives `#RRGGBB` where the web version had a hue in degrees.
 * `hexToHue` closes that gap; everything downstream still works in hue.
 */

(function (Iris) {
  "use strict";

  /**
   * Hue in degrees to a fully saturated RGB triple in 0–1, i.e. `hsl(h, 100%, 50%)`.
   * The tint filter needs the channels as floats, not as a CSS string, so this
   * skips the usual 0–255 round trip.
   */
  function hueToRgb01(hue) {
    var h = ((hue % 360) + 360) % 360;
    var sector = h / 60;
    var x = 1 - Math.abs((sector % 2) - 1);

    if (sector < 1) return [1, x, 0];
    if (sector < 2) return [x, 1, 0];
    if (sector < 3) return [0, 1, x];
    if (sector < 4) return [0, x, 1];
    if (sector < 5) return [x, 0, 1];
    return [1, 0, x];
  }

  /**
   * `#RRGGBB` to a hue in degrees. Only the hue survives: saturation and
   * lightness are discarded, exactly as the hue wheel discarded them. A gray
   * swatch has no hue at all, so it falls back to 0 (red), the wheel's own
   * resting value.
   */
  function hexToHue(hex) {
    var match = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!match) {
      return 0;
    }
    var value = parseInt(match[1], 16);
    var r = ((value >> 16) & 255) / 255;
    var g = ((value >> 8) & 255) / 255;
    var b = (value & 255) / 255;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    if (delta === 0) {
      return 0;
    }

    var hue;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }

    return ((hue * 60) % 360 + 360) % 360;
  }

  Iris.hueToRgb01 = hueToRgb01;
  Iris.hexToHue = hexToHue;
})((window.Iris = window.Iris || {}));
