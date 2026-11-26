"""One-variable-at-a-time render ablation (run with Blender's Python).

    $BLENDER_PY render_ablation.py BLEND --frame 165 --variants baseline no_hdri simple_shaders ...
        [--res 1440x2560] [--samples 8] [--out DIR]

Each variant reopens the .blend (clean state), changes ONE thing, renders the frame and logs
seconds + peak memory to DIR/ablation.csv, keeping the image for a same-resolution quality
comparison. Variants (add new ones to VARIANTS):
  baseline          profile 'final' as saved (engine/samples from args)
  no_hdri           world = flat colour (cost of environment importance sampling)
  simple_shaders    every material -> plain Principled with its base colour (procedural cost)
  no_motion_blur, no_dof, no_denoise
  bounces_low       max 3 / glossy 2 / diffuse 1 / transmission 2
  glossy_1          glossy bounces 1 (metal-in-metal reflections)
  no_light_tree     Cycles light tree off
  adaptive_loose    adaptive threshold 0.05 (default here 0.03)
  denoise_fast      OIDN prefilter FAST + quality BALANCED
  denoise_none_pref OIDN prefilter NONE
  no_area_lights    hide area lights (cost of extra lights)
  blur_steps_1      motion-blur with 1 step (default)
  tile_512          tile size 512
"""
import argparse
import csv
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def _simple_shaders(bpy, scene):
    for m in bpy.data.materials:
        if not m.use_nodes:
            continue
        nt = m.node_tree
        b = nt.nodes.get("Principled BSDF")
        if not b:
            continue
        col = tuple(b.inputs["Base Color"].default_value)
        met = b.inputs["Metallic"].default_value
        rough = b.inputs["Roughness"].default_value if not b.inputs["Roughness"].is_linked else 0.35
        out = [n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"][0]
        for n in list(nt.nodes):
            if n not in (b, out):
                nt.nodes.remove(n)
        for k, v in (("Base Color", col), ("Metallic", met), ("Roughness", rough)):
            b.inputs[k].default_value = v


def _no_hdri(bpy, scene):
    w = bpy.data.worlds.new("Flat")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.35, 0.4, 0.45, 1)
    scene.world = w


def _mat_input(name, inp, val):
    def f(bpy, s):
        m = bpy.data.materials.get(name)
        if m:
            b = m.node_tree.nodes["Principled BSDF"]
            for l in list(b.inputs[inp].links):
                m.node_tree.links.remove(l)
            b.inputs[inp].default_value = val
    return f


def _light_power(name, mult):
    def f(bpy, s):
        o = s.objects.get(name)
        if o:
            o.data.energy *= mult
    return f


def _fill_moved(bpy, s):
    """Fill from low-left at a grazing angle: flat faces facing the lens no longer mirror it."""
    from mathutils import Vector
    o = s.objects.get("FillBounce")
    o.location = Vector((-0.16, -0.06, -0.10))
    o.rotation_euler = (Vector((0, 0, 0.02)) - o.location).to_track_quat("-Z", "Y").to_euler()
    o.data.energy *= 1.6


def _gradient_card(bpy, s):
    """Replace the uniform fill with an emissive card whose brightness ramps top->bottom
    (product-photo 'strip box'): reflections in flat metal get a gradient, i.e. read as metal."""
    import bmesh
    from mathutils import Vector
    o = s.objects.get("FillBounce")
    loc, rot = o.location.copy(), o.rotation_euler.copy()
    o.data.energy = 0.0
    me = bpy.data.meshes.new("GradCard")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.16)
    bm.to_mesh(me)
    card = bpy.data.objects.new("GradCard", me)
    s.collection.objects.link(card)
    card.location, card.rotation_euler = loc, rot
    card.visible_camera = False
    m = bpy.data.materials.new("GradCardMat")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.02, 0.02, 0.025, 1)
    ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1)
    ramp.color_ramp.elements[0].position = 0.15
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Y"], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], em.inputs["Color"])
    em.inputs["Strength"].default_value = 60.0
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    me.materials.append(m)


VARIANTS = {
    "baseline": lambda bpy, s: None,
    "no_hdri": _no_hdri,
    "simple_shaders": _simple_shaders,
    "no_motion_blur": lambda bpy, s: setattr(s.render, "use_motion_blur", False),
    "no_dof": lambda bpy, s: setattr(s.camera.data.dof, "use_dof", False),
    "no_denoise": lambda bpy, s: setattr(s.cycles, "use_denoising", False),
    "bounces_low": lambda bpy, s: [setattr(s.cycles, k, v) for k, v in
                                   (("max_bounces", 3), ("glossy_bounces", 2), ("diffuse_bounces", 1),
                                    ("transmission_bounces", 2))],
    "glossy_1": lambda bpy, s: setattr(s.cycles, "glossy_bounces", 1),
    "no_light_tree": lambda bpy, s: setattr(s.cycles, "use_light_tree", False),
    "adaptive_loose": lambda bpy, s: setattr(s.cycles, "adaptive_threshold", 0.05),
    "denoise_fast": lambda bpy, s: [setattr(s.cycles, "denoising_prefilter", "FAST"),
                                    setattr(s.cycles, "denoising_quality", "BALANCED")],
    "denoise_none_pref": lambda bpy, s: setattr(s.cycles, "denoising_prefilter", "NONE"),
    "no_area_lights": lambda bpy, s: [setattr(o, "hide_render", True) for o in s.objects
                                      if o.type == "LIGHT" and o.data.type == "AREA"],
    "tile_512": lambda bpy, s: setattr(s.cycles, "tile_size", 512),
    # look-dev probes (pilot-02 audit: why do section faces read cream?)
    "sun_half": _light_power("SunKey", 0.5),
    "fill_off": _light_power("FillBounce", 0.0),
    "fill_04": _light_power("FillBounce", 0.4),
    "fill_moved": _fill_moved,
    "fill_gradient_card": _gradient_card,
    "rim_off": _light_power("RimTop", 0.0),
    "fill_rim_off": lambda bpy, s: [_light_power("FillBounce", 0.0)(bpy, s), _light_power("RimTop", 0.0)(bpy, s)],
    "sun_off": _light_power("SunKey", 0.0),
    "exposure_m07": lambda bpy, s: setattr(s.view_settings, "exposure", -0.7),
    "look_none": lambda bpy, s: setattr(s.view_settings, "look", "None"),
    "section_rough045": _mat_input("BrassSection", "Roughness", 0.45),
    "section_dark": _mat_input("BrassSection", "Base Color", (0.18, 0.10, 0.025, 1)),
}


def rss_mb():
    try:
        for line in open("/proc/self/status"):
            if line.startswith("VmHWM"):
                return int(line.split()[1]) / 1024
    except OSError:
        return -1


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("blend")
    ap.add_argument("--frame", type=int, required=True)
    ap.add_argument("--variants", nargs="+", default=["baseline"])
    ap.add_argument("--res", default="1440x2560")
    ap.add_argument("--samples", type=int, default=8)
    ap.add_argument("--out", default=None)
    a = ap.parse_args(argv)
    import bpy
    import blender_setup as bs
    out = a.out or os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(a.blend))), "..", "..",
                                "benchmarks", "render_tests", "ablation_" + os.path.basename(a.blend)[:-6])
    out = os.path.abspath(out)
    os.makedirs(out, exist_ok=True)
    log = os.path.join(out, "ablation.csv")
    new = not os.path.exists(log)
    with open(log, "a", newline="") as fh:
        w = csv.writer(fh)
        if new:
            w.writerow(["variant", "frame", "seconds", "rss_mb", "res", "samples", "timestamp"])
        for v in a.variants:
            bpy.ops.wm.open_mainfile(filepath=os.path.abspath(a.blend))
            s = bpy.context.scene
            bs.apply_profile(s, "final", engine="CYCLES")
            s.cycles.samples = a.samples
            s.render.resolution_x, s.render.resolution_y = map(int, a.res.split("x"))
            VARIANTS[v](bpy, s)
            s.frame_set(a.frame)
            s.render.filepath = os.path.join(out, f"{v}_f{a.frame}_s{a.samples}.png")
            t = time.time()
            bpy.ops.render.render(write_still=True)
            dt = time.time() - t
            w.writerow([v, a.frame, round(dt, 2), round(rss_mb()), a.res, a.samples, int(time.time())])
            fh.flush()
            print(f"[ablation] {v:18} frame {a.frame} {dt:6.1f}s", flush=True)


if __name__ == "__main__":
    main()
