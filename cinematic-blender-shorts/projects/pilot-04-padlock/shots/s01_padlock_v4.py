"""Pilot-04 (v4 = v3 + final-cycle camera/clarity pass): how a pin-tumbler padlock opens - 8 s, one continuous camera move.

Mechanism (researched, see diagnosis/DIAGNOSIS_v1.md §E): keyway on the BOTTOM face, vertical
plug, 5 pin pairs (brass key pin + steel driver pin + spring) running sideways toward the short
shackle leg; a cam on top of the plug holds two steel balls in notches of the shackle legs;
plug turns -> cam frees the balls -> shackle spring lifts the shackle. Everything lives in the
y = 0 plane, so ONE half-section (front half removed) shows the whole chain of cause and effect.

The lock HANGS on the steel staple of a weathered shed door. When the shackle releases, the
body drops onto the shackle stop and swings - the physical payoff.

Beats (s):  0.0-0.7 key rises to the keyhole (low macro, rack focus)
            0.7-1.6 key tip enters; front half of the SAME lock lifts away (static cut piece)
            1.6-5.0 key slides home; pin pairs ride its ridges; springs compress
            5.0-5.4 gaps align at the shear line (macro, hold)
            5.4-6.2 plug + key turn 90 deg; cam swings; balls retract
            6.0-6.4 shackle pops; body drops + swings on the staple
            6.4-8.0 pull out; the front half returns: complete lock hanging open
Units: metres (lock body 40 x 22 x 36 mm). Lock-local coordinates == world (LockRoot at origin).

v3 changes (audit, projects/pilot-03-padlock/AUDIT.md): fill light moved off the camera axis (it was
mirrored by every flat face -> cream sections, plastic key), weak front fill kept for brightness;
bevelled brighter nickel key; open 5-coil springs; flat rivets; shear-line glow on the align beat;
30 deg orbit during the pin ride; split keyring + second key swinging (pendulum) and jingling.
"""
import json
import math
import os

import bpy
from mathutils import Vector

import scene_builder as sb
import materials as M
import lighting_tools as lt
import camera_tools as ct
import animation_tools as at

SECONDS = 8.0
ENGINE = "CYCLES"
PERSISTENT_DATA = True        # no modifier-animated geometry in this shot (cut is static)
FPS = 30
ASSETS = os.path.join(os.path.dirname(os.path.abspath(sb.__file__)), "..", "assets")

# ------------------------------------------------------------------ lock geometry
BW, BD, BH = 0.040, 0.022, 0.036
R_P, Z_PB, Z_PT = 0.0055, 0.0006, 0.0220          # plug radius, bottom, top
PIN_R = 0.00115
PIN_Z = [0.0045 + i * 0.0036 for i in range(5)]
X_KB = -0.0018                                    # blade back edge (x)
X_CE = 0.0128                                     # chamber end (x)
DRIVER_L = 0.0034
BITTING = [0.0030, 0.0042, 0.0026, 0.0038, 0.0032]
PEAK = 0.0050
REST = 0.0010
KEY_L = 0.0205
Z_TIP_IN = Z_PB + KEY_L                           # key tip when fully home
KEY_T = 0.0018                                    # blade thickness (y)
R_S, X_LEG = 0.0029, 0.0125                       # shackle wire radius, leg x
Z_B, R_B = 0.0275, 0.0022                         # ball height, ball radius
BALL_LOCK = 0.0085                                # ball centre |x| when locked
CAM_A, CAM_B, CAM_H = 0.0063, 0.0025, 0.0090      # cam half-length, half-width, height
SHACKLE_TRAVEL = 0.0155                           # short leg (bottom 23.5 mm) clears the 36 mm top by 3 mm
Z_TOP_IN = 0.0625 - R_S                           # shackle inner top (rests on staple)

# ------------------------------------------------------------------ timeline (frames)
F_KEY_ENTER, F_KEY_HOME = 21, 150
F_SHELL_OUT0, F_SHELL_OUT1 = 30, 52            # iter 7: was 66 - the piece filled the frame at 1.6 s
F_TURN0, F_TURN1 = 162, 186
F_SHELL_IN0, F_SHELL_IN1 = 204, 232
EVENTS = []                                       # sound events (written to build/events_*.json)


def ev(t, kind, **kw):
    EVENTS.append(dict(t=round(t, 4), type=kind, **kw))


def blade_profile(u):
    """Blade edge height (m, toward +x from the back edge) at distance u from the tip."""
    if u < 0 or u > KEY_L:
        return None
    h = min(PEAK, 0.0006 + 1.4 * u)
    for z, b in zip(PIN_Z, BITTING):
        h = min(h, b + 1.0 * abs(u - (Z_TIP_IN - z)))
    return h


def key_tip_z(t):
    """Key tip height over time (s). Approach -> contact -> insertion with a small resistance
    dip at every pin (the hand feels each pair) -> seated."""
    f = t * FPS
    if f <= F_KEY_ENTER:
        return -0.030 + (Z_PB + 0.0002 + 0.030) * ct.ease("out", (f - 1) / (F_KEY_ENTER - 1))
    if f >= F_KEY_HOME:
        return Z_TIP_IN
    x = (f - F_KEY_ENTER) / (F_KEY_HOME - F_KEY_ENTER)
    base = ct.ease("inout", x)
    dips = 0.018 * math.sin(2 * math.pi * 5 * base) / (2 * math.pi)   # 5 hesitations, monotonic
    s = min(1.0, max(0.0, base - dips))
    return Z_PB + 0.0002 + (Z_TIP_IN - Z_PB - 0.0002) * s


def key_wiggle(t):
    """Hand misalignment while finding the keyhole: x offset (m), tilt (deg); zero once inside."""
    f = t * FPS
    if f >= F_KEY_ENTER - 2:
        return 0.0, 0.0
    k = 1 - ct.ease("out", (f - 1) / (F_KEY_ENTER - 3))
    return 0.0011 * k * math.cos(f * 0.35), 5.0 * k * math.sin(f * 0.27)


def plug_angle(t):
    """Plug rotation (deg, negative = pins swing toward camera). Stiction start, firm stop."""
    f = t * FPS
    if f < F_TURN0:
        return 0.0
    x = (f - F_TURN0) / (F_TURN1 - F_TURN0)
    if x <= 1:
        return -90.0 * ct.ease("inout", x)
    tt = (f - F_TURN1) / FPS
    return -90.0 - 2.0 * math.sin(2 * math.pi * 7 * tt) * math.exp(-14 * tt)   # detent settle


def cam_extent(theta_deg):
    th = math.radians(abs(theta_deg))
    return CAM_A * abs(math.cos(th)) + CAM_B * abs(math.sin(th))


def release_state(t):
    """(ball |x|, shackle rise) from the cam angle. Balls follow the cam inward once the notch
    wedge pushes them; past full clearance the shackle spring snaps the rest of the travel."""
    th = plug_angle(t)
    ball = min(BALL_LOCK, cam_extent(th) + R_B)
    notch = 0.0011
    wedge = min(1.0, max(0.0, (BALL_LOCK - ball) / notch))
    rise = wedge * notch
    return ball, rise, wedge >= 1.0


def build(scene, ctx):
    EVENTS.clear()
    # ============================================================ materials
    brass = M.metal("BrassBody", "#8F6C32", roughness=0.36, wear=0.14, scale=260)
    brass_cut = M.metal("BrassSection", "#A9853F", roughness=0.26, brushed=True, scale=1400, wear=0.05)
    brass_plug = M.metal("BrassPlug", "#A88640", roughness=0.24, wear=0.08, scale=500)
    brass_pin = M.metal("BrassPin", "#B8913F", roughness=0.22, scale=900, wear=0.05)
    nickel = M.metal("KeyNickel", "#8A8F95", roughness=0.24, brushed=True, scale=900, wear=0.1)
    steel = M.metal("SteelDriver", "#9097A0", roughness=0.25, scale=900, wear=0.05)
    spring_m = M.metal("SpringSteel", "#7E858C", roughness=0.32, scale=1200)
    chrome = M.metal("BallChrome", "#D9DDE1", roughness=0.06, scale=2000, wear=0.02)
    shackle_m = M.metal("ShackleSteel", "#8C939B", roughness=0.3, wear=0.12, scale=400)
    galv = M.metal("Galvanised", "#9AA1A3", roughness=0.45, wear=0.2, scale=60)
    rivet_m = M.metal("RivetSteel", "#6E7478", roughness=0.5, wear=0.2, scale=300)
    tex = os.path.join(ASSETS, "textures", "polyhaven", "distressed_painted_planks", "textures")
    planks = M.image_pbr("DoorPlanks", os.path.join(tex, "distressed_painted_planks_diff_1k.jpg"),
                         normal_path=os.path.join(tex, "distressed_painted_planks_nor_gl_1k.jpg"),
                         arm_path=os.path.join(tex, "distressed_painted_planks_arm_1k.jpg"),
                         scale=2.2, normal_strength=1.2, tint="#A7AEA6")
    planks_dark = M.image_pbr("JambPlanks", os.path.join(tex, "distressed_painted_planks_diff_1k.jpg"),
                              arm_path=os.path.join(tex, "distressed_painted_planks_arm_1k.jpg"),
                              scale=2.2, tint="#8C8C8C")

    # ============================================================ hierarchy (built at identity)
    swing = sb.empty("SwingPivot")            # contact point on the staple; lock swings here
    root = sb.empty("LockRoot")
    sb.parent(root, swing)
    bodyg = sb.empty("BodyGroup")             # everything that drops when the shackle releases
    sb.parent(bodyg, root)
    pivot = sb.empty("PlugPivot")             # plug axis (x=0, y=0), rotates about Z
    sb.parent(pivot, bodyg)

    # ============================================================ body with all bores
    body = sb.rounded_box("Body", (BW, BD, BH), bevel=0.05, segments=3, loc=(0, 0, BH / 2))
    sb.apply_modifiers(body)
    cut = []
    cut.append(sb.cylinder("Bore", R_P + 0.00015, Z_PT + 0.002, loc=(0, 0, (Z_PT - 0.002) / 2), verts=64))
    cut.append(sb.cylinder("CamBore", 0.0071, 0.0098, loc=(0, 0, Z_PT + 0.0049), verts=64))
    cut.append(sb.cylinder("BallBore", R_B + 0.0001, 2 * X_LEG, axis="X", loc=(0, 0, Z_B), verts=32))
    for z in PIN_Z:
        cut.append(sb.cylinder("Ch", PIN_R + 0.00012, X_CE, axis="X", loc=(X_CE / 2, 0, z), verts=32))
    cut.append(sb.cylinder("LongLeg", R_S + 0.00015, BH - 0.004 + 0.001, loc=(-X_LEG, 0, (BH + 0.004) / 2 + 0.0005), verts=40))
    cut.append(sb.cylinder("ShortLeg", R_S + 0.00015, BH - 0.0225 + 0.001, loc=(X_LEG, 0, (BH + 0.0225) / 2 + 0.0005), verts=40))
    for c in cut:
        sb.boolean(body, c)
    M.assign(body, brass)
    sb.shade_smooth(body, 40)
    # front half becomes a real, separable piece of the same lock (static cut)
    body, shell = sb.split_by_box(body, (-0.05, -0.05, -0.01), (0.05, 0.0, 0.06), "BodyFront", cut_material=brass_cut)
    sb.parent(body, bodyg)
    sb.parent(shell, bodyg)

    # ============================================================ plug (+ its own front half)
    plug = sb.cylinder("Plug", R_P, Z_PT - Z_PB, loc=(0, 0, (Z_PB + Z_PT) / 2), verts=64)
    sb.boolean(plug, sb.rounded_box("Keyway", (0.0056, KEY_T + 0.0003, Z_PT), bevel=0.2,
                                     loc=(X_KB + 0.0028 - 0.0002, 0, Z_PT / 2 - 0.001)))
    for z in PIN_Z:
        sb.boolean(plug, sb.cylinder("Ph", PIN_R + 0.0001, 0.006, axis="X", loc=(R_P - 0.002, 0, z), verts=24))
    M.assign(plug, brass_plug)
    sb.shade_smooth(plug, 40)
    plug, plug_front = sb.split_by_box(plug, (-0.02, -0.02, -0.01), (0.02, 0.0, 0.04), "PlugFront", cut_material=brass_cut)
    sb.parent(plug, pivot)
    sb.parent(plug_front, shell)                # leaves and returns with the body's front half

    # cam (rotates with plug) and balls
    cam = sb.rounded_box("Cam", (2 * CAM_A, 2 * CAM_B, CAM_H), bevel=0.25, loc=(0, 0, Z_PT + CAM_H / 2 + 0.0002))
    M.assign(cam, steel)
    sb.parent(cam, pivot)
    balls = []
    for sgn in (-1, 1):
        b = sb.sphere(f"Ball{'L' if sgn < 0 else 'R'}", R_B, loc=(sgn * BALL_LOCK, 0, Z_B))
        M.assign(b, chrome)
        sb.parent(b, bodyg)
        balls.append((b, sgn))

    # ============================================================ pin stacks
    pins = []
    for i, (z, b) in enumerate(zip(PIN_Z, BITTING)):
        L = R_P - (X_KB + b)
        kp = sb.lathe(f"KeyPin{i}", [(0, 0), (PIN_R * 0.45, 0.00025), (PIN_R, 0.0009), (PIN_R, L - 0.00015),
                                     (PIN_R * 0.85, L), (0, L)], steps=32)
        kp.rotation_euler = (0, math.radians(90), 0)        # lathe axis Z -> world +X
        M.assign(kp, brass_pin)
        sb.parent(kp, pivot)
        dp = sb.lathe(f"Driver{i}", [(0, 0), (PIN_R * 0.85, 0), (PIN_R, 0.00015), (PIN_R, DRIVER_L - 0.00015),
                                     (PIN_R * 0.85, DRIVER_L), (0, DRIVER_L)], steps=32)
        dp.rotation_euler = (0, math.radians(90), 0)
        M.assign(dp, steel)
        sb.parent(dp, bodyg)
        sp = sb.helix(f"Spring{i}", PIN_R * 0.82, 1.0, 5, 0.00027)
        sp.rotation_euler = (0, math.radians(90), 0)
        sp.data.materials.append(spring_m)
        sb.parent(sp, bodyg)
        pins.append(dict(z=z, L=L, kp=kp, dp=dp, sp=sp))

    # ============================================================ key (nickel silver)
    key = sb.empty("KeyRoot")
    sb.parent(key, pivot)
    outline = [(X_KB, 0.0)]
    n = 140
    for j in range(n + 1):
        u = KEY_L * j / n
        outline.append((X_KB + blade_profile(u), -u))
    outline += [(X_KB + 0.0062, -KEY_L), (X_KB + 0.0062, -KEY_L - 0.0022), (X_KB - 0.0016, -KEY_L - 0.0022),
                (X_KB - 0.0016, -KEY_L), (X_KB, -KEY_L)]
    blade = sb.extrude_profile("KeyBlade", list(reversed(outline)), KEY_T, axis="Y")
    groove = sb.rounded_box("Groove", (0.0007, 0.0006, KEY_L * 0.85), bevel=0.3,
                            loc=(X_KB + 0.0011, -KEY_T / 2, -KEY_L * 0.5))
    sb.boolean(blade, groove)
    bow_c = (X_KB + 0.0023, 0, -KEY_L - 0.0125)
    bow = sb.cylinder("KeyBow", 0.0105, KEY_T * 1.1, axis="Y", loc=bow_c, verts=64, bevel=0.0005)
    sb.apply_modifiers(bow)
    sb.boolean(bow, sb.cylinder("BowHole", 0.0030, 0.01, axis="Y", loc=(bow_c[0], 0, bow_c[2] - 0.0045), verts=32))
    neck = sb.rounded_box("KeyNeck", (0.0080, KEY_T * 1.05, 0.0050), bevel=0.2, loc=(X_KB + 0.0023, 0, -KEY_L - 0.0035))
    for part in (blade, bow, neck):
        M.assign(part, nickel)
        bv = part.modifiers.new("EdgeBevel", "BEVEL")     # audit: razor 90-degree edges read as paper
        bv.width, bv.segments, bv.limit_method = 0.00016, 2, "ANGLE"
        sb.shade_smooth(part, 30)
        sb.parent(part, key)
    # ---- split keyring + second key (secondary motion with a physical cause; jingles on jolts)
    hole = Vector((bow_c[0], 0, bow_c[2] - 0.0045))
    R_RING = 0.0072
    ring_pivot = sb.empty("KeyringPivot", (hole.x, 0, hole.z + 0.0024))
    sb.parent(ring_pivot, key)
    ring_pts = sb.arc_points((hole.x, 0, hole.z + 0.0024 - R_RING), R_RING, 90, 90 + 350, n=48, plane="YZ")
    ring = sb.tube("SplitRing", ring_pts, 0.00055, resolution=1, bevel_res=4, exact=True)
    ring.data.materials.append(spring_m)
    ring = sb.curve_to_mesh(ring)
    sb.parent(ring, ring_pivot)
    k2_top = Vector((hole.x, 0, hole.z + 0.0024 - 2 * R_RING))      # second key hangs from the ring bottom
    k2_bow = sb.cylinder("Key2Bow", 0.0085, KEY_T, axis="Y", loc=(k2_top.x, 0, k2_top.z - 0.0062), verts=48, bevel=0.0004)
    sb.apply_modifiers(k2_bow)
    sb.boolean(k2_bow, sb.cylinder("Key2Hole", 0.0024, 0.01, axis="Y", loc=(k2_top.x, 0, k2_top.z - 0.0028), verts=24))
    k2_out = [(-0.0012, 0.0), (0.0016, 0.0)]
    for j in range(1, 9):
        k2_out.append((0.0016 + (0.0012 if j % 2 else 0.0), -0.0024 * j))
    k2_out += [(0.0016, -0.022), (-0.0012, -0.022)]
    k2_blade = sb.extrude_profile("Key2Blade", list(reversed(k2_out)), KEY_T, axis="Y")
    k2_blade.location = (k2_top.x, 0, k2_top.z - 0.0140)
    brass_key2 = M.metal("Key2Brass", "#A8873F", roughness=0.3, scale=600, wear=0.12)
    for part in (k2_bow, k2_blade):
        M.assign(part, brass_key2)
        bv = part.modifiers.new("EdgeBevel", "BEVEL")
        bv.width, bv.segments, bv.limit_method = 0.00016, 2, "ANGLE"
        sb.shade_smooth(part, 30)
        sb.parent(part, ring_pivot)

    # ============================================================ shackle + its spring
    pts = [(-X_LEG, 0, 0.0115), (-X_LEG, 0, 0.050)]
    pts += sb.arc_points((0, 0, 0.050), X_LEG, 180, 0, n=24)[1:-1]
    pts += [(X_LEG, 0, 0.050), (X_LEG, 0, 0.0235)]
    shackle = sb.tube("Shackle", pts, R_S, resolution=1, bevel_res=6, exact=True)
    shackle.data.materials.append(shackle_m)
    shackle = sb.curve_to_mesh(shackle)
    for sgn in (-1, 1):   # ball notches on the inner side of both legs
        sb.boolean(shackle, sb.sphere("Notch", R_B + 0.0001, loc=(sgn * BALL_LOCK, 0, Z_B), segments=24, rings=12))
    sb.parent(shackle, root)
    sh_spring = sb.helix("ShackleSpring", R_S * 0.8, 1.0, 6, 0.0003)
    sh_spring.data.materials.append(spring_m)
    sh_spring.location = (-X_LEG, 0, 0.0042)
    sb.parent(sh_spring, bodyg)

    # ============================================================ door, hasp, staple (world)
    PZ = Z_TOP_IN                                   # contact height (lock-local == world)
    door = sb.rounded_box("Door", (0.42, 0.04, 1.0), bevel=0.01, loc=(-0.155, 0.044, 0.1))
    M.assign(door, planks)
    jamb = sb.rounded_box("Jamb", (0.14, 0.06, 1.0), bevel=0.02, loc=(0.135, 0.075, 0.1))
    M.assign(jamb, planks_dark)
    plate = sb.rounded_box("HaspPlate", (0.032, 0.003, 0.085), bevel=0.25, loc=(0, 0.0225, PZ + 0.004))
    M.assign(plate, galv)
    for dx, dz in ((-0.010, 0.032), (0.010, 0.032), (-0.010, -0.024), (0.010, -0.024)):
        head = sb.sphere("Rivet", 0.0024, loc=(dx, 0.0212, PZ + 0.004 + dz), segments=24, rings=12)
        head.scale = (1, 0.28, 1)                       # flat dome (was 0.45: read as water drops)
        M.assign(head, rivet_m)
    r_st = 0.0032
    z_lo = PZ - r_st
    stp = [(0, 0.024, z_lo), (0, -0.004, z_lo)] + sb.arc_points((0, -0.004, z_lo + 0.007), 0.007, -90, -270, n=16, plane="YZ")[1:-1] \
        + [(0, -0.004, z_lo + 0.014), (0, 0.024, z_lo + 0.014)]
    staple = sb.tube("Staple", stp, r_st, resolution=1, bevel_res=5, exact=True)
    staple.data.materials.append(galv)

    # ============================================================ world + light
    lt.hdri_world(scene, os.path.join(ASSETS, "hdri", "polyhaven", "garden_nook", "garden_nook_1k.hdr"),
                  strength=0.38, rotation_deg=200)
    sun = lt.sun_light("SunKey", (0, 0, 0.02), power=3.0, color="#FFE2BC", angle_deg=1.2, loc=(0.35, -0.45, 0.45))
    rim = lt.area_light("RimTop", (-0.06, 0.012, 0.25), (0, 0, 0.04), power=9.0, size=0.08, color="#E6F0FF")
    # Fill from low-left at a grazing angle: flat section faces/key no longer MIRROR it (audit: the
    # head-on fill made every flat face a uniform softbox reflection = cream brass, plastic key)
    fill = lt.area_light("FillBounce", (-0.16, -0.06, -0.10), (0, 0, 0.02), power=8.0, size=0.25, color="#D8E6F2")
    lt.area_light("FillFront", (-0.12, -0.18, -0.05), (0, 0, 0.02), power=1.0, size=0.25, color="#D8E6F2")

    # ============================================================ ANIMATION
    def tsec(f):
        return f / FPS

    # key: approach wiggle + insertion (children of PlugPivot keep world-space locations)
    def key_fn(f):
        t = tsec(f)
        dx, tilt = key_wiggle(t)
        return dict(location=Vector((dx, 0, key_tip_z(t))), rotation_euler=(0, math.radians(tilt), 0))
    at.bake(key, 1, 240, key_fn, paths=("location", "rotation_euler"))
    ev(tsec(F_KEY_ENTER - 1), "key_touch", strength=0.6)          # tip meets the plug face
    ev(tsec(F_KEY_ENTER), "key_enter", strength=0.5)
    sp_curve = []                     # key speed (0..1) drives the sliding-friction texture
    for j in range(41):
        t0 = tsec(F_KEY_ENTER + (F_KEY_HOME - F_KEY_ENTER) * j / 40)
        sp_curve.append(abs(key_tip_z(t0 + 0.01) - key_tip_z(t0 - 0.01)) / 0.02)
    mx = max(sp_curve) or 1
    ev(tsec(F_KEY_ENTER), "key_slide_start", until=tsec(F_KEY_HOME), speed=[round(v / mx, 3) for v in sp_curve])
    ev(tsec(F_KEY_HOME), "key_seat", strength=0.8)                # shoulder meets the plug face

    # pins: contact followers on the key profile (sim), drivers ride on top, springs squeeze
    for i, p in enumerate(pins):
        z = p["z"]

        def surf(t, z=z):
            h = blade_profile(key_tip_z(min(t, tsec(F_KEY_HOME))) - z)
            return None if h is None else X_KB + h
        pos, landings = at.spring_follower(surf, 1, F_TURN0, rest=X_KB + REST)
        # ridge crossings (pin tip slips over a ridge) = the audible clicks of a key going in
        fr = sorted(pos)
        for a, b, c in zip(fr, fr[1:], fr[2:]):
            if pos[b] > pos[a] + 1e-6 and pos[b] >= pos[c] and b > F_KEY_ENTER:
                ev(tsec(b), "pin_click", pin=i, strength=round(min(1.0, (pos[b] - pos[c]) / 0.0006 + 0.35), 2))
        for t_land, v in landings:
            ev(t_land, "pin_land", pin=i, strength=round(min(1.0, v / 0.3), 2))
        hold = pos[F_TURN0]

        def kp_fn(f, pos=pos, hold=hold):
            return dict(location=Vector((pos.get(f, hold), 0, z)))
        at.bake(p["kp"], 1, 240, kp_fn, paths=("location",))

        def dp_fn(f, pos=pos, hold=hold, L=p["L"]):
            x = pos.get(f, hold) + L if f < F_TURN0 else R_P + 0.00002
            return dict(location=Vector((x, 0, z)))
        at.bake(p["dp"], 1, 240, dp_fn, paths=("location",))

        def sp_fn(f, pos=pos, hold=hold, L=p["L"]):
            x0 = (pos.get(f, hold) + L if f < F_TURN0 else R_P) + DRIVER_L
            return dict(location=Vector((x0, 0, z)), scale=Vector((1, 1, max(0.0004, X_CE - x0))))
        at.bake(p["sp"], 1, 240, sp_fn, paths=("location", "scale"))
    ev(tsec(F_KEY_HOME + 2), "shear_align")

    # plug + key + cam turn
    def piv_fn(f):
        return dict(rotation_euler=(0, 0, math.radians(plug_angle(tsec(f)))))
    at.bake(pivot, 1, 240, piv_fn, paths=("rotation_euler",))
    ev(tsec(F_TURN0), "turn_start", strength=0.6)
    ev(tsec(F_TURN0), "turn_friction", until=tsec(F_TURN1))
    ev(tsec(F_TURN1), "turn_stop", strength=0.7)

    # release: balls retract with the cam; shackle rise = body drop (lock hangs on the staple)
    t_free = None
    for f in range(F_TURN0, F_TURN1 + 1):
        for k in range(10):
            t = (f + k / 10) / FPS
            if release_state(t)[2]:
                t_free = t
                break
        if t_free:
            break
    ev(t_free - 0.02, "balls_retract", strength=0.6)

    def rise_at(t):
        ball, rise, free = release_state(t)
        if t_free is None or t < t_free:
            return rise
        tt = t - t_free                       # spring snap: ~60 ms, small overshoot, bottoms on the stop
        r = 0.0011 + (SHACKLE_TRAVEL - 0.0011) * min(1.0, at.spring(tt, freq=7.0, zeta=0.55))
        return min(SHACKLE_TRAVEL + 0.0004, r)

    for b, sgn in balls:
        def b_fn(f, sgn=sgn):
            ball = release_state(tsec(f))[0]
            return dict(location=Vector((sgn * ball, 0, Z_B)))
        at.bake(b, 1, 240, b_fn, paths=("location",))

    def body_fn(f):
        return dict(location=Vector((0, 0, -rise_at(tsec(f)))))
    at.bake(bodyg, 1, 240, body_fn, paths=("location",))

    def sh_sp_fn(f):
        L0 = 0.0115 - 0.0042                  # leg bottom - hole bottom (spring length, locked)
        return dict(location=Vector((-X_LEG, 0, 0.0042)), scale=Vector((1, 1, L0 + rise_at(tsec(f)))))
    at.bake(sh_spring, 1, 240, sh_sp_fn, paths=("location", "scale"))
    ev(t_free + 0.03, "shackle_pop", strength=1.0)
    ev(t_free + 0.07, "body_drop", strength=0.9)

    # swing on the staple after the jolt (period of a ~6 cm pendulum ~ 0.5 s)
    def swing_fn(f):
        t = tsec(f) - (t_free + 0.06)
        return dict(rotation_euler=(0, math.radians(at.pendulum(t, 6.0, 0.5, 2.2)), 0))
    swing.location = (0, 0, PZ)
    root.location = (0, 0, -PZ)
    at.bake(swing, 1, 240, swing_fn, paths=("rotation_euler",))
    ev(t_free + 0.18, "swing_creak", strength=0.4, until=t_free + 1.4, speed=[1.0, 0.7, 0.45, 0.25, 0.1, 0.0])

    # front half: anticipation (crack open), slide forward, lift away; returns at the end
    out_path = [(0, 0, 0), (0, -0.0008, 0), (0, -0.007, 0.001), (-0.06, 0.0, 0.10)]   # iter 7: exits UP and left (was toward the lens)

    def shell_fn(f):
        if f <= F_SHELL_OUT0:
            p, r = Vector(out_path[0]), 0.0
        elif f <= F_SHELL_OUT1:
            x = (f - F_SHELL_OUT0) / (F_SHELL_OUT1 - F_SHELL_OUT0)
            if x < 0.15:      # crack: barely separates (reads as "this is a piece of it")
                p = Vector(out_path[0]).lerp(Vector(out_path[1]), ct.ease("out", x / 0.15)); r = 0.0
            elif x < 0.45:    # slide straight forward off the mechanism
                p = Vector(out_path[1]).lerp(Vector(out_path[2]), ct.ease("inout", (x - 0.15) / 0.3)); r = 0.0
            else:             # lift away and out of frame, accelerating
                y = ct.ease("in", (x - 0.45) / 0.55)
                p = Vector(out_path[2]).lerp(Vector(out_path[3]), y); r = 25.0 * y
        elif f < F_SHELL_IN0:
            p, r = Vector(out_path[3]), 25.0
        elif f <= F_SHELL_IN1:
            x = (f - F_SHELL_IN0) / (F_SHELL_IN1 - F_SHELL_IN0)
            y = 1 - ct.ease("out", x)
            p = Vector(out_path[0]).lerp(Vector(out_path[3]), y); r = 25.0 * y
        else:
            p, r = Vector(out_path[0]), 0.0
        return dict(location=shell_base + p, rotation_euler=(math.radians(-r), 0, math.radians(r * 0.4)))
    shell_base = Vector(shell.location)     # piece origin = body's origin (BH/2): keep it
    at.bake(shell, 1, 240, shell_fn, paths=("location", "rotation_euler"))
    ev(tsec(F_SHELL_IN1), "shell_seat", strength=0.25)

    # ---- keyring swing: damped pendulum (L ~ 3.5 cm -> T ~ 0.38 s) kicked by every jolt
    kicks = [(tsec(F_KEY_ENTER - 1), 3.0), (tsec(F_KEY_HOME), 5.0), (t_free + 0.07, 11.0), (tsec(F_TURN1), -6.0)]

    def swing_angle(t):
        a = 4.0 * math.sin(t * 2 * math.pi / 0.9) * (1 - ct.ease("out", min(1.0, t / 0.8)))   # hand approach sway
        for tk, amp in kicks:
            a += at.pendulum(t - tk, amp, 0.38, 1.6)
        return a

    def ring_fn(f):
        return dict(rotation_euler=(0, math.radians(swing_angle(tsec(f))), 0))
    at.bake(ring_pivot, 1, 240, ring_fn, paths=("rotation_euler",))
    for tk, amp in kicks:     # keys knock at the first swing extremes after each kick
        for n_ in range(3):
            ev(tk + 0.095 + n_ * 0.19, "key_jingle", strength=round(min(1.0, abs(amp) / 10) * (0.55 ** n_), 2))

    # ---- shear-line glow on the "gaps align" beat (explanatory highlight, reference device)
    glow = sb.rounded_box("ShearGlow", (0.00015, 0.00008, Z_PT - Z_PB - 0.001), bevel=0.0,
                          loc=(R_P + 0.00005, -0.00006, (Z_PB + Z_PT) / 2))
    gm = bpy.data.materials.new("ShearGlowMat")          # transparent when off (audit v3: a white strip
    gm.use_nodes = True                                  # showed through before its beat)
    nt = gm.node_tree
    nt.nodes.clear()
    out_n = nt.nodes.new("ShaderNodeOutputMaterial")
    mix = nt.nodes.new("ShaderNodeMixShader")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    emn = nt.nodes.new("ShaderNodeEmission")
    emn.inputs["Color"].default_value = lt.hex_to_linear("#FFE6A8")
    emn.inputs["Strength"].default_value = 3.5
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(emn.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out_n.inputs["Surface"])
    M.assign(glow, gm)
    sb.parent(glow, bodyg)
    fac = mix.inputs[0]
    for f, v in ((1, 0.0), (F_KEY_HOME - 1, 0.0), (F_KEY_HOME + 4, 1.0), (F_TURN0 - 1, 1.0), (F_TURN0 + 5, 0.0)):
        fac.default_value = v
        fac.keyframe_insert("default_value", frame=f)

    # ============================================================ camera: one continuous move
    cam_obj = ct.make_camera(lens=60, fstop=5.6)
    K = (0, 0, 0.0)          # keyhole
    P = (0.0055, 0, 0.012)   # shear line / pins
    T = (0, 0, 0.026)        # cam / balls
    # v4 camera (final-cycle brief): establish the whole lock first, then one distinct purpose per beat
    W_ = (0.003, 0, 0.016)      # whole mechanism (context)
    KP = (0.0005, 0, 0.0085)    # key ridge <-> key-pin contact
    SPR = (0.0105, 0, 0.0115)   # springs
    segs = [
        # 1 establish: whole padlock hanging, key below it -> fast eased push into the keyhole macro
        ct.Seg(1, 20, pos=((0.070, -0.150, 0.008), (0.030, -0.058, -0.020)), tgt=((0, 0, 0.010), (0, 0, -0.006)),
               lens=(45, 45), fstop=(5.6, 4.0), ease="inout", focus=((0, 0, 0.010), K)),
        # 2 rise and arc to the front 3/4 as the front half lifts away
        ct.Seg(20, 66, pos=((0.030, -0.058, -0.020), (0.030, -0.100, 0.016)), tgt=((0, 0, -0.006), W_),
               lens=(45, 55), fstop=(4.0, 8.0), ease="inout", focus=(K, W_)),
        # 3 context: every component visible (pins, cam, balls, shackle legs) - "pin pairs block the plug"
        ct.Seg(66, 98, pos=((0.030, -0.100, 0.016), (0.022, -0.088, 0.015)), tgt=(W_, W_), lens=(55, 58),
               fstop=8.0, ease="sine"),
        # 4 cut-in by move: low and close on the ridge/pin contact - "the key's ridges lift them"
        ct.Seg(98, 126, pos=((0.022, -0.088, 0.015), (0.012, -0.052, 0.003)), tgt=(W_, KP), lens=(58, 75),
               fstop=(8.0, 9.0), ease="inout", focus=(W_, KP)),
        # 5 slide along the stacks + rack focus to the springs - "squeezing the springs"
        ct.Seg(126, 150, pos=((0.012, -0.052, 0.003), (0.030, -0.050, 0.017)), tgt=(KP, SPR), lens=75,
               fstop=9.0, ease="inout", focus=(KP, SPR)),
        # 6 macro on the shear line: gaps align (glow beat)
        ct.Seg(150, 164, pos=((0.030, -0.050, 0.017), (0.006, -0.050, 0.012)), tgt=(SPR, (0.0055, 0, 0.0118)),
               lens=(75, 85), fstop=(9.0, 10.0), ease="inout", focus=(SPR, (0.0055, 0, 0.0118))),
        # 7 rise for the turn: deeper focus on the cam/balls (v3 measured soft here)
        ct.Seg(164, 184, pos=((0.006, -0.050, 0.012), (-0.004, -0.085, 0.040)), tgt=((0.0055, 0, 0.0118), T),
               lens=(85, 60), fstop=(10.0, 16.0), ease="inout", focus=((0.0055, 0, 0.0118), T)),
        # 8 pull out: complete lock hanging open on the door
        ct.Seg(184, 240, pos=((-0.004, -0.085, 0.040), (0.060, -0.185, 0.045)), tgt=(T, (0.004, 0, 0.026)),
               lens=(60, 45), fstop=(16.0, 6.3), ease="push"),
    ]
    ct.animate(cam_obj, scene, segs, drift=0.00025, seed=2.0)

    # ============================================================ export sound events
    out = os.path.join(ctx["project_dir"], "build")
    os.makedirs(out, exist_ok=True)
    EVENTS.sort(key=lambda e: e["t"])
    json.dump(dict(shot=ctx["shot"], fps=FPS, events=EVENTS),
              open(os.path.join(out, f"events_{ctx['shot']}.json"), "w"), indent=1)
