/**
 * Webcam face tracking for Lively Wallpaper.
 * Port of user-tracker/tracking/{controller,detector}.py — continuous gaze only.
 *
 * Uses MediaPipe BlazeFace (same model as the pygame viewer) via the vendored
 * vision_bundle.js global. Face bbox center is EMA-smoothed and mapped to the
 * same [-1, 1] gaze space as pointer tracking.
 *
 * Lively toggles settings from its own UI — that is not a user gesture inside
 * the wallpaper window, so the first getUserMedia call may be blocked until the
 * user clicks or moves the mouse on the desktop (Lively forwards pointer input).
 */

(function (Iris) {
  "use strict";

  var config = Iris.config;

  function WebcamTracker(options) {
    options = options || {};
    this.onGaze = options.onGaze || function () {};
    this.onError = options.onError || function (message) {
      console.error("WebcamTracker:", message);
    };

    this._video = document.createElement("video");
    this._video.setAttribute("playsinline", "");
    this._video.muted = true;
    this._video.autoplay = true;
    this._video.style.cssText =
      "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;";
    document.body.appendChild(this._video);

    this._detector = null;
    this._stream = null;
    this._running = false;
    this._waitingForGesture = false;
    this._raf = 0;
    this._lastDetectMs = 0;
    this._lastVideoTime = -1;
    this._smoothPos = null;
    this._lastFaceMs = null;
    this._initPromise = null;
    this._gestureRetry = null;
  }

  WebcamTracker.prototype.isWaitingForGesture = function () {
    return this._waitingForGesture;
  };

  WebcamTracker.prototype.start = function () {
    var self = this;
    if (this._running) {
      return Promise.resolve();
    }

    return this._tryStart().catch(function (error) {
      if (self._shouldWaitForGesture(error)) {
        self._armGestureRetry();
        return;
      }
      self.onError(formatError(error));
      throw error;
    });
  };

  WebcamTracker.prototype._tryStart = function () {
    var self = this;
    return this._ensureReady().then(function () {
      self._disarmGestureRetry();
      self._running = true;
      self._lastDetectMs = 0;
      self._loop(performance.now());
    });
  };

  WebcamTracker.prototype.stop = function () {
    this._running = false;
    this._waitingForGesture = false;
    this._disarmGestureRetry();

    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }

    if (this._stream) {
      this._stream.getTracks().forEach(function (track) {
        track.stop();
      });
      this._stream = null;
    }

    this._video.srcObject = null;
    this._smoothPos = null;
    this._lastFaceMs = null;
    this._lastVideoTime = -1;
    this._resetInit();
  };

  WebcamTracker.prototype.destroy = function () {
    this.stop();
    if (this._detector) {
      this._detector.close();
      this._detector = null;
    }
    if (this._video.parentNode) {
      this._video.parentNode.removeChild(this._video);
    }
  };

  WebcamTracker.prototype._resetInit = function () {
    this._initPromise = null;
  };

  WebcamTracker.prototype._ensureReady = function () {
    if (this._initPromise) {
      return this._initPromise;
    }

    var self = this;
    this._initPromise = this._openCamera()
      .then(function () {
        return self._loadDetector();
      })
      .catch(function (error) {
        self._resetInit();
        throw error;
      });

    return this._initPromise;
  };

  WebcamTracker.prototype._openCamera = function () {
    var self = this;
    var mediaDevices = navigator.mediaDevices;
    if (!mediaDevices || !mediaDevices.getUserMedia) {
      return Promise.reject(new Error("Camera API not available (needs HTTPS)"));
    }

    if (this._stream) {
      return waitForVideoReady(this._video);
    }

    return mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })
      .then(function (stream) {
        self._stream = stream;
        self._video.srcObject = stream;
        return self._video.play();
      })
      .then(function () {
        return waitForVideoReady(self._video);
      });
  };

  WebcamTracker.prototype._loadDetector = function () {
    if (this._detector) {
      return Promise.resolve();
    }

    if (typeof Vision === "undefined") {
      return Promise.reject(
        new Error("MediaPipe vision bundle not loaded"),
      );
    }

    var FaceDetector = Vision.FaceDetector;
    var FilesetResolver = Vision.FilesetResolver;
    var self = this;
    var wasmBase = resolveAsset(config.TRACK_WASM_BASE);
    var modelPath = resolveAsset(config.TRACK_MODEL_PATH);

    return FilesetResolver.forVisionTasks(wasmBase).then(function (fileset) {
      return FaceDetector.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: modelPath,
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.5,
      });
    }).then(function (detector) {
      self._detector = detector;
    });
  };

  WebcamTracker.prototype._shouldWaitForGesture = function (error) {
    if (!error) {
      return false;
    }
    var name = error.name || "";
    return (
      name === "NotAllowedError" ||
      name === "SecurityError" ||
      name === "AbortError"
    );
  };

  WebcamTracker.prototype._armGestureRetry = function () {
    var self = this;
    if (this._gestureRetry) {
      return;
    }

    this._waitingForGesture = true;
    this.onError(
      "Camera needs a click on the desktop — move the mouse and click once.",
    );

    this._gestureRetry = function () {
      self._disarmGestureRetry();
      self._tryStart().catch(function (error) {
        if (self._shouldWaitForGesture(error)) {
          self._armGestureRetry();
          return;
        }
        self.onError(formatError(error));
      });
    };

    window.addEventListener("pointerdown", this._gestureRetry, { passive: true });
    window.addEventListener("mousedown", this._gestureRetry, { passive: true });
    // Lively forwards desktop mouse input — a move may be easier than a click
    // through desktop icons.
    window.addEventListener("pointermove", this._gestureRetry, {
      passive: true,
      once: true,
    });
  };

  WebcamTracker.prototype._disarmGestureRetry = function () {
    this._waitingForGesture = false;
    if (!this._gestureRetry) {
      return;
    }
    window.removeEventListener("pointerdown", this._gestureRetry);
    window.removeEventListener("mousedown", this._gestureRetry);
    window.removeEventListener("pointermove", this._gestureRetry);
    this._gestureRetry = null;
  };

  WebcamTracker.prototype._loop = function (now) {
    var self = this;
    if (!this._running) {
      return;
    }

    this._raf = requestAnimationFrame(function (frameNow) {
      self._loop(frameNow);
    });

    var intervalMs = 1000 / config.TRACK_FPS;
    if (now - this._lastDetectMs < intervalMs) {
      return;
    }
    this._lastDetectMs = now;

    if (
      !this._detector ||
      this._video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return;
    }

    if (this._video.currentTime === this._lastVideoTime) {
      return;
    }
    this._lastVideoTime = this._video.currentTime;

    var result = this._detector.detectForVideo(this._video, now);
    var detection = pickBestDetection(result);

    if (detection) {
      this._lastFaceMs = now;
      var center = faceCenter(
        detection,
        this._video.videoWidth,
        this._video.videoHeight,
      );
      this._smoothPos = smoothPosition(
        center.x,
        center.y,
        this._smoothPos,
        config.TRACK_EMA_ALPHA,
      );
      var gaze = normalizedToGaze(this._smoothPos[0], this._smoothPos[1]);
      this.onGaze(gaze.x, gaze.y);
      return;
    }

    var lostMs =
      this._lastFaceMs === null ? Infinity : now - this._lastFaceMs;
    if (lostMs >= config.TRACK_LOST_TIMEOUT_MS) {
      this._smoothPos = null;
      this.onGaze(0, 0);
      return;
    }

    if (this._smoothPos) {
      var held = normalizedToGaze(this._smoothPos[0], this._smoothPos[1]);
      this.onGaze(held.x, held.y);
    }
  };

  function waitForVideoReady(video) {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      var onReady = function () {
        cleanup();
        resolve();
      };
      var onError = function () {
        cleanup();
        reject(new Error("Camera stream failed to start"));
      };
      var cleanup = function () {
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("error", onError);
      };

      video.addEventListener("loadeddata", onReady);
      video.addEventListener("error", onError);
    });
  }

  function resolveAsset(relativePath) {
    return new URL(relativePath, document.baseURI).href;
  }

  function formatError(error) {
    if (!error) {
      return "Unknown camera error";
    }
    if (error.message) {
      return error.message;
    }
    return String(error);
  }

  function pickBestDetection(result) {
    if (!result || !result.detections || result.detections.length === 0) {
      return null;
    }

    var best = result.detections[0];
    for (var i = 1; i < result.detections.length; i++) {
      var candidate = result.detections[i];
      if (scoreOf(candidate) > scoreOf(best)) {
        best = candidate;
      }
    }
    return best;
  }

  function scoreOf(detection) {
    if (
      detection.categories &&
      detection.categories.length > 0 &&
      detection.categories[0].score !== undefined
    ) {
      return detection.categories[0].score;
    }
    return detection.score || 0;
  }

  function faceCenter(detection, width, height) {
    var bbox = detection.boundingBox;
    if (!bbox || !width || !height) {
      return { x: 0.5, y: 0.5 };
    }

    var x = (bbox.originX + bbox.width / 2) / width;
    var y = (bbox.originY + bbox.height / 2) / height;

    if (config.TRACK_MIRROR_HORIZONTAL) {
      x = 1 - x;
    }

    return {
      x: clamp01(x),
      y: clamp01(y),
    };
  }

  function smoothPosition(x, y, prev, alpha) {
    if (!prev) {
      return [x, y];
    }
    return [
      prev[0] + alpha * (x - prev[0]),
      prev[1] + alpha * (y - prev[1]),
    ];
  }

  function normalizedToGaze(x, y) {
    return {
      x: (x - 0.5) * 2,
      y: (y - 0.5) * 2,
    };
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  Iris.WebcamTracker = WebcamTracker;
})((window.Iris = window.Iris || {}));
