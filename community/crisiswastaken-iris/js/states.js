/** Eye state definitions. Port of web-tracker/src/lib/states.ts. */

(function (Iris) {
  "use strict";

  var GAZE_KEYS = [
    "up_left",
    "up",
    "up_right",
    "left_2",
    "left_1",
    "center",
    "right_1",
    "right_2",
    "down_left",
    "down",
    "down_right",
  ];

  var BLINK_KEYS = ["blink_half", "blink_closed"];
  var EXPRESSION_KEYS = ["squint", "wide", "drowsy"];

  Iris.states = {
    GAZE_KEYS: GAZE_KEYS,
    BLINK_KEYS: BLINK_KEYS,
    EXPRESSION_KEYS: EXPRESSION_KEYS,
    ALL_KEYS: GAZE_KEYS.concat(BLINK_KEYS, EXPRESSION_KEYS),
    DEFAULT_GAZE: "center",
  };
})((window.Iris = window.Iris || {}));
