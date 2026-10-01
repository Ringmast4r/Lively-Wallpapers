/**
 * Zip the wallpaper into something Lively will install as a package.
 *
 * This exists because of how Lively decides what it is looking at. Point it at
 * `index.html` — or paste that path into the "url" box — and it files the result
 * as a `url` wallpaper (Type 3): it never reads LivelyInfo.json, never finds
 * LivelyProperties.json, and **Customise stays greyed out**. Hand it an archive
 * with LivelyInfo.json at the root and it installs a proper `web` wallpaper
 * (Type 1) into its library, properties and all.
 *
 * Only the files Lively needs go in — the build scripts, README, and
 * node_modules stay out, which also keeps the archive small: the ANSI frames are
 * 17 MB of text on disk and compress to well under two.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createZip } from "./zip.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distDir = join(root, "dist");
const archive = join(distDir, "Iris.zip");

/** Everything that ships, relative to the wallpaper root. */
const CONTENTS = [
  "index.html",
  "styles.css",
  "LivelyInfo.json",
  "LivelyProperties.json",
  "lively_t.jpg",
  "js",
  "assets",
  "vendor",
];

/** Walk a path into `{ name, data }` entries, with forward-slash names. */
function collect(relative) {
  const absolute = join(root, relative);
  if (!statSync(absolute).isDirectory()) {
    return [{ name: relative, data: readFileSync(absolute) }];
  }
  return readdirSync(absolute).flatMap((child) =>
    collect(`${relative}/${child}`),
  );
}

const missing = CONTENTS.filter((entry) => !existsSync(join(root, entry)));
if (missing.length > 0) {
  console.error(
    `Missing: ${missing.join(", ")}\n` +
      "Run `node scripts/build-assets.mjs` and `node scripts/vendor-mediapipe.mjs` first.",
  );
  process.exit(1);
}

const entries = CONTENTS.flatMap(collect);

mkdirSync(distDir, { recursive: true });
rmSync(archive, { force: true });
writeFileSync(archive, createZip(entries));

const mb = (statSync(archive).size / 1024 / 1024).toFixed(1);
console.log(`Wrote dist/Iris.zip — ${entries.length} files, ${mb} MB`);
console.log("Import it with Lively: + Add Wallpaper → Browse → select the zip.");
