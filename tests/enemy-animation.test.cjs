const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,BOSSES}=require('../core.js');
const demo=()=>{
 const g=new Game('link',30,{flatTerrain:true});
 g.spawnTimer=999;g.ranks={};g.player.hp=g.player.maxHp=10000;
 return g;
};
test('ranged enemies hold a visible wind-up and follow-through when a shot fires',()=>{
 const g=demo(),e=g.spawnEnemy('mushroom',4,0);e.attackTimer=.40;
 g.step(.05);assert.equal(e.action,'windup');assert.equal(e.actionAge,0);assert.equal(e.actionDuration,.45);
 for(let i=0;i<8;i++)g.step(.05);
 const shot=g.drainEvents().find(v=>v.type==='enemyStrike');
 assert.equal(shot.kind,'spit');assert.ok(Math.abs(shot.facing+Math.PI/2)<1e-10);
 assert.equal(e.action,'attack');assert.ok(g.projectiles.some(p=>p.hostile&&p.vx<0));
 g.step(.05);assert.equal(e.action,'attack');assert.ok(e.actionAge>0);
});
test('melee enemies finish a telegraphed swipe even if the hero has stepped away',()=>{
 const g=demo(),e=g.spawnEnemy('boar',1.5,0);e.attackTimer=0;
 g.step(.05);assert.equal(e.action,'windup');assert.equal(e.actionDuration,.48);
 g.player.x=-9;
 for(let i=0;i<10;i++)g.step(.05);
 assert.equal(e.action,'attack');assert.equal(g.player.hp,10000);
 assert.equal(g.drainEvents().find(v=>v.type==='enemyStrike').kind,'swipe');
 g.step(.05);assert.equal(e.action,'attack');
});
test('flyers and slimes signal different contact attacks without emitting on every frame',()=>{
 for(const [type,kind] of [['bat','dive'],['slime','lunge']]){
  const g=demo(),e=g.spawnEnemy(type,1.6,0);e.speed=0;
  g.step(.05);assert.equal(e.action,'windup');
  e.x=.4;for(let i=0;i<8;i++)g.step(.05);
  assert.deepEqual(g.drainEvents().filter(v=>v.type==='enemyStrike').map(v=>v.kind),[kind]);
  assert.ok(g.player.hp<g.player.maxHp);
 }
});
test('each boss publishes the chosen wind-up, attack intent and phase with a full follow-through',()=>{
 for(const id of Object.keys(BOSSES)){
  const g=demo(),e=g.spawnBoss(id,true);e.spawnTime=0;e.attackTimer=0;e.hp=e.maxHp*.25;
  g.updateBoss(e,.02);
  assert.equal(e.action,'windup');assert.equal(e.actionAge,0);
  assert.ok(e.actionDuration>.6);assert.ok(BOSSES[id].patterns.includes(e.intent));
  while(e.windup>0)g.updateBoss(e,.05);
  assert.equal(e.action,'attack');assert.equal(e.actionAge,0);assert.ok(e.actionDuration>=.43);
  const strike=g.drainEvents().find(event=>event.type==='enemyStrike');
  assert.equal(strike.bossId,id);assert.equal(strike.kind,e.intent);assert.equal(strike.stage,3);assert.ok(Number.isFinite(strike.facing));
 }
});
