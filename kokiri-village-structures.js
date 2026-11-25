/* World-anchored Kokiri stump houses. All colors are authored pixel texels;
 * no photographic textures, camera-facing house sprites, or physics changes. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BonkKokiriVillage=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const wood=['292820','3e3024','513a2a','654a2f','785338','8b603b','a17545','bc955c','d6ae73','ecd294'];
  const moss=[
    ['3f5631','567242','70914f','a0b662'],
    ['3c542a','577443','76934c','a8b563'],
    ['54452d','79613b','a27e4d','cba466'],
    ['465239','5e704b','838c5c','b2af79'],
    ['445030','5a7041','839150','b5b772']
  ];
  const accents=[
    ['34524c','488075','7cb29d','cde0af'],
    ['6e483f','a07467','cfa28e','f1c695'],
    ['624628','a7743a','d4a861','f9d29a'],
    ['75452d','a45e3e','da8a5c','f2c283'],
    ['46645b','59847a','9cc3aa','d4e6bc']
  ];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const asNum=s=>parseInt(s,16);
  const colors=wood.map(asNum),greens=moss.map(a=>a.map(asNum)),swatches=accents.map(a=>a.map(asNum));
  const hash=(x,y,k)=>{
    const a=Math.imul(x+1239,0x2545f491)^Math.imul(y+815,0x45d9f3b)^Math.imul(k+31,0x27d4eb2d);
    const b=Math.imul(a^(a>>>15),0x7feb352d);return (b^(b>>>16))>>>0;
  };
  const TAU=Math.PI*2;
  function texels(kind,variant=0){
    const [w,h]=kind==='wall'?[96,56]:kind==='top'?[72,72]:kind==='door'?[24,32]:kind==='window'?[16,14]:[16,16];
    const d=new Uint8Array(w*h*4),palette=greens[variant],accent=swatches[variant];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const p=hash(x,y,variant),b=hash(x>>2,y>>2,variant+2);let color;
      if(kind==='wall'){
        const shift=Math.floor(Math.sin(y*.14)*1.7+Math.sin(y*.36)*.9),key=(x+shift+w)%w;
        const strip=hash(key>>2,0,variant+11),edge=key%4;
        color=colors[clamp(3+strip%4+(edge===0?-2:edge===1?1:0)-(y>h-8?1:0)+(p%9===0?1:0)-(b%7===0?1:0),1,8)];
        // Overlapping patches hang below the cut edge; stepped pixels, not gradients.
        const drips=hash(key>>3,1,variant+7)%11;
        if(y<3+drips+(hash(key>>1,0,4)%3)&&b%7!==0)color=palette[clamp(1+b%3-(y>8?1:0),0,3)];
        if(y>h-7&&b%3===0)color=palette[b%2];
      }else if(kind==='top'){
        const ox=(x-w*.50)/(w*.5),oy=(y-h*.48)/(h*.5),angle=Math.atan2(oy,ox);
        const radius=Math.hypot(ox,oy)*38+Math.sin(angle*3)*.8+Math.sin(angle*5)*1.1;
        const ring=(Math.max(0,radius)|0)%6;
        color=colors[clamp(5+(ring===0?0:ring<3?2:3)+(p%13===0?1:0)-(b%9===0?1:0),3,9)];
        if(radius>34+hash(x>>2,y>>2,7)%3)color=palette[b%4];
        const split=(Math.abs(oy-ox*.63)<.046&&ox>.19)||(Math.abs(ox+oy*.82)<.046&&oy<-.22);
        if(split&&p%8!==0)color=colors[3+p%3];
      }else if(kind==='door'){
        const beam=y===h-8||y===h-9||y===h-20||y===h-21;
        color=colors[clamp(2+hash(x>>2,0,variant)%3+(x%4===0?-2:x%4===1?1:0)+(p%17===0?1:0)+(beam?2:0),1,7)];
        if(y===h-10||y===h-22)color=colors[2];
        if(x>=16&&x<=18&&y>=17&&y<=19)color=colors[x===16||y===17?9:6];
      }else if(kind==='window'){
        const frame=x<2||x>=w-2||y<2||y>=h-2||x===Math.floor(w/2)||y===Math.floor(h/2);
        color=frame?colors[y===1||x===1?8:3]:accent[clamp(2-(y>h/2?1:0)+(p%9===0?1:0),0,3)];
      }else{
        color=(kind==='trim'?colors[4+(x+(y>>2))%5]:palette[b%4]);
      }
      const j=(x+(h-1-y)*w)*4;d[j]=color>>16;d[j+1]=color>>8&255;d[j+2]=color&255;d[j+3]=255;
    }
    return {data:d,width:w,height:h};
  }
  function material(THREE,cache,kind,variant){
    const key='kokiri-house:'+kind+':'+variant;
    if(!cache.has(key)){
      const {data,width,height}=texels(kind,variant),map=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
      map.name=key;map.colorSpace=THREE.SRGBColorSpace;map.magFilter=map.minFilter=THREE.NearestFilter;
      map.generateMipmaps=false;map.needsUpdate=true;
      const solid=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,fog:false,toneMapped:false});
      const fade=solid.clone();fade.transparent=true;fade.opacity=.25;fade.depthWrite=false;
      cache.set(key,{solid,fade});
    }
    return cache.get(key);
  }
  const shape=()=>({p:[],uv:[]});
  function tri(out,a,b,c){
    for(const t of [a,b,c]){out.p.push(t[0],t[1],t[2]);out.uv.push(t[3],t[4]);}
  }
  function quad(out,a,b,c,d){tri(out,a,b,c);tri(out,a,c,d);}
  function add(THREE,parent,cache,type,variant,name,out){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(out.p,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(out.uv,2));
    geometry.computeBoundingSphere();
    const {solid,fade}=material(THREE,cache,type,variant),mesh=new THREE.Mesh(geometry,solid);
    mesh.name=name;mesh.userData.kokiriOwnedGeometry=true;
    parent.add(mesh);parent.userData.parts.push({mesh,solid,fade});
    return mesh;
  }
  function stump(THREE,group,cache,h,variant){
    const wall=shape(),cap=shape(),sides=36,layers=[[-.16,1.025],[.27,1.005],[.84,.91],[1.87,.83],[h.height*.61,.81],[h.height*.87,.85],[h.height*.93,.98],[h.height*.985,1.01],[h.height, .975]];
    function v(y,ring,i,level,roof=false){
      const angle=Math.PI+i/sides*TAU;
      const breadth=1+Math.sin(angle*3+variant*.57)*.03+Math.sin(angle*7+variant*.82)*.021;
      const root=(Math.max(0,Math.sin(angle*6+.7+variant))**1.55)*.052*(level<2?1:level===2?.4:0);
      const a=h.radius*(ring*breadth+root),x=Math.sin(angle)*a,z=Math.cos(angle)*a;
      const step=y+(level>=6?Math.round(Math.sin(angle*3+variant)*2)*.037:0);
      return roof?[x,step,z,.5+x/(2.2*h.radius),.5+z/(2.2*h.radius)]:[x,step,z,i/sides,clamp((y+.16)/(h.height+.16),0,1)];
    }
    const row=(level,i,roof=false)=>v(...layers[level],i,level,roof);
    function wallAt(y,i){
      let j=1;
      while(j<layers.length-1&&layers[j][0]<y)j++;
      const [a,lo]=layers[j-1],[b,hi]=layers[j];
      return v(y,lo+(hi-lo)*clamp((y-a)/(b-a),0,1),i,j);
    }
    const cut=i=>h.height*(.48-.10*Math.abs(i-sides*.5)),id=sides*.5;
    for(let i=0;i<sides;i++){
      if(i<id-1||i>=id+1){
        for(let j=0;j<layers.length-1;j++)quad(wall,row(j,i),row(j,i+1),row(j+1,i+1),row(j+1,i));
      }else{
        const a=cut(i),b=cut(i+1),lip=Math.max(a,b);
        const j=layers.findIndex(([y])=>y>=lip);
        quad(wall,wallAt(a,i),wallAt(b,i+1),row(j,i+1),row(j,i));
        for(let k=j;k<layers.length-1;k++)quad(wall,row(k,i),row(k,i+1),row(k+1,i+1),row(k+1,i));
      }
      tri(cap,[0,h.height+.018,0,.5,.5],row(layers.length-1,i,true),row(layers.length-1,i+1,true));
    }
    add(THREE,group,cache,'wall',variant,'stump-bark-shell',wall);
    add(THREE,group,cache,'top',variant,'stump-annual-rings',cap);
  }
  function box(out,cx,cy,cz,width,height,depth,angle=0){
    const a=width/2,b=height/2,c=depth/2,cs=Math.cos(angle),sn=Math.sin(angle);
    const p=(x,y,z,u,v)=>[cx+x*cs+z*sn,cy+y,cz+z*cs-x*sn,u,v];
    const q=(aa,bb,cc,dd)=>quad(out,p(...aa,0,0),p(...bb,1,0),p(...cc,1,1),p(...dd,0,1));
    q([-a,-b,c],[a,-b,c],[a,b,c],[-a,b,c]);q([a,-b,-c],[-a,-b,-c],[-a,b,-c],[a,b,-c]);
    q([-a,-b,-c],[-a,-b,c],[-a,b,c],[-a,b,-c]);q([a,-b,c],[a,-b,-c],[a,b,-c],[a,b,c]);
    q([-a,b,c],[a,b,c],[a,b,-c],[-a,b,-c]);q([-a,-b,-c],[a,-b,-c],[a,-b,c],[-a,-b,c]);
  }
  function facade(THREE,group,cache,h,variant){
    const door=shape(),trim=shape(),windows=shape(),r=h.radius;
    const w=r*.298,ht=h.height*.531,edge=r*.897;
    const cap=[
      [-1,0],[1,0],[1,.54],[.94,.7],[.77,.85],[.48,.96],[.19,1],
      [-.19,1],[-.48,.96],[-.77,.85],[-.94,.7],[-1,.54]
    ];
    function v(i,m,depth){
      const [x,y]=cap[i],d=depth+.09*(1-x*x);
      return [x*w*m,.06+(y-.06)*ht*m,d,.5+x*.5,y];
    }
    const threshold=.26;
    for(let i=0;i<cap.length;i++){
      const next=(i+1)%cap.length;
      tri(door,[0,ht*.44,edge+.09,.5,.44],v(i,1,edge),v(next,1,edge));
      quad(trim,v(i,1,edge),v(next,1,edge),v(next,1.14,edge+threshold),v(i,1.14,edge+threshold));
      quad(trim,v(i,1.14,edge+threshold),v(next,1.14,edge+threshold),
           v(next,1.14,edge-.15),v(i,1.14,edge-.15));
    }
    box(trim,0,.17,r*.926,r*.73,.31,r*.31);
    // One fanlight / stack of panes, plus role-specific shutters and storefront trim.
    const pane=(a,y,s)=>{
      const depth=r*.852,wx=Math.sin(a)*depth,wz=Math.cos(a)*depth;
      const t=.10*s;
      box(windows,wx,y,wz,1.06*s,.88*s,.18*s,a);
      box(trim,wx+Math.sin(a)*t,y-.456*s,wz+Math.cos(a)*t,1.28*s,.13*s,.28*s,a);
      if(variant===2||variant===4){
        for(const side of [-1,1])box(trim,wx+Math.cos(a)*side*.60*s,y,wz-Math.sin(a)*side*.60*s,.18*s,.93*s,.31*s,a);
      }
    };
    pane(.60,h.height*.58,variant===2?1.22:1);
    pane(-.64,h.height*.48,variant===3?1.07:.87);
    if(variant===2){
      box(windows,-w*.99,ht*1.26,r*.81,w*1.03,.45,.16,-.39);
      box(trim,-w*.99,ht*1.258,r*.742,w*1.15,.58,.11,-.39);
    }else if(variant===4){
      box(trim,0,ht*1.31,r*.87,r*.75,.32,.72);
    }
    add(THREE,group,cache,'door',variant,'recessed-plank-door',door);
    add(THREE,group,cache,'trim',variant,'carved-door-jamb-and-sills',trim);
    add(THREE,group,cache,'window',variant,'window-panes',windows);
  }
  function buildHome(THREE,parent,cache,h,variant,groundAt){
    const home=new THREE.Group();
    home.name='kokiri-home-'+h.role;
    home.position.set(h.x,groundAt(h.x,h.z),h.z);
    home.rotation.y=h.turn;
    home.userData.parts=[];
    home.userData.radius=h.radius;
    home.userData.height=h.height;
    home.userData.ray=new THREE.Raycaster();
    home.userData.axis=new THREE.Vector3();
    home.userData.candidates=[];
    stump(THREE,home,cache,h,variant);
    facade(THREE,home,cache,h,variant);
    for(const {mesh} of home.userData.parts)home.userData.candidates.push(mesh);
    parent.add(home);
    return home;
  }
  function update(homes,eye,hero){
    for(const home of homes||[]){
      const {parts,radius,ray,axis,candidates}=home.userData;
      const dx=hero.x-eye.x,dz=hero.z-eye.z,l2=dx*dx+dz*dz;
      const t=l2?clamp(((home.position.x-eye.x)*dx+(home.position.z-eye.z)*dz)/l2,0,1):0;
      let cover=false;
      if(Math.hypot(home.position.x-(eye.x+t*dx),home.position.z-(eye.z+t*dz))<radius*1.18){
        axis.copy(hero);axis.y+=1.02;axis.sub(eye);
        const distance=axis.length();
        if(distance>.51){
          home.updateWorldMatrix(true,true);
          ray.set(eye,axis.multiplyScalar(1/distance));ray.near=.18;ray.far=distance-.23;
          cover=ray.intersectObjects(candidates,false).length>0;
        }
      }
      for(const {mesh,solid,fade} of parts)mesh.material=cover?fade:solid;
    }
  }
  return Object.freeze({buildHome,update,texels});
});
