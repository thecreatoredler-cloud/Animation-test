"""Pilot test (8 s): how a pin-tumbler padlock opens - one continuous camera move.

Beats (frames @30 fps):
  1-60    Hero: low 3/4 push-in on a brass padlock on a wooden table; key glides toward keyway.
  45-100  Reveal: the near half of the lock is sliced away top-to-bottom while the camera
          arcs round to the side and pushes in (push-in explains).
  60-165  Key slides in; each key pin rides the bitting up and down; springs compress.
  168-190 All pins sit on the shear line -> plug turns 90 deg with the key (anticipation).
  190-240 Shackle springs open (overshoot), camera pulls out and rises (pull-out resolves).
Units: metres, real size (body 45 x 24 x 38 mm).
"""
import math
import bpy
from mathutils import Vector

import scene_builder as sb
import materials as M
import lighting_tools as lt
import camera_tools as ct
import animation_tools as at

SECONDS = 8.0
ENGINE = "CYCLES"   # CPU host: EEVEE needs a GPU (benchmarks/README.md)

# --- lock geometry constants
BW, BD, BH = 0.045, 0.024, 0.038          # body width (X), depth (Y), height (Z)
Z_PC = 0.012                              # plug centre height
R_P = 0.0055                              # plug radius
Z_KF = Z_PC - 0.0042                      # keyway floor
Z_S = Z_PC + R_P                          # shear line
Z_CT = Z_S + 0.0115                       # chamber top
PIN_R = 0.00115
PIN_Y = [-0.0085 + i * 0.0042 for i in range(5)]   # 5 pin stacks along the keyway (Y)
BITTING = [0.0022, 0.0034, 0.0017, 0.0029, 0.0021]  # blade height under each pin when inserted
KEY_L = 0.0255                            # blade length
Y_TIP_IN = 0.0108                         # key tip y when fully inserted
PEAK = 0.0042
REST = 0.0010                             # pin bottom above floor with no key


def blade_profile(u):
    """Blade top height above keyway floor at distance u from the tip."""
    if u < 0 or u > KEY_L:
        return None
    h = min(PEAK, 0.0006 + 1.6 * u)                      # tip ramp
    for y, b in zip(PIN_Y, BITTING):
        h = min(h, b + 1.1 * abs(u - (Y_TIP_IN - y)))    # V notches
    return h


def key_tip_y(f):
    """Key tip position over time: approach, enter, slide fully home (eased, slight settle)."""
    y0, y_enter = -0.045, -0.0125
    if f <= 60:
        return y0 + (y_enter - y0) * ct.ease("out", (f - 1) / 59)
    if f <= 165:
        return y_enter + (Y_TIP_IN - y_enter) * ct.ease("inout", (f - 60) / 105)
    return Y_TIP_IN


def pin_bottom(f, y):
    u = key_tip_y(f) - y
    h = blade_profile(u)
    return Z_KF + max(REST, h if h is not None else -1)


def build(scene, ctx):
    S = 0.06  # light-rig scale (subject size)
    # ---------------- world + light
    lt.sky_backdrop(scene, top="#2B8ED8", bottom="#9FD3F3", light_color="#CFE5F7", light_strength=0.8)
    rig = lt.daylight_studio(target=(0, 0, 0.02), scale=S * 3, key_power=4.5, key_azimuth=40, key_elevation=48)

    # ---------------- materials
    brass = M.metal("Brass", "#B9944E", roughness=0.36, wear=0.12, scale=300)
    brass_cut = M.metal("BrassMachined", "#E2CFA0", roughness=0.42, scale=900, wear=0.05)
    brass_key = M.metal("KeyBrass", "#C4A160", roughness=0.3, scale=500)
    steel = M.metal("Steel", "#8F969E", roughness=0.28, scale=600, wear=0.06)
    spring_m = M.metal("SpringSteel", "#9EA4AB", roughness=0.3, scale=800)
    wood = M.wood("Table", light="#8A5A35", dark="#3E2414", scale=5.0, varnish=0.2)
    ceramic = M.plastic("Ceramic", "#EDE7DC", roughness=0.18, coat=0.4)
    paper = M.painted("Notebook", "#C2412E", roughness=0.6)

    # ---------------- environment: table + background props (depth layers)
    table = sb.rounded_box("Table", (1.0, 1.1, 0.03), bevel=0.05, loc=(0, 0.15, -0.015))
    M.assign(table, wood)
    mug = sb.lathe("Mug", [(0.0, 0.0), (0.038, 0.0), (0.041, 0.004), (0.042, 0.09), (0.038, 0.09),
                           (0.037, 0.008), (0.0, 0.008)], loc=(-0.11, 0.2, 0.0))
    M.assign(mug, ceramic)
    handle = sb.tube("MugHandle", [(-0.152, 0.2, 0.025), (-0.175, 0.2, 0.03), (-0.178, 0.2, 0.06),
                                   (-0.152, 0.2, 0.068)], 0.006)
    handle.data.materials.append(ceramic)
    book = sb.rounded_box("Notebook", (0.15, 0.21, 0.014), bevel=0.15, loc=(0.13, 0.26, 0.0), origin="bottom")
    book.rotation_euler.z = math.radians(-18)
    M.assign(book, paper)

    # ---------------- lock body with drilled bores (static booleans, applied once)
    body = sb.rounded_box("Body", (BW, BD, BH), bevel=0.12, loc=(0, 0, BH / 2))
    sb.apply_modifiers(body)
    sb.boolean(body, sb.cylinder("Bore", R_P + 0.0002, BD * 2, axis="Y", loc=(0, 0, Z_PC), verts=48))
    for i, y in enumerate(PIN_Y):
        sb.boolean(body, sb.cylinder(f"Ch{i}", PIN_R + 0.00012, Z_CT - Z_PC, loc=(0, y, (Z_PC + Z_CT) / 2), verts=24))
    for x in (-0.0135, 0.0135):
        sb.boolean(body, sb.cylinder("ShHole", 0.0031, 0.02, loc=(x, 0, BH), verts=32))
    M.assign(body, brass)
    sb.shade_smooth(body, 40)

    # ---------------- plug (rotates) with keyway slot + pin holes
    pivot = sb.empty("PlugPivot", (0, 0, Z_PC))
    plug = sb.cylinder("Plug", R_P, BD - 0.0004, axis="Y", loc=(0, 0, Z_PC), verts=48)
    sb.boolean(plug, sb.rounded_box("Slot", (0.0016, BD * 2, Z_S - Z_KF - 0.0015), bevel=0.2,
                                     loc=(0, 0, Z_KF + (Z_S - Z_KF - 0.0015) / 2)))
    for i, y in enumerate(PIN_Y):
        sb.boolean(plug, sb.cylinder(f"Ph{i}", PIN_R + 0.0001, 0.012, loc=(0, y, Z_S), verts=24))
    M.assign(plug, brass)
    sb.parent(plug, pivot)

    # ---------------- animated cutaway: removes the camera-side half (x > 0), sweeping down
    cut_mat = brass_cut
    cutter = sb.rounded_box("Cutter", (0.05, 0.06, 0.08), bevel=0.0, loc=(0.025, 0, 0.12))
    cutter.data.materials.append(cut_mat)
    for poly in cutter.data.polygons:   # cut faces inherit the cutter's flat shading (no fan streaks)
        poly.use_smooth = False
    for tgt in (body, plug):
        sb.boolean(tgt, cutter, apply=False, transfer_material=True)
    at.slide(cutter, 45, 100, (0.025, 0, 0.12), (0.025, 0, 0.034), ease_name="inout")

    # ---------------- pins + springs (key pins ride the key; drivers ride key pins)
    key_pins, drivers, springs = [], [], []
    for i, (y, b) in enumerate(zip(PIN_Y, BITTING)):
        L = Z_S - (Z_KF + b)
        kp = sb.lathe(f"KeyPin{i}", [(0, 0), (PIN_R * 0.55, 0.0004), (PIN_R, 0.0011), (PIN_R, L - 0.0002),
                                       (PIN_R * 0.8, L), (0, L)], steps=24)
        M.assign(kp, brass_key)
        dp = sb.lathe(f"Driver{i}", [(0, 0), (PIN_R * 0.85, 0), (PIN_R, 0.0002), (PIN_R, 0.0038),
                                       (PIN_R * 0.85, 0.004), (0, 0.004)], steps=24)
        M.assign(dp, steel)
        sp = sb.helix(f"Spring{i}", PIN_R * 0.8, 1.0, 7, 0.00022)
        sp.data.materials.append(spring_m)
        key_pins.append((kp, L))
        drivers.append(dp)
        springs.append(sp)
        sb.parent(kp, pivot)

    # ---------------- key: blade profile from the same function the pins read
    pts = [(0.0, 0.0)]
    n = 120
    for j in range(n + 1):
        u = KEY_L * j / n
        pts.append((-u, blade_profile(u)))          # local: tip at u=0 (y=0), blade toward -y
    pts.append((-KEY_L, 0.0))
    blade = sb.extrude_profile("Blade", pts, 0.0013, axis="X")
    shoulder = sb.rounded_box("Shoulder", (0.0026, 0.004, 0.0075), bevel=0.2, loc=(0, -KEY_L - 0.002, 0.0026))
    bow = sb.cylinder("Bow", 0.0105, 0.0026, axis="X", loc=(0, -KEY_L - 0.013, 0.0028), bevel=0.0006)
    sb.boolean(bow, sb.cylinder("BowHole", 0.0032, 0.01, axis="X", loc=(0, -KEY_L - 0.019, 0.0028)))
    key = sb.empty("Key", (0, 0, 0))
    for part in (blade, shoulder, bow):
        M.assign(part, brass_key)
        sb.parent(part, key)
    sb.parent(key, pivot)

    # per-frame animation of key, pins, springs (deterministic functions of frame)
    def key_fn(f):
        # children of PlugPivot keep a parent-inverse, so locations are given in world space
        return dict(location=Vector((0, key_tip_y(f), Z_KF)))
    at.bake(key, 1, 240, key_fn, paths=("location",))
    for (kp, L), dp, sp, y in zip(key_pins, drivers, springs, PIN_Y):
        def kp_fn(f, y=y):
            return dict(location=Vector((0, y, pin_bottom(min(f, 165), y))))
        at.bake(kp, 1, 240, kp_fn, paths=("location",))

        def dp_fn(f, y=y, L=L):
            z = pin_bottom(min(f, 165), y) + L if f < 168 else Z_S + 0.00005
            return dict(location=Vector((0, y, z)))
        at.bake(dp, 1, 240, dp_fn, paths=("location",))

        def sp_fn(f, y=y, L=L):
            z0 = (pin_bottom(min(f, 165), y) + L if f < 168 else Z_S) + 0.004
            return dict(location=Vector((0, y, z0)), scale=Vector((1, 1, max(0.0005, Z_CT - z0))))
        at.bake(sp, 1, 240, sp_fn, paths=("location", "scale"))

    # plug + key turn: small anticipation backwards, then 90 deg with a firm settle
    at.hinge(pivot, 170, 186, axis="Y", angle=90, overshoot=0.06, anticipate_deg=4, ease_name="inout")

    # ---------------- shackle: pops open with spring overshoot
    shackle = sb.tube("Shackle", [(-0.0135, 0, 0.026), (-0.0135, 0, 0.05), (-0.0095, 0, 0.0605),
                                  (0, 0, 0.0645), (0.0095, 0, 0.0605), (0.0135, 0, 0.05),
                                  (0.0135, 0, 0.026)], 0.0029, resolution=16)
    shackle.data.materials.append(steel)
    shackle = sb.curve_to_mesh(shackle)
    sb.boolean(shackle, cutter, apply=False, transfer_material=True)   # cut with the body
    at.slide(shackle, 190, 205, (0, 0, 0), (0, 0, 0.011), settle=dict(freq=4.0, zeta=0.32))

    # ---------------- camera: one continuous move
    cam = ct.make_camera(lens=60, fstop=5.6)
    # Each segment starts exactly where the previous one ended (no jumps).
    C0, C1, C2, C3 = (0, -0.004, 0.02), (0, 0.0, 0.016), (0, 0.001, 0.017), (0, 0, 0.028)
    segs = [
        ct.Seg(1, 55, orbit=dict(center=C0, radius=0.26, radius1=0.2, a0=32, a1=40, z=0.035, z1=0.03),
               ease="sine", lens=60),
        ct.Seg(55, 110, orbit=dict(center=C0, center1=C1, radius=0.2, radius1=0.12, a0=40, a1=88, z=0.03, z1=0.022),
               ease="inout", lens=(60, 75), fstop=(5.6, 8.0)),
        ct.Seg(110, 168, orbit=dict(center=C1, center1=C2, radius=0.12, radius1=0.092, a0=88, a1=92, z=0.022, z1=0.021),
               ease="sine", lens=75),
        ct.Seg(168, 190, orbit=dict(center=C2, radius=0.092, radius1=0.1, a0=92, a1=86, z=0.021, z1=0.024),
               ease="inout"),
        ct.Seg(190, 240, orbit=dict(center=C2, center1=C3, radius=0.1, radius1=0.2, a0=86, a1=55, z=0.024, z1=0.06),
               ease="push", lens=(75, 55), fstop=(8.0, 5.6)),
    ]
    ct.animate(cam, scene, segs, creep=0.0, drift=0.0006, seed=1.0)
    # key light breathes up slightly at the reveal to model the machined faces
    lt.animate_energy(rig["key"], [(1, 4.5), (80, 4.5), (110, 5.5), (240, 5.0)])
