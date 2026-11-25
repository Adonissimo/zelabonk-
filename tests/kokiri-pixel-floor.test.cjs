const test=require('node:test');
const assert=require('node:assert/strict');
const Terrain=require('../terrain.js');
const floor=require('../kokiri-pixel-floor.js');

function raster(w,h){
  const canvas={width:w,height:h,pixels:new Uint8ClampedArray(w*h*4)};
  const ctx={
    canvas,createImageData:(x,y)=>({data:new Uint8ClampedArray(x*y*4)}),
    putImageData:image=>canvas.pixels.set(image.data),
    fillRect(x,y,width,height){
      const rgb=parseInt(this.fillStyle.slice(1),16);
      for(let j=Math.max(0,y);j<Math.min(h,y+height);j++)for(let i=Math.max(0,x);i<Math.min(w,x+width);i++){
        const k=(j*w+i)*4;canvas.pixels[k]=rgb>>16;canvas.pixels[k+1]=rgb>>8&255;
        canvas.pixels[k+2]=rgb&255;canvas.pixels[k+3]=255;
      }
    }
  };
  canvas.getContext=()=>ctx;
  return canvas;
}
function pixel(canvas,range,x,z){
  const i=Math.floor((x-range.x0)*range.unit), j=Math.floor((z-range.z0)*range.unit), k=(j*canvas.width+i)*4;
  return [...canvas.pixels.subarray(k,k+4)];
}
const outsideBounds=floor.bounds('outdoor'), outside=floor.paint(Terrain,1,'outdoor',raster);
test('painted village uses one fixed low-res coordinate grid; trail and water align with the walkable map',()=>{
  assert.deepEqual([outside.width,outside.height],[(Terrain.LIMIT+6)*12,(Terrain.LIMIT+6)*12]);
  const [tx,tz]=Terrain.DEKU_APPROACH[4],path=pixel(outside,outsideBounds,tx,tz);
  assert(path[0]>path[1]&&path[1]>path[2]&&path[0]>145);
  for(const point of Terrain.VILLAGE.pools){
    const [r,g,b,a]=pixel(outside,outsideBounds,point.x,point.z);
    assert(a===255&&g>r&&b>r,'pool center must be teal');
  }
  const {x0,x1,z}=Terrain.VILLAGE.bridge,[r,g,b]=pixel(outside,outsideBounds,(x0+x1)/2,z);
  assert(r>g&&g>b,'wood should cover the bridge crossing, not creek color');
});
test('flat border paint has a wall and moss cap at the same inner edge as collision',()=>{
  for(const sign of [-1,1]){
    const edge=Terrain.KOKIRI_WALL_INNER*sign;
    const land=pixel(outside,outsideBounds,edge-sign*1.4,12);
    const innerStroke=pixel(outside,outsideBounds,edge-sign*.35,12);
    const moss=pixel(outside,outsideBounds,edge+sign*.74,12);
    assert.notDeepEqual(land,innerStroke);
    assert.notDeepEqual(moss,innerStroke);
    assert(innerStroke[1]<land[1]&&moss[1]>innerStroke[1]);
    assert.equal(Terrain.resolveKokiriBoundary(edge+sign*4,12).x,edge-sign*.52);
  }
});
test('root entrance floor stays open in the center and mattes off the collision banks',()=>{
  const key='deku-arena', box=floor.bounds(key), canvas=floor.paint(Terrain,1,key,raster);
  assert.deepEqual([canvas.width,canvas.height],[448,448]);
  const {openingZ,halfWidth}=Terrain.DEKU_ENTRANCE, z=openingZ+3;
  const [lit]=pixel(canvas,box,0,z),[dark]=pixel(canvas,box,halfWidth+3,z);
  assert(lit>dark+45);
  assert(Terrain.resolveDekuEntrance(0,z,halfWidth+3,z).x<halfWidth);
});
