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
                glowUV: new THREE.Vector2(.5, .5), glow: 0, glowColor: new THREE.Color(1, .8, .5), vignette: .3 };
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
        dof: { value: 0 }, focus: { value: 1 }, dofRange: { value: 1.6 }, near: { value: .05 }, far: { value: 100 }, bloom: { value: .35 }, thr: { value: 1.6 }, vig: { value: .3 } },
      vertexShader: fsVert,
      fragmentShader: `uniform sampler2D tScene, tDepth, tQ, tE; uniform vec2 mblur, glowUV; uniform vec3 glowColor;
        uniform float glow, aspect, dof, focus, dofRange, near, far, bloom, thr, vig; varying vec2 vUv;
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
          col += (max(q - thr, 0.0) * 0.5 + max(e - thr, 0.0) * 0.9) * bloom;
          if (glow > 0.001) { vec2 d = (vUv - glowUV) * vec2(aspect, 1.0); float r = length(d); col += glow * glowColor * (0.5 * exp(-r * 5.0) + exp(-r * 26.0)); }
          vec2 v = (vUv - 0.5) * vec2(0.95, 1.1);
          col *= mix(1.0, 1.0 - vig, smoothstep(0.2, 0.85, dot(v, v) * 2.2));
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
  }
  setSize(w, h) {
    for (const r of [this.rtScene, this.rtQ, this.rtQ2, this.rtE, this.rtE2]) if (r) r.dispose();
    this.rtScene = new THREE.WebGLRenderTarget(w, h, { type: this.type, samples: 4, depthTexture: new THREE.DepthTexture(w, h) });
    const o = { type: this.type, depthBuffer: false };
    this.rtQ = new THREE.WebGLRenderTarget(Math.max(1, w >> 2), Math.max(1, h >> 2), o); this.rtQ2 = new THREE.WebGLRenderTarget(Math.max(1, w >> 2), Math.max(1, h >> 2), o);
    this.rtE = new THREE.WebGLRenderTarget(Math.max(1, w >> 3), Math.max(1, h >> 3), o); this.rtE2 = new THREE.WebGLRenderTarget(Math.max(1, w >> 3), Math.max(1, h >> 3), o);
  }
  _pass(mat, target) { this.quad.material = mat; this.renderer.setRenderTarget(target); this.renderer.render(this.scene, this.cam); }
  render(scene, camera) {
    const r = this.renderer;
    if (!this.enabled) { r.setRenderTarget(null); r.render(scene, camera); return; }
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
    u.aspect.value = camera.aspect;
    this._pass(this.comp, null);
  }
}
