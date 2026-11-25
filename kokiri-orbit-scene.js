/* World-aligned depth for Kokiri's 2D pixel art. No imported geometry or textures. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BonkKokiriOrbitScene=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const palette={
    cliff:['283831','303f34','3b4a39','455440','535d45','60694d','777957'],
    moss:['3a4e35','45583a','51653d','5d7142','697b47','78884e','899154'],
    root:['2b251e','342a22','413126','4d392a','584230','695039','785b40'],
    cambium:['362b21','463526','563e2c','624731','6e5036','79593b','8a6341']
  };
  const phase=(n,m)=>(n%m+m)%m;
  const rand=(x,y,s)=>{
    let i=Math.imul(x+41,0x3bd2310b)^Math.imul(y+207,0x67a718c7)^Math.imul(s,0x1f123bb5);
    i=Math.imul(i^(i>>>16),0x45d9f3b);
    return (i^(i>>>16))>>>0;
  };
  const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
  function texels(kind){
    const w=48,h=32,colors=palette[kind].map(v=>parseInt(v,16)),data=new Uint8Array(w*h*4),moss=kind==='moss',cap=kind==='cambium';
    const seed={cliff:81,moss:52,root:97,cambium:41}[kind];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const bend=[0,1,0,-1,0,1,2,1][y>>2],xx=phase(x+bend,w),
        row=(y>>2),col=xx>>2,r=rand(xx,y,seed),patch=rand(col,row,seed),
        striation=rand(col,0,seed),grain=rand(col+1,y>>3,seed);
      let tone;
      if(moss)tone=1+patch%5+(r%29===0?1:r%11===0?-1:0);
      else if(cap){
        const d=Math.round(Math.hypot(phase(xx+6,16)-8,(y%16-8)*.7));
        tone=3+(d%4===0?-2:d%4===1?1:0)+(r%9===0?1:patch%3===0?-1:0);
      }else{
        // Stepped grain gains breaks and dark knots, not interpolated stripes.
        tone=(xx%4===0?0:2+striation%4)+(r%7===0?-1:0);
        if((grain%5===0&&xx%4!==2)||(patch%9===0&&y%4===1))tone-=2;
        if(xx%4===2&&patch%5===1)tone++;
      }
      const c=colors[clamp(tone,0,6)],offset=(y*w+x)*4;
      data[offset]=c>>16;data[offset+1]=(c>>8)&255;data[offset+2]=c&255;data[offset+3]=255;
    }
    return {data,w,h};
  }
  function material(THREE,cache,kind){
    const key='kokiri-orbit-wall:'+kind;
    if(!cache.has(key)){
      const {data,w,h}=texels(kind),map=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);
      map.name=key;map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
      map.magFilter=map.minFilter=THREE.NearestFilter;map.generateMipmaps=false;map.needsUpdate=true;
      cache.set(key,new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,toneMapped:false,fog:false}));
    }
    return cache.get(key);
  }
  const bucket=()=>({p:[],uv:[]});
  function surface(out,points,toWorld,uv){
    for(const j of [0,1,2,0,2,3]){const v=points[j];out.p.push(...toWorld(...v));out.uv.push(...uv(...v));}
  }
  function block(out,toWorld,a,b,loA,loB,hiA,hiB,d0,d1,top=true){
    const face=(a,y)=>[a/7,y/3.8],side=(a,y,d)=>[(a+d)/7,y/3.8],cap=(a,y,d)=>[a/7,d/4.0];
    surface(out,[[a,loA,d0],[a,hiA,d0],[b,hiB,d0],[b,loB,d0]],toWorld,face);
    surface(out,[[b,loB,d1],[b,hiB,d1],[a,hiA,d1],[a,loA,d1]],toWorld,face);
    surface(out,[[a,loA,d1],[a,hiA,d1],[a,hiA,d0],[a,loA,d0]],toWorld,side);
    surface(out,[[b,loB,d0],[b,hiB,d0],[b,hiB,d1],[b,loB,d1]],toWorld,side);
    if(top)surface(out,[[a,hiA,d0],[a,hiA,d1],[b,hiB,d1],[b,hiB,d0]],toWorld,cap);
  }
  function add(THREE,parent,shape,mat,name){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(shape.p,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(shape.uv,2));
    const part=new THREE.Mesh(geometry,mat);part.name=name;part.userData.kokiriOwnedGeometry=true;
    parent.add(part);
  }
  function wall(THREE,environment,materials,cuts,options){
    const {start,end,edge,sign,axis,depth,groundAt,salt,inside}=options;
    const section=axis==='x'?(a,y,d)=>[sign*(edge+d),y,a]:(a,y,d)=>[a,y,sign*(edge+d)];
    const bark=material(THREE,materials,inside?'root':'cliff'),moss=material(THREE,materials,inside?'cambium':'moss');
    const toe=bucket(),toes=inside?.28:.54;
    const foot=a=>{const [x,,z]=section(a,0,0);return groundAt(x,z);};
    // An always-visible low lip describes the true collision edge, even in an orbit cutaway.
    for(let a=start;a<end;a+=2){
      const b=Math.min(a+2,end),lowA=foot(a)-.19,lowB=foot(b)-.19;
      block(toe,section,a,b,lowA,lowB,lowA+toes+.19,lowB+toes+.19,0,depth,true);
    }
    add(THREE,environment,toe,bark,inside?'deku-root-base':'kokiri-pixel-cliff-base');
    let id=0;
    for(let a=start;a<end;a+=8,id++){
      const b=Math.min(end,a+8),body=bucket(),cap=bucket(),span=b-a;
      let floor=Infinity,top=-Infinity;
      const row=new THREE.Group();row.name=inside?'deku-root-cutaway':'kokiri-cliff-cutaway';
      environment.add(row);
      for(let chunk=0;chunk<4;chunk++){
        const x=a+span*[0,.18,.48,.82][chunk],z=a+span*[.18,.48,.82,1][chunk];
        const y0=foot(x)+toes,y1=foot(z)+toes;
        const base=inside?1.68:2.32,h=base+(rand(id,chunk,salt)%5)*.28+([0,.49,.77,.28][chunk]),lip=.24+((chunk+id)%3)*.12;
        const c0=y0+h+lip,c1=y1+h+lip;
        block(body,section,x,z,y0,y1,c0-lip,c1-lip,0,depth,false);
        block(cap,section,x,z,c0-lip,c1-lip,c0,c1,0,depth,true);
        floor=Math.min(floor,y0,y1);
        top=Math.max(top,c0,c1);
      }
      add(THREE,row,body,bark,inside?'deku-pixel-root-side':'kokiri-pixel-cliff-face');
      add(THREE,row,cap,moss,inside?'deku-pixel-root-top':'kokiri-pixel-moss-cap');
      const [px,,pz]=section(a,0,0),[qx,,qz]=section(b,0,depth);
      cuts.push({row,minX:Math.min(px,qx),maxX:Math.max(px,qx),minY:floor-.08,maxY:top,minZ:Math.min(pz,qz),maxZ:Math.max(pz,qz)});
    }
  }
  function buildOutdoor(THREE,Terrain,environment,materials,stage,flatTerrain=false){
    const edge=Terrain.KOKIRI_WALL_INNER,depth=2.7,cuts=[];
    const groundAt=flatTerrain?()=>0:(x,z)=>Terrain.height(Terrain.KOKIRI_REALM,stage,x,z);
    for(const axis of ['x','z'])for(const sign of [-1,1]){
      const extent=edge+(axis==='x'?depth:0);
      wall(THREE,environment,materials,cuts,{start:-extent,end:extent,edge,sign,axis,depth,groundAt,salt:stage*17+sign*5+(axis==='x'?5:9),inside:false});
    }
    return cuts;
  }
  function buildInterior(THREE,Terrain,environment,materials){
    const {halfWidth:gap,openingZ:lip,limit}=Terrain.DEKU_ENTRANCE,cuts=[],groundAt=()=>0;
    const section=(axis,sign,edge,start,end,salt,depth=1.55)=>wall(THREE,environment,materials,cuts,
      {start,end,edge,sign,axis,depth,groundAt,salt,inside:true});
    for(const sign of [-1,1]){
      section('x',sign,limit,-limit,lip,11+sign);
      section('x',sign,gap,lip,limit,22+sign);
      section('z',1,lip,sign<0?-limit:gap,sign<0?-gap:limit,33+sign);
    }
    section('z',-1,limit,-limit,limit,39);
    section('z',1,limit,-gap,gap,40);
    return cuts;
  }
  function betweenWallAndHero(w,eye,hero){
    // Segment/AABB test. A low-angle camera doesn't need to collide with visual walls:
    // hide just the obstructing upper section, leave the boundary lip and physics intact.
    let lo=0,hi=1;const hy=hero.y+.72;
    function clip(a,b,min,max){
      const d=b-a;
      if(Math.abs(d)<1e-6)return a>=min-.56&&a<=max+.56;
      const n=(min-.56-a)/d,x=(max+.56-a)/d;
      lo=Math.max(lo,Math.min(n,x));hi=Math.min(hi,Math.max(n,x));return lo<=hi;
    }
    return clip(eye.x,hero.x,w.minX,w.maxX)&&clip(eye.y,hy,w.minY,w.maxY)&&clip(eye.z,hero.z,w.minZ,w.maxZ)&&hi>.013&&lo<.995;
  }
  function updateCutaways(cuts,eye,hero){for(const w of cuts||[])w.row.visible=!betweenWallAndHero(w,eye,hero);}
  return Object.freeze({buildOutdoor,buildInterior,updateCutaways});
});
