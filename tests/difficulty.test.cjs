const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game}=require('../core.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('normal runs add modest enemy health and speed while preserving hit damage and training baselines',()=>{
  const normal=new Game('link',1,{mode:'adventure'}),training=new Game('link',1,{mode:'training'});
  for(const species of ['slime','mushroom','bat','boar']){
    const baseline=training.spawnEnemy(species,8,8),enemy=normal.spawnEnemy(species,8,8);
    close(enemy.maxHp/baseline.maxHp,1.05);close(enemy.speed/baseline.speed,1.05);assert.equal(enemy.damage,baseline.damage);
  }
  const baseline=training.spawnBoss('gohma'),boss=normal.spawnBoss('gohma');
  close(boss.maxHp/baseline.maxHp,1.08);assert.equal(boss.damage,baseline.damage);assert.equal(boss.spawnTime,.8);
});

test('Hard retains its health and damage modifiers above the new normal baseline',()=>{
  const normal=new Game('link',1,{mode:'adventure'}),hard=new Game('link',1,{mode:'adventure',difficulty:'hard'});
  const a=normal.spawnEnemy('boar',8,8),b=hard.spawnEnemy('boar',8,8);
  close(b.maxHp/a.maxHp,1.35);close(b.damage/a.damage,1.25);assert.equal(a.speed,b.speed);
  close(hard.spawnBoss('gohma').maxHp/normal.spawnBoss('gohma').maxHp,1.35);
});

test('slightly tougher enemies retain key early-game two-hit breakpoints',()=>{
  const link=new Game('link',1,{mode:'adventure'}),skullkid=new Game('skullkid',1,{mode:'adventure'});
  assert.equal(Math.ceil(link.spawnEnemy('mushroom',8,8).maxHp/link.weaponStats('ember').damage),2);
  assert.equal(Math.ceil(skullkid.spawnEnemy('boar',8,8).maxHp/skullkid.weaponStats('nova').damage),2);
});

test('early waves arrive a little faster, pause freezes pressure, and training remains manual',()=>{
  const game=new Game('link',1,{mode:'adventure'});game.spawnTimer=0;game.step(.02);
  assert.ok(game.spawnTimer>.76&&game.spawnTimer<.77);assert.equal(game.enemies.length,1);
  const delay=game.spawnTimer;game.pause();game.step(.05);assert.equal(game.spawnTimer,delay);
  const training=new Game('link',1,{mode:'training'});for(let i=0;i<100;i++)training.step(.02);assert.equal(training.enemies.length,0);
});
