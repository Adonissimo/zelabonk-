const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {Game,HEROES,clamp}=require('../core.js');
const THREE=require('../vendor/three.min.js');
const Terrain=require('../terrain.js');

const split=event=>event.impactSize>0;
const step=(game,n)=>{for(let i=0;i<n;i++)game.step(.02,{x:0,y:0});};
test('Moon Crash leaves a moon-sized fissure at the locked target only on impact',()=>{
  const game=new Game('skullkid',123,{mode:'training',flatTerrain:true});
  const enemy=game.spawnEnemy('slime',4,-5);enemy.dummy=true;
  game.energy=100;
  assert.equal(game.ultimate(),true);
  const cast=game.drainEvents().find(e=>e.type==='ultimate');
  assert.equal(cast.phaseStyle,'moonCrash');
  step(game,40);
  assert.equal(game.drainEvents().some(split),false);
  step(game,3);
  const impacts=game.drainEvents().filter(split);
  assert.equal(impacts.length,1);
  assert.deepEqual(impacts[0],{type:'groundImpact',style:'moonCrash',x:cast.x,z:cast.z,impactSize:HEROES.skullkid.ultimateRadius*1.5});
  step(game,25);
  assert.equal(game.drainEvents().some(e=>e.type==='groundImpact'),false);
});

test('Darunia makes a small fissure grounded and a larger one only when his slam lands',()=>{
  const g=new Game('darunia',123,{mode:'training',flatTerrain:true});
  g.aimMode='manual';
  const hammer=g.weaponStats('ember');
  g.meleeStrike('ember',hammer);
  assert.equal(g.drainEvents().find(e=>e.kind==='hammer').impactSize,1.85);
  g.player.y=2;
  g.meleeStrike('ember',hammer);
  assert.equal(g.drainEvents().some(split),false);
  g.energy=100;
  assert.equal(g.ultimate(),true);
  step(g,36);
  assert.equal(g.drainEvents().some(split),false);
  step(g,3);
  const slam=g.drainEvents().find(e=>e.type==='goronImpact');
  assert.equal(g.player.y,0);
  assert.equal(slam.impactSize,5.2);
  assert.equal(slam.x,g.player.x);
  assert.equal(slam.z,g.player.z);
  step(g,15);
  assert.equal(g.drainEvents().some(e=>e.type==='goronImpact'),false);
});

test('only tagged ground hazards crack on resolution and bomb fissures are smaller than a hammer',()=>{
  const g=new Game('link',123,{mode:'training',flatTerrain:true});
  g.addHazard(3,4,4,.04,2,5);
  g.addHazard(5,6,4,.04,2);
  step(g,1);
  assert.equal(g.drainEvents().some(split),false);
  step(g,1);
  assert.deepEqual(g.drainEvents().filter(split),[{type:'slam',x:3,z:4,impactSize:5}]);
  g.explode({x:2,z:-2});
  assert.equal(g.drainEvents().find(split).impactSize,1.4);
});

const src=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const impl=src.slice(src.indexOf('  class WorldView'),src.indexOf('  function currentDialog'));
function view(reducedMotion=false,graphics='balanced'){
  const type=vm.runInNewContext(impl+'\nWorldView',{THREE,clamp,reducedMotion,storage:{graphics}});
  const v=Object.create(type.prototype);
  v.entities=new THREE.Group();v.effects=[];
  v.groundHeight=(x,z)=>Terrain.height(6,3,x,z);
  return v;
}

test('crack width and reach increase with object size and all vertices follow sloping terrain',()=>{
  const v=view();
  const radii=[];
  for(const impactSize of [1.85,5.2,10.65]){
    const e=v.groundCrack({x:33,z:-37,impactSize});
    const vertices=e.geometry.getAttribute('position');
    assert.equal(vertices.count,e.vertexCount);
    let r=0;
    for(let i=0;i<vertices.count;i++){
      const [x,y,z]=[vertices.getX(i),vertices.getY(i),vertices.getZ(i)];
      assert.ok(Math.abs(y-v.groundHeight(x,z)-.043)<.00005);
      r=Math.max(r,Math.hypot(x-33,z+37));
    }
    radii.push(r);
  }
  assert.ok(radii[0]*2<radii[1]&&radii[1]*1.7<radii[2]);
  assert.ok(v.effects[0].vertexCount<v.effects[1].vertexCount&&v.effects[1].vertexCount<v.effects[2].vertexCount);
});

test('delayed cracks grow and fade, reduced motion reveals the full stationary crack, and geometry is disposed',()=>{
  const normal=view(),reduced=view(true,'low');
  const event={x:0,z:0,impactSize:5.2,style:'goronSlam'};
  const a=normal.groundCrack(event,.19),b=reduced.groundCrack(event);
  assert.equal(a.mesh.visible,false);
  const initial=a.geometry.drawRange.count;
  a.time=a.duration-.45;
  normal.positionGroundCrack(a);
  assert.equal(a.mesh.visible,true);
  assert.ok(a.geometry.drawRange.count>initial);
  assert.equal(b.geometry.drawRange.count,b.vertexCount);
  b.time=.1;reduced.positionGroundCrack(b);
  assert.equal(b.geometry.drawRange.count,b.vertexCount);
  assert.ok(b.material.opacity<.2);
  let released=0;
  for(const t of [a.material,a.geometry])t.addEventListener('dispose',()=>released++);
  normal.disposeEffect(a);
  assert.equal(released,2);
});

test('low graphics keep a capped number of decals and clip them to the walkable landmark',()=>{
  const v=view(true,'low');v.landmark={limit:22};v.groundHeight=()=>0;
  const moon=v.groundCrack({x:21.5,z:-19,impactSize:10.65,style:'moonCrash'});
  for(let i=0;i<24;i++)v.groundCrack({x:i%4,z:i%5,impactSize:1.85});
  assert.equal(v.effects.length,9);
  assert.equal(v.entities.children.length,9);
  assert.ok(v.effects.includes(moon));
  const xyz=moon.geometry.getAttribute('position');
  for(let i=0;i<xyz.count;i++)assert.ok(Math.abs(xyz.getX(i))<=22&&Math.abs(xyz.getZ(i))<=22);
});
