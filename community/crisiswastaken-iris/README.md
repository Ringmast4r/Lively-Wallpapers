# Iris — Lively Wallpaper

The eyes as an interactive Windows desktop wallpaper, running on
[Lively Wallpaper](https://www.rocksdanister.com/lively/)'s HTML5 player.

Same eyes as `web-tracker/`: sixteen poses blended across a continuous gaze
field, auto-blink, an in-canvas bloom pass, and the amber-to-ember color grade.
They follow the real desktop cursor or your webcam, blink on their own, go drowsy
when you stop touching the machine, and squint at you if you shake the mouse
around.

## Install

Download **`Iris.zip`** from [GitHub Releases](https://github.com/Crisiswastaken/iris/releases/latest) or build locally:

```sh
node scripts/package.mjs      # writes dist/Iris.zip
```

Then in Lively: **+ Add Wallpaper → Browse**, and pick `dist/Iris.zip`.
Right-click the installed wallpaper → **Customise** for the settings.

For the eyes to follow your cursor, mouse input has to reach the wallpaper:
Lively **Settings → Wallpaper → Input**, "Mouse input" on.

For webcam tracking, allow camera access for Lively in **Windows Settings →
Privacy → Camera**, then enable **Follow the webcam** in Customise. A setup
panel appears in the center of the screen — **hide desktop icons first**
(right-click desktop → View → uncheck Show desktop icons), then follow the
steps so you can click **Allow** on the browser prompt. You only need to do
this once per install. Cursor and webcam tracking are mutually exclusive.

> **Import the zip, not `index.html`.** Handing Lively the HTML file — or pasting
> its path into the URL box — makes it a `url` wallpaper (`Type: 3`). It renders
> fine, but Lively never reads `LivelyInfo.json`, never finds
> `LivelyProperties.json`, and **Customise stays greyed out**. Only an archive
> with `LivelyInfo.json` at its root installs as a real `web` wallpaper
> (`Type: 1`) with properties attached. If you already imported it the wrong way,
> delete that entry from the gallery first.

## Build

```sh
npm install                    # only needed for vendor-mediapipe + thumbnail
node scripts/build-assets.mjs
node scripts/vendor-mediapipe.mjs
```

`build-assets.mjs` writes:

| Output | From | Size |
| --- | --- | --- |
| `assets/ansi/*.js` | `../output/ansi/*.ansi` | ~17 MB |
| `assets/eyes/*.webp` | `../web-tracker/public/eyes/` | ~470 KB |
| `lively_t.jpg` | `../output/center.png` | ~11 KB |

`vendor-mediapipe.mjs` copies `@mediapipe/tasks-vision` (BlazeFace, same model as
`user-tracker/`) into `vendor/mediapipe/` for offline `file://` loading (~35 MB
on disk, ~10 MB in the zip).

`sharp` is only needed for the thumbnail and for the fallback that converts
`../output/*.png` when `web-tracker` has not been synced. The script finds
`web-tracker`'s copy if there is one, so `npm install` here is usually
unnecessary. Both asset folders are committed, so a fresh clone can go straight
to `node scripts/vendor-mediapipe.mjs && node scripts/package.mjs`.

`scripts/package.mjs` then bundles the runtime files into `dist/Iris.zip`
(~12 MB with vendored MediaPipe — the ANSI text compresses roughly twelve to one). It writes the
archive with `scripts/zip.mjs` rather than PowerShell's `Compress-Archive` or
.NET Framework's `ZipFile`, both of which emit backslash separators in entry
names; the ZIP spec requires forward slashes, and an archive that unpacks into
files named `js\main.js` is a wallpaper that does not run.

## Settings

All of them live in Lively's Customise pane, defined by `LivelyProperties.json`.
The first five match `web-tracker`'s settings panel; the rest exist because a
wallpaper runs all day and cannot show a UI of its own.

| Setting | Default | What it does |
| --- | --- | --- |
| Render | ASCII | ASCII glyphs, or the photographic frames |
| Scale | 100% | How much of the screen the eyes fill (40–160%) |
| Custom color | off | Off keeps the default ember red |
| Eye color | `#FF2D55` | Hue for the duotone tint |
| Intensity | 85% | How far that tint pulls away from gray |
| Auto glow | on | Bloom strength follows the render mode |
| Glow | 100% | Manual bloom strength |
| Follow the cursor | on | Pointer tracking (mutually exclusive with webcam) |
| Follow the webcam | off | MediaPipe face tracking (mutually exclusive with cursor) |
| Blink | on | Autonomous blinking |
| Drowsy after | 5s | Idle time before the eyes half-close; 0 disables |
| Frame rate | 60 FPS | 30 roughly halves CPU; Uncapped follows the display |

## How this differs from `web-tracker/`

The rendering is a straight port — every constant in `js/config.js` matches
`web-tracker/src/lib/config.ts`, and each file names its upstream counterpart in
its header. What changed is how bytes get in and how settings get out:

- **No `fetch`, no ES modules.** Lively's WebView2 player gives every local file
  its own opaque origin, so both fail CORS on a `file://` page
  ([lively#1160](https://github.com/rocksdanister/lively/issues/1160)). The ANSI
  frames are `<script>` files that assign into `window.IRIS_ANSI`, the WebP
  frames load as `<img>`, and every source file is a classic script hanging off
  `window.Iris`.
- **ANSI frames load on demand.** They are injected the first time ASCII mode is
  asked for, so a PNG-only session never touches 17 MB.
- **Settings come from Lively**, not from an in-page panel. `livelyPropertyListener`
  is the only entry point; `js/settings.js` maps it onto the eyes.
- **The loop pauses.** `--pause-event true` in `LivelyInfo.json` makes Lively
  call `livelyWallpaperPlaybackChanged`, and the render loop stops. Lively only
  suspends rendering on its own — JavaScript keeps running — so without this the
  eyes would keep burning CPU behind a fullscreen game.
- **No telemetry, no accessibility labels, no documentation page.** Nothing is
  reading them from behind the desktop icons.

## Preview without Lively

Open `index.html` directly in Chrome or Edge over `file://`. Everything works
except the Lively callbacks, and the settings fall back to the defaults in
`js/settings.js`. This is the fastest way to catch a `file://` regression, since
the two engines enforce the same CORS rules.
