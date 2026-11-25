const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const THREE=require('../vendor/three.min.js');
const {Game,HEROES,Terrain,REALMS,ADVENTURE_ROUTE,GUARDIAN_LANDMARKS,ARENA_LIMIT,seeded,clamp}=require('../core.js');
const {Profile}=require('../profile.js');
const {ZORA_REALM:ZORA,ZORA_FOUNTAIN:fountain}=Terrain;

test('old map slot and guardian unlock survive the Zora’s Fountain replacement',()=>{
  assert.equal(ZORA,7);
  assert.equal(ADVENTURE_ROUTE[1],ZORA);
  assert.equal(REALMS[ZORA].id,'lake');
  assert.equal(REALMS[ZORA].name,'Zora’s Fountain');
  assert.equal(REALMS[ZORA].landmark,'Lord Jabu-Jabu');
  assert.equal(REALMS[ZORA].boss,'morpha');
  const oldGuardianSave=new Profile({guardians:['morpha']});
  assert.ok(Profile.import(JSON.stringify(oldGuardianSave)).unlocked.includes('ruto'));
  const raw=new Game('link',24,{mode:'adventure',reviewMapClears:true}).checkpoint();
  const oldRun=Game.fromCheckpoint({...raw,realm:7,visited:[6,7],shrines:[6],realmStages:[1,1,1,1,1,1,3,2],stageKills:[0,0,0,0,0,0,24,11]});
  assert.equal(oldRun.realm,ZORA);
  assert.equal(oldRun.stageLabel,'2-2');
  assert.equal(oldRun.stageKills[ZORA],11);
  assert.deepEqual(oldRun.companions.map(x=>x.hero),['saria']);
});

test('the adventure enters each Fountain wave, then still clears Water Temple with Ruto',()=>{
  const game=new Game('link',12,{mode:'adventure',reviewMapClears:true});
  game.activateShrine(6);
  assert.equal(game.enterRealm(ZORA),true);
  assert.equal(game.stageLabel,'2-1');
  for(const stage of [1,2,3]){
    assert.equal(game.stage,stage);
    assert.equal(game.challengeGuardian(),false);
    game.stageKills[ZORA]=game.stageTarget;
    if(stage!==3)assert.equal(game.advanceStage(),true);
  }
  assert.equal(game.challengeGuardian(),true);
  assert.equal(game.landmark.name,'Water Temple');
  assert.equal(game.boss.bossId,HEROES.ruto.unlockBoss);
  assert.ok(game.hurtEnemy(game.boss,1e6)>0);
  for(let i=0;i<80&&game.state!=='map-clear';i++){
    if(game.state==='upgrade')game.choose(game.choices[0].id);
    else game.step(.05);
  }
  assert.equal(game.state,'map-clear');
  assert.equal(game.mapResult.companion,'ruto');
  assert.ok(game.companions.some(c=>c.hero==='ruto'));
  assert.equal(game.mapResult.nextRealm,0);
});

test('three Fountain stages maintain dry causeway, wadeable pool, and physical Jabu landmark',()=>{
  for(const stage of [1,2,3]){
    const g=new Game('link',4,{mode:'survival',realm:ZORA});g.realmStages[ZORA]=stage;g.spawnTimer=1000;
    const p=g.player;const {jabu,basin,falls}=fountain;
    assert.ok(Terrain.height(ZORA,stage,21,-30)<basin.level-.2);
    for(const [x,z] of falls)assert.ok(Terrain.height(ZORA,stage,x,z-1)<basin.level,'fall meets its plunge pool');
    for(let i=0;i<11;i++)g.step(.05,{x:1,cameraYaw:0});
    for(let i=0;i<58;i++){
      const x=Math.min(5,Math.max(3,(-p.z-5)/45*jabu.x));
      g.step(.05,{x:Math.min(1,Math.max(-1,(x-p.x)*2)),y:1,cameraYaw:0});
      assert.ok(p.ground>basin.level,'dry causeway');
    }
    assert.ok(p.z<-13,'shrine can be passed');
    Object.assign(p,{x:jabu.x,z:jabu.z+11,ground:g.groundAt(jabu.x,jabu.z+11)});
    for(let i=0;i<50;i++)g.step(.05,{y:1,cameraYaw:0});
    assert.ok(Math.hypot(p.x-jabu.x,p.z-jabu.z)>=jabu.radius+p.radius-1e-6);
    Object.assign(p,{x:17,z:-30,ground:g.groundAt(17,-30)});
    for(let i=0;i<30;i++)g.step(.05,{x:1,cameraYaw:0});
    assert.ok(p.x>24&&p.ground<basin.level,'pool is walkable, not a hidden wall');
  }
});

const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const world=source.slice(source.indexOf('  class WorldView'),source.indexOf('  function currentDialog'))+'\nWorldView';
function renderer(reducedMotion=false){
  const inks=new Map();
  const canvas=()=>{const ctx={fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},bezierCurveTo(){},stroke(){},save(){},restore(){},translate(){},rotate(){}};
    return {width:64,height:64,getContext:()=>ctx};};
  const window={},document={createElement:()=>canvas()};
  const scope={THREE,Terrain,BonkTerrain:Terrain,REALMS,GUARDIAN_LANDMARKS,ARENA_LIMIT,seeded,clamp,window,document,reducedMotion,storage:{graphics:'balanced'}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../art.js'),'utf8'),scope);
  const original=window.RelicArt;
  scope.RelicArt={...original,surfaceTexture:(kind,realm)=>{
    const map=original.surfaceTexture(kind,realm);inks.set(kind,map);return map;
  },material:()=>({map:new THREE.Texture()}),sprite:()=>new THREE.Sprite()};
  const V=vm.runInNewContext(world,scope),v=Object.create(V.prototype);
  Object.assign(v,{scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(45),materials:new Map(),environment:new THREE.Group(),ambient:new THREE.HemisphereLight(),sun:new THREE.DirectionalLight(),dummy:new THREE.Object3D(),windClock:{value:0},windStrength:{value:1}});
  Object.assign(v.scene,{background:new THREE.Color(),fog:new THREE.Fog('#ffffff',0,150)});
  Object.assign(v,{geometries:{sphere:new THREE.IcosahedronGeometry(1,1),lowSphere:new THREE.IcosahedronGeometry(1,0),box:new THREE.BoxGeometry(),cone:new THREE.ConeGeometry(1,1,6),cylinder:new THREE.CylinderGeometry(1,1,1,8),disc:new THREE.CircleGeometry(1,20),diamond:new THREE.OctahedronGeometry(),torus:new THREE.TorusGeometry(1,.09,5,24)}});
  v.scene.add(v.environment);
  return {v,inks};
}
test('WorldView renders true 3D, nearest-pixel Zora structures only in that outdoor realm',()=>{
  const {v,inks}=renderer();
  v.buildRealm(ZORA,1);
  v.environment.updateMatrixWorld(true);
  const park=v.environment.getObjectByName('zora-fountain');
  assert.ok(park?.isGroup);
  assert.ok(park.getObjectByName('lord-jabu-jabu').children.length>10);
  assert.equal(park.children.filter(c=>c.name==='zora-waterfall').length,fountain.falls.length);
  const surface=park.getObjectByName('zora-spring-surface');
  assert.ok(Math.abs(new THREE.Box3().setFromObject(surface).max.y-fountain.basin.level)<1e-7);
  for(const type of ['spring-stone','spring-water','spring-falls','jabu-skin']){
    assert.equal(inks.get(type).magFilter,THREE.NearestFilter);
    assert.equal(inks.get(type).minFilter,THREE.NearestFilter);
  }
  const jabu=park.getObjectByName('lord-jabu-jabu');
  for(const side of [-1,1]){
    const ray=new THREE.Raycaster(new THREE.Vector3(fountain.jabu.x,4,fountain.jabu.z+side*20),new THREE.Vector3(0,0,-side));
    assert.ok(ray.intersectObject(jabu,true).length>0,'body visible from both sides');
  }
  v.buildLandmark(ZORA,3,GUARDIAN_LANDMARKS[ZORA]);
  assert.equal(v.environment.getObjectByName('zora-fountain'),undefined);
  v.buildRealm(1,1);
  assert.equal(v.environment.getObjectByName('lord-jabu-jabu'),undefined);
});

test('reference Jabu has world-fixed facial relief, sapphire crown and rear silhouette',()=>{
  const {v,inks}=renderer();
  v.buildRealm(ZORA,2);
  v.environment.updateMatrixWorld(true);
  const fish=v.environment.getObjectByName('lord-jabu-jabu');
  assert.ok(fish?.isGroup);
  assert.equal(fish.position.x,fountain.jabu.x);
  assert.equal(fish.position.z,fountain.jabu.z);
  assert.equal(fish.rotation.y,fountain.jabu.turn);
  const children=(name)=>fish.children.filter(o=>o.name==='jabu-'+name);
  assert.equal(children('blue-eye').length,2);
  assert.equal(children('crown-sapphire').length,8);
  assert.equal(children('pectoral-fin').length,2);
  assert.equal(children('tail-fluke').length,2);
  assert.ok(children('lower-jaw').length&&children('dark-mouth-seam').length);
  for(const kind of ['jabu-skin','jabu-back','jabu-fin','jabu-gold','jabu-ribbon']){
    const ink=inks.get(kind);
    assert.ok(ink);
    assert.equal(ink.magFilter,THREE.NearestFilter);
    assert.equal(ink.minFilter,THREE.NearestFilter);
  }
  const [body]=children('body');
  assert.ok(body.isMesh&&body.geometry.groups.length===3);
  const altar=fish.getObjectByName('zora-jabu-altar');
  assert.ok(new THREE.Box3().setFromObject(body).min.y<=new THREE.Box3().setFromObject(altar).max.y,
    'belly meets the old plinth instead of floating above it');
  const cast=(origin,target)=>{
    const worldTarget=fish.localToWorld(new THREE.Vector3(...target));
    const worldOrigin=fish.localToWorld(new THREE.Vector3(...origin));
    return new THREE.Raycaster(worldOrigin,worldTarget.sub(worldOrigin).normalize()).intersectObject(fish,true);
  };
  const [gem]=children('crown-center-sapphire');
  assert.ok(cast([0,7,19],gem.position.toArray()).slice(0,3).some(h=>h.object===gem),
    'crown jewel is exposed from the road');
  for(const eye of children('blue-eye')){
    const [x,y,z]=eye.position.toArray(),s=Math.sign(x);
    assert.ok(cast([s*12,6.8,15],[x,y,z]).slice(0,3).some(h=>h.object===eye),
      'both blue eyes are exposed when viewed diagonally from their respective sides');
  }
  assert.ok(cast([0,4.5,-22],[0,4.5,0]).some(h=>h.object===body),'the back is a visible volume');
  assert.ok(fish.children.every(o=>o.isMesh),'the landmark does not billboard during the pan');
});
