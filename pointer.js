// mouse tracking - stolen from stackoverflow probably
// TODO: fix the edge cases
// NOTE: THREE is passed in cause module scope is a mess

function mkPointer(THREE){
  // FIXME: should this be in world space or local?
  return {
    world:new THREE.Vector3(),
    activity:0,
    active:false,     // did user touch the mouse?
    lastMove:0        // timestamp
  };
}

// lerp helper cause i'm lazy
function lr(a,b,t){return a+(b-a)*t;}
function cl(v,mn,mx){return Math.max(mn,Math.min(mx,v));}

function updatePointer(ptr,mouseNDC,camera,THREE){
  const now=performance.now();
  const idle=(now-ptr.lastMove)/1000;
  const want=(ptr.active&&idle<3)?1:0;
  ptr.activity+=(want-ptr.activity)*0.06;

  let target=new THREE.Vector3(0,0,0);
  if(ptr.active){
    const ndc=new THREE.Vector3(mouseNDC.x,mouseNDC.y,0.5);
    ndc.unproject(camera);
    const dir=ndc.sub(camera.position).normalize();
    if(Math.abs(dir.z)>1e-4){
      const t=-camera.position.z/dir.z;
      if(t>0&&isFinite(t)){
        target=camera.position.clone().add(dir.multiplyScalar(t));
      }
    }
  }
  ptr.world.lerp(target,0.12);
}

export { mkPointer, updatePointer, lr, cl };
