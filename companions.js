/* Solo Adventure follower AI. Recruitment is derived from the current run's seals. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BonkCompanions=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // Realm array order, not campaign order.
  const BY_REALM=Object.freeze(['nabooru','tetra','impa','sheik','darunia','skullkid','saria','ruto']);
  const RECRUIT_ORDER=Object.freeze([6,7,0,1,2,3,4,5]);

  // Follower damage and cadence are Zelabonk balance choices, not original-game values.
  // Saria uses a borrowed Fairy Slingshot, as in her playable loadout.
  const SUPPORT=Object.freeze({
    saria:    {kind:'slingshot',range:15,damage:9,radius:.65,cast:true,color:'#b2df83'},
    ruto:     {kind:'rutoWave',range:13,damage:12,radius:1.3,cast:true,color:'#96e3e8'},
    nabooru:  {kind:'axe',range:5.3,damage:14,radius:3.1,arc:1.65,color:'#eabc72'},
    tetra:    {kind:'cutlass',range:5.6,damage:13,radius:3.4,arc:1.72,color:'#79bbd1'},
    impa:     {kind:'giantBlade',range:6.6,damage:14,radius:3.8,arc:1.72,color:'#b4aecf'},
    sheik:    {kind:'kunai',range:15,damage:11,radius:.65,cast:true,color:'#9ca6dc'},
    darunia:  {kind:'hammer',range:6.1,damage:16,radius:3.6,arc:1.55,color:'#e6a064'},
    skullkid: {kind:'fairy',range:14,damage:12,radius:1.45,cast:true,color:'#d5a7de'}
  });
  const runtime=new WeakMap();
  const EMPTY=Object.freeze([]);
  const INTERVAL=2.1;
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  const active=game=>game.mode==='adventure'&&game.reviewMapClears===true&&!game.player.accountId;
  const key=game=>[game.realm,game.stage,Number(game.landmarkActive)].join(':');

  function recruit(game,realm){
    const hero=BY_REALM[realm];
    return active(game)&&game.shrines.has(realm)&&hero&&hero!==game.hero?hero:null;
  }

  function formation(game,index){
    const p=game.player,frontX=Math.sin(p.facing),frontZ=Math.cos(p.facing);
    const side=index===0?0:(index%2?-1:1)*(index<3?1.33:index<5?1.72:2.58);
    const depth=index===0?2.45:index<3?3.09:index<5?4.57:index<7?5.44:6.65;
    const bound=game.arenaLimit-.55;
    const x=clamp(p.x-frontX*depth+frontZ*side,-bound,bound);
    const z=clamp(p.z-frontZ*depth-frontX*side,-bound,bound);
    if(game.kokiriStory&&game.landmarkActive){
      const placed=game.resolveLandmarkMove(p.x,p.z,x,z,.38);
      return {x:placed.x,z:placed.z,y:placed.ground};
    }
    return {x,z,y:game.groundAt(x,z)};
  }

  function sync(game){
    if(!active(game))return null;
    let state=runtime.get(game);
    const mapKey=key(game);
    if(!state){
      state={team:[],mapKey,nextTurn:0,wait:.8};
      runtime.set(game,state);
    }
    const teamIds=RECRUIT_ORDER.map(realm=>recruit(game,realm)).filter(Boolean);
    if(state.team.length!==teamIds.length||state.team.some((ally,i)=>ally.id!==teamIds[i])){
      const previous=new Map(state.team.map(ally=>[ally.id,ally]));
      state.team=teamIds.map((hero,i)=>previous.get(hero)||
        {id:hero,hero,...formation(game,i),facing:game.player.facing,action:'idle',actionAge:0,
          attackKind:SUPPORT[hero].kind,actionTime:0});
    }
    if(state.mapKey!==mapKey){
      state.team.forEach((ally,i)=>Object.assign(ally,formation(game,i),{action:'idle',actionAge:0,actionTime:0,facing:game.player.facing}));
      state.mapKey=mapKey;
    }
    return state;
  }

  function followers(game){return sync(game)?.team??EMPTY;}

  function animate(game,state,dt){
    for(let i=0;i<state.team.length;i++){
      const ally=state.team[i],target=formation(game,i);
      ally.actionAge+=dt;
      ally.actionTime=Math.max(0,ally.actionTime-dt);
      const dx=target.x-ally.x,dz=target.z-ally.z,d=Math.hypot(dx,dz);
      if(d>13){
        Object.assign(ally,target);
      }else if(d>.22){
        const wet=game.waterMotion(ally.hero,ally.x,ally.z,ally.y);
        const speed=Math.min(d,dt*(5.8+Math.max(0,d-1.65)*1.9)*(wet?.speed??1));
        const wantedX=ally.x+dx/d*speed,wantedZ=ally.z+dz/d*speed;
        if(game.kokiriStory&&game.landmarkActive){
          const next=game.resolveLandmarkMove(ally.x,ally.z,wantedX,wantedZ,.38);
          if(ally.actionTime<=0&&Math.hypot(next.x-ally.x,next.z-ally.z)>.001)ally.facing=Math.atan2(next.x-ally.x,next.z-ally.z);
          Object.assign(ally,{x:next.x,z:next.z,y:next.ground});
        }else{
          ally.x=wantedX;ally.z=wantedZ;
          ally.y=game.groundAt(ally.x,ally.z);
          if(ally.actionTime<=0)ally.facing=Math.atan2(dx,dz);
        }
      }
      if(ally.actionTime<=0){
        const action=d>.22?'walk':'idle';
        if(action!==ally.action){ally.action=action;ally.actionAge=0;}
      }
    }
  }

  function nearest(game,ally,range){
    let target=null,best=range;
    for(const e of game.enemies){
      if(e.dead||e.dummy||Math.hypot(e.x-game.player.x,e.z-game.player.z)>18)continue;
      const d=Math.hypot(e.x-ally.x,e.z-ally.z)-Math.min(e.radius||0,1.4);
      if(d<best){best=d;target=e;}
    }
    return target;
  }

  function update(game,dt){
    const state=sync(game);
    if(!state?.team.length||game.state!=='running')return;
    animate(game,state,dt);
    state.wait-=dt;
    if(state.wait>0)return;
    for(let i=0;i<state.team.length;i++){
      const index=(state.nextTurn+i)%state.team.length,ally=state.team[index],move=SUPPORT[ally.hero];
      const target=nearest(game,ally,move.range);
      if(!target)continue;
      const facing=Math.atan2(target.x-ally.x,target.z-ally.z);
      Object.assign(ally,{action:move.cast?'cast':'attack',actionAge:0,actionTime:.44,facing,attackKind:move.kind});
      game.emit('companionStrike',{hero:ally.hero,kind:move.kind,x:ally.x,z:ally.z,y:ally.y+.7,
        facing,arc:move.arc,radius:move.radius,duration:.38,targetX:target.x,targetZ:target.z,color:move.color,
        ...(move.kind==='hammer'?{impactSize:1.85}:{})});
      // This deliberately does not use the player's weapon multipliers or proc chains.
      game.hurtEnemy(target,move.damage*(target.type==='boss'?.64:1),0,{source:'companion'});
      state.nextTurn=(index+1)%state.team.length;
      state.wait=INTERVAL;
      return;
    }
    state.wait=.15;
  }

  return Object.freeze({BY_REALM,recruit,followers,update});
});
