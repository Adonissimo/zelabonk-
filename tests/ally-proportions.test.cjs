const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const THREE=require('../vendor/three.min.js');
const BonkCamera=require('../camera.js');
const core=require('../core.js');
const {Game,ADVENTURE_ROUTE,COMPANION_BY_REALM,HEROES}=core;
const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
const viewSource=app.slice(app.indexOf('  class WorldView'),app.indexOf('  function currentDialog'));

function world(){
  // The same render and sync methods run against actual Three scene graphs; only
  // WebGL output and static terrain creation are substituted in this Node test.
  const art={
    ANIMATIONS:{attack:[6,14],cast:[6,10],ultimate:[8,9]},
    animationFrame:()=>0,
    material(kind,id,dir,frame,hurt,action){
      const mat=new THREE.SpriteMaterial();mat.name=[kind,id,dir,frame,action||'idle'].join(':');return mat;
    },
    sprite(kind,id,w,h){
      const m=new THREE.Sprite(this.material(kind,id,0,0));m.scale.set(w,h,1);m.center.set(.5,0);return m;
    }
  };
  const World=vm.runInNewContext(viewSource+'\nWorldView',{
    ...core,THREE,RelicArt:art,BonkCamera,storage:{graphics:'balanced'},reducedMotion:false,
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
const size=s=>s.scale.toArray();
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} !== ${b}`);

test('all eight recruited allies keep distinct optical scale through saved realm transitions and camera rotation',()=>{
  const v=world();
  const game=new Game('link',120,{mode:'adventure',reviewMapClears:true});
  v.makeHero('link');
  for(const realm of ADVENTURE_ROUTE)game.activateShrine(realm);
  const expected=ADVENTURE_ROUTE.map(i=>COMPANION_BY_REALM[i]);
  const checkpoint=game.checkpoint();
  const models={};
  for(const realm of ADVENTURE_ROUTE){
    const restored=Game.fromCheckpoint({...checkpoint,realm,visited:[...ADVENTURE_ROUTE]});
    v.yaw+=1;
    v.render(restored,.05,restored.time);
    assert.deepEqual([...v.companions.keys()],expected);
    for(const ally of restored.companions){
      const node=v.companions.get(ally.hero),{sprite,pip,accent}=node.userData;
      assert.deepEqual(node.position.toArray(),[ally.x,ally.y,ally.z]);
      if(models[ally.hero]) assert.deepEqual(size(sprite),models[ally.hero]);
      else models[ally.hero]=size(sprite);
      assert.ok(pip.position.y>sprite.position.y+sprite.scale.y);
      assert.ok(accent.visible);
      if(ally.hero==='skullkid')assert.ok(sprite.position.y>.6);
      else assert.equal(sprite.position.y,0);
    }
  }
  assert.equal(new Set(Object.values(models).map(dim=>dim.join(':'))).size,8);
  assert.ok(models.darunia[0]>size(v.heroSprite)[0]*1.28);
  assert.ok(models.darunia[1]>size(v.heroSprite)[1]*1.24);
  assert.ok(models.darunia[1]>models.saria[1]*1.6);
  assert.ok(models.tetra[1]<size(v.heroSprite)[1]);
  assert.ok(models.impa[1]>models.tetra[1]);
});

test('playing an ally uses the same proportions, including idle, attack, and defeat; collision stays unchanged',()=>{
  const v=world();
  for(const id of Object.keys(HEROES)){
    const game=new Game(id,65,{mode:'training',flatTerrain:true});
    v.makeHero(id);v.titlePose(.3);
    const foil=v.companionModel({hero:id}).userData.sprite;
    const expected=size(foil),feet=foil.center.y;
    assert.deepEqual(size(v.heroSprite),expected,id);
    assert.equal(v.heroSprite.center.y,feet);
    v.render(game,.05,.05);
    assert.deepEqual(size(v.heroSprite),expected,id);
    assert.equal(v.heroSprite.center.y,feet);
    assert.equal(v.hero.scale.y,1,'title enlargement must not leak into an active run');
    Object.assign(game.player,{action:'attack',actionTime:.3,actionAge:.18});
    game.time=.18;v.render(game,.05,.18);
    assert.deepEqual(size(v.heroSprite),expected,id);
    assert.match(v.heroSprite.material.name,/attack$/);
    game.state='lost';
    v.render(game,.05,.23);
    assert.deepEqual(size(v.heroSprite),expected,id);
    assert.match(v.heroSprite.material.name,/death$/);
    assert.equal(game.player.radius,.52);
    v.clearDynamic();
  }
});

test('Saria uses the same foot anchor on the rescue and walk; only the follower markers return',()=>{
  const v=world(),sprite=v.companionModel({hero:'saria'});
  const entry={hero:'saria',x:-1,z:2,y:1.5,action:'ultimate',actionAge:1,actionTime:.5,attackKind:'ocarinaSong'};
  const game={time:3,groundAt:()=>0};
  v.companionPose(sprite,{...entry,rescue:true},game);
  const before=size(sprite.userData.sprite);
  assert.equal(sprite.userData.pip.visible,false);assert.equal(sprite.userData.accent.visible,false);
  // 104th resting foot row in the shared 112px atlas should be level with the root.
  approx(sprite.userData.sprite.center.y,(111-104)/112);
  v.companionPose(sprite,{...entry,action:'walk',rescue:false},game);
  assert.equal(sprite.userData.pip.visible,true);assert.equal(sprite.userData.accent.visible,true);
  approx(sprite.position.y,1.5);assert.deepEqual(size(sprite.userData.sprite),before);
});
