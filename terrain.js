/* Shared world geometry: simulation and rendering sample the same terrain. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BonkTerrain=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const cache=new Map(),samples=new Map(),collisionCells=new Map(),TAU=Math.PI*2,LIMIT=92,GRID=2,CELL=8;
  const KOKIRI_REALM=6,KOKIRI_WALL_INNER=LIMIT;
  const ZORA_REALM=7;
  const GREAT_SEA_REALM=1,SEA_SHORE_START=-40,SEA_SHORE_END=40,SEA_SHORE_STEP=5;
  const seaShoreVertex=(stage,i)=>14+Math.sin(i*.63+stage)*2;
  function seaShoreX(stage,z){
    const t=(Math.max(SEA_SHORE_START,Math.min(SEA_SHORE_END,z))-SEA_SHORE_START)/SEA_SHORE_STEP;
    const i=Math.floor(t),fraction=t-i,a=seaShoreVertex(stage,i);
    return a+(seaShoreVertex(stage,i+1)-a)*fraction;
  }
  const ZORA_FOUNTAIN=Object.freeze({
    basin:Object.freeze({x:8,z:-32,rx:39,rz:32,level:-.32}),
    jabu:Object.freeze({x:6,z:-42,radius:8.2*1.32,height:9.6*1.32,turn:-.18,scale:1.32}),
    banks:Object.freeze([[-13,-18],[22,-23]].map(Object.freeze)),
    falls:Object.freeze([[-13,-60,9.5,11],[28,-59,7.6,13],[-26,-57,4.3,8]].map(Object.freeze)),
    cliffs:Object.freeze(Array.from({length:11},(_,i)=>Object.freeze({x:-49+i*10,z:-68+(i%3===0?1.7:0),height:7+(i*7%6)}))),
  });
  const DEKU_ENTRANCE=Object.freeze({halfWidth:4.4,openingZ:10.5,limit:23});
  // Village spine, narrow uphill bend, and the tree's separate clearing.
  const DEKU_PORTAL=Object.freeze({x:-16.05,z:-43.48,radius:2.45});
  const dekuScale=1.32;
  // Grow the trunk away from the doorway: its axis and trigger stay on the trail.
  const DEKU_TREE=Object.freeze({x:DEKU_PORTAL.x+(-18-DEKU_PORTAL.x)*dekuScale,z:DEKU_PORTAL.z+(-49-DEKU_PORTAL.z)*dekuScale,radius:5.15*dekuScale,height:29*dekuScale,turn:.34,scale:dekuScale});
  const pointList=points=>Object.freeze(points.map(Object.freeze));
  const DEKU_APPROACH=pointList([[4,-8],[5,-13],[4,-19],[1,-24],[-4,-29],[-7,-33],[-10,-36],[-13.8,-39],[-16.05,-43.48]]);
  const polylineDistance=(x,z,points)=>{
    let best=Infinity;
    for(let i=1;i<points.length;i++){
      const [ax,az]=points[i-1],[bx,bz]=points[i],vx=bx-ax,vz=bz-az;
      const t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz)));
      best=Math.min(best,Math.hypot(x-ax-vx*t,z-az-vz*t));
    }
    return best;
  };
  function dekuWaypoint(x,z){
    let best=Infinity,index=0,t=0;
    for(let i=1;i<DEKU_APPROACH.length;i++){
      const [ax,az]=DEKU_APPROACH[i-1],[bx,bz]=DEKU_APPROACH[i],vx=bx-ax,vz=bz-az;
      const k=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz)));
      const d=Math.hypot(x-ax-k*vx,z-az-k*vz);
      if(d<best){best=d;index=i;t=k;}
    }
    const point=DEKU_APPROACH[best>8?index-1:Math.min(DEKU_APPROACH.length-1,index+(t>.74?1:0))];
    return {x:point[0],z:point[1]};
  }
  const SCENIC_TRAILS=Object.freeze([{x:-48,z:-48},{x:48,z:-48},{x:0,z:55}].map(Object.freeze));
  // New outer loop connects to the existing three paths; inner terrain and
  // checkpoint coordinates don't move. The loop is held clear of new obstacles.
  const OUTER_TRAILS=Object.freeze([
    pointList([[-48,-48],[-66,-54],[-78,-45],[-81,-12],[-80,29],[-67,57],[-47,78],[-20,82],[0,73],[0,55]]),
    pointList([[48,-48],[64,-59],[79,-47],[82,-16],[81,26],[67,57],[46,76],[22,81],[0,73]]),
    pointList([[-66,-54],[-58,-72],[-32,-81],[0,-80],[36,-81],[58,-71],[64,-59]])
  ]);
  function outerTrailDistance(x,z){return Math.min(...OUTER_TRAILS.map(points=>polylineDistance(x,z,points)));}
  const SCENIC_STRUCTURES=Object.freeze([
    {id:'hyrule-castle',x:-25,z:-47,scale:1.55,radius:10.1,halfX:10.05,halfZ:3.88,height:12.4,lift:0},
    {id:'sea-lighthouse',x:8,z:-45,scale:1.48,radius:6.85,height:18,lift:0},
    {id:'twilight-mirror',x:-19,z:-35,scale:1.46,radius:4.2,height:11,lift:4.3},
    {id:'goddess-statue',x:-13,z:-33,scale:1.42,radius:3.12,height:11,lift:0},
    {id:'depths-lightroot',x:-14,z:-35,scale:1.60,radius:1.15,height:17,lift:0},
    {id:'termina-clock-tower',x:22,z:-37,scale:1.53,radius:3.83,halfX:3.83,halfZ:3.83,height:24,lift:0},
    null,null
  ].map(item=>item&&Object.freeze(item)));
  // Hand-authored landmarks: inspired by a village organized around paths and linked pools.
  // Co-ordinates and elevations are original to this game's run/arena scale.
  const VILLAGE=Object.freeze({
    homes:pointList([
      {role:'link',x:-27,z:7,radius:3.15,height:5.8,turn:1.64},
      {role:'saria',x:14,z:10,radius:3.38,height:5.9,turn:-1.95},
      {role:'shop',x:26,z:1,radius:3.75,height:6.3,turn:-1.4},
      {role:'mido',x:-27,z:-8,radius:3.85,height:6.6,turn:1.10},
      {role:'lookout',x:24,z:-11,radius:2.85,height:7.3,turn:-.62}
    ].map(home=>({...home,radius:home.radius*1.23,height:home.height*1.27}))),
    trails:Object.freeze([
      pointList([[-12,26],[-12,20],[-8,15],[-3,9],[-.8,3],[2.4,-3],[4,-8]]),
      pointList([[-.8,3],[-5.1,3],[-8.5,2],[-18,2],[-21.8,2],[-24.3,3.5],[-23.5,6.4]]),
      pointList([[-21.8,2],[-22.8,-1],[-23.5,-5.8]]),
      pointList([[-12,20],[-5.8,19.6],[1,17],[6,14],[10.3,10.3]]),
      pointList([[2.4,-3],[9,-1.6],[16,-.3],[21.7,1.4]]),
      pointList([[9,-1.6],[15,-4.2],[18.1,-8.8],[20.7,-11.5]])
    ]),
    brook:pointList([[-15.3,-23],[-14.2,-18],[-16.4,-11],[-16,-6],[-14.8,0],[-15.6,4],[-17.9,7.6],[-19,12],[-21,15],[-24,17],[-26,23],[-28,30]]),
    pools:pointList([{x:-15.1,z:-21,rx:5.8,rz:4.5},{x:-22.9,z:16.4,rx:6.7,rz:5.2}]),
    bridge:Object.freeze({x0:-22,x1:-8,z:2,halfWidth:2,deckHeight:.63})
  });
  function inVillageLane(x,z,pad){
    if(polylineDistance(x,z,DEKU_APPROACH)<pad||Math.hypot(x-DEKU_TREE.x,z-DEKU_TREE.z)<DEKU_TREE.radius+pad+3)return true;
    if(VILLAGE.homes.some(h=>Math.hypot(h.x-x,h.z-z)<h.radius+pad+2.2))return true;
    for(const path of VILLAGE.trails)for(let i=1;i<path.length;i++){
      const [ax,az]=path[i-1],[bx,bz]=path[i],vx=bx-ax,vz=bz-az;
      const t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz)));
      if(Math.hypot(x-ax-vx*t,z-az-vz*t)<pad)return true;
    }
    return false;
  }
  function villageWaterFeature(x,z,margin){
    if(VILLAGE.pools.some(p=>Math.hypot((p.x-x)/(p.rx+margin),(p.z-z)/(p.rz+margin))<1))return true;
    for(let i=1;i<VILLAGE.brook.length;i++){
      const [ax,az]=VILLAGE.brook[i-1],[bx,bz]=VILLAGE.brook[i],vx=bx-ax,vz=bz-az;
      const t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz)));
      if(Math.hypot(x-ax-vx*t,z-az-vz*t)<1.45+margin)return true;
    }
    return false;
  }
  // Match the painted brook and pond footprints. The creek has a shallow
  // inset bed for actors without changing the proven bridge or path collision.
  function villageWaterInset(x,z){
    let inset=1.36-polylineDistance(x,z,VILLAGE.brook);
    for(const p of VILLAGE.pools){
      inset=Math.max(inset,(1-Math.hypot((x-p.x)/p.rx,(z-p.z)/p.rz))*Math.min(p.rx,p.rz));
    }
    return inset;
  }
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function fountainBasin(x,z){
    const {basin,jabu,falls}=ZORA_FOUNTAIN;
    const oval=Math.hypot((x-basin.x)/basin.rx,(z-basin.z)/basin.rz);
    // Leave a dry winding spine to Jabu-Jabu's platform, plus room to fight at its base.
    const at=Math.max(0,Math.min(1,(-z-5)/45)),lane=Math.abs(x-jabu.x*at);
    const side=smooth((lane-3.5)/4.8),island=smooth((Math.hypot(x-jabu.x,z-jabu.z)-(jabu.radius+.40))/3.7);
    const waters=(1-smooth((oval-.76)/.24))*side*island;
    // Let the falls land into stepped plunge pools rather than on a dry strip.
    const plunge=Math.max(...falls.map(([fx,fz,width])=>1-smooth((Math.hypot((x-fx)/(width*.67+3),(z-fz-2)/7)-.50)/.50)));
    return Math.max(waters,plunge);
  }
  function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function pathDistance(x,z,trail){const length=trail.x*trail.x+trail.z*trail.z,t=Math.max(0,Math.min(1,(x*trail.x+z*trail.z)/length));return Math.hypot(x-trail.x*t,z-trail.z*t);}
  function clearRoute(x,z,radius=4){return Math.hypot(x,z)<10||Math.hypot(x,z+7)<6||SCENIC_TRAILS.some(g=>Math.hypot(x-g.x,z-g.z)<5||pathDistance(x,z,g)<radius);}
  function layout(realm,stage){
    const key=realm+':'+stage;if(cache.has(key))return cache.get(key);
    const roll=random(58791+realm*7919+stage*1033),terraces=[],obstacles=[];
    if(realm===KOKIRI_REALM){
      for(const [x,z,radius,height,rampAngle] of (stage===1?
        [[-36,-6,8,1.65,.15],[26,-11,7.8,2.35,2.4]]:
        stage===2?[[-37,-5,9.4,2.9,.08],[27,-12,8.1,3.45,2.65]]:
          [[-36,-6,8.2,2.45,0],[26,-12,8.1,2.8,3.55]]))
        terraces.push(Object.freeze({x,z,radius,height,rampAngle}));
      obstacles.push(Object.freeze({id:997,kind:'deku',...DEKU_TREE}));
      terraces.push(Object.freeze({x:46,z:18,radius:8.8,height:3.45,rampAngle:Math.PI}));
      VILLAGE.homes.forEach((home,i)=>obstacles.push(Object.freeze({id:980+i,kind:'home',...home,scale:1})));
    }
    if(realm===ZORA_REALM)obstacles.push(Object.freeze({id:992,kind:'jabu',...ZORA_FOUNTAIN.jabu}));
    const scenic=SCENIC_STRUCTURES[realm],scenicPad=(x,z,pad=0)=>scenic&&Math.hypot(x-scenic.x,z-scenic.z)<scenic.radius+pad;
    if(scenic)obstacles.push(Object.freeze({...scenic,id:991,kind:'landmark'}));
    if(realm===0)for(const side of[-1,1])obstacles.push(Object.freeze({id:1917+side,kind:'landmarkSupport',x:scenic.x+side*7*scenic.scale,z:scenic.z,radius:2.38*scenic.scale,height:16.9,scale:1}));
    if(realm===ZORA_REALM)ZORA_FOUNTAIN.cliffs.forEach((cliff,i)=>obstacles.push(Object.freeze({...cliff,id:1880+i,kind:'cliff',radius:6,halfX:5.5,halfZ:6,scale:1})));
    const fountainClearing=(x,z,pad=0)=>realm===ZORA_REALM&&z<-12&&z>-74-pad&&x>-34-pad&&x<46+pad;
    for(let i=0;i<10;i++){const x=(roll()-.5)*100,z=(roll()-.5)*100,radius=5+roll()*5;if(clearRoute(x,z,radius+3)||scenicPad(x,z,radius+2)||fountainClearing(x,z,radius)||(realm===KOKIRI_REALM&&(Math.abs(x)<31&&Math.abs(z)<29||polylineDistance(x,z,DEKU_APPROACH)<radius+5||Math.hypot(x-DEKU_TREE.x,z-DEKU_TREE.z)<radius+10)))continue;terraces.push(Object.freeze({x,z,radius,height:(1+Math.floor(roll()*(stage+1)))*1.25,rampAngle:roll()*TAU}));}
    for(let i=0;i<180&&obstacles.length<(realm===0?88:realm===ZORA_REALM?96:scenic?86:85);i++){const x=(roll()-.5)*116,z=(roll()-.5)*116;if(clearRoute(x,z,3.5)||scenicPad(x,z,1.5)||fountainClearing(x,z)||(realm===KOKIRI_REALM&&(Math.hypot(x-DEKU_TREE.x,z-DEKU_TREE.z)<7||inVillageLane(x,z,4.1)||villageWaterFeature(x,z,.75))))continue;const rock=i%5===0,radius=rock?.55+roll()*.45:.52+roll()*.2;obstacles.push(Object.freeze({id:i,kind:rock?'rock':'tree',x,z,radius,height:rock?.65:4.3,scale:.8+roll()*.5}));}
    // Add a separately seeded fringe. Nothing rerolls the central gameplay layout.
    const outer=random(18731+realm*137+stage*937);
    for(let i=0;i<105;i++){
      const x=(outer()-.5)*178,z=(outer()-.5)*178,wide=Math.max(Math.abs(x),Math.abs(z));
      if(wide<62||outerTrailDistance(x,z)<4.3||fountainClearing(x,z,2))continue;
      if(realm===GREAT_SEA_REALM&&z>SEA_SHORE_START&&z<SEA_SHORE_END&&x>15)continue;
      const rock=i%5===0,radius=rock?.75+outer()*.65:.58+outer()*.32;
      obstacles.push(Object.freeze({id:1200+i,kind:rock?'rock':'tree',x,z,radius,height:rock?.86:5.2,scale:1+outer()*.42}));
    }
    // Low raised overlooks are outside the navigable trail shoulders.
    for(const [x,z,radius,height,angle] of [[-65,38,7,3.15,-.85],[67,43,7,2.7,-1.9],[71,-64,7,3.3,2.0],[-74,-68,6.2,3.1,.95]]){
      if(!fountainClearing(x,z,radius)&&!(realm===GREAT_SEA_REALM&&z>SEA_SHORE_START&&z<SEA_SHORE_END&&x>15))terraces.push(Object.freeze({x,z,radius,height:height+.16*(stage-1),rampAngle:angle}));
    }
    // An enlarged shrine remains inside its unchanged activation radius.
    obstacles.push(Object.freeze({id:1000,kind:'shrine',x:0,z:-7,radius:1.55*1.20,height:2.5*1.20,scale:1.20}));
    const cells=new Map();for(const obstacle of obstacles)for(let x=Math.floor((obstacle.x-obstacle.radius-3)/CELL);x<=Math.floor((obstacle.x+obstacle.radius+3)/CELL);x++)for(let z=Math.floor((obstacle.z-obstacle.radius-3)/CELL);z<=Math.floor((obstacle.z+obstacle.radius+3)/CELL);z++){const cell=x+':'+z;if(!cells.has(cell))cells.set(cell,[]);cells.get(cell).push(obstacle);}collisionCells.set(key,cells);
    // Low dressing stays outside the fighting lanes and never changes collision geometry.
    const details=[],patches=[],dress=random(95471+realm*2179+stage*7919);
    for(let i=0;i<90;i++){
      const x=(dress()-.5)*116,z=(dress()-.5)*116,variant=i%4;
      patches.push(Object.freeze({x,z,radius:2+dress()*4}));
      for(let j=0;j<7;j++){
        const px=x+(dress()-.5)*7,pz=z+(dress()-.5)*7;
        if(fountainClearing(px,pz)||(realm===KOKIRI_REALM&&(villageWaterFeature(px,pz,.65)||inVillageLane(px,pz,2.9)))||Math.hypot(px,pz)<3.4||Math.hypot(px,pz+7)<3||SCENIC_TRAILS.some(g=>pathDistance(px,pz,g)<2.5))continue;
        details.push(Object.freeze({x:px,z:pz,kind:i%9===0&&j===0?'prop':'plant',variant,scale:.65+dress()*.8}));
      }
    }
    const outDress=random(77611+realm*719+stage*433);
    for(let i=0;i<105;i++){
      const x=(outDress()-.5)*178,z=(outDress()-.5)*178;
      if(Math.max(Math.abs(x),Math.abs(z))<62||outerTrailDistance(x,z)<2.8||fountainClearing(x,z,1))continue;
      if(realm===GREAT_SEA_REALM&&z>=SEA_SHORE_START&&z<=SEA_SHORE_END&&x>15)continue;
      patches.push(Object.freeze({x,z,radius:2.4+outDress()*3.8}));
      for(let j=0;j<4;j++)details.push(Object.freeze({x:x+(outDress()-.5)*3,z:z+(outDress()-.5)*3,kind:i%9===0&&j===0?'prop':'plant',variant:i%4,scale:.71+outDress()*.67}));
    }
    const result=Object.freeze({terraces:Object.freeze(terraces),obstacles:Object.freeze(obstacles),details:Object.freeze(details),patches:Object.freeze(patches)});cache.set(key,result);return result;
  }
  function rawHeight(realm,stage,x,z,base){
    if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>LIMIT||Math.abs(z)>LIMIT)return 0;
    const maxAxis=Math.max(Math.abs(x),Math.abs(z));
    const edge=1-smooth((maxAxis-56)/8)+smooth((maxAxis-64)/7)*(1-smooth((maxAxis-84)/8));
    const outerDist=maxAxis<45?Infinity:outerTrailDistance(x,z);
    const route=Math.min(1,Math.min(outerDist,...SCENIC_TRAILS.map(g=>pathDistance(x,z,g)))/3);
    const center=smooth((Math.hypot(x,z)-9)/5)*smooth((Math.hypot(x,z+7)-5)/4)*Math.min(...SCENIC_TRAILS.map(g=>smooth((Math.hypot(x-g.x,z-g.z)-3)/3)));
    let ground=(Math.sin(x*.10+realm)*Math.cos(z*.12-stage)*.28)*edge*route*center;
    for(const terrace of layout(realm,stage).terraces){const dx=x-terrace.x,dz=z-terrace.z,d=Math.hypot(dx,dz);if(d>terrace.radius+3)continue;const angle=Math.atan2(dz,dx),difference=Math.abs(Math.atan2(Math.sin(angle-terrace.rampAngle),Math.cos(angle-terrace.rampAngle))),ramp=1-smooth((difference-.20)/.35);const width=.65+ramp*6;ground=Math.max(ground,terrace.height*(1-smooth((d-(terrace.radius-width))/width)));}
    if(realm===KOKIRI_REALM){
      const slope=smooth((-z-17)/29)*2.15;
      const bank=smooth((20-polylineDistance(x,z,DEKU_APPROACH))/13);
      ground+=slope*bank;
    }
    if(realm===ZORA_REALM){
      const basin=fountainBasin(x,z);
      ground=ground*(1-basin)-.75*basin;
      if(z<-9&&Math.abs(x-ZORA_FOUNTAIN.jabu.x*Math.min(1,(-z-5)/45))<2.5)ground=Math.max(ground,.06);
    }
    if(realm===KOKIRI_REALM&&!base){
      const bridge=VILLAGE.bridge;
      // This describes the plank approach, not a second terrain mesh. The base below
      // is sampled separately so the brook continues visibly under the deck.
      if(x>=bridge.x0&&x<=bridge.x1&&Math.abs(z-bridge.z)<=bridge.halfWidth){
        const ramp=smooth(Math.min(x-bridge.x0,bridge.x1-x)/4);
        ground+=bridge.deckHeight*ramp;
      }
    }
    return ground;
  }
  function vertex(realm,stage,x,z,base){const key=realm+':'+stage+':'+x+':'+z+':'+base;if(!samples.has(key))samples.set(key,rawHeight(realm,stage,x,z,base));return samples.get(key);}
  function height(realm,stage,x,z,base=false){
    if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>LIMIT||Math.abs(z)>LIMIT)return 0;const x0=Math.floor(x/GRID)*GRID,z0=Math.floor(z/GRID)*GRID,fx=(x-x0)/GRID,fz=(z-z0)/GRID;
    const a=vertex(realm,stage,x0,z0,base),b=vertex(realm,stage,x0+GRID,z0,base),c=vertex(realm,stage,x0,z0+GRID,base),d=vertex(realm,stage,x0+GRID,z0+GRID,base);
    // Use the same triangle diagonal as Three.js PlaneGeometry, not bilinear interpolation.
    const result=fx+fz<=1?a+(b-a)*fx+(c-a)*fz:d+(c-d)*(1-fx)+(b-d)*(1-fz);return result===0?0:result;
  }
  function sampleWater(realm,stage,x,z,feet){
    if(!Number.isFinite(x)||!Number.isFinite(z)||Math.max(Math.abs(x),Math.abs(z))>LIMIT)return null;
    let surface,depth,sink=0;
    if(realm===ZORA_REALM){
      const {basin}=ZORA_FOUNTAIN;
      if(Math.abs(x-basin.x)>basin.rx||Math.abs(z-basin.z)>basin.rz)return null;
      surface=basin.level;
      depth=surface-height(realm,stage,x,z);
      // The actual floor above the drawn surface forms the island and causeway.
      if(depth<=.025)return null;
    }else if(realm===KOKIRI_REALM){
      const inset=villageWaterInset(x,z);
      if(inset<=.10)return null;
      const belowDeck=height(realm,stage,x,z,true);
      if(height(realm,stage,x,z)-belowDeck>.085)return null;
      surface=belowDeck-.037;
      depth=.16+.36*smooth((inset-.10)/1.40);
      sink=depth;
    }else if(realm===GREAT_SEA_REALM){
      if(z<SEA_SHORE_START||z>SEA_SHORE_END)return null;
      const fromShore=x-seaShoreX(stage,z);
      // The overlay paints an exposed northeast trail and pier over the shoal.
      // Do not treat those dry planks or that sandy causeway as liquid.
      if(fromShore<=.40||pathDistance(x,z,SCENIC_TRAILS[1])<2.55)return null;
      surface=height(realm,stage,x,z)+.01;
      depth=.14+.42*smooth((fromShore-.40)/8);
      sink=depth;
    }else return null;
    if(Number.isFinite(feet)&&feet>surface+.095)return null;
    return {surface,depth,sink};
  }
  function resolve(realm,stage,fromX,fromZ,toX,toZ,jumpHeight,radius=.52){
    const bound=Math.max(0,LIMIT-radius);
    const initial=height(realm,stage,fromX,fromZ);let x=clampAxis(toX,bound),z=clampAxis(toZ,bound);
    const step=Math.hypot(toX-fromX,toZ-fromZ)*.6+.02;
    const reachable=(nextX,nextZ)=>height(realm,stage,nextX,nextZ)-initial<=Math.max(step,jumpHeight+.02);
    if(!reachable(x,z)){if(reachable(x,fromZ))z=fromZ;else if(reachable(fromX,z))x=fromX;else{x=fromX;z=fromZ;}}
    layout(realm,stage);for(let pass=0;pass<2;pass++)for(const obstacle of collisionCells.get(realm+':'+stage).get(Math.floor(x/CELL)+':'+Math.floor(z/CELL))||[]){
      const dx=x-obstacle.x,dz=z-obstacle.z,separation=obstacle.radius+radius;
      const top=height(realm,stage,obstacle.x,obstacle.z)+obstacle.height;
      if(obstacle.halfX){
        const padX=obstacle.halfX+radius-Math.abs(dx),padZ=obstacle.halfZ+radius-Math.abs(dz);
        if(padX<=0||padZ<=0||initial+jumpHeight>top+.12)continue;
        if(padX<padZ)x+=Math.sign(dx||fromX-obstacle.x||1)*padX;else z+=Math.sign(dz||fromZ-obstacle.z||1)*padZ;
      }else{
        if(dx*dx+dz*dz>=separation*separation||initial+jumpHeight>top+.12)continue;
        const d=Math.hypot(dx,dz),length=Math.max(.001,d),nx=d>.001?dx/length:1,nz=d>.001?dz/length:0;
        x=obstacle.x+nx*separation;z=obstacle.z+nz*separation;
      }
    }
    x=clampAxis(x,bound);z=clampAxis(z,bound);
    return{x,z,ground:height(realm,stage,x,z)};
  }
  function clampAxis(value,limit){return Math.max(-limit,Math.min(limit,value));}
  function resolveKokiriBoundary(toX,toZ,radius=.52){
    const bound=Math.max(0,KOKIRI_WALL_INNER-radius);
    return {x:clampAxis(toX,bound),z:clampAxis(toZ,bound),ground:0};
  }
  function resolveDekuEntrance(fromX,fromZ,toX,toZ,radius=.52){
    const {halfWidth,openingZ,limit}=DEKU_ENTRANCE,bound=Math.max(0,limit-radius),gap=Math.max(0,halfWidth-radius),lip=openingZ-radius;
    // Resolve the swept path with substeps so a jump/dash cannot cut the entrance corners.
    let x=clampAxis(fromX,bound),z=clampAxis(fromZ,bound);
    if(z>lip)x=clampAxis(x,gap);
    const endX=clampAxis(toX,bound),endZ=clampAxis(toZ,bound),steps=Math.max(1,Math.ceil(Math.hypot(endX-x,endZ-z)/.45));
    const dx=(endX-x)/steps,dz=(endZ-z)/steps;
    for(let i=0;i<steps;i++){
      x=clampAxis(x+dx,z>lip?gap:bound);
      z=clampAxis(z+dz,bound);
      if(z>lip&&Math.abs(x)>gap)z=lip;
    }
    return{x,z,ground:0};
  }
  return Object.freeze({height,sampleWater,layout,resolve,resolveKokiriBoundary,resolveDekuEntrance,LIMIT,GRID,SCENIC_TRAILS,OUTER_TRAILS,outerTrailDistance,SCENIC_STRUCTURES,KOKIRI_REALM,KOKIRI_WALL_INNER,DEKU_ENTRANCE,DEKU_TREE,DEKU_PORTAL,DEKU_APPROACH,dekuWaypoint,VILLAGE,villageWaterFeature,inVillageLane,ZORA_REALM,ZORA_FOUNTAIN,fountainBasin,GREAT_SEA_REALM,SEA_SHORE_START,SEA_SHORE_END,SEA_SHORE_STEP,seaShoreX});
});
