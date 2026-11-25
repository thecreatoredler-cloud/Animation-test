"""Geometry builders + the shot build runner.

A project is a folder with `project.json` (timeline, captions, sound cues) and one
Python file per shot in `shots/` exposing `build(scene, ctx)` and `SECONDS`.
Shots are independent .blend files, so changing one shot never rebuilds the others.

CLI (inside Blender's Python):
    python scene_builder.py PROJECT_DIR SHOT_NAME [--profile preview]
    blender -b -P scene_builder.py -- PROJECT_DIR SHOT_NAME
Writes PROJECT_DIR/blend/SHOT_NAME.blend
"""
import importlib.util
import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector, Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# ------------------------------------------------------------------ primitives
def link(obj, collection=None):
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def mesh_obj(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))


def rounded_box(name, size, bevel=0.1, segments=4, loc=(0, 0, 0), origin="center"):
    """size (x,y,z) metres; bevel as fraction of the smallest dimension. origin 'center'|'bottom'."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
        if origin == "bottom":
            v.co.z += size[2] / 2
    o = mesh_obj(name, bm)
    o.location = loc
    if bevel <= 0:
        return o
    m = o.modifiers.new("Bevel", "BEVEL")
    m.width = bevel * min(size)
    m.segments = segments
    m.limit_method = "NONE"
    m.harden_normals = False
    shade_smooth(o)
    return o


def cylinder(name, radius, depth, axis="Z", loc=(0, 0, 0), verts=48, bevel=0.0, cap_bottom_z=False):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=radius, radius2=radius, depth=depth)
    if cap_bottom_z:
        for v in bm.verts:
            v.co.z += depth / 2
    rot = {"Z": Matrix.Identity(3), "X": Matrix.Rotation(math.pi / 2, 3, "Y"),
           "Y": Matrix.Rotation(math.pi / 2, 3, "X")}[axis]
    for v in bm.verts:
        v.co = rot @ v.co
    o = mesh_obj(name, bm)
    o.location = loc
    if bevel:
        m = o.modifiers.new("Bevel", "BEVEL")
        m.width = bevel
        m.segments = 3
        m.limit_method = "ANGLE"
    shade_smooth(o)
    return o


def sphere(name, radius, loc=(0, 0, 0), segments=32, rings=16):
    """UV sphere, smooth-shaded (eyes, pips, drops, cells, balls)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings, radius=radius)
    o = mesh_obj(name, bm)
    o.location = loc
    shade_smooth(o, 80)
    return o


def arc_points(center, radius, a0_deg, a1_deg, n=16, plane="XZ"):
    """Points on a circular arc (for exact tubes: shackles, hooks, staples)."""
    cx, cy, cz = center
    out = []
    for i in range(n + 1):
        a = math.radians(a0_deg + (a1_deg - a0_deg) * i / n)
        if plane == "XZ":
            out.append((cx + radius * math.cos(a), cy, cz + radius * math.sin(a)))
        elif plane == "YZ":
            out.append((cx, cy + radius * math.cos(a), cz + radius * math.sin(a)))
        else:
            out.append((cx + radius * math.cos(a), cy + radius * math.sin(a), cz))
    return out


def lathe(name, profile, loc=(0, 0, 0), steps=64):
    """Revolve a 2D profile [(r, z), ...] around Z (mugs, bottles, pins, vases)."""
    bm = bmesh.new()
    prev = None
    verts = [bm.verts.new((r, 0, z)) for r, z in profile]
    for a, b in zip(verts, verts[1:]):
        bm.edges.new((a, b))
    bmesh.ops.spin(bm, geom=bm.verts[:] + bm.edges[:], cent=(0, 0, 0), axis=(0, 0, 1),
                   angle=2 * math.pi, steps=steps, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    o = mesh_obj(name, bm)
    o.location = loc
    shade_smooth(o)
    return o


def tube(name, points, radius, loc=(0, 0, 0), resolution=12, bevel_res=6, exact=False):
    """Curve tube through points (shackles, wires, vessels, stitches).
    exact=True: polyline through the points (use dense points for arcs) - geometry lands
    exactly where you put it (needed when parts must mate, e.g. shackle legs in bores)."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = bevel_res
    cu.resolution_u = resolution
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY" if (len(points) < 3 or exact) else "NURBS")
    sp.points.add(len(points) - 1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1.0)
    if sp.type == "NURBS":
        sp.use_endpoint_u = True
        sp.order_u = min(4, len(points))
    o = link(bpy.data.objects.new(name, cu))
    o.location = loc
    return o


def helix(name, radius, height, turns, wire, loc=(0, 0, 0), pts_per_turn=24):
    pts = []
    n = int(turns * pts_per_turn)
    for i in range(n + 1):
        a = 2 * math.pi * turns * i / n
        pts.append((radius * math.cos(a), radius * math.sin(a), height * i / n))
    return tube(name, pts, wire, loc=loc, resolution=2, bevel_res=2)


def extrude_profile(name, profile_xy, depth, axis="X", loc=(0, 0, 0)):
    """Closed 2D polygon in the (u, v) plane extruded by depth. Used for key blades, brackets."""
    bm = bmesh.new()
    vs = [bm.verts.new((u, v, -depth / 2)) for u, v in profile_xy]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)]:
        v.co.z += depth
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # axis = thickness direction. "X": (u,v) -> (Y,Z); "Y": (u,v) -> (X,Z); "Z": (u,v) -> (X,Y)
    if axis == "X":
        for v in bm.verts:
            v.co = Vector((v.co.z, v.co.x, v.co.y))
    elif axis == "Y":
        for v in bm.verts:
            v.co = Vector((v.co.x, v.co.z, v.co.y))
    o = mesh_obj(name, bm)
    o.location = loc
    return o


def boolean(target, cutter, op="DIFFERENCE", apply=True, hide_cutter=True, transfer_material=False):
    m = target.modifiers.new("Bool_" + cutter.name, "BOOLEAN")
    m.operation = op
    m.object = cutter
    m.solver = "EXACT"
    if transfer_material:
        m.material_mode = "TRANSFER"
    if apply:
        with bpy.context.temp_override(object=target, active_object=target):
            bpy.ops.object.modifier_apply(modifier=m.name)
        bpy.data.objects.remove(cutter, do_unlink=True)
    elif hide_cutter:
        cutter.hide_render = True
        cutter.display_type = "WIRE"
    return m


def curve_to_mesh(obj):
    """Replace a curve object by a mesh copy (needed before booleans / weight painting)."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    new = link(bpy.data.objects.new(obj.name, me))
    new.matrix_world = obj.matrix_world.copy()
    name = obj.name
    bpy.data.objects.remove(obj, do_unlink=True)
    new.name = name
    shade_smooth(new, 60)
    return new


def split_by_box(obj, box_min, box_max, piece_name=None, cut_material=None):
    """Cutaway piece tool: split `obj` into (remaining, piece) with STATIC exact booleans.

    piece = obj inside the axis-aligned box, remaining = obj outside it. Both keep the
    original materials; new cut faces get `cut_material` (if given) so the section reads
    as the same part, machined. Animate `piece` (lift away / return) instead of animating
    a boolean cutter: no per-frame boolean cost, and Cycles persistent data stays safe.
    """
    size = [b - a for a, b in zip(box_min, box_max)]
    ctr = [(a + b) / 2 for a, b in zip(box_min, box_max)]

    def cutter():
        c = rounded_box("_cut", size, bevel=0.0, loc=ctr)
        apply_modifiers(c)
        for poly in c.data.polygons:
            poly.use_smooth = False  # flat cut faces (smooth boolean fans streak)
        if cut_material:
            c.data.materials.append(cut_material)
        return c
    piece = obj.copy()
    piece.data = obj.data.copy()
    piece.name = piece_name or obj.name + "_piece"
    bpy.context.scene.collection.objects.link(piece)
    m = boolean(obj, cutter(), "DIFFERENCE", transfer_material=bool(cut_material))
    m2 = boolean(piece, cutter(), "INTERSECT", transfer_material=bool(cut_material))
    return obj, piece


def apply_modifiers(obj):
    with bpy.context.temp_override(object=obj, active_object=obj):
        for m in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=m.name)


def shade_smooth(obj, angle_deg=35):
    if obj.type != "MESH":
        return
    for p in obj.data.polygons:
        p.use_smooth = True
    if hasattr(obj.data, "set_sharp_from_angle"):
        obj.data.set_sharp_from_angle(angle=math.radians(angle_deg))


def empty(name, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    e.empty_display_size = 0.01
    return link(e)


def parent(child, par, keep_world=True):
    mw = child.matrix_world.copy()
    child.parent = par
    if keep_world:
        child.matrix_parent_inverse = par.matrix_world.inverted()
    return child


# ------------------------------------------------------------------ runner
def load_shot_module(project_dir, shot):
    path = os.path.join(project_dir, "shots", shot + ".py")
    spec = importlib.util.spec_from_file_location("shot_" + shot, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def build_shot(project_dir, shot, profile="preview", engine=None):
    import blender_setup as bs
    sys.path.insert(0, os.path.join(project_dir, "shots"))
    mod = load_shot_module(project_dir, shot)
    scene = bs.new_scene(fps=getattr(mod, "FPS", 30), seconds=mod.SECONDS,
                         engine=engine or getattr(mod, "ENGINE", "CYCLES"), name=shot)
    ctx = dict(project_dir=project_dir, shot=shot)
    mod.build(scene, ctx)
    bs.apply_profile(scene, profile)
    # Safe only when no geometry is animated by modifiers (see render_optimization.md)
    scene.render.use_persistent_data = bool(getattr(mod, "PERSISTENT_DATA", False))
    os.makedirs(os.path.join(project_dir, "blend"), exist_ok=True)
    out = os.path.join(project_dir, "blend", shot + ".blend")
    bs.save(out)
    return out


def _argv():
    a = sys.argv
    return a[a.index("--") + 1:] if "--" in a else a[1:]


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    ap.add_argument("shot")
    ap.add_argument("--profile", default="preview")
    ap.add_argument("--engine", default=None)
    a = ap.parse_args(_argv())
    print("BUILT", build_shot(os.path.abspath(a.project_dir), a.shot, a.profile, a.engine))
