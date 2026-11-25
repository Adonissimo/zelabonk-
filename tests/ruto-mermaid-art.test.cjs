const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(require.resolve('../art.js'),'utf8');

// The swim cels use only integer rectangles and image copies. A small backing
// buffer keeps the real art code and outlines testable without a browser addon.
function pixels(){
  const canvas={width:1,height:1};
  let buffer;
  const get=()=>buffer??=new Uint8ClampedArray(canvas.width*canvas.height*4);
  const make=(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});
  const context={
    fillStyle:'#000000',
    save(){},restore(){},setTransform(){},
    createImageData:make,
    fillRect(x,y,w,h){
      const ink=Number.parseInt(this.fillStyle.slice(1,7),16);
      // Match Canvas's negative-width fill behavior at rounded polygon tips.
      if(w<0){x+=w;w=-w;} if(h<0){y+=h;h=-h;}
      for(let xx=Math.max(0,x);xx<Math.min(canvas.width,x+w);xx++)for(let yy=Math.max(0,y);yy<Math.min(canvas.height,y+h);yy++){
        get().set([ink>>16&255,ink>>8&255,ink&255,255],(yy*canvas.width+xx)*4);
      }
    },
    getImageData(x,y,w,h){
      const image=make(w,h);
      for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
        const p=((y+yy)*canvas.width+x+xx)*4;
        image.data.set(get().subarray(p,p+4),(yy*w+xx)*4);
      }
      return image;
    },
    putImageData(image,x,y){
      for(let yy=0;yy<image.height;yy++)for(let xx=0;xx<image.width;xx++){
        const p=(yy*image.width+xx)*4;
        get().set(image.data.subarray(p,p+4),((y+yy)*canvas.width+x+xx)*4);
      }
    },
    drawImage(source,x,y){
      const {data}=source.getContext('2d').getImageData(0,0,source.width,source.height);
      for(let yy=0;yy<source.height;yy++)for(let xx=0;xx<source.width;xx++){
        const p=(yy*source.width+xx)*4;
        if(data[p+3])get().set(data.subarray(p,p+4),((y+yy)*canvas.width+x+xx)*4);
      }
    }
  };
  canvas.getContext=()=>context;
  return canvas;
}
const scope={window:{},document:{createElement:pixels}};
vm.runInNewContext(src,scope);
const art=scope.window.RelicArt;
function silhouette(direction,frame){
  const c=art.canvas('hero','ruto',direction,frame,'swim'), ctx=c.getContext('2d');
  const data=ctx.getImageData(0,0,c.width,c.height).data, points=[];
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    if(data[(y*c.width+x)*4+3])points.push([direction===6?111-x:x,y]);
  }
  return points;
}
test('Ruto’s profile cels propagate an upward wave through hips, knees and fin tips while her head stays forward',()=>{
  for(const dir of [2,6]){
    const seq=Array.from({length:8},(_,frame)=>silhouette(dir,frame));
    const peakAt=predicate=>seq.map(cel=>Math.min(...cel.filter(([x])=>predicate(x)).map(([,y])=>y)));
    const takeMin=rows=>rows.indexOf(Math.min(...rows));
    const hip=peakAt(x=>x>=43&&x<=49),knee=peakAt(x=>x>=26&&x<=36),fin=peakAt(x=>x<=19);
    assert.ok(takeMin(hip)<takeMin(fin),`hip leads fins, direction ${dir}`);
    assert.ok(takeMin(knee)<=takeMin(fin),`knee leads fins, direction ${dir}`);
    assert.ok(fin[4]<fin[0]-10,`fin kick changes the visible silhouette, direction ${dir}`);
    assert.ok(seq[7].some(([x,y])=>x<=19&&y>art.RUTO_SWIM_WATER_ROW),'recovery can dip under water');
    const head=peakAt(x=>x>=80);
    assert.ok(Math.max(...head)-Math.min(...head)<=3,'head steady while body undulates');
    assert.ok(new Set(seq.map(cel=>Math.max(...cel.map(([x])=>x)))).size===1,'no hand reaches ahead of her face');
  }
});
test('all eight camera headings get distinct moving swim pixels above the waterline, not a static bob',()=>{
  for(let dir=0;dir<8;dir++){
    const visibleCels=Array.from({length:8},(_,key)=>{
      const cel=silhouette(dir,key).filter(([,y])=>y<art.RUTO_SWIM_WATER_ROW);
      const top=Math.min(...cel.map(([,y])=>y));
      return JSON.stringify(cel.map(([x,y])=>[x,y-top]));
    });
    assert.ok(new Set(visibleCels).size>=6,`heading ${dir} has articulated pixels after removing vertical translation`);
  }
});
