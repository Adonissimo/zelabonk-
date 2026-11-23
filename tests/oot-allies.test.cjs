const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,HEROES,Combat,REALMS}=require('../core.js');
const {Profile}=require('../profile.js');

const ids=['impa','saria','darunia','ruto','nabooru'];
const actor=id=>{const g=new Game(id,22,{mode:'training',flatTerrain:true});g.random=()=>.99;return g;};
const rival=(g,x,z)=>{const e=g.spawnEnemy('slime',x,z);e.hp=e.maxHp=1000;e.speed=0;e.attackTimer=999;return e;};
const strike=g=>g.drainEvents().find(event=>event.type==='allyStrike');

test('five OoT allies join the same roster; the new allies unlock through guardian victories',()=>{
  const profile=new Profile();
  assert.deepEqual(Object.keys(HEROES).filter(id=>HEROES[id].ootAlly),ids);
  assert.equal(Object.keys(HEROES).length,11);
  assert.deepEqual(profile.unlocked,['link','zelda','midna']);
  assert.equal(Object.hasOwn(HEROES,'gohma'),false);
  assert.equal(Object.hasOwn(HEROES,'morpha'),false);
  assert.deepEqual(profile.recordGuardian('helmaroc'),['tetra']);
  assert.deepEqual(profile.recordGuardian('gohma'),['saria']);
  assert.deepEqual(profile.recordGuardian('zant'),['sheik','impa']);
  assert.deepEqual(profile.recordGuardian('majora'),['skullkid']);
});

test('all five can train before defeating their guardians and save real runs afterward',()=>{
  for(const id of ids){
    const g=actor(id),hero=HEROES[id];
    assert.match(hero.origin,/^Ocarina of Time/);
    assert.equal(g.rank(hero.weapon),1);assert.ok(Combat.WEAPONS[hero.weapon]);
    assert.equal(g.weaponName(hero.weapon),hero.starterName);
    const rankUp=g.weaponStats(hero.weapon,3,3);assert.ok(rankUp.damage>g.weaponStats(hero.weapon,1).damage);
    const profile=new Profile(),run=new Game(id,22,{mode:'adventure'});
    assert.throws(()=>profile.beginRun(run),/locked/);
    assert.ok(profile.recordGuardian(hero.unlockBoss).includes(id));
    assert.equal(profile.beginRun(run),true);
    const restored=Profile.import(JSON.stringify(profile)).resume();
    assert.equal(restored.hero,id);assert.equal(restored.player.maxHp,hero.hp);assert.equal(restored.rank(hero.weapon),1);
    assert.ok(REALMS.some(realm=>realm.boss==='gohma'));
  }
});

test('Impa aims physical Giant Blade cuts instead of throwing needles, preserving Zelda’s Light Arrows',()=>{
  const g=actor('impa'),front=rival(g,3.2,0),far=rival(g,8,0),behind=rival(g,-3,0);
  g.lockedTarget=front.id;g.updateWeapons(2);
  assert.ok(front.hp<1000);assert.equal(behind.hp,1000);assert.equal(far.hp,1000);
  assert.equal(g.projectiles.length,0);assert.equal(strike(g).kind,'giantBlade');
  assert.equal(g.weaponSchool('leaf'),'physical');
  assert.equal(actor('zelda').weaponName('leaf'),'Light Arrows');
  assert.ok(actor('zelda').weaponStats('leaf').homing);
});

test('Saria fires a clearly borrowed Fairy Slingshot and plays her Song without invented combat magic',()=>{
  const g=actor('saria'),e=rival(g,8,0);
  g.updateWeapons(2);
  assert.match(g.weaponName('nova'),/borrowed|loaned/i);
  assert.equal(g.projectiles[0].art,'slingshot');assert.equal(g.player.attackKind,'slingshot');
  for(let i=0;i<20;i++)g.step(.02);
  assert.ok(e.hp<1000);
  g.player.hp=35;g.energy=100;g.player.invincible=0;const hp=e.hp;
  assert.ok(g.ultimate());assert.equal(g.player.hp,35);assert.equal(e.hp,hp);
  assert.equal(g.player.invincible,0);
  const event=g.drainEvents().find(event=>event.type==='ultimate');
  assert.equal(event.phaseStyle,'ocarinaSong');assert.equal(event.sceneOnly,true);
});

test('Darunia and Nabooru hit up close in the aimed arc, not with sword-wave projectiles',()=>{
  for(const [id,kind]of [['darunia','hammer'],['nabooru','axe']]){
    const g=actor(id),front=rival(g,3.1,0),behind=rival(g,-3.2,0);
    g.lockedTarget=front.id;
    g.updateWeapons(2);
    assert.ok(front.hp<1000);assert.equal(behind.hp,1000);assert.equal(g.projectiles.length,0);
    const step=strike(g);assert.equal(step.kind,kind);assert.ok(step.arc>0&&Number.isFinite(step.facing));
  }
});

test('Ruto releases a forward Zora Scale wave that pushes and wets foes, not a suction field',()=>{
  const g=actor('ruto'),center=rival(g,7,0),near=rival(g,7,2),behind=rival(g,-4,0),far=rival(g,11,0);
  g.lockedTarget=center.id;g.updateWeapons(2);
  const pulse=strike(g);assert.equal(pulse.kind,'rutoWave');assert.equal(pulse.x,0);
  assert.ok(center.hp<1000&&near.hp<1000);assert.ok(center.statuses.wet&&near.statuses.wet);assert.ok(near.knockZ>0);
  assert.equal(behind.hp,1000);assert.equal(far.hp,1000);
  g.energy=100;assert.ok(g.ultimate());
  const ult=g.drainEvents().find(event=>event.type==='ultimate');
  assert.deepEqual({style:ult.phaseStyle,x:ult.x,z:ult.z},{style:'rutoSurge',x:0,z:0});
  g.updatePlayer(.34);assert.ok(far.hp<1000);assert.equal(behind.hp,1000);
});

test('each new character exposes a distinct usable Ultimate without changing boss stats',()=>{
  const styles=[];
  for(const id of ids){
    const g=actor(id);rival(g,4,0);g.energy=100;
    assert.ok(g.ultimate());assert.equal(g.energy,0);assert.equal(g.ultimate(),false);
    const ult=g.drainEvents().find(event=>event.type==='ultimate');
    assert.equal(ult.hero,id);assert.ok(ult.ootAlly);assert.ok(ult.arc>0);styles.push(ult.phaseStyle);
    const boss=g.spawnBoss('gohma');assert.equal(boss.maxHp,480);
  }
  assert.equal(new Set(styles).size,ids.length);
});

test('Impa’s water-charged blade strike stays in front, Darunia jumps and damages nearby enemies only when he lands, and Nabooru’s awakening is a scene',()=>{
  const impa=actor('impa'),target=rival(impa,8,0),untouched=rival(impa,-3,0);
  impa.lockedTarget=target.id;impa.energy=100;assert.ok(impa.ultimate());impa.updatePlayer(.34);
  assert.ok(target.hp<1000);assert.equal(untouched.hp,1000);
  const darunia=actor('darunia'),nearby=rival(darunia,4.5,0),offCourse=rival(darunia,10,0);
  darunia.energy=100;assert.ok(darunia.ultimate());
  assert.equal(darunia.drainEvents().find(e=>e.type==='ultimate').phaseStyle,'goronSlam');
  for(let i=0;i<18;i++)darunia.updatePlayer(.02,{x:1,y:0,glide:true});
  assert.ok(darunia.player.y>3.5);assert.equal(darunia.player.x,0);assert.equal(nearby.hp,1000);
  for(let i=0;i<21;i++)darunia.updatePlayer(.02,{x:1,y:0,glide:true});
  assert.equal(darunia.player.y,0);assert.equal(darunia.player.x,0);assert.equal(darunia.player.canonSlam,null);
  assert.ok(nearby.hp<1000);assert.equal(offCourse.hp,1000);assert.equal(nearby.statuses?.burn,undefined);
  const impact=darunia.drainEvents().filter(e=>e.type==='goronImpact');
  assert.equal(impact.length,1);assert.deepEqual([impact[0].x,impact[0].z],[0,0]);
  const nabooru=actor('nabooru'),front=rival(nabooru,7,0),behind=rival(nabooru,-3,0);
  nabooru.energy=100;assert.ok(nabooru.ultimate());
  assert.equal(nabooru.player.invincible,0);assert.equal(front.hp,1000);assert.equal(behind.hp,1000);
  assert.ok(nabooru.drainEvents().find(e=>e.type==='ultimate').sceneOnly);
});
