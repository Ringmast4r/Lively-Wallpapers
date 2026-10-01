/**
 * Pack both render modes' assets into a form a `file://` page can actually read.
 *
 *   ../output/ansi/*.ansi        →  assets/ansi/*.js     (script-tag globals)
 *   ../web-tracker/public/eyes/  →  assets/eyes/*.webp   (copied as-is)
 *   ../output/center.png         →  lively_t.jpg         (Lively thumbnail)
 *
 * Lively's WebView2 player treats every local file as its own opaque origin, so
 * `fetch()` — which is how web-tracker loads both asset sets — fails with a CORS
 * error before it ever touches the disk. `<script src>` and `<img src>` are the
 * two loads that are still allowed, so the ANSI text becomes JavaScript and the
 * frames stay images. See https://github.com/rocksdanister/lively/issues/1160.
 *
 * sharp is only needed for the thumbnail and for the WebP fallback path, so it
 * is imported lazily — the common case (web-tracker already synced) runs with no
 * dependencies installed at all.
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outputDir = resolve(root, "../output");
const ansiSrc = join(outputDir, "ansi");
const webpSrc = resolve(root, "../web-tracker/public/eyes");

const ansiDest = join(root, "assets/ansi");
const webpDest = join(root, "assets/eyes");
const thumbnail = join(root, "lively_t.jpg");

const THUMBNAIL_WIDTH = 480;
const WEBP_WIDTH = 1280;
const WEBP_QUALITY = 80;

/** Anything outside printable ASCII, which the generated files must not contain. */
const NON_ASCII = new RegExp("[\\u007f-\\uffff]", "g");

let sharpModule = null;
/** Resolve sharp from here or, failing that, from web-tracker's install. */
async function loadSharp() {
  if (sharpModule) {
    return sharpModule;
  }
  const vendored = resolve(root, "../web-tracker/node_modules/sharp");
  const candidates = ["sharp"];
  if (existsSync(vendored)) {
    const { main, exports } = JSON.parse(
      readFileSync(join(vendored, "package.json"), "utf8"),
    );
    const entry = exports?.["."]?.import?.default ?? main;
    candidates.push(pathToFileURL(join(vendored, entry)).href);
  }

  for (const specifier of candidates) {
    try {
      sharpModule = (await import(specifier)).default;
      return sharpModule;
    } catch {
      // Try the next one.
    }
  }
  return null;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

/**
 * A JS string literal containing only ASCII, so the generated file decodes
 * identically whether the browser reads it as UTF-8 or latin1. `JSON.stringify`
 * alone leaves anything above 0x7e literal, which would not round-trip.
 */
function asciiLiteral(text) {
  return JSON.stringify(text).replace(
    NON_ASCII,
    (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}

/* --- ANSI → script-tag globals ------------------------------------------- */

if (!existsSync(ansiSrc)) {
  fail(
    `ANSI source not found: ${ansiSrc}\n` +
      `Run user-tracker/scripts/convert_assets.py first.`,
  );
}

mkdirSync(ansiDest, { recursive: true });

const ansiFiles = readdirSync(ansiSrc).filter((f) => f.endsWith(".ansi"));
if (ansiFiles.length === 0) {
  fail(`No .ansi frames found in ${ansiSrc}`);
}

let ansiBytes = 0;
for (const file of ansiFiles) {
  const key = file.replace(/\.ansi$/, "");
  // latin1 in, escaped-ASCII out: the payload is escape sequences and glyphs,
  // so this round-trips byte-for-byte and the parser port stays identical to
  // web-tracker's.
  const text = readFileSync(join(ansiSrc, file), "latin1");
  const target = join(ansiDest, `${key}.js`);
  writeFileSync(
    target,
    `window.IRIS_ANSI = window.IRIS_ANSI || {};\n` +
      `window.IRIS_ANSI[${JSON.stringify(key)}] = ${asciiLiteral(text)};\n`,
    "latin1",
  );
  ansiBytes += statSync(target).size;
}
console.log(
  `Packed ${ansiFiles.length} ANSI frames into assets/ansi/ ` +
    `(${(ansiBytes / 1024 / 1024).toFixed(1)} MB)`,
);

/* --- WebP frames ---------------------------------------------------------- */

mkdirSync(webpDest, { recursive: true });

const syncedWebp = existsSync(webpSrc)
  ? readdirSync(webpSrc).filter((f) => f.endsWith(".webp"))
  : [];

let webpBytes = 0;
if (syncedWebp.length > 0) {
  for (const file of syncedWebp) {
    const target = join(webpDest, file);
    cpSync(join(webpSrc, file), target);
    webpBytes += statSync(target).size;
  }
  console.log(
    `Copied ${syncedWebp.length} WebP frames from web-tracker/public/eyes/ ` +
      `(${(webpBytes / 1024 / 1024).toFixed(2)} MB)`,
  );
} else {
  // web-tracker has not been synced — convert the masters ourselves, using the
  // exact settings from web-tracker/scripts/sync-assets.mjs so both apps show
  // the same pixels.
  const sharp = await loadSharp();
  if (!sharp) {
    fail(
      `No WebP frames in ${webpSrc} and sharp is not installed.\n` +
        `Run \`npm install\` here, or \`npm run sync-assets\` in web-tracker/.`,
    );
  }
  const pngFiles = readdirSync(outputDir).filter((f) => f.endsWith(".png"));
  if (pngFiles.length === 0) {
    fail(`No PNG frames found in ${outputDir}`);
  }

  await Promise.all(
    pngFiles.map(async (file) => {
      const target = join(webpDest, file.replace(/\.png$/, ".webp"));
      await sharp(join(outputDir, file))
        .resize({ width: WEBP_WIDTH, withoutEnlargement: true })
        // center.png carries an alpha channel the others lack; flatten so every
        // frame blends against the same opaque black.
        .flatten({ background: "#000000" })
        .webp({ quality: WEBP_QUALITY })
        .toFile(target);
      webpBytes += statSync(target).size;
    }),
  );
  console.log(
    `Converted ${pngFiles.length} PNG frames to assets/eyes/ ` +
      `(${(webpBytes / 1024 / 1024).toFixed(2)} MB)`,
  );
}

/* --- Thumbnail ------------------------------------------------------------ */

const thumbnailSource = join(outputDir, "center.png");
if (existsSync(thumbnail)) {
  console.log("Thumbnail already present, leaving lively_t.jpg alone.");
} else if (!existsSync(thumbnailSource)) {
  console.warn(`Skipped thumbnail: ${thumbnailSource} not found.`);
} else {
  // Purely cosmetic — Lively falls back to a placeholder tile without it, so a
  // missing sharp is a warning, not a build failure.
  const sharp = await loadSharp();
  if (!sharp) {
    console.warn(
      "Skipped lively_t.jpg: sharp is not installed. " +
        "Run `npm install` here to generate the gallery thumbnail.",
    );
    process.exit(0);
  }
  await sharp(thumbnailSource)
    .resize({ width: THUMBNAIL_WIDTH })
    .flatten({ background: "#000000" })
    // Approximate the page's own grade so the gallery tile matches the
    // wallpaper: the source frames are amber, the wallpaper renders them red.
    .modulate({ hue: -20, saturation: 1.45 })
    .jpeg({ quality: 88 })
    .toFile(thumbnail);
  console.log("Wrote lively_t.jpg");
}
