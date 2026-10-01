#!/usr/bin/env python3
"""Write LivelyInfo.json and LivelyProperties.json for every wallpaper.

The settings every wallpaper shares (speed, theme, the corner wordmark) are
defined once here so their wording and ranges stay the same across the
collection; each wallpaper adds its own in between.

    py -3.13 scripts/build_lively_json.py
"""
import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LICENSE = ("Proprietary. Copyright (c) 2026 Net Works Lab LLC. All rights reserved. "
           "Personal, non-commercial use only; see LICENSE.txt.")
CONTACT = "https://github.com/Ringmast4r/Lively-Wallpapers"

SPEED = ("speed", {"type": "slider", "text": "Speed (100 = one turn in 14 s)", "value": 40, "min": 0, "max": 200, "step": 5})
THEME = ("theme", {"type": "dropdown", "text": "Theme", "value": 0, "items": ["Dark", "Light"]})
MARK = ("mark", {"type": "checkbox", "text": "Corner wordmark", "value": True})
CORNER = ("corner", {"type": "textbox", "text": "Right corner text", "value": "NET-WORKS-LAB.COM"})


def rings(text="Orbit rings", value=True):
    return ("orbits", {"type": "checkbox", "text": text, "value": value})


WALLPAPERS = {
    "networks-globe": {
        "desc": "The Net // Works globe, spinning: a black and white low-polygon world with a graticule and two "
                "orbit rings. Speed, dark or light, rings and corner text are settings.",
        "props": [SPEED, THEME, rings(), MARK, CORNER],
    },
    "pumpkin-globe": {
        "desc": "The Net // Works globe as a pumpkin: the flat orange drawing with a carved face and orbit rings, "
                "or the shaded jack-o'-lantern lit from inside. Pick the look in the settings.",
        "props": [SPEED,
                  ("look", {"type": "dropdown", "text": "Look", "value": 0, "items": ["Pumpkin", "Jack-o'-lantern"]}),
                  THEME, rings("Orbit rings (Pumpkin look)"), MARK, CORNER],
    },
    "moon": {
        "desc": "The Moon, turning under a fixed light: the real surface from NASA's Lunar Reconnaissance Orbiter, "
                "with craters that shade at the terminator. Or switch to the two-tone house drawing.",
        "props": [SPEED,
                  ("style", {"type": "dropdown", "text": "Look", "value": 0, "items": ["Photograph", "Two-tone"]}),
                  ("sun", {"type": "slider", "text": "Sunlight angle (0 = full Moon, 90 = half)", "value": 55, "min": 0, "max": 150, "step": 5}),
                  rings("Orbit rings", False), THEME, MARK, CORNER],
    },
    "dot-matrix-globe": {
        "desc": "The coastline, resampled: no outlines, only dots on an equal-area lattice that shrink and fade "
                "toward the limb.",
        "props": [SPEED, ("grid", {"type": "checkbox", "text": "Graticule", "value": True}), THEME, MARK, CORNER],
    },
    "great-circles": {
        "desc": "Routes, not places: great-circle arcs between cities, lifted off a quiet dotted globe, each "
                "carrying a pulse.",
        "props": [SPEED, THEME, MARK, CORNER],
    },
    "engraved-globe": {
        "desc": "Continents made of parallels: one ruled line per parallel that thickens over land, the way a "
                "banknote builds a shape.",
        "props": [SPEED, THEME, MARK, CORNER],
    },
}


def write(path, obj):
    io.open(path, "w", encoding="utf-8", newline="\n").write(json.dumps(obj, indent=2) + "\n")


def main():
    titles = {w["id"]: w["title"] for w in json.load(io.open(os.path.join(ROOT, "wallpapers.json"), encoding="utf-8"))}
    for wid, spec in WALLPAPERS.items():
        folder = os.path.join(ROOT, "wallpapers", wid)
        write(os.path.join(folder, "LivelyInfo.json"), {
            "AppVersion": "2.2.1.0",
            "Title": titles[wid],
            "Thumbnail": "thumbnail.jpg",
            "Preview": "preview.gif",
            "Desc": spec["desc"],
            "Author": "Net Works",
            "License": LICENSE,
            "Contact": CONTACT,
            "Type": 1,
            "FileName": "index.html",
            "Arguments": None,
            "IsAbsolutePath": False,
        })
        write(os.path.join(folder, "LivelyProperties.json"), dict(spec["props"]))
        print("  %-20s %d settings" % (wid, len(spec["props"])))


if __name__ == "__main__":
    main()
