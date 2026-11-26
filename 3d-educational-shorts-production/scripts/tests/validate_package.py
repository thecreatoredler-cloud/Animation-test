#!/usr/bin/env python3
"""Validate the skill folder and (optionally) build + verify the upload ZIP.

    python3 scripts/tests/validate_package.py [--zip OUT.zip]

Checks: SKILL.md YAML frontmatter (name <= 64 chars, [a-z0-9-], matches folder; description
<= 200 chars per the Claude Help Center), required files, every relative path mentioned in
SKILL.md / README / references / templates exists, every script compiles and is listed in
scripts/README.md, no machine-specific absolute paths, no secrets/credentials/personal emails,
no stray runtime outputs. The ZIP has the skill FOLDER at its root (not loose files, not nested twice).
"""
import argparse
import os
import py_compile
import re
import sys
import zipfile

SKILL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NAME = os.path.basename(SKILL)
REQUIRED = ["SKILL.md", "README.md", "scripts/README.md",
            "templates/content-brief.md", "templates/fact-check-sheet.md", "templates/shot-list.md",
            "templates/asset-manifest.csv", "templates/final-qc-checklist.md"] + [
            f"references/{n}.md" for n in ("visual-language", "content-archetypes", "story-and-script-pipeline",
                                           "blender-scene-building", "camera-and-composition", "animation-and-rigging",
                                           "lighting-materials-and-rendering", "sound-and-editing",
                                           "asset-library-and-licensing", "render-benchmarks", "quality-control",
                                           "lessons-learned")]
EXCLUDE = {"__pycache__", ".gitignore", "environment_report.json", "_envtest.png"}
SECRET_PAT = re.compile(r"(api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9]{12,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|"
                        r"AKIA[0-9A-Z]{16}|password\s*[:=]\s*['\"][^'\"]+['\"]|[A-Za-z0-9._%+-]+@(gmail|outlook|yahoo)\.com)", re.I)
ABS_PAT = re.compile(r"(/home/[a-z]|/root/|/opt/bvenv|/tmp/claude|/Users/[A-Za-z]|C:\\\\Users)")


def files():
    for root, dirs, fs in os.walk(SKILL):
        dirs[:] = [d for d in dirs if d not in EXCLUDE]
        for f in fs:
            if f not in EXCLUDE and not f.endswith(".pyc"):
                yield os.path.relpath(os.path.join(root, f), SKILL)


def check():
    errs, notes = [], []
    s = open(os.path.join(SKILL, "SKILL.md")).read()
    m = re.match(r"^---\n(.*?)\n---\n", s, re.S)
    if not m:
        errs.append("SKILL.md: no YAML frontmatter")
    else:
        fm = dict(re.findall(r"^(\w+):\s*(.*)$", m.group(1), re.M))
        name, desc = fm.get("name", ""), fm.get("description", "")
        if not re.fullmatch(r"[a-z0-9-]{1,64}", name):
            errs.append(f"name invalid: {name!r}")
        if name != NAME:
            errs.append(f"name {name!r} != folder {NAME!r}")
        if not desc or len(desc) > 200:
            errs.append(f"description length {len(desc)} (must be 1-200)")
        notes.append(f"frontmatter ok: name={name} ({len(name)} chars), description {len(desc)} chars")
    for r in REQUIRED:
        if not os.path.exists(os.path.join(SKILL, r)):
            errs.append(f"missing required file {r}")
    all_files = set(files())
    # relative path references in markdown: `scripts/x.py`, `references/x.md`, `templates/...`, `examples/...`
    ref_pat = re.compile(r"`((?:scripts|references|templates|examples|assets)/[A-Za-z0-9_./-]+)`")
    for f in [x for x in all_files if x.endswith(".md")]:
        txt = open(os.path.join(SKILL, f)).read()
        base = os.path.dirname(f)
        for ref in ref_pat.findall(txt):
            ref = ref.rstrip("/.")
            cand = [ref, os.path.normpath(os.path.join(base, ref))]
            if not any(os.path.exists(os.path.join(SKILL, c)) for c in cand):
                errs.append(f"{f}: broken reference `{ref}`")
        for ref in re.findall(r"`(\.\./references/[A-Za-z0-9_.-]+)`", txt):
            if not os.path.exists(os.path.normpath(os.path.join(SKILL, base, ref))):
                errs.append(f"{f}: broken reference `{ref}`")
    readme = open(os.path.join(SKILL, "scripts", "README.md")).read()
    for f in sorted(x for x in all_files if x.startswith("scripts/") and x.endswith(".py") and "/tests/" not in x):
        try:
            py_compile.compile(os.path.join(SKILL, f), doraise=True)
        except py_compile.PyCompileError as e:
            errs.append(f"{f}: does not compile: {e}")
        if os.path.basename(f) not in readme:
            errs.append(f"{f}: not documented in scripts/README.md")
    for f in all_files:
        if f.endswith((".py", ".md", ".csv", ".json", ".txt")):
            txt = open(os.path.join(SKILL, f), errors="ignore").read()
            if f != "scripts/tests/validate_package.py":
                for hit in ABS_PAT.findall(txt):
                    errs.append(f"{f}: machine-specific path {hit!r}")
                for hit in SECRET_PAT.findall(txt):
                    errs.append(f"{f}: possible secret/personal data {hit!r}")
    notes.append(f"{len(all_files)} files checked")
    return errs, notes, sorted(all_files)


def build_zip(out, all_files):
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in all_files:
            z.write(os.path.join(SKILL, f), arcname=f"{NAME}/{f}")
    with zipfile.ZipFile(out) as z:
        names = z.namelist()
    tops = {n.split("/")[0] for n in names}
    errs = []
    if tops != {NAME}:
        errs.append(f"zip root must be exactly the folder {NAME}/, found {tops}")
    if f"{NAME}/SKILL.md" not in names:
        errs.append("zip: SKILL.md not at <folder>/SKILL.md")
    if any(n.startswith(f"{NAME}/{NAME}/") for n in names):
        errs.append("zip: nested twice")
    return errs, names


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zip", default=None)
    a = ap.parse_args()
    errs, notes, all_files = check()
    if a.zip and not errs:
        zerrs, names = build_zip(a.zip, all_files)
        errs += zerrs
        notes.append(f"zip: {a.zip} ({os.path.getsize(a.zip) / 1e6:.2f} MB, {len(names)} entries, root {NAME}/)")
    print("\n".join("NOTE  " + n for n in notes))
    print("\n".join("ERROR " + e for e in errs) or "ALL CHECKS PASSED")
    sys.exit(1 if errs else 0)
