const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const THREE=require('../vendor/three.min.js');
const {Game,BOSSES,Combat,clamp}=require('../core.js');
const BonkCamera=require('../camera.js');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const viewSource=source.slice(source.indexOf('  class WorldView'),source.indexOf('  function currentDialog'));
function createView(reducedMotion=false){
  const art={
    sprite(_kind,_id,w,h){const sprite=new THREE.Sprite();sprite.scale.set(w,h,1);return sprite;},
    material(...pose){const mat=new THREE.SpriteMaterial();mat.userData.pose=pose;return mat;},
    animationFrame(_,age){return Math.floor(age*14);},
  };
  const View=vm.runInNewContext(viewSource+'\nWorldView',{THREE,Game,BOSSES,Combat,BonkCamera,clamp,RelicArt:art,
    storage:{graphics:'balanced'},reducedMotion});
  const view=Object.create(View.prototype);
  view.entities=new THREE.Group();view.effects=[];view.enemies=new Map();view.shadow=()=>{};
  view.geometries={diamond:new THREE.OctahedronGeometry(1)};view.materials=new Map();
  view.camera=new THREE.PerspectiveCamera(38,16/9,.1,200);
  view.camera.position.set(-8,10,17);view.camera.lookAt(0,0,0);view.camera.updateMatrixWorld();
  return view;
}
const fresh=()=>{const game=new Game('link',451,{flatTerrain:true});game.ranks={};game.spawnTimer=999;return game;};

test('the visible edge corresponds to the damaging side of the real hazard, advances, and clears once fired',()=>{
  const view=createView(),run=fresh();
  run.addHazard(3,-4,3,.04,12);
  const h=run.hazards[0],visible=view.dangerIndicators(run)[0],group=view.makeDangerMark();
  view.dangerMarkPose(group,visible,run);
  const [,edge,accent,clock]=group.children;
  const xyz=edge.geometry.getAttribute('position').array,radii=[];
  for(let i=0;i<xyz.length;i+=3)radii.push(Math.hypot(xyz[i],xyz[i+2]));
  const shownRadius=Math.max(...radii);
  assert.ok(Math.abs(shownRadius-(3+run.player.radius))<1e-5);
  assert.equal(group.position.x,h.x);assert.equal(group.position.z,h.z);
  assert.ok(group.renderOrder>0&&accent.renderOrder>20);
  assert.equal(edge.material.depthWrite,false);
  assert.equal(edge.material.depthTest,true);
  const startingTicks=clock.geometry.drawRange.count;
  view.dangerMarkPose(group,{...visible,timer:.02},run);
  assert.ok(clock.geometry.drawRange.count>startingTicks);
  for(const [delta,hit] of [[-.012,true],[.012,false]]){
    const game=fresh();game.addHazard(3,-4,3,.04,12);
    game.player.x=h.x+shownRadius+delta;game.player.z=h.z;
    game.step(.02);game.step(.02);
    assert.equal(game.damageTaken>0,hit);
    assert.equal(view.dangerIndicators(game).length,0);
  }
});

test('a heavy hit briefly holds the reaction cel and pushes it away from Link without moving the collider or suppressing a tell',()=>{
  const view=createView(),game=fresh();
  const enemy=game.spawnEnemy('boar',3,0);
  enemy.hp=enemy.maxHp=1000;
  const group=view.enemyModel(enemy);view.enemies.set(enemy.id,group);
  game.hurtEnemy(enemy,20,6,{source:'ultimate'});
  const event=game.drainEvents().find(e=>e.type==='hit');
  view.hitContact(event);assert.equal(view.effects.length,5);
  view.enemyPose(group,enemy,game,game.time);
  const atContact=group.userData.sprite.position.x;
  assert.ok(atContact>.42);assert.equal(group.position.x,3);
  enemy.hitReact=.196;
  view.enemyPose(group,enemy,game,game.time+.034);
  assert.equal(group.userData.sprite.position.x,atContact);
  enemy.hitReact=.07;enemy.action='windup';enemy.windup=.26;enemy.actionDuration=.48;
  view.enemyPose(group,enemy,game,game.time+.16);
  assert.ok(group.userData.sprite.position.x<atContact*.5);
  assert.equal(group.userData.sprite.material.userData.pose[5],'windup');
  assert.equal(view.dangerIndicators(game)[0].id,'swipe:'+enemy.id);
  assert.equal(enemy.x,3);assert.equal(game.time,0);
  const reduced=createView(true),quiet=reduced.enemyModel(enemy);reduced.enemies.set(enemy.id,quiet);
  reduced.hitContact(event);reduced.enemyPose(quiet,enemy,game,0);
  assert.equal(quiet.userData.sprite.position.x,0);
  assert.equal(reduced.effects.length,1);
});

test('Link’s sword release peels from his sword side toward the simulated enemy shot lane',()=>{
  const game=fresh(),view=createView(),target=game.spawnEnemy('boar',7,-3);
  game.ranks={ember:1};game.cooldowns.ember=0;
  game.updateWeapons(.02);
  const event=game.drainEvents().find(e=>e.swordWave),shot=game.projectiles[0];
  assert.ok(event&&shot);
  view.swordWaveRelease(event);
  const effect=view.effects[0],p=effect.mesh.position;
  const lateral=()=>p.x*shot.vz-p.z*shot.vx;
  const forward=()=>p.x*shot.vx+p.z*shot.vz;
  const startingLateral=lateral(),startingForward=forward();
  assert.ok(startingLateral>.5);assert.ok(startingForward>.3);
  view.positionSwordWaveRelease(effect,.7);
  assert.ok(lateral()<startingLateral*.12);
  assert.ok(forward()>startingForward+.9);
  assert.equal(target.x,7);assert.equal(target.z,-3);
});

test('only the official Kokiri Gohma draws armor or the exposed iris; the attack pattern stays keyed',()=>{
  const game=fresh(),view=createView();
  const boss={id:71,type:'boss',bossId:'gohma',radius:1.8,x:1,z:0,action:'attack',actionAge:.2,
    actionDuration:.43,intent:'landmark',facing:0,gohmaTrial:true,exposure:0};
  const mesh=view.enemyModel(boss),variant=()=>mesh.userData.sprite.material.userData.pose[2];
  view.enemyPose(mesh,boss,game,0);assert.equal(variant(),'eye-guarded:landmark');
  boss.exposure=1;view.enemyPose(mesh,boss,game,0);assert.equal(variant(),'eye-open:landmark');
  boss.gohmaTrial=false;view.enemyPose(mesh,boss,game,0);assert.equal(variant(),'landmark');
});
