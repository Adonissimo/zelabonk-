const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {Game,REALMS,Terrain,ARENA_LIMIT,GUARDIAN_LANDMARKS}=require('../core.js');
const {PartyGame}=require('../backend/party.cjs');
const floor=require('../kokiri-pixel-floor.js');

test('the same movement simulation reaches new terrain in all eight outdoor realms, not just a wider camera view',()=>{
  assert.equal(ARENA_LIMIT,92);
  assert.ok((ARENA_LIMIT/64)**2>2);
  for(let realm=0;realm<REALMS.length;realm++){
    const game=new Game('link',33,{mode:'training',realm});
    const p=game.player;
    Object.assign(p,{x:-81,z:-12,ground:game.groundAt(-81,-12)});
    for(let i=0;i<80;i++)game.step(.04,{x:-1,y:0,cameraYaw:0});
    assert.equal(game.arenaLimit,ARENA_LIMIT,REALMS[realm].name);
    assert.equal(p.x,-ARENA_LIMIT+p.radius,REALMS[realm].name);
    assert.equal(p.ground,game.groundAt(p.x,p.z));
    assert.ok(Terrain.layout(realm,1).obstacles.some(o=>Math.max(Math.abs(o.x),Math.abs(o.z))>70));
  }
  const outdoor=floor.bounds('outdoor');
  assert.ok(outdoor.x1>ARENA_LIMIT&&outdoor.x0<-ARENA_LIMIT);
  assert.ok(outdoor.z1>ARENA_LIMIT&&outdoor.z0<-ARENA_LIMIT);
});

test('outer trails are continuously walkable in all realm and wave combinations',()=>{
  for(let realm=0;realm<REALMS.length;realm++)for(let stage=1;stage<=3;stage++)for(const points of Terrain.OUTER_TRAILS){
    let [x,z]=points[0],ground=Terrain.height(realm,stage,x,z),altitude=0;
    for(const [tx,tz] of points.slice(1)){
      for(let i=0;i<440;i++){
        const d=Math.hypot(tx-x,tz-z);
        if(d<.19)break;
        const next=Terrain.resolve(realm,stage,x,z,x+(tx-x)/d*.18,z+(tz-z)/d*.18,altitude,.52);
        altitude=Math.max(0,altitude+ground-next.ground);({x,z,ground}=next);
      }
      assert.ok(Math.hypot(x-tx,z-tz)<.23,`${REALMS[realm].name}, stage ${stage}: ${tx},${tz}`);
    }
  }
});

test('larger scenery remains solid where visible, while the entrance and waterside walkway remain usable',()=>{
  for(const [realm,spot] of Terrain.SCENIC_STRUCTURES.entries()){
    if(!spot)continue;
    const start=spot.z+(spot.halfZ??spot.radius)+1;
    const blocked=Terrain.resolve(realm,1,spot.x,start,spot.x,spot.z+.15,0);
    assert.ok(blocked.z>=start-1+.51,spot.id);
    assert.ok(spot.scale>=1.4);
  }
  const {DEKU_PORTAL:door,DEKU_TREE:tree,ZORA_FOUNTAIN:fountain}=Terrain;
  assert.equal(tree.scale,1.32);
  assert.ok(Math.hypot(door.x-tree.x,door.z-tree.z)>tree.radius+.52);
  const b=fountain.cliffs[5];
  const cliff=Terrain.resolve(Terrain.ZORA_REALM,1,b.x,b.z+7,b.x,b.z+4,0);
  assert.ok(cliff.z>=b.z+6.5);
  assert.equal(Terrain.sampleWater(Terrain.ZORA_REALM,1,3,-31),null,'the raised dry passage is unchanged');
  assert.ok(Terrain.sampleWater(Terrain.GREAT_SEA_REALM,1,86,0),'water extends into the newly walkable inlet');
  assert.equal(Terrain.sampleWater(Terrain.GREAT_SEA_REALM,1,93,0),null);
});

test('edge enemies recycle near the player, room snapshots keep wide coordinates, and guardian rooms stay compact',()=>{
  const g=new Game('link',21,{mode:'training',flatTerrain:true});
  g.player.x=87;
  g.spawnEnemy('slime',-70,0).dummy=true; // stationary until recycled
  g.random=()=>0;
  g.step(.02);
  assert.ok(g.enemies[0].x>85&&g.enemies[0].x<=ARENA_LIMIT-1);
  const boss=g.spawnBoss('phantom');
  assert.equal(boss.x,ARENA_LIMIT-4);
  const id=crypto.randomUUID(),g2=new PartyGame(crypto.randomUUID(),[{id,hero:'link'}],{mode:'survival',seed:22,flatTerrain:true});
  g2.player.x=88;g2.inputs.set(id,{x:1,y:0,cameraYaw:0});
  for(let i=0;i<70;i++)g2.step(.04);
  const restored=PartyGame.restore(JSON.parse(JSON.stringify(g2.serialize())));
  assert.equal(restored.publicState(id).players[0].player.x,ARENA_LIMIT-restored.player.radius);
  assert.ok(!restored.publicState(id).landmark);
  const adventure=new Game('link',22,{mode:'adventure',reviewMapClears:true});
  const save=adventure.checkpoint(),resumed=Game.fromCheckpoint(save);
  assert.equal(resumed.realm,save.realm);
  assert.equal(resumed.arenaLimit,ARENA_LIMIT);
  assert.equal(resumed.checkpoint().version,save.version);
  resumed.landmarkActive=true;
  assert.equal(resumed.arenaLimit,GUARDIAN_LANDMARKS[save.realm].limit);
});
