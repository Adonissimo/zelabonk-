const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,REALMS,GATES,UPGRADES}=require('../core.js');
const advance=(g,seconds,input={x:0,y:0})=>{for(let i=0;i<Math.round(seconds/.02);i++){g.step(.02,input);g.drainEvents();}};

test('movement is normalized and stays inside the arena',()=>{
  const a=new Game('pip',1),b=new Game('pip',1);a.step(.05,{x:1,y:0});b.step(.05,{x:1,y:1});
  assert.ok(Math.abs(Math.hypot(a.player.x,a.player.z)-Math.hypot(b.player.x,b.player.z))<1e-10);
  a.player.x=65;a.player.z=-65;a.step(.05,{x:1,y:0});assert.equal(a.player.x,65);assert.equal(a.player.z,-65);
});
test('pause and upgrade states freeze all simulation clocks',()=>{
  const g=new Game('pip',2);g.pause();advance(g,2);assert.equal(g.time,0);g.resume();g.collect(100);assert.equal(g.state,'upgrade');const xp=g.xp;advance(g,3);assert.equal(g.time,0);assert.equal(g.xp,xp);
});
test('XP overflow queues levels without losing experience',()=>{
  const g=new Game('pip',2);g.collect(100);let spent=12,levels=1;
  while(g.state==='upgrade'){const before=g.xpNeed;assert.ok(g.choose(g.choices[0].id));levels++;if(g.state==='upgrade')spent+=before;}
  assert.equal(g.level,levels);assert.equal(g.xp,100-spent);assert.ok(g.xp<g.xpNeed);
});
test('upgrade choice validates state and the offered choice',()=>{
  const g=new Game();assert.equal(g.choose('power'),false);g.collect(12);const before={...g.ranks};assert.equal(g.choose('unknown'),false);assert.deepEqual(g.ranks,before);assert.equal(new Set(g.choices.map(x=>x.id)).size,g.choices.length);
});
test('dash has a cooldown and prevents incoming damage',()=>{
  const g=new Game();assert.equal(g.dash(),true);assert.equal(g.dash(),false);g.hurtPlayer(50);assert.equal(g.player.hp,100);assert.ok(g.player.dashCooldown>0);advance(g,.4,{x:1,y:0});assert.ok(Math.hypot(g.player.x,g.player.z)>3);
});
test('an enemy death awards one kill and one shard',()=>{
  const g=new Game(),e=g.spawnEnemy('slime',3,3);g.hurtEnemy(e,999);g.hurtEnemy(e,999);assert.equal(g.kills,1);assert.equal(g.shards.length,1);assert.equal(g.shards[0].value,2);
});
test('leaving shards behind bounds their count while preserving XP',()=>{
  const g=new Game('pip',22);for(let i=0;i<500;i++){const e=g.spawnEnemy('slime',i%25,Math.floor(i/25));g.hurtEnemy(e,1e6);g.enemies=[];}assert.equal(g.shards.length,350);assert.equal(g.shards.reduce((n,s)=>n+s.value,0),1000);
});
test('all six realms form a symmetric connected network',()=>{
  const seen=new Set([0]),queue=[0];while(queue.length){const i=queue.shift();assert.equal(REALMS[i].links.length,GATES.length);for(const j of REALMS[i].links){assert.ok(REALMS[j].links.includes(i));if(!seen.has(j)){seen.add(j);queue.push(j);}}}assert.equal(seen.size,6);
});
test('gates preserve the run, bank shards once, and enforce adjacency',()=>{
  const g=new Game('pip',7);g.time=77;g.player.hp=62;g.ranks.power=2;g.shards=[{id:1,x:12,z:0,value:4}];assert.equal(g.travel(2),false);assert.equal(g.travel(1),true);assert.equal(g.time,77);assert.equal(g.player.hp,62);assert.equal(g.rank('power'),2);assert.equal(g.xp,4);assert.equal(g.shards.length,0);assert.equal(g.travel(0),false);assert.ok(g.visited.has(1));
});
test('a shrine applies exactly one blessing in each realm',()=>{
  const g=new Game();g.player.z=-7;assert.equal(g.interact(),true);assert.equal(g.rank('magnet'),1);assert.equal(g.interact(),false);assert.equal(g.shrines.size,1);g.travelCooldown=0;g.travel(1);g.player.z=-7;g.player.hp=50;g.interact();assert.equal(g.player.maxHp,125);assert.equal(g.player.hp,85);
});
test('jump and glide consume stamina then land',()=>{
  const g=new Game();g.spawnTimer=100;assert.equal(g.jump(),true);assert.equal(g.jump(),false);advance(g,.6,{x:1,y:0,glide:true});assert.ok(g.player.y>0);assert.equal(g.player.gliding,true);assert.ok(g.player.stamina<1);advance(g,5,{x:1,y:0,glide:true});assert.equal(g.player.y,0);assert.equal(g.player.gliding,false);
});
test('the Warden spawns once at four minutes and follows gates with persistent HP',()=>{
  const g=new Game();g.time=239.99;g.spawnTimer=100;g.step(.02);assert.ok(g.boss);assert.equal(g.bossSpawned,true);const boss=g.boss;g.hurtEnemy(boss,123);const hp=boss.hp;assert.equal(g.travel(1),true);assert.equal(g.boss,boss);assert.equal(g.boss.hp,hp);assert.ok(g.enemies.includes(boss));g.step(.02);assert.equal(g.enemies.filter(e=>e.type==='boss').length,1);
});
test('victory and defeat are terminal and cannot award duplicate results',()=>{
  const g=new Game();g.time=240;g.step(.02);g.hurtEnemy(g.boss,1e9);assert.equal(g.state,'won');const t=g.time;g.hurtEnemy(g.boss,1e9);g.step(.02);assert.equal(g.time,t);assert.equal(g.kills,1);
  const h=new Game();h.hurtPlayer(1000);assert.equal(h.state,'lost');h.resume();h.step(.05);assert.equal(h.state,'lost');assert.equal(h.player.hp,0);
});
test('weapons damage enemies, levels offer bounded ranks, and simulation is reproducible',()=>{
  function run(){const g=new Game('pip',912);g.player.maxHp=g.player.hp=100000;for(let frame=0;frame<12000;frame++){if(g.state==='upgrade')g.choose(g.choices[0].id);g.step(.02,{x:Math.sin(frame/150)*.6,y:Math.cos(frame/150)*.6});g.drainEvents();}assert.ok(g.kills>10);assert.ok(g.damageDealt>100);assert.ok(g.bossSpawned);for(const u of UPGRADES)assert.ok(g.rank(u.id)<=u.max);assert.ok(g.enemies.length<=171);return[g.time,g.kills,g.level,g.damageDealt,g.xp];}
  assert.deepEqual(run(),run());
});
