const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const THREE=require('../vendor/three.min.js');
const {clamp}=require('../core.js');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const app=source.slice(source.indexOf('  class WorldView'),source.indexOf('  function currentDialog'));
const art={
  animationFrame:()=>3,
  sprite(kind,id,w,h){
    const m=new THREE.Sprite(this.material(kind,id,0,0));
    m.scale.set(w,h,1);return m;
  },
  material(kind,id,direction,frame,_flash,action,variant){
    const map=new THREE.Texture();map.name=[kind,id,direction,frame,action,variant].join(':');
    return new THREE.SpriteMaterial({map});
  },
};
function view(reducedMotion=false,graphics='balanced'){
  const WorldView=vm.runInNewContext(app+'\nWorldView',{THREE,clamp,RelicArt:art,BonkCamera:{direction:()=>1},reducedMotion,storage:{graphics}});
  const v=Object.create(WorldView.prototype);
  v.entities=new THREE.Group();v.effects=[];v.materials=new Map();v.groundHeight=()=>1;
  v.geometries={diamond:new THREE.OctahedronGeometry(1),torus:new THREE.TorusGeometry(1,.09),box:new THREE.BoxGeometry(),lowSphere:new THREE.IcosahedronGeometry(1,0)};
  v.camera=new THREE.PerspectiveCamera(45,1.5,.1,100);
  v.camera.position.set(3,8,10);v.camera.lookAt(0,1,0);v.camera.updateMatrixWorld();
  return v;
}
const event={x:1,z:-1,y:2,radius:4,arc:Math.PI/2,facing:Math.PI/2};
test('ultimate release is delayed and all eleven signatures are unique',()=>{
  const v=view();
  v.ultimateEffect({...event,phaseStyle:'spin',release:.445},20);
  assert.equal(v.effects.length,0);
  assert.equal(v.ultimateCues[0].at,20.445);
  v.ultimateEffect(v.ultimateCues[0].event);
  const [spin]=v.effects;
  assert.equal(spin.kind,'ultimateSignature');assert.equal(spin.parts[0].m.position.x,event.x);
  const initial=spin.parts[0].m.scale.x;v.positionUltimateStage(spin,.75);
  assert.ok(spin.parts[0].m.scale.x>initial);assert.notEqual(spin.parts[0].m.rotation.y,event.facing);
  const shapes={spin:'blade-sweep',seal:'pillar-of-sealing-light',fused:'fused-shadow-limb',waterGun:'pistol-muzzle-spray',
    harp:'harp-string-wave',moonCrash:'moon-impact-outer-shockwave',waterBlade:'blade-water-wall',goronSlam:'boulder-impact-dust',
    rutoSurge:'breaking-wave-crest',ocarinaSong:'ocarina-note-stem',spiritSage:'spirit-medallion-face'};
  const sceneTypes=['ocarinaSong','spiritSage'];
  for(const [phaseStyle,shape] of Object.entries(shapes)){
    const showcase=view();
    const sceneOnly=sceneTypes.includes(phaseStyle);
    showcase.ultimateEffect({...event,phaseStyle,sceneOnly});
    const e=showcase.effects.at(-1);
    assert.equal(e.phase,sceneOnly?'scene':'release');assert.ok(e.mesh.getObjectByName(shape),phaseStyle);
    showcase.positionUltimateStage(e,.52);
    assert.ok(e.parts.some(({m})=>m.visible&&m.material.opacity>0),phaseStyle);
    for(const {m} of e.parts)assert.ok(m.position.toArray().every(Number.isFinite),phaseStyle);
  }
});
test('the grinning Moon drops vertically toward a fixed target instead of launching as a projectile',()=>{
  const v=view(),target={...event,y:undefined,phaseStyle:'moonCrash',release:.85};
  v.ultimateEffect(target,21,{x:8,z:9,y:2,ground:2});
  const moon=v.effects.at(-1);
  const face=moon.mesh.getObjectByName('descending-grinning-moon');
  assert.match(face.material.map.name,/^moon:/);assert.ok(face.scale.x>5);
  const marker=moon.mesh.getObjectByName('moon-landing-marker');assert.equal(marker.scale.x,event.radius);
  assert.equal(moon.phase,'windup');assert.equal(v.ultimateCues.at(-1).at,21.85);
  const high=face.position.y;v.positionUltimateStage(moon,.91);
  assert.ok(face.position.y<high-6);
  assert.equal(face.position.x,target.x);assert.equal(face.position.z,target.z);
  assert.equal(v.projectiles,undefined,'The decorative signatures never manage projectile state');
});
test('Ruto’s crest grows forward, Impa’s blade has a slanted edge, and Darunia makes grounded dust only on impact',()=>{
  const v=view();
  v.ultimateEffect({...event,phaseStyle:'rutoSurge'});
  const wave=v.effects.at(-1),crest=wave.mesh.getObjectByName('breaking-wave-crest');
  const makeBox=()=>new THREE.Box3().setFromObject(crest,true);
  v.positionUltimateStage(wave,.21);
  const near=makeBox();assert.ok(near.min.x>event.x);
  v.positionUltimateStage(wave,.75);assert.ok(makeBox().max.x>near.max.x);
  v.ultimateEffect({...event,phaseStyle:'waterBlade'});
  const blade=v.effects.at(-1);v.positionUltimateStage(blade,.23);
  assert.notEqual(blade.mesh.getObjectByName('blade-water-wall').rotation.z,0);
  v.ultimateEffect({...event,phaseStyle:'goronSlam',release:null},10,{x:9,z:2,ground:1,y:2});
  assert.equal(v.effects.at(-1),blade,'No dust during the jump');
  v.ultimateEffect({...event,x:9,z:2,phaseStyle:'goronSlam',type:'goronImpact'});
  const slam=v.effects.at(-1),floor=slam.mesh.getObjectByName('boulder-impact-floor-ring');
  assert.deepEqual(floor.position.toArray(),[9,1.18,2]);const inner=floor.scale.x;
  v.positionUltimateStage(slam,.53);assert.ok(floor.scale.x>inner);
  assert.ok(slam.parts.some(({m})=>m.name==='boulder-impact-rocks'&&m.position.y>2.5));
});
test('reduced motion holds the signature still and transparently fades it; owned materials are disposed',()=>{
  const normal=view(),reduced=view(true,'low'),eventStyle={...event,phaseStyle:'seal'};
  normal.ultimateEffect(eventStyle);reduced.ultimateEffect(eventStyle);
  const e=reduced.effects[0],part=e.mesh.getObjectByName('pillar-of-sealing-light');
  assert.ok(e.parts.length<normal.effects[0].parts.length);
  reduced.positionUltimateStage(e,.2);
  const position=part.position.toArray(),scale=part.scale.toArray(),opacity=part.material.opacity;
  reduced.positionUltimateStage(e,.85);
  assert.deepEqual(part.position.toArray(),position);assert.deepEqual(part.scale.toArray(),scale);
  assert.ok(part.material.opacity<opacity);
  let disposed=0;e.materials.forEach(m=>m.addEventListener('dispose',()=>disposed++));
  reduced.disposeEffect(e);assert.equal(disposed,e.materials.length);
});
test('companion uses directional hero pose, world height and its own support shot',()=>{
  const v=view(),entry={hero:'saria',x:2,z:-1,y:3,action:'attack',actionAge:.15,attackKind:'slingshot',facing:1};
  const group=v.companionModel(entry);v.companionPose(group,entry,{groundAt:()=>1});
  assert.deepEqual(group.position.toArray(),[2,3,-1]);
  assert.equal(group.userData.sprite.material.map.name,'hero:saria:1:3:attack:slingshot');
  assert.ok(group.children.length>1);
  v.allyPulse({...entry,type:'companionStrike',kind:'slingshot',targetX:6,targetZ:-5});
  const [shot]=v.effects;assert.equal(shot.kind,'companionShot');assert.match(shot.mesh.material.map.name,/slingshot/);
  v.positionCompanionShot(shot,.5);
  assert.ok(shot.mesh.position.x>2&&shot.mesh.position.z<-1);
});
test('Tetra’s Water Gun still renders as a directed horizontal jet',()=>{
  const v=view(),launch={type:'leaf',x:1,z:2,y:1.5,vx:1,vz:1,age:.3};
  const water={...launch,type:'bomb',flight:'bolt',art:'waterShot'};
  const jet=v.createProjectile(water);v.projectilePose(jet,water,{groundAt:()=>1});
  assert.equal(jet.position.y,launch.y,'the stream must not follow the Bomb throw arc');
  assert.match(jet.material.map.name,/waterShot/);assert.ok(Math.abs(jet.material.rotation)>.01);
});
