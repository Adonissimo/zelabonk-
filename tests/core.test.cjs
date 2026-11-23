const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,REALMS,Terrain,UPGRADES,ARENA_LIMIT}=require('../core.js');
const advance=(g,seconds,input={x:0,y:0})=>{for(let i=0;i<Math.round(seconds/.02);i++){g.step(.02,input);g.drainEvents();}};

test('movement is normalized and stays inside the arena',()=>{
  const a=new Game('link',1),b=new Game('link',1);a.step(.05,{x:1,y:0});b.step(.05,{x:1,y:1});
  assert.ok(Math.abs(Math.hypot(a.player.x,a.player.z)-Math.hypot(b.player.x,b.player.z))<1e-10);
  a.player.x=ARENA_LIMIT;a.player.z=-ARENA_LIMIT;a.step(.05,{x:1,y:0});assert.equal(a.player.x,ARENA_LIMIT);assert.equal(a.player.z,-ARENA_LIMIT);
});
test('pause and upgrade states freeze all simulation clocks',()=>{
  const g=new Game('link',2);g.pause();advance(g,2);assert.equal(g.time,0);g.resume();g.collect(100);assert.equal(g.state,'upgrade');const xp=g.xp;advance(g,3);assert.equal(g.time,0);assert.equal(g.xp,xp);
});
test('XP overflow queues levels without losing experience',()=>{
  const g=new Game('link',2);g.collect(100);let spent=15,levels=1;
  while(g.state==='upgrade'){const before=g.xpNeed;assert.ok(g.choose(g.choices[0].id));levels++;if(g.state==='upgrade')spent+=before;}
  assert.equal(g.level,levels);assert.equal(g.xp,100-spent);assert.ok(g.xp<g.xpNeed);
});
test('upgrade choice validates state and the offered choice',()=>{
  const g=new Game();assert.equal(g.choose('power'),false);g.collect(15);const before={...g.ranks};assert.equal(g.choose('unknown'),false);assert.deepEqual(g.ranks,before);assert.equal(new Set(g.choices.map(x=>x.id)).size,g.choices.length);
});
test('dash has a cooldown and prevents incoming damage',()=>{
  const g=new Game();assert.equal(g.dash(),true);assert.equal(g.dash(),false);g.hurtPlayer(50);assert.equal(g.player.hp,100);assert.ok(g.player.dashCooldown>0);advance(g,.4,{x:1,y:0});assert.ok(Math.hypot(g.player.x,g.player.z)>3);
});
test('an enemy death awards one kill and one shard',()=>{
  const g=new Game(),e=g.spawnEnemy('slime',3,3);g.hurtEnemy(e,999);g.hurtEnemy(e,999);assert.equal(g.kills,1);assert.equal(g.shards.length,1);assert.equal(g.shards[0].value,2);
});
test('leaving shards behind bounds their count while preserving XP',()=>{
  const g=new Game('link',22);for(let i=0;i<500;i++){const e=g.spawnEnemy('slime',i%25,Math.floor(i/25));g.hurtEnemy(e,1e6);g.enemies=[];}assert.equal(g.shards.length,350);assert.equal(g.shards.reduce((n,s)=>n+s.value,0),1000);
});
test('Survival starts on any selected map and persists that choice in a checkpoint',()=>{
 for(const [realm] of REALMS.entries()){
  const g=new Game('link',7,{mode:'survival',realm});
  assert.equal(g.realm,realm);assert.deepEqual([...g.visited],[realm]);
  assert.equal(Game.fromCheckpoint(g.checkpoint()).realm,realm);
 }
 assert.equal(new Game('link',7,{mode:'survival',realm:99}).realm,0);
 assert.equal(new Game('link',7,{mode:'adventure',realm:0}).realm,6);
});
test('scenic trail ends never provide travel interactions in any mode',()=>{
 for(const mode of ['adventure','survival','training'])for(const [realm] of REALMS.entries()){
  const g=new Game('link',7,{mode});g.realm=realm;
  for(const trail of Terrain.SCENIC_TRAILS){
   Object.assign(g.player,trail);
   assert.equal(g.interaction,null);assert.equal(g.interact(),false);assert.equal(g.realm,realm);
  }
 }
});
test('only the next scripted Adventure transition preserves the run and banks shards once',()=>{
 const g=new Game('link',7,{mode:'adventure'});g.time=77;g.ranks.power=2;
 assert.equal(g.enterRealm(7),false);
 g.activateShrine(g.realm);g.player.hp=62;g.shards=[{id:1,x:12,z:0,value:4}];
 assert.equal(g.enterRealm(0),false);assert.equal(g.enterRealm(7),true);
 assert.equal(g.time,77);assert.equal(g.player.hp,62);assert.equal(g.rank('power'),2);
 assert.equal(g.xp,4);assert.equal(g.shards.length,0);assert.equal(g.enterRealm(0),false);assert.ok(g.visited.has(7));
});
test('a shrine applies exactly one blessing in the chosen Survival realm',()=>{
 const g=new Game();g.player.z=-7;assert.equal(g.interact(),true);assert.equal(g.rank('magnet'),1);assert.equal(g.interact(),false);assert.equal(g.shrines.size,1);
 const sea=new Game('link',7,{realm:1});sea.player.z=-7;sea.player.hp=50;sea.interact();assert.equal(sea.player.maxHp,125);assert.equal(sea.player.hp,85);
});
test('jump and glide consume stamina then land',()=>{
  const g=new Game();g.spawnTimer=100;assert.equal(g.jump(),true);assert.equal(g.jump(),false);advance(g,.6,{x:1,y:0,glide:true});assert.ok(g.player.y>0);assert.equal(g.player.gliding,true);assert.ok(g.player.stamina<1);advance(g,5,{x:1,y:0,glide:true});assert.equal(g.player.y,0);assert.equal(g.player.gliding,false);
});
test('Phantom Ganon spawns once at four minutes and stays in the chosen Survival arena',()=>{
  const g=new Game('link',1,{mode:'survival',realm:1});g.time=239.99;g.spawnTimer=100;g.step(.02);assert.ok(g.boss);assert.equal(g.bossSpawned,true);const boss=g.boss;g.hurtEnemy(boss,123);const hp=boss.hp;assert.equal(g.enterRealm(0),false);assert.equal(g.realm,1);assert.equal(g.boss,boss);assert.equal(g.boss.hp,hp);assert.ok(g.enemies.includes(boss));g.step(.02);assert.equal(g.enemies.filter(e=>e.type==='boss').length,1);
});
test('victory and defeat are terminal and cannot award duplicate results',()=>{
  const g=new Game();g.time=240;g.step(.02);g.hurtEnemy(g.boss,1e9);assert.equal(g.state,'won');const t=g.time;g.hurtEnemy(g.boss,1e9);g.step(.02);assert.equal(g.time,t);assert.equal(g.kills,1);
  const h=new Game();h.hurtPlayer(1000);assert.equal(h.state,'lost');h.resume();h.step(.05);assert.equal(h.state,'lost');assert.equal(h.player.hp,0);
});
test('weapons damage enemies, levels offer bounded ranks, and simulation is reproducible',()=>{
  function run(){const g=new Game('link',912);g.hurtPlayer=()=>{};for(let frame=0;frame<12000;frame++){if(g.state==='upgrade')g.choose(g.choices[0].id);g.step(.02,{x:Math.sin(frame/150)*.6,y:Math.cos(frame/150)*.6});g.drainEvents();}assert.ok(g.kills>10);assert.ok(g.damageDealt>100);assert.ok(g.bossSpawned);for(const u of UPGRADES)assert.ok(g.rank(u.id)<=u.max);assert.ok(g.enemies.length<=171);return[g.time,g.kills,g.level,g.damageDealt,g.xp];}
  assert.deepEqual(run(),run());
});

test('movement follows camera yaw without changing speed',()=>{
  const a=new Game(),b=new Game();a.step(.05,{x:0,y:1,cameraYaw:0});b.step(.05,{x:0,y:1,cameraYaw:Math.PI/2});assert.ok(Math.abs(a.player.x)<1e-9);assert.ok(a.player.z<0);assert.ok(b.player.x<0);assert.ok(Math.abs(b.player.z)<1e-9);
});
test('Ultimate requires charge, damages enemies once, and remains frozen while paused',()=>{
  const g=new Game();const e=g.spawnEnemy('boar',2,0);assert.equal(g.ultimate(),false);g.energy=100;g.pause();assert.equal(g.ultimate(),false);g.resume();assert.equal(g.ultimate(),true);assert.equal(!!e.dead,false);g.pause();g.step(.05);assert.equal(g.player.actionAge,0);g.resume();for(let i=0;i<9;i++)g.step(.05);assert.equal(e.dead,true);assert.ok(g.energy<100);assert.equal(g.ultimate(),false);assert.equal(g.kills,1);
});
test('target lock and manual aim preserve their separate roles',()=>{
  const g=new Game(),e=g.spawnEnemy('slime',3,0);assert.equal(g.lockTarget(),true);g.cameraYaw=0;assert.equal(g.attackTarget(20),e);g.toggleAim();assert.equal(g.aimMode,'manual');assert.equal(g.lockedTarget,null);assert.equal(g.attackTarget(20).id,null);assert.equal(g.attackTarget(20).z,-20);g.lockTarget();assert.equal(g.attackTarget(20),e);g.hurtEnemy(e,100);assert.equal(g.attackTarget(20).id,null);
});
test('refresh, skip, and banish consume only their finite run resources',()=>{
  const g=new Game('link',18);g.collect(15);const xp=g.xp,level=g.level;assert.equal(g.refreshChoices(),true);assert.equal(g.refreshes,1);const banned=g.choices[0].id;assert.equal(g.banishChoice(banned),true);for(let i=0;i<12;i++)assert.ok(!g.rollUpgrades().some(u=>u.id===banned));assert.equal(g.banishes,0);assert.equal(g.banishChoice(g.choices[0].id),false);assert.equal(g.xp,xp);assert.equal(g.level,level);assert.equal(g.skipUpgrade(),true);assert.equal(g.skips,1);assert.equal(g.state,'running');assert.equal(g.skipUpgrade(),false);
});
test('streak and charge persist across realms but reset on a new run',()=>{
  const g=new Game('link',1,{mode:'adventure'});g.hurtEnemy(g.spawnEnemy('slime',2,0),100);assert.equal(g.streak,1);const energy=g.energy;g.activateShrine(g.realm);g.enterRealm(7);assert.equal(g.streak,1);assert.equal(g.energy,energy);g.spawnTimer=100;advance(g,4.1);assert.equal(g.streak,0);assert.equal(g.bestStreak,1);assert.equal(new Game().bestStreak,0);
});
