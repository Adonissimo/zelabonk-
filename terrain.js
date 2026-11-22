/* Shared world geometry: simulation and rendering sample the same terrain. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BonkTerrain=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const cache=new Map(),samples=new Map(),collisionCells=new Map(),TAU=Math.PI*2,LIMIT=64,GRID=2,CELL=8;
  const GATES=[{x:-48,z:-48},{x:48,z:-48},{x:0,z:55}];
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function pathDistance(x,z,gate){const length=gate.x*gate.x+gate.z*gate.z,t=Math.max(0,Math.min(1,(x*gate.x+z*gate.z)/length));return Math.hypot(x-gate.x*t,z-gate.z*t);}
  function clearRoute(x,z,radius=4){return Math.hypot(x,z)<10||Math.hypot(x,z+7)<6||GATES.some(g=>Math.hypot(x-g.x,z-g.z)<5||pathDistance(x,z,g)<radius);}
  function layout(realm,stage){
    const key=realm+':'+stage;if(cache.has(key))return cache.get(key);
    const roll=random(58791+realm*7919+stage*1033),terraces=[],obstacles=[];
    for(let i=0;i<10;i++){const x=(roll()-.5)*100,z=(roll()-.5)*100,radius=5+roll()*5;if(clearRoute(x,z,radius+3))continue;terraces.push(Object.freeze({x,z,radius,height:(1+Math.floor(roll()*(stage+1)))*1.25,rampAngle:roll()*TAU}));}
    for(let i=0;i<180&&obstacles.length<85;i++){const x=(roll()-.5)*116,z=(roll()-.5)*116;if(clearRoute(x,z,3.5))continue;const rock=i%5===0,radius=rock?.55+roll()*.45:.52+roll()*.2;obstacles.push(Object.freeze({id:i,kind:rock?'rock':'tree',x,z,radius,height:rock?.65:4.3,scale:.8+roll()*.5}));}
    // The shrine is physical, while the activation ring remains accessible.
    obstacles.push(Object.freeze({id:1000,kind:'shrine',x:0,z:-7,radius:1.55,height:2.5,scale:1}));
    const cells=new Map();for(const obstacle of obstacles)for(let x=Math.floor((obstacle.x-obstacle.radius-3)/CELL);x<=Math.floor((obstacle.x+obstacle.radius+3)/CELL);x++)for(let z=Math.floor((obstacle.z-obstacle.radius-3)/CELL);z<=Math.floor((obstacle.z+obstacle.radius+3)/CELL);z++){const cell=x+':'+z;if(!cells.has(cell))cells.set(cell,[]);cells.get(cell).push(obstacle);}collisionCells.set(key,cells);
    // Low dressing stays outside the fighting lanes and never changes collision geometry.
    const details=[],patches=[],dress=random(95471+realm*2179+stage*7919);
    for(let i=0;i<90;i++){
      const x=(dress()-.5)*116,z=(dress()-.5)*116,variant=i%4;
      patches.push(Object.freeze({x,z,radius:2+dress()*4}));
      for(let j=0;j<7;j++){
        const px=x+(dress()-.5)*7,pz=z+(dress()-.5)*7;
        if(Math.hypot(px,pz)<3.4||Math.hypot(px,pz+7)<3||GATES.some(g=>pathDistance(px,pz,g)<2.5))continue;
        details.push(Object.freeze({x:px,z:pz,kind:i%9===0&&j===0?'prop':'plant',variant,scale:.65+dress()*.8}));
      }
    }
    const result=Object.freeze({terraces:Object.freeze(terraces),obstacles:Object.freeze(obstacles),details:Object.freeze(details),patches:Object.freeze(patches)});cache.set(key,result);return result;
  }
  function rawHeight(realm,stage,x,z){
    if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>LIMIT||Math.abs(z)>LIMIT)return 0;
    const edge=1-smooth((Math.max(Math.abs(x),Math.abs(z))-56)/8),route=Math.min(1,Math.min(...GATES.map(g=>pathDistance(x,z,g)))/3);
    const center=smooth((Math.hypot(x,z)-9)/5)*smooth((Math.hypot(x,z+7)-5)/4)*Math.min(...GATES.map(g=>smooth((Math.hypot(x-g.x,z-g.z)-3)/3)));
    let ground=(Math.sin(x*.10+realm)*Math.cos(z*.12-stage)*.28)*edge*route*center;
    for(const terrace of layout(realm,stage).terraces){const dx=x-terrace.x,dz=z-terrace.z,d=Math.hypot(dx,dz);if(d>terrace.radius+3)continue;const angle=Math.atan2(dz,dx),difference=Math.abs(Math.atan2(Math.sin(angle-terrace.rampAngle),Math.cos(angle-terrace.rampAngle))),ramp=1-smooth((difference-.20)/.35);const width=.65+ramp*6;ground=Math.max(ground,terrace.height*(1-smooth((d-(terrace.radius-width))/width)));}
    return ground;
  }
  function vertex(realm,stage,x,z){const key=realm+':'+stage+':'+x+':'+z;if(!samples.has(key))samples.set(key,rawHeight(realm,stage,x,z));return samples.get(key);}
  function height(realm,stage,x,z){
    if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>LIMIT||Math.abs(z)>LIMIT)return 0;const x0=Math.floor(x/GRID)*GRID,z0=Math.floor(z/GRID)*GRID,fx=(x-x0)/GRID,fz=(z-z0)/GRID;
    const a=vertex(realm,stage,x0,z0),b=vertex(realm,stage,x0+GRID,z0),c=vertex(realm,stage,x0,z0+GRID),d=vertex(realm,stage,x0+GRID,z0+GRID);
    // Use the same triangle diagonal as Three.js PlaneGeometry, not bilinear interpolation.
    const result=fx+fz<=1?a+(b-a)*fx+(c-a)*fz:d+(c-d)*(1-fx)+(b-d)*(1-fz);return result===0?0:result;
  }
  function resolve(realm,stage,fromX,fromZ,toX,toZ,jumpHeight,radius=.52){
    const initial=height(realm,stage,fromX,fromZ);let x=Math.max(-LIMIT,Math.min(LIMIT,toX)),z=Math.max(-LIMIT,Math.min(LIMIT,toZ));
    const step=Math.hypot(toX-fromX,toZ-fromZ)*.6+.02;
    const reachable=(nextX,nextZ)=>height(realm,stage,nextX,nextZ)-initial<=Math.max(step,jumpHeight+.02);
    if(!reachable(x,z)){if(reachable(x,fromZ))z=fromZ;else if(reachable(fromX,z))x=fromX;else{x=fromX;z=fromZ;}}
    layout(realm,stage);for(let pass=0;pass<2;pass++)for(const obstacle of collisionCells.get(realm+':'+stage).get(Math.floor(x/CELL)+':'+Math.floor(z/CELL))||[]){const dx=x-obstacle.x,dz=z-obstacle.z,separation=obstacle.radius+radius;if(dx*dx+dz*dz>=separation*separation)continue;const top=height(realm,stage,obstacle.x,obstacle.z)+obstacle.height;if(initial+jumpHeight>top+.12)continue;const d=Math.hypot(dx,dz),length=Math.max(.001,d),nx=d>.001?dx/length:1,nz=d>.001?dz/length:0;x=obstacle.x+nx*separation;z=obstacle.z+nz*separation;}
    return{x:Math.max(-LIMIT,Math.min(LIMIT,x)),z:Math.max(-LIMIT,Math.min(LIMIT,z)),ground:height(realm,stage,x,z)};
  }
  return Object.freeze({height,layout,resolve,LIMIT,GRID});
});
