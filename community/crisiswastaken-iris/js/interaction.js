/**
 * Turns raw pointer input into how the eyes should feel about you.
 * Port of web-tracker/src/lib/eyes/interaction.ts.
 *
 * Deliberately DOM-free: every entry point takes an explicit timestamp.
 *
 *   move / click  →  update(now)  →  { expression, gazeFrozen, … }
 *
 * Three behaviors, resolved here so the render loop never has to arbitrate:
 *
 *   idle 5s              → drowsy
 *   click                → wide, briefly, then a lockout
 *   fast back-and-forth  → chase for 2s, then squint until you settle down
 *
 * One difference from the web version: `idleDrowsyMs` is a field rather than a
 * module constant, because the wallpaper exposes it as a Lively setting.
 */

(function (Iris) {
  "use strict";

  var config = Iris.config;

  function PointerBehavior(now) {
    now = now || 0;

    /** Idle threshold in ms, or 0 to never go drowsy. */
    this.idleDrowsyMs = config.IDLE_DROWSY_MS;

    this._lastActivity = now;
    this._lastSample = null;
    this._speed = 0;

    this._legs = [];
    this._currentLeg = null;

    this._annoyPhase = "idle";
    this._annoyPhaseSince = now;
    /** Last moment the pointer was moving faster than the calm threshold. */
    this._lastFastAt = 0;

    this._wideUntil = 0;
    this._clickBlockedUntil = 0;
  }

  /** Any interaction at all — resets the idle timer, wakes the eyes up. */
  PointerBehavior.prototype.markActivity = function (now) {
    this._lastActivity = now;
  };

  /**
   * Feed a pointer position in client pixels. Position is only used for speed
   * and direction here; the gaze target is computed by the render loop.
   */
  PointerBehavior.prototype.move = function (now, x, y) {
    this._lastActivity = now;

    var previous = this._lastSample;
    this._lastSample = { t: now, x: x, y: y };
    if (previous === null) {
      return;
    }

    var dt = now - previous.t;
    if (dt <= 0) {
      return;
    }

    var dx = x - previous.x;
    var dy = y - previous.y;
    this._speed = (Math.sqrt(dx * dx + dy * dy) / dt) * 1000;
    if (this._speed > config.ANNOY_CALM_SPEED) {
      this._lastFastAt = now;
    }

    this._trackReversals(now, dx);
    this._detectShake(now);
  };

  /** A click or tap. */
  PointerBehavior.prototype.click = function (now) {
    this._lastActivity = now;
    if (now < this._clickBlockedUntil) {
      return;
    }
    this._wideUntil = now + config.CLICK_WIDE_MS;
    this._clickBlockedUntil = this._wideUntil + config.CLICK_COOLDOWN_MS;
    // An explicit poke outranks a sulk: drop the annoyance and start over.
    if (this._annoyPhase === "chasing" || this._annoyPhase === "annoyed") {
      this._setPhase("idle", now);
    }
  };

  /** Resolve everything into the state the eyes should render this frame. */
  PointerBehavior.prototype.update = function (now) {
    // Speed decays when the pointer stops firing events at all.
    if (this._lastSample && now - this._lastSample.t > 120) {
      this._speed = 0;
    }

    this._pruneLegs(now);
    this._advanceAnnoyance(now);

    var idleMs = now - this._lastActivity;
    var wide = now < this._wideUntil;
    var annoyed = this._annoyPhase === "annoyed";

    var expression = null;
    if (wide) {
      expression = "wide";
    } else if (annoyed) {
      expression = "squint";
    } else if (this.idleDrowsyMs > 0 && idleMs >= this.idleDrowsyMs) {
      expression = "drowsy";
    }

    return {
      expression: expression,
      gazeFrozen: annoyed && !wide,
      speed: this._speed,
      agitation: Math.min(1, this._speed / config.SHAKE_SPEED_MIN),
      annoyPhase: this._annoyPhase,
      idleMs: idleMs,
    };
  };

  /**
   * Accumulate travel into direction-consistent legs. A leg that is both long
   * and fast enough counts as one swipe of a shake.
   */
  PointerBehavior.prototype._trackReversals = function (now, dx) {
    if (dx === 0) {
      return;
    }
    var sign = dx > 0 ? 1 : -1;

    if (this._currentLeg === null || this._currentLeg.sign !== sign) {
      this._commitLeg(now);
      this._currentLeg = {
        sign: sign,
        distance: Math.abs(dx),
        startedAt: now,
      };
      return;
    }
    this._currentLeg.distance += Math.abs(dx);
  };

  PointerBehavior.prototype._commitLeg = function (now) {
    var leg = this._currentLeg;
    this._currentLeg = null;
    if (leg === null || leg.distance < config.SHAKE_SEGMENT_MIN_PX) {
      return;
    }
    var elapsed = Math.max(1, now - leg.startedAt);
    if ((leg.distance / elapsed) * 1000 < config.SHAKE_SPEED_MIN) {
      return;
    }
    this._legs.push(leg);
  };

  PointerBehavior.prototype._pruneLegs = function (now) {
    if (this._legs.length === 0) {
      return;
    }
    this._legs = this._legs.filter(function (leg) {
      return now - leg.startedAt <= config.SHAKE_WINDOW_MS;
    });
  };

  PointerBehavior.prototype._detectShake = function (now) {
    if (
      this._annoyPhase !== "idle" ||
      this._legs.length < config.SHAKE_REVERSALS
    ) {
      return;
    }
    this._pruneLegs(now);
    if (this._legs.length < config.SHAKE_REVERSALS) {
      return;
    }
    this._legs = [];
    this._currentLeg = null;
    this._setPhase("chasing", now);
  };

  PointerBehavior.prototype._advanceAnnoyance = function (now) {
    var elapsed = now - this._annoyPhaseSince;

    if (this._annoyPhase === "chasing") {
      if (elapsed >= config.ANNOY_CHASE_MS) {
        this._setPhase("annoyed", now);
      }
      return;
    }

    if (this._annoyPhase === "annoyed") {
      var heldLongEnough = elapsed >= config.ANNOY_SQUINT_MIN_MS;
      var settled = now - this._lastFastAt >= config.ANNOY_CALM_MS;
      if (heldLongEnough && settled) {
        this._setPhase("cooldown", now);
      }
      return;
    }

    if (
      this._annoyPhase === "cooldown" &&
      elapsed >= config.ANNOY_COOLDOWN_MS
    ) {
      this._setPhase("idle", now);
    }
  };

  PointerBehavior.prototype._setPhase = function (phase, now) {
    this._annoyPhase = phase;
    this._annoyPhaseSince = now;
    if (phase === "idle" || phase === "cooldown") {
      this._legs = [];
      this._currentLeg = null;
    }
  };

  Iris.PointerBehavior = PointerBehavior;
})((window.Iris = window.Iris || {}));
