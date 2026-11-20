const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,Combat,UPGRADES,xpForLevel}=require('../core.js');
const {Profile}=require('../profile.js');
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
function offer(game,id,rarity=0){game.state='upgrade';game.choices=[{...UPGRADES.find(item=>item.id===id),rarity}];return game.choose(id);}

test('reference XP thresholds apply to new runs, levels, training and restored saves',()=>{
  assert.deepEqual([1,2,40].map(xpForLevel),[15,22,993]);
  const game=new Game();game.collect(14);assert.equal(game.level,1);game.collect(1);assert.equal(game.level,2);assert.equal(game.xpNeed,22);
  assert.equal(Game.fromCheckpoint(game.checkpoint()).xpNeed,22);
  const training=new Game('link',1,{mode:'training'});training.configureTraining({realm:6,stage:1,level:40,invulnerable:true});assert.equal(training.xpNeed,993);
});

test('three base slots become four weapons and five charms through capped purchases',()=>{
  const base=new Game();assert.equal(base.weaponSlots,3);assert.equal(base.charmSlots,3);
  const profile=new Profile({rupees:6000});
  assert.equal(profile.upgradeCost('weaponSlot'),1500);assert.equal(profile.purchase('weaponSlot'),true);assert.equal(profile.purchase('weaponSlot'),false);
  assert.equal(profile.upgradeCost('charmSlots'),1200);profile.purchase('charmSlots');assert.equal(profile.upgradeCost('charmSlots'),3000);profile.purchase('charmSlots');assert.equal(profile.purchase('charmSlots'),false);
  const game=new Game('link',1,{upgrades:profile.upgrades});assert.equal(game.weaponSlots,4);assert.equal(game.charmSlots,5);assert.equal(profile.rupees,300);
  const old=profile.toJSON();delete old.upgrades.weaponSlot;delete old.upgrades.charmSlots;assert.equal(Profile.import(JSON.stringify(old)).upgrades.weaponSlot,0);
});

test('full slots keep owned upgrades available and exclude new equipment',()=>{
  const game=new Game();game.ranks={ember:1,leaf:1,bomb:1,power:1,haste:1,speed:1};
  for(let i=0;i<40;i++)for(const choice of game.rollUpgrades())assert.ok(['ember','leaf','bomb','power','haste','speed'].includes(choice.id));
  assert.equal(offer(game,'nova'),false);assert.equal(offer(game,'vitality'),false);assert.equal(offer(game,'ember',2),true);assert.equal(game.rank('ember'),2);
  assert.equal(game.activateShrine(0),true);assert.equal(game.rank('magnet'),1);assert.equal(game.slotCount('CHARM'),3);assert.equal(game.learnedRank('magnet'),0);
  assert.equal(offer(game,'magnet'),false);game.ranks.speed=0;assert.equal(offer(game,'magnet'),true);assert.equal(game.learnedRank('magnet'),1);assert.equal(game.slotCount('CHARM'),3);
});

test('normal caps are 8 and 10; special treasures extend to 10 and 12',()=>{
  const game=new Game();game.ranks={ember:8,power:10};assert.equal(offer(game,'ember'),false);assert.equal(offer(game,'power'),false);
  game.state='running';game.acquireGear('adventurepouch');game.acquireGear('greenpotion');assert.equal(offer(game,'ember',4),true);assert.equal(offer(game,'ember',4),true);assert.equal(offer(game,'ember'),false);
  assert.equal(offer(game,'power'),true);assert.equal(offer(game,'power'),true);assert.equal(offer(game,'power'),false);
  game.state='running';game.activateShrine(2);assert.equal(game.rank('power'),13);assert.equal(game.learnedRank('power'),12);assert.equal(offer(game,'power'),false);
  game.state='running';assert.equal(Game.fromCheckpoint(game.checkpoint()).rank('power'),13);
});

test('level-eight Uncommon bolt growth matches measured reference values',()=>{
  const growth=Combat.upgradeGrowth('ember',Array(7).fill(1));
  close(growth.damage,2.088);close(growth.cooldown,.817216);assert.equal(growth.count,2);close(growth.speed,1.36);assert.equal(growth.pierce,2);assert.equal(growth.bounce,2);close(growth.critical,.12);
  close(27.4*growth.damage*1.28,73.230336);close(.85*growth.cooldown,.6946336);
  const game=new Game('zelda');game.ranks={ember:1};for(let i=0;i<7;i++)assert.equal(offer(game,'ember',1),true);
  const attack=game.weaponStats('ember');close(attack.damage,13*2.088*1.28);assert.equal(attack.count,3);close(attack.speed,24*1.36);close(attack.critical,.12);
  assert.ok(!game.drainEvents().some(event=>event.type==='evolve'));
});

test('mixed rarity and offered rarity survive reload; malformed history is rejected',()=>{
  const game=new Game();for(const rarity of [4,0,2,1])assert.equal(offer(game,'ember',rarity),true);
  game.state='upgrade';game.choices=[{...UPGRADES.find(item=>item.id==='ember'),rarity:3}];
  const raw=JSON.parse(JSON.stringify(game.checkpoint())),restored=Game.fromCheckpoint(raw);
  assert.deepEqual(restored.weaponUpgrades.ember,[4,0,2,1]);assert.equal(restored.choices[0].rarity,3);assert.deepEqual(restored.weaponStats('ember'),game.weaponStats('ember'));
  restored.choose('ember');assert.deepEqual(restored.weaponUpgrades.ember,[4,0,2,1,3]);
  for(const history of [[4,0,2],[4,0,2,5],[4,0,2,-1],[4,0,2,1.5]])assert.throws(()=>Game.fromCheckpoint({...raw,weaponUpgrades:{ember:history}}));
  for(const ranks of [{ember:NaN},{ember:false},{unknown:1}])assert.throws(()=>Game.fromCheckpoint({...raw,ranks}));
  assert.throws(()=>Game.fromCheckpoint({...raw,choiceRarities:{ember:5}}));
});

test('older oversized builds and a pending new weapon keep their capacity',()=>{
  const game=new Game();game.ranks={ember:4,leaf:1,bomb:1,nova:1};game.state='upgrade';game.choices=[UPGRADES.find(item=>item.id==='orbit')];
  const raw=game.checkpoint();for(const key of ['buildVersion','legacySlots','weaponUpgrades','choiceRarities'])delete raw[key];
  const restored=Game.fromCheckpoint(raw);assert.equal(restored.weaponSlots,5);assert.deepEqual(restored.weaponUpgrades.ember,[0,0,0]);assert.equal(restored.choose('orbit'),true);
  assert.equal(Game.fromCheckpoint(restored.checkpoint()).weaponSlots,5);
  assert.equal(new Game().weaponSlots,3);
});

test('training applies selected rarity, preserves it through treasure edits, and validates before mutation',()=>{
  const game=new Game('midna',1,{mode:'training'});assert.equal(game.setTrainingBuild({ember:10,power:12},{adventurepouch:1,greenpotion:1},{ember:4}),true);
  assert.deepEqual(game.weaponUpgrades.ember,Array(9).fill(4));const before=JSON.stringify([game.ranks,game.gear,game.weaponUpgrades]);
  assert.equal(game.setTrainingBuild(game.ranks,{},{}),false);assert.equal(game.setTrainingBuild({ember:1},{},{ember:5}),false);assert.equal(JSON.stringify([game.ranks,game.gear,game.weaponUpgrades]),before);
  assert.equal(game.setTrainingBuild(game.ranks,{...game.gear,hawkeye:1}),true);assert.deepEqual(game.weaponUpgrades.ember,Array(9).fill(4));
});

test('projectiles use upgraded speed, lifespan, piercing and homing; orbit has timed uptime',()=>{
  const game=new Game('zelda',1,{mode:'training',flatTerrain:true});game.setTrainingBuild({ember:8,leaf:1,orbit:1},{},{ember:1});
  const enemy=game.spawnEnemy('boar',8,0);enemy.hp=enemy.maxHp=10000;enemy.speed=0;game.fire('ember',enemy);
  const shot=game.projectiles[0];close(shot.speed,32.64);close(shot.life,.8);assert.equal(shot.pierce,2);assert.equal(shot.bounce,2);assert.equal(shot.homing,false);
  game.fire('leaf',enemy);assert.equal(game.projectiles[1].homing,true);
  game.cooldowns.orbit=0;game.updateWeapons(.02);assert.equal(game.orbitActive,4);close(game.cooldowns.orbit,5.5);
  game.updateWeapons(4.1);assert.equal(game.orbitActive,0);game.updateWeapons(1.41);assert.equal(game.orbitActive,4);
  game.pause();game.step(.02);assert.equal(game.orbitActive,4);
});

test('fast piercing shots hit crossed enemies and a non-piercing shot stops after one',()=>{
  for(const pierce of [0,2]){
    const game=new Game('zelda',1,{mode:'training',flatTerrain:true});game.ranks={ember:1};game.cooldowns.ember=999;game.random=()=>.99;
    const enemies=[3,6].map(x=>{const enemy=game.spawnEnemy('boar',x,0);enemy.hp=enemy.maxHp=1000;enemy.speed=0;return enemy;});
    game.fire('ember',enemies[0]);Object.assign(game.projectiles[0],{speed:200,pierce,bounce:0});game.step(.05);
    assert.equal(enemies[0].hp,987);assert.equal(enemies[1].hp,pierce?987:1000);
    assert.equal(game.projectiles.length,pierce?1:0);
  }
});

test('bounce upgrades redirect a hit toward a fresh target',()=>{
  const game=new Game('zelda',1,{mode:'training',flatTerrain:true});game.ranks={ember:1};game.cooldowns.ember=999;game.random=()=>.99;
  const a=game.spawnEnemy('boar',3,0),b=game.spawnEnemy('boar',3,3);for(const enemy of [a,b]){enemy.hp=enemy.maxHp=1000;enemy.speed=0;}
  game.fire('ember',a);game.projectiles[0].bounce=1;
  for(let i=0;i<25;i++)game.step(.02);
  assert.equal(a.hp,987);assert.equal(b.hp,987);assert.equal(game.projectiles.length,0);
});
