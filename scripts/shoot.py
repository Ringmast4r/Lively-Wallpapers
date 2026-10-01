#!/usr/bin/env python3
"""Record the README media and the Lively thumbnail/preview for the wallpapers.

Drives each real wallpaper page headlessly, stepping its clock frame by frame,
so every picture here is the wallpaper itself and not a screen capture of
someone's desktop. wallpapers.json says what to shoot for each one.

    py -3.13 scripts/shoot.py                      # everything; needs playwright (chromium) and pillow
    py -3.13 scripts/shoot.py moon pumpkin-globe   # only these

Writes, per wallpaper:
    screenshots/<id>-<look>.png            1920x1080 stills, one per entry under "stills"
    wallpapers/<id>/thumbnail.jpg          what Lively's library shows
    wallpapers/<id>/preview.gif            what it shows on hover: one full turn, 480x270
and for the first wallpaper only, the README's opening loop:
    screenshots/networks-globe.gif         one full turn at Speed 100, 800x450
"""
import io
import json
import os
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "screenshots")
# Headless Chromium has no GPU; without these the WebGL canvases come out blank.
ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
BG, INK = (10, 10, 10), (242, 241, 236)
RAF2 = "() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))"


def ramp(img, n):
    """Black-and-white wallpapers: every colour is ink over background, so one ramp holds them all."""
    grey = img.convert("L").point(lambda v: max(0, min(n - 1, round((v - 10) / 231.0 * (n - 1)))))
    out = Image.frombytes("P", grey.size, grey.tobytes())
    pal = []
    for i in range(n):
        pal += [round(BG[c] + (INK[c] - BG[c]) * i / (n - 1)) for c in range(3)]
    out.putpalette(pal + [0] * (768 - len(pal)))
    return out


def adaptive(imgs):
    """Coloured wallpapers: one palette picked from a spread of frames, shared by all of them."""
    picks = imgs[::max(1, len(imgs) // 8)]
    sheet = Image.new("RGB", (picks[0].width, picks[0].height * len(picks)))
    for i, im in enumerate(picks):
        sheet.paste(im, (0, i * im.height))
    pal = sheet.quantize(colors=255, method=Image.MEDIANCUT)
    return [im.quantize(palette=pal, dither=Image.FLOYDSTEINBERG) for im in imgs]


def save_gif(imgs, path, fps, wp):
    frames = adaptive(imgs) if wp.get("colour") else [ramp(i, wp.get("levels", 64)) for i in imgs]
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=round(1000 / fps), loop=0, optimize=False, disposal=1)
    print("  %-52s %6.2f MB  %d frames" % (os.path.relpath(path, ROOT), os.path.getsize(path) / 1048576, len(imgs)))


def open_page(browser, wp, w, h, query=""):
    page = browser.new_page(viewport={"width": w, "height": h})
    url = "file:///" + os.path.join(ROOT, "wallpapers", wp["id"], "index.html").replace(os.sep, "/")
    page.goto(url + query, wait_until="domcontentloaded")
    page.wait_for_function("window.NW_LIVE_READY === true && window.nwLive().frames > 0", timeout=60000)
    page.evaluate(RAF2)
    assert page.evaluate("window.nwLive().ok"), wp["id"] + ": the page reported a problem (WebGL2?)"
    return page


def grab(page, t=None):
    if t is not None:
        page.evaluate("t => window.nwLiveAt(t)", t)
    # Two animation frames: one to draw at the new clock, one to be sure it is on screen.
    page.evaluate(RAF2)
    return Image.open(io.BytesIO(page.screenshot())).convert("RGB")


def loop(page, wp, count):
    return [grab(page, wp["turn"] * i / count) for i in range(count)]


def main():
    wallpapers = json.load(io.open(os.path.join(ROOT, "wallpapers.json"), encoding="utf-8"))
    only = set(sys.argv[1:])
    os.makedirs(SHOTS, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=ARGS)
        for n, wp in enumerate(wallpapers):
            if only and wp["id"] not in only:
                continue
            print(wp["title"])
            folder = os.path.join(ROOT, "wallpapers", wp["id"])

            for look, query in wp["stills"].items():
                page = open_page(browser, wp, 1920, 1080, query)
                path = os.path.join(SHOTS, "%s-%s.png" % (wp["id"], look))
                grab(page).save(path, optimize=True)
                print("  %-52s %6.2f MB" % (os.path.relpath(path, ROOT), os.path.getsize(path) / 1048576))
                page.close()

            page = open_page(browser, wp, 480, 270, wp.get("preview", ""))
            small = loop(page, wp, 84)
            save_gif(small, os.path.join(folder, "preview.gif"), 12, wp)
            small[wp.get("thumb", 10)].save(os.path.join(folder, "thumbnail.jpg"), quality=90)
            page.close()

            if n == 0:
                page = open_page(browser, wp, 800, 450)
                save_gif(loop(page, wp, 168), os.path.join(SHOTS, wp["id"] + ".gif"), 12, wp)   # 12 fps for the 14 s turn
                page.close()
        browser.close()


if __name__ == "__main__":
    main()
