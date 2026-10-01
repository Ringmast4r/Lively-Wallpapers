/**
 * Gaze coordinate mapping. Port of web-tracker/src/lib/eyes/gaze-map.ts, itself a
 * port of user-tracker/ascii/gaze_map.py.
 */

(function (Iris) {
  "use strict";

  var GAZE_GRID = [
    [null, "up_left", "up", "up_right", null],
    ["left_2", "left_1", "center", "right_1", "right_2"],
    [null, "down_left", "down", "down_right", null],
  ];

  var GAZE_COORDS = {
    up_left: [-0.67, -1.0],
    up: [0.0, -1.0],
    up_right: [0.67, -1.0],
    left_2: [-1.0, 0.0],
    left_1: [-0.5, 0.0],
    center: [0.0, 0.0],
    right_1: [0.5, 0.0],
    right_2: [1.0, 0.0],
    down_left: [-0.67, 1.0],
    down: [0.0, 1.0],
    down_right: [0.67, 1.0],
  };

  var GRID_COLS = 5;
  var GRID_ROWS = 3;

  function stateToCoords(state) {
    var coords = GAZE_COORDS[state];
    if (!coords) {
      throw new Error("Unknown gaze state: " + state);
    }
    return coords;
  }

  function gridCell(col, row) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
      return null;
    }
    return GAZE_GRID[row][col];
  }

  function nearestGazeState(gazeX, gazeY) {
    var bestKey = "center";
    var bestDist = Infinity;

    for (var key in GAZE_COORDS) {
      if (!Object.prototype.hasOwnProperty.call(GAZE_COORDS, key)) {
        continue;
      }
      var coords = GAZE_COORDS[key];
      var dx = gazeX - coords[0];
      var dy = gazeY - coords[1];
      var dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestKey = key;
      }
    }

    return bestKey;
  }

  Iris.gazeMap = {
    GAZE_GRID: GAZE_GRID,
    GAZE_COORDS: GAZE_COORDS,
    GRID_COLS: GRID_COLS,
    GRID_ROWS: GRID_ROWS,
    stateToCoords: stateToCoords,
    gridCell: gridCell,
    nearestGazeState: nearestGazeState,
  };
})((window.Iris = window.Iris || {}));
