#!/usr/bin/env python3
"""Turn a Natural Earth countries GeoJSON into shared/land-110m.js.

The wallpapers that show the real coastlines only need to know land from sea,
so every polygon ring is kept as a flat list of integers (longitude x 100,
latitude x 100) and the country properties are dropped. The page fills all the
rings in one even-odd path to get a land bitmap at whatever size it wants.

    py -3.13 scripts/build_land.py path/to/ne_110m_admin_0_countries.geojson

Natural Earth is public domain: https://www.naturalearthdata.com/
"""
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "shared", "land-110m.js")


def main():
    geo = json.load(io.open(sys.argv[1], encoding="utf-8"))
    rings, points = [], 0
    for f in geo["features"]:
        g = f.get("geometry")
        if not g:
            continue
        polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"] if g["type"] == "MultiPolygon" else []
        for poly in polys:
            for ring in poly:
                flat = []
                for lon, lat in ring:
                    pt = (round(lon * 100), round(lat * 100))
                    if flat[-2:] != list(pt):          # drop points that collapse onto the previous one
                        flat.extend(pt)
                if len(flat) >= 6:
                    rings.append(flat)
                    points += len(flat) // 2
    body = ",\n".join("[" + ",".join(str(v) for v in r) + "]" for r in rings)
    text = ("/* Land outlines from Natural Earth 1:110m (public domain, naturalearthdata.com).\n"
            "   Each ring is [lon*100, lat*100, ...]. Built by scripts/build_land.py. */\n"
            "window.NW_LAND110 = [\n" + body + "\n];\n")
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(text)
    print("%s: %d rings, %d points, %.0f KB" % (os.path.relpath(OUT, ROOT), len(rings), points, len(text) / 1024))


if __name__ == "__main__":
    main()
