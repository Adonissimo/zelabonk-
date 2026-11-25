const test=require('node:test'),assert=require('node:assert/strict');
const {Game,Terrain,HEROES}=require('../core.js');
const {KOKIRI_REALM:FOREST,ZORA_REALM:ZORA,GREAT_SEA_REALM:SEA,VILLAGE,ZORA_FOUNTAIN}=Terrain;
const input={x:1,y:0,cameraYaw:0};
function run(hero,realm,stage=1,flatTerrain=false){
  const g=new Game(hero,14,{mode:'survival',realm,flatTerrain});
  g.realmStages[realm]=stage;
  g.spawnTimer=10000;
  for(const k in g.cooldowns)g.cooldowns[k]=10000;
  return g;
}
function place(g,x,z,y=0){Object.assign(g.player,{x,z,ground:g.groundAt(x,z),y,vy:0,dash:0,gliding:false});}
function travel(g,x,z,steps=7){
  place(g,x,z);
  for(let i=0;i<steps;i++)g.step(.05,input);
  assert.equal(g.state,'running');
  return (g.player.x-x)/(steps*.05*HEROES[g.hero].speed*g.stats.moveSpeed);
}
test('movement through wet ground is slower, except Midna/Skull Kid float and Ruto accelerates',()=>{
  const points=[[ZORA,21,-30],[FOREST,-22.9,16.4],[SEA,27,0]];
  for(const [realm,x,z] of points)for(const stage of [1,2,3]){
    const ratios={};
    for(const hero of ['link','zelda','darunia','midna','skullkid','ruto']){
      const g=run(hero,realm,stage);
      assert.ok(g.waterAt(x,z),'authored water is in contact at '+realm+':'+stage);
      ratios[hero]=travel(g,x,z,3);
    }
    for(const hero of ['link','zelda','darunia']){
      assert.ok(ratios[hero]>.73&&ratios[hero]<.87,JSON.stringify({realm,stage,hero,ratios}));
    }
    for(const hero of ['midna','skullkid'])assert.ok(Math.abs(ratios[hero]-1)<1e-9);
    assert.ok(ratios.ruto>1.16&&ratios.ruto<1.35,JSON.stringify({realm,stage,ratios}));
  }
});

test('dry paths, raised bridge, pier, and a guardian platform do not trigger water',()=>{
  for(const stage of [1,2,3]){
    const f=run('link',FOREST,stage),z=run('link',ZORA,stage),s=run('link',SEA,stage);
    assert.equal(f.waterAt(-16,VILLAGE.bridge.z),null);
    assert.equal(s.waterAt(24,-24),null,'visible diagonal pier is dry');
    assert.equal(s.waterAt(40,43),null,'do not wade on sand past the painted shoreline');
    for(const x of [2,4,6])assert.equal(z.waterAt(x,-30),null,'dry causeway');
    assert.equal(z.waterAt(ZORA_FOUNTAIN.jabu.x,ZORA_FOUNTAIN.jabu.z),null);
    assert.ok(Math.abs(travel(f,-17,VILLAGE.bridge.z,4)-1)<1e-9);
    assert.ok(Math.abs(travel(z,1,0)-1)<1e-9);
    z.landmarkActive=true;
    assert.equal(z.waterAt(21,-16),null,'temple platform is dry, not the exterior map');
  }
  assert.equal(run('link',ZORA,1,true).waterAt(21,-30),null,'flat mode does not invent a basin');
});
test('jumping/gliding over water has no movement modifier; landing resumes wading',()=>{
  for(const hero of ['link','ruto']){
    const g=run(hero,ZORA);
    place(g,20,-29,2);
    g.player.vy=-.2;
    const base=HEROES[hero].speed*g.stats.moveSpeed;
    g.step(.05,{...input,glide:true});
    assert.ok(g.player.gliding);
    assert.ok(Math.abs((g.player.x-20)/.05/base-1.30)<1e-8);
    place(g,20,-29,.25);
    g.player.vy=-.2;
    assert.ok(g.waterAt(20,-29,g.player.ground+g.player.y));
    g.step(.05,{...input,glide:true});
    assert.equal(g.player.gliding,false,'glide cannot continue below the surface');
    place(g,20,-29,.9);
    const landX=g.player.x;
    g.step(.05,input);
    assert.ok(Math.abs((g.player.x-landX)/.05/base-1)<1e-8);
    for(let i=0;i<15;i++)g.step(.05);
    const before=g.player.x;
    const wet=g.waterMotion(hero,g.player.x,g.player.z,g.player.ground+g.player.y);
    assert.ok(wet,'contact is restored on landing');
    g.step(.05,input);
    assert.ok(Math.abs((g.player.x-before)/.05/base-wet.speed)<1e-8);
  }
});
test('recruited companions use their own wading speeds, not the leader’s',()=>{
  const speed=(index,wet)=>{
    const g=new Game('link',21,{mode:'adventure',reviewMapClears:true});
    g.realm=SEA;g.spawnTimer=10000;g.shrines.add(index);
    const z=wet?4:45;
    place(g,33,z);
    Object.assign(g.player,{facing:0});
    const a=g.companions[0];assert.ok(a);
    Object.assign(a,{x:28,z:z-2.45,y:g.groundAt(28,z-2.45)});
    g.step(.05);
    return a.x-28;
  };
  const each=[[FOREST,'saria'],[ZORA,'ruto'],[5,'skullkid']];
  for(const [i,hero] of each){
    const wet=speed(i,true),dry=speed(i,false);
    assert.ok(dry>.1,JSON.stringify({hero,wet,dry}));
    if(hero==='saria')assert.ok(wet<dry);
    if(hero==='ruto')assert.ok(wet>dry);
    if(hero==='skullkid')assert.equal(wet,dry);
  }
});

test('crossing the same shoreline restores normal movement after getting out',()=>{
  for(const hero of ['link','ruto']){
    const g=run(hero,SEA,1);
    const z=0,start=Terrain.seaShoreX(1,z)-.85;
    place(g,start,z);
    const base=g.player.speed*g.stats.moveSpeed;
    assert.equal(g.waterAt(start,z),null);
    const ratios=[];
    for(const dir of [1,-1]){
      for(let i=0;i<13;i++){
        const p=g.player,oldX=p.x;
        const contact=g.waterMotion(hero,oldX,p.z,p.ground+p.y);
        g.step(.05,{...input,x:dir});
        const actual=(p.x-oldX)*dir/(base*.05);
        assert.ok(Math.abs(actual-(contact?.speed??1))<1e-7);
        ratios.push(actual);
      }
    }
    assert.ok(ratios.some(r=>hero==='ruto'?r>1.1:r<.88));
    assert.ok(Math.abs(ratios.at(-1)-1)<1e-7);
    assert.equal(g.player.hp,g.player.maxHp);
  }
});
