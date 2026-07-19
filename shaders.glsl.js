// --- star vertex shader ---
// i hate glsl but here we are
const VERT_STAR = `
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
  }`;

const FRAG_STAR = `
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
  }`;


// --- final composite shader ---
const VERT_FINAL = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }`;

const FRAG_FINAL = `
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
  }`;

export { VERT_STAR, FRAG_STAR, VERT_FINAL, FRAG_FINAL };
