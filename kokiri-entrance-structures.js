/* Solid Kokiri shrine and root-tunnel threshold. Materials are original nearest-sampled
   texels. These decorative meshes never add colliders or create a realm portal. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BonkKokiriEntrances=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TAU=Math.PI*2;
  const colors={
    bark:['231a16','33251b','433021','563725','68432c','805536','966641','a2744b'],
    cambium:['39291b','4c3623','5d4329','6b4b2f','875b36','9e6c44','ad8556','c09663'],
    moss:['253023','303925','3c4628','49532e','576231','68703a','778348','8c9253'],
    stone:['363b31','45483b','535543','63644b','747555','868564','979975','a8a784'],
    jade:['335148','456a57','507765','628c73','78a382','95bb91','b5d4a4','d7eabd'],
    glyph:['4a5d41','506e4e','568456','76a567','96be7d','c6d99b','d9e7af','edf3c6']
  };
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function hash(x,y,f){
    let n=Math.imul(x+37,0x62e2ac11)^Math.imul(y+133,0x3b7d2d01)^Math.imul(f+21,0x119de1f3);
    n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0;
  }
  function texels(kind){
    const w=48,h=48,data=new Uint8Array(w*h*4),p=colors[kind].map(s=>parseInt(s,16));
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const f=hash(x,y,2),lo=hash(x>>2,y>>2,6),bend=Math.trunc(2*Math.sin(y*.31)+1.2*Math.sin(y*.12+x*.16));
      const u=(x+bend+w)%w,stripe=hash(u>>2,0,8);
      let t;
      if(kind==='bark'||kind==='cambium'){
        t=2+stripe%5+(lo%9===0?-1:0)+(f%8===0?1:0);
        if(u%4===0&&lo%7!==0)t-=2;
        if(lo%11===0&&(y%4===2||u%4===1))t-=1;
        if(kind==='cambium'&&u%4===1)t+=1;
      }else if(kind==='moss'){
        t=2+lo%5+(f%6===0?1:0)-((u+y)%9===0?1:0);
      }else if(kind==='stone'){
        t=2+lo%4+(f%11===0?1:0)+(f%14===0?-1:0);
        if(y%14===0||x%23===0&&lo%3===0)t-=2;
        if(y%14===1)t+=1;
      }else if(kind==='jade'){
        t=2+(x>>4)+(y>>4)+((x+y)%19<2?2:0)+(f%18===0?1:0);
      }else{
        t=1+Math.floor(y/11)+(u%8<2?2:0)+(f%17===0?1:0);
      }
      const c=p[clamp(t,0,7)],i=(y*w+x)*4;
      data[i]=c>>16;data[i+1]=(c>>8)&255;data[i+2]=c&255;data[i+3]=255;
    }
    return{w,h,data};
  }
  function material(THREE,cache,kind){
    const key='kokiri-entrance:'+kind;
    if(!cache.has(key)){
      const {w,h,data}=texels(kind),map=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);
      map.name=key;map.colorSpace=THREE.SRGBColorSpace;
      map.wrapS=map.wrapT=THREE.RepeatWrapping;
      map.magFilter=map.minFilter=THREE.NearestFilter;map.generateMipmaps=false;map.needsUpdate=true;
      cache.set(key,new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,toneMapped:false,fog:false}));
    }
    return cache.get(key);
  }
  function add(THREE,group,cache,name,geo,kind,x=0,y=0,z=0){
    const mesh=new THREE.Mesh(geo,material(THREE,cache,kind));
    mesh.name=name;mesh.position.set(x,y,z);mesh.userData.kokiriOwnedGeometry=true;
    group.add(mesh);return mesh;
  }
  function buildShrine(THREE,environment,cache,groundAt){
    const group=new THREE.Group(),x=0,z=-7;
    group.name='kokiri-stage-shrine';group.position.set(x,groundAt(x,z),z);environment.add(group);
    const facets=12,platform=[
      [1.49,1.49,.26,.095],[1.27,1.35,.22,.33],[1.05,1.17,.21,.54],
      [.61,.71,.32,.76],[.46,.62,.64,1.19],[.68,.46,.22,1.62],[.56,.68,.17,1.81]
    ];
    platform.forEach(([top,base,h,y],i)=>add(THREE,group,cache,'kokiri-shrine-stone-'+i,
      new THREE.CylinderGeometry(top,base,h,facets,1),i===2?'moss':'stone',0,y));
    for(let i=0;i<4;i++){
      const a=TAU*i/4+.32,px=Math.cos(a)*.98,pz=Math.sin(a)*.98;
      const post=add(THREE,group,cache,'kokiri-shrine-carving-'+i,new THREE.BoxGeometry(.21,.39,.22),'moss',px,.66,pz);
      post.rotation.y=-a;
      const mark=add(THREE,group,cache,'kokiri-shrine-glyph-'+i,new THREE.BoxGeometry(.09,.13,.025),'glyph',px*1.11,.70,pz*1.11);
      mark.rotation.y=Math.PI/2-a;
    }
    const gem=add(THREE,group,cache,'kokiri-shrine-stage-gem',new THREE.OctahedronGeometry(.32),'jade',0,2.5);
    gem.scale.y=1.34;
    const ring=add(THREE,group,cache,'kokiri-shrine-stage-sigil',new THREE.TorusGeometry(.65,.028,4,12),'glyph',0,2.5);
    ring.rotation.x=.4;
    return {group,gem,ring};
  }
  function tube(points,radii,depth,taper=0){
    const p=[],uv=[],edge=8,n=points.length-1;
    // Loft along a curved silhouette in x/y, with genuine depth in z.
    function vertex(i,s){
      const a=points[Math.max(0,i-1)],b=points[Math.min(n,i+1)],c=points[i];
      const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),v=s/edge,ca=Math.cos(v*TAU),sn=Math.sin(v*TAU);
      return [c[0]+dy/len*radii[i]*ca,c[1]-dx/len*radii[i]*ca,c[2]+depth*sn*(1-taper*i/n),v,i/n*2.8];
    }
    function tri(a,b,c){for(const q of [a,b,c]){p.push(q[0],q[1],q[2]);uv.push(q[3],q[4]);}}
    for(let i=0;i<n;i++)for(let j=0;j<edge;j++){
      const a=vertex(i,j),b=vertex(i+1,j),c=vertex(i+1,j+1),d=vertex(i,j+1);tri(a,b,c);tri(a,c,d);
    }
    for(const i of [0,n]){
      const a=[...points[i],.5,.5];
      for(let s=0;s<edge;s++)tri(a,vertex(i,s),vertex(i,s+1));
    }
    return{p,uv};
  }
  function carved(THREE,parent,cache,name,points,radii,depth,kind,taper){
    const {p,uv}=tube(points,radii,depth,taper);
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    return add(THREE,parent,cache,name,g,kind);
  }
  function buildTunnel(THREE,Terrain,environment,cache){
    const {halfWidth:b,openingZ:z}=Terrain.DEKU_ENTRANCE,rows=[];
    const group=new THREE.Group();group.name='kokiri-deku-tunnel-threshold';environment.add(group);
    function capture(row){
      row.updateWorldMatrix(true,true);
      const box=new THREE.Box3().setFromObject(row);
      rows.push({row,minX:box.min.x,maxX:box.max.x,minY:box.min.y,maxY:box.max.y,minZ:box.min.z,maxZ:box.max.z});
    }
    for(const sign of [-1,1]){
      const row=new THREE.Group();row.name='kokiri-threshold-root-'+sign;group.add(row);
      // The root's inner wall never overhangs the collision lane at walk/jump height.
      const q=d=>sign*(b+d);
      carved(THREE,row,cache,'kokiri-threshold-main-root',
        [[q(1.78),-.38,z+.52],[q(1.24),.41,z+.36],[q(.89),2.08,z+.11],[q(.74),3.69,z-.17],[q(.63),5.09,z-.26],[q(.17),6.10,z-.22]],
        [1.42,1.09,.83,.71,.65,.53],1.08,'bark',.22);
      carved(THREE,row,cache,'kokiri-threshold-cambium',
        [[q(1.88),.02,z+1.48],[q(1.43),1.28,z+1.11],[q(1.19),2.77,z+.94],[q(1.09),4.14,z+.78],[q(.92),5.48,z+.60]],
        [.43,.37,.31,.24,.10],.24,'cambium',.6);
      carved(THREE,row,cache,'kokiri-threshold-moss',
        [[q(1.73),2.88,z+.76],[q(1.56),3.81,z+.80],[q(1.39),4.50,z+.71],[q(.97),5.65,z+.59]],
        [.27,.32,.24,.13],.24,'moss',.36);
      capture(row);
    }
    const lintel=new THREE.Group();lintel.name='kokiri-threshold-upper-root';group.add(lintel);
    carved(THREE,lintel,cache,'kokiri-threshold-lintel',
      [[-b-.55,5.68,z-.12],[-b*.60,6.51,z-.24],[-b*.29,7.18,z-.29],[.02,7.43,z-.18],[b*.32,7.15,z-.17],[b*.64,6.58,z-.19],[b+.59,5.70,z-.11]],
      [.45,.65,.55,.69,.59,.67,.46],.93,'bark',.10);
    carved(THREE,lintel,cache,'kokiri-threshold-moss-cap',
      [[-b-.29,6.13,z+.50],[-b*.68,6.89,z+.41],[-b*.29,7.67,z+.37],[.09,7.98,z+.39],[b*.40,7.62,z+.37],[b*.70,6.89,z+.36],[b+.36,6.21,z+.45]],
      [.10,.20,.30,.24,.29,.22,.08],.35,'moss',.16);
    capture(lintel);
    return rows;
  }
  return Object.freeze({buildShrine,buildTunnel,texels});
});
