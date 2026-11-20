const {test}=require('node:test');const assert=require('node:assert/strict');
const {Game,HEROES,REALMS,BOSSES,UPGRADES}=require('../core.js');const{Profile}=require('../profile.js');
const chooseAll=game=>{let limit=100;while(game.state==='upgrade'&&limit-->0)game.choose(game.choices[0].id);assert.ok(limit>0);};
test('Adventure completes 24 levels, eight distinct guardians, then Ganondorf',()=>{
 const g=new Game('link',42,{mode:'adventure'});g.spawnTimer=999;assert.equal(g.realm,6);assert.equal(g.stageLabel,'1-1');
 for(const realm of [6,7,0,1,2,3,4,5]){
  if(g.realm!==realm){g.travelCooldown=0;assert.equal(g.travel(realm),true);chooseAll(g);}
  for(const level of [1,2]){assert.equal(g.stage,level);assert.equal(g.challengeGuardian(),false);assert.equal(g.advanceStage(),false);const quota=g.stageTarget;for(let i=0;i<quota;i++){const e=g.spawnRealmEnemy(3,0);g.hurtEnemy(e,1e6);chooseAll(g);}g.player.x=0;g.player.z=-7;assert.equal(g.stageReady,true);assert.equal(g.interact(),true);chooseAll(g);assert.equal(g.stageKills[realm],0);}
  g.player.z=-7;assert.equal(g.interaction.kind,'guardian');assert.equal(g.interact(),true);assert.equal(g.boss.bossId,REALMS[realm].boss);assert.equal(g.travel(REALMS[realm].links[0]),false);g.hurtEnemy(g.boss,1e6);chooseAll(g);assert.equal(g.boss,null);assert.notEqual(g.state,'won');
 }
 assert.equal(g.shrines.size,8);for(const realm of [6,7,0]){g.travelCooldown=0;assert.equal(g.travel(realm),true);chooseAll(g);}g.player.z=-7;assert.equal(g.interaction.kind,'final');assert.equal(g.interact(),true);assert.equal(g.boss.bossId,'ganondorf');g.hurtEnemy(g.boss,1e6);assert.equal(g.state,'won');assert.equal(g.kills,249);
});
test('Adventure has no automatic four-minute ending or duplicate guardian reward',()=>{
 const g=new Game('midna',7,{mode:'adventure'});g.time=245;g.spawnTimer=999;g.step(.02);assert.equal(g.boss,null);g.realmStages[g.realm]=3;g.player.z=-7;g.interact();const boss=g.boss;g.hurtEnemy(boss,1e6);const hp=g.player.maxHp,level=g.level;g.hurtEnemy(boss,1e6);assert.equal(g.shrines.size,1);assert.equal(g.player.maxHp,hp);assert.equal(g.level,level);
});
test('bosses have distinct telegraphed attacks and retain HP through phase changes',()=>{
 for(const id of Object.keys(BOSSES)){const g=new Game();g.spawnTimer=999;g.player.hp=g.player.maxHp=1e6;const boss=g.spawnBoss(id,true);const hp=boss.hp;boss.hp=hp*.3;g.updateBoss(boss,.02);assert.equal(boss.stage,3);assert.equal(boss.hp,hp*.3);boss.spawnTime=0;boss.attackTimer=0;g.updateBoss(boss,.02);assert.ok(boss.windup>0);assert.ok(BOSSES[id].patterns.includes(boss.intent));assert.equal(boss.actionAge,0);for(let i=0;i<70;i++)g.updateBoss(boss,.02);assert.ok(g.projectiles.length+g.hazards.length+g.enemies.length>0);assert.ok(Number.isFinite(boss.x));}
});
test('Bombs hit a group once and Boomerangs return for a second hit',()=>{
 const g=new Game();g.ranks={bomb:1};const a=g.spawnEnemy('boar',3,0),b=g.spawnEnemy('boar',4,0);a.hp=b.hp=1000;const projectile={x:3,z:0,blastRadius:3,damage:60};g.explode(projectile);assert.equal(a.hp,940);assert.equal(b.hp,940);g.explode(projectile);assert.equal(a.hp,940);
 const h=new Game();h.ranks={boomerang:1};h.spawnTimer=999;const e=h.spawnEnemy('boar',4,0);e.hp=e.maxHp=1000;e.speed=0;h.fire('boomerang',e);for(let i=0;i<130;i++)h.step(.02);assert.ok(e.hp<=1000-h.weaponStats('boomerang').damage*2);assert.equal(h.projectiles.filter(p=>p.type==='boomerang').length<=2,true);
});
test('safe checkpoints round-trip progression and retain pending XP',()=>{
 const g=new Game('zelda',5,{mode:'adventure',upgrades:{heart:2,power:2},runId:'checkpoint-test'});g.ranks={leaf:3,vitality:2};g.player.maxHp=85+16+50;g.player.hp=g.player.maxHp*.6;g.time=77;g.shrines.add(0);g.realmStages[0]=3;g.visited.add(1);g.realm=1;g.energy=62;g.shards=[{value:30}];const raw=g.checkpoint(),restored=Game.fromCheckpoint(JSON.parse(JSON.stringify(raw)));assert.equal(restored.runId,g.runId);assert.equal(restored.realm,1);assert.equal(restored.time,77);assert.equal(restored.rank('leaf'),3);assert.equal(restored.player.maxHp,151);assert.ok(Math.abs(restored.player.hp-90.6)<.001);assert.equal(restored.energy,62);assert.equal(restored.state,'upgrade');assert.equal(restored.shards.length,0);assert.equal(restored.shrines.has(0),true);g.spawnBoss('helmaroc');assert.equal(g.checkpoint(),null);
});
test('checkpoint input rejects invalid heroes, ranks, realm data, health and oversized IDs',()=>{
 const raw=new Game('link',3,{mode:'adventure'}).checkpoint();for(const patch of [{hero:'__proto__'},{realm:8},{time:Infinity},{healthFraction:-1},{ranks:{ember:999}},{visited:[8]},{runId:'x'.repeat(81)}])assert.throws(()=>Game.fromCheckpoint({...raw,...patch}));assert.throws(()=>new Game('__proto__'));
});
test('permanent purchases cannot overspend or exceed their rank cap',()=>{
 const profile=new Profile({rupees:1000});assert.equal(profile.purchase('unknown'),false);for(let i=0;i<5;i++)assert.equal(profile.purchase('heart'),true);assert.equal(profile.upgrades.heart,5);assert.equal(profile.purchase('heart'),false);assert.equal(profile.rupees,700);const poor=new Profile();assert.equal(poor.purchase('heart'),false);const game=new Game('link',2,{upgrades:profile.upgrades});assert.equal(game.player.maxHp,140);
});
test('guardians unlock canonical characters and duplicate results cannot grant more rupees',()=>{
 const p=new Profile();assert.deepEqual(p.unlocked,['link','zelda','midna']);assert.deepEqual(p.recordGuardian('helmaroc'),['tetra']);p.recordGuardian('gohma');assert.deepEqual(p.recordGuardian('zant'),['sheik']);assert.deepEqual(p.recordGuardian('majora'),['skullkid']);const g=new Game('link',1,{runId:'result-one',mode:'adventure'});g.state='won';g.kills=30;g.shrines=new Set(REALMS.map((_,i)=>i));const first=p.settle(g),balance=p.rupees;assert.equal(first.reward,170);assert.equal(p.adventureWins,1);assert.equal(p.settle(g).duplicate,true);assert.equal(p.rupees,balance);assert.equal(p.runs,1);assert.equal(p.achievements.find(a=>a.id==='six').complete,true);
});
test('a stale run cannot replace or clear another tab’s checkpoint',()=>{
 const p=new Profile(),a=new Game('link',1,{mode:'adventure',runId:'run-a'}),b=new Game('zelda',2,{mode:'adventure',runId:'run-b'});p.beginRun(a);assert.throws(()=>p.beginRun(b));p.beginRun(b,'run-a');assert.equal(p.saveCheckpoint(a),false);a.state='lost';p.settle(a);assert.equal(p.checkpoint.runId,'run-b');assert.equal(p.activeRunId,'run-b');
});
test('save exports round-trip and malformed imports leave the existing profile intact',()=>{
 const p=new Profile({rupees:120,bestKills:70});p.recordGuardian('helmaroc');p.purchase('heart');p.beginRun(new Game('tetra',5,{mode:'adventure',runId:'save-tetra'}));const text=JSON.stringify(p),restored=Profile.import(text);assert.equal(restored.rupees,100);assert.equal(restored.resume().hero,'tetra');assert.ok(restored.unlocked.includes('tetra'));for(const value of ['{}','null','not-json',JSON.stringify({...p.toJSON(),rupees:-1}),JSON.stringify({...p.toJSON(),checkpoint:{hero:'bad'}})])assert.throws(()=>Profile.import(value));assert.equal(p.rupees,100);const old=Profile.migrate({bestKills:50,wins:2,sound:true});assert.equal(old.rupees,90);assert.equal(old.bestKills,50);assert.equal(old.sound,true);
});
test('effect pressure cannot drop guardian, level, or end transitions',()=>{
 const g=new Game();for(let i=0;i<400;i++)g.emit('hit',{damage:1});g.emit('guardian',{id:'gohma'});g.emit('level',{level:2});g.emit('end',{won:true});const events=g.drainEvents();assert.equal(events.length,300);for(const type of ['guardian','level','end'])assert.ok(events.some(event=>event.type===type));
});
test('pending upgrade choices and finite resources survive checkpoint reload',()=>{
 const g=new Game('link',90,{mode:'adventure'});g.collect(12);let revision=g.checkpointRevision;g.refreshChoices();assert.ok(g.checkpointRevision>revision);revision=g.checkpointRevision;g.banishChoice(g.choices[0].id);assert.ok(g.checkpointRevision>revision);const ids=g.choices.map(c=>c.id),saved=g.checkpoint(),restored=Game.fromCheckpoint(JSON.parse(JSON.stringify(saved)));assert.equal(restored.level,g.level);assert.equal(restored.xp,g.xp);assert.equal(restored.state,'upgrade');assert.equal(restored.refreshes,1);assert.equal(restored.banishes,0);assert.deepEqual(restored.choices.map(c=>c.id),ids);assert.deepEqual([...restored.banished],[...g.banished]);revision=restored.checkpointRevision;restored.choose(ids[0]);assert.ok(restored.checkpointRevision>revision);assert.equal(restored.state,'running');assert.throws(()=>Game.fromCheckpoint({...saved,ranks:{...saved.ranks,[ids[0]]:UPGRADES.find(u=>u.id===ids[0]).max}}));
});
test('death events keep their event name and carry actor identity for animation',()=>{
 const g=new Game();const e=g.spawnEnemy('boar',3,0);g.drainEvents();g.hurtEnemy(e,10000);const event=g.drainEvents().find(e=>e.type==='pop');assert.ok(event);assert.equal(event.enemyType,'boar');assert.equal(event.id,e.id);assert.equal(g.kills,1);
});
test('each map only spawns its own canonical enemy pool, including elites and boss summons',()=>{
 const {ENEMIES}=require('../core.js');for(let realm=0;realm<REALMS.length;realm++){const g=new Game('link',realm+60,{mode:'adventure'});g.realm=realm;for(let i=0;i<30;i++){const e=g.spawnRealmEnemy(4,4,i===29);assert.ok(REALMS[realm].enemies.includes(e.enemyId));assert.equal(e.name,ENEMIES[e.enemyId].name);}assert.equal(new Set(REALMS[realm].enemies).size,3);const boss=g.spawnBoss(REALMS[realm].boss);boss.spawnTime=0;boss.intent='summon';boss.windup=.01;g.updateBoss(boss,.02);assert.ok(g.enemies.filter(e=>e.type!=='boss').every(e=>REALMS[realm].enemies.includes(e.enemyId)));}
});
test('stage progress survives travel and checkpoints without unlocking the next level early',()=>{
 const g=new Game('link',44,{mode:'adventure'});for(let i=0;i<5;i++)g.hurtEnemy(g.spawnRealmEnemy(3,0),999);g.travel(7);chooseAll(g);assert.equal(g.stageKills[6],5);g.travelCooldown=0;assert.equal(g.travel(6),true);const restored=Game.fromCheckpoint(g.checkpoint());assert.equal(restored.stageLabel,'1-1');assert.equal(restored.stageKills[6],5);assert.equal(restored.advanceStage(),false);assert.equal(restored.challengeGuardian(),false);assert.throws(()=>Game.fromCheckpoint({...g.checkpoint(),realmStages:[9]}));assert.throws(()=>Game.fromCheckpoint({...g.checkpoint(),stageKills:REALMS.map(()=>-1)}));
});
test('repeated vitality rewards remain valid through the full set of map shrines',()=>{
 const g=new Game('link',3);g.ranks.vitality=5;g.player.maxHp=225;for(const realm of REALMS.map((_,i)=>i))g.activateShrine(realm);const restored=Game.fromCheckpoint(g.checkpoint());assert.equal(restored.rank('vitality'),8);assert.equal(restored.player.maxHp,g.player.maxHp);assert.equal(restored.shrines.size,8);
});
test('graphics, sound, camera and control preferences round-trip with old-save defaults',()=>{
 const {DEFAULT_BINDINGS}=require('../profile.js');const p=new Profile({graphics:'low',sound:true,volume:.3,sensitivity:1.6,invertY:true,cameraFov:65,cameraDistance:45,bindings:{...DEFAULT_BINDINGS,jump:'KeyJ'}});const restored=Profile.import(JSON.stringify(p));assert.equal(restored.graphics,'low');assert.equal(restored.sound,true);assert.equal(restored.volume,.3);assert.equal(restored.sensitivity,1.6);assert.equal(restored.invertY,true);assert.equal(restored.cameraFov,65);assert.equal(restored.cameraDistance,45);assert.equal(restored.bindings.jump,'KeyJ');const old=p.toJSON();for(const key of ['graphics','sensitivity','invertY','cameraFov','cameraDistance','bindings'])delete old[key];assert.equal(Profile.import(JSON.stringify(old)).bindings.jump,'Space');const invalid=p.toJSON();invalid.bindings.jump='KeyW';assert.throws(()=>Profile.import(JSON.stringify(invalid)));assert.equal(new Profile({sensitivity:Infinity,cameraFov:999,cameraDistance:-1}).cameraDistance,18);
});
