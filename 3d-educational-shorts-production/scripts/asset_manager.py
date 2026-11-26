#!/usr/bin/env python3
"""Download CC0 assets (Poly Haven, ambientCG) into assets/ and record them in the registry.

    python3 asset_manager.py search polyhaven hdris studio
    python3 asset_manager.py get polyhaven hdri studio_small_09 --res 1k
    python3 asset_manager.py get polyhaven texture rough_wood --res 1k
    python3 asset_manager.py get polyhaven model wooden_table_02 --res 1k
    python3 asset_manager.py get ambientcg texture Wood049 --res 1K-JPG
    python3 asset_manager.py list

Registry: assets/registry.json (name, source, licence, url, format, files, intended use, date).
Only CC0 sources are automated. Anything else must be added by hand with its licence verified
(references/asset_licenses.md). Downloads are checked against Poly Haven's md5 when given.
Zip archives are opened in Python (never executed), only image/model files are extracted.
Network: the session must allow api.polyhaven.com, dl.polyhaven.org and ambientcg.com.
"""
import argparse
import datetime
import hashlib
import io
import json
import os
import sys
import urllib.parse
import urllib.request
import zipfile

ROOT = os.environ.get("SHORTS_WORKSPACE", os.getcwd())   # assets live in the workspace, not the skill
ASSETS = os.path.join(ROOT, "assets")
REG = os.path.join(ASSETS, "registry.json")
UA = {"User-Agent": "cinematic-blender-shorts-asset-manager/1.0"}
SAFE_EXT = {".jpg", ".jpeg", ".png", ".exr", ".hdr", ".gltf", ".glb", ".bin"}  # never .blend (may embed scripts)


def fetch(url, binary=True):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    return data if binary else json.loads(data)


def registry():
    if os.path.exists(REG):
        return json.load(open(REG))
    return []


def register(entry):
    reg = [e for e in registry() if not (e["source"] == entry["source"] and e["id"] == entry["id"])]
    reg.append(entry)
    json.dump(sorted(reg, key=lambda e: (e["source"], e["id"])), open(REG, "w"), indent=1)


def save(path, data, md5=None):
    if md5 and hashlib.md5(data).hexdigest() != md5:
        raise SystemExit(f"md5 mismatch for {path}")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(data)
    return path


# --------------------------------------------------------------- Poly Haven
PH_KIND = {"hdri": "hdris", "texture": "textures", "model": "models"}
PH_DIR = {"hdri": "hdri", "texture": "textures", "model": "objects"}


def ph_get(kind, asset_id, res="1k", use=""):
    files = fetch(f"https://api.polyhaven.com/files/{asset_id}", binary=False)
    info = fetch(f"https://api.polyhaven.com/info/{asset_id}", binary=False)
    out_dir = os.path.join(ASSETS, PH_DIR[kind], "polyhaven", asset_id)
    saved = []
    if kind == "hdri":
        f = files["hdri"][res]["hdr"]
        saved.append(save(os.path.join(out_dir, os.path.basename(f["url"])), fetch(f["url"]), f["md5"]))
        fmt = "HDR"
    else:
        key = "gltf"
        if key not in files:
            raise SystemExit(f"{asset_id}: no glTF on Poly Haven (have {list(files)})")
        g = files[key][res]["gltf"]
        saved.append(save(os.path.join(out_dir, os.path.basename(g["url"])), fetch(g["url"]), g.get("md5")))
        for rel, inc in g.get("include", {}).items():  # textures + .bin referenced by the gltf
            saved.append(save(os.path.join(out_dir, rel), fetch(inc["url"]), inc.get("md5")))
        fmt = "glTF 2.0 (+bin, textures)"
    register(dict(id=asset_id, name=info.get("name", asset_id), source="Poly Haven", kind=kind,
                  licence="CC0 1.0", url=f"https://polyhaven.com/a/{asset_id}",
                  authors=list(info.get("authors", {}).keys()), resolution=res, format=fmt,
                  files=[os.path.relpath(p, ROOT) for p in saved], blender="import via gltf / image",
                  intended_use=use, date=str(datetime.date.today())))
    return saved


def ph_search(kind, term):
    data = fetch(f"https://api.polyhaven.com/assets?t={PH_KIND[kind.rstrip('s')] if kind.rstrip('s') in PH_KIND else kind}",
                 binary=False)
    term = term.lower()
    hits = [(k, v["name"]) for k, v in data.items()
            if term in k or term in v["name"].lower() or any(term in t for t in v.get("tags", []))
            or any(term in c for c in v.get("categories", []))]
    return hits[:40]


# --------------------------------------------------------------- ambientCG
def acg_get(asset_id, res="1K-JPG", use=""):
    d = fetch(f"https://ambientcg.com/api/v2/full_json?id={urllib.parse.quote(asset_id)}&include=downloadData",
              binary=False)
    a = d["foundAssets"][0]
    dl = [x for x in a["downloadFolders"]["default"]["downloadFiletypeCategories"]["zip"]["downloads"]
          if x["attribute"] == res][0]
    z = zipfile.ZipFile(io.BytesIO(fetch(dl["downloadLink"])))
    out_dir = os.path.join(ASSETS, "textures", "ambientcg", asset_id)
    saved = []
    for n in z.namelist():
        base = os.path.basename(n)
        if not base or os.path.splitext(base)[1].lower() not in SAFE_EXT or ".." in n:
            continue
        saved.append(save(os.path.join(out_dir, base), z.read(n)))
    register(dict(id=asset_id, name=asset_id, source="ambientCG", kind=a.get("dataType", "Material").lower(),
                  licence="CC0 1.0", url=f"https://ambientcg.com/view?id={asset_id}", authors=["ambientCG"],
                  resolution=res, format="JPG/PNG PBR maps", files=[os.path.relpath(p, ROOT) for p in saved],
                  blender="materials.image_pbr()", intended_use=use, date=str(datetime.date.today())))
    return saved


def acg_search(term):
    d = fetch(f"https://ambientcg.com/api/v2/full_json?q={urllib.parse.quote(term)}&limit=30&type=Material",
              binary=False)
    return [(a["assetId"], a.get("displayName", "")) for a in d.get("foundAssets", [])]


def maps(asset_dir):
    """Find colour/roughness/normal maps in a downloaded texture folder (for materials.image_pbr)."""
    fs = os.listdir(asset_dir)

    def pick(*keys):
        for k in keys:
            for f in fs:
                if k in f.lower():
                    return os.path.join(asset_dir, f)
    return dict(color=pick("_color", "diff", "albedo", "basecolor"), rough=pick("roughness", "_rough"),
                normal=pick("normalgl", "nor_gl", "normal"))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search"); s.add_argument("source"); s.add_argument("kind"); s.add_argument("term")
    g = sub.add_parser("get"); g.add_argument("source"); g.add_argument("kind"); g.add_argument("id")
    g.add_argument("--res", default=None); g.add_argument("--use", default="")
    sub.add_parser("list")
    a = ap.parse_args()
    if a.cmd == "list":
        for e in registry():
            print(f"{e['source']:10} {e['kind']:8} {e['id']:28} {e['licence']:8} {e['resolution']:7} {e['intended_use']}")
    elif a.cmd == "search":
        hits = ph_search(a.kind, a.term) if a.source == "polyhaven" else acg_search(a.term)
        for h in hits:
            print(*h)
    else:
        if a.source == "polyhaven":
            print(*ph_get(a.kind, a.id, a.res or "1k", a.use), sep="\n")
        else:
            print(*acg_get(a.id, a.res or "1K-JPG", a.use), sep="\n")
