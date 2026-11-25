/* North-up surveyed terrain and pixel markers; all positions are world x/z. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.BonkMinimap=factory();
})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const SIZE=144, MARGIN=10, SPAN=SIZE-2*MARGIN;
  const GLYPHS=Object.freeze({
    player:{ink:'#fff6dc',rows:['....#....','...###...','...###...','..#####..','..#####..','.#######.','.###.###.','##.....##']},
    ally:{ink:'#9de9e1',rows:['..##.##..','.#######.','.#######.','..#####..','...###...','....#....']},
    shrine:{ink:'#c8d5fd',rows:['....#....','...#.#...','..#...#..','..#.#.#..','...#.#...','....#....','..#####..']},
    objective:{ink:'#ffe291',rows:['....#....','...###...','..##.##..','.##...##.','..##.##..','...###...','....#....']},
    boss:{ink:'#ffa096',rows:['..#####..','.#######.','.#..#..#.','.#..#..#.','.#######.','..#.#.#..']},
    loot:{ink:'#efd18b',rows:['...###...','..#####..','...###...','....#....']},
    castle:{ink:'#e6ddd0',rows:['.#.#.#.#.','.#######.','..#####..','..##.##..','.###.###.','.###.###.','#########']},
    sea:{ink:'#c4e9e8',rows:['....#....','...##....','..###....','.####....','....#....','#########','.#######.']},
    mirror:{ink:'#ead1fe',rows:['..#####..','.#.....#.','.#..#..#.','.#.....#.','..#####..','....#....','..#####..']},
    wing:{ink:'#e3f0ee',rows:['##.....##','###...###','.#######.','..#####..','...###...','....#....']},
    root:{ink:'#e7eab0',rows:['...###...','..#####..','.#.###.#.','...###...','...###...','..#.#.#..','.#..#..#.']},
    clock:{ink:'#e8dcc0',rows:['....#....','...###...','..#####..','..##.##..','..#..##..','..#####..','..#####..']},
    tree:{ink:'#aee093',rows:['...###...','..#####..','.#######.','#########','##.###.##','...###...','..#.#.#..']},
    jabu:{ink:'#a9ecdf',rows:['...###...','..#.#.#..','..#####..','.#######.','##.#.#.##','.#######.','..#####..']},
    house:{ink:'#d4c6a4',rows:['...###...','..#####..','.#######.','.###.###.','.###.###.']},
    doorway:{ink:'#ead5a9',rows:['...###...','..#####..','.###.###.','.##...##.','.##...##.','###...###']}
  });
  const OUTDOOR_ICONS=[
    {x:-17,z:-26,glyph:'castle'},{x:32,z:-26,glyph:'sea'},{x:-15,z:-18,glyph:'mirror'},{x:-12,z:-22,glyph:'wing'},
    {x:-16,z:-19,glyph:'root'},{x:11,z:-22,glyph:'clock'},{glyph:'tree'},{glyph:'jabu'}
  ];
  const LAND_TONES=[
    ['#263d36','#38543c','#4f6240'],['#354943','#485947','#5a6651'],['#39374e','#4a465c','#615471'],['#374740','#506150','#616f5a'],
    ['#332d40','#484052','#594754'],['#38384c','#474957','#5e5a63'],['#293e33','#39573b','#4e6746'],['#304846','#476059','#5e6d5d']
  ];
  const point=(x,z,glyph,label,extra)=>({x,z,glyph,label,...extra});
  const isPoint=o=>Number.isFinite(o?.x)&&Number.isFinite(o?.z);
  const clamp01=t=>Math.max(0,Math.min(1,t));
  function mapInfo(game,Terrain){
    const inner=!!game.landmark,realm=game.realm,stage=game.stage||1,flat=!!game.flatTerrain;
    // This is the same bound the game uses, rather than a radius around the player.
    const limit=game.arenaLimit||Terrain.LIMIT;
    const tunnel=inner&&realm===Terrain.KOKIRI_REALM&&game.kokiriStory?Terrain.DEKU_ENTRANCE:null;
    return {inner,realm,stage,flat,limit,tunnel,key:[realm,stage,flat,limit,inner?game.landmark.style:'outside',!!tunnel].join(':')};
  }
  function projection(limit,x,z){
    return [MARGIN+SPAN*clamp01((x+limit)/(limit*2)),MARGIN+SPAN*clamp01((z+limit)/(limit*2))];
  }
  function walkable(info,x,z){
    const {limit,tunnel}=info;
    return Math.abs(x)<=limit&&Math.abs(z)<=limit&&(!tunnel||z<=tunnel.openingZ||Math.abs(x)<=tunnel.halfWidth);
  }
  function terrainMarkers(game,Terrain,realms){
    if(game.landmark)return [];
    const realm=game.realm,real=realms[realm],spec=OUTDOOR_ICONS[realm];
    const location=realm===Terrain.KOKIRI_REALM?Terrain.DEKU_TREE:realm===Terrain.ZORA_REALM?Terrain.ZORA_FOUNTAIN.jabu:(Terrain.SCENIC_STRUCTURES?.[realm]||spec);
    const out=[point(location.x,location.z,spec.glyph,real.landmark)];
    if(realm===Terrain.KOKIRI_REALM){
      for(const home of Terrain.VILLAGE.homes)out.push(point(home.x,home.z,'house',home.role+' home',{small:true}));
    }
    // The existing shrine remains at the world's actual interaction coordinates.
    if(game.mode!=='training'&&!game.shrines.has(realm))out.push(point(0,-7,'shrine','Stage shrine'));
    return out;
  }
  function objective(game,Terrain,view){
    if(game.state!=='running'&&game.state!=='paused'&&game.state!=='upgrade')return null;
    if(game.sariaRescue&&isPoint(view?.sariaRescue?.to)){
      const {x,z}=view.sariaRescue.to;return point(x,z,'objective','Meet Saria');
    }
    if(game.boss&&!game.boss.dead&&isPoint(game.boss))return point(game.boss.x,game.boss.z,'boss','Defeat '+game.boss.name);
    if(game.landmarkApproach){
      return point(0,Terrain.DEKU_ENTRANCE.openingZ,'objective','Follow the root tunnel');
    }
    if(game.dekuTrailReady){
      const next=Terrain.dekuWaypoint(game.player.x,game.player.z);
      return point(next.x,next.z,'objective','Follow the trail to the Great Deku Tree');
    }
    if(game.mode==='adventure'&&game.stageReady&&game.stage<3&&!game.shrines.has(game.realm))return point(0,-7,'objective','Advance at the stage shrine');
    if(game.mode==='survival'&&!game.shrines.has(game.realm))return point(0,-7,'objective','Activate the shrine');
    return null;
  }
  function snapshot(game,Terrain,realms,view){
    const info=mapInfo(game,Terrain),target=objective(game,Terrain,view),landmarks=terrainMarkers(game,Terrain,realms);
    const allies=(game.companions||[]).filter(isPoint).map(ally=>point(ally.x,ally.z,'ally',ally.hero));
    const loot=(game.loot||[]).filter(isPoint).map(drop=>point(drop.x,drop.z,'loot','Treasure'));
    const threats=(game.enemies||[]).filter(e=>e.type!=='boss'&&!e.dead&&isPoint(e)&&Math.hypot(e.x-game.player.x,e.z-game.player.z)<37);
    return {info,landmarks,target,allies,loot,threats,player:game.player};
  }
  function stamp(c,name,x,y,heading=null,ink=null){
    const shape=GLYPHS[name],centerX=Math.floor(shape.rows[0].length/2),centerY=Math.floor(shape.rows.length/2);
    const a=heading===null?0:Math.round(heading/(Math.PI/4))*Math.PI/4,cos=Math.cos(a),sin=Math.sin(a),dots=[];
    for(let j=0;j<shape.rows.length;j++)for(let i=0;i<shape.rows[j].length;i++)if(shape.rows[j][i]==='#'){
      const dx=i-centerX,dy=j-centerY;
      dots.push([Math.round(x+dx*cos-dy*sin),Math.round(y+dx*sin+dy*cos)]);
    }
    c.fillStyle='#17232c';for(const [u,v] of dots)c.fillRect(u-1,v-1,3,3);
    c.fillStyle=ink||shape.ink;for(const [u,v] of dots)c.fillRect(u,v,1,1);
  }
  // A whole-realm view compresses a close companion to the player's pixel.
  // Assign nearby clear spots, with a stem back to each actual world point.
  const SHIFTS=[[0,0],[0,10],[10,0],[-10,0],[0,-10],[8,8],[-8,8],[8,-8],[-8,-8],[0,20],[20,0],[-20,0],[0,-20],[10,20],[-10,20],[20,10],[-20,10],[20,-10],[-20,-10],[10,-20],[-10,-20],[15,15],[-15,15],[15,-15],[-15,-15]];
  function arrangePins(limit,player,pins){
    const first=projection(limit,player.x,player.z),taken=[{pin:{glyph:'player'},x:first[0],y:first[1]}];
    const result=[];
    for(const pin of pins){
      const [u,v]=projection(limit,pin.x,pin.z);
      let place=SHIFTS.map(([dx,dy])=>[u+dx,v+dy]).find(([x,y])=>x>=MARGIN&&y>=MARGIN&&x<=SIZE-MARGIN&&y<=SIZE-MARGIN&&
        taken.every(other=>Math.abs(other.x-x)>=9||Math.abs(other.y-y)>=9));
      // Keep a real location rather than suppressing a marker if the local area
      // is too crowded. High-priority markers have already reserved their spots.
      place||=[u,v];
      const [x,y]=place,mark={pin,x,y,u,v};
      taken.push(mark);result.push(mark);
    }
    return result;
  }
  function connector(c,x,y,u,v){
    c.fillStyle='#bfae9a';
    const length=Math.max(1,Math.ceil(Math.hypot(u-x,v-y)));
    for(let i=0;i<=length;i+=2)c.fillRect(Math.round(x+(u-x)*i/length),Math.round(y+(v-y)*i/length),1,1);
    c.fillRect(Math.round(u),Math.round(v),1,1);
  }
  const canvases=new WeakMap();
  function backdrop(c,info,Terrain){
    const {realm,stage,limit,flat,inner,tunnel}=info, palette=LAND_TONES[realm]||LAND_TONES[0];
    c.fillStyle='#1b2730';c.fillRect(0,0,SIZE,SIZE);
    c.fillStyle='#273449';c.fillRect(3,3,SIZE-6,SIZE-6);
    const step=2,n=SPAN/step;
    for(let iz=0;iz<n;iz++)for(let ix=0;ix<n;ix++){
      const x=(ix+.5)/n*limit*2-limit,z=(iz+.5)/n*limit*2-limit;
      if(!walkable(info,x,z)){c.fillStyle='#453c3b';}
      else if(inner){c.fillStyle=tunnel&&z>tunnel.openingZ?'#755d48':iz%4===0&&ix%4===0?'#695e48':'#534a42';}
      else{
        const y=flat?0:Terrain.height(realm,stage,x,z);
        const wet=!flat&&Terrain.sampleWater(realm,stage,x,z);
        const noise=(ix*83^iz*211^(ix*iz*47))&15;
        c.fillStyle=wet?(wet.depth>.42?(noise<3?'#32728c':'#29637c'):'#3c7e88'):
          y>1.5?palette[2]:y>.35||noise<3?palette[1]:palette[0];
      }
      c.fillRect(MARGIN+ix*step,MARGIN+iz*step,step,step);
    }
    c.strokeStyle='#b6a482';c.lineWidth=1;c.strokeRect(MARGIN-.5,MARGIN-.5,SPAN+1,SPAN+1);
    c.fillStyle='#cfb882';
    for(const x of [3,SIZE-9])for(const y of [3,SIZE-9])c.fillRect(x,y,6,6);
    c.fillStyle='#786445';
    for(const x of [4,SIZE-8])for(const y of [4,SIZE-8])c.fillRect(x,y,4,4);
    c.fillStyle='#eee1bb';c.font='bold 8px monospace';c.textAlign='center';c.fillText('N',SIZE/2,8);
    if(!inner&&!flat){
      for(const route of Terrain.OUTER_TRAILS||[])track(c,limit,route,'#6d765c',1);
      for(const {x,z} of Terrain.SCENIC_TRAILS)track(c,limit,[[0,0],[x,z]],'#71795f',1);
      if(realm===Terrain.KOKIRI_REALM)for(const route of [...Terrain.VILLAGE.trails,Terrain.DEKU_APPROACH])track(c,limit,route,'#94805b',1);
    }
  }
  function track(c,limit,route,color,width=1){
    c.fillStyle=color;
    for(let i=1;i<route.length;i++){
      const a=projection(limit,...route[i-1]),b=projection(limit,...route[i]);
      const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])));
      for(let k=0;k<=steps;k++)c.fillRect(Math.round(a[0]+(b[0]-a[0])*k/steps),Math.round(a[1]+(b[1]-a[1])*k/steps),width,width);
    }
  }
  function draw(canvas,game,Terrain,realms,view){
    if(!game||!canvas)return;
    const c=canvas.getContext('2d');if(!c)return;
    const {info,landmarks,target,allies,loot,threats,player}=snapshot(game,Terrain,realms,view);
    let cache=canvases.get(canvas);
    if(!cache||cache.key!==info.key){
      const base=canvas.ownerDocument.createElement('canvas');
      base.width=base.height=SIZE;backdrop(base.getContext('2d'),info,Terrain);
      cache={key:info.key,base};canvases.set(canvas,cache);
    }
    c.imageSmoothingEnabled=false;c.drawImage(cache.base,0,0);
    if(game.dekuTrailReady&&!info.inner)track(c,info.limit,Terrain.DEKU_APPROACH,'#ddbc78',1);
    for(const foe of threats){
      const [x,y]=projection(info.limit,foe.x,foe.z);
      c.fillStyle='#e7837e';c.fillRect(Math.round(x),Math.round(y),2,2);
    }
    const otherPins=landmarks.filter(pin=>!(pin.glyph==='shrine'&&target&&pin.x===target.x&&pin.z===target.z));
    const pins=arrangePins(info.limit,player,[...(target?[target]:[]),...allies,...otherPins,...loot]);
    for(const {x,y,u,v} of pins)if(x!==u||y!==v)connector(c,x,y,u,v);
    for(const {pin,x,y} of pins.slice().reverse())stamp(c,pin.glyph,x,y);
    const [cx,cy]=projection(info.limit,player.x,player.z);
    stamp(c,'player',cx,cy,-(view?.yaw||0));
    const name=game.landmark?.name||realms[game.realm]?.name||'Current realm';
    const desc=name+'. North up. '+(target?'Objective: '+target.label+'. ':'')+(allies.length?allies.length+(allies.length===1?' ally. ':' allies. '):'')+'Legend follows.';
    if(cache.label!==desc){canvas.setAttribute('aria-label',desc);cache.label=desc;}
  }
  function drawLegend(root){
    if(!root)return;
    for(const canvas of root.querySelectorAll('[data-minimap-glyph]')){
      const glyph=canvas.dataset.minimapGlyph,ctx=canvas.getContext('2d');
      if(ctx&&GLYPHS[glyph])stamp(ctx,glyph,5,5);
    }
  }
  return Object.freeze({SIZE,mapInfo,projection,walkable,objective,snapshot,arrangePins,draw,drawLegend});
});
