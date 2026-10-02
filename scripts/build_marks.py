#!/usr/bin/env python3
"""Write shared/marks.js: the Net Works marks the Halloween wallpapers draw with.

A page opened from disk cannot read pixels out of an image file, and two of the
wallpapers have to (the waterfall rebuilds a mark out of noise), so the marks
ship as data URIs in a script, the way the coastlines and the Moon maps do.

The marks are Net Works' own, from the Icon Demos set:
    bat       Nightwing        ghost     Haunt
    pumpkin   Emberjack        skull     Nullskull
ghostRed is Haunt as a flat blood-red shape with its eyes cut out. maps holds
each mark's white fill as a small mask, for the wallpapers that sample one.

    py -3.13 scripts/build_marks.py
"""
import base64
import io
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = r"D:\03 Website Library\Net Works Hub\public\icon-demos"
OUT = os.path.join(ROOT, "shared", "marks.js")
RED = (204, 0, 0)


def mark(name):
    im = Image.open(os.path.join(ICONS, name)).convert("RGBA")
    return im.crop(im.getchannel("A").getbbox())


def fit(im, size):
    out = im.copy()
    out.thumbnail((size, size), Image.LANCZOS)
    return out


def uri(im):
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def parts(im):
    """(silhouette, white fill, features cut into the fill) as boolean arrays."""
    a = np.asarray(im).astype("float32")
    shape = a[:, :, 3] > 128
    dark = a[:, :, :3].mean(axis=2) <= 128
    h, w = shape.shape
    pad = 8
    big = Image.new("L", (w + 2 * pad, h + 2 * pad), 0)
    big.paste(Image.fromarray((shape * 255).astype("uint8"), "L"), (pad, pad))
    for _ in range(int(min(w, h) * 0.07)):          # past the outline's own thickness
        big = big.filter(ImageFilter.MinFilter(3))
    inner = np.asarray(big.crop((pad, pad, pad + w, pad + h))) > 128
    return shape, shape & ~dark, shape & dark & inner


def fill_map(im, size=256):
    _, fill, _ = parts(im)
    return fit(Image.fromarray((fill * 255).astype("uint8"), "L").convert("RGB"), size)


def red(im):
    shape, _, feat = parts(im)
    h, w = shape.shape
    out = np.zeros((h, w, 4), "uint8")
    out[:, :, 0], out[:, :, 1], out[:, :, 2] = RED
    out[:, :, 3] = (shape & ~feat) * 255
    return Image.fromarray(out, "RGBA")


def main():
    bat, ghost = mark("bwt-mini-nightwing.png"), mark("bwt-mini-haunt.png")
    pumpkin, skull = mark("bwt-mini-emberjack.png"), mark("bwt-mini-nullskull.png")
    items = [
        ("bat", uri(fit(bat, 420))),
        ("ghost", uri(fit(ghost, 640))),
        ("ghostRed", uri(fit(red(ghost), 320))),
    ]
    maps = [("ghost", uri(fill_map(ghost))), ("pumpkin", uri(fill_map(pumpkin))), ("skull", uri(fill_map(skull)))]
    lines = ["/* Net // Works marks for the Halloween wallpapers, as data URIs.",
             " * Copyright (c) 2026 Net Works Lab LLC. All rights reserved. See LICENSE.txt.",
             " * Built by scripts/build_marks.py from the Icon Demos set: Nightwing, Haunt, Emberjack, Nullskull. */",
             "window.NW_MARKS = {"]
    lines += ['  %s: "%s",' % kv for kv in items]
    lines.append("  maps: {")
    lines += ['    %s: "%s"%s' % (k, v, "," if n < len(maps) - 1 else "") for n, (k, v) in enumerate(maps)]
    lines += ["  }", "};", ""]
    io.open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
    print("wrote %s  %.1f KB" % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT) / 1024))


if __name__ == "__main__":
    main()
