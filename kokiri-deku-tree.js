/* Great Deku Tree: original pixel materials on a fixed, orbitable landmark.
   The three exterior references inform the silhouette and carved face, not the texels. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BonkDekuTree=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const wood=['34271e','493426','5b4230','6b4d34','7d5b3b','8d683e','9e7648','b18a51','c39c5d','d5ae6c'];
  const moss=['162a1c','223921','294723','36542a','49652e','5d7838','769048','9ca359'];
  const dark=['121a13','171d13','202719','28321b','354120','4a4c24'];
  const barkY=23, woodSpan=15.4, centerZ=-5.845, height=26.8;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  function hash(x,y,k){
    let v=Math.imul(x+1777,0x6c50b47d)^Math.imul(y+5189,0x28fa32a3)^Math.imul(k+71,0x382ad8ab);
    v=Math.imul(v^(v>>>16),0x45d9f3b);return (v^(v>>>16))>>>0;
  }
  function rgb(hex){const v=parseInt(hex,16);return [v>>16,(v>>8)&255,v&255];}
  function inside(x,y,points){
    let hit=false;
    for(let a=points.length-1,b=0;b<points.length;a=b++){
      const [x1,y1]=points[a],[x2,y2]=points[b];
      if((y1>y)!==(y2>y)&&x<(x2-x1)*(y-y1)/(y2-y1)+x1)hit=!hit;
    }
    return hit;
  }
  // One half of each facial shape is described in local world x/y. Shadows are
  // separate from the actual surface ridges; this adds depth without a smooth shader.
  const brow=[[.18,16.5],[1.16,16.4],[2.13,15.5],[3.52,14.9],[4.73,13.75],[5.14,12.1],[4.15,12.6],[3.05,12.88],[2.05,13.37],[1.23,14.62]];
  const underBrow=[[.79,14.74],[2.72,14.03],[4.29,13.5],[4.83,11.8],[4.06,10.64],[2.56,10.45],[1.73,11.1],[1.23,12.3]];
  const eye=[[1.62,11.5],[2.63,12.2],[3.71,12.08],[4.45,11.55],[3.78,11.22],[2.58,11.02],[1.98,11.11]];
  const crease=[[1.65,11.05],[2.54,10.74],[3.75,10.9],[4.53,11.38],[4.2,10.42],[3.2,9.94],[2.38,10.01]];
  const nose=[[0,14.68],[.59,14.32],[.77,12.73],[1.11,11.1],[1.64,9.62],[1.32,8.64],[.56,8.31],[0,8.25]];
  const moustache=[[.08,7.57],[.73,8.14],[1.65,8.25],[2.78,7.56],[3.67,6.68],[4.49,6.21],[5.77,5.87],[6.2,6.02],[5.65,5.38],[4.76,5.04],[3.56,5.12],[2.83,5.57],[2.21,6.13],[1.46,6.48],[.83,6.55]];
  const browHighlight=[[.22,16.5],[1.13,16.23],[2.31,15.50],[3.66,14.86],[4.72,13.52],[4.39,13.64],[3.52,14.45],[2.15,14.96],[.96,15.78]];
  const mustHighlight=[[.35,7.72],[.88,8.09],[1.76,8.09],[2.81,7.52],[3.68,6.65],[4.5,6.16],[5.75,5.87],[5.8,5.66],[4.53,5.77],[3.65,6.22],[2.63,7.07],[1.66,7.62],[.81,7.66]];
  function barkTone(x,y){
    const grain=Math.floor(x/2.25+Math.floor(y/11)/3+Math.sin(y*.071+x*.047)*.8),r=hash(grain,y>>4,41),r2=hash(grain,0,3);
    const split=(x+Math.floor(Math.sin(y*.14+x*.08)*2))%6===0?-1:0;
    return 3+(r2%4)+(r%7===0?-2:r%9===0?1:0)+split+(hash(x,y,11)%5===0?1:0);
  }
  function texels(kind){
    const front=kind==='face', foliage=kind.startsWith('leaf'), mouth=kind==='mouth', shut=kind==='shut';
    const w=front?154:foliage?64:mouth||shut?64:96,h=front?184:foliage?48:mouth||shut?96:96,data=new Uint8Array(w*h*4);
    const colors=wood.map(rgb),greens=moss.map(rgb),shades=dark.map(rgb);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const grain=barkTone(x,y);
      let color;
      if(foliage){
        const k=Number(kind.slice(-1)),v=hash(x>>3,y>>2,41+k),e=hash(x>>1,y>>1,k+92),spot=hash(x,y,k+37);
        const ridge=(x+y*3+(v%18))%13<5;
        let tone=1+(y<h*.45?1:0)+(k>>1)+(v%4)+(ridge?1:0)+(e%6===0?-2:0)+(spot%13===0?1:0);
        if(y>h*.82)tone-=2;
        color=greens[clamp(tone,0,7)];
      }else if(mouth){
        const edge=Math.max(0,(Math.abs(x-w/2)/(w/2))**2),near=y/h;
        color=shades[clamp(Math.floor(edge*3+near*4)+(hash(x>>1,y,3)%5===0?1:0)-1,0,5)];
      }else if(shut){
        const k=hash((x+y*.37)>>1,y>>2,41);
        color=colors[clamp(2+grain%4+(k%11===0?1:-1)+(x<w*.45?1:0)-(y<h*.28||y>h*.71?1:0),1,7)];
      }else if(front){
        const X=(x+.5)/w*woodSpan-woodSpan/2,Y=(1-(y+.5)/h)*barkY,a=Math.abs(X);
        let n=grain+(X<-.4?1:0)-(a>5.6?1:0);
        if(inside(a,Y,underBrow))n=1+grain%3;
        if(inside(a,Y,crease))n=4+grain%3;
        if(inside(a,Y,brow))n=5+grain%4-(X>0?1:0);
        if(inside(a,Y,browHighlight))n=8+grain%2-(X>0?1:0);
        if(inside(a,Y,eye))n=0+(grain%7===0?2:0);
        if(inside(a,Y,nose))n=5+grain%4-(X>0?1:0)-(Y<9.6?1:0);
        if(inside(a,Y,moustache))n=5+grain%4-(X>0?1:0);
        if(inside(a,Y,mustHighlight))n=8+grain%2-(X>0?1:0);
        if(Y<3 && hash(x>>3,y>>1,136)%12<Math.floor(3-Y))color=greens[2+grain%4];
        else color=colors[clamp(n,0,9)];
      }else{
        color=colors[clamp(grain-(kind==='rear'?1:0),0,9)];
        if(kind==='root'&&y>62&&hash(x>>3,y>>3,51)%7===0)color=greens[clamp(grain,2,5)];
      }
      const i=((h-1-y)*w+x)*4;data.set(color,i);data[i+3]=255;
    }
    return{data,w,h};
  }
  function materials(THREE,cache,kind){
    const key='deku-tree-material:'+kind;
    if(!cache.has(key)){
      const {data,w,h}=texels(kind),map=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);
      map.name=key;map.colorSpace=THREE.SRGBColorSpace;
      map.magFilter=map.minFilter=THREE.NearestFilter;map.generateMipmaps=false;map.needsUpdate=true;
      const solid=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,toneMapped:false,fog:false});
      const fade=solid.clone();fade.transparent=true;fade.opacity=.24;fade.depthWrite=false;
      cache.set(key,{solid,fade});
    }
    return cache.get(key);
  }
  const buffer=()=>({p:[],uv:[]});
  function tri(out,a,b,c){
    for(const t of [a,b,c]){out.p.push(...t.slice(0,3));out.uv.push(t[3],t[4]);}
  }
  function quad(out,a,b,c,d){tri(out,a,b,c);tri(out,a,c,d);}
  function mesh(THREE,parent,shape,cache,kind,name,parts){
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(shape.p,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(shape.uv,2));
    geo.computeBoundingSphere();
    const {solid,fade}=materials(THREE,cache,kind),part=new THREE.Mesh(geo,solid);
    part.name=name;part.userData.kokiriOwnedGeometry=true;
    if(parts)parts.push({mesh:part,solid,fade});
    parent.add(part);
    return part;
  }
  const profile=[
    [-.42,7.62,6.06],[1,7.48,5.99],[3,6.83,5.84],[5.8,6.27,5.68],[8.1,5.91,5.19],
    [11.3,5.41,4.98],[14.5,5.17,4.78],[17.3,5.09,4.67],[21.1,4.97,4.5],[25,4.72,4.35],[height,4.6,4.37]
  ];
  function section(y){
    for(let i=1;i<profile.length;i++){
      const [ay,ax,az]=profile[i-1],[by,bx,bz]=profile[i];
      if(y<=by){const t=(y-ay)/(by-ay);return [lerp(ax,bx,t),lerp(az,bz,t)];}
    }
    return profile.at(-1).slice(1);
  }
  function relief(x,y){
    const a=Math.abs(x),r=(x,y,w,h)=>Math.max(0,1-Math.hypot(x/w,y/h));
    const browDepth=r(a-2.65,y-(16.33-.51*a),3.1,1.55)*1.06;
    const eyelid=r(a-3.11,y-11.63,2.15,1.43)*.45;
    const tip=r(x,y-9.41,1.77,1.58)*1.65;
    const bridge=r(x,y-11.92,.9,3.14)*.95;
    const whisker=r(a-2.31,y-(8.08-Math.max(a-1.55,0)*.59),3.1,1.20)*1.09;
    return browDepth-eyelid+tip+bridge+whisker;
  }
  function mouthHalf(y){return y>6.55?0:y<2.35?2.23:2.23*Math.sqrt(1-((y-2.35)/4.20)**2);}
  function trunk(THREE,root,cache,parts){
    const front=buffer(),back=buffer(),across=80,rows=89,lo=profile[0][0],sy=(height-lo)/rows;
    function vertex(i,j,frontSide){
      const theta=(i/across)*Math.PI*2-Math.PI/2,y=lo+j*sy,[rx,rz]=section(y),sn=Math.sin(theta),cs=Math.cos(theta);
      const wave=(Math.sin(theta*9+y*.11)*.08+Math.sin(theta*17-y*.2)*.045);
      const x=sn*(rx+wave),z=centerZ+cs*(rz+wave)+(frontSide?relief(x,y)*Math.max(0,cs):0);
      return [x,y,z,frontSide?clamp(.5+x/woodSpan,0,1):(i-across*.5)/(across*.5),frontSide?clamp(y/barkY,0,1):y/height];
    }
    for(let i=0;i<across;i++)for(let j=0;j<rows;j++){
      const face=i<across/2;
      const a=vertex(i,j,face),b=vertex(i+1,j,face),c=vertex(i+1,j+1,face),d=vertex(i,j+1,face);
      const open=(p,q,r)=>face&&Math.abs((p[0]+q[0]+r[0])/3)<mouthHalf((p[1]+q[1]+r[1])/3);
      const out=face?front:back;
      if(!open(a,b,c))tri(out,a,b,c);
      if(!open(a,c,d))tri(out,a,c,d);
    }
    mesh(THREE,root,front,cache,'face','deku-carved-face',parts);
    mesh(THREE,root,back,cache,'rear','deku-rear-bark',parts);
  }
  // Each root is a low tapered curved section with its end independently grounded.
  function rootLeg(THREE,group,cache,parts,angle,length,width,lift,groundAt,portal,baseY,heading,id,scale){
    const out=buffer(),ax=Math.sin(angle),az=Math.cos(angle),nx=az,nz=-ax,rs=13,cs=10;
    function vertex(i,j){
      const s=i/rs,ang=j/cs*Math.PI*2,d=4.15+s*length,curve=Math.sin(s*2.4)*.58*Math.sign(ax||1);
      const cx=ax*d+nx*curve,cz=centerZ+az*d+nz*curve;
      const radius=Math.max(.075,width*(1-s)**1.24);
      const y=(groundAt(portal.x+(cx*Math.cos(heading)+cz*Math.sin(heading))*scale,portal.z+(-cx*Math.sin(heading)+cz*Math.cos(heading))*scale)-baseY)/scale-.17+(1-s)**2*lift+Math.max(0,Math.sin(ang))*radius*.67;
      return[cx+Math.cos(ang)*radius*nx,y,cz+Math.cos(ang)*radius*nz,s,1-j/cs];
    }
    for(let i=0;i<rs;i++)for(let j=0;j<cs;j++)quad(out,vertex(i,j),vertex(i+1,j),vertex(i+1,j+1),vertex(i,j+1));
    mesh(THREE,group,out,cache,'root','deku-buttress-root-'+id,parts);
  }
  function branch(THREE,group,cache,parts,s,side){
    const out=buffer(),n=8;const start=[s*3.35,13.4,centerZ-1.14*side],end=[s*8.15,18.65,centerZ-3.62*side];
    for(let j=0;j<n;j++){
      const pt=(end,a,r,u)=>[end[0],end[1]+Math.cos(a)*r,end[2]+Math.sin(a)*r,u,j/n];
      const a=j/n*Math.PI*2,b=(j+1)/n*Math.PI*2;
      const q=pt(start,b,1.97,0),t=pt(end,b,.44,1);q[4]=t[4]=(j+1)/n;
      quad(out,pt(start,a,1.97,0),pt(end,a,.44,1),t,q);
    }
    mesh(THREE,group,out,cache,'root','deku-branch-'+s,parts);
  }
  function crown(THREE,group,cache,parts,cx,cy,cz,rx,ry,rz,tone,id){
    const out=buffer(),circ=20,vert=11;
    function v(i,j){
      const phase=j/vert*Math.PI,angle=i/circ*Math.PI*2;
      const wobble=1+Math.sin(angle*4+id*1.81+phase*.93)*.09+Math.sin(angle*7+phase*3+id)*.061;
      return[cx+Math.cos(angle)*Math.sin(phase)*rx*wobble,cy+Math.cos(phase)*ry+Math.sin(angle*3+phase*5+id)*.31*Math.sin(phase),
        cz+Math.sin(angle)*Math.sin(phase)*rz*wobble,i/circ,1-j/vert];
    }
    for(let i=0;i<circ;i++)for(let j=0;j<vert;j++)quad(out,v(i,j),v(i+1,j),v(i+1,j+1),v(i,j+1));
    mesh(THREE,group,out,cache,'leaf'+tone,'deku-canopy-cluster-'+id,parts);
  }
  function cavern(THREE,group,cache,parts,closed){
    const out=buffer(),jamb=buffer(),portalH=6.55,ys=26,cols=14;
    function v(i,j,outer){
      const y=-.13+j/ys*(portalH+.13),half=mouthHalf(y);
      const ratio=(i/cols)*2-1,x=ratio*(half+(outer?.16:0));
      const z=closed?-.85+Math.cos(ratio*1.4)*.54+.12*Math.cos(y*2.7):outer?-.04:centerZ+2.22+Math.abs(ratio)*1.06;
      return [x,y,z,i/cols,j/ys];
    }
    for(let j=0;j<ys;j++){
      for(let i=0;i<cols;i++)quad(out,v(i,j,false),v(i+1,j,false),v(i+1,j+1,false),v(i,j+1,false));
      if(!closed)for(const i of [0,cols])quad(jamb,v(i,j,false),v(i,j,true),v(i,j+1,true),v(i,j+1,false));
    }
    mesh(THREE,group,out,cache,closed?'shut':'mouth',closed?'deku-closed-root-seal':'deku-recessed-mouth',parts);
    if(!closed)mesh(THREE,group,jamb,cache,'mouth','deku-recessed-mouth-walls',parts);
  }

  function build(THREE,environment,cache,portal,groundAt,heading=0,scale=1){
    const y=groundAt(portal.x,portal.z),parts=[];
    const body=new THREE.Group(),closed=new THREE.Group(),open=new THREE.Group();
    body.name='great-deku-tree-3d';closed.name='kokiri-closed-bark-door';open.name='kokiri-open-bark-door';
    for(const g of [body,closed,open]){g.position.set(portal.x,y,portal.z);g.rotation.y=heading;g.scale.setScalar(scale);environment.add(g);}
    trunk(THREE,body,cache,parts);
    [
      [-1.23,11.30,2.65,1.25],[-.86,9.7,2.24,.88],[-1.82,8.0,2.31,.84],[-2.38,7.4,1.88,1.02],
      [.88,9.8,2.31,1.22],[1.30,10.95,2.57,1.19],[1.81,8.9,2.35,.93],[2.44,6.8,1.66,.94],[3.14,4.95,1.7,.74]
    ].forEach(([a,l,w,h],i)=>rootLeg(THREE,body,cache,parts,a,l,w,h,groundAt,portal,y,heading,i,scale));
    branch(THREE,body,cache,parts,-1,-1);branch(THREE,body,cache,parts,1,1);
    // Broad layered crown breaks into clusters; the front still has a clean brow silhouette.
    [
      [0,22.5,-3.7,8.4,4.0,6.0,1],[-7.57,20.8,-5.73,5.95,3.3,4.8,1],[8.10,20.67,-5.70,6.25,3.2,4.58,1],
      [-6.05,22.70,-9.47,6.35,4.2,5.25,1],[6.76,22.78,-10.61,6.20,4.4,4.95,2],[.66,23.83,-10.17,6.75,4.0,5.15,2],
      [-4.8,25.85,-2.7,6.15,3.48,4.67,2],[4.88,25.46,-2.45,6.89,3.89,4.65,3],
      [-2.51,28.58,-6.27,6.1,3.55,4.85,3],[3.29,29.08,-6.63,5.35,3.54,4.56,4],[-9.78,22.89,-3.97,3.95,2.48,3.42,2],[10.38,22.42,-3.93,3.7,2.45,3.45,3]
    ].forEach((c,i)=>crown(THREE,body,cache,parts,...c,i));
    cavern(THREE,closed,cache,parts,true);cavern(THREE,open,cache,parts,false);
    open.visible=false;
    return{body,closed,open,parts,ray:new THREE.Raycaster(),target:new THREE.Vector3(),axis:new THREE.Vector3()};
  }
  function update(scene,eye,hero){
    if(!scene)return;
    const {parts,ray,target,axis,body}=scene;
    target.copy(hero);target.y+=1.02;
    axis.subVectors(target,eye);
    const range=axis.length();
    // Don't do intersection work while the focus is far from the clearing.
    const origin=body.position,near=Math.hypot(target.x-origin.x,target.z-origin.z+4)<24&&range>.5;
    let hits=null;
    if(near){
      ray.set(eye,axis.multiplyScalar(1/range));ray.near=.18;ray.far=range-.21;
      const candidates=[];
      for(const entry of parts)if(entry.mesh.parent.visible){entry.mesh.updateWorldMatrix(true,false);candidates.push(entry.mesh);}
      hits=new Set(ray.intersectObjects(candidates,false).map(o=>o.object));
    }
    for(const {mesh,solid,fade} of parts)mesh.material=hits?.has(mesh)?fade:solid;
  }
  return Object.freeze({build,update,texels});
});
