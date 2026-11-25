"""Reusable object / secondary animation. Analytic curves baked per frame (deterministic).

Principles built in (standard section 6): ease in/out, anticipation, overshoot,
follow-through (damped springs), secondary motion (decaying wobble), contact
(physical bounce with squash).

    import animation_tools as at
    at.slide(key, 30, 75, (0.3,0,0), (0,0,0), ease="inout", anticipate=0.04)
    at.hinge(lid, 80, 95, axis="X", angle=-35, overshoot=0.18)
    at.drop_settle(die, 1, height=0.3, ground_z=0.0, restitution=0.35)
    at.wobble(lid, 95, axis="X", amp_deg=4, freq=6, decay=5)

All helpers take frames (scene fps assumed 30 unless fps= given) and write keys
with LINEAR interpolation (the curve shape lives in the math, not the F-curve).
"""
import math
import bpy
from mathutils import Vector, Euler
from camera_tools import ease, _linear

FPS = 30


def spring(t, freq=3.0, zeta=0.35):
    """Unit step response of a damped spring at time t (s). 0 -> 1 with overshoot.
    freq Hz, zeta damping ratio (0.2 bouncy, 0.5 firm, 1 no overshoot)."""
    if t <= 0:
        return 0.0
    w = 2 * math.pi * freq
    if zeta >= 1:
        return 1 - (1 + w * t) * math.exp(-w * t)
    wd = w * math.sqrt(1 - zeta * zeta)
    return 1 - math.exp(-zeta * w * t) * (math.cos(wd * t) + zeta / math.sqrt(1 - zeta * zeta) * math.sin(wd * t))


def bake(obj, f0, f1, fn, paths=("location", "rotation_euler", "scale"), data_path_owner=None):
    """Call fn(frame) -> dict(location=..., rotation_euler=..., scale=...) and key each frame."""
    owner = data_path_owner or obj
    for f in range(int(f0), int(f1) + 1):
        vals = fn(f)
        for p in paths:
            if p in vals:
                setattr(owner, p, vals[p])
                owner.keyframe_insert(p, frame=f)
    _linear(owner)


def slide(obj, f0, f1, p0, p1, ease_name="inout", anticipate=0.0, settle=None):
    """Move p0 -> p1. anticipate: fraction of the distance to pull back first (0.03-0.08).
    settle: dict(freq, zeta) adds a spring overshoot at the end instead of plain easing."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    n = max(1, f1 - f0)

    def fn(f):
        x = (f - f0) / n
        if anticipate and x < 0.25:
            k = -anticipate * math.sin(math.pi * x / 0.25)
        elif settle:
            tt = (f - f0) / FPS
            k = spring(tt, **settle)
        else:
            k = ease(ease_name, x)
        return dict(location=p0 + d * k)
    end = f1 if not settle else f1 + int(FPS * 1.0)
    bake(obj, f0, end, fn, paths=("location",))


def hinge(obj, f0, f1, axis="X", angle=90.0, start=None, overshoot=0.15, anticipate_deg=0.0,
          ease_name="out"):
    """Rotate about a local axis from start to start+angle with optional anticipation and
    a single overshoot-and-settle (follow-through). Pivot = object origin."""
    idx = "XYZ".index(axis)
    base = Euler(obj.rotation_euler) if start is None else Euler(start)
    a = math.radians(angle)
    n = max(1, f1 - f0)
    tail = int(FPS * 0.6)

    def fn(f):
        e = Euler(base)
        x = (f - f0) / n
        if x < 0:
            k = 0.0
        elif x <= 1:
            k = ease(ease_name, x)
            if anticipate_deg and x < 0.2:
                e[idx] += math.radians(-anticipate_deg) * math.sin(math.pi * x / 0.2) * math.copysign(1, angle)
        else:
            tt = (f - f1) / tail
            k = 1 + overshoot * math.sin(math.pi * min(1, tt)) * math.exp(-3 * tt)
        e[idx] += a * k
        return dict(rotation_euler=e)
    bake(obj, f0, f1 + tail, fn, paths=("rotation_euler",))


def turn(obj, f0, f1, axis="Z", angle=90.0, ease_name="inout"):
    idx = "XYZ".index(axis)
    base = Euler(obj.rotation_euler)

    def fn(f):
        e = Euler(base)
        e[idx] += math.radians(angle) * ease(ease_name, (f - f0) / max(1, f1 - f0))
        return dict(rotation_euler=e)
    bake(obj, f0, f1, fn, paths=("rotation_euler",))


def drop_settle(obj, f0, height, ground_z=None, restitution=0.35, squash=0.12, g=9.81, bounces=3):
    """Physically timed drop with decaying bounces and squash-and-stretch on contact.
    Origin must be at the object's bottom for correct ground contact."""
    gz = obj.location.z if ground_z is None else ground_z
    x0, y0 = obj.location.x, obj.location.y
    # build bounce schedule
    events = []
    t, v = math.sqrt(2 * height / g), math.sqrt(2 * g * height)
    events.append((0.0, t, height, 0.0))  # (t_start, t_end, start_h, launch_v) first fall
    tcur = t
    for _ in range(bounces):
        v *= restitution
        dur = 2 * v / g
        events.append((tcur, tcur + dur, 0.0, v))
        tcur += dur
    total = tcur + 0.25

    def fn(f):
        tt = (f - f0) / FPS
        z = 0.0
        sq = 0.0
        if tt < 0:
            z = height
        else:
            for i, (a, b, h0, v0) in enumerate(events):
                if a <= tt <= b:
                    s = tt - a
                    z = h0 - 0.5 * g * s * s if i == 0 else v0 * s - 0.5 * g * s * s
                    break
            # squash near each contact (within 40 ms), scaled by impact speed
            for i, (a, b, h0, v0) in enumerate(events):
                dt = abs(tt - b)
                if dt < 0.04:
                    imp = (math.sqrt(2 * g * height) if i == 0 else v0) / math.sqrt(2 * g * max(height, 1e-6))
                    sq = max(sq, squash * imp * (1 - dt / 0.04))
        sx = 1 + sq * 0.5
        return dict(location=Vector((x0, y0, gz + max(0.0, z))), scale=Vector((sx, sx, 1 - sq)))
    bake(obj, f0 - 1, f0 + int(total * FPS), fn, paths=("location", "scale"))


def pop(obj, f0, dur_frames=12, overshoot_zeta=0.4, freq=2.5, final_scale=1.0):
    """Scale-in with spring overshoot (appearances)."""
    def fn(f):
        s = spring((f - f0) / FPS, freq=freq, zeta=overshoot_zeta) * final_scale
        return dict(scale=Vector((s, s, s)))
    bake(obj, f0 - 1, f0 + dur_frames + int(FPS * 0.8), fn, paths=("scale",))


def wobble(obj, f0, axis="X", amp_deg=4.0, freq=5.0, decay=4.0, dur_s=1.2):
    """Decaying oscillation added on top of the current rotation (secondary motion after impact)."""
    idx = "XYZ".index(axis)
    fcurve_base = {}

    def fn(f):
        bpy.context.scene.frame_set(f)
        e = Euler(obj.rotation_euler)
        tt = (f - f0) / FPS
        e[idx] += math.radians(amp_deg) * math.sin(2 * math.pi * freq * tt) * math.exp(-decay * tt)
        return dict(rotation_euler=e)
    frames = list(range(f0, f0 + int(dur_s * FPS) + 1))
    # evaluate base first (existing animation), then add
    vals = {}
    for f in frames:
        vals[f] = fn(f)
    for f, v in vals.items():
        obj.rotation_euler = v["rotation_euler"]
        obj.keyframe_insert("rotation_euler", frame=f)
    _linear(obj)


def sway(obj, f0, f1, axis="Y", amp_deg=2.0, period_s=3.0, seed=0.0):
    """Ambient environmental motion (plants, hanging things): two-sine, deterministic."""
    idx = "XYZ".index(axis)
    base = Euler(obj.rotation_euler)

    def fn(f):
        e = Euler(base)
        tt = f / FPS
        e[idx] += math.radians(amp_deg) * (0.7 * math.sin(2 * math.pi * tt / period_s + seed)
                                           + 0.3 * math.sin(2 * math.pi * tt / (period_s * 0.37) + seed * 2))
        return dict(rotation_euler=e)
    bake(obj, f0, f1, fn, paths=("rotation_euler",))


def shape_key_ramp(obj, key_name, f0, f1, v0=0.0, v1=1.0, ease_name="inout"):
    kb = obj.data.shape_keys.key_blocks[key_name]
    for f in range(f0, f1 + 1):
        kb.value = v0 + (v1 - v0) * ease(ease_name, (f - f0) / max(1, f1 - f0))
        kb.keyframe_insert("value", frame=f)
    _linear(obj.data.shape_keys)


def value_ramp(owner, path, f0, f1, v0, v1, ease_name="inout", index=-1):
    """Animate any float property (material node input, modifier value, light energy)."""
    for f in range(f0, f1 + 1):
        v = v0 + (v1 - v0) * ease(ease_name, (f - f0) / max(1, f1 - f0))
        if index >= 0:
            getattr(owner, path)[index] = v
            owner.keyframe_insert(path, index=index, frame=f)
        else:
            setattr(owner, path, v)
            owner.keyframe_insert(path, frame=f)
    _linear(owner if hasattr(owner, "animation_data") else owner.id_data)
