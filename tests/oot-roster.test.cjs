const {test}=require('node:test'),assert=require('node:assert/strict');
const {Game,HEROES,BOSSES}=require('../core.js'),{Profile}=require('../profile.js');
const originals=['link','zelda','midna','tetra','sheik','skullkid'];
const allies=['impa','saria','darunia','ruto','nabooru'];
test('roster has the original heroes plus five Ocarina allies, and no bosses',()=>{
  assert.deepEqual(Object.keys(HEROES).sort(),[...originals,...allies].sort());
  assert.ok(allies.every(id=>HEROES[id].ootAlly===true));
  assert.ok(Object.keys(BOSSES).every(id=>!Object.hasOwn(HEROES,id)));
});
test('older saves apply only previously earned guardian unlocks and preserve checkpoints',()=>{
  const p=new Profile({guardians:['helmaroc','gohma','morpha']});
  p.beginRun(new Game('tetra',40,{mode:'adventure',runId:'old-save'}));
  const data=Profile.import(JSON.stringify(p));
  assert.equal(data.resume().hero,'tetra');
  assert.deepEqual(data.unlocked,['link','zelda','midna','tetra','sheik','saria','ruto']);
  assert.ok(!data.unlocked.includes('skullkid')&&!data.unlocked.includes('impa'));
  const p2=new Profile();
  for(const id of allies){
    const game=new Game(id,42,{mode:'survival',realm:7,runId:'new-'+id});
    p2.recordGuardian(HEROES[id].unlockBoss);p2.beginRun(game,p2.checkpoint?.runId??null);
    const resumed=Profile.import(JSON.stringify(p2)).resume();
    assert.equal(resumed.hero,id);
    assert.equal(resumed.rank(HEROES[id].weapon),1);
    assert.equal(resumed.realm,7);
  }
});

test('a run made with an ally before the unlock update can resume without granting free future selection',()=>{
  const oldRun=new Game('ruto',12,{mode:'adventure',runId:'pre-unlock-ruto'});
  const p=new Profile({checkpoint:oldRun.checkpoint()});
  assert.equal(p.resume().hero,'ruto');
  assert.equal(p.unlocked.includes('ruto'),false);
  assert.throws(()=>p.beginRun(new Game('ruto',13,{mode:'adventure'}),oldRun.runId),/locked/);
});

test('each milestone unlocks its exact ally once; Training boss victories grant no recruits',()=>{
  const expected={gohma:'saria',morpha:'ruto',kingbulblin:'nabooru',zant:'impa',colgera:'darunia'};
  const p=new Profile();
  for(const [boss,id]of Object.entries(expected)){
    assert.ok(!p.unlocked.includes(id));
    const g=new Game('link',22,{mode:'training'}),e=g.spawnBoss(boss);
    g.hurtEnemy(e,1e6);
    assert.equal(g.shrines.size,0);
    assert.equal(g.drainEvents().some(event=>event.type==='guardian'),false);
    assert.deepEqual(p.recordGuardian(boss).filter(hero=>HEROES[hero].ootAlly),[id]);
    assert.deepEqual(p.recordGuardian(boss),[]);
    assert.ok(p.unlocked.includes(id));
  }
});
