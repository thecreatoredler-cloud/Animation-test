// Shot sequencer: a video is a list of separate set-ups, each with its own camera move,
// joined by short cross-dissolves while both shots keep moving (see STYLE_GUIDE.md section 8).
// Everything is a pure function of time, so window.__seek stays frame-exact.
//
//   const shots = new Shots(stage, [{ t0, t1, xf, apply(t) }, ...]);   // xf = dissolve length into the NEXT shot
//   stage.onRender = (t) => shots.render(t);
//
// apply(t) must set up the whole frame for that shot: visibility, lights, camera, post.fx.
// It is called with times up to xf/2 outside [t0, t1], so camera moves must run past both ends.
const smooth = (k) => { k = Math.min(1, Math.max(0, k)); return k * k * (3 - 2 * k); };

export class Shots {
  constructor(stage, shots) { this.stage = stage; this.shots = shots; }
  index(t) { const s = this.shots; let i = 0; while (i < s.length - 1 && t >= s[i].t1) i++; return i; }
  render(t) {
    const { post, scene, camera } = this.stage, s = this.shots;
    for (let i = 0; i < s.length - 1; i++) {
      const xf = s[i].xf || 0, b = s[i].t1;
      if (xf > 0 && Math.abs(t - b) < xf / 2) {
        if (!post.enabled) break;                                   // low quality: plain cut at the boundary
        s[i].apply(t); post.render(scene, camera, 'A');
        s[i + 1].apply(t); post.render(scene, camera, 'B');
        post.blend(smooth((t - b) / xf + .5));
        return;
      }
    }
    s[this.index(t)].apply(t); post.render(scene, camera);
  }
}

/** eased camera move between two set-ups; k runs past 0..1 linearly so dissolves never see a stopped camera */
export function moveK(t, t0, t1, easeAmt = .6) {
  const k = (t - t0) / (t1 - t0);
  if (k <= 0 || k >= 1) return k;                                     // linear outside the shot
  const e = k * k * (3 - 2 * k);
  return k + (e - k) * easeAmt;
}
