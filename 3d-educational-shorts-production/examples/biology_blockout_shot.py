"""X-cat test B/F (biology/science): inside a blood vessel - red cells flowing, one white cell
rolling along the wall. Tests: instancing ~140 cells (linked meshes), deterministic flow along a
spline, tracking camera inside a tube, stylised non-graphic anatomy, DOF + motion blur. 2 s."""
import math, random
from mathutils import Vector
import scene_builder as sb, materials as M, lighting_tools as lt, camera_tools as ct, animation_tools as at
SECONDS = 2.0
ENGINE = "CYCLES"
PERSISTENT_DATA = False   # final renders: persistent data caused black geometry twice (see lighting-materials-and-rendering.md)
CTRL = [(-2, 0, 0), (-1, 0.2, 0.05), (0, 0, 0), (1, -0.35, 0.1), (2, -0.2, 0.25), (3, 0.3, 0.2), (4, 0.4, 0)]
R_VESSEL = 0.34


def spline(t):
    """Catmull-Rom through CTRL, t in [0, 1] -> point (deterministic, shared by tube + cells + camera)."""
    n = len(CTRL) - 1
    x = min(max(t, 0), 0.9999) * n
    i = int(x); u = x - i
    p = [Vector(CTRL[max(0, min(n, j))]) for j in (i - 1, i, i + 1, i + 2)]
    return 0.5 * ((2 * p[1]) + (-p[0] + p[2]) * u + (2 * p[0] - 5 * p[1] + 4 * p[2] - p[3]) * u * u + (-p[0] + 3 * p[1] - 3 * p[2] + p[3]) * u ** 3)


def frame_at(t):
    tan = (spline(t + 0.002) - spline(t - 0.002)).normalized()
    side = tan.cross(Vector((0, 0, 1))).normalized()
    up = side.cross(tan).normalized()
    return tan, side, up


def build(scene, ctx):
    rnd = random.Random(7)
    pts = [tuple(spline(i / 160)) for i in range(161)]
    vessel = sb.tube("Vessel", pts, R_VESSEL, resolution=1, bevel_res=12, exact=True)
    wall = M.tissue("VesselWall", "#B4303C", wet=True)
    vessel.data.materials.append(wall)
    rbc = sb.lathe("RBC", [(0, 0.010), (0.022, 0.016), (0.040, 0.019), (0.050, 0.009), (0.050, -0.009), (0.040, -0.019), (0.022, -0.016), (0, -0.010)], steps=32)
    M.assign(rbc, M.tissue("RBCM", "#C8202C", wet=False))
    cells = []
    for i in range(140):
        r = R_VESSEL * 0.8 * math.sqrt(rnd.random()); a = rnd.uniform(0, 2 * math.pi)
        cells.append(dict(s0=rnd.random(), r=r, a=a, spin=rnd.uniform(-2, 2), rot=(rnd.uniform(0, 6.3), rnd.uniform(0, 6.3), 0),
                          v=0.085 * (1 - (r / R_VESSEL) ** 2) + 0.02))       # parabolic flow: faster in the centre
    objs = sb.scatter_instances("Cell", rbc, [(0, 0, 0)] * len(cells))
    for o, c in zip(objs, cells):
        for f in range(1, 61):
            s = (c["s0"] + c["v"] * f / 30) % 1.0
            tan, side, up = frame_at(s)
            o.location = spline(s) + side * c["r"] * math.cos(c["a"]) + up * c["r"] * math.sin(c["a"])
            o.rotation_euler = (c["rot"][0] + c["spin"] * f / 30, c["rot"][1], 0)
            o.keyframe_insert("location", frame=f); o.keyframe_insert("rotation_euler", frame=f)
    wbc = sb.sphere("WBC", 0.085, segments=32, rings=16)
    wm = M.skin("WBCM", tone="#E9E2D6", roughness=0.6, pores=4, pore_scale=60, redness=0.0)
    M.assign(wbc, wm)
    for f in range(1, 61):     # leukocyte rolling slowly along the wall (slower than the flow)
        s = 0.30 + 0.012 * f / 30
        tan, side, up = frame_at(s)
        wbc.location = spline(s) - up * (R_VESSEL - 0.09)
        wbc.rotation_euler = (0, 0, -f / 30 * 1.5)
        wbc.keyframe_insert("location", frame=f); wbc.keyframe_insert("rotation_euler", frame=f)
    lt.sky_backdrop(scene, top="#2A0508", bottom="#3A0A0E", light_color="#5A1018", light_strength=0.5)
    cam = ct.make_camera(lens=28, fstop=2.8)
    segs = []
    for k in range(4):
        f0, f1 = 1 + k * 15, 1 + (k + 1) * 15 if k < 3 else 60
        s0, s1 = 0.22 + 0.03 * k / 1, 0.22 + 0.03 * (k + 1)
        segs.append(ct.Seg(f0, f1, pos=(tuple(spline(s0) + frame_at(s0)[2] * 0.05), tuple(spline(s1) + frame_at(s1)[2] * 0.05)),
                           tgt=(tuple(spline(s0 + 0.05)), tuple(spline(s1 + 0.05))), ease="linear", focus=(tuple(spline(s0 + 0.03)), tuple(spline(s1 + 0.03)))))
    ct.animate(cam, scene, segs)
    lamp = lt.area_light("Endo", (0, 0, 0), (1, 0, 0), power=6, size=0.08, color="#FFE8DC")
    sb.parent(lamp, cam); lamp.location = (0.03, 0.04, 0); lamp.rotation_euler = (0, 0, 0)
