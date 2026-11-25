const test = require('node:test');
const assert = require('node:assert/strict');
const art = require('../kokiri-pixel-art.js');

// Emulate only the binary pixel ops the browser canvas should receive.
function canvasFactory(width,height){
  const pixels=new Array(width*height).fill(null);
  const ctx={
    fillStyle:'#000',imageSmoothingEnabled:true,clearRect(){pixels.fill(null);},
    fillRect(x,y,w,h){
      assert.ok([x,y,w,h].every(Number.isInteger),'canvas art must use whole pixels');
      for(let row=Math.max(0,y);row<Math.min(y+h,height);row++)
        for(let col=Math.max(0,x);col<Math.min(x+w,width);col++)
          pixels[row*width+col]=this.fillStyle;
    }
  };
  return {width,height,pixels,ctx,getContext(){return ctx;}};
}
const cel=(name,variant)=>art.paint(name,variant,canvasFactory);

test('all Kokiri scenery cels paint sharp opaque clusters on transparent, grounded cels',()=>{
  for(const [name,[width,height]] of Object.entries(art.sizes)){
    for(let v=0;v<5;v++){
      const image=cel(name,v);
      assert.equal(image.ctx.imageSmoothingEnabled,false);
      assert.equal(image.width,width);assert.equal(image.height,height);
      assert.ok(image.pixels.some(p=>p===null),name+' is not a solid canvas');
      assert.ok(image.pixels.slice(-width).some(Boolean),name+' has pixels at foot anchor');
      assert.ok(image.pixels.filter(Boolean).length>width*height*.09,name+' has a filled silhouette');
    }
  }
});
test('Deku sprites share the upper face; opening the gate changes only its threshold region',()=>{
  const locked=cel('deku'), open=cel('deku-open');
  assert.equal(locked.width,open.width);assert.equal(locked.height,open.height);
  assert.deepEqual(locked.pixels.slice(0,locked.width*74),open.pixels.slice(0,open.width*74));
  assert.notDeepEqual(locked.pixels.slice(locked.width*95),open.pixels.slice(open.width*95));
  assert.equal(locked.pixels[103*locked.width+56],'#c89c63','door lock is visible when closed');
  assert.ok(open.pixels[97*open.width+56],'open passage has drawn interior, not a through-plane hole');
});
test('homes and forest tree variants produce separate stable silhouettes/details',()=>{
  const painted=(name,count)=>new Set(Array.from({length:count},(_,i)=>cel(name,i).pixels.join(','))).size;
  assert.equal(painted('home',5),5);
  assert.equal(painted('tree',4),4);
  assert.equal(painted('root',2),2);
  assert.deepEqual(cel('tree',4).pixels,cel('tree',0).pixels);
});
