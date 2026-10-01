/**
 * One-time camera permission flow for Lively.
 *
 * Lively draws the wallpaper behind desktop icons. Chromium's permission bar
 * appears at the top-left — exactly where icons sit — so Allow/Block cannot be
 * clicked. This module shows a centered panel (usually icon-free) and only calls
 * getUserMedia after the user confirms they have hidden desktop icons.
 */

(function (Iris) {
  "use strict";

  var panel = null;
  var messageEl = null;
  var startBtn = null;
  var cancelBtn = null;
  var pendingStart = null;
  var pendingCancel = null;

  function ensureDom() {
    if (panel) {
      return;
    }

    panel = document.createElement("div");
    panel.className = "webcam-setup";
    panel.hidden = true;
    panel.innerHTML =
      '<div class="webcam-setup__panel" role="dialog" aria-labelledby="iris-webcam-title">' +
      '<h2 id="iris-webcam-title" class="webcam-setup__title">Enable webcam tracking</h2>' +
      '<p class="webcam-setup__lead">Lively puts the permission prompt behind your desktop icons.</p>' +
      '<ol class="webcam-setup__steps">' +
      "<li>Right-click the desktop → <strong>View</strong> → turn off <strong>Show desktop icons</strong></li>" +
      '<li>Click <strong>Turn on camera</strong> below</li>' +
      "<li>Click <strong>Allow</strong> on the prompt in the top-left corner</li>" +
      "<li>Turn desktop icons back on if you like — you only need to do this once</li>" +
      "</ol>" +
      '<p class="webcam-setup__status" data-status></p>' +
      '<div class="webcam-setup__actions">' +
      '<button type="button" class="webcam-setup__btn webcam-setup__btn--primary" data-start>Turn on camera</button>' +
      '<button type="button" class="webcam-setup__btn" data-cancel>Use cursor instead</button>' +
      "</div>" +
      "</div>";

    document.body.appendChild(panel);
    messageEl = panel.querySelector("[data-status]");
    startBtn = panel.querySelector("[data-start]");
    cancelBtn = panel.querySelector("[data-cancel]");

    startBtn.addEventListener("click", function () {
      if (!pendingStart) {
        return;
      }
      setStatus("Requesting camera access…");
      startBtn.disabled = true;
      pendingStart()
        .then(function () {
          hide();
        })
        .catch(function (error) {
          startBtn.disabled = false;
          if (isPermissionError(error)) {
            setStatus(
              "Could not open the camera. Hide desktop icons, click Turn on camera again, then Allow on the top-left prompt.",
            );
            return;
          }
          setStatus(formatError(error));
        });
    });

    cancelBtn.addEventListener("click", function () {
      hide();
      if (pendingCancel) {
        pendingCancel();
      }
    });
  }

  function setStatus(text) {
    if (!messageEl) {
      return;
    }
    messageEl.textContent = text || "";
    messageEl.hidden = !text;
  }

  function show() {
    ensureDom();
    setStatus("");
    startBtn.disabled = false;
    panel.hidden = false;
  }

  function hide() {
    if (!panel) {
      return;
    }
    panel.hidden = true;
    setStatus("");
    pendingStart = null;
    pendingCancel = null;
  }

  function queryCameraPermission() {
    if (!navigator.permissions || !navigator.permissions.query) {
      return Promise.resolve("prompt");
    }

    return navigator.permissions
      .query({ name: "camera" })
      .then(function (result) {
        return result.state;
      })
      .catch(function () {
        return "prompt";
      });
  }

  function isPermissionError(error) {
    if (!error) {
      return false;
    }
    var name = error.name || "";
    return (
      name === "NotAllowedError" ||
      name === "SecurityError" ||
      name === "AbortError"
    );
  }

  function formatError(error) {
    if (!error) {
      return "Camera error";
    }
    return error.message || String(error);
  }

  /**
   * @param {{ onStart: function(): Promise<void>, onCancel: function() }} handlers
   */
  function begin(handlers) {
    handlers = handlers || {};
    pendingStart = handlers.onStart || null;
    pendingCancel = handlers.onCancel || null;

    return queryCameraPermission().then(function (state) {
      if (state === "granted" && pendingStart) {
        return pendingStart().then(function () {
          hide();
        });
      }

      if (state === "denied") {
        show();
        setStatus(
          "Camera access is blocked. Allow Lively in Windows Settings → Privacy → Camera, then reload the wallpaper.",
        );
        return;
      }

      show();
    });
  }

  /** Resume after pause when permission was already granted. */
  function resumeIfGranted(onStart) {
    return queryCameraPermission().then(function (state) {
      if (state === "granted" && onStart) {
        return onStart();
      }
    });
  }

  Iris.WebcamSetup = {
    begin: begin,
    resumeIfGranted: resumeIfGranted,
    hide: hide,
  };
})((window.Iris = window.Iris || {}));
