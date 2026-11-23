const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const THREE = require('../vendor/three.min.js');
const { clamp } = require('../core.js');

const source = fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const worldView = source.slice(source.indexOf('  class WorldView'),source.indexOf('  function currentDialog'));
const cached = new Map();
const art = {
  material(_kind,id,direction,frame) {
    const key = [id,direction,frame].join(':');
    if (!cached.has(key)) {
      const material = new THREE.SpriteMaterial({ map:new THREE.Texture() });
      material.map.name = key;
      cached.set(key,material);
    }
    return cached.get(key);
  },
  sprite(kind,id) { return new THREE.Sprite(this.material(kind,id,0,0)); },
};
const WorldView = vm.runInNewContext(worldView+'\nWorldView',{
  THREE,clamp,RelicArt:art,reducedMotion:false,storage:{graphics:'balanced'},
});
const cameraAt = (x,y,z,aspect) => {
  const camera = new THREE.PerspectiveCamera(50,aspect,.1,250);
  camera.position.set(x,y,z);
  camera.lookAt(0,0,0);
  camera.updateMatrixWorld();
  return camera;
};
function checkDirection(mesh,direction,camera) {
  const start=mesh.position.clone().project(camera);
  const end=mesh.position.clone().addScaledVector(direction,.8).project(camera);
  const x=(end.x-start.x)*camera.aspect,y=end.y-start.y;
  const len=Math.hypot(x,y);
  assert.ok(len>1e-7);
  const theta=mesh.material.rotation;
  assert.ok((Math.cos(theta)*x+Math.sin(theta)*y)/len>.999999);
}
test('sword waves and arrow tips track actual screen-space flight after an orbit and pitch change',()=>{
  const view=Object.create(WorldView.prototype);view.entities=new THREE.Group();
  const game={groundAt:()=>1};
  for(const type of ['ember','leaf']){
    const shots=[
      {type,x:3,y:1,z:3,vx:1,vy:0,vz:0,age:.35},
      {type,x:2,y:3,z:-3,vx:-1,vy:.18,vz:0,age:.21},
      {type,x:-6,y:2,z:1,vx:-.61,vy:-.31,vz:.79,age:.42},
    ];
    const meshes=shots.map(()=>view.projectileModel(type,1,1,true));
    for(const camera of [cameraAt(0,10,17,16/9),cameraAt(-14,9,-13,9/16),cameraAt(0,21,-.5,4/3)]){
      view.camera=camera;
      for(const [i,shot] of shots.entries()) {
        view.projectilePose(meshes[i],shot,game);
        const vec=new THREE.Vector3(shot.vx,shot.vy,shot.vz).normalize();
        checkDirection(meshes[i],vec,camera);
        assert.equal(meshes[i].center.y,.5);
      }
      assert.notEqual(meshes[0].material,meshes[1].material);
      assert.equal(art.material('projectile',type,0,0).rotation,0);
    }
  }
});
test('Midna extends and retracts one anchored shadow hand inside her melee reach',()=>{
  const view=Object.create(WorldView.prototype);
  view.entities=new THREE.Group();view.effects=[];view.camera=cameraAt(8,12,14,16/9);
  const event={x:1,z:-2,y:1.2,facing:-Math.PI/3,arc:Math.PI*.59,radius:3.4,duration:.4};
  view.shadowStrikeEffect(event);
  assert.equal(view.effects.length,1);
  for(const effect of view.effects){
    assert.equal(effect.mesh.material.map.name,'shadowHand:0:0');
    assert.ok(effect.mesh.material.opacity>0);
    assert.ok(Math.abs(effect.angle-event.facing)<event.arc/2);
    const originalWidth=effect.mesh.scale.x;
    view.positionShadowStrike(effect,.42);
    const maxWidth=effect.mesh.scale.x;
    assert.ok(maxWidth>originalWidth*2);
    assert.ok(effect.y>event.y);
    const dx=effect.mesh.position.x-event.x,dz=effect.mesh.position.z-event.z;
    assert.ok(Math.hypot(dx,dz)<event.radius);
    checkDirection(effect.mesh,new THREE.Vector3(Math.sin(effect.angle),0,Math.cos(effect.angle)),view.camera);
    view.positionShadowStrike(effect,.84);
    assert.ok(effect.mesh.scale.x<maxWidth);
    view.positionShadowStrike(effect,1);
    assert.equal(effect.mesh.material.opacity,0);
  }
});
test('removing a directional shot disposes its own material without invalidating shared art',()=>{
  const view=Object.create(WorldView.prototype);view.entities=new THREE.Group();
  const map=new Map(),shot={id:4};
  view.syncMap(map,[shot],()=>view.projectileModel('ember',1,1,true),()=>{});
  let removed=0;
  map.get(shot.id).material.addEventListener('dispose',()=>removed++);
  const shared=art.material('projectile','ember',0,0);
  let invalidated=0;
  shared.addEventListener('dispose',()=>invalidated++);
  view.syncMap(map,[],()=>{},()=>{});
  assert.equal(view.entities.children.length,0);
  assert.equal(map.size,0);
  assert.equal(removed,1);
  assert.equal(invalidated,0);
});
