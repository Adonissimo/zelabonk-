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
test('the grinning Moon enters from above the viewport then lands on the marked point',()=>{
  const target={...event,y:undefined,phaseStyle:'moonCrash',release:1.64};
  for(const [aspect,elevation] of [[1.8,10],[.52,11],[1.3,25],[1.8,2.2]]){
    const v=view();v.camera.aspect=aspect;v.camera.updateProjectionMatrix();
    v.camera.position.set(3,elevation,10);v.camera.lookAt(0,1,0);v.camera.updateMatrixWorld();
    v.ultimateEffect(target,21,{x:8,z:9,y:2,ground:2});
    const moon=v.effects.at(-1),face=moon.mesh.getObjectByName('descending-grinning-moon');
    const marker=moon.mesh.getObjectByName('moon-landing-marker');
    assert.equal(moon.phase,'windup');assert.equal(moon.startTime,21);
    assert.equal(moon.duration,1.64);assert.equal(v.ultimateCues,undefined);
    assert.match(face.material.map.name,/^moon:/);assert.ok(face.scale.x>5);
    assert.equal(marker.scale.x,event.radius);
    const start=face.position.clone().project(v.camera);
    assert.ok(start.y>1||start.z>=1,'The moon starts above view, or above the camera at an overhead angle');
    assert.ok(face.position.y>12);
    assert.equal(face.visible,false);
    v.positionUltimateStage(moon,.91);
    const late=face.position.clone().project(v.camera);
    assert.ok(late.y<1&&late.y<start.y);
    assert.ok(Math.abs(late.x-start.x)>.02||start.z>=1,'the glide has a sideways drift');
    assert.equal(face.visible,true);
    v.positionUltimateStage(moon,1);
    assert.deepEqual(face.position.toArray(),[target.x,1.05,target.z]);
    assert.equal(v.projectiles,undefined);
  }
});
test('Moon Crash waits for the ground-impact event, then explodes in layers from that point',()=>{
  for(const reduce of [false,true]){
    const v=view(reduce,reduce?'low':'balanced');
    const target={...event,y:undefined,phaseStyle:'moonCrash',release:1.64};
    v.ultimateEffect(target,21);
    const descent=v.effects.at(-1);
    assert.equal(descent.mesh.getObjectByName('moon-impact-fireball'),undefined);
    v.moonImpact(target);
    assert.equal(descent.time,0);assert.equal(descent.mesh.visible,false);
    const release=v.effects.at(-1),mesh=release.mesh;
    const contact=mesh.getObjectByName('moon-impact-contact'),ball=mesh.getObjectByName('moon-impact-fireball');
    const shockwave=mesh.getObjectByName('moon-impact-outer-shockwave'),smoke=mesh.getObjectByName('moon-impact-smoke');
    const rock=mesh.getObjectByName('lunar-impact-debris');
    assert.deepEqual(contact.position.toArray(),[target.x,1.05,target.z]);
    assert.ok(contact.scale.y>0&&ball.material.opacity>0);
    const ringSize=shockwave.scale.x,rockPosition=rock.position.clone();
    v.positionUltimateStage(release,.33);
    assert.equal(contact.visible,false);
    assert.ok(smoke.material.opacity>0);
    if(!reduce){assert.ok(shockwave.scale.x>ringSize);assert.ok(rock.position.distanceTo(rockPosition)>1);}
    else {assert.equal(shockwave.scale.x,ringSize);assert.ok(rock.position.equals(rockPosition));}
    v.positionUltimateStage(release,1);
    assert.equal(ball.material.opacity,0);assert.equal(smoke.material.opacity,0);
  }
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

test('the landing shadow leads the Moon and grows over sloped terrain as it gets closer',()=>{
  for(const reduced of [false,true]){
    const v=view(reduced);v.groundHeight=(x,z)=>2+x*.15+z*.12;
    const target={x:3,z:-5,phaseStyle:'moonCrash',radius:7.1,release:1.64};
    v.ultimateEffect(target,5);
    const wind=v.effects[0],shadow=wind.mesh.getObjectByName('moon-approach-shadow'),face=wind.mesh.getObjectByName('descending-grinning-moon');
    v.positionUltimateStage(wind,.11);
    const earlySize=shadow.userData.radius,earlyOpacity=shadow.material.opacity;
    assert.ok(earlyOpacity>.2&&earlySize<2);assert.equal(face.visible,false);
    v.positionUltimateStage(wind,.85);
    const pts=shadow.geometry.getAttribute('position');
    assert.equal(face.visible,true);assert.ok(shadow.material.opacity>earlyOpacity&&shadow.userData.radius>earlySize*2);
    for(let n=0;n<pts.count;n++)assert.ok(Math.abs(pts.getY(n)-v.groundHeight(pts.getX(n),pts.getZ(n))-.062)<.00005);
    v.positionUltimateStage(wind,1);assert.ok(shadow.userData.radius>=target.radius);
    const focus=v.moonCameraFocus({x:0,z:0});assert.ok(Math.abs(focus.x-(reduced?0:2.16))<.0001);
    v.moonImpact(target);assert.equal(wind.mesh.visible,false);
    let disposed=false;shadow.geometry.addEventListener('dispose',()=>disposed=true);
    v.disposeEffect(wind);assert.equal(disposed,true);
  }
});
test('the Moon trails smoke before impact; the smoke burst and one faint flash start after contact',()=>{
  for(const reduce of [false,true]){
    const v=view(reduce,reduce?'low':'balanced'),event={x:1,z:-1,phaseStyle:'moonCrash',radius:7.1,release:1.64};
    v.ultimateEffect(event,5);
    const fall=v.effects[0],tail=fall.mesh.getObjectByName('moon-descent-smoke'),face=fall.mesh.getObjectByName('descending-grinning-moon');
    assert.ok(tail.isSprite);assert.equal(tail.visible,false);
    assert.equal(fall.mesh.getObjectByName('moon-impact-faint-flash'),undefined);
    v.positionUltimateStage(fall,.65);
    assert.ok(tail.visible&&tail.material.opacity>.15);
    const project=t=>t.position.clone().project(v.camera),loc=project(tail);
    assert.ok(loc.y>project(face).y,'the plume follows behind the falling Moon');
    v.positionUltimateStage(fall,.90);
    assert.ok(project(tail).y<loc.y,'smoke follows the glide rather than staying suspended');
    v.moonImpact(event);
    assert.equal(fall.mesh.visible,false);
    const impact=v.effects.at(-1),flash=impact.mesh.getObjectByName('moon-impact-faint-flash');
    const smoke=impact.mesh.getObjectByName('moon-impact-smoke');
    assert.equal(flash.material.opacity,0);assert.equal(flash.visible,false);
    assert.equal(smoke.material.map,tail.material.map,'the textured puffs share a reusable texture');
    assert.ok(smoke.material.map.image.data.some((x,i)=>i%4===3&&x===0));
    v.positionUltimateStage(impact,.08);
    assert.ok(flash.material.opacity>0&&flash.material.opacity<.28);
    assert.equal(flash.position.x,event.x);assert.equal(flash.position.z,event.z);assert.ok(Math.abs(flash.position.y-1.64)<1e-8);
    assert.ok(smoke.material.opacity>.25);
    const start=smoke.position.clone(),size=smoke.scale.x;
    v.positionUltimateStage(impact,.4);
    if(!reduce){assert.ok(smoke.position.distanceTo(start)>.4);assert.ok(smoke.scale.x>size);}
    assert.equal(flash.material.opacity,0);
    assert.ok(smoke.material.opacity>.2);
    v.positionUltimateStage(impact,1);
    assert.equal(smoke.material.opacity,0);
  }
});
test('residual smoke drifts and remains after the Moon burst has faded, then clears',()=>{
  for(const reduce of [false,true]){
    const v=view(reduce,reduce?'low':'balanced'),event={x:1,z:-1,phaseStyle:'moonCrash',radius:7.1};
    v.moonImpact(event);
    const [residual,impact]=v.effects;
    assert.equal(residual.phase,'aftermath');
    assert.ok(residual.duration>=4&&residual.duration>impact.duration*3);
    const puff=residual.mesh.getObjectByName('moon-residual-smoke');
    assert.equal(puff.visible,false);
    assert.equal(residual.mesh.getObjectByName('moon-impact-faint-flash'),undefined);
    v.positionUltimateStage(residual,1.5/residual.duration);
    assert.ok(puff.material.opacity>.2);
    const earlier=puff.position.clone(),size=puff.scale.x;
    v.positionUltimateStage(impact,1);
    assert.equal(impact.mesh.getObjectByName('moon-impact-smoke').material.opacity,0);
    v.positionUltimateStage(residual,2.9/residual.duration);
    assert.ok(puff.visible&&puff.material.opacity>.1,'smoke visibly outlasts the blast');
    if(reduce)assert.ok(puff.position.equals(earlier));
    else {assert.ok(puff.position.y>earlier.y);assert.ok(puff.scale.x>size);}
    v.positionUltimateStage(residual,1);
    assert.equal(puff.visible,false);
    assert.equal(puff.material.opacity,0);
  }
});

test('the globe dives face-down, while panning reveals a different side without moving the Moon',()=>{
  const v=view(),target={x:3,z:-5,phaseStyle:'moonCrash',radius:7.1,release:1.64};
  v.ultimateEffect(target,8);
  const fall=v.effects[0],root=fall.mesh.getObjectByName('descending-grinning-moon'),globe=root.userData.globe;
  assert.equal(globe.isMesh,true);
  assert.equal(globe.geometry.type,'SphereGeometry');
  assert.equal(globe.material.map.name,'moon:cratered-world-surface');
  v.positionUltimateStage(fall,.30);
  const firstFace=new THREE.Vector3(0,0,1).applyQuaternion(globe.quaternion),first=globe.quaternion.clone();
  v.positionUltimateStage(fall,.93);
  const lateFace=new THREE.Vector3(0,0,1).applyQuaternion(globe.quaternion);
  assert.ok(lateFace.y<firstFace.y-.5&&lateFace.y<-.8);
  assert.ok(globe.quaternion.angleTo(first)>.8);
  root.updateMatrixWorld(true);
  const center=globe.getWorldPosition(new THREE.Vector3());
  const before=v.camera.position.clone().sub(center).normalize().dot(lateFace),pos=root.position.clone(),pose=globe.quaternion.clone();
  v.camera.position.copy(center).addScaledVector(lateFace,22);v.camera.lookAt(center);v.camera.updateMatrixWorld();
  v.positionUltimateStage(fall,.93);
  assert.ok(root.position.equals(pos));assert.ok(globe.quaternion.equals(pose));
  const after=v.camera.position.clone().sub(center).normalize().dot(lateFace);
  assert.ok(Math.abs(before-after)>.15,'the visible angle changes as the camera pans');
  v.positionUltimateStage(fall,1);
  const landed=globe.quaternion.clone();
  v.moonImpact(target);
  assert.ok(v.effects.at(-1).mesh.getObjectByName('moon-impact-contact').userData.globe.quaternion.equals(landed));
});
test('the after-impact flash is a single short pulse with a softer reduced-motion peak',()=>{
  const v=view(),reduce=view(true);
  for(const view of [v,reduce]){
    assert.equal(view.moonFlashOpacity(-.001),0);
    assert.equal(view.moonFlashOpacity(0),0);
    assert.ok(view.moonFlashOpacity(.026)>view.moonFlashOpacity(.08));
    assert.ok(view.moonFlashOpacity(.08)>view.moonFlashOpacity(.14));
    assert.equal(view.moonFlashOpacity(.20),0);
  }
  assert.ok(v.moonFlashOpacity(.026)>.28);
  assert.ok(reduce.moonFlashOpacity(.026)<=.09);
});
test('Saria’s visible healing area follows her and only appears after the song',()=>{
  const v=view(),p={x:3,z:4,y:0,ground:1};
  v.ultimateEffect({x:p.x,z:p.z,phaseStyle:'ocarinaSong',sceneOnly:true},2,p);
  const [song,aura]=v.effects;
  assert.equal(song.phase,'scene');assert.equal(aura.phase,'healing');
  const ring=aura.mesh.getObjectByName('saria-healing-area');
  const cross=aura.mesh.getObjectByName('saria-healing-cross-tall');
  v.positionUltimateStage(aura,.99*song.duration/aura.duration);
  assert.equal(ring.visible,false);assert.equal(cross.visible,false);
  p.x=6;p.z=-9;
  v.positionUltimateStage(aura,(song.duration+.8)/aura.duration);
  assert.equal(ring.visible,true);assert.equal(cross.visible,true);
  assert.ok(ring.material.opacity>0&&ring.scale.x>3);
  assert.equal(ring.position.x,p.x);assert.equal(ring.position.z,p.z);
  v.positionUltimateStage(aura,1);
  assert.equal(ring.visible,false);assert.equal(cross.material.opacity,0);
});
