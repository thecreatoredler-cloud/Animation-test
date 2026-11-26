"""X-cat test C (animal): a fish cruising over a sandy bottom - species-specific locomotion.
Tests: procedural creature body, bone chain + travelling body wave (head->tail, growing amplitude),
habitat light (blue-green, fake caustics on sand), distance haze without volumes, marine snow,
tracking camera. 2 s."""
import math, random
import bpy
from mathutils import Vector
import scene_builder as sb, materials as M, lighting_tools as lt, camera_tools as ct, animation_tools as at
SECONDS = 2.0
ENGINE = "CYCLES"
PERSISTENT_DATA = False
SPEED = 0.35   # m/s ~ 1.2 body lengths/s (cruising)


def build(scene, ctx):
    rnd = random.Random(4)
    # body: lathe along Z (head at z=0), then rotate so the tail points to -X; laterally compressed
    prof = [(0, 0), (0.018, 0.008), (0.036, 0.035), (0.046, 0.085), (0.044, 0.15), (0.032, 0.21), (0.017, 0.255), (0.009, 0.285), (0, 0.30)]
    body = sb.lathe("FishBody", prof, steps=40)
    body.rotation_euler = (0, math.radians(-90), 0)
    body.scale = (1.0, 0.55, 1.25)
    tail = sb.extrude_profile("Tail", [(-0.29, 0), (-0.37, 0.055), (-0.345, 0), (-0.37, -0.055)], 0.003, axis="Y")
    dorsal = sb.extrude_profile("Dorsal", [(-0.07, 0.05), (-0.13, 0.095), (-0.19, 0.045)], 0.003, axis="Y")
    for o in (body, tail, dorsal):
        bpy.context.view_layer.objects.active = o
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o], selected_editable_objects=[o]):
            bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    scales = M.metal("Scales", "#9FB3B8", roughness=0.32, scale=400, wear=0.15)      # silvery, slightly iridescent look
    fin = M.plastic("Fin", "#C9A15E", roughness=0.4)
    M.assign(body, scales); M.assign(tail, fin); M.assign(dorsal, fin)
    with bpy.context.temp_override(object=body, active_object=body, selected_objects=[body, tail, dorsal], selected_editable_objects=[body, tail, dorsal]):
        bpy.ops.object.join()
    fish = body
    for sgn in (-1, 1):
        eye = sb.sphere("Eye", 0.009, loc=(-0.035, sgn * 0.022, 0.012)); M.assign(eye, M.plastic("EyeM", "#0B0B0B", 0.05, 1.0))
        sb.parent(eye, fish)
    arm = sb.chain_armature("Spine", (0.0, 0, 0), (-0.37, 0, 0), 6)
    sb.bind_auto(fish, arm)
    at.wave_chain(arm, 1, 60, amp_deg=14, freq_hz=2.4, wavelength_bones=5, axis="Z")
    for f in range(1, 61):   # forward motion + tiny vertical bob
        arm.location = (-0.3 + SPEED * f / 30, 0, 0.25 + 0.01 * math.sin(f / 30 * 2 * math.pi * 1.2))
        arm.keyframe_insert("location", frame=f)
    # habitat
    sand = sb.rounded_box("Sand", (12, 12, 0.02), bevel=0.0, loc=(2, 3, -0.01))
    sm = M.skin("SandM", tone="#C7B58F", roughness=0.9, pores=3, pore_scale=60, redness=0.0)   # grainy bump reused
    nt = sm.node_tree; bsdf = nt.nodes["Principled BSDF"]
    vor = nt.nodes.new("ShaderNodeTexVoronoi"); vor.voronoi_dimensions = "4D"; vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = 6.0
    tc = nt.nodes.new("ShaderNodeTexCoord"); nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB"); ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[1].position = 0.06
    ramp.color_ramp.elements[0].color = (1.6, 1.7, 1.6, 1); ramp.color_ramp.elements[1].color = (0, 0, 0, 1)
    nt.links.new(vor.outputs["Distance"], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], bsdf.inputs["Emission Color"]); bsdf.inputs["Emission Strength"].default_value = 0.35   # fake caustics
    for f in (1, 60):
        vor.inputs["W"].default_value = f / 30 * 0.8
        vor.inputs["W"].keyframe_insert("default_value", frame=f)
    M.assign(sand, M.add_distance_haze(sm, "#1F6474", 0.4, 4.0))
    for i in range(9):   # rocks for depth layers
        r = sb.sphere(f"Rock{i}", rnd.uniform(0.05, 0.18), loc=(rnd.uniform(-1, 3), rnd.uniform(0.3, 3), 0.0), segments=12, rings=8)
        r.scale = (1, rnd.uniform(0.7, 1.3), rnd.uniform(0.4, 0.7)); M.assign(r, M.add_distance_haze(M.plastic(f"RockM{i}", "#5D6A63", 0.8), "#1F6474", 0.4, 4.0))
    snow_src = sb.sphere("Snow", 0.0025, segments=6, rings=4); M.assign(snow_src, M.emission("SnowM", "#CFE8E8", 0.6))
    pts = [(rnd.uniform(-0.6, 1.2), rnd.uniform(-0.6, 1.5), rnd.uniform(0.02, 0.7)) for _ in range(160)]
    snow = sb.scatter_instances("Snow", snow_src, pts)
    drift = sb.empty("SnowDrift")
    for o in snow:
        sb.parent(o, drift)
    for f, z in ((1, 0.0), (60, -0.04)):
        drift.location = (0.03 * f / 60, 0, z); drift.keyframe_insert("location", frame=f)
    lt.sky_backdrop(scene, top="#0E3A4C", bottom="#2E8A96", light_color="#3E8FA0", light_strength=0.8)
    lt.sun_light("SunDown", (0.2, 0.3, 0), power=2.5, color="#DDF3F0", angle_deg=4, loc=(0.4, 0.2, 5))
    lt.area_light("RimUp", (-0.6, 0.8, 1.2), (0.2, 0, 0.25), power=40, size=0.6, color="#BFEFFF")
    cam = ct.make_camera(lens=40, fstop=4.0)
    ct.animate(cam, scene, [ct.Seg(1, 60, pos=((-0.05, -0.75, 0.32), (0.55, -0.62, 0.30)), tgt=((-0.15, 0, 0.25), (0.40, 0, 0.25)),
                                   ease="linear")], drift=0.003)
