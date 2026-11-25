const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,ADVENTURE_ROUTE,COMPANION_BY_REALM}=require('../core.js');
const {Profile}=require('../profile.js');

const adventure=(hero='link')=>new Game(hero,118,{mode:'adventure',reviewMapClears:true,flatTerrain:true});
function ready(g){
  for(let i=0;i<90&&g.state!=='map-clear';i++){
    if(g.state==='upgrade')g.choose(g.choices[0].id);
    else g.step(.05);
  }
  assert.equal(g.state,'map-clear');
}

test('Gohma brings Saria immediately into the current run and onward to Zora’s Fountain',()=>{
  const g=adventure(),profile=new Profile();
  assert.deepEqual(g.companions,[]);
  assert.equal(profile.unlocked.includes('saria'),false);
  g.realmStages[g.realm]=3;g.stageKills[g.realm]=24;assert.equal(g.challengeGuardian(),true);
  assert.deepEqual(g.companions,[]);
  for(let i=0;i<50&&!g.boss;i++)g.step(.05,{x:0,y:1,cameraYaw:0});
  assert.equal(g.boss?.bossId,'gohma');
  g.hurtEnemy(g.boss,1e6);ready(g);
  const events=g.drainEvents();
  assert.deepEqual(events.filter(event=>event.type==='companionJoin').map(event=>event.hero),['saria']);
  for(const event of events)if(event.type==='guardian')profile.recordGuardian(event.id);
  assert.equal(profile.unlocked.includes('saria'),true);
  assert.equal(g.mapResult.companion,'saria');
  assert.deepEqual(g.companions.map(ally=>ally.hero),['saria']);
  assert.equal(g.continueAfterMap(),true);
  assert.equal(g.realm,7);
  assert.deepEqual(g.companions.map(ally=>ally.hero),['saria']);
  assert.ok(Math.hypot(g.companions[0].x-g.player.x,g.companions[0].z-g.player.z)<8);
});

test('every map has a recruit, restored from the seals in route order with no duplicate or self clone',()=>{
  const g=adventure('saria');
  assert.deepEqual(ADVENTURE_ROUTE.map(r=>COMPANION_BY_REALM[r]),['saria','ruto','nabooru','tetra','impa','sheik','darunia','skullkid']);
  // Unordered legacy saves still produce a stable party order.
  for(const realm of [...ADVENTURE_ROUTE].reverse())g.activateShrine(realm);
  assert.equal(g.activateShrine(6),false);assert.equal(g.companions.length,7);
  const restored=Game.fromCheckpoint(g.checkpoint());
  assert.deepEqual(restored.companions.map(ally=>ally.hero),['ruto','nabooru','tetra','impa','sheik','darunia','skullkid']);
});

test('moving allies take turns on one attack cooldown and their damage can be saved and restored',()=>{
  const g=adventure();
  g.activateShrine(6);g.activateShrine(7);g.realm=0;g.visited.add(0);g.ranks={};g.spawnTimer=100;
  g.enemies=[];g.drainEvents();
  const target=g.spawnEnemy('slime',3,2);target.speed=0;target.damage=0;target.hp=target.maxHp=200;
  for(let frame=0;frame<38;frame++)g.step(.05);
  const first=g.drainEvents().filter(e=>e.type==='companionStrike');
  assert.equal(first.length,1);assert.equal(first[0].hero,'saria');
  assert.ok(target.hp<200);
  for(let frame=0;frame<28;frame++)g.step(.05);
  const second=g.drainEvents().filter(e=>e.type==='companionStrike');
  assert.equal(second.length,1);assert.equal(second[0].hero,'ruto');
  assert.ok(g.damageBySource.companion>10);
  assert.equal(Game.fromCheckpoint(g.checkpoint()).damageBySource.companion,g.damageBySource.companion);
  const ally=g.companions[0],oldX=ally.x;g.player.x=7;
  for(let frame=0;frame<28;frame++)g.step(.05);
  assert.ok(ally.x>oldX+2);
});

test('Training, Survival and accounts do not run solo companion AI',()=>{
  for(const mode of ['training','survival']){
    const g=new Game('link',118,{mode,reviewMapClears:true});
    g.activateShrine(6);
    assert.deepEqual(g.companions,[]);
    assert.ok(!g.drainEvents().some(event=>event.type==='companionJoin'));
  }
  const p=adventure();p.player.accountId='room-member';p.activateShrine(6);
  assert.deepEqual(p.companions,[]);
});
