#!/usr/bin/env python3
"""Record the README media and the Lively thumbnail/preview for a wallpaper.

Drives the real wallpaper page headlessly, stepping its clock frame by frame, so
the GIF is the wallpaper itself and not a screen capture of someone's desktop.

    py -3.13 scripts/shoot.py            # needs: playwright (chromium), pillow

Writes:
    screenshots/networks-globe.gif          one full turn at Speed 100, 800x450
    screenshots/networks-globe-dark.png     2560x1440 stills
    screenshots/networks-globe-light.png
    wallpapers/networks-globe/thumbnail.jpg and preview.gif (what Lively's library shows)
"""
import io
import math
import os

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WP = os.path.join(ROOT, "wallpapers", "networks-globe")
PAGE = "file:///" + os.path.join(WP, "index.html").replace(os.sep, "/")
SHOTS = os.path.join(ROOT, "screenshots")
# Headless Chromium has no GPU; without these the WebGL canvas comes out blank.
ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]

TURN = 2 * math.pi / 0.45   # seconds of wallpaper clock for one full turn of the globe
BG, INK = (10, 10, 10), (242, 241, 236)


def ramp_palette(n=64):
    """Every colour in the dark theme is ink over background, so one ramp holds them all."""
    pal = []
    for i in range(n):
        f = i / (n - 1)
        pal += [round(BG[c] + (INK[c] - BG[c]) * f) for c in range(3)]
    return pal + [0] * (768 - len(pal))


def to_ramp(img, n=64):
    grey = img.convert("L").point(lambda v: max(0, min(n - 1, round((v - 10) / 231.0 * (n - 1)))))
    out = Image.frombytes("P", grey.size, grey.tobytes())
    out.putpalette(ramp_palette(n))
    return out


def open_page(browser, w, h, query=""):
    page = browser.new_page(viewport={"width": w, "height": h})
    page.goto(PAGE + query, wait_until="domcontentloaded")
    page.wait_for_function("window.NW_LIVE_READY === true && window.nwLive().frames > 3")
    assert page.evaluate("window.nwLive().webgl2"), "WebGL2 did not start"
    return page


def frames(page, count, turn=TURN):
    out = []
    for i in range(count):
        page.evaluate("t => window.nwLiveAt(t)", turn * i / count)
        # Two animation frames: one to draw at the new clock, one to be sure it is on screen.
        page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
        out.append(Image.open(io.BytesIO(page.screenshot())).convert("RGB"))
    return out


def save_gif(imgs, path, fps):
    pal = [to_ramp(i) for i in imgs]
    pal[0].save(path, save_all=True, append_images=pal[1:], duration=round(1000 / fps), loop=0, optimize=False, disposal=1)
    print("  %-52s %6.2f MB  %d frames" % (os.path.relpath(path, ROOT), os.path.getsize(path) / 1048576, len(imgs)))


def main():
    os.makedirs(SHOTS, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=ARGS)

        for theme in ("dark", "light"):
            page = open_page(browser, 2560, 1440, "?still&theme=" + theme)
            path = os.path.join(SHOTS, "networks-globe-%s.png" % theme)
            page.screenshot(path=path)
            print("  %-52s %6.2f MB" % (os.path.relpath(path, ROOT), os.path.getsize(path) / 1048576))
            page.close()

        page = open_page(browser, 800, 450)
        loop = frames(page, 168)   # 12 fps for the 14 s turn
        save_gif(loop, os.path.join(SHOTS, "networks-globe.gif"), 12)
        page.close()

        page = open_page(browser, 480, 270)
        small = frames(page, 84)
        save_gif(small, os.path.join(WP, "preview.gif"), 12)
        page.evaluate("t => window.nwLiveAt(t)", 3.6)
        page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
        Image.open(io.BytesIO(page.screenshot())).convert("RGB").save(os.path.join(WP, "thumbnail.jpg"), quality=90)
        page.close()
        browser.close()


if __name__ == "__main__":
    main()
