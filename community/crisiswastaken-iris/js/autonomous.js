/**
 * Autonomous blink scheduling.
 * Port of web-tracker/src/lib/eyes/autonomous.ts.
 *
 * Idle and pointer-driven behavior lives in interaction.js; this only decides
 * when the eyes blink on their own.
 */

(function (Iris) {
  "use strict";

  var config = Iris.config;

  function randomBlinkIntervalMs() {
    var minSteps = Math.floor(
      config.BLINK_INTERVAL_MIN_S / config.BLINK_INTERVAL_STEP_S,
    );
    var maxSteps = Math.floor(
      config.BLINK_INTERVAL_MAX_S / config.BLINK_INTERVAL_STEP_S,
    );
    var steps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
    return Math.floor(steps * config.BLINK_INTERVAL_STEP_S * 1000);
  }

  function AutoBlink() {
    this._elapsedMs = 0;
    this._nextBlinkMs = randomBlinkIntervalMs();
  }

  AutoBlink.prototype.reset = function () {
    this._elapsedMs = 0;
    this._nextBlinkMs = randomBlinkIntervalMs();
  };

  AutoBlink.prototype.update = function (dtMs, controller) {
    if (controller.blinkRunning || controller.isBusy) {
      return;
    }

    this._elapsedMs += dtMs;
    if (this._elapsedMs < this._nextBlinkMs) {
      return;
    }

    if (controller.startBlink()) {
      this.reset();
    }
  };

  Iris.AutoBlink = AutoBlink;
})((window.Iris = window.Iris || {}));
