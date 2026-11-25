const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const THREE=require('../vendor/three.min.js');
const BonkCamera=require('../camera.js');
const core=require('../core.js');
const {Game,Terrain}=core;
const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
const viewSource=app.slice(app.indexOf('  class WorldView'),app.indexOf('  function currentDialog'));

function world(reducedMotion=false){
  // The same render and sync methods run against actual Three scene graphs; only
  // WebGL output and static terrain creation are substituted in this Node test.
  const art={
    RUTO_SWIM_WATER_ROW:73,
    ANIMATIONS:{attack:[6,14],cast:[6,10],ultimate:[8,9]},
    animationFrame:(pose,age)=>pose==='swim'?Math.floor(age*12)%8:pose==='tread'?Math.floor(age*5)%4:0,
    material(kind,id,dir,frame,hurt,action){
      const mat=new THREE.SpriteMaterial({map:new THREE.Texture()});mat.map.name=[kind,id,dir,frame,action||'idle'].join(':');return mat;
    },
    sprite(kind,id,w,h){
      const m=new THREE.Sprite(this.material(kind,id,0,0));m.scale.set(w,h,1);m.center.set(.5,0);return m;
    }
  };
  const World=vm.runInNewContext(viewSource+'\nWorldView',{
    ...core,THREE,RelicArt:art,BonkCamera,storage:{graphics:'balanced'},reducedMotion,
    endingShown:false,innerWidth:1000,innerHeight:600,$:()=>({style:{}}),sound(){},
  });
  const v=Object.create(World.prototype),scene=new THREE.Scene(),entities=new THREE.Group(),camera=new THREE.PerspectiveCamera(39,5/3,.1,360);
  scene.add(entities);
  Object.assign(v,{
    scene,entities,camera,cameraTarget:new THREE.Vector3(),yaw:Math.PI/4,pitch:.78,distance:22,elapsed:0,shake:0,
    realm:-1,levelStage:0,landmark:null,hero:null,lastPlayer:{x:0,z:0},sun:new THREE.DirectionalLight(),
    windClock:{},windStrength:{},materials:new Map(),renderer:{render(){scene.updateMatrixWorld(true);}},
    geometries:{torus:new THREE.TorusGeometry(),disc:new THREE.CircleGeometry(),diamond:new THREE.OctahedronGeometry(),box:new THREE.BoxGeometry(),sphere:new THREE.IcosahedronGeometry(),lowSphere:new THREE.IcosahedronGeometry(),cylinder:new THREE.CylinderGeometry()},
    enemies:new Map(),companions:new Map(),projectiles:new Map(),shards:new Map(),hazards:new Map(),loot:new Map(),
    orbits:[],effects:[],floating:[],ultimateCues:[],billboards:[],kokiriSprites:[],
    buildRealm(realm,stage,flatTerrain){Object.assign(this,{realm,levelStage:stage,flatTerrain,landmark:null});},
    buildLandmark(realm,stage,landmark){Object.assign(this,{realm,levelStage:stage,landmark});},
    makeNavi(){return null;},updateBillboards(){},updateKokiriSprites(){},
  });
  return v;
}

function at(run,x,z,altitude=0){
  Object.assign(run.player,{x,z,ground:run.groundAt(x,z),y:altitude,action:altitude?'jump':'walk',actionTime:0,actionAge:.39});
  run.time+=.2;
}
function viewOf(hero,realm=Terrain.ZORA_REALM,reducedMotion=false){
  const view=world(reducedMotion),run=new Game(hero,112,{realm});
  view.makeHero(hero);return {view,run};
}
test('real WorldView clips the feet by liquid height at different camera pitches, not by screen-space rows',()=>{
  const {view,run}=viewOf('link');
  at(run,23,-29);const sample=run.waterAt(23,-29);
  assert.ok(sample&&sample.surface>run.player.ground+.25);
  for(const [yaw,pitch] of [[.5,.43],[1.1,.94],[-2.2,1.2]]){
    view.yaw=yaw;view.pitch=pitch;view.render(run,.05,run.time);
    const {material}=view.heroSprite,plane=material.clippingPlanes[0];
    assert.strictEqual(material,view.heroSprite.userData.waterMaterial);
    assert.ok(Math.abs(plane.distanceToPoint(new THREE.Vector3(23,sample.surface,-29)))<1e-8);
    assert.ok(plane.distanceToPoint(new THREE.Vector3(23,run.player.ground,-29))<0);
    assert.ok(plane.distanceToPoint(new THREE.Vector3(23,sample.surface+.1,-29))>0);
  }
  const wetMaterial=view.heroSprite.material;
  at(run,23,-29,1.3);view.render(run,.05,run.time);
  assert.notEqual(view.heroSprite.material,wetMaterial);
  assert.equal(view.heroSprite.material.clippingPlanes,null);
  assert.equal(view.heroShadow.visible,true);
  at(run,0,0);view.render(run,.05,run.time);
  assert.equal(view.heroSprite.position.y,0);
});
test('painted creek wading offsets the body before clipping, but the bridge stays dry',()=>{
  const {view,run}=viewOf('link',Terrain.KOKIRI_REALM);
  at(run,-22.9,16.4);view.render(run,.05,run.time);
  const sample=run.waterAt(run.player.x,run.player.z);
  assert.ok(sample.sink>.4);
  assert.equal(view.heroSprite.position.y,-sample.sink);
  assert.ok(view.effects.some(e=>e.kind==='waterStep'&&e.mesh.children.some(mesh=>mesh.visible)));
  at(run,-15.5,2);view.render(run,.05,run.time);
  assert.equal(view.heroSprite.position.y,0);
  assert.equal(view.heroSprite.material.clippingPlanes,null);
});
test('Both floating heroes clear Zora’s surface with no wake; Ruto and a wading follower leave wakes',()=>{
  for(const hero of ['midna','skullkid']){
    const {view,run}=viewOf(hero);
    at(run,23,-29);view.render(run,.05,run.time);
    assert.ok(view.hero.position.y+view.heroRig.position.y>run.waterAt(23,-29).surface+.45);
    assert.equal(view.heroSprite.material.clippingPlanes,null);
    assert.equal(view.effects.filter(e=>e.kind==='waterStep').length,0);
  }
  const {view,run}=viewOf('ruto');
  at(run,23,-29);view.render(run,.05,run.time);
  assert.equal(view.effects.filter(e=>e.kind==='waterStep'&&e.ruto).length,1);
  const ally=view.companionModel({hero:'darunia'});
  const state={hero:'darunia',x:24,z:-29,facing:.2,action:'walk',actionAge:.21};
  view.companionPose(ally,state,run);
  assert.ok(ally.userData.sprite.material.clippingPlanes.length===1);
  assert.equal(ally.userData.accent.visible,false);
  assert.equal(view.effects.filter(e=>e.kind==='waterStep'&&!e.ruto).length,1);
  view.companionPose(ally,{...state,x:0,z:0},run);
  assert.equal(ally.userData.sprite.material.clippingPlanes,null);
});
test('a swimmer spawn under reduced motion has surface marks without vertical droplets',()=>{
  const {view,run}=viewOf('ruto',Terrain.ZORA_REALM,true);
  at(run,23,-29);view.render(run,.05,run.time);
  const ripple=view.effects.find(e=>e.kind==='waterStep');
  assert.equal(ripple.drops.length,0);
  assert.ok(ripple.foam.some(e=>e.tile.visible));
  let disposed=0;ripple.materials.forEach(m=>m.addEventListener('dispose',()=>disposed++));
  view.clearDynamic();
  assert.equal(disposed,2);
  assert.equal(ripple.mesh.parent,null);
});

test('Ruto uses surface swim frames only while moving against water, returning to land, jump and dry bridge poses',()=>{
  const {view,run}=viewOf('ruto');
  at(run,23,-29);view.render(run,.05,run.time);
  const sample=run.waterAt(23,-29);
  assert.match(view.heroSprite.material.map.name,/^hero:ruto:\d:0:swim$/);
  assert.ok(Math.abs(view.heroSprite.getWorldPosition(new THREE.Vector3()).y-sample.surface)<1e-8);
  assert.ok(view.heroSprite.center.y>.30);
  run.time+=.12;view.render(run,.05,run.time);
  const stroke=view.heroSprite.userData.rutoStroke;
  assert.match(view.heroSprite.material.map.name,/:1:swim$/);
  view.render(run,.05,run.time);
  assert.match(view.heroSprite.material.map.name,/:1:swim$/,'the swim frame does not advance while simulation time is fixed');
  view.yaw=-2.3;view.pitch=1.01;run.time+=.19;view.render(run,.05,run.time);
  assert.strictEqual(view.heroSprite.userData.rutoStroke,stroke,'changing camera heading does not reset phase');
  assert.match(view.heroSprite.material.map.name,/:4:swim$/);
  at(run,23,-29,1.2);view.render(run,.05,run.time);
  assert.match(view.heroSprite.material.map.name,/:jump$/);
  assert.equal(view.heroSprite.material.clippingPlanes,null);
  assert.equal(view.heroSprite.userData.rutoStroke,null);
  at(run,23,-29);view.render(run,.05,run.time);
  assert.match(view.heroSprite.material.map.name,/:0:swim$/);
  const {view:forest,run:kokiri}=viewOf('ruto',Terrain.KOKIRI_REALM);
  at(kokiri,-22.9,16.4);forest.render(kokiri,.05,kokiri.time);
  assert.match(forest.heroSprite.material.map.name,/:swim$/);
  at(kokiri,-16,Terrain.VILLAGE.bridge.z);forest.render(kokiri,.05,kokiri.time);
  assert.match(forest.heroSprite.material.map.name,/:walk$/);
  assert.equal(forest.heroSprite.material.clippingPlanes,null);
  assert.equal(forest.heroSprite.center.y,forest.standingFootAnchor('ruto'));
});

test('Ruto treads in place with quiet surface rings and retains authored attacks in water',()=>{
  const {view,run}=viewOf('ruto');
  at(run,23,-29);run.player.action='idle';view.render(run,.05,run.time);
  assert.match(view.heroSprite.material.map.name,/:0:tread$/);
  assert.ok(view.effects.some(e=>e.kind==='waterStep'&&!e.ruto&&!e.drops.length));
  run.time+=.27;view.render(run,.05,run.time);
  assert.match(view.heroSprite.material.map.name,/:1:tread$/);
  Object.assign(run.player,{action:'cast',actionTime:.2,actionAge:.1,attackKind:'rutoWave'});view.render(run,.05,run.time);
  assert.match(view.heroSprite.material.map.name,/:cast$/);
  assert.ok(view.heroSprite.material.clippingPlanes.length===1);
  assert.equal(view.heroSprite.userData.rutoStroke,null);
});

test('recruited Ruto uses the same swim, tread, cast and dry-art rules, even with reduced motion',()=>{
  const {view,run}=viewOf('link',Terrain.ZORA_REALM,true);
  const ally=view.companionModel({hero:'ruto'}),sprite=ally.userData.sprite;
  const entry={hero:'ruto',x:23,z:-29,facing:1.4,action:'walk',actionAge:.55};
  view.companionPose(ally,entry,run);
  assert.match(sprite.material.map.name,/:0:swim$/);
  assert.ok(Math.abs(sprite.getWorldPosition(new THREE.Vector3()).y-run.waterAt(23,-29).surface)<1e-8);
  run.time+=.1;view.companionPose(ally,entry,run);
  assert.match(sprite.material.map.name,/:1:swim$/);
  assert.ok(ally.userData.pip.position.y<1.9,'marker follows her lower swim silhouette');
  view.companionPose(ally,{...entry,action:'idle'},run);
  assert.match(sprite.material.map.name,/:tread$/);
  view.companionPose(ally,{...entry,action:'cast',actionTime:.1,attackKind:'rutoWave'},run);
  assert.match(sprite.material.map.name,/:cast$/);
  view.companionPose(ally,{...entry,x:0,z:0},run);
  assert.match(sprite.material.map.name,/:walk$/);
  assert.equal(sprite.material.clippingPlanes,null);
  assert.equal(sprite.center.y,view.standingFootAnchor('ruto'));
});
