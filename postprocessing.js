// 3 composers because 1 is never enough
// this took me way too long to figure out
// if it looks stupid but works it aint stupid

function setupPP(renderer, scene, camera, THREE, LYR, h2v, EC, RP, SP, UBP, GCS, CS){
  // WHY DOES THIS NEED SO MANY ARGUMENTS???
  const W = window.innerWidth, H = window.innerHeight;

  // --- TORUS composer - what even is a torus anyway
  const tc = new EC(renderer);
  tc.renderToScreen = false;
  tc.addPass(new RP(scene, camera));
  tc.addPass(new SP(GCS));
  tc.addPass(new UBP(new THREE.Vector2(W, H), 0.22, 0.2, 0));

  const cp = new SP(CS);
  cp.renderToScreen = false;
  tc.addPass(cp);

  // --- BLOOM composer - moar glow
  const bc = new EC(renderer);
  bc.renderToScreen = false;
  bc.addPass(new RP(scene, camera));
  bc.addPass(new UBP(new THREE.Vector2(W, H), 0.4, 0.55, 0));

  const gp = new SP(GCS);
  gp.renderToScreen = false;
  bc.addPass(gp);

  // --- FINAL composer - this one actually goes to screen
  // (the others just render to texture lol)
  const fp = new SP({
    uniforms: {
      iTime:          {value: 0},
      tDiffuse:       {value: null},
      torusTexture:   {value: null},
      bloomTexture:   {value: null},
      haloTexture:    {value: null},   // not used yet but keeping for later
      uBg:            {value: h2v('#0a0a24')},
      uFlameA:        {value: h2v('#aee9ff')},
      uFlameB:        {value: h2v('#c79bff')},
      uFlameAmt:      {value: 0.2},
    },

    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }`,

    fragmentShader: `
      uniform float iTime;
      uniform sampler2D tDiffuse;
      uniform sampler2D bloomTexture;
      uniform sampler2D torusTexture;
      uniform sampler2D haloTexture;
      uniform vec3 uBg;
      uniform vec3 uFlameA;
      uniform vec3 uFlameB;
      uniform float uFlameAmt;
      varying vec2 vUv;

      vec3 warp3d(vec3 pos, float t){
        float curv = .8, a = 1.9, b = 0.7;
        pos *= 2.;
        pos.x += curv * sin(t + a*pos.y) + t*b;
        pos.y += curv * cos(t + a*pos.x);
        pos.y += curv * sin(t + a*pos.z) + t*b;
        pos.z += curv * cos(t + a*pos.y);
        pos.z += curv * sin(t + a*pos.x) + t*b;
        pos.x += curv * cos(t + a*pos.z);
        return 0.5 + 0.5 * cos(pos.xyz + vec3(1, 2, 4));
      }

      void main(){
        vec2 uv = 2. * vUv - 1.;
        vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime * 1.5), vec3(1.5));

        vec3 flame = 1.5 * uFlameA * w.x;
        flame *= w.y;
        flame += uFlameB * w.z;
        flame *= smoothstep(0.25, 1., abs(uv.y));

        float md = smoothstep(-0.7, 1., -uv.y * uv.x);
        flame *= md * md;

        vec3 bg = uBg * (1.0 - 0.4 * length(uv));

        vec3 halo = texture2D(haloTexture, vUv).xyz;

        gl_FragColor = vec4(
          bg + flame*uFlameAmt
          + texture2D(bloomTexture, vUv).xyz
          + texture2D(torusTexture, vUv).xyz
          + texture2D(tDiffuse, vUv).xyz
          + halo,
        1.);
      }`
  });

  fp.renderToScreen = true;

  const fc = new EC(renderer);
  fc.addPass(new RP(scene, camera));
  fc.addPass(fp);

  // connect the render targets
  fp.uniforms.bloomTexture.value = bc.renderTarget1.texture;
  fp.uniforms.torusTexture.value = tc.renderTarget1.texture;

  return {tc, bc, fc, fp};
}

export { setupPP };
