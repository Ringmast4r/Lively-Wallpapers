/** Easing utilities. Port of web-tracker/src/lib/eyes/easing.ts. */

(function (Iris) {
  "use strict";

  Iris.easeInOutCubic = function (t) {
    if (t < 0.5) {
      return 4.0 * t * t * t;
    }
    return 1.0 - Math.pow(-2.0 * t + 2.0, 3) / 2.0;
  };
})((window.Iris = window.Iris || {}));
