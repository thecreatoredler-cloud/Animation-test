"""X-cat test J (character-led): a person in a room reacts (startle -> turns to camera).
Tests: rigged body blockout (skin-modifier mannequin + generated armature), pose-to-pose acting,
coverage wide -> medium -> close-up, motivated window light + rim. 2 s. NOT a hero character:
no face rig (the close-up deliberately exposes that limitation)."""
import math
import scene_builder as sb, materials as M, lighting_tools as lt, camera_tools as ct, animation_tools as at
SECONDS = 2.0
ENGINE = "CYCLES"
PERSISTENT_DATA = False   # armature deformation = animated geometry


def build(scene, ctx):
    floor = sb.rounded_box("Floor", (4, 4, 0.05), bevel=0.0, loc=(0, 0.8, -0.025)); M.assign(floor, M.wood("Floor", "#8A5A35", "#3E2414", scale=1.2))
    wall = sb.rounded_box("Wall", (4, 0.1, 2.8), bevel=0.0, loc=(0, 1.2, 1.4)); M.assign(wall, M.painted("Wall", "#7E8F86", 0.8))
    side = sb.rounded_box("SideWall", (0.1, 4, 2.8), bevel=0.0, loc=(1.6, 0.8, 1.4)); M.assign(side, M.painted("SideWall", "#76857D", 0.8))
    door = sb.rounded_box("Door", (0.85, 0.05, 2.0), bevel=0.02, loc=(-0.9, 1.14, 1.0)); M.assign(door, M.painted("Door", "#E8E2D6", 0.5))
    knob = sb.sphere("Knob", 0.03, loc=(-0.58, 1.10, 0.98)); M.assign(knob, M.metal("Brass", "#B08C4A", 0.3))
    table = sb.rounded_box("Table", (0.8, 0.5, 0.05), bevel=0.1, loc=(0.9, 0.6, 0.74)); M.assign(table, M.wood("TableW", "#6B4423", "#3E2414", scale=3))
    mug = sb.lathe("Mug", [(0, 0), (0.04, 0), (0.042, 0.1), (0.038, 0.1), (0.037, 0.01), (0, 0.01)], loc=(0.8, 0.55, 0.765)); M.assign(mug, M.plastic("Ceramic", "#D9D2C4", 0.2, 0.4))
    body, arm = sb.mannequin("Person")
    M.assign(body, M.plastic("Clay", "#B9A48F", 0.6))
    world = lt.sky_backdrop(scene, top="#9FB7C9", bottom="#D9E2E8", light_color="#C9D6E0", light_strength=0.6)
    lt.area_light("Window", (1.5, -0.4, 2.0), (0, 0.3, 1.3), power=900, size=1.2, color="#FFE3C2")      # warm motivated key
    lt.area_light("Rim", (-1.0, 1.0, 2.2), (0, 0, 1.5), power=300, size=0.6, color="#CFE0FF")
    lt.area_light("Fill", (-1.2, -2.0, 1.2), (0, 0, 1.2), power=120, size=1.5, color="#D8E6F2")
    # pose-to-pose acting (degrees, bone-local; arms rest in an A-pose)
    rest = {"r_elbow": (0, 0, 0), "r_hand": (0, 0, 0), "l_elbow": (0, 0, 0), "l_hand": (0, 0, 0), "head": (0, 0, 0), "chest": (0, 0, 0)}
    startle = {"r_elbow": (-55, 0, 0), "r_hand": (-70, 0, 0), "l_elbow": (-55, 0, 0), "l_hand": (-70, 0, 0), "head": (-12, 0, 0), "chest": (-6, 0, 0)}
    look = dict(startle, head=(-4, 35, 0))
    at.pose_keys(arm, {1: rest, 10: rest, 15: dict(startle, chest=(-9, 0, 0)), 18: startle, 30: startle, 40: look, 60: look})
    cam = ct.make_camera(lens=35, fstop=4.0)
    ct.animate(cam, scene, [
        ct.Seg(1, 20, pos=((0.4, -3.4, 1.3), (0.35, -3.2, 1.3)), tgt=((0, 0.2, 1.0), (0, 0.2, 1.05)), lens=35, ease="sine"),
        ct.Seg(20, 42, pos=((0.35, -3.2, 1.3), (0.25, -1.6, 1.45)), tgt=((0, 0.2, 1.05), (0, 0, 1.35)), lens=(35, 50), ease="inout"),
        ct.Seg(42, 60, pos=((0.25, -1.6, 1.45), (-0.1, -0.75, 1.62)), tgt=((0, 0, 1.35), (0, 0, 1.64)), lens=(50, 70), fstop=(4.0, 2.8), ease="inout"),
    ], drift=0.004)
