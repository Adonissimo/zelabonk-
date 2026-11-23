const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const THREE=require('../vendor/three.min.js');
const {BOSSES,Combat,clamp}=require('../core.js');
const BonkCamera=require('../camera.js');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const classSource=source.slice(source.indexOf('  class WorldView'),source.indexOf('  function currentDialog'));
const makeView=reducedMotion=>{
  const art={
    sprite(_kind,_id,width,height){const s=new THREE.Sprite();s.scale.set(width,height,1);return s;},
    material(...pose){const m=new THREE.SpriteMaterial();m.userData.pose=pose;return m;},
    animationFrame(action,age){return Math.floor(age*({windup:7,attack:14,spawn:7,walk:10}[action]||6));}
  };
  const View=vm.runInNewContext(classSource+'\nWorldView',{THREE,BonkCamera,BOSSES,Combat,clamp,RelicArt:art,storage:{graphics:'balanced'},reducedMotion});
  const view=Object.create(View.prototype);
  view.entities=new THREE.Group();view.effects=[];view.camera=new THREE.PerspectiveCamera(50,1.5,.1,200);
  view.camera.position.set(0,15,30);
  view.shadow=()=>{};view.groundHeight=()=>2;
  view.mesh=(kind,color,size,position,parent)=>{const m=new THREE.Object3D();m.position.set(...position);m.scale.set(...size);m.userData={kind,color};parent.add(m);return m;};
  return view;
};
const game={player:{x:0,z:0},groundAt:()=>2};
test('boss windup reaches keyed poses without hiding its intent when hit, then attack gets its own pose',()=>{
  const view=makeView(false);
  const boss={id:1,type:'boss',bossId:'gohma',radius:2,action:'windup',intent:'summon',x:0,z:0,
    facing:-Math.PI/2,actionAge:0,actionDuration:1,hitReact:.23,stage:2};
  const m=view.enemyModel(boss);
  view.enemyPose(m,boss,game,0);
  assert.deepEqual(m.userData.sprite.material.userData.pose,['boss','gohma','summon',0,false,'windup',1]);
  boss.actionAge=.95;view.enemyPose(m,boss,game,0);
  assert.equal(m.userData.sprite.material.userData.pose[3],5);
  boss.action='attack';boss.actionAge=.02;view.enemyPose(m,boss,game,0);
  assert.equal(m.userData.sprite.material.userData.pose[5],'attack');
  boss.action='walk';view.enemyPose(m,boss,game,0);
  assert.equal(m.userData.sprite.material.userData.pose[5],'hurt');
});
test('dive and lunge use distinct elevations and accents; reduced motion keeps a static tell',()=>{
  const view=makeView(false),reduced=makeView(true);
  const enemy={id:2,type:'bat',enemyId:'keese',action:'attack',attackMotion:'dive',actionAge:.2,actionDuration:.4,x:0,z:0};
  const bird=view.enemyModel(enemy),quiet=reduced.enemyModel(enemy);
  view.enemyPose(bird,enemy,game,1);reduced.enemyPose(quiet,enemy,game,1);
  assert.ok(bird.userData.sprite.position.y<quiet.userData.sprite.position.y);
  assert.equal(quiet.userData.sprite.material.userData.pose[3],3);
  view.enemyStrikeEffect({x:0,z:0,enemyId:'keese',facing:Math.PI/2,kind:'dive'});
  view.enemyStrikeEffect({x:0,z:0,enemyId:'octorok',facing:0,kind:'spit'});
  assert.equal(view.effects.length,6);
  assert.equal(view.effects[1].mesh.userData.kind,'lowSphere');
  assert.ok(view.effects[1].mesh.position.x>0);
  assert.equal(view.effects[4].mesh.userData.kind,'diamond');
  assert.ok(view.effects[4].mesh.position.z>0);
  reduced.enemyStrikeEffect({x:0,z:0,bossId:'gohma',kind:'summon',facing:0});
  assert.equal(reduced.effects.length,1);
});
