"""X-cat test I (geography/large scale): fly over a river valley to a lone farmhouse (scale ref).
Tests: procedural terrain (displaced grid), height-based material, water plane, instanced forest,
aerial perspective via distance haze (no volumes), low-sun relief light, high oblique fly-over. 2 s."""
import math, random
import bpy
from mathutils import Vector
import scene_builder as sb, materials as M, lighting_tools as lt, camera_tools as ct
SECONDS = 2.0
ENGINE = "CYCLES"
PERSISTENT_DATA = False   # final renders: persistent data caused black geometry twice (see lighting-materials-and-rendering.md)


def build(scene, ctx):
    rnd = random.Random(3)
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=220, y_subdivisions=220, size=600)
    terr = bpy.context.active_object; terr.name = "Terrain"
    tex = bpy.data.textures.new("Hills", "CLOUDS"); tex.noise_scale = 1.4; tex.noise_depth = 4
    d = terr.modifiers.new("Displace", "DISPLACE"); d.texture = tex; d.strength = 70; d.texture_coords = "GLOBAL"
    tex2 = bpy.data.textures.new("Valley", "BLEND"); tex2.progression = "QUADRATIC_SPHERE"
    sb.apply_modifiers(terr)
    for v in terr.data.vertices:          # carve a river valley along Y (x near 0) - geography you can read
        v.co.z -= 38 * math.exp(-(v.co.x / 55) ** 2)
        v.co.z -= 8
    sb.shade_smooth(terr, 60)
    m = bpy.data.materials.new("TerrainM"); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); ramp = nt.nodes.new("ShaderNodeValToRGB")
    nt.links.new(tc.outputs["Object"], sep.inputs[0]); nt.links.new(sep.outputs["Z"], ramp.inputs[0])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = -10, 60
    nt.links.new(sep.outputs["Z"], mr.inputs["Value"]); nt.links.new(mr.outputs["Result"], ramp.inputs[0])
    cr = ramp.color_ramp
    cr.elements[0].position, cr.elements[0].color = 0.0, lt.hex_to_linear("#C9B98F")
    cr.elements[1].position, cr.elements[1].color = 0.75, lt.hex_to_linear("#7C7A6E")
    e = cr.elements.new(0.18); e.color = lt.hex_to_linear("#4E6B34")
    e = cr.elements.new(0.45); e.color = lt.hex_to_linear("#3C5428")
    nt.links.new(ramp.outputs[0], bsdf.inputs["Base Color"]); bsdf.inputs["Roughness"].default_value = 0.85
    M.add_distance_haze(m, "#AFC4D6", 40, 520)
    terr.data.materials.append(m)
    water = sb.rounded_box("River", (60, 600, 0.2), bevel=0.0, loc=(0, 0, -6.0))
    M.assign(water, M.add_distance_haze(M.glass("Water", "#7FA9B8", 0.05), "#AFC4D6", 40, 520))
    # forest: instanced cones on mid-slopes (sampled from real terrain vertices)
    cone = sb.lathe("Tree", [(0, 0), (1.6, 0.6), (0.9, 2.4), (1.2, 2.6), (0.5, 5.0), (0, 6.5)], steps=8)
    M.assign(cone, M.add_distance_haze(M.plastic("Pine", "#2E4A26", 0.8), "#AFC4D6", 40, 520))
    verts = [v.co.copy() for v in terr.data.vertices if 2 < v.co.z < 30 and abs(v.co.x) > 25]
    pts = [tuple(v) for v in rnd.sample(verts, 900)]
    sb.scatter_instances("Pine", cone, pts, scales=[rnd.uniform(0.7, 1.4) for _ in pts])
    house = sb.rounded_box("House", (6, 9, 4), bevel=0.02, loc=(18, -40, -4.5 + 2 + 0.5)); M.assign(house, M.painted("HouseW", "#E6E0D2", 0.7))
    roof = sb.extrude_profile("Roof", [(-3.4, 0), (0, 2.6), (3.4, 0)], 9.6, axis="Y"); roof.location = (18, -40, -4.5 + 4.5)
    M.assign(roof, M.painted("RoofR", "#8E3B2C", 0.6))
    lt.sky_backdrop(scene, top="#5E8FC4", bottom="#DDE7EE", light_color="#BFD3E6", light_strength=0.7)
    lt.sun_light("LowSun", (0, 0, -6), power=4.0, color="#FFD9A8", angle_deg=1.0, loc=(-300, 120, 90))   # low sun: relief shadows
    cam = ct.make_camera(lens=32, fstop=11, clip=(1, 3000))
    ct.animate(cam, scene, [ct.Seg(1, 60, pos=((60, 160, 120), (40, 30, 55)), tgt=((10, -60, -5), (18, -40, -2)), ease="inout")])
