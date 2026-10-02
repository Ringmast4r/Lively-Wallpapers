#!/usr/bin/env python3
"""Write shared/marks.js: the Net Works marks the October wallpapers draw with.

A page opened from disk cannot read pixels out of an image file, and several of
the wallpapers have to (the waterfall rebuilds a mark out of noise, the numbers
station out of digits), so the marks ship as data in a script, the way the
coastlines and the Moon maps do.

The marks are Net Works' own, from the Icon Demos set:
    bat       Nightwing        ghost     Haunt
    pumpkin   Emberjack        skull     Nullskull

    bat, ghost      the marks as pictures
    ghostRed        Haunt as a flat blood-red shape with its eyes cut out
    maps            each mark as a small mask: red = its white fill, green = the
                    features cut into it (eyes, nose), for wallpapers that sample one
    paths           each mark as outlines, for the oscilloscope: POINTS points in
                    all, x and y in -1..1 (y down), split into closed loops; a loop
                    is [first point, one past the last, 1 if it is a feature]

    py -3.13 scripts/build_marks.py        needs pillow, numpy and opencv-python
"""
import base64
import io
import json
import os

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = r"D:\03 Website Library\Net Works Hub\public\icon-demos"
OUT = os.path.join(ROOT, "shared", "marks.js")
RED = (204, 0, 0)
POINTS = 420


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


def mask_map(im, size=256):
    _, fill, feat = parts(im)
    rgb = np.dstack([fill, feat, np.zeros_like(fill)]).astype("uint8") * 255
    return fit(Image.fromarray(rgb, "RGB"), size)


def red(im):
    shape, _, feat = parts(im)
    h, w = shape.shape
    out = np.zeros((h, w, 4), "uint8")
    out[:, :, 0], out[:, :, 1], out[:, :, 2] = RED
    out[:, :, 3] = (shape & ~feat) * 255
    return Image.fromarray(out, "RGBA")


def outline(im):
    """The mark as closed loops of evenly spaced points: its silhouette, then its features."""
    shape, _, feat = parts(im)
    h, w = shape.shape

    def loops(mask, least):
        found, _ = cv2.findContours(mask.astype("uint8"), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        return [c[:, 0, :].astype("float64") for c in found if cv2.contourArea(c) >= least]

    outer = max(loops(shape, 0), key=len)
    feats = sorted(loops(feat, w * h * 0.0015), key=lambda c: (c[:, 0].mean(), c[:, 1].mean()))

    def length(c):
        return float(np.hypot(*np.diff(np.vstack([c, c[:1]]), axis=0).T).sum())

    def resample(c, n):
        closed = np.vstack([c, c[:1]])
        along = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(closed, axis=0).T))])
        at = np.linspace(0, along[-1], n, endpoint=False)
        pts = np.column_stack([np.interp(at, along, closed[:, 0]), np.interp(at, along, closed[:, 1])])
        return (np.roll(pts, 1, axis=0) + pts * 2 + np.roll(pts, -1, axis=0)) / 4     # take the pixel steps off

    total = length(outer) + sum(length(c) for c in feats)
    counts = [max(14, round(POINTS * length(c) / total)) for c in feats]
    all_loops = [(outer, POINTS - sum(counts), 0)] + [(c, n, 1) for c, n in zip(feats, counts)]
    half = max(w, h) / 2.0
    xs, ys, index, at = [], [], [], 0
    for c, n, is_feat in all_loops:
        pts = resample(c, n)
        xs += [round((x - w / 2.0) / half, 3) for x in pts[:, 0]]
        ys += [round((y - h / 2.0) / half, 3) for y in pts[:, 1]]
        index.append([at, at + n, is_feat])
        at += n
    return {"x": xs, "y": ys, "loops": index}


def main():
    bat, ghost = mark("bwt-mini-nightwing.png"), mark("bwt-mini-haunt.png")
    pumpkin, skull = mark("bwt-mini-emberjack.png"), mark("bwt-mini-nullskull.png")
    items = [("bat", uri(fit(bat, 420))), ("ghost", uri(fit(ghost, 640))), ("ghostRed", uri(fit(red(ghost), 320)))]
    maps = [("ghost", uri(mask_map(ghost))), ("pumpkin", uri(mask_map(pumpkin))), ("skull", uri(mask_map(skull)))]
    paths = [("ghost", outline(ghost)), ("skull", outline(skull)), ("bat", outline(bat)), ("pumpkin", outline(pumpkin))]
    lines = ["/* Net // Works marks for the October wallpapers, as data.",
             " * Copyright (c) 2026 Net Works Lab LLC. All rights reserved. See LICENSE.txt.",
             " * Built by scripts/build_marks.py from the Icon Demos set: Nightwing, Haunt, Emberjack, Nullskull. */",
             "window.NW_MARKS = {"]
    lines += ['  %s: "%s",' % kv for kv in items]
    lines.append("  maps: {")
    lines += ['    %s: "%s"%s' % (k, v, "," if n < len(maps) - 1 else "") for n, (k, v) in enumerate(maps)]
    lines += ["  },", "  paths: {"]
    lines += ["    %s: %s%s" % (k, json.dumps(v, separators=(",", ":")), "," if n < len(paths) - 1 else "")
              for n, (k, v) in enumerate(paths)]
    lines += ["  }", "};", ""]
    io.open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
    for k, v in paths:
        print("  %-8s %d points in %d loops" % (k, len(v["x"]), len(v["loops"])))
    print("wrote %s  %.1f KB" % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT) / 1024))


if __name__ == "__main__":
    main()
