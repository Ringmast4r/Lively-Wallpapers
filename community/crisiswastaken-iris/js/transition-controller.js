/**
 * Continuous gaze field with blink and expression blending.
 * Port of web-tracker/src/lib/eyes/transition-controller.ts, itself a port of
 * user-tracker/smooth.py::SmoothTransitionController.
 *
 * Render-mode agnostic: it drives a surface provider and never knows whether the
 * frames underneath are glyphs or photographs.
 */

(function (Iris) {
  "use strict";

  var config = Iris.config;
  var DEFAULT_GAZE = Iris.states.DEFAULT_GAZE;

  var BLINK_STEPS = [
    [null, "blink_half", config.BLINK_ASCII_HALF_IN_MS],
    ["blink_half", "blink_closed", config.BLINK_ASCII_CLOSE_MS],
    ["blink_closed", "blink_half", config.BLINK_ASCII_HALF_OUT_MS],
    ["blink_half", null, config.BLINK_ASCII_OPEN_MS],
  ];

  function ease(current, target, tau, dtS) {
    if (tau <= 0 || dtS <= 0) {
      return target;
    }
    var alpha = 1.0 - Math.exp(-dtS / tau);
    return current + (target - current) * alpha;
  }

  function EyeTransitionController(provider) {
    this.gazeState = DEFAULT_GAZE;
    this.displayGazeX = 0;
    this.displayGazeY = 0;

    this.activeExpression = null;
    this.blinkRunning = false;
    this.blinkCount = 0;

    this._provider = provider;
    this._targetGazeX = 0;
    this._targetGazeY = 0;
    this._exprWeight = 0;
    this._targetExprWeight = 0;
    this._blinkStep = 0;
    this._blinkElapsedMs = 0;
    // The pose a running blink returns to. Stored as the exact gaze target
    // rather than as a grid state: `nearestGazeState` rounds a continuous
    // target to one of eleven keyframes, so restoring by state would visibly
    // yank the eyes to the nearest keyframe every time they blink.
    this._restoreGazeState = DEFAULT_GAZE;
    this._restoreGazeX = 0;
    this._restoreGazeY = 0;
    this._pendingGaze = null;
    this._gazeEaseTau = config.GAZE_EASE_TAU;
    this._exprEaseTau = config.EXPR_EASE_TAU;
  }

  Object.defineProperty(EyeTransitionController.prototype, "frameSize", {
    get: function () {
      return this._provider.size;
    },
  });

  /**
   * Swap render modes in place. Gaze, expression, and blink state carry over, so
   * a switch mid-blink or mid-squint resolves on the same pose.
   */
  EyeTransitionController.prototype.setSurfaceProvider = function (next) {
    this._provider = next;
  };

  EyeTransitionController.prototype.setSmoothing = function (gazeTau, exprTau) {
    this._gazeEaseTau = gazeTau;
    this._exprEaseTau = exprTau === undefined ? config.EXPR_EASE_TAU : exprTau;
  };

  Object.defineProperty(EyeTransitionController.prototype, "isBusy", {
    get: function () {
      if (this.blinkRunning) {
        return true;
      }
      var deadzone = config.GAZE_DISPLAY_DEADZONE;
      var gazeMoving =
        Math.abs(this.displayGazeX - this._targetGazeX) > deadzone ||
        Math.abs(this.displayGazeY - this._targetGazeY) > deadzone;
      var exprMoving =
        Math.abs(this._exprWeight - this._targetExprWeight) > 0.01;
      return gazeMoving || exprMoving;
    },
  });

  /** How far the expression has blended in, 0..1. */
  Object.defineProperty(EyeTransitionController.prototype, "expressionWeight", {
    get: function () {
      return this._exprWeight;
    },
  });

  EyeTransitionController.prototype._surfaceFor = function (key) {
    if (key === null) {
      // A blink departs from the face you are already wearing. Handing back the
      // bare gaze surface here would drop the expression for the length of the
      // blink, so a drowsy or squinting face would snap wide open, blink, and
      // then ease back into the expression it never meant to leave.
      return this._provider.getExpressionSurface(
        this.displayGazeX,
        this.displayGazeY,
        this.activeExpression,
        this._exprWeight,
      );
    }
    return this._provider.getBlinkSurface(key);
  };

  EyeTransitionController.prototype.currentFrame = function () {
    if (this.blinkRunning) {
      var step = BLINK_STEPS[this._blinkStep];
      var fromKey = step[0];
      var toKey = step[1];
      var durationMs = step[2];
      var rawT =
        durationMs > 0 ? Math.min(1, this._blinkElapsedMs / durationMs) : 1;
      var t = Iris.easeInOutCubic(rawT);
      return this._provider.blendSurfaces(
        this._surfaceFor(fromKey),
        this._surfaceFor(toKey),
        t,
      );
    }

    var overlayKey = null;
    var overlayWeight = 0;

    if (this.activeExpression && this._exprWeight > 0) {
      overlayKey = this.activeExpression;
      overlayWeight = this._exprWeight;
    }

    return this._provider.renderFrame(
      this.displayGazeX,
      this.displayGazeY,
      overlayKey,
      overlayWeight,
    );
  };

  EyeTransitionController.prototype.tick = function (dtMs) {
    var dtS = dtMs / 1000;

    if (this.blinkRunning) {
      this._tickBlink(dtMs);
      return;
    }

    this.displayGazeX = ease(
      this.displayGazeX,
      this._targetGazeX,
      this._gazeEaseTau,
      dtS,
    );
    this.displayGazeY = ease(
      this.displayGazeY,
      this._targetGazeY,
      this._gazeEaseTau,
      dtS,
    );
    this._exprWeight = ease(
      this._exprWeight,
      this._targetExprWeight,
      this._exprEaseTau,
      dtS,
    );

    // An expression that has finished fading out is no longer the active one.
    if (this._targetExprWeight === 0 && this._exprWeight <= 0.01) {
      this._exprWeight = 0;
      this.activeExpression = null;
    }

    if (!this.isBusy) {
      this._applyPendingGaze();
    }
  };

  /**
   * Point the eyes at a spot in the continuous field.
   *
   * Deliberately leaves the expression alone — expression lifecycle belongs to
   * the behavior layer, so the eyes can keep following the pointer while wide or
   * squinting.
   */
  EyeTransitionController.prototype.setGazePosition = function (gazeX, gazeY) {
    if (this.blinkRunning) {
      return;
    }
    this._targetGazeX = Math.max(-1, Math.min(1, gazeX));
    this._targetGazeY = Math.max(-1, Math.min(1, gazeY));
    this.gazeState = Iris.gazeMap.nearestGazeState(
      this._targetGazeX,
      this._targetGazeY,
    );
    this._pendingGaze = null;
  };

  EyeTransitionController.prototype.requestGaze = function (target) {
    if (this.blinkRunning) {
      return;
    }
    if (target === this.gazeState && !this.isBusy) {
      return;
    }
    if (this.isBusy) {
      this._pendingGaze = target;
      return;
    }
    this._applyGaze(target);
  };

  EyeTransitionController.prototype.goToExpression = function (expr) {
    if (this.blinkRunning || this.activeExpression === expr) {
      return;
    }
    this.activeExpression = expr;
    this._pendingGaze = null;
    this._targetExprWeight = 1;
  };

  EyeTransitionController.prototype.clearExpression = function () {
    if (this.blinkRunning || this.activeExpression === null) {
      return;
    }
    this._targetExprWeight = 0;
  };

  EyeTransitionController.prototype.startBlink = function () {
    if (this.isBusy || this.blinkRunning) {
      return false;
    }

    this.blinkRunning = true;
    this.blinkCount += 1;
    // Freeze the pose the blink departs from. The expression is deliberately
    // left alone — `tick` skips the easing while a blink runs, and both
    // `goToExpression` and `clearExpression` no-op, so whatever the eyes were
    // wearing holds steady until the lids come back up.
    this._restoreGazeState = this.gazeState;
    this._restoreGazeX = this._targetGazeX;
    this._restoreGazeY = this._targetGazeY;
    this._pendingGaze = null;
    this._blinkStep = 0;
    this._blinkElapsedMs = 0;
    return true;
  };

  EyeTransitionController.prototype._applyGaze = function (target) {
    this.gazeState = target;
    var coords = Iris.gazeMap.stateToCoords(target);
    this._targetGazeX = coords[0];
    this._targetGazeY = coords[1];
  };

  EyeTransitionController.prototype._applyPendingGaze = function () {
    if (this._pendingGaze === null || this.blinkRunning) {
      return;
    }
    var target = this._pendingGaze;
    this._pendingGaze = null;
    if (target === this.gazeState) {
      return;
    }
    this._applyGaze(target);
  };

  EyeTransitionController.prototype._tickBlink = function (dtMs) {
    if (this._blinkStep >= BLINK_STEPS.length) {
      this._finishBlink();
      return;
    }

    this._blinkElapsedMs += dtMs;

    while (this._blinkStep < BLINK_STEPS.length) {
      var durationMs = BLINK_STEPS[this._blinkStep][2];
      if (this._blinkElapsedMs < durationMs) {
        break;
      }
      this._blinkElapsedMs -= durationMs;
      this._blinkStep += 1;
    }

    if (this._blinkStep >= BLINK_STEPS.length) {
      this._finishBlink();
    }
  };

  EyeTransitionController.prototype._finishBlink = function () {
    this.blinkRunning = false;
    this._blinkStep = 0;
    this._blinkElapsedMs = 0;
    // Restore the frozen target verbatim rather than through `_applyGaze`,
    // which would replace a continuous target with its nearest keyframe's
    // coordinates.
    this.gazeState = this._restoreGazeState;
    this._targetGazeX = this._restoreGazeX;
    this._targetGazeY = this._restoreGazeY;
  };

  Iris.EyeTransitionController = EyeTransitionController;
})((window.Iris = window.Iris || {}));
