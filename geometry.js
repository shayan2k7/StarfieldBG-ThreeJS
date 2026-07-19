// why 4200? cause it looked good. dont @ me
const CNT = 4200;
const DEP = 30;

// helper - cause parsing hex is boring
function mkH2v(THREE){
  return function(h){
    const n = parseInt(h.slice(1), 16);
    return new THREE.Vector3(
      ((n >> 16) & 255) / 255,
      ((n >> 8) & 255) / 255,
      (n & 255) / 255
    );
  };
}

function mkStars(scene, THREE, LYR, h2v){
  const p = new Float32Array(CNT * 3);
  const pl = new Float32Array(CNT);   // palette
  const br = new Float32Array(CNT);   // brightness
  const sc = new Float32Array(CNT);   // scale
  const ph = new Float32Array(CNT);   // phase

  for(let i = 0; i < CNT; i++){
    const i3 = i * 3;
    p[i3]   = (Math.random() - 0.5) * 24;
    p[i3+1] = (Math.random() - 0.5) * 16;
    p[i3+2] = (Math.random() - 0.5) * 30;

    pl[i] = Math.floor(Math.random() * 3);
    br[i] = 0.7 + Math.random() * 0.6;
    sc[i] = 0.5 + Math.pow(Math.random(), 1.4) * 2.5;
    ph[i] = Math.random();
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('aScale', new THREE.Float32BufferAttribute(sc, 1));
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph, 1));
  g.setAttribute('aPalette', new THREE.Float32BufferAttribute(pl, 1));
  g.setAttribute('aBright', new THREE.Float32BufferAttribute(br, 1));

  // the material with all the uniforms
  // this part is kinda messy but whatever
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime:          {value: 0},
      uSize:          {value: 50},
      uOpacity:       {value: 0},
      uDrift:         {value: 0},
      uDepth:         {value: 30},
      uTwinkle:       {value: 1},
      uCursor:        {value: new THREE.Vector3()},
      uRepelRadius:   {value: 5},
      uRepelStrength: {value: 0.35},
      uActivity:      {value: 0},
      uColorA:        {value: h2v('#aef6cf')},
      uColorB:        {value: h2v('#5fe6a0')},
      uColorC:        {value: h2v('#eafff2')},
      uBrightness:    {value: 1.85},
    },

    // vertex shader
    vertexShader: `
      uniform float uTime;
      uniform float uSize;
      uniform float uDrift;
      uniform float uDepth;
      uniform float uTwinkle;
      uniform vec3 uCursor;
      uniform float uRepelRadius;
      uniform float uRepelStrength;
      uniform float uActivity;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;

      attribute float aScale;
      attribute float aPhase;
      attribute float aPalette;
      attribute float aBright;

      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec3 pos = position;
        pos.z = mod(pos.z + uDrift + (uDepth * 0.5), uDepth) - (uDepth * 0.5);

        float tw = sin(uTime * 1.6 + aPhase * 6.2831);
        vTwinkle = (1.0 - uTwinkle) + uTwinkle * (0.55 + 0.45 * tw);

        vec4 modelPosition = modelMatrix * vec4(pos, 1.0);

        // repel from cursor
        vec3 toParticle = modelPosition.xyz - uCursor;
        float dist = length(toParticle);
        float falloff = smoothstep(uRepelRadius, 0.0, dist);
        modelPosition.xyz += normalize(toParticle + vec3(0.0001)) * falloff * uRepelStrength * uActivity;

        vec4 viewPosition = viewMatrix * modelPosition;
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = uSize * aScale;
        gl_PointSize *= (1.0 / -viewPosition.z);

        vec3 base = aPalette < 0.5 ? uColorA : (aPalette < 1.5 ? uColorB : uColorC);
        vColor = base * aBright;
      }`,

    // fragment shader
    fragmentShader: `
      uniform float uOpacity;
      uniform float uBrightness;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;

        float strength = pow(1.0 - d * 2.0, 4.0);
        vec3 color = mix(vec3(0.0), vColor, strength);
        gl_FragColor = vec4(color * uBrightness, strength * uOpacity * vTwinkle);
      }`
  });

  const pt = new THREE.Points(g, m);
  pt.layers.enable(LYR.E);

  const grp = new THREE.Group();
  grp.add(pt);

  // ambient light for... reasons?
  // honestly not sure this does anything but removing it breaks things
  const shitlight = new THREE.AmbientLight(0xffffff, 0);
  grp.add(shitlight);

  scene.add(grp);

  return { mat: m, grp: grp };
}

export { mkStars, CNT, DEP, mkH2v };
