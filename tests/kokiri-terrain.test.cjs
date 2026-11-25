const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const THREE = require('../vendor/three.min.js');
const { Game, Terrain, REALMS, GUARDIAN_LANDMARKS, ARENA_LIMIT, seeded, clamp } = require('../core.js');

test('Link can glide from a real Kokiri ledge and dash, but neither crosses a wall',()=>{
  const g=new Game('link',3,{mode:'adventure'});
  g.realmStages[6]=3;g.spawnTimer=999;
  const terrace=Terrain.layout(6,3).terraces.filter(t=>t.x>30).sort((a,b)=>b.height-a.height)[0];
  const p=g.player,limit=Terrain.KOKIRI_WALL_INNER-p.radius;
  Object.assign(p,{x:terrace.x,z:terrace.z,ground:g.groundAt(terrace.x,terrace.z)});
  assert.ok(p.ground>=3);
  assert.equal(g.jump(),true);
  let reached=false;
  for(let i=0;i<140;i++){
    g.step(.02,{x:1,y:0,glide:true,cameraYaw:0});
    assert.ok(p.x<=limit+1e-9);
    if(Math.abs(p.x-limit)<1e-8&&!reached){
      reached=true;
      assert.equal(p.gliding,true);
      assert.ok(p.y>1.1);
      g.dash();
    }
  }
  assert.equal(reached,true);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const move=Terrain.resolve(6,3,sx*(limit-1),sz*(limit-1),sx*(limit+10),sz*(limit+10),100,p.radius);
    assert.ok(Math.abs(move.x)<=limit&&Math.abs(move.z)<=limit);
  }
  assert.equal(Terrain.resolve(0,1,63,12,80,12,10).x,80,'other realms now extend past the original limits');
});

test('the Deku throat admits the player down the center, but neither direction cuts a root-bank corner',()=>{
  const {halfWidth,openingZ,limit}=Terrain.DEKU_ENTRANCE,radius=.52;
  const center=Terrain.resolveDekuEntrance(0,18,0,8,radius);
  assert.ok(center.z<openingZ);
  const inward=Terrain.resolveDekuEntrance(0,18,13,13,radius);
  assert.ok(inward.x<=halfWidth-radius+1e-8&&inward.z>openingZ);
  const reverse=Terrain.resolveDekuEntrance(12,7,12,20,radius);
  assert.ok(reverse.z<=openingZ-radius+1e-8);
  const side=Terrain.resolveDekuEntrance(-12,4,-80,20,radius);
  assert.ok(Math.abs(side.x)<=limit-radius&&side.z<=openingZ-radius);
});

const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
const scope={
  THREE,Terrain,REALMS,GUARDIAN_LANDMARKS,ARENA_LIMIT,seeded,clamp,
  storage:{graphics:'balanced'},reducedMotion:false,
  innerWidth:1280,innerHeight:720,
  BonkKokiriFloor:{bounds:require('../kokiri-pixel-floor.js').bounds,paint:(_t,stage,kind)=>({width:kind==='outdoor'?840:448,height:kind==='outdoor'?840:448,stage})},
  BonkKokiriOrbitScene:require('../kokiri-orbit-scene.js'),
  BonkDekuTree:require('../kokiri-deku-tree.js'),
  BonkKokiriVillage:require('../kokiri-village-structures.js'),
  BonkKokiriEntrances:require('../kokiri-entrance-structures.js'),
  document:{createElement:()=>({getContext:()=>({fillRect(){}})})},
  BonkKokiriArt:{paint:(kind,variant)=>({kind,variant,width:32,height:32})},
  RelicArt:{terrain:()=>new THREE.Texture(),groundOverlay:()=>new THREE.Texture(),
    surfaceTexture:()=>new THREE.Texture(),material:()=>({map:new THREE.Texture()}),
    sprite:()=>new THREE.Sprite(),canvas:()=>({width:64,height:64})}
};
const WorldView=vm.runInNewContext(source.slice(source.indexOf('  class WorldView'),source.indexOf('  function currentDialog'))+'\nWorldView',scope);
function makeView(){
  const view=Object.create(WorldView.prototype);
  view.scene=new THREE.Scene();view.scene.background=new THREE.Color();view.scene.fog=new THREE.Fog('#ffffff',0,150);
  view.camera=new THREE.PerspectiveCamera(50);view.cameraTarget=new THREE.Vector3();
  view.yaw=0;view.pitch=.78;view.distance=30;
  view.geometries={sphere:new THREE.IcosahedronGeometry(1,1),lowSphere:new THREE.IcosahedronGeometry(1,0),
    box:new THREE.BoxGeometry(),cone:new THREE.ConeGeometry(1,1,6),cylinder:new THREE.CylinderGeometry(1,1,1,8),
    disc:new THREE.CircleGeometry(1,20),diamond:new THREE.OctahedronGeometry(),torus:new THREE.TorusGeometry(1,.09,5,24)};
  view.materials=new Map();view.environment=new THREE.Group();view.scene.add(view.environment);
  view.ambient=new THREE.HemisphereLight();view.sun=new THREE.DirectionalLight();
  view.dummy=new THREE.Object3D();view.windClock={value:0};view.windStrength={value:1};
  return view;
}
test('Link walks over the raised village bridge on all three rounds without jumping or gliding',()=>{
  const {bridge}=Terrain.VILLAGE;
  for(const stage of [1,2,3]){
    const g=new Game('link',101,{mode:'adventure'});g.realmStages[6]=stage;g.spawnTimer=999;
    const p=g.player;
    Object.assign(p,{x:bridge.x1,z:bridge.z,y:0,ground:g.groundAt(bridge.x1,bridge.z)});
    const base=(x,z)=>Terrain.height(6,stage,x,z,true);
    let extra=0;
    for(let i=0;i<145;i++){
      g.step(.02,{x:-1,y:0,cameraYaw:0});
      assert.ok(Math.abs(p.z-bridge.z)<.03,p.z);
      assert.ok(p.y<.12&& !p.gliding);
      extra=Math.max(extra,p.ground-base(p.x,p.z));
    }
    assert.ok(p.x<=bridge.x0,'walked off the opposite ramp');
    assert.ok(extra>.55,'the bridge raised the hero above the creek floor');
  }
});

test('stump buildings have matching physical footprints and open approach routes',()=>{
  const {homes,bridge}=Terrain.VILLAGE,r=.52;
  for(const stage of [1,2,3]){
    for(const h of homes){
      const [dx,dz]=[Math.sin(h.turn),Math.cos(h.turn)];
      const start={x:h.x+dx*(h.radius+1.5),z:h.z+dz*(h.radius+1.5)};
      const here=Terrain.resolve(6,stage,start.x,start.z,h.x,h.z,0,r);
      assert.ok(Math.hypot(here.x-h.x,here.z-h.z)>=h.radius+r-1e-7,h.role);
    }
    assert.equal(Terrain.layout(6,stage).obstacles.filter(o=>o.kind==='home').length,homes.length);
    assert.ok(!Terrain.layout(6,stage).obstacles.some(o=>o.x>bridge.x0&&o.x<bridge.x1&&Math.abs(o.z-bridge.z)<=bridge.halfWidth+o.radius));
  }
});

test('the village trail ends at the doorway before the inner root tunnel; no jump can trigger it early',()=>{
  const g=new Game('link',84,{mode:'adventure',reviewMapClears:true});
  const {DEKU_APPROACH,DEKU_PORTAL}=Terrain;
  Object.assign(g.player,{x:DEKU_PORTAL.x,z:DEKU_PORTAL.z,ground:g.groundAt(DEKU_PORTAL.x,DEKU_PORTAL.z)});
  g.spawnTimer=999;
  g.step(.02);
  assert.equal(g.landmark,null);
  g.realmStages[6]=3;g.stageKills[6]=g.stageTarget;
  Object.assign(g.player,{x:DEKU_PORTAL.x,z:DEKU_PORTAL.z,ground:g.groundAt(DEKU_PORTAL.x,DEKU_PORTAL.z),y:3,vy:0});
  g.step(.02,{glide:true,cameraYaw:0});
  assert.ok(g.dekuTrailReady);assert.equal(g.landmark,null);
  // Reload the actual checkpoint format; progression is still gated but the safe walk starts in the village.
  const resumed=Game.fromCheckpoint(JSON.parse(JSON.stringify(g.checkpoint())));
  assert.equal(resumed.landmark,null);assert.ok(resumed.dekuTrailReady);
  for(let i=0;i<60;i++)resumed.step(.02);
  assert.equal(resumed.landmark,null);
  for(const point of DEKU_APPROACH)for(let i=0;i<210&&!resumed.landmark;i++){
    const p=resumed.player,dx=point[0]-p.x,dz=point[1]-p.z,dist=Math.hypot(dx,dz);
    if(dist<.13)break;
    resumed.step(.02,{x:dx/dist,y:-dz/dist,cameraYaw:0});
    assert.ok(resumed.player.y<.16,'Link can walk without jumping');
  }
  assert.ok(resumed.landmarkApproach);
  assert.equal(resumed.boss,null,'the outside door is not the Gohma trigger');
  for(let i=0;i<160&&!resumed.boss;i++)resumed.step(.02,{x:0,y:1,cameraYaw:0});
  assert.equal(resumed.boss?.bossId,'gohma');
});

test('Kokiri keeps original pixel sprites with perspective, painted ground, and raised walls in all three rounds',()=>{
  const view=makeView(),orbit=view.camera;
  const textures=[];
  for(const stage of [1,2,3]){
    view.buildRealm(6,stage);
    assert.equal(view.camera,orbit);assert.equal(view.camera.isPerspectiveCamera,true);
    const floor=view.environment.getObjectByName('kokiri-2d-floor:outdoor');
    assert.equal(floor.material.type,'MeshBasicMaterial');
    assert.equal(floor.material.map.minFilter,THREE.NearestFilter);
    assert.ok(view.kokiriWalls.length>0);
    assert.ok(view.environment.children.filter(o=>o.isSprite).length>90);
    for(const house of Terrain.VILLAGE.homes){
      const visual=view.environment.getObjectByName('kokiri-home-'+house.role);
      assert.equal(visual.isGroup,true);
      assert.ok(visual.children.every(child=>child.isMesh&&child.material.map.magFilter===THREE.NearestFilter));
      assert.equal(visual.position.x,house.x);assert.equal(visual.position.z,house.z);
      assert.equal(visual.position.y,Terrain.height(6,stage,house.x,house.z));
    }
    textures.push(floor.material.map);
  }
  assert.equal(new Set(textures).size,3,'the 2D floor still reflects each round');
  const old=view.environment.getObjectByName('kokiri-2d-floor:outdoor');let disposed=false;
  old.geometry.addEventListener('dispose',()=>{disposed=true;});
  view.buildRealm(0,2);
  assert.equal(disposed,true);
  assert.equal(view.camera,orbit);
  assert.equal(view.kokiriPixel,false);
  assert.equal(view.kokiriSprites.length,0);
});

test('pixel map foot anchors and bridge board align with the simulation heights',()=>{
  const view=makeView(),stage=3;view.buildRealm(6,stage);view.environment.updateMatrixWorld(true);
  const floor=view.environment.getObjectByName('kokiri-2d-floor:outdoor');
  const bridge=Terrain.VILLAGE.bridge;
  for(const [x,z] of [[-16,bridge.z],[bridge.x0,bridge.z],Terrain.DEKU_APPROACH[7],[63,8],[-64,-32]]){
    const hits=new THREE.Raycaster(new THREE.Vector3(x,40,z),new THREE.Vector3(0,-1,0)).intersectObject(floor);
    assert.ok(hits.length);
    assert.ok(Math.abs(hits[0].point.y-Terrain.height(6,stage,x,z)+.037)<.002);
  }
  for(const name of ['kokiri-open-bark-door','kokiri-closed-bark-door']){
    const {x,y,z}=view.environment.getObjectByName(name).position;
    assert.equal(x,Terrain.DEKU_PORTAL.x);assert.equal(z,Terrain.DEKU_PORTAL.z);
    assert.equal(y,Terrain.height(6,stage,x,z));
  }
  assert.equal(view.kokiriOpenGate.visible,false);
  for(const tree of view.environment.children.filter(o=>o.name.startsWith('kokiri-pixel:tree:')))
    assert.equal(tree.position.y,view.groundHeight(tree.position.x,tree.position.z),'all tree feet touch ground');
});

test('inside Gohma’s landmark the root sprites bracket the corridor without occupying its center',()=>{
  const view=makeView();view.buildRealm(6,3);view.buildLandmark(6,3,GUARDIAN_LANDMARKS[6]);
  const {halfWidth,openingZ}=Terrain.DEKU_ENTRANCE;
  const floor=view.environment.getObjectByName('kokiri-2d-floor:deku-arena');
  assert.ok(floor);assert.equal(view.camera.isPerspectiveCamera,true);
  assert.ok(view.kokiriWalls.length>0);
  const scenery=view.environment.children.filter(o=>o.isSprite);
  const rootBanks=scenery.filter(o=>o.name.startsWith('kokiri-pixel:root:')&&o.position.z>=openingZ);
  assert.equal(rootBanks.length,6);
  assert.ok(rootBanks.every(o=>Math.abs(o.position.x)-o.scale.x/2>=halfWidth));
  assert.equal(view.kokiriGate,null);
});

test('camera orbits the same world-anchored coordinates with real perspective and wheel distance',()=>{
  const view=makeView();view.buildRealm(6,1);
  const focus={x:-5,z:4},ground=view.groundHeight(focus.x,focus.z);
  const point=new THREE.Vector3(focus.x+4,ground+.4,focus.z);
  const projectAt=(yaw,pitch=.78)=>{
    view.yaw=yaw;view.pitch=pitch;
    view.updateOrbitCamera(focus,ground,.016,0,null,true);
    return point.clone().project(view.camera);
  };
  const front=projectAt(0),back=projectAt(Math.PI);
  assert.ok(front.x>.1);assert.ok(back.x<-.1);
  assert.ok(Math.abs(view.headingToCamera(focus.x,focus.z)-Math.PI)<1e-9);
  assert.ok(Math.abs(projectAt(Math.PI/2,.88).y-projectAt(Math.PI/2,.35).y)>.04);
  view.distance=50;
  assert.ok(projectAt(0).x<front.x);
  assert.ok(Math.abs(view.cameraTarget.x-focus.x)<1e-9);
});

test('foreground vegetation becomes translucent only while it blocks the hero',()=>{
  const view=makeView();view.buildRealm(6,1);
  const tree=view.kokiriSprites.find(o=>o.sprite.name.startsWith('kokiri-pixel:tree:'));
  const {x,y,z}=tree.sprite.position;
  view.hero=new THREE.Group();view.hero.position.set(x,y,z-2);
  view.updateOrbitCamera({x,z:z-2},y,.016,0,null,true);
  view.updateKokiriSprites();
  assert.equal(tree.sprite.material,tree.fade);
  view.hero.position.set(x,y,z+2);
  view.updateOrbitCamera({x,z:z+2},y,.016,0,null,true);
  view.updateKokiriSprites();
  assert.equal(tree.sprite.material,tree.solid);
  view.yaw=Math.PI;
  view.updateOrbitCamera({x,z:z+2},y,.016,0,null,true);
  view.updateKokiriSprites();
  assert.equal(tree.sprite.material,tree.fade,'rotating behind reverses which canopy is foreground');
});
