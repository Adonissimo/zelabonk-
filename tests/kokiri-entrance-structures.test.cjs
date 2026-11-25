const {test}=require('node:test');
const assert=require('node:assert/strict');
const THREE=require('../vendor/three.min.js');
const Terrain=require('../terrain.js');
const {buildShrine,buildTunnel}=require('../kokiri-entrance-structures.js');
const {updateCutaways}=require('../kokiri-orbit-scene.js');

test('Kokiri stage shrine is a grounded multi-sided object with independent stage indicator pieces',()=>{
  const env=new THREE.Group(),cache=new Map(),ground=(x,z)=>Terrain.height(Terrain.KOKIRI_REALM,2,x,z);
  const {group,gem,ring}=buildShrine(THREE,env,cache,ground);
  env.updateMatrixWorld(true);
  assert.equal(group.position.z,-7);
  assert.equal(group.position.y,ground(0,-7));
  assert.equal(gem.parent,group);
  assert.equal(ring.parent,group);
  assert.equal(gem.position.y,ring.position.y);
  assert.equal(group.children.every(o=>o.isMesh&&o.material.map.magFilter===THREE.NearestFilter&&o.material.map.minFilter===THREE.NearestFilter),true);
  for(const [x,z] of [[0,4],[4,0],[-4,0],[0,-4]]){
    const d=new THREE.Vector3(-x,0,-z).normalize();
    const ray=new THREE.Raycaster(new THREE.Vector3(x,group.position.y+.16,group.position.z+z),d);
    assert.ok(ray.intersectObjects(group.children).some(hit=>hit.object.name==='kokiri-shrine-stone-0'),'platform has depth on every side');
  }
});

test('decorative root arch preserves the tunnel walking and gliding lane, with high cutaway lintel',()=>{
  const env=new THREE.Group(),rows=buildTunnel(THREE,Terrain,env,new Map());
  const {halfWidth,openingZ}=Terrain.DEKU_ENTRANCE;
  env.updateMatrixWorld(true);
  const meshes=[];
  env.traverse(o=>{if(o.isMesh)meshes.push(o);});
  assert.ok(meshes.length>=8);
  assert.equal(meshes.every(o=>o.geometry.attributes.uv&&o.material.map.magFilter===THREE.NearestFilter&&o.userData.kokiriOwnedGeometry),true);
  for(const x of [-halfWidth+.52,0,halfWidth-.52])for(const y of [.12,.8,2.5,4.5]){
    const ray=new THREE.Raycaster(new THREE.Vector3(x,y,openingZ+4),new THREE.Vector3(0,0,-1),0,8);
    assert.equal(ray.intersectObjects(meshes).length,0,'no art clips into the playable throat at '+x+','+y);
  }
  const high=new THREE.Raycaster(new THREE.Vector3(0,7.4,openingZ+4),new THREE.Vector3(0,0,-1),0,8);
  assert.ok(high.intersectObjects(meshes).some(hit=>hit.object.name==='kokiri-threshold-lintel'),'bridge of roots is genuinely overhead');
  updateCutaways(rows,{x:0,y:12,z:openingZ+6},{x:0,y:0,z:openingZ-6});
  assert.equal(rows[2].row.visible,false);
  updateCutaways(rows,{x:0,y:3,z:openingZ-18},{x:0,y:0,z:openingZ-6});
  assert.ok(rows.every(entry=>entry.row.visible));
});
