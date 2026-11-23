const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {HEROES}=require('../core.js'),THREE=require('../vendor/three.min.js');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const app=read('app.js');
const viewSource=app.slice(app.indexOf('  class WorldView'),app.indexOf('  function currentDialog'));
const makeView=reducedMotion=>vm.runInNewContext(viewSource+'\nWorldView',{
  reducedMotion,THREE,BonkCamera:{direction:()=>0},
  RelicArt:{animationFrame:()=>0,material:()=>new THREE.SpriteMaterial()},
});
test('Skull Kid hovers visibly and retained reduced-motion height does not bob',()=>{
  const Normal=makeView(false),Reduced=makeView(true);
  const view=Object.create(Normal.prototype),reduced=Object.create(Reduced.prototype);
  assert.equal(view.heroHoverLift('link',1),0);
  assert.equal(view.heroHoverLift('skullkid',1,true),0);
  assert.ok(view.heroHoverLift('skullkid',0)>.6);
  assert.notEqual(view.heroHoverLift('skullkid',0),view.heroHoverLift('skullkid',1));
  assert.equal(reduced.heroHoverLift('skullkid',0),reduced.heroHoverLift('skullkid',1));
  assert.ok(reduced.heroHoverLift('skullkid',0)>.6);
});
test('a Skull Kid companion floats visually without lifting its ground position or other allies',()=>{
  const View=makeView(false),view=Object.create(View.prototype);
  view.camera=new THREE.PerspectiveCamera();
  const group=new THREE.Group();
  group.userData={sprite:new THREE.Sprite(),pip:new THREE.Object3D()};
  const entry={x:4,y:2,z:7,hero:'skullkid',action:'walk'};
  view.companionPose(group,entry,{time:2,groundAt:()=>1});
  assert.deepEqual(group.position.toArray(),[4,2,7]);
  assert.ok(group.userData.sprite.position.y>.6);
  assert.ok(group.userData.pip.position.y>2.6);
  view.companionPose(group,{...entry,hero:'saria'},{time:2,groundAt:()=>1});
  assert.equal(group.userData.sprite.position.y,0);
});
test('Ultimate one-shot animation holds its last frame instead of looping to wind-up',()=>{
  const sandbox={window:{}};
  vm.runInNewContext(read('art.js'),sandbox);
  const art=sandbox.window.RelicArt;
  assert.equal(art.animationFrame('ultimate',0),0);
  assert.equal(art.animationFrame('ultimate',1.05),art.ANIMATIONS.ultimate[0]-1);
  assert.equal(art.animationFrame('ultimate',2),art.ANIMATIONS.ultimate[0]-1);
  assert.equal(art.animationFrame('walk',.8),0);
});
test('all eleven heroes describe their distinct signature and identify non-combat scenes',()=>{
  const entries=Object.values(HEROES);
  assert.equal(entries.length,11);
  assert.equal(new Set(entries.map(h=>h.ultimateDetail)).size,11);
  assert.deepEqual(Object.entries(HEROES).filter(([,h])=>h.sceneOnly).map(([id])=>id),['saria','nabooru']);
  for(const hero of entries)assert.ok(hero.ultimateDetail.length>20);
});

test('Midna hovers without changing the ground-level character model',()=>{
  const normal=Object.create(makeView(false).prototype),reduced=Object.create(makeView(true).prototype);
  assert.ok(normal.heroHoverLift('midna',0)>.45);
  assert.notEqual(normal.heroHoverLift('midna',0),normal.heroHoverLift('midna',1));
  assert.equal(reduced.heroHoverLift('midna',0),reduced.heroHoverLift('midna',1));
  assert.equal(normal.heroHoverLift('midna',1,true),0);
  assert.equal(normal.heroHoverLift('zelda',1),0);
});
test('short attacks and casts visit all six frames and do not loop to anticipation',()=>{
  const V=vm.runInNewContext(viewSource+'\nWorldView',{
    THREE,clamp:(a,b,c)=>Math.max(b,Math.min(c,a)),reducedMotion:false,
    RelicArt:{animationFrame:()=>0,ANIMATIONS:{attack:[6,14],cast:[6,10]}},
  });
  const v=Object.create(V.prototype);
  for(const name of ['attack','cast']){
    const total=.44;
    const seen=Array.from({length:6},(_,i)=>{const age=total*(i+.5)/6;return v.heroPoseFrame(name,age,total-age);});
    assert.deepEqual(seen,[0,1,2,3,4,5]);
    assert.equal(v.heroPoseFrame(name,total,0),5);
  }
});
test('Ultimates show the designated sprite pose on the real release or landing frame',()=>{
  const {Game}=require('../core.js');
  const V=vm.runInNewContext(viewSource+'\nWorldView',{
    THREE,clamp:(a,b,c)=>Math.max(b,Math.min(c,a)),reducedMotion:false,
    RelicArt:{animationFrame:()=>0,ANIMATIONS:{ultimate:[8,9]}},
  });
  const v=Object.create(V.prototype);
  for(const [hero,frame] of Object.entries({link:3,zelda:3,midna:4,tetra:4,sheik:3,skullkid:6,impa:3,darunia:6,ruto:3})){
    const game=new Game(hero,44,{mode:'training',flatTerrain:true});
    game.energy=100;assert.ok(game.ultimate());
    const {actionImpact:release,actionTime:total,attackKind:kind}=game.player;
    assert.ok(release<total&&release>0,hero);
    assert.equal(v.heroPoseFrame('ultimate',release-.002,total-release+.002,kind,release),frame-1,hero);
    assert.equal(v.heroPoseFrame('ultimate',release,total-release,kind,release),frame,hero);
    assert.equal(v.heroPoseFrame('ultimate',total-.001,.001,kind,release),7,hero);
  }
  for(const hero of ['saria','nabooru']){
    const g=new Game(hero,44,{mode:'training',flatTerrain:true});g.energy=100;assert.ok(g.ultimate());
    const total=g.player.actionTime;
    assert.equal(g.player.actionImpact,null);
    assert.equal(v.heroPoseFrame('ultimate',total*.95,total*.05),7);
  }
});
test('all eleven loss sequences use distinct palettes, reach a contact pose, and hold their final cel',()=>{
  const V=vm.runInNewContext(viewSource+'\nWorldView',{
    THREE,clamp:(a,b,c)=>Math.max(b,Math.min(c,a)),reducedMotion:false,storage:{graphics:'balanced'},
    RelicArt:{animationFrame:()=>0},
  });
  const styles=new Set();
  for(const hero of Object.keys(HEROES)){
    const v=Object.create(V.prototype);
    v.effects=[];v.entities=new THREE.Group();v.groundHeight=(x,z)=>x*.1+z*.03;
    v.geometries={diamond:new THREE.OctahedronGeometry(),box:new THREE.BoxGeometry(),lowSphere:new THREE.IcosahedronGeometry(),torus:new THREE.TorusGeometry(),disc:new THREE.CircleGeometry(),sphere:new THREE.IcosahedronGeometry(),cylinder:new THREE.CylinderGeometry()};
    const spec=v.heroDefeatSpec(hero);assert.ok(spec,hero);styles.add(spec.style);
    assert.equal(v.defeatPoseFrame(hero,0),0);
    assert.equal(v.defeatPoseFrame(hero,spec.time*spec.contact-.003),4);
    assert.equal(v.defeatPoseFrame(hero,spec.time*spec.contact),5);
    assert.equal(v.defeatPoseFrame(hero,spec.time+1),7);
    const player={x:4,z:-3,facing:.4,y:2};
    const e=v.heroDefeatFx(hero,player);
    v.heroDefeatFx(hero,player);
    assert.equal(v.effects.length,1);
    assert.ok(e.parts.every(({mesh})=>mesh.material.opacity===0),hero);
    v.positionHeroDefeat(e,spec.contact+.1);
    assert.ok(e.parts.some(({mesh})=>mesh.material.opacity>.2),hero);
    assert.ok(e.parts.every(({mesh})=>mesh.position.toArray().every(Number.isFinite)),hero);
    v.positionHeroDefeat(e,1);
    assert.ok(e.parts.every(({mesh})=>mesh.material.opacity===0),hero);
    assert.deepEqual(player,{x:4,z:-3,facing:.4,y:2},'effects do not modify the simulation');
  }
  assert.equal(styles.size,11);
});

test('each hero has a distinct grounded finish and a real gear impact before the body lands',()=>{
  const V=vm.runInNewContext(viewSource+'\nWorldView',{
    THREE,clamp:(a,b,c)=>Math.max(b,Math.min(c,a)),reducedMotion:false,storage:{graphics:'balanced'},
    RelicArt:{animationFrame:()=>0},
  });
  const signatures=new Set();
  for(const hero of Object.keys(HEROES)){
    const v=Object.create(V.prototype);
    v.entities=new THREE.Group();v.effects=[];v.groundHeight=(x,z)=>x*.12+z*.03;
    v.geometries={diamond:new THREE.OctahedronGeometry(),box:new THREE.BoxGeometry(),lowSphere:new THREE.IcosahedronGeometry(),
      torus:new THREE.TorusGeometry(),disc:new THREE.CircleGeometry(),sphere:new THREE.IcosahedronGeometry(),cylinder:new THREE.CylinderGeometry()};
    const origin={x:2,z:-4,facing:.33,y:1.6},e=v.heroDefeatFx(hero,origin),[loose,hit]=e.spec.prop;
    const mid=v.defeatBodyPosition(e,.28),land=v.defeatBodyPosition(e,e.spec.contact),rest=v.defeatBodyPosition(e,1);
    assert.ok(loose<hit&&hit<e.spec.contact,hero);
    assert.ok(mid.height>0);assert.equal(land.height,0);assert.equal(rest.height,0);
    assert.notEqual((land.x-origin.x)**2+(land.z-origin.z)**2,0,hero);
    assert.equal(rest.ground,v.groundHeight(rest.x,rest.z));
    signatures.add(rest.x.toFixed(4)+','+rest.z.toFixed(4));
    assert.equal(e.gear.name,'defeat-prop:'+hero);
    assert.equal(e.gear.visible,false);
    v.defeatGearPose(e,hit-.06);
    const fly=new THREE.Box3().setFromObject(e.gear).min.y-v.groundHeight(e.gear.position.x,e.gear.position.z);
    assert.ok(fly>.06);
    v.defeatGearPose(e,hit);
    const depth=new THREE.Box3().setFromObject(e.gear).min.y-v.groundHeight(e.gear.position.x,e.gear.position.z);
    assert.ok(e.gear.visible&&Math.abs(depth-.014)<1e-6,hero);
    assert.ok(e.gearRipple.material.opacity>0);
    let freed=0;
    e.gear.userData.materials.forEach(m=>m.addEventListener('dispose',()=>freed++));
    v.disposeEffect(e);assert.equal(freed,e.gear.userData.materials.length,hero);
  }
  assert.equal(signatures.size,11);
});
test('ground contact uses the body silhouette rather than loose peripheral particles',()=>{
  const width=12,height=14,data=new Uint8ClampedArray(width*height*4);
  const px=(x,y)=>data[(x+y*width)*4+3]=255;
  for(let x=3;x<7;x++)for(let y=3;y<9;y++)px(x,y);
  px(11,13);
  const canvas={width,height,getContext:()=>({getImageData:()=>({data})})};
  const V=vm.runInNewContext(viewSource+'\nWorldView',{THREE,clamp:(a,b,c)=>Math.max(b,Math.min(c,a)),RelicArt:{canvas:()=>canvas}});
  const v=Object.create(V.prototype);
  assert.equal(v.defeatFootAnchor('link',1,6),5/14);
  assert.equal(v.defeatFootAnchor('link',1,6),5/14);
});
test('different defeat beats reach a grounded contact at different speeds',()=>{
  const V=vm.runInNewContext(viewSource+'\nWorldView',{
    THREE,clamp:(a,b,c)=>Math.max(b,Math.min(c,a)),reducedMotion:false,
    RelicArt:{animationFrame:()=>0},
  });
  const v=Object.create(V.prototype);
  const timings=new Set();
  for(const hero of Object.keys(HEROES)){
    const s=v.heroDefeatSpec(hero);timings.add(s.beats.join(','));
    assert.ok(s.beats.every((t,i)=>t>0&&t<1&&(i===0||t>s.beats[i-1])));
    assert.ok(s.time<2.5);
  }
  assert.equal(timings.size,11);
  const sheik=v.heroDefeatSpec('sheik'),darunia=v.heroDefeatSpec('darunia');
  assert.ok(sheik.time*sheik.contact<darunia.time*darunia.contact);
});
test('hero defeat can select poses between integer keyframes without moving the contact beat',()=>{
  const V=vm.runInNewContext(viewSource+'\nWorldView',{
    THREE,clamp:(a,b,c)=>Math.max(b,Math.min(c,a)),reducedMotion:false,
    RelicArt:{animationFrame:()=>0},
  });
  const a=Object.create(V.prototype);
  for(const hero of Object.keys(HEROES)){
    const s=a.heroDefeatSpec(hero),t=s.time*s.contact;
    assert.equal(a.defeatPoseFrame(hero,.8*t*s.beats[0],true),.5);
    assert.equal(a.defeatPoseFrame(hero,t,true),5);
    assert.equal(a.defeatPoseFrame(hero,s.time,true),7);
  }
});
test('Navi has four flapping wings, a faint pulsing halo and a softer steady reduced-motion pose',()=>{
  const build=reduce=>{
    const V=vm.runInNewContext(viewSource+'\nWorldView',{THREE,clamp:(a,b,c)=>Math.max(b,Math.min(c,a)),reducedMotion:reduce});
    const v=Object.create(V.prototype);
    v.geometries={sphere:new THREE.IcosahedronGeometry(1,1)};
    v.materials=new Map();
    return v;
  };
  for(const reduce of [false,true]){
    const v=build(reduce),navi=v.makeNavi(),{glow,wings}=navi.userData;
    assert.equal(navi.name,'Navi');
    assert.equal(wings.length,4);
    assert.equal(wings.filter(w=>w.lower).length,2);
    assert.ok(navi.getObjectByName('navi-blue-orb'));
    v.naviPose(navi,.13);
    const alpha=glow.material.opacity,angle=wings.map(w=>w.joint.rotation.y),oldY=navi.position.y;
    v.naviPose(navi,.64);
    assert.ok(glow.material.opacity>.15&&glow.material.opacity<.31);
    if(reduce){assert.equal(alpha,glow.material.opacity);assert.deepEqual(angle,wings.map(w=>w.joint.rotation.y));}
    else {assert.notEqual(alpha,glow.material.opacity);assert.ok(wings.every((w,i)=>w.joint.rotation.y!==angle[i]));}
    v.naviPose(navi,1,1.46);assert.ok(navi.position.y<oldY-.5);
  }
});
