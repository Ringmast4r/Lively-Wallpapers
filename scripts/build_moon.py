#!/usr/bin/env python3
"""Build wallpapers/moon/moon-data.js from NASA's CGI Moon Kit.

    py -3.13 scripts/build_moon.py lroc_color_poles_4k.tif ldem_16.tif     # needs numpy, pillow

Source: NASA's Scientific Visualization Studio, CGI Moon Kit
(https://svs.gsfc.nasa.gov/4720) - the LROC wide-angle colour mosaic and the
LOLA elevation model from Lunar Reconnaissance Orbiter. NASA imagery is in the
public domain.

Two pictures go into the data file, as base64 JPEGs, because a page opened from
disk may not read pixels out of an image file but may always read a script:

  albedo   the surface brightness, greyscale, 4096 x 2048
  relief   the slope of the ground, 2048 x 1024: red is the slope toward the
           east and green toward the north (0.5 = level), worked out from the
           elevation model at full precision so that craters cast shading when
           the wallpaper lights them from the side
"""
import base64
import io
import os
import sys

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "wallpapers", "moon", "moon-data.js")
MOON_RADIUS_KM = 1737.4
SLOPE_RANGE = 0.6    # a slope of +-0.6 (31 degrees) fills the 0..1 range


def jpeg(img, quality, **kw):
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=quality, optimize=True, **kw)
    return buf.getvalue()


def main():
    colour, dem = sys.argv[1], sys.argv[2]

    albedo = Image.open(colour).convert("L").resize((4096, 2048), Image.LANCZOS)
    a = jpeg(albedo, 84)

    w, h = 2048, 1024
    km = np.asarray(Image.open(dem).resize((w, h), Image.BOX), dtype=np.float64)   # elevation, km
    lat = (0.5 - (np.arange(h) + 0.5) / h) * np.pi
    step_lon = 2 * np.pi / w * MOON_RADIUS_KM * np.maximum(np.cos(lat), 0.02)[:, None]   # km per pixel, east
    step_lat = np.pi / h * MOON_RADIUS_KM                                                # km per pixel, north
    east = (np.roll(km, -1, axis=1) - np.roll(km, 1, axis=1)) / (2 * step_lon)
    north = np.zeros_like(km)
    north[1:-1] = (km[:-2] - km[2:]) / (2 * step_lat)     # row 0 is the north pole
    enc = lambda s: np.clip(0.5 + s / (2 * SLOPE_RANGE), 0, 1)
    rgb = np.stack([enc(east), enc(north), np.full_like(km, 0.5)], axis=-1)
    relief = Image.fromarray((rgb * 255 + 0.5).astype(np.uint8), "RGB")
    r = jpeg(relief, 88, subsampling=0)

    text = ("/* The Moon: surface brightness and ground slope, from NASA's CGI Moon Kit\n"
            "   (Scientific Visualization Studio; LROC and LOLA, Lunar Reconnaissance Orbiter).\n"
            "   NASA imagery is in the public domain. Built by scripts/build_moon.py. */\n"
            "window.NW_MOON = {\n"
            "  slopeRange: %s,\n"
            "  albedo: \"data:image/jpeg;base64,%s\",\n"
            "  relief: \"data:image/jpeg;base64,%s\"\n"
            "};\n" % (SLOPE_RANGE, base64.b64encode(a).decode(), base64.b64encode(r).decode()))
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(text)
    print("albedo %.0f KB, relief %.0f KB -> %s %.2f MB" % (len(a) / 1024, len(r) / 1024, os.path.relpath(OUT, ROOT), len(text) / 1048576))
    print("albedo levels: p5=%d p50=%d p95=%d" % tuple(np.percentile(np.asarray(albedo), [5, 50, 95])))
    print("slope: p1=%.3f p99=%.3f (east), p1=%.3f p99=%.3f (north)" % (*np.percentile(east, [1, 99]), *np.percentile(north, [1, 99])))


if __name__ == "__main__":
    main()
