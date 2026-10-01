/**
 * Application constants. Port of web-tracker/src/lib/config.ts, which is itself
 * a port of user-tracker/config.py. Values are identical to the web version —
 * if one changes, change it in all three.
 *
 * The asset base paths are gone: nothing here is fetched by URL any more.
 */

(function (Iris) {
  "use strict";

  Iris.config = {
    ASCII_COLS: 450,
    ASCII_ROWS: 150,
    ASCII_CHAR_RATIO: 2.0,
    ASCII_FONT_SIZE: 12,
    ASCII_BRIGHTNESS_GAMMA: 0.72,
    ASCII_BRIGHTNESS_GAIN: 1.15,
    ASCII_DARK_THRESHOLD: 6,
    ASCII_BG: { r: 0, g: 0, b: 0 },

    GAZE_EASE_TAU: 0.15,
    EXPR_EASE_TAU: 0.22,
    GAZE_DISPLAY_DEADZONE: 0.02,

    /** Blend weights this close to a grid line are treated as sitting on it. */
    BLEND_EPS: 0.002,

    BLINK_ASCII_HALF_IN_MS: 55,
    BLINK_ASCII_CLOSE_MS: 100,
    BLINK_ASCII_HALF_OUT_MS: 35,
    BLINK_ASCII_OPEN_MS: 55,

    TRACK_EMA_ALPHA: 0.35,

    /** Webcam face tracking (port of user-tracker/config.py TRACK_*). */
    TRACK_FPS: 24,
    TRACK_LOST_TIMEOUT_MS: 2000,
    TRACK_MIRROR_HORIZONTAL: true,
    TRACK_WASM_BASE: "vendor/mediapipe/wasm",
    TRACK_MODEL_PATH: "vendor/mediapipe/blaze_face_short_range.tflite",

    BLINK_INTERVAL_MIN_S: 3.0,
    BLINK_INTERVAL_MAX_S: 5.0,
    BLINK_INTERVAL_STEP_S: 0.5,

    /* --- Pointer behavior -------------------------------------------------- */

    /** Idle this long with no pointer or click activity → drowsy. */
    IDLE_DROWSY_MS: 5000,

    /** How long `wide` holds after a click, and the lockout before it retriggers. */
    CLICK_WIDE_MS: 700,
    CLICK_COOLDOWN_MS: 1800,

    /**
     * Fast-swipe detection, modeled on the macOS shake-to-locate gesture: count
     * horizontal direction reversals where each leg is both long enough and fast
     * enough, inside a rolling window.
     */
    SHAKE_SPEED_MIN: 1400,
    SHAKE_SEGMENT_MIN_PX: 32,
    SHAKE_REVERSALS: 3,
    SHAKE_WINDOW_MS: 600,

    /** Eyes keep chasing this long after a shake before the annoyance shows. */
    ANNOY_CHASE_MS: 2000,
    /** Minimum squint hold — it does not drop the attitude the instant you stop. */
    ANNOY_SQUINT_MIN_MS: 1600,
    /** Squint also holds until the pointer stays under this speed for this long. */
    ANNOY_CALM_SPEED: 250,
    ANNOY_CALM_MS: 400,
    /** Lockout after the squint releases before another shake can register. */
    ANNOY_COOLDOWN_MS: 3000,

    /* --- Output ------------------------------------------------------------ */

    DEFAULT_OUTPUT_WIDTH: 960,
    DEFAULT_OUTPUT_HEIGHT: 540,

    /** Where build-assets.mjs puts the frames, relative to index.html. */
    ANSI_ASSET_BASE: "assets/ansi",
    PNG_ASSET_BASE: "assets/eyes",

    /** Crossfade duration when switching between ASCII and PNG rendering. */
    MODE_FADE_MS: 350,

    /**
     * Bloom strength per render mode. The ASCII frames are sparse, dim glyphs and
     * need the lift; the PNG frames already glow, so they only get a halo.
     */
    GLOW_STRENGTH: { ascii: 1, png: 0.45 },

    /* --- Display scale ----------------------------------------------------- */

    /**
     * Port of web-tracker/src/lib/view.ts. Size is applied in CSS, not by
     * changing the canvas dimensions — the renderers cache one surface set per
     * output resolution, so resizing the canvas would re-rasterize all sixteen
     * frames on every tick of the slider.
     */
    SIZE_MIN: 0.4,
    SIZE_MAX: 1.6,
    SIZE_DEFAULT: 1,
  };
})((window.Iris = window.Iris || {}));
