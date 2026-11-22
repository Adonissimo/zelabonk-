const {test}=require('node:test');
const assert=require('node:assert/strict');
const Camera=require('../camera.js');

test('mouse orbit makes repeated full turns without a horizontal stop or precision growth',()=>{
  let yaw=0,pitch=.78;
  for(let i=0;i<10000;i++)({yaw,pitch}=Camera.rotate(yaw,pitch,91,0));
  assert.ok(Math.abs(Math.sin(yaw)-Math.sin(-10000*91*.0035))<1e-9);
  assert.ok(yaw>=-Math.PI&&yaw<Math.PI);assert.equal(pitch,.78);
  assert.deepEqual(Camera.rotate(yaw,pitch,NaN,0),{yaw,pitch});
});

test('free cursor keeps turning at either edge and rests in the center',()=>{
  assert.ok(Camera.edgeTurn(0,1440,.02)>0);assert.ok(Camera.edgeTurn(1440,1440,.02)<0);
  assert.equal(Camera.edgeTurn(720,1440,.02),0);assert.equal(Camera.edgeTurn(-1,1440,.02),0);
  assert.equal(Camera.edgeTurn(0,1440,0),0);
  const single=Camera.edgeTurn(0,1440,.04),double=Camera.edgeTurn(0,1440,.02)*2;
  assert.ok(Math.abs(single-double)<1e-12);
});

test('vertical orbit allows horizon to overhead, honors inversion, and keeps a safe pole margin',()=>{
  assert.equal(Camera.rotate(0,.78,0,-10000).pitch,Camera.MIN_PITCH);
  assert.equal(Camera.rotate(0,.78,0,10000).pitch,Camera.MAX_PITCH);
  assert.ok(Camera.MIN_PITCH<.1&&Camera.MAX_PITCH>1.5&&Camera.MAX_PITCH<Math.PI/2);
  assert.ok(Camera.rotate(0,.78,0,5,1,true).pitch<.78);
});

test('eight character views follow actual camera heading through the angle seam',()=>{
  for(let i=0;i<8;i++)assert.equal(Camera.direction(i*Math.PI/4,0),i);
  assert.equal(Camera.direction(0,Math.PI*2),0);
  assert.equal(Camera.direction(-Math.PI+.01,Math.PI-.01),0);
});
