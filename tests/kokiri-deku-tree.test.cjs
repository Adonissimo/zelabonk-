const {test}=require('node:test');
const assert=require('node:assert/strict');
const THREE=require('../vendor/three.min.js');
const Terrain=require('../terrain.js'),Deku=require('../kokiri-deku-tree.js'),Houses=require('../kokiri-village-structures.js');

function clearing(stage=3){
  const env=new THREE.Group(),cache=new Map(),ground=(x,z)=>Terrain.height(6,stage,x,z);
  const tree=Deku.build(THREE,env,cache,Terrain.DEKU_PORTAL,ground,Terrain.DEKU_TREE.turn);
  env.updateMatrixWorld(true);
  return {env,cache,tree,ground};
}
function first(group,start,dir,objects){
  group.updateWorldMatrix(true,true);
  const ray=new THREE.Raycaster(group.localToWorld(new THREE.Vector3(...start)),new THREE.Vector3(...dir).applyQuaternion(group.quaternion));
  return ray.intersectObjects(objects,true)[0];
}

test('Deku is a full-volume landmark: front shows relief, rear has bark, and the world-aligned mouth can open',()=>{
  const {tree,ground}=clearing(),{body,closed,open}=tree,portal=Terrain.DEKU_PORTAL;
  assert.deepEqual(body.position.toArray(),[portal.x,ground(portal.x,portal.z),portal.z]);
  assert.equal(body.rotation.y,Terrain.DEKU_TREE.turn);
  const face=first(body,[0,10,14],[0,0,-1],[body]),rear=first(body,[0,10,-21],[0,0,1],[body]);
  assert.equal(face.object.name,'deku-carved-face');
  assert.equal(rear.object.name,'deku-rear-bark');
  assert.equal(closed.visible,true);assert.equal(open.visible,false);
  const before=first(body,[0,2,15],[0,0,-1],[body,closed]);
  open.visible=true;closed.visible=false;
  const after=first(body,[0,2,15],[0,0,-1],[body,open]);
  assert.equal(before.object.name,'deku-closed-root-seal');
  assert.equal(after.object.name,'deku-recessed-mouth');
  assert.ok(after.distance-before.distance>2.8,'open door is recessed, not just a color change');
  assert.equal(first(body,[5,2,15],[0,0,-1],[body,open]).object.name,'deku-carved-face');
  const box=new THREE.Box3().setFromObject(body),size=box.getSize(new THREE.Vector3());
  assert.ok(size.x>24&&size.y>27&&size.z>14,'roots and crown have stable width, height and depth');
  assert.ok(tree.parts.every(({mesh})=>mesh.isMesh&&mesh.geometry.getAttribute('uv')&&mesh.material.map.isDataTexture&&
    mesh.material.map.minFilter===THREE.NearestFilter&&mesh.material.map.magFilter===THREE.NearestFilter&&
    mesh.material.map.flipY===false&&mesh.material.map.generateMipmaps===false));
});

test('an orbit behind the Deku tree exposes Link only if the trunk actually obstructs view',()=>{
  const {tree}=clearing(),p=(x,y,z)=>tree.body.localToWorld(new THREE.Vector3(x,y,z));
  const link=p(0,.1,6);
  Deku.update(tree,p(0,4,-18),link);
  assert.ok(tree.parts.filter(({mesh})=>mesh.name==='deku-rear-bark').every(({mesh,fade})=>mesh.material===fade));
  assert.ok(tree.parts.some(({mesh,solid})=>mesh.material===solid),'not every part fades');
  Deku.update(tree,p(0,6,22),link);
  assert.ok(tree.parts.every(({mesh,solid})=>mesh.material===solid));
});

test('all Kokiri houses have a fixed doorway, solid bark from the rear, and a roof seen from above',()=>{
  const {env,cache,ground}=clearing();
  for(const [i,home] of Terrain.VILLAGE.homes.entries()){
    const h=Houses.buildHome(THREE,env,cache,home,i,ground);
    assert.deepEqual(h.position.toArray(),[home.x,ground(home.x,home.z),home.z]);
    assert.equal(h.rotation.y,home.turn);
    const nose=first(h,[0,home.height*.26,home.radius*3],[0,0,-1],[h]);
    assert.equal(nose.object.name,'recessed-plank-door');
    const rear=first(h,[.17,home.height*.38,-home.radius*3],[0,0,1],[h]);
    assert.equal(rear.object.name,'stump-bark-shell');
    const roof=first(h,[0,home.height*3,0],[0,-1,0],[h]);
    assert.equal(roof.object.name,'stump-annual-rings');
    assert.ok(h.userData.parts.every(({mesh})=>mesh.geometry.getAttribute('uv')&&mesh.material.map.minFilter===THREE.NearestFilter&&mesh.material.map.flipY===false));
  }
});

test('stump houses fade only if an orbit puts them between camera and the hero',()=>{
  const {env,cache,ground}=clearing(),home=Terrain.VILLAGE.homes[0],h=Houses.buildHome(THREE,env,cache,home,0,ground);
  const H=(x,y,z)=>h.localToWorld(new THREE.Vector3(x,y,z));
  Houses.update([h],H(0,1,8),H(0,0,-5));
  assert.ok(h.userData.parts.every(({mesh,fade})=>mesh.material===fade));
  Houses.update([h],H(0,2,-10),H(0,0,-5));
  assert.ok(h.userData.parts.every(({mesh,solid})=>mesh.material===solid));
});
