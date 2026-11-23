const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,ADVENTURE_ROUTE}=require('../core.js');
const {Profile}=require('../profile.js');
const playTo=(g,predicate)=>{
  for(let i=0;i<220;i++){
    if(predicate())return;
    if(g.state==='upgrade')g.choose(g.choices[0].id);
    else g.step(.05);
  }
  assert.fail('Expected state transition');
};
const defeat=(g)=>{
  g.realmStages[g.realm]=3;g.stageKills[g.realm]=24;
  assert.equal(g.challengeGuardian(),true);
  g.hurtEnemy(g.boss,1e6);
};
test('guardian victory pauses for map-only results, then continues with the same run',()=>{
  const g=new Game('link',100,{mode:'adventure',reviewMapClears:true});
  assert.equal(g.continueAfterMap(),false);
  g.time=42;g.kills=54;g.damageTaken=9;
  defeat(g);
  playTo(g,()=>g.state==='map-clear');
  const first=g.mapResult;
  assert.deepEqual({...first,time:Math.floor(first.time),damageDealt:Math.round(first.damageDealt)},{realm:6,nextRealm:7,nextIsFinal:false,time:42,kills:55,damageDealt:518,damageTaken:9});
  assert.equal(g.enterRealm(7),false);assert.ok(g.shrines.has(6));assert.equal(g.loot.length,0);
  for(let i=0;i<250;i++)g.step(.05);
  assert.deepEqual(g.mapResult,first);assert.equal(g.realm,6);
  const {runId,ranks}=g;
  assert.equal(g.continueAfterMap(),true);assert.equal(g.continueAfterMap(),false);
  assert.equal(g.realm,7);assert.equal(g.stage,1);assert.equal(g.runId,runId);assert.deepEqual(g.ranks,ranks);
  g.time+=20;g.kills+=12;g.damageTaken+=3;
  defeat(g);playTo(g,()=>g.state==='map-clear');
  assert.equal(g.mapResult.kills,13);assert.equal(g.mapResult.damageTaken,3);
});
test('in-progress victory upgrades and a completed map-results checkpoint both reload safely',()=>{
  const profile=new Profile(),g=new Game('link',102,{mode:'adventure',reviewMapClears:true});
  profile.beginRun(g);
  defeat(g);assert.equal(g.state,'upgrade');assert.equal(profile.saveCheckpoint(g),true);
  const afterFight=Profile.import(JSON.stringify(profile)).resume();
  assert.equal(afterFight.realm,6);assert.equal(afterFight.state,'upgrade');assert.equal(afterFight.landmark.name,'Great Deku Tree');
  playTo(afterFight,()=>afterFight.state==='map-clear');
  assert.equal(profile.saveCheckpoint(afterFight),true);
  const raw=profile.checkpoint,resumed=Profile.import(JSON.stringify(profile)).resume();
  assert.deepEqual(resumed.mapResult,afterFight.mapResult);
  assert.equal(resumed.continueAfterMap(),true);assert.equal(resumed.realm,7);
  assert.throws(()=>Game.fromCheckpoint({...raw,awaitingMapClear:false}));
  assert.throws(()=>Game.fromCheckpoint({...raw,mapStart:{...raw.mapStart,kills:1000}}));
});
test('the eighth map offers the Ganondorf finale, which retains its separate campaign win',()=>{
  const g=new Game('link',103,{mode:'adventure',reviewMapClears:true});
  for(const realm of ADVENTURE_ROUTE.slice(0,-1))g.activateShrine(realm);
  g.alignAdventure();defeat(g);playTo(g,()=>g.state==='map-clear');
  assert.equal(g.mapResult.nextIsFinal,true);
  assert.equal(g.continueAfterMap(),true);assert.equal(g.realm,0);assert.equal(g.landmark,null);
  playTo(g,()=>g.boss?.bossId==='ganondorf');
  g.hurtEnemy(g.boss,1e6);assert.equal(g.state,'won');assert.equal(g.mapResult,null);
});
