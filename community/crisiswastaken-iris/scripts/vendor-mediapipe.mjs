/**
 * Vendor @mediapipe/tasks-vision for offline use in Lively's file:// player.
 *
 * Copies vision_bundle.js + wasm/ from node_modules and downloads the same
 * BlazeFace short-range model user-tracker uses.
 *
 *   npm install
 *   node scripts/vendor-mediapipe.mjs
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const vendorDir = join(root, "vendor", "mediapipe");
const pkgRoot = join(root, "node_modules", "@mediapipe", "tasks-vision");

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/" +
  "blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

function requirePath(relative) {
  const absolute = join(pkgRoot, relative);
  if (!existsSync(absolute)) {
    console.error(
      `Missing ${relative}. Run \`npm install\` in lively-wallpaper first.`,
    );
    process.exit(1);
  }
  return absolute;
}

if (!existsSync(pkgRoot)) {
  console.error(
    "Missing @mediapipe/tasks-vision. Run `npm install` in lively-wallpaper first.",
  );
  process.exit(1);
}

rmSync(vendorDir, { recursive: true, force: true });
mkdirSync(vendorDir, { recursive: true });

const bundleCandidates = ["vision_bundle.js", "vision_bundle.cjs"];
const bundleSource = bundleCandidates
  .map((name) => join(pkgRoot, name))
  .find((path) => existsSync(path));

if (!bundleSource) {
  console.error(
    "Missing vision_bundle.js in @mediapipe/tasks-vision. Update the package version.",
  );
  process.exit(1);
}

const bundleDest = join(
  vendorDir,
  bundleSource.endsWith(".cjs") ? "vision_bundle.cjs" : "vision_bundle.js",
);
cpSync(bundleSource, bundleDest);
cpSync(requirePath("wasm"), join(vendorDir, "wasm"), { recursive: true });

console.log("Downloading blaze_face_short_range.tflite...");
const response = await fetch(MODEL_URL);
if (!response.ok) {
  console.error(`Model download failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}
const modelBuffer = Buffer.from(await response.arrayBuffer());
writeFileSync(join(vendorDir, "blaze_face_short_range.tflite"), modelBuffer);

console.log(`Vendored MediaPipe to vendor/mediapipe/ (${modelBuffer.length} byte model)`);
