/**
 * The eyes, minus React.
 * Port of web-tracker/src/components/Eyes.tsx.
 *
 * The render loop is the web version's `frame()` unchanged — same dt clamp, same
 * order of operations, same crossfade, same bloom. What React held in refs is
 * held in fields here.
 *
 * Four things differ, all of them because this is a wallpaper and not a page:
 *
 *   - Input listens for legacy mouse events as well as pointer events, since
 *     what Lively synthesizes onto the desktop is not guaranteed to be either.
 *   - An FPS cap gates the draw, because this runs all day.
 *   - `pause()`/`resume()` back Lively's playback events.
 *   - Telemetry, the aria label, and the loading/error text are gone — nothing
 *     is reading them behind the desktop icons.
 */

(function (Iris) {
  "use strict";

  var config = Iris.config;

  function Eyes(options) {
    options = options || {};

    this.stage = options.stage;
    this.canvas = options.canvas;
    this._ctx = this.canvas.getContext("2d");

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.mode = options.mode || "ascii";
    this.trackPointer = options.trackPointer !== false;
    this.trackWebcam = false;
    this.autoBlink = options.autoBlink !== false;
    /** null → the mode's own default from GLOW_STRENGTH. */
    this.glow = options.glow === undefined ? null : options.glow;
    /** 0 → uncapped. */
    this.fpsCap = options.fpsCap || 0;

    this._providers = new Map();
    this._controller = null;
    this._blink = null;
    this._behavior = null;
    this._bloom = null;

    this._raf = 0;
    this._running = false;
    this._lastFrame = 0;
    this._lastDraw = 0;
    this._firstFrame = true;
    this._smoothGaze = { x: 0, y: 0 };

    /** Snapshot of the outgoing renderer, held for the duration of a crossfade. */
    this._fadeFrom = null;
    this._fadeStart = 0;

    this._pointerSeen = false;
    this._listening = false;
    this._webcam = null;
    this._onLoadProgress = options.onLoadProgress || null;
    /** Fires once, the first time a mode has loaded and the loop is running. */
    this._onReady = options.onReady || null;
    /** Held until the behavior machine exists; settings can arrive before it. */
    this._idleDrowsyMs = config.IDLE_DROWSY_MS;

    this._bindListeners();
  }

  /** Idle threshold before the eyes go drowsy, in ms. 0 disables it. */
  Eyes.prototype.setIdleDrowsyMs = function (ms) {
    this._idleDrowsyMs = ms;
    if (this._behavior) {
      this._behavior.idleDrowsyMs = ms;
    }
  };

  /* --- pointer ----------------------------------------------------------- */

  Eyes.prototype._bindListeners = function () {
    var self = this;

    // Chromium raises `pointermove` for every `mousemove`, so on a normal page
    // the pointer listener alone is enough. Lively injects synthetic input into
    // the player window, and which of the two families comes out the other side
    // depends on the engine — so listen for both, and let the first real
    // `pointermove` switch the legacy path off rather than double-counting
    // travel into the shake detector.
    this._onPointerMove = function (event) {
      self._pointerSeen = true;
      self._applyPointer(event.clientX, event.clientY);
    };
    this._onMouseMove = function (event) {
      if (self._pointerSeen) {
        return;
      }
      self._applyPointer(event.clientX, event.clientY);
    };
    this._onPoke = function () {
      if (self._behavior) {
        self._behavior.click(performance.now());
      }
    };
  };

  Eyes.prototype._applyPointer = function (clientX, clientY) {
    if (!this.trackPointer || !this._behavior) {
      return;
    }

    this._behavior.move(performance.now(), clientX, clientY);

    // Gaze is measured against the stage's own center, so the eyes stay
    // meaningful even when the pointer is far outside them.
    var rect = this.stage.getBoundingClientRect();
    var nx = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    var ny = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

    var alpha = config.TRACK_EMA_ALPHA;
    this._smoothGaze.x += (nx - this._smoothGaze.x) * alpha;
    this._smoothGaze.y += (ny - this._smoothGaze.y) * alpha;
  };

  Eyes.prototype._listen = function () {
    if (this._listening) {
      return;
    }
    this._listening = true;
    window.addEventListener("pointermove", this._onPointerMove, {
      passive: true,
    });
    window.addEventListener("mousemove", this._onMouseMove, { passive: true });
    window.addEventListener("pointerdown", this._onPoke, { passive: true });
  };

  Eyes.prototype._unlisten = function () {
    if (!this._listening) {
      return;
    }
    this._listening = false;
    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("pointerdown", this._onPoke);
  };

  /** Turn pointer following on or off without tearing down the loop. */
  Eyes.prototype.setTrackPointer = function (enabled) {
    enabled = !!enabled;
    if (enabled && this.trackWebcam) {
      this.setTrackWebcam(false);
    }
    this._applyTrackPointer(enabled);
  };

  Eyes.prototype._applyTrackPointer = function (enabled) {
    this.trackPointer = !!enabled;
    if (this.trackPointer) {
      this._listen();
      // The idle clock kept running while tracking was off. Without this, the
      // eyes would arrive already asleep the moment tracking comes back.
      if (this._behavior) {
        this._behavior.markActivity(performance.now());
      }
      return;
    }
    this._unlisten();
    if (!this.trackWebcam) {
      this._resetGaze();
    }
  };

  /* --- webcam ------------------------------------------------------------- */

  Eyes.prototype.setTrackWebcam = function (enabled) {
    var self = this;
    enabled = !!enabled;
    if (enabled === this.trackWebcam) {
      return;
    }

    if (enabled && this.trackPointer) {
      this._applyTrackPointer(false);
    }

    this.trackWebcam = enabled;
    if (!enabled) {
      Iris.WebcamSetup.hide();
      this._stopWebcam();
      this._resetGaze();
      return;
    }

    this._unlisten();
    this._beginWebcamSetup();
  };

  Eyes.prototype._beginWebcamSetup = function () {
    var self = this;
    Iris.WebcamSetup.begin({
      onStart: function () {
        return self._ensureWebcam().then(function () {
          if (!self.trackWebcam) {
            return;
          }
          return self._webcam.start();
        });
      },
      onCancel: function () {
        if (!self.trackWebcam) {
          return;
        }
        self.trackWebcam = false;
        self._stopWebcam();
        self._resetGaze();
      },
    }).catch(function () {
      if (self._webcam && self._webcam.isWaitingForGesture()) {
        return;
      }
      if (self.trackWebcam) {
        self.trackWebcam = false;
        self._stopWebcam();
        self._resetGaze();
      }
    });
  };

  Eyes.prototype._startWebcamIfReady = function () {
    var self = this;
    if (!this.trackWebcam) {
      return;
    }

    Iris.WebcamSetup.resumeIfGranted(function () {
      return self._ensureWebcam().then(function () {
        if (self.trackWebcam && self._running) {
          return self._webcam.start();
        }
      });
    });
  };

  Eyes.prototype._ensureWebcam = function () {
    if (this._webcam) {
      return Promise.resolve();
    }

    var self = this;
    this._webcam = new Iris.WebcamTracker({
      onGaze: function (x, y) {
        if (!self.trackWebcam) {
          return;
        }
        self._smoothGaze.x = x;
        self._smoothGaze.y = y;
      },
    });
    return Promise.resolve();
  };

  Eyes.prototype._stopWebcam = function () {
    if (!this._webcam) {
      return;
    }
    this._webcam.stop();
  };

  Eyes.prototype._resetGaze = function () {
    // Let the eyes drift back to center rather than freezing wherever the
    // input happened to be when tracking was switched off.
    this._smoothGaze.x = 0;
    this._smoothGaze.y = 0;
    if (this._controller) {
      this._controller.setGazePosition(0, 0);
    }
  };

  /* --- asset loading and mode switching ---------------------------------- */

  Eyes.prototype._ensureProvider = function (target) {
    var self = this;
    var existing = this._providers.get(target);
    if (existing) {
      return Promise.resolve(existing);
    }

    var report = this._onLoadProgress
      ? function (loaded, total) {
          self._onLoadProgress(target, loaded, total);
        }
      : undefined;

    var size = [this.width, this.height];
    var pending =
      target === "ascii"
        ? Iris.ascii.createAsciiProvider(size, report)
        : Iris.png.PngSurfaceCache.load(size, report);

    return pending.then(function (provider) {
      self._providers.set(target, provider);
      return provider;
    });
  };

  /**
   * Load a render mode's assets if needed, then swap to it. The first call also
   * builds the controller, blink scheduler, behavior machine, and bloom pass.
   */
  Eyes.prototype.setMode = function (mode) {
    var self = this;
    this.mode = mode;

    return this._ensureProvider(mode).then(function (provider) {
      if (self.mode !== mode) {
        // A newer setMode landed while this one was loading.
        return;
      }

      if (self._controller === null) {
        self._controller = new Iris.EyeTransitionController(provider);
        self._controller.setSmoothing(config.GAZE_EASE_TAU);
        self._blink = new Iris.AutoBlink();
        self._behavior = new Iris.PointerBehavior(performance.now());
        self._behavior.idleDrowsyMs = self._idleDrowsyMs;
        self._bloom = new Iris.Bloom(self.width, self.height);
      } else {
        // Freeze the outgoing render so the two modes dissolve into each other
        // rather than hard-cutting.
        var previous = self._controller.currentFrame();
        var snapshot =
          self._fadeFrom || Iris.createSurface(self.width, self.height);
        var ctx = snapshot.getContext("2d");
        ctx.clearRect(0, 0, self.width, self.height);
        ctx.drawImage(previous, 0, 0, self.width, self.height);
        self._fadeFrom = snapshot;
        self._fadeStart = performance.now();

        self._controller.setSurfaceProvider(provider);
      }

      // Whichever mode finishes loading first starts the loop. Lively can swap
      // the mode setting in before the initial load resolves, and then it is
      // that second load that gets the eyes on screen.
      if (!self._running) {
        self.start();
        if (self._onReady) {
          var notify = self._onReady;
          self._onReady = null;
          notify();
        }
      }
    });
  };

  /* --- render loop -------------------------------------------------------- */

  Eyes.prototype.start = function () {
    var self = this;
    if (this._running || !this._controller) {
      return;
    }

    this._running = true;
    this._lastFrame = performance.now();
    this._lastDraw = 0;
    if (this.trackPointer) {
      this._listen();
    } else if (this.trackWebcam) {
      this._startWebcamIfReady();
    }

    var frame = function (now) {
      self._raf = requestAnimationFrame(frame);

      // The cap gates the work, not the rAF: leaving rAF as the driver means
      // Lively's own throttling still applies on top.
      if (self.fpsCap > 0 && now - self._lastDraw < 1000 / self.fpsCap - 0.5) {
        return;
      }
      self._lastDraw = now;
      self._tick(now);
    };

    this._raf = requestAnimationFrame(frame);
  };

  Eyes.prototype._tick = function (now) {
    var controller = this._controller;
    var behavior = this._behavior;
    var ctx = this._ctx;

    var dtMs = Math.min(100, now - this._lastFrame);
    this._lastFrame = now;

    // The idle clock starts when the eyes start drawing, not when they were
    // constructed — a slow asset load should not hand you a face that fell
    // asleep waiting for itself.
    if (this._firstFrame) {
      this._firstFrame = false;
      behavior.markActivity(now);
    }

    var trackingGaze = this.trackPointer || this.trackWebcam;

    // Every expression the behavior layer produces is pointer-derived: wide
    // from a click, squint from a shake, drowsy from going untouched. With the
    // pointer disconnected there is nothing to be idle *from*, so the eyes
    // would sink into a permanent drowse that no amount of activity could lift.
    // Rest at center and blink instead.
    var behaviorState = behavior.update(now);
    var desired = this.trackPointer ? behaviorState.expression : null;

    if (desired) {
      controller.goToExpression(desired);
    } else {
      controller.clearExpression();
    }

    // Annoyed eyes stop following on purpose — that is the whole point.
    if (trackingGaze && (!this.trackPointer || !behaviorState.gazeFrozen)) {
      controller.setGazePosition(this._smoothGaze.x, this._smoothGaze.y);
    }

    if (this.autoBlink) {
      this._blink.update(dtMs, controller);
    }
    controller.tick(dtMs);

    var current = controller.currentFrame();
    ctx.clearRect(0, 0, this.width, this.height);

    var fadeElapsed = now - this._fadeStart;
    if (this._fadeFrom && fadeElapsed < config.MODE_FADE_MS) {
      ctx.globalAlpha = 1;
      ctx.drawImage(this._fadeFrom, 0, 0, this.width, this.height);
      ctx.globalAlpha = fadeElapsed / config.MODE_FADE_MS;
      ctx.drawImage(current, 0, 0, this.width, this.height);
      ctx.globalAlpha = 1;
    } else {
      if (this._fadeFrom) {
        this._fadeFrom = null;
      }
      ctx.drawImage(current, 0, 0, this.width, this.height);
    }

    var strength =
      this.glow === null ? config.GLOW_STRENGTH[this.mode] : this.glow;
    this._bloom.apply(ctx, strength);
  };

  /**
   * Stop drawing. Lively only suspends rendering when it pauses a wallpaper —
   * JavaScript keeps running — so without this the loop would keep burning CPU
   * behind a fullscreen game.
   */
  Eyes.prototype.pause = function () {
    if (!this._running) {
      return;
    }
    this._running = false;
    cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._unlisten();
    this._stopWebcam();
  };

  Eyes.prototype.resume = function () {
    if (this._running || !this._controller) {
      return;
    }
    // `start` reseeds `_lastFrame`, so the pause does not arrive as one giant
    // dt. The 100 ms clamp would have caught it anyway.
    this.start();
  };

  Iris.Eyes = Eyes;
})((window.Iris = window.Iris || {}));
