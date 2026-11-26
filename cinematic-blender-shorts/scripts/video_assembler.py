#!/usr/bin/env python3
"""Assemble rendered shots + captions + sound into the final 9:16 MP4 (ffmpeg + libass).

    python3 video_assembler.py PROJECT_DIR [--profile review] [--out out.mp4] [--no-captions]

Reads PROJECT_DIR/project.json:
  {"fps": 30, "resolution": [1440, 2560],
   "shots": ["s01_padlock", ...],                      # order; frames from renders/<profile>/<shot>/
   "captions": [{"t0": 0.2, "t1": 1.1, "text": "A padlock"}, ...],   # 1-3 words each
   "narration": "audio/narration.wav" (optional),
   "audio": {... see audio_tools.py ...},
   "finish": {"grain": 4, "vignette": 0.25, "sharpen": 0.3}}
Captions follow the reference style: white extra-bold, soft dark shadow, centred ~76 % down.
"""
import argparse
import glob
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONT_DIR = os.path.join(ROOT, "assets", "fonts")
sys.path.insert(0, HERE)


def ass_time(t):
    h, m = int(t // 3600), int(t % 3600 // 60)
    s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def write_ass(captions, w, h, path, size_frac=0.052, y_frac=0.72, side_frac=0.14):
    """Captions inside the YouTube Shorts safe area: the right ~12 % (buttons) and the bottom
    ~20 % (title/description) are covered by the player UI, so text is centred at 72 % height
    and wrapped within 72 % of the width (side margins 14 %)."""
    size = int(h * size_frac)
    margin_v = int(h * (1 - y_frac)) - size // 2
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CapTop,Montserrat ExtraBold,{size},&H00FFFFFF,&H00FFFFFF,&H50000000,&H78000000,0,0,0,0,100,100,0,0,1,{max(2, size // 22)},{max(2, size // 14)},8,{int(w * side_frac)},{int(w * side_frac)},{int(h * 0.16)},1
Style: Cap,Montserrat ExtraBold,{size},&H00FFFFFF,&H00FFFFFF,&H50000000,&H78000000,0,0,0,0,100,100,0,0,1,{max(2, size // 22)},{max(2, size // 14)},2,{int(w * side_frac)},{int(w * side_frac)},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for c in captions:
        # quick pop-in (scale 85% -> 100% in 80 ms) like the reference's word swaps
        body = c["text"]
        while body.count("*") >= 2:   # *emphasis* -> warm gold, same weight (reference keeps captions white)
            body = body.replace("*", "{\\c&H4FC8F5&}", 1).replace("*", "{\\c&HFFFFFF&}", 1)
        txt = "{\\fscx85\\fscy85\\t(0,80,\\fscx100\\fscy100)\\blur0.6}" + body
        style = "CapTop" if c.get("pos") == "top" else "Cap"   # "pos": "top" when the action sits low in frame
        lines.append(f"Dialogue: 0,{ass_time(c['t0'])},{ass_time(c['t1'])},{style},,0,0,0,,{txt}")
    with open(path, "w") as fh:
        fh.write(head + "\n".join(lines) + "\n")
    return path


def frames_of(project_dir, profile, shot):
    d = os.path.join(project_dir, "renders", profile, shot)
    files = sorted(glob.glob(os.path.join(d, "[0-9][0-9][0-9][0-9].jpg")) +
                   glob.glob(os.path.join(d, "[0-9][0-9][0-9][0-9].png")))
    return d, files


def assemble(project_dir, profile="review", out=None, captions=True, audio=True):
    pj = json.load(open(os.path.join(project_dir, "project.json")))
    fps = pj.get("fps", 30)
    W, H = pj.get("resolution", [1440, 2560])
    if profile not in ("final", "final_fast"):
        W, H = W // 2, H // 2  # review deliverable at half res (quick to encode/share)
    build = os.path.join(project_dir, "build")
    os.makedirs(build, exist_ok=True)
    out = out or os.path.join(project_dir, "output", f"{os.path.basename(project_dir)}_{profile}.mp4")
    os.makedirs(os.path.dirname(out), exist_ok=True)

    # 1) frame list across shots, checking continuity (missing frames are an error, not a skip)
    listfile = os.path.join(build, "frames.txt")
    total = 0
    with open(listfile, "w") as fh:
        for shot in pj["shots"]:
            d, files = frames_of(project_dir, profile, shot)
            if not files:
                raise SystemExit(f"no frames for {shot} in {d}")
            nums = [int(os.path.basename(f)[:4]) for f in files]
            gaps = sorted(set(range(nums[0], nums[-1] + 1)) - set(nums))
            if gaps:
                raise SystemExit(f"{shot}: missing frames {gaps[:20]}{'...' if len(gaps) > 20 else ''}")
            for f in files:
                fh.write(f"file '{f}'\nduration {1 / fps:.6f}\n")
            total += len(files)
        fh.write(f"file '{files[-1]}'\n")
    dur = total / fps

    # 2) audio
    inputs = ["-f", "concat", "-safe", "0", "-i", listfile]
    amap = []
    if audio and pj.get("foley"):
        # event-driven Foley: each shot's build() exported build/events_<shot>.json
        import foley
        import numpy as np
        from scipy.io import wavfile
        evs, t0 = [], 0.0
        for shot in pj["shots"]:
            ej = json.load(open(os.path.join(project_dir, "build", f"events_{shot}.json")))
            for e in ej["events"]:
                e = dict(e)
                e["t"] = e["t"] + t0
                if "until" in e:
                    e["until"] = e["until"] + t0
                evs.append(e)
            t0 += len(frames_of(project_dir, profile, shot)[1]) / fps
        fc = pj["foley"]
        voice = None
        if pj.get("narration"):      # duck Foley under the voice (sidechain), then mix at -16 LUFS
            sr_v, voice = wavfile.read(os.path.join(project_dir, pj["narration"]))
            voice = voice.astype(float) / (32768.0 if voice.dtype.kind == "i" else 1.0)
            if sr_v != foley.SR:
                from scipy.signal import resample_poly
                voice = resample_poly(voice, foley.SR, sr_v, axis=0)
        st, info, log = foley.render(evs, fc["recipes"], dur, fc.get("space_timeline"), fc.get("ambience"),
                                     fc.get("target_lufs", -20.0), fc.get("tp_ceiling", -1.0),
                                     duck_voice=voice, duck_db=fc.get("duck_db", -8.0))
        wav = os.path.join(build, "foley.wav")
        wavfile.write(wav, foley.SR, (st * 32767).astype(np.int16))
        json.dump(dict(info=info, events=log), open(os.path.join(build, "foley_log.json"), "w"), indent=1)
        print("[video_assembler] foley", info)
        inputs += ["-i", wav]
        if pj.get("narration"):
            inputs += ["-i", os.path.join(project_dir, pj["narration"])]
            amap = ["-filter_complex", "[1:a][2:a]amix=inputs=2:normalize=0[aout]", "-map", "[aout]"]
        else:
            amap = ["-map", "1:a"]
    elif audio and pj.get("audio"):
        import audio_tools
        a = dict(pj["audio"])
        a["duration"] = dur
        wav = audio_tools.render_mix(a, project_dir, os.path.join(build, "sfx.wav"))
        inputs += ["-i", wav]
        if pj.get("narration"):
            inputs += ["-i", os.path.join(project_dir, pj["narration"])]
            amap = ["-filter_complex", "[1:a][2:a]amix=inputs=2:normalize=0[aout]", "-map", "[aout]"]
        else:
            amap = ["-map", "1:a"]

    # 3) video filters: scale, finish (subtle), captions
    fin = pj.get("finish", {})
    vf = [f"fps={fps}", f"scale={W}:{H}:flags=lanczos"]
    if fin.get("sharpen"):
        vf.append(f"unsharp=5:5:{fin['sharpen']}:5:5:0")
    if fin.get("vignette"):
        vf.append(f"vignette=angle={fin['vignette']}")
    if fin.get("grain"):
        vf.append(f"noise=alls={fin['grain']}:allf=t")
    if captions and pj.get("captions"):
        ass = write_ass(pj["captions"], W, H, os.path.join(build, "captions.ass"))
        vf.append(f"subtitles={ass}:fontsdir={FONT_DIR}")
    vf.append("format=yuv420p")
    cmd = ["ffmpeg", "-y", "-v", "error"] + inputs + ["-map", "0:v"] + amap + [
        "-vf", ",".join(vf), "-r", str(fps), "-c:v", "libx264", "-preset", "slow", "-crf", "16",
        "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "192k", "-t", f"{dur:.3f}", out]
    subprocess.run(cmd, check=True)
    print(f"[video_assembler] {out}  {W}x{H} {fps}fps {total} frames {dur:.2f}s")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    ap.add_argument("--profile", default="review")
    ap.add_argument("--out", default=None)
    ap.add_argument("--no-captions", action="store_true")
    ap.add_argument("--no-audio", action="store_true")
    a = ap.parse_args()
    assemble(os.path.abspath(a.project_dir), a.profile, a.out, not a.no_captions, not a.no_audio)
