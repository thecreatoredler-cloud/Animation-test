"""Procedural PBR materials tuned for the reference look (material_guide.md).

All procedural (no texture download needed) so any machine can build them.
Surface imperfection is built in: every material gets a subtle roughness
variation, because perfectly uniform surfaces are the #1 'CG look' tell.

    import materials as M
    brass = M.metal("Brass", "#C9A14A", roughness=0.28)
    obj.data.materials.append(brass)

Texture coordinates use Object space so scale is stable when the camera pushes in;
`scale` = features per metre.
"""
import bpy
from lighting_tools import hex_to_linear


def _new(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    return m, nt, bsdf


def _set(bsdf, **kw):
    names = {"base": "Base Color", "rough": "Roughness", "metal": "Metallic",
             "sss": "Subsurface Weight", "sss_radius": "Subsurface Radius", "sss_scale": "Subsurface Scale",
             "coat": "Coat Weight", "coat_rough": "Coat Roughness", "spec": "Specular IOR Level",
             "ior": "IOR", "trans": "Transmission Weight", "sheen": "Sheen Weight",
             "emit_color": "Emission Color", "emit": "Emission Strength", "alpha": "Alpha"}
    for k, v in kw.items():
        sock = bsdf.inputs.get(names.get(k, k))
        if sock is not None:
            sock.default_value = v


def _rough_variation(nt, bsdf, base_rough, amount=0.12, scale=8.0, detail=4.0):
    """Noise-driven roughness: base +- amount. Cheap and kills the plastic uniformity."""
    tc = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = detail
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value = max(0.0, base_rough - amount)
    mr.inputs["To Max"].default_value = min(1.0, base_rough + amount)
    nt.links.new(noise.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], bsdf.inputs["Roughness"])
    return noise, tc


def _bump(nt, bsdf, height_socket, strength=0.2, distance=0.001):
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = strength
    b.inputs["Distance"].default_value = distance
    nt.links.new(height_socket, b.inputs["Height"])
    nt.links.new(b.outputs["Normal"], bsdf.inputs["Normal"])
    return b


def metal(name, color="#C9A14A", roughness=0.3, brushed=False, scale=40.0, wear=0.15):
    m, nt, bsdf = _new(name)
    _set(bsdf, base=hex_to_linear(color), metal=1.0, rough=roughness)
    noise, tc = _rough_variation(nt, bsdf, roughness, amount=wear, scale=scale)
    if brushed:  # stretched noise along X = brushed look
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (1.0, 40.0, 40.0)
        nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
        nt.links.new(mp.outputs[0], noise.inputs["Vector"])
    # micro bump for highlight break-up
    n2 = nt.nodes.new("ShaderNodeTexNoise")
    n2.inputs["Scale"].default_value = scale * 6
    nt.links.new(tc.outputs["Object"], n2.inputs["Vector"])
    _bump(nt, bsdf, n2.outputs["Fac"], strength=0.05)
    return m


def plastic(name, color="#202020", roughness=0.35, coat=0.0):
    m, nt, bsdf = _new(name)
    _set(bsdf, base=hex_to_linear(color), rough=roughness, coat=coat, coat_rough=0.08)
    _rough_variation(nt, bsdf, roughness, amount=0.06, scale=20)
    return m


def painted(name, color, roughness=0.45):
    return plastic(name, color, roughness)


def glass(name, color="#FFFFFF", roughness=0.02):
    m, nt, bsdf = _new(name)
    _set(bsdf, base=hex_to_linear(color), rough=roughness, trans=1.0, ior=1.45)
    return m


def wood(name, light="#B07A45", dark="#6B4423", scale=6.0, roughness=0.55, varnish=0.25):
    """Procedural wood: distorted wave rings along X + fibre noise; coat for varnish."""
    m, nt, bsdf = _new(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale * 0.15, scale, scale)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "RINGS"
    wave.inputs["Scale"].default_value = 2.0
    wave.inputs["Distortion"].default_value = 6.0
    wave.inputs["Detail"].default_value = 3.0
    wave.inputs["Detail Scale"].default_value = 1.5
    nt.links.new(mp.outputs[0], wave.inputs["Vector"])
    fib = nt.nodes.new("ShaderNodeTexNoise")
    mp2 = nt.nodes.new("ShaderNodeMapping")
    mp2.inputs["Scale"].default_value = (scale * 2, scale * 60, scale * 60)
    nt.links.new(tc.outputs["Object"], mp2.inputs["Vector"])
    nt.links.new(mp2.outputs[0], fib.inputs["Vector"])
    mix = nt.nodes.new("ShaderNodeMath")
    mix.operation = "MULTIPLY_ADD"
    mix.inputs[2].default_value = 0.0
    nt.links.new(wave.outputs["Fac"], mix.inputs[0])
    nt.links.new(fib.outputs["Fac"], mix.inputs[1])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = hex_to_linear(dark)
    ramp.color_ramp.elements[1].color = hex_to_linear(light)
    ramp.color_ramp.elements[0].position = 0.15
    ramp.color_ramp.elements[1].position = 0.75
    nt.links.new(mix.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], bsdf.inputs["Base Color"])
    _set(bsdf, rough=roughness, coat=varnish, coat_rough=0.15)
    _bump(nt, bsdf, fib.outputs["Fac"], strength=0.08)
    return m


def skin(name, tone="#C68863", roughness=0.5, pores=1.0, pore_scale=900.0, redness=0.15):
    """Matte skin: SSS, pore bump, mottled tone. (Tutorial: 'matte not oily, stronger pores,
    warmer light through the skin'.) pore_scale ~ pores per metre (real pores: ~1000/m)."""
    m, nt, bsdf = _new(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    # mottling
    mot = nt.nodes.new("ShaderNodeTexNoise")
    mot.inputs["Scale"].default_value = 30
    mot.inputs["Detail"].default_value = 6
    nt.links.new(tc.outputs["Object"], mot.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    base = hex_to_linear(tone)
    red = (min(1, base[0] * 1.15), base[1] * (1 - redness), base[2] * (1 - redness), 1)
    ramp.color_ramp.elements[0].color = red
    ramp.color_ramp.elements[1].color = (base[0] * 1.03, base[1] * 1.03, base[2] * 1.0, 1)
    nt.links.new(mot.outputs["Fac"], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], bsdf.inputs["Base Color"])
    # pores: voronoi distance -> bump
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.feature = "F1"
    vor.inputs["Scale"].default_value = pore_scale
    nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    fine = nt.nodes.new("ShaderNodeTexNoise")
    fine.inputs["Scale"].default_value = pore_scale * 0.4
    nt.links.new(tc.outputs["Object"], fine.inputs["Vector"])
    add = nt.nodes.new("ShaderNodeMath")
    add.operation = "ADD"
    nt.links.new(vor.outputs["Distance"], add.inputs[0])
    nt.links.new(fine.outputs["Fac"], add.inputs[1])
    _bump(nt, bsdf, add.outputs[0], strength=0.25 * pores, distance=0.0004)
    _set(bsdf, rough=roughness, sss=0.35, sss_radius=(1.0, 0.35, 0.15), sss_scale=0.004, spec=0.35)
    return m


def tissue(name, color="#B3263A", wet=True):
    """Wound / stylised anatomy: saturated, glossy if wet."""
    m, nt, bsdf = _new(name)
    _set(bsdf, base=hex_to_linear(color), rough=0.18 if wet else 0.5, sss=0.5,
         sss_radius=(1.0, 0.2, 0.1), sss_scale=0.003, coat=0.5 if wet else 0.0, coat_rough=0.05)
    return m


def emission(name, color="#FFFFFF", strength=5.0):
    m, nt, bsdf = _new(name)
    _set(bsdf, base=hex_to_linear(color), emit_color=hex_to_linear(color), emit=strength)
    return m


def image_pbr(name, color_path, rough_path=None, normal_path=None, scale=1.0, arm_path=None,
              normal_strength=1.0, rough_mult=1.0, tint=None):
    """For downloaded CC0 texture sets (ambientCG / Poly Haven). Box-projected, no UVs needed.
    arm_path: Poly Haven packed AO/Roughness/Metal map (G channel = roughness).
    tint: optional hex colour multiplied over the base colour (art-direct a texture's hue)."""
    m, nt, bsdf = _new(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])

    def tex(path, non_color=False):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(path, check_existing=True)
        t.projection = "BOX"
        t.projection_blend = 0.2
        if non_color:
            t.image.colorspace_settings.name = "Non-Color"
        nt.links.new(mp.outputs[0], t.inputs["Vector"])
        return t
    col = tex(color_path).outputs[0]
    if tint:
        mul = nt.nodes.new("ShaderNodeMix")
        mul.data_type = "RGBA"
        mul.blend_type = "MULTIPLY"
        mul.inputs["Factor"].default_value = 1.0
        nt.links.new(col, mul.inputs[6])
        mul.inputs[7].default_value = hex_to_linear(tint)
        col = mul.outputs[2]
    nt.links.new(col, bsdf.inputs["Base Color"])
    rough = None
    if rough_path:
        rough = tex(rough_path, True).outputs[0]
    elif arm_path:
        sep = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(tex(arm_path, True).outputs[0], sep.inputs[0])
        rough = sep.outputs[1]
    if rough is not None:
        if rough_mult != 1.0:
            mm = nt.nodes.new("ShaderNodeMath")
            mm.operation = "MULTIPLY"
            mm.inputs[1].default_value = rough_mult
            nt.links.new(rough, mm.inputs[0])
            rough = mm.outputs[0]
        nt.links.new(rough, bsdf.inputs["Roughness"])
    if normal_path:
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = normal_strength
        nt.links.new(tex(normal_path, True).outputs[0], nm.inputs["Color"])
        nt.links.new(nm.outputs[0], bsdf.inputs["Normal"])
    return m


def assign(obj, mat, slot=None):
    if slot is None:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    else:
        while len(obj.data.materials) <= slot:
            obj.data.materials.append(None)
        obj.data.materials[slot] = mat
    return obj
