const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {HEROES}=require('../core.js'),THREE=require('../vendor/three.min.js');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const app=read('app.js');
const viewSource=app.slice(app.indexOf('  class WorldView'),app.indexOf('  function currentDialog'));
const makeView=reducedMotion=>vm.runInNewContext(viewSource+'\nWorldView',{
  reducedMotion,THREE,BonkCamera:{direction:()=>0},
  RelicArt:{animationFrame:()=>0,material:()=>new THREE.SpriteMaterial()},
});
test('Skull Kid hovers visibly and retained reduced-motion height does not bob',()=>{
  const Normal=makeView(false),Reduced=makeView(true);
  const view=Object.create(Normal.prototype),reduced=Object.create(Reduced.prototype);
  assert.equal(view.heroHoverLift('link',1),0);
  assert.equal(view.heroHoverLift('skullkid',1,true),0);
  assert.ok(view.heroHoverLift('skullkid',0)>.6);
  assert.notEqual(view.heroHoverLift('skullkid',0),view.heroHoverLift('skullkid',1));
  assert.equal(reduced.heroHoverLift('skullkid',0),reduced.heroHoverLift('skullkid',1));
  assert.ok(reduced.heroHoverLift('skullkid',0)>.6);
});
test('a Skull Kid companion floats visually without lifting its ground position or other allies',()=>{
  const View=makeView(false),view=Object.create(View.prototype);
  view.camera=new THREE.PerspectiveCamera();
  const group=new THREE.Group();
  group.userData={sprite:new THREE.Sprite(),pip:new THREE.Object3D()};
  const entry={x:4,y:2,z:7,hero:'skullkid',action:'walk'};
  view.companionPose(group,entry,{time:2,groundAt:()=>1});
  assert.deepEqual(group.position.toArray(),[4,2,7]);
  assert.ok(group.userData.sprite.position.y>.6);
  assert.ok(group.userData.pip.position.y>2.6);
  view.companionPose(group,{...entry,hero:'saria'},{time:2,groundAt:()=>1});
  assert.equal(group.userData.sprite.position.y,0);
});
test('Ultimate one-shot animation holds its last frame instead of looping to wind-up',()=>{
  const sandbox={window:{}};
  vm.runInNewContext(read('art.js'),sandbox);
  const art=sandbox.window.RelicArt;
  assert.equal(art.animationFrame('ultimate',0),0);
  assert.equal(art.animationFrame('ultimate',1.05),art.ANIMATIONS.ultimate[0]-1);
  assert.equal(art.animationFrame('ultimate',2),art.ANIMATIONS.ultimate[0]-1);
  assert.equal(art.animationFrame('walk',.8),0);
});
test('all eleven heroes describe their distinct signature and identify non-combat scenes',()=>{
  const entries=Object.values(HEROES);
  assert.equal(entries.length,11);
  assert.equal(new Set(entries.map(h=>h.ultimateDetail)).size,11);
  assert.deepEqual(Object.entries(HEROES).filter(([,h])=>h.sceneOnly).map(([id])=>id),['saria','nabooru']);
  for(const hero of entries)assert.ok(hero.ultimateDetail.length>20);
});
