/* Original top-down Kokiri map art. Simulation coordinates remain in terrain.js. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./terrain.js'):root.BonkTerrain);if(typeof module==='object'&&module.exports)module.exports=api;else root.BonkKokiriFloor=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Terrain){
  'use strict';
  const outdoorExtent=Terrain.LIMIT+6;
  const OUTDOOR=Object.freeze({x0:-outdoorExtent,x1:outdoorExtent,z0:-outdoorExtent,z1:outdoorExtent,unit:6});
  const INTERIOR=Object.freeze({x0:-28,x1:28,z0:-28,z1:28,unit:8});
  const bounds=kind=>kind==='deku-entrance'||kind==='deku-arena'?INTERIOR:OUTDOOR;
  function canvasFor(w,h,factory){if(factory)return factory(w,h);const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  const colors=hex=>hex.split(' ').map(s=>parseInt(s,16));
  const GRASS=[
    colors('4e6338 516a3a 526b3d 556f40 4b6139 5a7446'),
    colors('5c7341 5f7846 637c48 687f49 597042 728951'),
    colors('687d46 69824b 70874c 778c52 627744 7c9256')
  ];
  const GRASS_VARIANTS=[
    colors('4b6140 4e6741 506a45 526d46 485e3d 567149'),
    colors('596e43 5b7347 61764c 647a4e 566b44 708255'),
    colors('647849 697d4b 70834d 758953 5f7245 7b9057')
  ];
  const COAST=colors('293e3d 927e5a 9f8964 b09b73 6b9067');
  const WATER=colors('2f615b 356b61 3e7969 4e8972 39736b 468378');
  const PATH=colors('72704d 92815c a39169 b3a077 bdac7d d0bd89');
  const BANK=colors('172e2d 203a35 2d4a3c 3a573f 516144 667252 87765a 635845 473f37');
  const DUNGEON=colors('171b1b 211f1e 2a2420 302921 392e24 433528 514130 5c4a36 6b553b');
  const YARD=colors('675a39 756341 7e6d47 8b784e 948253 a48b56 69513a');
  const LOAM=colors('43392f 4b4031 544733 5b4c36 62513b 4d4234');
  const BASALT=colors('3e4239 534b40 605346 756147 947a55 a68d5e');
  function hash(x,z,s=1){let h=Math.imul(x+16979,1597334677)^Math.imul(z+36469,3812015801)^Math.imul(s,1013904243);h=Math.imul(h^(h>>>16),2246822519);return (h^(h>>>13))>>>0;}
  function prepSegments(lines){const result=[];for(const line of lines)for(let n=1;n<line.length;n++){
    const [ax,az]=line[n-1],[bx,bz]=line[n],vx=bx-ax,vz=bz-az,inv=1/(vx*vx+vz*vz);
    result.push([ax,az,vx,vz,inv,Math.min(ax,bx),Math.max(ax,bx),Math.min(az,bz),Math.max(az,bz)]);
  }return result;}
  function distanceSq(x,z,segments,max){let d=max*max;for(let index=0;index<segments.length;index++){
    const row=segments[index];
    if(x<row[5]-max||x>row[6]+max||z<row[7]-max||z>row[8]+max)continue;
    const offsetX=x-row[0],offsetZ=z-row[1],t=Math.max(0,Math.min(1,(offsetX*row[2]+offsetZ*row[3])*row[4])),dx=offsetX-t*row[2],dz=offsetZ-t*row[3];
    d=Math.min(d,dx*dx+dz*dz);
  }return d;}
  function setPixel(out,index,ink){out[index]=ink>>16;out[index+1]=(ink>>8)&255;out[index+2]=ink&255;out[index+3]=255;}
  function pick(palette,h){const r=h%29;return palette[r<10?1:r<20?2:r<24?3:r<26?0:r<28?4:5];}
  function drawOutdoor(T,stage,box,c){
    const {x0,z0,unit}=box,{width:w,height:h}=c.canvas,im=c.createImageData(w,h);
    const zone=(stage===2?GRASS_VARIANTS:GRASS),limit=T.KOKIRI_WALL_INNER,bridge=T.VILLAGE.bridge;
    const lanes=prepSegments([...T.VILLAGE.trails,...T.OUTER_TRAILS]),
      hillTrail=prepSegments([T.DEKU_APPROACH]),
      brook=prepSegments([T.VILLAGE.brook]),
      pad=(x,z)=>Math.min(Math.abs(Math.hypot(x+16.6,(z+43.8)*.9)-4.75),4.75);
    const mapX=x=>(x-x0)*unit,mapZ=z=>(z-z0)*unit;
    // Reuse coarse elevations so painted cuts track the actual ramps. Grade is represented with bands, not lighting.
    const elevation=new Float32Array(Math.ceil(w/2)*Math.ceil(h/2)),stride=Math.ceil(w/2);
    for(let j=0;j<Math.ceil(h/2);j++)for(let i=0;i<stride;i++)elevation[j*stride+i]=T.height(T.KOKIRI_REALM,stage,x0+(i*2+1)/unit,z0+(j*2+1)/unit,true);
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){
      const x=x0+(i+.5)/unit,z=z0+(j+.5)/unit,k=(j*w+i)*4;
      const coarse=hash(i>>3,j>>3,stage),mid=hash(i>>1,j>>1,3),Fine=hash(i,j,7);
      const border=Math.max(Math.abs(x),Math.abs(z))-limit;
      if(border>-.58){
        const q=Math.abs(x)>Math.abs(z)?j:i;
        // Five perpendicular paint layers, with stepped seams laid along exact collision edge.
        const rim=hash(q>>3,(q>>5)&3,5)%3/12;
        const u=border+rim;
        let fill=u<0?0:u<.17?1:u<.58?4:u<1.21?5:u<2.04?6:u<2.8?7:u<3.69?8:u<4.4?3:u<5.1?2:0;
        if(u>1.25&&u<3.64&&((q+(hash(Math.floor(u*2),5,9)%19))%19<2||mid%17===0))fill=8;
        if(u>.42&&u<1.22&&mid%6===2)fill=3;
        setPixel(im.data,k,BANK[fill]);continue;
      }
      if(x>=bridge.x0&&x<bridge.x1&&Math.abs(z-bridge.z)<bridge.halfWidth){
        const px=Math.floor((x-bridge.x0)*unit),pz=(z-bridge.z+bridge.halfWidth)*unit;
        const board=hash(Math.floor(px/6),5,67)%3;
        const decking=colorsBridge[board];
        const edge=pz<2||pz>bridge.halfWidth*unit*2-2;
        let fill=px%6===0?0:px%6===1?4:mid%9===0?5:decking;
        if(edge)fill=px%24<3?4:pz<.95?0:3;
        if(px%6===3&&(Math.abs(pz-3.5)<.65||Math.abs(pz-(bridge.halfWidth*unit*2-3.5))<.65))fill=0;
        setPixel(im.data,k,PLANKS[fill]);continue;
      }
      let water=1.36-Math.sqrt(distanceSq(x,z,brook,2.7));
      for(const p of T.VILLAGE.pools){
        if(Math.abs(x-p.x)>p.rx+1.2||Math.abs(z-p.z)>p.rz+1.2)continue;
        water=Math.max(water,(1-Math.sqrt(((x-p.x)/p.rx)**2+((z-p.z)/p.rz)**2))*Math.min(p.rx,p.rz));
      }
      if(water>-.62){
        const wobble=(mid%7-3)*.045;
        const d=water+wobble,ink=d<-.42?COAST[4]:d<-.23?COAST[2]:d<-.07?COAST[3]:d<.09?COAST[0]:d<.35?WATER[3]:d<.61?WATER[2]:pick(WATER,coarse);
        const glitter=water>.36&&j%7===Math.floor(i/73)%7&&(hash(i>>2,j,126)%21<2);
        setPixel(im.data,k,glitter?0x95b396:ink);continue;
      }
      const path=Math.sqrt(distanceSq(x,z,lanes,4.7)),ascent=Math.sqrt(distanceSq(x,z,hillTrail,5.2));
      const track=Math.min(path-1.58,ascent-(z < -18 ?1.36:1.47));
      const apron=z<-39&&Math.hypot(x+16.6,(z+43.8)*.9)<5.05?-1.25+pad(x,z)*.14:8;
      const dirt=Math.min(track,apron),noise=(mid%7-3)*.075+(coarse%7-3)*.063;
      if(dirt+noise<.64){
        const edge=dirt+noise;
        const ink=edge>.46?PATH[0]:edge>.19?PATH[1]:edge>-.06?PATH[2]:edge>-.32?PATH[3]:pick(PATH,coarse+mid%4+40);
        setPixel(im.data,k,Fine%77===3?PATH[2]:ink);continue;
      }
      const level=elevation[(j>>1)*stride+(i>>1)];
      const near=elevation[Math.min(Math.ceil(h/2)-1,(j>>1)+1)*stride+(i>>1)];
      if(near+.24<level && dirt>.72){
        setPixel(im.data,k,level-near>.43?BASALT[1]:mid%3?BASALT[2]:BASALT[3]);continue;
      }
      const high=level>.35?level>1.85?2:1:0;
      const hatching=(i+j+coarse%4)%3===0&&coarse%23<3;
      const tone=pick(zone[high],coarse+(mid%6===0?3:0))+(high===0&&stage===3?0x020301:0);
      setPixel(im.data,k,hatching?zone[high][0]:tone);
    }
    c.putImageData(im,0,0);
    function pebble(px,pz,scale){
      c.fillStyle='#76684f';c.fillRect(px,pz+1,scale+1,2);c.fillStyle='#b4aa7e';c.fillRect(px+1,pz,scale,1);
    }
    function tuft(px,pz,s,shade){
      c.fillStyle=shade?'#395235':'#425b38';c.fillRect(px,pz+2,4,1);c.fillRect(px+1,pz+1,1,1);c.fillRect(px+2,pz,1,2);
      c.fillStyle=s?'#879e60':'#6f8b4e';c.fillRect(px-1,pz,1,1);c.fillRect(px,pz+1,1,1);c.fillRect(px+2,pz-1,1,1);c.fillRect(px+3,pz+1,1,1);
    }
    // A little squared vegetation frames the route without confusing the combat tells.
    const dressingSpan=box.x1-x0-2;
    for(let q=0;q<Math.round(3850*(dressingSpan/138)**2);q++){
      const i=hash(q,0,37),j=hash(q,19,61),x=x0+1+(i%8192)/8192*dressingSpan,z=z0+1+(j%8192)/8192*dressingSpan;
      if(Math.max(Math.abs(x),Math.abs(z))>limit-.9||T.villageWaterFeature(x,z,.6)||Math.hypot(x-T.DEKU_TREE.x,z-T.DEKU_TREE.z)<5.8)continue;
      if(x>bridge.x0-.2&&x<bridge.x1+.2&&Math.abs(z-bridge.z)<bridge.halfWidth+.3)continue;
      const px=Math.floor(mapX(x)),pz=Math.floor(mapZ(z)),road=Math.min(distanceSq(x,z,lanes,5),distanceSq(x,z,hillTrail,5));
      if(road<3.9){
        if((i>>8)%21===0)pebble(px,pz,(j>>9)%2+1);
        continue;
      }
      tuft(px,pz,(i>>7)%4===0,(j>>8)%4===1);
      if((i>>9)%41===0&&road<26){
        c.fillStyle='#bec18c';c.fillRect(px+2,pz-1,1,1);c.fillRect(px+3,pz,1,1);c.fillRect(px+1,pz,1,1);c.fillStyle='#cfb666';c.fillRect(px+2,pz,1,1);
      }
    }
    // Lilies and short reflections placed in discrete water clusters.
    for(let q=0;q<76;q++){
      const p=T.VILLAGE.pools[q%T.VILLAGE.pools.length],h=hash(q,10),a=(h%2048)*Math.PI/1024,r=.32+((h>>11)&255)/588;
      const px=Math.floor(mapX(p.x+Math.cos(a)*r*p.rx)),pz=Math.floor(mapZ(p.z+Math.sin(a)*r*p.rz));
      if(q%4===0){c.fillStyle='#3b6253';c.fillRect(px,pz,5,2);c.fillStyle='#8ba66d';c.fillRect(px+1,pz-1,3,1);c.fillRect(px,pz,4,1);
      if(q%8===0){c.fillStyle='#cfb99e';c.fillRect(px+1,pz-2,2,1);c.fillStyle='#ead5a8';c.fillRect(px+2,pz-3,1,1);}}
      else if(q%3===0){c.fillStyle='#81a499';c.fillRect(px,pz,2+q%3,1);}
    }
    // Bridge rail corners are paint, not a new obstacle.
    for(const x of [bridge.x0+1,bridge.x0+4,bridge.x1-4,bridge.x1-1])for(const z of [bridge.z-bridge.halfWidth+.03,bridge.z+bridge.halfWidth-.4]){
      const px=Math.floor(mapX(x)),pz=Math.floor(mapZ(z));
      c.fillStyle='#533f2e';c.fillRect(px-1,pz,3,3);c.fillStyle='#c1a775';c.fillRect(px-1,pz,2,1);
    }
  }
  const PLANKS=colors('483f33 8a7151 977c55 6e573d bba070 67533c'),colorsBridge=[1,2,1];
  function drawInterior(T,stage,kind,box,c){
    const {x0,z0,unit}=box,{width:w,height:h}=c.canvas,im=c.createImageData(w,h);
    const {halfWidth,openingZ,limit}=T.DEKU_ENTRANCE;
    const px=x=>Math.round((x-x0)*unit),pz=z=>Math.round((z-z0)*unit);
    const roots=prepSegments([
      [[-24,-20],[-19,-15],[-18,-10],[-12,-6],[-8,-5]],
      [[-25,-7],[-19,-7],[-16,-2],[-14,3],[-8,6]],
      [[22,-24],[19,-17],[16,-13],[16,-9],[11,-6],[9,-5]],
      [[25,-10],[21,-7],[19,-2],[14,1],[12,6]],
      [[-21,15],[-15,12],[-10,10],[-8,5]],
      [[15,19],[14,12],[11,9],[7,8]]
    ]);
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){
      const x=x0+(i+.5)/unit,z=z0+(j+.5)/unit,k=(j*w+i)*4;
      const n=hash(i>>2,j>>2,stage),hsh=hash(i>>4,j>>4,stage+9),fine=hash(i,j,9);
      const wall=Math.max(Math.abs(x),Math.abs(z))-limit;
      const throat=z-openingZ,bank=throat>0?Math.abs(x)-halfWidth:-Infinity;
      if(wall>0||bank>0){
        const depth=wall>0?wall:Math.min(bank,throat);
        const streak=Math.floor((i+3*Math.sin(j*.025)+2*Math.sin(j*.051))/8),mesh=(hash(streak,Math.floor(j/29),82)>>7)&7;
        const fill=depth<.19?6:depth<.53?8:depth<.87?5:depth<1.2?3:depth<2.5?3+mesh%3:depth<4?2+mesh%3:1+mesh%2;
        setPixel(im.data,k,DUNGEON[fill]);continue;
      }
      const r=Math.hypot(x,z*1.03);
      const leaf=(i+j)%4===0&&n%8===0;
      const root=Math.sqrt(distanceSq(x,z,roots,2.1));
      const passWidth=kind==='deku-entrance'?1.82:1.5,walk=Math.abs(x-.3*Math.sin(z*.3))<passWidth+(n%3)*.08&&z>4.2;
      const ring=(Math.abs(r-6.62)<.12||Math.abs(r-7.08)<.11);
      if(walk){
        setPixel(im.data,k,pick(YARD,hsh+((n%7)===0?4:0)));continue;
      }
      if(ring){setPixel(im.data,k,n%9?YARD[3]:YARD[2]);continue;}
      if(root<1.45+(hsh%3)*.08 &&r>7){
        const side=(i+j+(hsh%9))%11,ink=root>1.38?DUNGEON[3]:root>1.24?DUNGEON[7]:side<2?DUNGEON[5]:DUNGEON[6];
        setPixel(im.data,k,ink);continue;
      }
      const worn=r<6.55?pick(LOAM,hsh+fine%2):pick(LOAM,hsh);
      // Broken growth rings are quiet in the middle so Gohma's windups stay easy to read.
      const growth=Math.hypot(x*.95+(z+.4)*.10,z+.4),angular=Math.atan2(z,x);
      const grain=r>8&&r<22&&((angular*9+(r>15?.7:0))%1+.35)%1<.34&&Math.cos(growth*2.1+Math.sin(angular*3)*.55)>.976;
      setPixel(im.data,k,leaf?DUNGEON[5]:grain?DUNGEON[6]:worn);
    }
    c.putImageData(im,0,0);
    for(let i=0;i<440;i++){
      const h=hash(i,49,60),x=((h&2047)/2048-.5)*45.3,z=((h>>>13)/524288-.5)*45.3;
      const r=Math.hypot(x,z);
      if((z>openingZ&&Math.abs(x)>halfWidth-.18)||Math.hypot(x,z)<4.4||z>4&&Math.abs(x)<2.0)continue;
      const u=px(x),v=pz(z);
      c.fillStyle=r<8?'#695741':'#68543a';c.fillRect(u,v,(h>>>6)%3+1,1);
      if(i%17===0){c.fillStyle='#8a704c';c.fillRect(u+1,v-1,2,1);}
    }
    // The root entrance card stays open in the center, at the exact collision aperture.
    for(const z of [11.25,15.5,20.5])for(const side of [-1,1]){
      const u=px(side*(halfWidth+.12)),v=pz(z);
      c.fillStyle='#3d2d23';c.fillRect(u-3,v-3,7,8);c.fillStyle='#82563c';c.fillRect(u-2,v-2,5,6);
      c.fillStyle='#bd8949';c.fillRect(u-1,v-1,3,4);c.fillStyle='#e0b76d';c.fillRect(u,v,1,2);
      c.fillStyle='#eed6a0';c.fillRect(u,v-1,1,1);
    }
  }
  function paint(Terrain,stage,kind='outdoor',canvasFactory){
    const r=bounds(kind),canvas=canvasFor((r.x1-r.x0)*r.unit,(r.z1-r.z0)*r.unit,canvasFactory);
    const ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
    if(r===OUTDOOR)drawOutdoor(Terrain,stage,r,ctx);else drawInterior(Terrain,stage,kind,r,ctx);
    return canvas;
  }
  return Object.freeze({paint,bounds});
});
