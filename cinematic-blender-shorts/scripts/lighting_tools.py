"""Lighting rigs and world backdrops. Every rig has a key, a fill and a rim (standard section 4).

    import lighting_tools as lt
    lt.sky_backdrop(scene, top="#2E8FD6", bottom="#A9DAF5")   # the reference's blue backdrop
    rig = lt.daylight_studio(target=(0, 0, 1), key_power=4.0)

Rigs return a dict of the created lights so shots can animate them.
Colours are hex sRGB; converted to linear for Blender.
"""
import math
import bpy
from mathutils import Vector


def hex_to_linear(h, alpha=1.0):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, alpha)


def _node(nt, type_, loc, **inputs):
    n = nt.nodes.new(type_)
    n.location = loc
    for k, v in inputs.items():
        n.inputs[k].default_value = v
    return n


def sky_backdrop(scene, top="#2E8FD6", bottom="#A9DAF5", light_color="#BFDDF5",
                 light_strength=0.9, camera_strength=1.0):
    """Screen-space vertical gradient seen by the camera; separate, softer sky for lighting.

    Using the camera ray split keeps the backdrop the exact approved colour
    whatever the lighting does (tutorial lesson: the approved blue must not drift).
    """
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = _node(nt, "ShaderNodeOutputWorld", (900, 0))
    coord = _node(nt, "ShaderNodeTexCoord", (-700, 0))
    sep = _node(nt, "ShaderNodeSeparateXYZ", (-500, 0))
    nt.links.new(coord.outputs["Window"], sep.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.location = (-300, 0)
    ramp.color_ramp.interpolation = "EASE"
    ramp.color_ramp.elements[0].color = hex_to_linear(bottom)
    ramp.color_ramp.elements[0].position = 0.05
    ramp.color_ramp.elements[1].color = hex_to_linear(top)
    ramp.color_ramp.elements[1].position = 0.95
    nt.links.new(sep.outputs["Y"], ramp.inputs[0])
    bg_cam = _node(nt, "ShaderNodeBackground", (100, 120), Strength=camera_strength)
    nt.links.new(ramp.outputs[0], bg_cam.inputs["Color"])
    bg_light = _node(nt, "ShaderNodeBackground", (100, -120), Strength=light_strength)
    bg_light.inputs["Color"].default_value = hex_to_linear(light_color)
    lp = _node(nt, "ShaderNodeLightPath", (100, 350))
    mix = _node(nt, "ShaderNodeMixShader", (500, 0))
    nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0])
    nt.links.new(bg_light.outputs[0], mix.inputs[1])
    nt.links.new(bg_cam.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return world


def hdri_world(scene, hdri_path, strength=1.0, rotation_deg=0.0, backdrop=None):
    """Image-based light from an HDRI (e.g. Poly Haven). Optional flat backdrop colour for camera rays."""
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = _node(nt, "ShaderNodeOutputWorld", (900, 0))
    coord = _node(nt, "ShaderNodeTexCoord", (-900, 0))
    mapping = _node(nt, "ShaderNodeMapping", (-700, 0))
    mapping.inputs["Rotation"].default_value[2] = math.radians(rotation_deg)
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.location = (-450, 0)
    env.image = bpy.data.images.load(hdri_path, check_existing=True)
    nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs[0], env.inputs["Vector"])
    bg = _node(nt, "ShaderNodeBackground", (100, 0), Strength=strength)
    nt.links.new(env.outputs[0], bg.inputs["Color"])
    if backdrop:
        flat = _node(nt, "ShaderNodeBackground", (100, -200), Strength=1.0)
        flat.inputs["Color"].default_value = hex_to_linear(backdrop)
        lp = _node(nt, "ShaderNodeLightPath", (100, 300))
        mix = _node(nt, "ShaderNodeMixShader", (500, 0))
        nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0])
        nt.links.new(bg.outputs[0], mix.inputs[1])
        nt.links.new(flat.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], out.inputs["Surface"])
    else:
        nt.links.new(bg.outputs[0], out.inputs["Surface"])
    return world


def _aim(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def area_light(name, loc, target, power, size, color="#FFFFFF", shape="RECTANGLE", size_y=None,
               shadow_soft=True):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = hex_to_linear(color)[:3]
    data.shape = shape
    data.size = size
    if shape in ("RECTANGLE", "ELLIPSE"):
        data.size_y = size_y or size
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = loc
    _aim(obj, target)
    return obj


def sun_light(name, direction_target, power=3.0, color="#FFF2DE", angle_deg=2.0, loc=(0, 0, 10)):
    data = bpy.data.lights.new(name, "SUN")
    data.energy = power
    data.color = hex_to_linear(color)[:3]
    data.angle = math.radians(angle_deg)  # soft but defined shadow edge
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = loc
    _aim(obj, direction_target)
    return obj


def daylight_studio(target=(0, 0, 0), scale=1.0, key_power=4.0, warm="#FFE9CF", cool="#CFE6FF",
                    key_azimuth=35.0, key_elevation=50.0):
    """The reference's high-key look: warm sun key, cool sky fill from the world, cool rim.

    scale: subject size in metres (1 = a hand-sized object at ~0.2 m uses scale 0.2).
    Key is a sun (cheap, crisp, soft angle); fill is a big area light opposite;
    rim is an area light behind and above to separate subject from the blue sky.
    """
    t = Vector(target)
    az, el = math.radians(key_azimuth), math.radians(key_elevation)
    key_dir = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    key = sun_light("KeyLight", t, power=key_power, color=warm, angle_deg=3.0, loc=t + key_dir * 10 * scale)
    fill_loc = t + Vector((-key_dir.x, key_dir.y, 0.4)).normalized() * 4 * scale
    fill = area_light("FillLight", fill_loc, t, power=150 * scale * scale, size=3 * scale, color=cool)
    rim_loc = t + Vector((-key_dir.x * 0.6, 2.5, 1.6)).normalized() * 3.5 * scale
    rim = area_light("RimLight", rim_loc, t, power=400 * scale * scale, size=1.2 * scale, color="#FFFFFF")
    return dict(key=key, fill=fill, rim=rim)


def low_key_practical(target=(0, 0, 0), scale=1.0, tint="#3C7BFF"):
    """Night/interior rig (trunk-style): one cool motivated source, faint fill, bright rim."""
    t = Vector(target)
    key = area_light("KeyLight", t + Vector((0.6, -0.8, 1.2)) * scale, t, 120 * scale * scale, 0.4 * scale, color=tint)
    fill = area_light("FillLight", t + Vector((-1.5, -1.0, 0.3)) * scale, t, 10 * scale * scale, 2 * scale, color="#7FA8FF")
    rim = area_light("RimLight", t + Vector((-0.5, 1.5, 1.0)) * scale, t, 200 * scale * scale, 0.5 * scale, color="#BFD4FF")
    return dict(key=key, fill=fill, rim=rim)


def animate_energy(light_obj, keys):
    """keys: [(frame, energy)], eased (Bezier auto-clamped) - for flickers/reveals use many keys."""
    for f, e in keys:
        light_obj.data.energy = e
        light_obj.data.keyframe_insert("energy", frame=f)
