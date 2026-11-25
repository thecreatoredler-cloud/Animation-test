"""Camera system: moves are analytic functions of time, baked to one key per frame.

Why baked: any easing curve, layered moves (main move + slow creep + drift) and
exact control of zoom speed (the reference averages ~0.5-1 % apparent zoom per
frame, camera still only ~4 % of the time - see zach_visual_analysis.md).

    import camera_tools as ct
    cam = ct.make_camera(lens=50, fstop=2.8)
    ct.animate(cam, scene, [
        ct.Seg(1, 90,  pos=((0,-3,1.2),(0,-1.2,1.0)), tgt=((0,0,1),(0,0,0.9)), ease="inout"),   # push-in
        ct.Seg(90, 180, orbit=dict(center=(0,0,0.9), radius=1.2, a0=0, a1=25, z=1.0), ease="inout"),
    ], creep=0.04, drift=0.004)

Segments are evaluated in order; a frame outside every segment holds the
nearest segment's end/start pose (plus creep/drift, so the frame is never frozen).
"""
import math
import bpy
from mathutils import Vector

# ---------------------------------------------------------------- easing
EASES = {
    "linear": lambda x: x,
    "in": lambda x: x * x * x,
    "out": lambda x: 1 - (1 - x) ** 3,
    "inout": lambda x: x * x * x * (x * (6 * x - 15) + 10),  # smootherstep: zero vel+acc at ends
    "sine": lambda x: 0.5 - 0.5 * math.cos(math.pi * x),
    # Fast start that keeps creeping: reveals that land but stay alive.
    "expo_out": lambda x: 1 - 2 ** (-10 * x) if x < 1 else 1.0,
    # Slow start, decisive middle, long settle: the reference's push-in feel.
    "push": lambda x: (lambda s: s * s * (3 - 2 * s))(x) * 0.85 + (1 - (1 - x) ** 4) * 0.15,
}


def ease(name, x):
    x = min(1.0, max(0.0, x))
    return EASES[name](x)


def lerp(a, b, t):
    return Vector(a).lerp(Vector(b), t)


class Seg:
    """One camera move between frames f0..f1.

    pos/tgt: ((x,y,z) start, (x,y,z) end) or a single (x,y,z) to hold.
    lens: (mm start, mm end) or one value. focus: distance override (m) or None = target.
    orbit: dict(center, radius, a0, a1 (deg around Z, 0 = camera on -Y), z, z1=None) overrides pos.
    """

    def __init__(self, f0, f1, pos=None, tgt=None, lens=None, ease="inout", orbit=None,
                 fstop=None, roll=0.0):
        self.f0, self.f1, self.pos, self.tgt, self.lens = f0, f1, pos, tgt, lens
        self.ease, self.orbit, self.fstop, self.roll = ease, orbit, fstop, roll

    @staticmethod
    def _pair(v):
        if v is None:
            return None
        if isinstance(v[0], (int, float)):
            return (v, v)
        return v

    def eval(self, f, prev):
        t = ease(self.ease, (f - self.f0) / max(1, self.f1 - self.f0))
        pose = dict(prev)
        if self.orbit:
            o = self.orbit
            a = math.radians(o["a0"] + (o["a1"] - o["a0"]) * t)
            r = o["radius"] if "radius1" not in o else o["radius"] + (o["radius1"] - o["radius"]) * t
            z = o["z"] if o.get("z1") is None else o["z"] + (o["z1"] - o["z"]) * t
            c = Vector(o["center"]).lerp(Vector(o.get("center1", o["center"])), t)
            pose["pos"] = Vector((c.x + r * math.sin(a), c.y - r * math.cos(a), z))
            pose["tgt"] = c.copy()  # orbit: dict(center, center1?, radius, radius1?, a0, a1, z, z1?)
        if self._pair(self.pos):
            p = self._pair(self.pos)
            pose["pos"] = lerp(p[0], p[1], t)
        if self._pair(self.tgt):
            p = self._pair(self.tgt)
            pose["tgt"] = lerp(p[0], p[1], t)
        if self.lens is not None:
            l = (self.lens, self.lens) if isinstance(self.lens, (int, float)) else self.lens
            pose["lens"] = l[0] + (l[1] - l[0]) * t
        if self.fstop is not None:
            fs = (self.fstop, self.fstop) if isinstance(self.fstop, (int, float)) else self.fstop
            pose["fstop"] = fs[0] + (fs[1] - fs[0]) * t
        pose["roll"] = self.roll
        return pose


def make_camera(name="Cam", lens=35.0, fstop=4.0, sensor=36.0, clip=(0.01, 500.0)):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_fit = "VERTICAL"  # keeps framing logic in the 9:16 frame height
    data.sensor_height = sensor
    data.clip_start, data.clip_end = clip
    data.dof.use_dof = True
    data.dof.aperture_fstop = fstop
    data.dof.aperture_blades = 7
    cam = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def _drift(f, amp, seed=0.0):
    """Deterministic smooth 'operator hands' drift: sum of incommensurate sines."""
    s = seed
    return Vector((
        amp * (math.sin(f * 0.031 + s) * 0.6 + math.sin(f * 0.077 + 1.3 + s) * 0.4),
        amp * (math.sin(f * 0.023 + 2.1 + s) * 0.6 + math.sin(f * 0.061 + 0.4 + s) * 0.4),
        amp * (math.sin(f * 0.027 + 4.2 + s) * 0.5 + math.sin(f * 0.083 + 2.7 + s) * 0.5),
    ))


def animate(cam, scene, segs, creep=0.0, drift=0.0, seed=0.0, focus_offset=0.0):
    """Bake segments to per-frame keys on location/rotation/lens/focus.

    creep: extra dolly toward target over the whole shot, as a fraction of the
           camera-target distance (0.03-0.06 keeps 'held' frames alive).
    drift: positional drift amplitude in metres (scale to the subject: ~0.3 % of distance).
    """
    segs = sorted(segs, key=lambda s: s.f0)
    pose = dict(pos=Vector(cam.location), tgt=Vector((0, 0, 0)), lens=cam.data.lens,
                fstop=cam.data.dof.aperture_fstop, roll=0.0)
    # Initialise pose from first segment start
    pose = segs[0].eval(segs[0].f0, pose)
    f_start, f_end = scene.frame_start, scene.frame_end
    n = f_end - f_start
    for f in range(f_start, f_end + 1):
        cur = dict(pose)
        for s in segs:
            if f >= s.f0:
                cur = s.eval(min(f, s.f1), cur)
        pos, tgt = Vector(cur["pos"]), Vector(cur["tgt"])
        if creep:
            k = ease("sine", (f - f_start) / max(1, n)) * creep
            pos = pos.lerp(tgt, k)
        if drift:
            pos = pos + _drift(f, drift, seed)
            tgt = tgt + _drift(f + 400, drift * 0.5, seed + 1.7)
        cam.location = pos
        q = (tgt - pos).to_track_quat("-Z", "Y")
        e = q.to_euler()
        if cur.get("roll"):
            e.rotate_axis("Z", math.radians(cur["roll"]))
        cam.rotation_euler = e
        cam.data.lens = cur["lens"]
        cam.data.dof.aperture_fstop = cur["fstop"]
        cam.data.dof.focus_distance = max(0.01, (tgt - pos).length + focus_offset)
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
        cam.data.keyframe_insert("lens", frame=f)
        cam.data.keyframe_insert("dof.aperture_fstop", frame=f)
        cam.data.keyframe_insert("dof.focus_distance", frame=f)
    _linear(cam)
    _linear(cam.data)
    return cam


def _linear(idb):
    ad = idb.animation_data
    if not ad or not ad.action:
        return
    for fc in _fcurves(ad.action):
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def _fcurves(action):
    """Blender 4.4+ layered actions vs legacy action.fcurves."""
    if hasattr(action, "fcurves") and len(getattr(action, "fcurves", [])):
        return list(action.fcurves)
    out = []
    for layer in getattr(action, "layers", []):
        for strip in layer.strips:
            for bag in getattr(strip, "channelbags", []):
                out.extend(bag.fcurves)
    return out


# ------------------------------------------------------------ presets
def push_in(f0, f1, target, start_dist, end_dist, height=0.0, azimuth=0.0, lens=None, ease="push"):
    """Camera on a line toward target. Zoom/frame ~ (start/end)^(1/frames) - 1.
    Reference average 0.5-1 %/frame: e.g. 3.0x over 150 frames = 0.73 %/frame."""
    a = math.radians(azimuth)
    d = Vector((math.sin(a), -math.cos(a), 0))
    t = Vector(target)
    p0 = t + d * start_dist + Vector((0, 0, height))
    p1 = t + d * end_dist + Vector((0, 0, height * end_dist / max(1e-6, start_dist)))
    return Seg(f0, f1, pos=(tuple(p0), tuple(p1)), tgt=tuple(t), lens=lens, ease=ease)


def pull_out(f0, f1, target, start_dist, end_dist, **kw):
    return push_in(f0, f1, target, start_dist, end_dist, **kw)


def orbit_arc(f0, f1, center, radius, a0, a1, z, z1=None, ease="inout", lens=None):
    return Seg(f0, f1, orbit=dict(center=center, radius=radius, a0=a0, a1=a1, z=z, z1=z1), ease=ease, lens=lens)


def zoom_rate_pct_per_frame(start_dist, end_dist, frames):
    """Average apparent-scale change per frame for a dolly (use to hit reference targets)."""
    return ((start_dist / end_dist) ** (1.0 / frames) - 1) * 100
