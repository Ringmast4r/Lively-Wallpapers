#!/usr/bin/env python3
"""Copy the shared files into each wallpaper folder, then zip each one into packages/.

A Lively wallpaper has to be one self-contained folder, so the files the
wallpapers have in common (the kit, the coastline data, the font, the license)
are kept once under shared/ and copied in here. wallpapers.json says which
wallpaper takes which shared files; every wallpaper gets fonts/ and LICENSE.txt.

Lively installs a zip that has LivelyInfo.json at its root when the zip is
dragged onto the Lively window, so the files go in flat, not inside a folder.
Entries are sorted and stamped with a fixed date so that rebuilding an unchanged
wallpaper produces a byte-identical zip and git stays quiet.

    py -3.13 scripts/build_packages.py
"""
import io
import json
import os
import shutil
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "wallpapers")
SHARED = os.path.join(ROOT, "shared")
OUT = os.path.join(ROOT, "packages")
STAMP = (2026, 1, 1, 0, 0, 0)


def copy_if_changed(src, dst):
    data = open(src, "rb").read()
    if os.path.isfile(dst) and open(dst, "rb").read() == data:
        return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, "wb").write(data)


def sync(wp):
    folder = os.path.join(SRC, wp["id"])
    for name in wp.get("shared", []):
        copy_if_changed(os.path.join(SHARED, name), os.path.join(folder, name))
    for name in sorted(os.listdir(os.path.join(SHARED, "fonts"))):
        copy_if_changed(os.path.join(SHARED, "fonts", name), os.path.join(folder, "fonts", name))
    copy_if_changed(os.path.join(ROOT, "LICENSE"), os.path.join(folder, "LICENSE.txt"))


def main():
    os.makedirs(OUT, exist_ok=True)
    for wp in json.load(io.open(os.path.join(ROOT, "wallpapers.json"), encoding="utf-8")):
        folder = os.path.join(SRC, wp["id"])
        sync(wp)
        if not os.path.isfile(os.path.join(folder, "LivelyInfo.json")):
            print("  %-28s no LivelyInfo.json yet, not zipped" % wp["id"])
            continue
        files = []
        for base, dirs, names in os.walk(folder):
            dirs.sort()
            for n in sorted(names):
                full = os.path.join(base, n)
                files.append((os.path.relpath(full, folder).replace(os.sep, "/"), full))
        path = os.path.join(OUT, wp["id"] + ".zip")
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for arc, full in files:
                info = zipfile.ZipInfo(arc, STAMP)
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o644 << 16
                with open(full, "rb") as fh:
                    z.writestr(info, fh.read())
        print("  %-28s %7.1f KB  %d files" % (wp["id"] + ".zip", os.path.getsize(path) / 1024, len(files)))


if __name__ == "__main__":
    main()
