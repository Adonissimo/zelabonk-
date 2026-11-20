/* ZeldaBonk profile data. Browser persistence and cross-tab locks live in app.js. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));
  else root.BonkProfile=factory(root.BonkCore);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
  'use strict';
  const {Game,HEROES,REALMS,UPGRADES,PERMANENT}=Core;
  const integer=(value,max=1e9)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;
  const unique=(value,allowed,limit=512)=>Array.isArray(value)?[...new Set(value.filter(item=>typeof item==='string'&&allowed(item)))].slice(-limit):[];
  const validRunId=value=>typeof value==='string'&&/^[-a-zA-Z0-9]{1,80}$/.test(value);
  const guardianIds=REALMS.map(realm=>realm.boss);
  const DEFAULT_BINDINGS=Object.freeze({up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',dash:'ShiftLeft',ultimate:'KeyR',interact:'KeyE',map:'KeyM',inventory:'KeyI',aim:'KeyQ',pause:'KeyP'});
  const validBinding=code=>typeof code==='string'&&/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|ShiftLeft|ShiftRight)$/.test(code);
  class Profile{
    constructor(raw={}){
      raw=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
      this.version=2;this.rupees=integer(raw.rupees);this.runs=integer(raw.runs);this.wins=integer(raw.wins);this.adventureWins=integer(raw.adventureWins);this.survivalWins=integer(raw.survivalWins);this.bestKills=integer(raw.bestKills);this.bestTime=integer(raw.bestTime,7200);this.totalKills=integer(raw.totalKills);
      this.sound=raw.sound===true;this.volume=typeof raw.volume==='number'&&Number.isFinite(raw.volume)?Math.max(0,Math.min(1,raw.volume)):.55;this.motion=raw.motion==='reduced'?'reduced':'system';
      this.graphics=['low','balanced','high'].includes(raw.graphics)?raw.graphics:'balanced';
      this.sensitivity=Number.isFinite(raw.sensitivity)?Math.max(.2,Math.min(2,raw.sensitivity)):1;this.invertY=raw.invertY===true;this.mouseMode=raw.mouseMode==='locked'?'locked':'free';
      this.cameraFov=Number.isFinite(raw.cameraFov)?Math.max(35,Math.min(80,raw.cameraFov)):50;this.cameraDistance=Number.isFinite(raw.cameraDistance)?Math.max(18,Math.min(52,raw.cameraDistance)):30;
      this.bindings={...DEFAULT_BINDINGS};if(raw.bindings&&Object.keys(DEFAULT_BINDINGS).every(key=>validBinding(raw.bindings[key]))&&new Set(Object.values(raw.bindings)).size===Object.keys(DEFAULT_BINDINGS).length)for(const key of Object.keys(DEFAULT_BINDINGS))this.bindings[key]=raw.bindings[key];
      this.upgrades={};for(const item of PERMANENT)this.upgrades[item.id]=integer(raw.upgrades?.[item.id],item.max);
      this.guardians=unique(raw.guardians,id=>guardianIds.includes(id),REALMS.length);this.items=unique(raw.items,id=>UPGRADES.some(item=>item.id===id),UPGRADES.length);
      this.rewardedRuns=unique(raw.rewardedRuns,validRunId);this.activeRunId=validRunId(raw.activeRunId)?raw.activeRunId:'';this.checkpoint=null;
      if(raw.checkpoint){const game=Game.fromCheckpoint(raw.checkpoint);if(!this.rewardedRuns.includes(game.runId)){
        this.checkpoint=raw.checkpoint;this.activeRunId=game.runId;
        if(game.mode==='adventure')for(const index of game.shrines)if(!this.guardians.includes(REALMS[index].boss))this.guardians.push(REALMS[index].boss);
      }}
    }
    get unlocked(){return Object.keys(HEROES).filter(id=>{const hero=HEROES[id];return(!hero.unlockBoss&&!hero.unlockSeals)||(hero.unlockBoss&&this.guardians.includes(hero.unlockBoss))||(hero.unlockSeals&&this.guardians.length>=hero.unlockSeals);});}
    get achievements(){
      const entries=[
        ['first','First steps','Finish a run.',this.runs>=1],
        ['guardian','Guardian slayer','Defeat a realm guardian.',this.guardians.length>=1],
        ['six','Eight seals','Defeat all eight realm guardians.',this.guardians.length===REALMS.length],
        ['adventure','Hero of the realms','Complete Adventure mode.',this.adventureWins>=1],
        ['survival','Against the darkness','Complete Survival mode.',this.survivalWins>=1],
        ['collector','A full pouch','Discover every weapon and charm.',this.items.length===UPGRADES.length]
      ];return entries.map(([id,name,desc,complete])=>({id,name,desc,complete}));
    }
    upgradeCost(id){const item=PERMANENT.find(item=>item.id===id);return !item||this.upgrades[id]>=item.max?null:20*(this.upgrades[id]+1);}
    purchase(id){const cost=this.upgradeCost(id);if(cost===null||this.rupees<cost)return false;this.rupees-=cost;this.upgrades[id]++;return true;}
    recordItem(id){if(!UPGRADES.some(item=>item.id===id)||this.items.includes(id))return false;this.items.push(id);return true;}
    recordGuardian(id){
      if(!guardianIds.includes(id)||this.guardians.includes(id))return[];
      const before=new Set(this.unlocked);this.guardians.push(id);return this.unlocked.filter(id=>!before.has(id));
    }
    beginRun(game,expectedCheckpointId=null){
      if(!this.unlocked.includes(game.hero))throw new Error('This hero is still locked.');
      if(this.checkpoint&&this.checkpoint.runId!==expectedCheckpointId&&this.checkpoint.runId!==game.runId)throw new Error('Your saved adventure changed. Review it before replacing it.');
      this.activeRunId=game.runId;this.checkpoint=game.checkpoint();this.recordItem(HEROES[game.hero].weapon);return true;
    }
    saveCheckpoint(game){
      if(this.activeRunId!==game.runId)return false;
      const checkpoint=game.checkpoint();if(!checkpoint)return false;
      this.checkpoint=checkpoint;for(const id of Object.keys(game.ranks))this.recordItem(id);return true;
    }
    resume(){if(!this.checkpoint)throw new Error('There is no adventure checkpoint.');return Game.fromCheckpoint(this.checkpoint);}
    settle(game){
      if(!['won','lost'].includes(game.state))throw new Error('The run has not ended.');
      if(this.rewardedRuns.includes(game.runId))return{reward:0,unlocks:[],duplicate:true};
      const before=new Set(this.unlocked),won=game.state==='won';
      let reward=Math.max(1,Math.floor(game.kills/3))+(game.mode==='adventure'?game.shrines.size*15:game.shrines.size*3)+(won?40:0);
      if(game.difficulty==='hard')reward=Math.floor(reward*1.25);
      this.rupees=integer(this.rupees+reward);this.runs++;this.totalKills=integer(this.totalKills+game.kills);this.bestKills=Math.max(this.bestKills,game.kills);this.bestTime=Math.max(this.bestTime,Math.floor(game.time));
      if(won){this.wins++;if(game.mode==='adventure')this.adventureWins++;else this.survivalWins++;}
      if(game.mode==='adventure')for(const index of game.shrines)this.recordGuardian(REALMS[index].boss);
      for(const id of Object.keys(game.ranks))this.recordItem(id);
      this.rewardedRuns.push(game.runId);this.rewardedRuns=this.rewardedRuns.slice(-512);
      if(this.checkpoint?.runId===game.runId)this.checkpoint=null;if(this.activeRunId===game.runId)this.activeRunId='';
      return{reward,unlocks:this.unlocked.filter(id=>!before.has(id)),duplicate:false};
    }
    toJSON(){
      return{game:'ZeldaBonk',version:2,rupees:this.rupees,runs:this.runs,wins:this.wins,adventureWins:this.adventureWins,survivalWins:this.survivalWins,bestKills:this.bestKills,bestTime:this.bestTime,totalKills:this.totalKills,sound:this.sound,volume:this.volume,motion:this.motion,graphics:this.graphics,sensitivity:this.sensitivity,invertY:this.invertY,mouseMode:this.mouseMode,cameraFov:this.cameraFov,cameraDistance:this.cameraDistance,bindings:{...this.bindings},upgrades:{...this.upgrades},guardians:[...this.guardians],items:[...this.items],rewardedRuns:[...this.rewardedRuns],activeRunId:this.activeRunId,checkpoint:this.checkpoint};
    }
    static migrate(old){const profile=new Profile(old);profile.rupees=integer(profile.wins*40+Math.floor(profile.bestKills/5));return profile;}
    static import(text){
      if(typeof text!=='string'||text.length>250000)throw new Error('Choose a ZeldaBonk save smaller than 250 KB.');
      let raw;try{raw=JSON.parse(text);}catch{throw new Error('That file is not valid JSON.');}
      if(!raw||typeof raw!=='object'||raw.game!=='ZeldaBonk'||raw.version!==2)throw new Error('That is not a supported ZeldaBonk save.');
      for(const key of ['rupees','runs','wins','adventureWins','survivalWins','bestKills','totalKills'])if(!Number.isInteger(raw[key])||raw[key]<0||raw[key]>1e9)throw new Error('The save has invalid '+key+'.');
      if(!raw.upgrades||typeof raw.upgrades!=='object'||Array.isArray(raw.upgrades))throw new Error('The save has invalid upgrades.');
      for(const item of PERMANENT)if(!Number.isInteger(raw.upgrades[item.id])||raw.upgrades[item.id]<0||raw.upgrades[item.id]>item.max)throw new Error('The save has an invalid upgrade rank.');
      for(const key of ['guardians','items','rewardedRuns'])if(!Array.isArray(raw[key])||raw[key].length>512)throw new Error('The save has invalid collections.');
      if(raw.bindings&&(!Object.keys(DEFAULT_BINDINGS).every(key=>validBinding(raw.bindings[key]))||new Set(Object.values(raw.bindings)).size!==Object.keys(DEFAULT_BINDINGS).length))throw new Error('The save has invalid control bindings.');
      return new Profile(raw);
    }
  }
  return{Profile,DEFAULT_BINDINGS,validBinding};
});
