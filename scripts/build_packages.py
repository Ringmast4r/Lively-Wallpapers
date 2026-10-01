#!/usr/bin/env python3
"""Zip each folder under wallpapers/ into packages/<name>.zip.

Lively Wallpaper installs a zip that has LivelyInfo.json at its root when the
zip is dragged onto the Lively window, so the files go in flat, not inside a
folder. Entries are sorted and stamped with a fixed date so that rebuilding an
unchanged wallpaper produces a byte-identical zip and git stays quiet.

    py -3.13 scripts/build_packages.py
"""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "wallpapers")
OUT = os.path.join(ROOT, "packages")
STAMP = (2026, 1, 1, 0, 0, 0)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name in sorted(os.listdir(SRC)):
        folder = os.path.join(SRC, name)
        if not os.path.isfile(os.path.join(folder, "LivelyInfo.json")):
            continue
        files = []
        for base, dirs, names in os.walk(folder):
            dirs.sort()
            for n in sorted(names):
                full = os.path.join(base, n)
                files.append((os.path.relpath(full, folder).replace(os.sep, "/"), full))
        path = os.path.join(OUT, name + ".zip")
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for arc, full in files:
                info = zipfile.ZipInfo(arc, STAMP)
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o644 << 16
                with open(full, "rb") as fh:
                    z.writestr(info, fh.read())
        print("  %-28s %7.1f KB  %d files" % (name + ".zip", os.path.getsize(path) / 1024, len(files)))


if __name__ == "__main__":
    main()
