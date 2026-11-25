"""Dice drop: white die falls onto a wooden table, bounces, settles with a wobble. 3 s."""
import scene_builder as sb
import materials as M
import lighting_tools as lt
import camera_tools as ct
import animation_tools as at

SECONDS = 3.0
ENGINE = "CYCLES"

D = 0.04  # die edge (m)
H = D / 2
O = 0.009  # pip spacing
PIPS = {  # face normal axis/sign -> 2D pip offsets (u, v)
    ("Z", 1): [(0, 0)],
    ("Z", -1): [(-O, -O), (-O, 0), (-O, O), (O, -O), (O, 0), (O, O)],
    ("X", 1): [(-O, -O), (O, O)],
    ("X", -1): [(-O, -O), (-O, O), (O, -O), (O, O), (0, 0)],
    ("Y", 1): [(-O, -O), (0, 0), (O, O)],
    ("Y", -1): [(-O, -O), (-O, O), (O, -O), (O, O)],
}


def build(scene, ctx):
    lt.sky_backdrop(scene)
    lt.daylight_studio(target=(0, 0, 0.02), scale=0.15)
    table = sb.rounded_box("Table", (1.0, 1.0, 0.03), bevel=0.05, loc=(0, 0.2, -0.015))
    M.assign(table, M.wood("Table", light="#8A5A35", dark="#3E2414"))
    die = sb.rounded_box("Die", (D, D, D), bevel=0.16, origin="bottom")
    M.assign(die, M.plastic("DieWhite", "#F2F0EA", roughness=0.25, coat=0.3))
    pipm = M.plastic("Pip", "#111111", roughness=0.4)
    inset = 0.0004
    for (ax, sg), pts in PIPS.items():
        for k, (u, v) in enumerate(pts):
            n = H - inset  # cylinder centre sits just inside the face -> pip protrudes ~0.6 mm
            loc = {"Z": (u, v, H + sg * n), "X": (sg * n, u, H + v), "Y": (u, sg * n, H + v)}[ax]
            p = sb.cylinder(f"Pip_{ax}{sg}_{k}", 0.0036, 0.002, axis=ax, loc=loc, verts=24)
            M.assign(p, pipm)
            sb.parent(p, die)
    at.drop_settle(die, 10, height=0.15, restitution=0.45, squash=0.05)
    at.wobble(die, 30, axis="X", amp_deg=4, freq=6)
    cam = ct.make_camera(lens=50, fstop=5.6)
    ct.animate(cam, scene, [ct.push_in(1, scene.frame_end, (0, 0, 0.05), 0.6, 0.3, height=0.1, azimuth=25)],
               drift=0.0008)
