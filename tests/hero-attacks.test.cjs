const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {Game}=require('../core.js');
const {PartyGame}=require('../backend/party.cjs');

const arena=(hero)=>{const g=new Game(hero,1,{mode:'training',flatTerrain:true});g.spawnTimer=999;g.random=()=>.99;return g;};
const enemy=(g,x,z)=>{
  const e=g.spawnEnemy('mushroom',x,z);e.speed=0;e.attackTimer=999;e.hp=e.maxHp=1000;return e;
};
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`expected ${a} ≈ ${b}`);
const pointsAt=(shot,target,targetHeight)=>{
  const dx=target.x-shot.x,dz=target.z-shot.z,d=Math.hypot(dx,dz);
  approx(shot.vx,dx/d);approx(shot.vz,dz/d);approx(shot.vy,(targetHeight-shot.y)/d);
};

test('Link aims the sword wave and attack pose at enemies in every world quadrant',()=>{
  for(const [x,z] of [[7,5],[-7,5],[7,-5],[-7,-5]]){
    const g=arena('link');g.cooldowns.ember=0;
    g.groundAt=(x,z)=>Math.hypot(x,z)*.12;
    const target=enemy(g,x,z);g.updateWeapons(.02);
    assert.equal(g.projectiles.length,1);assert.equal(g.projectiles[0].type,'ember');
    pointsAt(g.projectiles[0],target,g.groundAt(x,z)+1);
    approx(g.player.attackFacing,Math.atan2(x,z));assert.equal(g.player.attackKind,'ember');
    const facing=g.player.attackFacing;
    g.updatePlayer(.02,{x:-1,y:0,cameraYaw:0});approx(g.player.attackFacing,facing);
  }
});

test('Zelda nocks arrows separately, converges on the locked enemy, and scores both hits',()=>{
  const g=arena('zelda'),target=enemy(g,-8,11);
  g.lockedTarget=target.id;g.aimMode='manual';g.cameraYaw=-.5;g.cooldowns.leaf=0;
  g.updateWeapons(.02);
  assert.equal(g.projectiles.length,2);assert.notEqual(g.projectiles[0].x,g.projectiles[1].x);
  for(const arrow of g.projectiles){assert.equal(arrow.targetId,target.id);pointsAt(arrow,target,1);}
  approx(g.player.attackFacing,Math.atan2(target.x,target.z));
  for(let i=0;i<55;i++)g.step(.02);
  approx(target.hp,1000-g.weaponStats('leaf').damage*2);
});

test('manual aiming fires parallel to the camera and does not snap toward an off-axis enemy',()=>{
  for(const [hero,type] of [['link','ember'],['zelda','leaf']]){
    const g=arena(hero);enemy(g,-8,1);g.aimMode='manual';g.cameraYaw=Math.PI/3;g.cooldowns[type]=0;
    g.updateWeapons(.02);
    for(const shot of g.projectiles){approx(shot.vx,-Math.sin(g.cameraYaw));approx(shot.vz,-Math.cos(g.cameraYaw));assert.equal(shot.vy,0);assert.equal(shot.targetId,null);}
  }
});

test('Midna executes a short directional shadow cleave instead of spawning a projectile or relic',()=>{
  const g=arena('midna');g.cooldowns.orbit=0;
  const target=enemy(g,2,0),cleave=enemy(g,3,1),behind=enemy(g,-3,0),far=enemy(g,9,0);
  const stats=g.weaponStats('orbit');assert.ok(stats.melee);assert.match(g.weaponSummary('orbit'),/Hair-Hand Strike.*reach/);
  g.updateWeapons(.02);
  approx(target.hp,1000-stats.damage);approx(cleave.hp,1000-stats.damage);
  assert.equal(behind.hp,1000);assert.equal(far.hp,1000);
  assert.equal(g.projectiles.length,0);assert.equal(g.orbitActive,0);assert.equal(g.player.attackKind,'shadow');
  const event=g.drainEvents().find(e=>e.type==='shadowStrike');
  assert.ok(event);approx(event.facing,Math.PI/2);assert.equal(event.arc,stats.arc);assert.equal(event.radius,stats.radius);
  g.updateWeapons(.02);approx(target.hp,1000-stats.damage);
});

test('Midna does not spend her automatic strike on targets outside melee range or above the claw',()=>{
  const g=arena('midna');g.groundAt=x=>x===2?4:0;g.cooldowns.orbit=0;
  const far=enemy(g,10,0),high=enemy(g,2,0);
  g.updateWeapons(.02);assert.equal(g.cooldowns.orbit,-.02);assert.equal(far.hp,1000);assert.equal(high.hp,1000);
  assert.equal(g.drainEvents().some(e=>e.type==='shadowStrike'),false);
  const link=arena('link');link.ranks={orbit:1};link.cooldowns.orbit=0;link.updateWeapons(.02);
  assert.equal(link.orbitActive,4);assert.equal(link.weaponStats('orbit').melee,undefined);
});

test('local party preserves shadow attack ownership and exposes the arrow direction',()=>{
  const a=randomUUID(),b=randomUUID(),g=new PartyGame(randomUUID(),[{id:a,hero:'midna'},{id:b,hero:'zelda'}],{flatTerrain:true,seed:8});
  enemy(g,2,0);g.random=()=>.99;
  g.withActor(a,()=>{g.cooldowns.orbit=0;g.updateWeapons(.02);});
  g.withActor(b,()=>{g.cooldowns.leaf=0;g.updateWeapons(.02);});
  const effect=g.drainEvents().find(e=>e.type==='shadowStrike');
  assert.equal(effect.accountId,a);assert.equal(g.members.get(a).player.attackKind,'shadow');
  assert.equal(g.members.get(b).player.attackKind,'leaf');
  const state=g.publicState(b);
  assert.ok(state.projectiles.every(p=>[p.vx,p.vy,p.vz].every(Number.isFinite)));
});

test('Link at less than full health cuts nearby enemies instead of shooting beams; Spin Attack is circular',()=>{
  const g=arena('link'),close=enemy(g,3,0),behind=enemy(g,-4,0),distant=enemy(g,9,0);
  g.player.hp=g.player.maxHp-1;g.lockedTarget=close.id;g.cooldowns.ember=0;g.updateWeapons(.02);
  assert.equal(g.projectiles.length,0);assert.equal(g.player.attackKind,'sword');
  assert.ok(close.hp<1000);assert.equal(behind.hp,1000);assert.equal(distant.hp,1000);
  assert.equal(g.drainEvents().find(e=>e.type==='allyStrike').kind,'sword');
  g.energy=100;assert.ok(g.ultimate());assert.equal(behind.hp,1000);g.updatePlayer(.46);assert.ok(behind.hp<1000);assert.equal(distant.hp,1000);
  assert.equal(g.drainEvents().find(e=>e.type==='ultimate').canonMove,'spin');
});

test('Zelda seals enemies briefly with golden power without gaining hearts or creating an electric reaction',()=>{
  const g=arena('zelda'),target=enemy(g,7,0);
  g.player.hp=45;g.applyStatus(target,'wet');g.energy=100;assert.ok(g.ultimate());assert.equal(target.hp,1000);g.updatePlayer(.34);
  assert.equal(g.player.hp,45);assert.ok(target.hp<1000);
  assert.ok(target.statuses.seal&&target.statuses.wet);assert.equal(target.statuses.shock,undefined);
  assert.equal(g.reactions,0);
  g.updateWeapons(.2);assert.equal(g.player.attackKind,'seal');
});

test('Tetra fires a directed Water Gun shot rather than a Bomb',()=>{
  const g=arena('tetra'),target=enemy(g,8,-8),offCourse=enemy(g,-5,0);
  g.lockedTarget=target.id;g.energy=100;assert.ok(g.ultimate());
  assert.equal(g.projectiles.length,0);g.updatePlayer(.4);assert.equal(g.projectiles.length,0);g.updatePlayer(.05);
  assert.equal(g.projectiles[0].art,'waterShot');assert.equal(g.projectiles[0].flight,'bolt');pointsAt(g.projectiles[0],target,1);
  assert.equal(g.drainEvents().find(e=>e.type==='ultimate').canonMove,'waterGun');
  assert.equal(target.hp,1000);
  for(let i=0;i<40;i++)g.step(.02);
  assert.ok(target.hp<1000);assert.equal(offCourse.hp,1000);
  assert.ok(!g.drainEvents().some(e=>e.type==='explosion'));
});
test('Skull Kid crashes the Moon onto a fixed aim point after wind-up, never kicks a projectile',()=>{
  const g=arena('skullkid'),target=enemy(g,12,-7),near=enemy(g,13,-6),off=enemy(g,-9,6);
  g.lockedTarget=target.id;g.energy=100;assert.ok(g.ultimate());
  const event=g.drainEvents().find(e=>e.type==='ultimate');
  assert.deepEqual([event.phaseStyle,event.x,event.z,event.release],['moonCrash',12,-7,.85]);
  g.updatePlayer(.8);assert.equal(target.hp,1000);assert.equal(near.hp,1000);
  g.updatePlayer(.06);assert.ok(target.hp<1000&&near.hp<1000);assert.equal(off.hp,1000);
  assert.equal(g.projectiles.length,0);
  const damage=g.damageBySource.ultimate;g.updatePlayer(.2);assert.equal(g.damageBySource.ultimate,damage);
});
