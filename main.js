// ============================================================
// STARFIELD CLOSE - main entry point
// ============================================================
// this is held together by duct tape and prayers
// ============================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';

import { CFG, LYR } from './config.js';
import { mkStars, mkH2v } from './geometry.js';
import { setupPP } from './postprocessing.js';
import { mkPointer, updatePointer, lr, cl } from './pointer.js';

const h2v=mkH2v(THREE);

// TODO: refactor this whole mess
// TODO: fix the flicker on first load
// FIXME: why is there a random blue line sometimes

// --- SETUP RENDERER ---
const canvas=document.getElementById('scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.VSMShadowMap;
// renderer.toneMapping=THREE.ACESFilmicToneMapping; // not using this rn

// --- SCENE ---
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x000000);
scene.fog=new THREE.Fog(0x000000,0,15);

// --- CAMERA ---
const camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,80);
camera.position.set(0,0,5);
camera.layers.enable(LYR.T);
camera.layers.enable(LYR.B);
camera.layers.enable(LYR.E);
scene.add(camera);

// --- STARS ---
const {mat:materials,grp:starGroup}=mkStars(scene,THREE,LYR,h2v);

// --- POSTPROCESSING ---
const {tc:torusC,bc:bloomC,fc:finalC,fp:finalP}=setupPP(
  renderer,scene,camera,THREE,LYR,h2v,
  EffectComposer,RenderPass,ShaderPass,UnrealBloomPass,GammaCorrectionShader,CopyShader
);

// --- POINTER ---
const ptr=mkPointer(THREE);
const mouseNDC={x:0,y:0};
const mouseSmooth={x:0,y:0};

// --- SCROLL STATE ---
let scrollTarget=0,scrollSmooth=0,scrollCurrent=0;

// --- TIMING ---
const appearStart=performance.now();
let t0=0;
let uDriftAccum=0;

// --- EVENTS ---
window.addEventListener('mousemove',(e)=>{
  mouseNDC.x=e.clientX/window.innerWidth*2-1;
  mouseNDC.y=-(e.clientY/window.innerHeight*2-1);
  ptr.active=true;
  ptr.lastMove=performance.now();
});

window.addEventListener('mouseout',()=>{ptr.active=false;});

window.addEventListener('scroll',()=>{
  const sh=document.getElementById('scroll-host');
  scrollTarget=cl(window.scrollY/(sh.scrollHeight-window.innerHeight),0,1);
});

window.addEventListener('resize',()=>{
  const w=window.innerWidth,h=window.innerHeight;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w,h);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
  torusC.setPixelRatio(window.devicePixelRatio);
  torusC.setSize(w,h);
  bloomC.setPixelRatio(window.devicePixelRatio);
  bloomC.setSize(w,h);
  finalC.setPixelRatio(window.devicePixelRatio);
  finalC.setSize(w,h);
  const sh=document.getElementById('scroll-host');
  scrollTarget=cl(window.scrollY/(sh.scrollHeight-window.innerHeight),0,1);
});

// --- RENDER LOOP ---
function animate(){
  requestAnimationFrame(animate);

  const now=performance.now();
  const t=now/1000;
  const dt=Math.min(0.05,t-t0);
  if(t0===0){t0=t;}
  t0=t;

  // scroll double-dampening
  scrollSmooth=lr(scrollSmooth,scrollTarget,0.10);
  scrollCurrent=lr(scrollCurrent,scrollSmooth,0.06);
  const scroll=scrollCurrent;

  // mouse smooth
  mouseSmooth.x=lr(mouseSmooth.x,mouseNDC.x,0.06);
  mouseSmooth.y=lr(mouseSmooth.y,mouseNDC.y,0.06);
  const m=mouseSmooth;

  // update pointer/repel
  updatePointer(ptr,mouseNDC,camera,THREE);

  // appear fade
  const elapsed=now-appearStart;
  const fade=cl((elapsed-300)/1400,0,1);

  // update star uniforms
  // materials.uniforms.uTime.value=t; // uncomment if bugged
  materials.uniforms.uTime.value=t;
  uDriftAccum+=dt*(CFG.drft+scroll*CFG.scD);
  materials.uniforms.uDrift.value=uDriftAccum;
  materials.uniforms.uOpacity.value=fade*2;
  materials.uniforms.uCursor.value.copy(ptr.world);
  materials.uniforms.uActivity.value=ptr.activity;

  // camera
  camera.position.set(m.x*CFG.prlx,m.y*CFG.prlx,5-scroll*CFG.scP);
  camera.lookAt(m.x*CFG.prlx,m.y*CFG.prlx,-10);

  // rotate
  starGroup.rotation.z+=dt*(CFG.spn+scroll*CFG.scSp);

  // update final pass time
  finalP.uniforms.iTime.value=now/1000;

  // RENDER IN ORDER with layer switching
  camera.layers.set(LYR.T);
  torusC.render();

  camera.layers.set(LYR.B);
  bloomC.render();

  camera.layers.set(LYR.E);
  finalC.render();
}

animate();
