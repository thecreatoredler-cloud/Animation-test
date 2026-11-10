// Post-processing for phones: MSAA HDR scene target -> quarter/eighth-res blur chain ->
// one composite pass (bloom on bright practicals, depth of field, motion blur, light glow,
// vignette, then the renderer's tone mapping + colour grade). Each effect can be switched off.
import * as THREE from 'three';

const fsVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    const r = renderer;
    this.halfFloat = r.capabilities.isWebGL2 && (r.extensions.has('EXT_color_buffer_float') || r.extensions.has('EXT_color_buffer_half_float'));
    this.type = this.halfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.enabled = true; this.dof = true; this.bloom = true;
    this.fx = { mblur: new THREE.Vector2(), dof: 0, focus: 1, dofRange: 1.6, bloom: .35, threshold: 1.6,
                glowUV: new THREE.Vector2(.5, .5), glow: 0, glowColor: new THREE.Color(1, .8, .5), vignette: .3,
                ink: 0, inkFar: 40, inkColor: new THREE.Color(.03, .02, .03), flash: 0 };
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.quad.frustumCulled = false; this.scene.add(this.quad);
    this.down = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { tSrc: { value: null }, texel: { value: new THREE.Vector2() } }, vertexShader: fsVert,
      fragmentShader: `uniform sampler2D tSrc; uniform vec2 texel; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tSrc, vUv + texel * vec2(-1.0,-1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0,-1.0)).rgb
          + texture2D(tSrc, vUv + texel * vec2(-1.0,1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0,1.0)).rgb; gl_FragColor = vec4(min(c * 0.25, vec3(40.0)), 1.0); }` });
    this.blur = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { tSrc: { value: null }, dir: { value: new THREE.Vector2() } }, vertexShader: fsVert,
      fragmentShader: `uniform sampler2D tSrc; uniform vec2 dir; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;
          c += (texture2D(tSrc, vUv + dir * 1.3846).rgb + texture2D(tSrc, vUv - dir * 1.3846).rgb) * 0.3162162;
          c += (texture2D(tSrc, vUv + dir * 3.2308).rgb + texture2D(tSrc, vUv - dir * 3.2308).rgb) * 0.0702703;
          gl_FragColor = vec4(c, 1.0); }` });
    const fx = this.fx;
    this.comp = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, toneMapped: true,
      uniforms: { tScene: { value: null }, tDepth: { value: null }, tQ: { value: null }, tE: { value: null },
        mblur: { value: fx.mblur }, glowUV: { value: fx.glowUV }, glow: { value: 0 }, glowColor: { value: fx.glowColor }, aspect: { value: 9 / 16 },
        dof: { value: 0 }, focus: { value: 1 }, dofRange: { value: 1.6 }, near: { value: .05 }, far: { value: 100 }, bloom: { value: .35 }, thr: { value: 1.6 }, vig: { value: .3 },
        ink: { value: 0 }, inkFar: { value: 40 }, inkColor: { value: fx.inkColor }, texel: { value: new THREE.Vector2() }, flash: { value: 0 } },
      vertexShader: fsVert,
      fragmentShader: `uniform sampler2D tScene, tDepth, tQ, tE; uniform vec2 mblur, glowUV; uniform vec3 glowColor;
        uniform float glow, aspect, dof, focus, dofRange, near, far, bloom, thr, vig, ink, inkFar, flash; uniform vec3 inkColor; uniform vec2 texel; varying vec2 vUv;
        float linDepth(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
        void main(){
          vec3 col;
          if (dot(mblur, mblur) > 0.0) { col = vec3(0.0); for (int i = 0; i < 8; i++) { float k = float(i) / 7.0 - 0.5; col += texture2D(tScene, vUv + mblur * k).rgb; } col /= 8.0; }
          else col = texture2D(tScene, vUv).rgb;
          vec3 q = texture2D(tQ, vUv).rgb, e = texture2D(tE, vUv).rgb;
          if (dof > 0.001) {
            float z = linDepth(texture2D(tDepth, vUv).r);
            float coc = clamp(abs(z - focus) / (focus * dofRange), 0.0, 1.0) * dof;
            col = mix(col, mix(q, e, smoothstep(0.45, 1.0, coc)), smoothstep(0.0, 0.5, coc));
          }
          if (ink > 0.001) {   // ink contour lines from depth discontinuities (toon look)
            float z0 = linDepth(texture2D(tDepth, vUv).r);
            float zl = linDepth(texture2D(tDepth, vUv - vec2(texel.x, 0.0)).r), zr = linDepth(texture2D(tDepth, vUv + vec2(texel.x, 0.0)).r);
            float zu = linDepth(texture2D(tDepth, vUv + vec2(0.0, texel.y)).r), zd = linDepth(texture2D(tDepth, vUv - vec2(0.0, texel.y)).r);
            float zm = min(z0, min(min(zl, zr), min(zu, zd)));
            float e = (abs(zl + zr - 2.0 * z0) + abs(zu + zd - 2.0 * z0)) / zm;
            float k = smoothstep(0.012, 0.045, e) * (1.0 - smoothstep(inkFar * 0.45, inkFar, zm)) * ink;
            if (dof > 0.001) k *= 1.0 - smoothstep(0.2, 0.6, clamp(abs(zm - focus) / (focus * dofRange), 0.0, 1.0) * dof);   // no crisp lines on blurred things
            col = mix(col, inkColor, k);
          }
          col += (max(q - thr, 0.0) * 0.5 + max(e - thr, 0.0) * 0.9) * bloom;
          if (glow > 0.001) { vec2 d = (vUv - glowUV) * vec2(aspect, 1.0); float r = length(d); col += glow * glowColor * (0.5 * exp(-r * 5.0) + exp(-r * 26.0)); }
          vec2 v = (vUv - 0.5) * vec2(0.95, 1.1);
          col *= mix(1.0, 1.0 - vig, smoothstep(0.2, 0.85, dot(v, v) * 2.2));
          col += vec3(flash);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
    // cross-dissolve between two finished (still linear HDR) frames
    this.mixMat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, toneMapped: true,
      uniforms: { tA: { value: null }, tB: { value: null }, k: { value: 0 } }, vertexShader: fsVert,
      fragmentShader: `uniform sampler2D tA, tB; uniform float k; varying vec2 vUv;
        void main(){ gl_FragColor = vec4(mix(texture2D(tA, vUv).rgb, texture2D(tB, vUv).rgb, k), 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
  }
  setSize(w, h) {
    for (const r of [this.rtScene, this.rtQ, this.rtQ2, this.rtE, this.rtE2, this.rtA, this.rtB]) if (r) r.dispose();
    this.rtA = this.rtB = null; this._w = w; this._h = h;   // dissolve targets are created on first use
    this.rtScene = new THREE.WebGLRenderTarget(w, h, { type: this.type, samples: 4, depthTexture: new THREE.DepthTexture(w, h) });
    const o = { type: this.type, depthBuffer: false };
    this.rtQ = new THREE.WebGLRenderTarget(Math.max(1, w >> 2), Math.max(1, h >> 2), o); this.rtQ2 = new THREE.WebGLRenderTarget(Math.max(1, w >> 2), Math.max(1, h >> 2), o);
    this.rtE = new THREE.WebGLRenderTarget(Math.max(1, w >> 3), Math.max(1, h >> 3), o); this.rtE2 = new THREE.WebGLRenderTarget(Math.max(1, w >> 3), Math.max(1, h >> 3), o);
  }
  _pass(mat, target) { this.quad.material = mat; this.renderer.setRenderTarget(target); this.renderer.render(this.scene, this.cam); }
  /** target: null = screen; 'A' / 'B' = dissolve buffers (finish with blend(k)) */
  render(scene, camera, target = null) {
    const r = this.renderer;
    if (!this.enabled) { r.setRenderTarget(null); r.render(scene, camera); return; }
    if (target && !this.rtA) { const o = { type: this.type, depthBuffer: false }; this.rtA = new THREE.WebGLRenderTarget(this._w, this._h, o); this.rtB = new THREE.WebGLRenderTarget(this._w, this._h, o); }
    const dest = target === 'A' ? this.rtA : target === 'B' ? this.rtB : null;
    r.setRenderTarget(this.rtScene); r.render(scene, camera);
    const d = this.down.uniforms, b = this.blur.uniforms;
    d.tSrc.value = this.rtScene.texture; d.texel.value.set(1 / this.rtScene.width, 1 / this.rtScene.height); this._pass(this.down, this.rtQ);
    b.tSrc.value = this.rtQ.texture; b.dir.value.set(1 / this.rtQ.width, 0); this._pass(this.blur, this.rtQ2);
    b.tSrc.value = this.rtQ2.texture; b.dir.value.set(0, 1 / this.rtQ.height); this._pass(this.blur, this.rtQ);
    d.tSrc.value = this.rtQ.texture; d.texel.value.set(.5 / this.rtQ.width, .5 / this.rtQ.height); this._pass(this.down, this.rtE);
    b.tSrc.value = this.rtE.texture; b.dir.value.set(1 / this.rtE.width, 0); this._pass(this.blur, this.rtE2);
    b.tSrc.value = this.rtE2.texture; b.dir.value.set(0, 1 / this.rtE.height); this._pass(this.blur, this.rtE);
    const u = this.comp.uniforms, fx = this.fx;
    u.tScene.value = this.rtScene.texture; u.tDepth.value = this.rtScene.depthTexture; u.tQ.value = this.rtQ.texture; u.tE.value = this.rtE.texture;
    u.dof.value = this.dof ? fx.dof : 0; u.focus.value = fx.focus; u.dofRange.value = fx.dofRange; u.near.value = camera.near; u.far.value = camera.far;
    u.bloom.value = this.bloom ? fx.bloom : 0; u.thr.value = this.halfFloat ? fx.threshold : Math.min(.9, fx.threshold); u.glow.value = fx.glow; u.vig.value = fx.vignette;
    u.aspect.value = camera.aspect; u.ink.value = fx.ink; u.inkFar.value = fx.inkFar; u.flash.value = fx.flash;
    u.texel.value.set(1.25 / this.rtScene.width, 1.25 / this.rtScene.height);
    this._pass(this.comp, dest);
  }
  blend(k) { const u = this.mixMat.uniforms; u.tA.value = this.rtA.texture; u.tB.value = this.rtB.texture; u.k.value = k; this._pass(this.mixMat, null); }
}
