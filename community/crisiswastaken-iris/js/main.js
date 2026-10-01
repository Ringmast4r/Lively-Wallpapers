/**
 * Boot, and everything Lively is allowed to call.
 *
 * Three globals have to exist by the time Lively looks for them:
 *
 *   livelyPropertyListener        — Customise pane changes (and their replay on load)
 *   livelyWallpaperPlaybackChanged — pause/resume, enabled by `--pause-event true`
 *   livelyWallpaperDestroy         — teardown before the player window closes
 *
 * They are defined synchronously, before any assets are touched, because Lively
 * replays saved property values as soon as the document is ready — and a
 * property that arrives before the eyes exist would otherwise be dropped.
 */

(function (Iris) {
  "use strict";

  var stage = document.querySelector(".stage");
  var canvas = document.querySelector(".stage__eyes canvas");

  var eyes = new Iris.Eyes({
    stage: stage,
    canvas: canvas,
    mode: "ascii",
    onReady: function () {
      stage.setAttribute("data-ready", "");
    },
  });

  var settings = new Iris.Settings(eyes, {
    stage: stage,
    funcR: document.getElementById("eye-tint-r"),
    funcG: document.getElementById("eye-tint-g"),
    funcB: document.getElementById("eye-tint-b"),
  });

  /**
   * Lively fires this once per property on load with the saved value, then again
   * on every interaction. Values are already typed: sliders arrive as numbers,
   * checkboxes as booleans, dropdowns as the selected index, colors as #RRGGBB.
   */
  window.livelyPropertyListener = function (name, value) {
    try {
      settings.apply(name, value);
    } catch (error) {
      console.error("livelyPropertyListener failed for " + name, error);
    }
  };

  /** Only rendering is paused on Lively's side; the loop is ours to stop. */
  window.livelyWallpaperPlaybackChanged = function (data) {
    var payload = typeof data === "string" ? JSON.parse(data) : data;
    if (payload && payload.IsPaused) {
      eyes.pause();
    } else {
      eyes.resume();
    }
  };

  window.livelyWallpaperDestroy = function () {
    eyes.pause();
  };

  // The initial load. If Lively has a different render mode saved, its
  // `livelyPropertyListener` call lands first and this one is superseded — the
  // mode guard inside `setMode` sorts that out.
  eyes.setMode(eyes.mode).catch(function (error) {
    console.error("Iris failed to start", error);
    // Nothing can be shown behind the desktop icons, so leave the wallpaper
    // black rather than half-drawn.
    stage.removeAttribute("data-ready");
  });

  // Handy when previewing in a browser; harmless on the desktop.
  Iris.instance = eyes;
  Iris.settingsInstance = settings;
})((window.Iris = window.Iris || {}));
