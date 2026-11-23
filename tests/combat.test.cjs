const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,Combat}=require('../core.js');
const {Profile}=require('../profile.js');
const sandbox=()=>{const game=new Game('link',123,{flatTerrain:true});game.spawnTimer=999;game.ranks={};return game;};
const advance=(game,seconds)=>{for(let i=0;i<Math.round(seconds/.02);i++)game.step(.02);};

test('critical thresholds preserve 5% base, guaranteed criticals, and capped mega-critical odds',()=>{
  assert.deepEqual(Combat.critical(.05,1.75,.06),{tier:0,multiplier:1});
  assert.equal(Combat.critical(.05,1.75,.01).multiplier,1.75);
  assert.equal(Combat.critical(1,1.75,.99).tier,1);
  assert.equal(Combat.critical(1.25,1.75,.24).tier,2);
  assert.equal(Combat.critical(1.25,1.75,.26).tier,1);
  assert.equal(Combat.critical(8,1.75,.99).multiplier,1.75*(1+.5*.75));
});

test('equipment stack limits, state, and unknown IDs cannot alter combat data',()=>{
  const game=sandbox();assert.equal(game.acquireGear('__proto__'),false);
  for(let i=0;i<10;i++)assert.equal(game.acquireGear('hawkeye'),true);
  assert.equal(game.acquireGear('hawkeye'),false);assert.ok(Math.abs(game.stats.critChance-.65)<1e-10);
  game.pause();assert.equal(game.acquireGear('bracelet'),false);assert.equal(game.gear.bracelet,undefined);
  assert.throws(()=>Combat.validateGear({hawkeye:11}));assert.throws(()=>Combat.validateGear({hawkeye:1.5}));
  assert.throws(()=>Combat.validateGear(JSON.parse('{"__proto__":1}')));
});

test('obtainable equipment can reach guaranteed mega-criticals without exceeding the chance cap',()=>{
  const game=sandbox();for(let i=0;i<10;i++){game.acquireGear('ancientbow');game.acquireGear('hawkeye');}
  assert.equal(game.stats.critChance,2);game.random=()=>.99;const enemy=game.spawnEnemy('boar',10,0);enemy.hp=enemy.maxHp=1000;
  game.hitEnemy(enemy,100,'ember');assert.equal(game.megaCriticalHits,1);assert.ok(Math.abs(game.damageBySource.ember-240.625)<1e-8);
});

test('physical and magic modifiers apply once, with actual damage credited to the source',()=>{
  const game=sandbox();game.acquireGear('bracelet');game.acquireGear('rod');game.random=()=>.99;
  const enemy=game.spawnEnemy('boar',10,0);enemy.hp=enemy.maxHp=1000;
  assert.ok(Math.abs(game.hitEnemy(enemy,100,'ember')-115)<1e-10);assert.ok(Math.abs(game.hitEnemy(enemy,100,'leaf')-115)<1e-10);
  assert.ok(Math.abs(game.damageBySource.ember-115)<1e-10);assert.ok(Math.abs(game.damageDealt-230)<1e-10);
  game.hitEnemy(enemy,10000,'bomb');assert.equal(enemy.dead,true);assert.equal(game.damageDealt,1000);
  assert.equal(game.hitEnemy(enemy,10000,'bomb'),0);assert.equal(game.damageDealt,1000);
});

test('armor, regeneration, lifesteal, and reflected damage operate through the combat layer',()=>{
  const game=sandbox();game.random=()=>.99;for(const id of ['armor','milk','tears','spikes'])game.acquireGear(id);
  const enemy=game.spawnEnemy('boar',10,0);enemy.hp=enemy.maxHp=1000;
  game.hurtPlayer(30,enemy);assert.ok(game.player.hp>70&&game.player.hp<100);assert.equal(game.damageBySource.thorns,25);
  const before=game.player.hp;game.hitEnemy(enemy,100,'ember');assert.ok(Math.abs(game.player.hp-before-3*1.15)<1e-10);
  game.player.invincible=999;const health=game.player.hp;advance(game,1);assert.ok(game.player.hp>health+1.3);
});

test('max-health equipment survives shrine blessings and save restore without multiplying twice',()=>{
  const game=sandbox();game.acquireGear('radish');assert.ok(Math.abs(game.player.maxHp-115*1.03)<1e-10);
  game.player.hp=50;game.activateShrine(1);assert.ok(Math.abs(game.player.maxHp-140*1.03)<1e-10);assert.equal(game.player.hp,85);
  const restored=Game.fromCheckpoint(JSON.parse(JSON.stringify(game.checkpoint())));
  assert.equal(restored.player.maxHp,game.player.maxHp);assert.ok(Math.abs(restored.player.hp-game.player.hp)<1e-10);
  assert.deepEqual(restored.gear,game.gear);
});

test('treasure rewards are bounded, collected once, and banked before travel',()=>{
  const game=new Game('link',123,{mode:'adventure',flatTerrain:true}),enemy=game.spawnEnemy('boar',10,0,true);game.hurtEnemy(enemy,1e6);assert.equal(game.loot.length,1);
  const drop=game.loot[0];assert.ok(Combat.item(drop.gearId).rarity>=1);assert.equal(game.collectLoot(drop.id),true);
  const owned={...game.gear};assert.equal(game.collectLoot(drop.id),false);assert.deepEqual(game.gear,owned);
  for(let i=0;i<20;i++)game.dropGear(10,10);assert.equal(game.loot.length,12);
  const count=Object.values(game.gear).reduce((a,b)=>a+b,0);game.activateShrine(game.realm);assert.equal(game.enterRealm(7),true);assert.equal(game.loot.length,0);
  assert.equal(Object.values(game.gear).reduce((a,b)=>a+b,0),count+12);
});

test('pending treasure and damage data restore once while legacy saves remain compatible',()=>{
  const game=sandbox();game.dropGear(20,20);game.acquireGear('token');game.shards.push({id:999,x:10,z:10,value:4});
  const raw=JSON.parse(JSON.stringify(game.checkpoint())),restored=Game.fromCheckpoint(raw);
  assert.deepEqual(restored.loot.map(item=>item.gearId),raw.pendingLoot);assert.equal(restored.xp,4*1.15);
  assert.equal(restored.collectLoot(restored.loot[0].id),true);assert.equal(restored.loot.length,0);
  assert.deepEqual(Game.fromCheckpoint(restored.checkpoint()).gear,restored.gear);
  const old={...raw};for(const key of ['combatVersion','gear','pendingLoot','damageBySource','criticalHits','megaCriticalHits','reactions'])delete old[key];
  assert.deepEqual(Game.fromCheckpoint(old).gear,{});
  for(const change of [{gear:{radish:11}},{pendingLoot:['invalid']},{damageBySource:{invalid:2}},{criticalHits:NaN},{combatVersion:99}])assert.throws(()=>Game.fromCheckpoint({...raw,...change}));
});

test('burn, freeze, and shock freeze their timers and damage while the game is paused',()=>{
  const game=sandbox(),enemy=game.spawnEnemy('boar',10,0);enemy.hp=1000;game.applyStatus(enemy,'burn',100,'firefruit');game.applyStatus(enemy,'shock',10);
  game.pause();advance(game,2);assert.equal(enemy.hp,1000);assert.equal(enemy.statuses.burn.time,3);
  game.resume();advance(game,1);assert.ok(enemy.hp<1000);assert.ok(game.damageBySource.firefruit>0);
  assert.equal(enemy.statuses.shock,undefined);assert.equal(game.applyStatus(enemy,'unknown'),false);
});

test('steam consumes opposing statuses and chain shock hits nearby enemies without recursive procs',()=>{
  const game=sandbox(),a=game.spawnEnemy('boar',10,0),b=game.spawnEnemy('boar',12,0);a.hp=b.hp=1000;
  game.applyStatus(a,'burn',100);game.applyStatus(a,'wet',100);assert.equal(game.reactions,1);assert.equal(a.statuses.burn,undefined);assert.equal(a.statuses.wet,undefined);assert.equal(a.hp,940);
  game.applyStatus(a,'wet');game.applyStatus(a,'shock',100);assert.equal(game.reactions,2);assert.equal(a.hp,860);assert.equal(b.hp,920);assert.equal(a.statuses.wet,undefined);
  assert.equal(game.damageBySource.reaction,220);
});

test('wet extends freeze, and bosses resist freezing without losing their attack state',()=>{
  const game=sandbox(),enemy=game.spawnEnemy('boar',10,0);game.applyStatus(enemy,'wet');game.applyStatus(enemy,'freeze');
  assert.equal(enemy.statuses.freeze.time,2.25);assert.equal(enemy.statuses.wet,undefined);const x=enemy.x;
  advance(game,.5);assert.equal(enemy.x,x);const boss=game.spawnBoss('gohma');game.applyStatus(boss,'freeze');assert.equal(boss.statuses.freeze.time,.375);assert.equal(boss.spawnTime,.8);
});

test('projectiles aim vertically toward targets across a terrain height change',()=>{
  const game=sandbox();game.ranks.ember=1;game.groundAt=(x,z)=>Math.max(0,x*.2);game.random=()=>.99;
  const target=game.spawnEnemy('boar',10,0);target.speed=0;target.attackTimer=999;game.fire('ember',target);
  assert.ok(game.projectiles[0].vy>0);advance(game,.7);assert.ok(target.hp<target.maxHp);
  const cliff=sandbox();cliff.ranks.ember=1;cliff.cooldowns.ember=999;cliff.groundAt=x=>x>5?2:0;
  const hidden=cliff.spawnEnemy('boar',10,0);hidden.speed=0;hidden.attackTimer=999;cliff.fire('ember',hidden);advance(cliff,.7);
  assert.equal(hidden.hp,hidden.maxHp);assert.equal(cliff.projectiles.length,0);
});

test('profile exports retain new equipment inside active run checkpoints',()=>{
  const game=new Game('link',4,{mode:'adventure'}),profile=new Profile();profile.beginRun(game);game.acquireGear('hawkeye');profile.saveCheckpoint(game);
  const restored=Profile.import(JSON.stringify(profile));assert.equal(restored.resume().gear.hawkeye,1);assert.ok(restored.gear.includes('hawkeye'));
});

test('training never replaces a saved run, settles rewards, or advances levels',()=>{
  const profile=new Profile(),adventure=new Game('link',9,{mode:'adventure'});profile.beginRun(adventure);const before=JSON.stringify(profile);
  const training=new Game('link',10,{mode:'training'});assert.equal(training.checkpoint(),null);assert.throws(()=>profile.beginRun(training));assert.equal(profile.saveCheckpoint(training),false);
  training.acquireGear('hawkeye');training.collect(100000);assert.equal(training.level,1);training.state='won';assert.throws(()=>profile.settle(training));assert.equal(JSON.stringify(profile),before);
});

test('training validates builds before mutations and supports four weapons and five charms',()=>{
  const game=new Game('link',20,{mode:'training'});game.pause();
  const ranks={ember:8,leaf:8,nova:8,bomb:8,power:10,haste:10,vitality:10,regen:10,speed:10};
  assert.equal(game.setTrainingBuild(ranks,{hawkeye:4}),true);const before=JSON.stringify([game.ranks,game.gear]);
  for(const invalid of [{...ranks,orbit:1},{...ranks,magnet:1},{ember:9},{unknown:1}])assert.equal(game.setTrainingBuild(invalid,{}),false);
  assert.equal(JSON.stringify([game.ranks,game.gear]),before);assert.equal(game.configureTraining({realm:99,stage:1,level:40,invulnerable:true}),false);
  assert.equal(game.configureTraining({hero:'midna',realm:7,stage:3,level:40,invulnerable:true}),true);assert.equal(game.realm,7);assert.equal(game.stage,3);assert.equal(game.hero,'midna');
  assert.equal(new Game().setTrainingBuild(ranks,{}),false);
});

test('training rivals are manual, bounded, and non-terminal; invulnerability can be disabled',()=>{
  const game=new Game('link',30,{mode:'training'});advance(game,5);assert.equal(game.enemies.length,0);assert.equal(game.spawnTrainingRivals('unknown'),false);
  game.spawnTrainingRivals('dummy');const dummy=game.enemies[0],x=dummy.x,z=dummy.z;game.ranks={};advance(game,1);assert.equal(dummy.x,x);assert.equal(dummy.z,z);
  game.hurtPlayer(10000,dummy);assert.equal(game.player.hp,game.player.maxHp);game.resetTraining();
  assert.equal(game.spawnTrainingRivals('boss'),true);game.hurtEnemy(game.boss,1e7);assert.equal(game.state,'running');assert.equal(game.boss,null);assert.equal(game.shrines.size,0);
  game.resetTraining();game.spawnTrainingRivals('horde60');game.spawnTrainingRivals('horde60');assert.equal(game.spawnTrainingRivals('horde60'),false);assert.equal(game.enemies.length,120);
  game.resetTraining();game.training.invulnerable=false;game.hurtPlayer(10);assert.equal(game.player.hp,90);assert.equal(game.damageDealt,0);
});
