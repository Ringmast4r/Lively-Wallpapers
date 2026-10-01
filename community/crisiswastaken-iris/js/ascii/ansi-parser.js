/**
 * Parse colored ANSI art into structured grid data.
 * Port of web-tracker/src/lib/ascii/ansi-parser.ts.
 *
 * `parseAnsiText` is verbatim. `fetchAnsiFile` is gone: Lively's WebView2 player
 * gives every local file its own opaque origin, so `fetch()` on a `file://` URL
 * fails CORS before it reaches the disk. scripts/build-assets.mjs pre-loads the
 * same text into `window.IRIS_ANSI` via <script> tags instead, which makes
 * reading a frame synchronous.
 */

(function (Iris) {
  "use strict";

  var ESC = String.fromCharCode(27);
  var TRUECOLOR_FG = new RegExp("^" + ESC + "\\[38;2;(\\d+);(\\d+);(\\d+)m$");
  var RESET = new RegExp("^" + ESC + "\\[0m$");
  var RESET_GLOBAL = new RegExp(ESC + "\\[0m", "g");

  function stripTrailingReset(text) {
    return text.replace(RESET_GLOBAL, "").replace(/[\n\r]+$/, "");
  }

  function parseAnsiText(text, source) {
    source = source || "";
    var cleaned = stripTrailingReset(text);
    var lines = cleaned.split("\n");

    var rowsData = [];
    var defaultColor = [255, 255, 255];
    var currentColor = defaultColor;

    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      if (!line && rowsData.length === 0) {
        continue;
      }

      var row = [];
      var pos = 0;

      while (pos < line.length) {
        if (line[pos] === ESC) {
          var end = line.indexOf("m", pos);
          if (end === -1) {
            break;
          }
          var seq = line.slice(pos, end + 1);
          var colorMatch = TRUECOLOR_FG.exec(seq);
          if (colorMatch) {
            currentColor = [
              parseInt(colorMatch[1], 10),
              parseInt(colorMatch[2], 10),
              parseInt(colorMatch[3], 10),
            ];
          } else if (RESET.test(seq)) {
            currentColor = defaultColor;
          }
          pos = end + 1;
          continue;
        }

        var ch = line[pos];
        if (ch !== "\r") {
          row.push([ch, currentColor]);
        }
        pos += 1;
      }

      if (row.length > 0) {
        rowsData.push(row);
      }
    }

    if (rowsData.length === 0) {
      throw new Error("No parseable rows in " + (source || "ANSI text"));
    }

    var cols = 0;
    for (var r = 0; r < rowsData.length; r += 1) {
      if (rowsData[r].length > cols) {
        cols = rowsData[r].length;
      }
    }
    var rows = rowsData.length;

    var chars = [];
    var colors = [];
    for (var y = 0; y < rows; y += 1) {
      var charRow = new Array(cols);
      var colorRow = new Array(cols);
      for (var x = 0; x < cols; x += 1) {
        charRow[x] = " ";
        colorRow[x] = new Uint8Array(3);
      }
      chars.push(charRow);
      colors.push(colorRow);
    }

    for (var ry = 0; ry < rows; ry += 1) {
      var sourceRow = rowsData[ry];
      for (var rx = 0; rx < sourceRow.length; rx += 1) {
        chars[ry][rx] = sourceRow[rx][0];
        colors[ry][rx] = new Uint8Array(sourceRow[rx][1]);
      }
    }

    return {
      chars: chars,
      colors: colors,
      rows: rows,
      cols: cols,
      source: source,
    };
  }

  /** Parse one pre-loaded frame out of the `window.IRIS_ANSI` registry. */
  function readAnsi(key) {
    var registry = window.IRIS_ANSI;
    var text = registry ? registry[key] : undefined;
    if (typeof text !== "string") {
      throw new Error(
        "ANSI frame '" +
          key +
          "' is not loaded. Run `node scripts/build-assets.mjs` and check that " +
          "assets/ansi/" +
          key +
          ".js is included in index.html.",
      );
    }
    return parseAnsiText(text, key + ".ansi");
  }

  Iris.ascii = Iris.ascii || {};
  Iris.ascii.parseAnsiText = parseAnsiText;
  Iris.ascii.readAnsi = readAnsi;
})((window.Iris = window.Iris || {}));
