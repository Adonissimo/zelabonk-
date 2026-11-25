const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,Terrain,STAGE_TARGETS}=require('../core.js');
const {Profile}=require('../profile.js');

const forward={x:0,y:1,cameraYaw:0};
function ticks(g,seconds,input){for(let i=0;i<Math.round(seconds/.02);i++)g.step(.02,input);}
function settle(g,until,input){
  for(let i=0;i<1200&&!until();i++){if(g.state==='upgrade')g.choose(g.choices[0].id);else g.step(.02,input);}
  assert.ok(until(),'Expected run transition');
}
function enterRun(hero='link'){
  const g=new Game(hero,84,{mode:'adventure',reviewMapClears:true});
  g.realmStages[6]=3;g.stageKills[6]=STAGE_TARGETS[2];
  assert.ok(g.challengeGuardian());return g;
}

test('Kokiri Adventure handles a real root-wall bypass attempt before Link can reach the guardian',()=>{
  const g=enterRun();assert.equal(g.landmarkApproach,true);assert.equal(g.boss,null);
  assert.equal(g.landmark.name,'Great Deku Tree');assert.equal(g.challengeGuardian(),false);
  const start=g.player.z;
  // Idle does not launch combat; sprint and jump into the side wall with glider held.
  ticks(g,3);assert.equal(g.player.z,start);assert.deepEqual(g.enemies,[]);
  ticks(g,.25,{x:1,y:0,cameraYaw:0});assert.ok(g.jump());assert.ok(g.dash());
  ticks(g,1,{x:1,y:0,glide:true,cameraYaw:0});
  assert.ok(g.player.x<=Terrain.DEKU_ENTRANCE.halfWidth-g.player.radius+.01);
  assert.equal(g.player.z,start);assert.equal(g.boss,null);
  settle(g,()=>!!g.boss,forward);
  assert.equal(g.boss.bossId,'gohma');assert.equal(g.boss.gohmaTrial,true);assert.equal(g.landmarkApproach,false);
  const entries=g.drainEvents().filter(e=>['landmarkEnter','boss'].includes(e.type));
  assert.deepEqual(entries.map(e=>e.type),['landmarkEnter','boss']);
});

test('ground warning strikes its actual footprint and only then reveals Gohma’s eye',()=>{
  const g=enterRun();settle(g,()=>!!g.boss,forward);g.cooldowns.ember=999;g.player.invincible=0;
  const boss=g.boss;const closed=g.hurtEnemy(boss,10);
  settle(g,()=>g.hazards.length>0);
  const first=g.hazards[0],hp=g.player.hp;
  assert.equal(boss.intent,'slam');assert.equal(boss.exposure,0);
  assert.equal(first.x,g.player.x);assert.ok(Math.abs(first.z-g.player.z)<.15);
  // Stay put for the first demonstration: the mark is not a cosmetic ring.
  settle(g,()=>first.fired);
  assert.ok(g.player.hp<hp);assert.ok(boss.exposure>0);
  const open=g.hurtEnemy(boss,10);assert.ok(open>closed*3);
  assert.equal(g.drainEvents().filter(e=>e.type==='gohmaExpose').length,1);
  g.player.invincible=0;settle(g,()=>g.hazards.some(h=>!h.fired));
  assert.equal(boss.intent,'landmark');const before=g.player.hp;
  // Dodge horizontally beyond all previously fixed mark centers.
  ticks(g,1.32,{x:1,y:0,cameraYaw:0});
  assert.equal(g.player.hp,before);assert.ok(boss.exposure>0);
});

test('rescue owns the post-defeat beat before upgrade/results and preserves a saved checkpoint',()=>{
  const g=enterRun();settle(g,()=>!!g.boss,forward);
  const profile=new Profile();const finishedAt=g.time;
  g.addHazard(g.player.x,g.player.z,10,1,10000);
  g.hurtEnemy(g.boss,1e6);const position={x:g.player.x,z:g.player.z};
  const events=g.drainEvents(),rescue=events.find(e=>e.type==='sariaRescue');
  assert.ok(rescue?.duration>=3);assert.equal(g.sariaRescue,true);assert.equal(g.state,'running');
  assert.equal(g.hazards.length,0);assert.equal(g.dash(),false);assert.equal(g.jump(),false);
  assert.equal(events.some(e=>e.type==='companionJoin'),false);
  for(const event of events)if(event.type==='guardian')profile.recordGuardian(event.id);
  assert.deepEqual(g.companions.map(c=>c.hero),['saria']);assert.ok(profile.unlocked.includes('saria'));
  ticks(g,1,{x:1,y:1,cameraYaw:0});assert.deepEqual({x:g.player.x,z:g.player.z},position);
  assert.equal(g.sariaRescue,true);assert.equal(g.mapResult,null);
  const resumed=Game.fromCheckpoint(JSON.parse(JSON.stringify(g.checkpoint())));
  settle(resumed,()=>resumed.state==='map-clear');
  assert.equal(resumed.mapResult.companion,'saria');assert.equal(resumed.mapResult.time,finishedAt);
  settle(g,()=>g.state==='map-clear');
  assert.equal(g.mapResult.time,finishedAt);assert.equal(g.mapResult.companion,'saria');
  assert.equal(g.drainEvents().filter(e=>e.type==='companionJoin'&&e.scene).length,1);
  assert.ok(g.continueAfterMap());assert.equal(g.realm,7);assert.equal(g.companions[0].hero,'saria');
});
