const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const THREE = require('../vendor/three.min.js');
const { clamp, HEROES } = require('../core.js');

const source = fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const body = source.slice(source.indexOf('  class WorldView'),source.indexOf('  function currentDialog'));
const WorldView = vm.runInNewContext(body+'\nWorldView',{THREE,clamp,
  RelicArt:{sprite:()=>new THREE.Sprite()}, reducedMotion:false});
const makeView = () => {
  const view=Object.create(WorldView.prototype);
  view.scene=new THREE.Scene();
  view.geometries={
    box:new THREE.BoxGeometry(),torus:new THREE.TorusGeometry(1,.09,5,24),
    disc:new THREE.CircleGeometry(1,20),diamond:new THREE.OctahedronGeometry(1),
  };
  view.materials=new Map();
  return view;
};
const stamp = rig => JSON.stringify({
  motion: rig.userData.sway.matrix.toArray(),
  clips: rig.userData.cloth.map(m=>Array.from(m.geometry.attributes.position.array)),
});
test('only Link has paraglider equipment; other airborne heroes have no invented rigs',()=>{
  const view=makeView();
  for(const id of Object.keys(HEROES)){
    const rig=view.buildGlideRig(id),names=rig.userData.sway.children.map(piece=>piece.name);
    const equipped=id==='link';
    assert.equal(rig.visible,false);
    assert.equal(rig.userData.equipped,equipped);
    assert.equal(names.includes('canvas-wing'),equipped);
    assert.equal(names.includes('paraglider-strut'),equipped);
    if(!equipped)assert.equal(names.length,0,id);
    view.updateGlideRig(rig,true,2,false);
    assert.equal(rig.visible,equipped);
  }
});
test('Link’s paraglider opens, uses the game clock, and respects reduced motion',()=>{
  const view=makeView();
  for(const id of ['link']){
    const rig=view.buildGlideRig(id);
    view.updateGlideRig(rig,true,2,false);rig.updateMatrixWorld(true);
    assert.equal(rig.visible,true);
    const launch=stamp(rig);
    assert.equal(rig.userData.sway.scale.x,.62);
    view.updateGlideRig(rig,true,2.27,false);rig.updateMatrixWorld(true);
    const flight=stamp(rig);
    assert.notEqual(flight,launch,id);
    assert.equal(rig.userData.sway.scale.x,1);
    view.updateGlideRig(rig,true,2.27,false);rig.updateMatrixWorld(true);
    assert.equal(stamp(rig),flight,id+' simulation pause');
    view.updateGlideRig(rig,true,2.49,true);rig.updateMatrixWorld(true);
    const still=stamp(rig);
    view.updateGlideRig(rig,true,10,true);rig.updateMatrixWorld(true);
    assert.equal(stamp(rig),still,id+' reduced motion');
    assert.equal(rig.userData.sway.rotation.z,0);
    view.updateGlideRig(rig,false,10.1,false);
    assert.equal(rig.visible,false);
    view.updateGlideRig(rig,true,22,false);rig.updateMatrixWorld(true);
    assert.equal(stamp(rig),launch,id+' relaunch');
  }
});
test('changing hero disposes their private fabric without destroying shared effect materials',()=>{
  const view=makeView();
  view.makeHero('link');let privateResources=0;
  const wing=view.glider.userData.cloth[0];
  wing.geometry.addEventListener('dispose',()=>privateResources++);
  wing.material.addEventListener('dispose',()=>privateResources++);
  const strut=view.glider.getObjectByName('paraglider-strut');let sharedResources=0;
  strut.material.addEventListener('dispose',()=>sharedResources++);
  view.makeHero('zelda');
  assert.equal(privateResources,2);
  assert.equal(sharedResources,0);
  assert.equal(view.glider.name,'signature-glide:zelda');
  assert.equal(view.glider.visible,false);
});
