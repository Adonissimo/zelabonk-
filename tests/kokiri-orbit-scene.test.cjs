const {test}=require('node:test');
const assert=require('node:assert/strict');
const THREE=require('../vendor/three.min.js');
const Terrain=require('../terrain.js');
const scene=require('../kokiri-orbit-scene.js');
const vector=(...values)=>new THREE.Vector3(...values);
function make(inside=false){
  const root=new THREE.Group(),cache=new Map();
  const cuts=inside?scene.buildInterior(THREE,Terrain,root,cache):scene.buildOutdoor(THREE,Terrain,root,cache,3);
  root.updateMatrixWorld(true);return{root,cache,cuts};
}
function shoot(root,from,direction,far=100){return new THREE.Raycaster(vector(...from),vector(...direction),0,far).intersectObject(root,true);}

test('turning toward all four Kokiri walls reveals nearest-filtered, volumetric pixel art at the same boundary the game enforces',()=>{
  const{root,cache}=make(),limit=Terrain.KOKIRI_WALL_INNER,radius=.52;
  for(const [a,b] of [[-1,0],[1,0],[0,-1],[0,1]]){
    const crossed=Terrain.resolve(6,3,a*(limit-2),b*(limit-2),a*(limit+8),b*(limit+8),100,radius);
    assert.ok(Math.abs(crossed.x*a+crossed.z*b-(limit-radius))<.001);
    const from=[a*(limit-4),1.7,b*(limit-4)]; if(a)from[2]=8; else from[0]=8;
    const hits=shoot(root,from,[a,0,b],10);
    assert.ok(hits.length>=2);
    assert.ok(Math.abs(hits[0].distance-4)<1e-6,'inner face is precisely at the wall boundary');
    assert.ok(hits.some(({distance})=>distance>6),'wall has a separate reverse side and real depth');
    const above=[a*(limit+1),11,b*(limit+1)]; if(a)above[2]=8;else above[0]=8;
    assert.ok(shoot(root,above,[0,-1,0],12).some(hit=>hit.object.name==='kokiri-pixel-moss-cap'));
  }
  assert.equal(cache.size,2);
  for(const {map}of cache.values()){
    assert.equal(map.magFilter,THREE.NearestFilter);assert.equal(map.minFilter,THREE.NearestFilter);
    assert.ok(new Set(map.image.data).size>13,'the material has drawn color clusters');
  }
});

test('cutaways reveal the player from beyond the wall without opening a hole in the boundary',()=>{
  const{root,cuts}=make(),edge=Terrain.KOKIRI_WALL_INNER,hero=vector(edge-7,0,8.5);
  scene.updateCutaways(cuts,vector(edge+14,2,8.5),hero);
  const hidden=cuts.filter(c=>!c.row.visible);
  assert.ok(hidden.length>0&&hidden.length<4);
  assert.ok(hidden.every(c=>c.minX>=Terrain.KOKIRI_WALL_INNER));
  const bases=root.children.filter(c=>c.name==='kokiri-pixel-cliff-base');
  assert.equal(bases.length,4);
  assert.ok(bases.every(c=>c.visible));
  scene.updateCutaways(cuts,vector(edge-4,5,-5),hero);
  assert.ok(cuts.every(c=>c.row.visible),'orbiting inside the perimeter restores all wall pieces');
});
test('the Deku Tree still has an open passage bordered by real sidewalls and a chamber threshold',()=>{
  const{root}=make(true),{halfWidth,openingZ}=Terrain.DEKU_ENTRANCE;
  assert.equal(shoot(root,[0,1.25,openingZ+7],[0,0,-1],21).length,0,'approach and room stay joined through the central arch');
  const right=shoot(root,[0,1.25,openingZ+6],[1,0,0],10)[0];
  assert.ok(right);assert.ok(Math.abs(right.point.x-halfWidth)<1e-6);
  const corner=shoot(root,[halfWidth+4,1.25,openingZ-8],[0,0,1],15)[0];
  assert.ok(corner);assert.ok(Math.abs(corner.point.z-openingZ)<1e-6);
});
