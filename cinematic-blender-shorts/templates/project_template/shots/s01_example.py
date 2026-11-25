"""Shot template: subject on a table, blue backdrop, eased push-in, subject + secondary motion.
Copy, rename, and replace the subject. Units: metres (real scale)."""
import scene_builder as sb
import materials as M
import lighting_tools as lt
import camera_tools as ct
import animation_tools as at

SECONDS = 4.0
ENGINE = "CYCLES"          # CPU host: Cycles (see references/render_optimization.md)


def build(scene, ctx):
    lt.sky_backdrop(scene)                                    # reference blue gradient
    lt.daylight_studio(target=(0, 0, 0.05), scale=0.3)        # key/fill/rim sized to the subject
    table = sb.rounded_box("Table", (1.0, 1.0, 0.03), bevel=0.05, loc=(0, 0.2, -0.015))
    M.assign(table, M.wood("Table", light="#8A5A35", dark="#3E2414"))
    box = sb.rounded_box("Subject", (0.08, 0.08, 0.08), bevel=0.15, origin="bottom")
    M.assign(box, M.plastic("Red", "#C0392B", roughness=0.35))
    at.drop_settle(box, 10, height=0.12, restitution=0.35)   # subject action with contact squash
    at.wobble(box, 30, axis="X", amp_deg=3, freq=5)           # secondary motion
    cam = ct.make_camera(lens=50, fstop=5.6)
    ct.animate(cam, scene, [ct.push_in(1, scene.frame_end, (0, 0, 0.05), 0.7, 0.35, height=0.12, azimuth=30)],
               drift=0.001)
