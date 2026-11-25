"""Scene foundation: clean scene, 9:16 output, colour management, render profiles.

Import inside Blender (bpy). Every other tool assumes `new_scene()` ran first.

    import blender_setup as bs
    scene = bs.new_scene(fps=30, seconds=8)
    bs.apply_profile(scene, "preview")          # preview | review | final
"""
import bpy

# ---------------------------------------------------------------------------
# Render profiles. Numbers come from benchmarks/ (see render_optimization.md).
# 'engine' can be overridden per shot; quality knobs are per engine.
# ---------------------------------------------------------------------------
PROFILES = {
    # Composition / timing check. Fast, rough, no motion blur.
    "preview": dict(res=(360, 640), eevee_samples=8, cycles_samples=8, denoise=True,
                    motion_blur=False, dof=True, file_format="JPEG"),
    # Animation review: full motion, readable lighting, every frame.
    "review": dict(res=(720, 1280), eevee_samples=24, cycles_samples=24, denoise=True,
                   motion_blur=True, dof=True, file_format="JPEG"),
    # Delivery: 1440x2560 (9:16), 30 fps.
    "final": dict(res=(1440, 2560), eevee_samples=48, cycles_samples=64, denoise=True,
                  motion_blur=True, dof=True, file_format="PNG"),
}


def new_scene(fps=30, seconds=8.0, engine="BLENDER_EEVEE", name="Shot"):
    """Reset Blender to an empty scene configured for vertical shorts."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = name
    scene.render.fps = fps
    scene.render.fps_base = 1.0
    scene.frame_start = 1
    scene.frame_end = int(round(seconds * fps))
    scene.render.engine = engine
    scene.render.resolution_x, scene.render.resolution_y = PROFILES["review"]["res"]
    scene.render.resolution_percentage = 100
    scene.render.use_persistent_data = True  # Cycles: keep BVH between frames
    set_color_management(scene)
    world = bpy.data.worlds.new("World")
    scene.world = world
    return scene


def set_color_management(scene, look="Medium High Contrast", exposure=0.0, gamma=1.0):
    """AgX: highlights roll off instead of clipping (tutorial lesson T7).

    'Medium High Contrast' (or 'Punchy') restores the saturated blue sky that
    plain AgX desaturates. Falls back gracefully if the look name differs.
    """
    vs = scene.view_settings
    vs.view_transform = "AgX"
    for cand in (look, "AgX - " + look, "Punchy", "AgX - Punchy", "None"):
        try:
            vs.look = cand
            break
        except TypeError:
            continue
    vs.exposure = exposure
    vs.gamma = gamma
    scene.display_settings.display_device = "sRGB"
    scene.sequencer_colorspace_settings.name = "sRGB"


def apply_profile(scene, profile="preview", engine=None):
    """Apply a render profile. Returns the dict used (logged by render_manager)."""
    p = dict(PROFILES[profile])
    if engine:
        scene.render.engine = engine
    eng = scene.render.engine
    scene.render.resolution_x, scene.render.resolution_y = p["res"]
    scene.render.use_motion_blur = p["motion_blur"]
    scene.render.motion_blur_shutter = 0.5  # 180-degree shutter
    if eng == "CYCLES":
        c = scene.cycles
        c.device = "CPU"
        c.samples = p["cycles_samples"]
        c.use_adaptive_sampling = True
        c.adaptive_threshold = 0.03
        c.use_denoising = p["denoise"]
        try:
            c.denoiser = "OPENIMAGEDENOISE"
        except TypeError:
            pass
        c.max_bounces = 4
        c.diffuse_bounces = 2
        c.glossy_bounces = 2
        c.transmission_bounces = 4
        c.volume_bounces = 0
        c.transparent_max_bounces = 8
        c.caustics_reflective = False
        c.caustics_refractive = False
        c.blur_glossy = 1.0
        c.use_light_tree = True
        try:
            c.use_auto_tile = True
            c.tile_size = 1024
        except AttributeError:
            pass
    else:
        e = scene.eevee
        e.taa_render_samples = p["eevee_samples"]
        for attr, val in (("use_raytracing", True), ("use_shadows", True),
                          ("shadow_ray_count", 1), ("shadow_step_count", 6),
                          ("use_gtao", True), ("fast_gi_method", "GLOBAL_ILLUMINATION")):
            if hasattr(e, attr):
                try:
                    setattr(e, attr, val)
                except Exception:
                    pass
    img = scene.render.image_settings
    img.file_format = p["file_format"]
    if p["file_format"] == "JPEG":
        img.quality = 92
    else:
        img.color_depth = "8"
        img.compression = 15
    img.color_mode = "RGB"
    scene.render.film_transparent = False
    for cam in [o for o in scene.objects if o.type == "CAMERA"]:
        cam.data.dof.use_dof = p["dof"]
    return p


def set_frame_range_seconds(scene, seconds):
    scene.frame_end = scene.frame_start + int(round(seconds * scene.render.fps)) - 1


def save(path):
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)
