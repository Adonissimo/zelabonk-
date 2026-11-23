const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const THREE=require('../vendor/three.min.js'),{clamp}=require('../core.js');
const read=name=>readFileSync(path.join(__dirname,'..',name),'utf8');

test('Master Sword art opens into an across-flight crescent and draws more than one animation frame',()=>{
  const sandbox={window:{},document:{createElement(){
    const ops=[],ctx={fillStyle:null,globalAlpha:1,translate(){},rotate(){},fillRect(x,y,w,h){if(w>0&&h>0)ops.push([x,y,w,h,this.fillStyle,this.globalAlpha]);}};
    return {ops,getContext:()=>ctx};
  }}};
  vm.runInNewContext(read('art.js'),sandbox);
  const frames=Array.from({length:8},(_,i)=>sandbox.window.RelicArt.canvas('projectile','ember',0,i));
  assert.equal(new Set(frames.map(f=>JSON.stringify(f.ops))).size,8,'all eight frames should differ');
  const height=frame=>Math.max(...frame.ops.map(r=>r[1]))-Math.min(...frame.ops.map(r=>r[1]));
  assert.ok(height(frames[7])>height(frames[0])+13,'tips should visibly spread across the path');
  const front=frame=>y=>Math.max(...frame.ops.filter(r=>r[1]===y&&r[5]===1).map(r=>r[0]+r[2]));
  assert.ok(front(frames[7])(0)>front(frames[7])(20)+10,'glowing nose must lead the open upper and lower tips');
  assert.ok(frames[6].ops.some(r=>r[5]<1),'mature wave should leave a transparent wake');
});

test('world wave expands, selects frames by age, and fades without resizing another projectile',()=>{
  const app=read('app.js');
  const source=app.slice(app.indexOf('  class WorldView'),app.indexOf('  function currentDialog'));
  const art={
    sprite(){return new THREE.Sprite(new THREE.SpriteMaterial());},
    material(_kind,id,_dir,frame){return {map:id+':'+frame};}
  };
  const WorldView=vm.runInNewContext(source+';WorldView',{THREE,clamp,RelicArt:art,reducedMotion:false});
  const view=Object.create(WorldView.prototype);
  view.entities=new THREE.Group();view.effects=[];view.camera=new THREE.PerspectiveCamera(48,1.4,.1,100);
  view.camera.position.set(0,9,12);view.camera.lookAt(0,0,0);view.camera.updateMatrixWorld();
  const wave=view.projectileModel('ember',1,1,true),arrow=view.projectileModel('leaf',1,1,true);
  const base={x:0,y:1,z:0,vx:1,vz:0,vy:0,duration:.8,type:'ember'};
  const snapshot=age=>{
    view.projectilePose(wave,{...base,age},{groundAt:()=>0});
    return {frame:wave.material.map,height:wave.scale.y,opacity:wave.material.opacity};
  };
  const release=snapshot(.02),travel=snapshot(.24),end=snapshot(.76);
  assert.notEqual(release.frame,travel.frame);
  assert.ok(travel.height>release.height);
  assert.ok(end.opacity<travel.opacity);
  assert.equal(arrow.material.opacity,1);
  assert.ok(Math.abs(wave.material.rotation)<1e-5);
  
  // The release must still appear when a close-range hit consumes the shot before rendering.
  view.entities.remove(wave);
  view.swordWaveRelease({x:0,y:1,z:0,facing:Math.PI/2});
  const slash=view.effects[0],startX=slash.mesh.position.x;
  assert.ok(startX>0);
  assert.equal(slash.kind,'swordWaveRelease');
  assert.ok(slash.mesh.material.opacity>.5);
  view.positionSwordWaveRelease(slash,.5);
  assert.ok(slash.mesh.position.x>startX);
  assert.equal(slash.mesh.material.opacity,.4);
});
