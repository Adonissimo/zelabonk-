/* ZELDABONK simulation. Rendering and browser state live in app.js. */
(function (root, factory) {
  const api = factory(typeof module==='object'&&module.exports?require('./terrain.js'):root.BonkTerrain,typeof module==='object'&&module.exports?require('./combat.js'):root.BonkCombat);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BonkCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Terrain, Combat) {
  'use strict';
  const TAU = Math.PI * 2;
  const ARENA_LIMIT = 64;
  const HEROES = {
    link: { name: 'Link', title: 'Hero of Courage', hp: 100, speed: 6, weapon: 'ember', color: '#72cfc8', perk: '+20% damage · Master Sword', damage: 1.2, origin: 'Ocarina of Time', ultimateName: 'Spin Attack', ultimateColor: '#efdc83', ultimateDamage: 200, ultimateRadius: 12 },
    zelda: { name: 'Zelda', title: 'Princess of Hyrule', hp: 85, speed: 7, weapon: 'leaf', color: '#c6b0e1', perk: 'Fast movement · Light Arrows', damage: 1, origin: 'Breath of the Wild', ultimateName: 'Sealing Power', ultimateColor: '#fff0b4', ultimateDamage: 150, ultimateRadius: 14, ultimateHeal: 30 },
    midna: { name: 'Midna', title: 'Twilight Princess', hp: 150, speed: 5.1, weapon: 'orbit', color: '#86c4bc', perk: '+50 health · Fused Shadow', damage: 1, origin: 'Twilight Princess', ultimateName: 'Fused Shadow', ultimateColor: '#a2e5d3', ultimateDamage: 230, ultimateRadius: 10, ultimateShield: 3 },
    tetra: { name: 'Tetra', title: 'Pirate Captain', hp: 100, speed: 6.5, weapon: 'bomb', color: '#79bbd1', perk: 'Quick footwork · Bombs', damage: 1.05, origin: 'The Wind Waker', ultimateName: 'Bombs', ultimateColor: '#f5b57c', ultimateDamage: 250, ultimateRadius: 11, unlockBoss: 'helmaroc', unlockText: 'Defeat the Helmaroc King' },
    sheik: { name: 'Sheik', title: 'Sheikah Warrior', hp: 90, speed: 7.2, weapon: 'boomerang', color: '#9cafd9', perk: 'Swift movement · Boomerang', damage: 1.1, origin: 'Ocarina of Time', ultimateName: 'Nocturne of Shadow', ultimateColor: '#b5b7eb', ultimateDamage: 170, ultimateRadius: 13, ultimateShield: 2, unlockSeals: 3, unlockText: 'Defeat three different guardians' },
    skullkid: { name: 'Skull Kid', title: 'Lost Woods Trickster', hp: 90, speed: 6.4, weapon: 'nova', color: '#d4a768', perk: 'Wide magic · Din’s Fire', damage: 1.15, origin: 'Majora’s Mask', ultimateName: 'Majora’s Mask', ultimateColor: '#d5a7de', ultimateDamage: 260, ultimateRadius: 13, unlockBoss: 'majora', unlockText: 'Defeat Majora’s Mask' }
  };
  const REALMS = [
    { id: 'hyrule', name: 'Hyrule Field', subtitle: 'Where courage begins', color: '#a3c874', sky: '#d4e8d3', ground: '#88aa60', fog: '#cadfc6', accent: '#e6cc81', blessing: 'Wallet', benefit: '+45% XP collection range', gift: 'magnet', boss: 'gohma', links: [1,5,3] },
    { id: 'sea', name: 'The Great Sea', subtitle: 'Follow the wind beyond the horizon', color: '#76c9c6', sky: '#cbe9e6', ground: '#d5c18c', fog: '#d1e8de', accent: '#53c7d4', blessing: 'Heart Container', benefit: '+25 maximum health. Restore 35 health.', gift: 'vitality', boss: 'helmaroc', links: [0,2,4] },
    { id: 'twilight', name: 'Twilight Realm', subtitle: 'A light between two worlds', color: '#ad91ca', sky: '#555b80', ground: '#636a8d', fog: '#73728c', accent: '#f4b583', blessing: 'Power Bracelet', benefit: '+18% weapon damage', gift: 'power', boss: 'zant', links: [1,3,5] },
    { id: 'skyloft', name: 'Skyloft', subtitle: 'The earth ends. The adventure does not.', color: '#abd6df', sky: '#cae6ef', ground: '#a3b97a', fog: '#e0eff0', accent: '#f4dd9b', blessing: 'Wind Waker', benefit: 'Weapons attack 10% faster', gift: 'haste', boss: 'ghirahim', links: [2,4,0] },
    { id: 'depths', name: 'The Depths', subtitle: 'Follow the lightroots through the gloom', color: '#9e8bac', sky: '#39303d', ground: '#685660', fog: '#634c61', accent: '#e6e8a3', blessing: 'Fairy', benefit: 'Restore 1 health per second', gift: 'regen', boss: 'colgera', links: [3,5,1] },
    { id: 'termina', name: 'Termina Field', subtitle: 'Every ending holds another beginning', color: '#b6b9de', sky: '#5a6986', ground: '#7e8f9d', fog: '#9aabc1', accent: '#e3d99e', blessing: 'Bunny Hood', benefit: '+10% movement speed', gift: 'speed', boss: 'majora', links: [4,0,2] }
  ];
  REALMS.push(
    {id:'kokiri',name:'Kokiri Forest',subtitle:'The village beneath the Great Deku Tree',color:'#83bc7d',sky:'#c8e3c1',ground:'#78a65b',fog:'#afcba7',accent:'#e7d38d',blessing:'Heart Container',benefit:'+25 maximum health. Restore 35 health.',gift:'vitality',boss:'gohma'},
    {id:'lake',name:'Lake Hylia',subtitle:'Ancient water beneath the lakeside temple',color:'#82c9dc',sky:'#cde8ef',ground:'#92b4a1',fog:'#c2e0e4',accent:'#d8e7b0',blessing:'Iron Boots',benefit:'+25 maximum health. Restore 35 health.',gift:'vitality',boss:'morpha'}
  );
  const ENEMIES={
    chuchu:{name:'Chuchu',type:'slime',origin:'Recurring Zelda enemy'},blue_chuchu:{name:'Blue ChuChu',type:'slime',origin:'The Wind Waker / Majora’s Mask'},
    deku_baba:{name:'Deku Baba',type:'mushroom',origin:'Ocarina of Time / Majora’s Mask'},deku_scrub:{name:'Deku Scrub',type:'mushroom',origin:'Ocarina of Time'},skulltula:{name:'Skulltula',type:'boar',origin:'Ocarina of Time'},
    keese:{name:'Keese',type:'bat',origin:'Recurring Zelda enemy'},bokoblin:{name:'Bokoblin',type:'boar',origin:'The Wind Waker / Breath of the Wild'},
    octorok:{name:'Octorok',type:'mushroom',origin:'Ocarina of Time'},tektite:{name:'Tektite',type:'slime',origin:'Ocarina of Time'},lizalfos:{name:'Lizalfos',type:'boar',origin:'Ocarina of Time'},seahat:{name:'Seahat',type:'bat',origin:'The Wind Waker'},
    shadow_beast:{name:'Shadow Beast',type:'boar',origin:'Twilight Princess'},shadow_vermin:{name:'Shadow Vermin',type:'slime',origin:'Twilight Princess'},shadow_kargarok:{name:'Shadow Kargarok',type:'bat',origin:'Twilight Princess'},
    remlit:{name:'Remlit',type:'boar',origin:'Skyward Sword'},little_frox:{name:'Little Frox',type:'slime',origin:'Tears of the Kingdom'},gloom_bokoblin:{name:'Gloom Bokoblin',type:'boar',origin:'Tears of the Kingdom'},evermean:{name:'Evermean',type:'boar',origin:'Tears of the Kingdom'},takkuri:{name:'Takkuri',type:'bat',origin:'Majora’s Mask'}
  };
  const pools=[['chuchu','keese','bokoblin'],['blue_chuchu','bokoblin','seahat'],['shadow_vermin','shadow_kargarok','shadow_beast'],['chuchu','keese','remlit'],['little_frox','gloom_bokoblin','evermean'],['blue_chuchu','deku_baba','takkuri'],['deku_baba','deku_scrub','skulltula'],['octorok','tektite','lizalfos']];
  const origins=['Ocarina of Time / Breath of the Wild','The Wind Waker','Twilight Princess','Skyward Sword','Tears of the Kingdom','Majora’s Mask','Ocarina of Time','Ocarina of Time / Twilight Princess'];
  REALMS[0].boss='kingbulblin';
  REALMS.forEach((realm,index)=>{realm.links=[(index+7)%8,(index+1)%8,(index+4)%8];realm.enemies=pools[index];realm.origin=origins[index];realm.landmark=['Hyrule Castle','Tower of the Gods','Mirror of Twilight','Statue of the Goddess','Lightroot','Clock Tower','Great Deku Tree','Water Temple'][index];realm.number=[3,4,5,6,7,8,1,2][index];});
  const ADVENTURE_ROUTE=Object.freeze(REALMS.map((_,index)=>index).sort((a,b)=>REALMS[a].number-REALMS[b].number));
  const STAGE_TARGETS=Object.freeze([12,18,24]);
  const GATES = [{x:-48,z:-48},{x:48,z:-48},{x:0,z:55}];
  const BOSSES = {
    kingbulblin:{name:'King Bulblin',origin:'Twilight Princess',hp:600,speed:1.3,radius:1.8,damage:19,color:'#aac684',height:4.8,patterns:['charge','slam','summon']},
    morpha:{name:'Morpha',origin:'Ocarina of Time',hp:560,speed:1.4,radius:1.9,damage:18,color:'#86d6ed',height:4.7,patterns:['slam','volley','teleport']},
    gohma: { name: 'Gohma', origin: 'Ocarina of Time', hp: 480, speed: 1.1, radius: 1.8, damage: 17, color: '#d5a55e', height: 4.3, patterns: ['slam','summon','volley'] },
    helmaroc: { name: 'Helmaroc King', origin: 'The Wind Waker', hp: 540, speed: 1.4, radius: 1.9, damage: 18, color: '#88c7e4', height: 5.4, flying: true, patterns: ['charge','volley'] },
    zant: { name: 'Zant', origin: 'Twilight Princess', hp: 540, speed: 1.3, radius: 1.5, damage: 18, color: '#b09ada', height: 4.7, patterns: ['teleport','volley','slam'] },
    ghirahim: { name: 'Ghirahim', origin: 'Skyward Sword', hp: 540, speed: 1.7, radius: 1.4, damage: 18, color: '#ddd5e6', height: 4.3, patterns: ['charge','volley'] },
    colgera: { name: 'Colgera', origin: 'Tears of the Kingdom', hp: 580, speed: 1.4, radius: 2.2, damage: 19, color: '#a8e2ec', height: 5.8, flying: true, patterns: ['charge','volley','slam'] },
    majora: { name: 'Majora’s Mask', origin: 'Majora’s Mask', hp: 560, speed: 1.3, radius: 1.7, damage: 19, color: '#e2a16f', height: 4.5, flying: true, patterns: ['volley','summon','charge'] },
    ganondorf: { name: 'Ganondorf', origin: 'Ocarina of Time', hp: 2600, speed: 1.5, radius: 1.8, damage: 24, color: '#d39884', height: 4.9, final: true, patterns: ['volley','charge','slam','summon'] },
    phantom: { name: 'Phantom Ganon', origin: 'Ocarina of Time', hp: 2900, speed: 1.3, radius: 2.1, damage: 26, color: '#b6d5b6', height: 5, final: true, patterns: ['slam','volley'] }
  };
  const UPGRADES = [
    {id:'ember',name:'Master Sword',category:'WEAPON',icon:'sword',desc:'Straight sword beams strike a nearby enemy.',max:8,origin:'Ocarina of Time / Skyward Sword'},
    {id:'orbit',name:'Fused Shadow',category:'WEAPON',icon:'orbit',desc:'Dark relics circle you and strike nearby enemies.',max:8,origin:'Twilight Princess'},
    {id:'nova',name:'Din’s Fire',category:'WEAPON',icon:'flame',desc:'A ring of fire blasts nearby enemies.',max:8,origin:'Ocarina of Time'},
    {id:'leaf',name:'Light Arrows',category:'WEAPON',icon:'arrow',desc:'Homing light arrows track nearby enemies.',max:8,origin:'Ocarina of Time / Breath of the Wild'},
    {id:'bomb',name:'Bombs',category:'WEAPON',icon:'flame',desc:'Lob a bomb that explodes across a wide area.',max:8,origin:'Recurring Zelda item'},
    {id:'boomerang',name:'Boomerang',category:'WEAPON',icon:'wind',desc:'A returning weapon strikes on both journeys.',max:8,origin:'The Wind Waker / Twilight Princess'},
    {id:'power',name:'Power Bracelet',category:'CHARM',icon:'heart',desc:'+18% weapon damage.',max:10,origin:'Recurring Zelda item'},
    {id:'haste',name:'Wind Waker',category:'CHARM',icon:'wind',desc:'Weapons attack 10% faster.',max:10,origin:'The Wind Waker'},
    {id:'magnet',name:'Wallet',category:'CHARM',icon:'magnet',desc:'+45% XP collection range.',max:10,origin:'Recurring Zelda item'},
    {id:'vitality',name:'Heart Container',category:'CHARM',icon:'plus',desc:'+25 maximum health. Restore 35 health.',max:10,origin:'Recurring Zelda item'},
    {id:'regen',name:'Fairy',category:'CHARM',icon:'sprout',desc:'Restore 1 health per second.',max:10,origin:'Recurring Zelda creature'},
    {id:'speed',name:'Bunny Hood',category:'CHARM',icon:'boot',desc:'+10% movement speed.',max:10,origin:'Majora’s Mask'}
  ];
  const PERMANENT = [
    {id:'heart',name:'Heart Container',icon:'heart',desc:'+8 starting maximum health per rank.',max:5},
    {id:'power',name:'Power Bracelet',icon:'sword',desc:'+5% starting weapon damage per rank.',max:5},
    {id:'armor',name:'Mirror Shield',icon:'shield',desc:'Take 4% less damage per rank.',max:5},
    {id:'magnet',name:'Wallet',icon:'magnet',desc:'+12% starting XP collection range per rank.',max:5},
    {id:'magic',name:'Magic Jar',icon:'bolt',desc:'Charge Ultimates 8% faster per rank.',max:5},
    {id:'weaponSlot',name:'Fourth weapon',icon:'sword',desc:'Unlock a fourth weapon slot for new runs.',max:1,costs:[1500]},
    {id:'charmSlots',name:'Charm slots',icon:'relic',desc:'Unlock one additional charm slot per rank, up to five.',max:2,costs:[1200,3000]}
  ];
  const xpForLevel=level=>Math.round(8+level*5.5+Math.pow(level,1.8));
  const UPGRADE_LIMITS=Object.fromEntries(UPGRADES.map(item=>[item.id,item.max]));

  const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function hitAlong(from,to,target,radius,targetY,tolerance){
    const dx=to.x-from.x,dz=to.z-from.z,length=dx*dx+dz*dz,t=length?clamp(((target.x-from.x)*dx+(target.z-from.z)*dz)/length,0,1):0;
    return Math.hypot(from.x+dx*t-target.x,from.z+dz*t-target.z)<radius&&Math.abs(from.y+(to.y-from.y)*t-targetY)<tolerance;
  }
  function seeded(seed) {
    const roll=function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    roll.getState=()=>seed|0;roll.setState=value=>{seed=value|0;};return roll;
  }
  class Game {
    constructor(hero = 'link', seed = Date.now(), options = {}) {
      if (!Object.hasOwn(HEROES,hero)) throw new Error('Unknown hero.');
      options=options&&typeof options==='object'?options:{};
      this.mode=['adventure','training'].includes(options.mode)?options.mode:'survival';this.difficulty=options.difficulty==='hard'?'hard':'normal';
      this.training={invulnerable:true};
      this.permanent={};for(const upgrade of PERMANENT)this.permanent[upgrade.id]=Number.isInteger(options.upgrades?.[upgrade.id])?clamp(options.upgrades[upgrade.id],0,upgrade.max):0;
      this.runId=typeof options.runId==='string'&&/^[-a-zA-Z0-9]{1,80}$/.test(options.runId)?options.runId:'run-'+Math.abs(Math.floor(seed))+'-'+hero;
      this.checkpointRevision=1;
      this.random = seeded(seed); this.hero = hero; this.state = 'running'; this.time = 0;
      this.flatTerrain=options.flatTerrain===true;
      this.player = { ground:0, x: 0, z: 0, y: 0, vy: 0, gliding: false, stamina: 1, hp: HEROES[hero].hp, maxHp: HEROES[hero].hp, speed: HEROES[hero].speed, radius: .52, facing: 0, invincible: 0, dash: 0, dashCooldown: 0, dx: 0, dz: 1 };
      this.enemies = []; this.shards = []; this.projectiles = []; this.hazards = []; this.events = [];
      this.gear={};this.stats=Combat.stats(this.gear);this.loot=[];this.damageBySource={};this.criticalHits=0;this.megaCriticalHits=0;this.reactions=0;
      this.legacySlots={weapons:0,charms:0};
      this.weaponUpgrades={};this.orbitActive=0;
      this.level = 1; this.xp = 0; this.xpNeed = xpForLevel(1); this.kills = 0; this.nextId = 1; this.ranks = { [HEROES[hero].weapon]: 1 };
      this.cooldowns = { ember: .3, nova: 1.5, leaf: .4, bomb: .7, boomerang: .4, orbit:.1 }; this.spawnTimer = .2; this.eliteMinute = 0;
      this.bossSpawned = false; this.boss = null; this.choices = []; this.orbitAngle = 0; this.damageTaken = 0; this.damageDealt = 0;
      this.realm = this.mode==='adventure'||this.mode==='training'?6:0; this.visited = new Set([this.realm]); this.realmStages=REALMS.map(()=>1);this.stageKills=REALMS.map(()=>0); this.shrines = new Set(); this.travelCooldown = 0; this.shrineCharge = 0;this.adventureDelay=0;
      this.energy = 25; this.streak = 0; this.streakTimer = 0; this.bestStreak = 0;
      this.aimMode = 'auto'; this.cameraYaw = Math.PI / 4; this.lockedTarget = null;
      this.refreshes = 2; this.skips = 2; this.banishes = 1; this.banished = new Set();
      this.player.maxHp+=this.permanent.heart*8;this.player.hp=this.player.maxHp;this.player.action='idle';this.player.actionTime=0;this.player.actionAge=0;this.player.attackKind=null;
    }
    groundAt(x,z){return this.flatTerrain?0:Terrain.height(this.realm,this.stage,x,z);}
    get weaponSlots(){return this.mode==='training'?4:Math.max(3+(this.permanent.weaponSlot||0),this.legacySlots?.weapons||0);}
    get charmSlots(){return this.mode==='training'?5:Math.max(3+(this.permanent.charmSlots||0),this.legacySlots?.charms||0);}
    shrineRanks(id){return Combat.WEAPONS[id]?0:[...this.shrines].filter(index=>REALMS[index].gift===id).length;}
    learnedRank(id){return Math.max(0,this.rank(id)-this.shrineRanks(id));}
    slotCount(category){return UPGRADES.filter(item=>item.category===category&&this.learnedRank(item.id)>0).length;}
    rankLimit(id){return UPGRADE_LIMITS[id]+(Combat.WEAPONS[id]?(this.gear.adventurepouch?2:0):(this.gear.greenpotion?2:0)+this.shrineRanks(id));}
    canOffer(item){return !!item&&this.rank(item.id)<this.rankLimit(item.id)&&!this.banished.has(item.id)&&(this.learnedRank(item.id)>0||this.slotCount(item.category)<(item.category==='WEAPON'?this.weaponSlots:this.charmSlots));}
    targetFor(){return this.player;}
    damageTargets(){return[this.player];}
    pickupTarget(){return this.player;}
    pickupRadius(){return this.magnetRadius;}
    collectLootFor(drop){return this.collectLoot(drop.id);}
    projectileOwner(){return this.player;}
    hitProjectile(enemy,projectile,knock=1.2){return this.hitEnemy(enemy,projectile.damage,projectile.type,knock);}
    hitStatus(enemy,effect){return this.hitEnemy(enemy,effect.power*.18,effect.source,0,true);}
    updateActors(dt,input){this.updatePlayer(dt,input);}
    updateAllWeapons(dt){this.updateWeapons(dt);}
    configureTraining(config){
      if(this.mode!=='training'||!['running','paused'].includes(this.state)||!config||typeof config!=='object')return false;
      const {realm,stage,level,invulnerable}=config,hero=config.hero??this.hero;
      if(!Object.hasOwn(HEROES,hero)||!Number.isInteger(realm)||!REALMS[realm]||!Number.isInteger(stage)||stage<1||stage>3||!Number.isInteger(level)||level<1||level>40||typeof invulnerable!=='boolean')return false;
      this.hero=hero;this.player.speed=HEROES[hero].speed;this.refreshStats();this.realm=realm;this.realmStages[realm]=stage;this.level=level;this.xpNeed=xpForLevel(level);this.training.invulnerable=invulnerable;this.visited.add(realm);this.resetTraining();return true;
    }
    setTrainingBuild(ranks,gear,rarities={}){
      if(this.mode!=='training'||!['running','paused'].includes(this.state)||!ranks||typeof ranks!=='object'||Array.isArray(ranks))return false;
      const entries=Object.entries(ranks),weapons=entries.filter(([id,rank])=>rank&&Combat.WEAPONS[id]).length,charms=entries.filter(([id,rank])=>rank&&!Combat.WEAPONS[id]).length;
      let validated;try{validated=Combat.validateGear(gear);}catch{return false;}
      if(weapons>4||charms>5||entries.some(([id,rank])=>!UPGRADES.some(item=>item.id===id)||!Number.isInteger(rank)||rank<0||rank>(Combat.WEAPONS[id]?(validated.adventurepouch?10:8):(validated.greenpotion?12:10))))return false;
      if(!rarities||typeof rarities!=='object'||Array.isArray(rarities)||Object.entries(rarities).some(([id,value])=>!Object.hasOwn(Combat.WEAPONS,id)||!Number.isInteger(value)||value<0||value>4))return false;
      this.weaponUpgrades=Object.fromEntries(entries.filter(([id,rank])=>Combat.WEAPONS[id]&&rank).map(([id,rank])=>{const history=Object.hasOwn(rarities,id)?Array(rank-1).fill(rarities[id]):(this.weaponUpgrades[id]||[]).slice(0,rank-1);while(history.length<rank-1)history.push(0);return[id,history];}));
      this.ranks=Object.fromEntries(entries.filter(([,rank])=>rank));this.shrines.clear();this.gear=validated;this.refreshStats();this.player.hp=this.player.maxHp;this.cooldowns={ember:.1,leaf:.1,nova:.1,bomb:.1,boomerang:.1,orbit:.1};this.orbitActive=0;return true;
    }
    resetTraining(){
      if(this.mode!=='training'||!['running','paused'].includes(this.state))return false;
      this.enemies=[];this.projectiles=[];this.hazards=[];this.shards=[];this.loot=[];this.boss=null;this.bossSpawned=false;this.lockedTarget=null;
      this.player.x=0;this.player.z=0;this.player.y=0;this.player.ground=0;this.player.vy=0;this.player.hp=this.player.maxHp;this.player.invincible=0;this.player.dashCooldown=0;
      this.orbitActive=0;for(const id of Object.keys(Combat.WEAPONS))this.cooldowns[id]=.1;this.damageDealt=0;this.damageTaken=0;this.damageBySource={};this.kills=0;this.streak=0;this.bestStreak=0;this.criticalHits=0;this.megaCriticalHits=0;this.reactions=0;this.energy=100;return true;
    }
    spawnTrainingRivals(kind){
      if(this.mode!=='training'||!['running','paused'].includes(this.state)||!['dummy','group10','group30','horde60','elite','alpha','boss'].includes(kind)||this.boss)return false;
      const count={group10:10,group30:30,horde60:60}[kind]||1;if(this.enemies.filter(enemy=>!enemy.dead).length+count>170)return false;
      for(let i=0;i<count;i++){
        const angle=i*TAU/count,x=clamp(this.player.x+Math.cos(angle)*(count===1?8:12),-60,60),z=clamp(this.player.z+Math.sin(angle)*(count===1?8:12),-60,60);
        const enemy=kind==='boss'?this.spawnBoss(REALMS[this.realm].boss):this.spawnRealmEnemy(x,z);
        if(!enemy)continue;if(kind==='dummy'){enemy.dummy=true;enemy.name='Training dummy';enemy.hp=enemy.maxHp=2500;}
        else if(kind!=='boss'){const multiplier=kind==='elite'?4.5:kind==='alpha'?22:1;enemy.hp*=multiplier;enemy.maxHp=enemy.hp;enemy.elite=kind==='elite'||kind==='alpha';}
      }return true;
    }
    heal(amount){const before=this.player.hp;this.player.hp=Math.min(this.player.maxHp,before+Math.max(0,amount)*this.stats.healing);return this.player.hp-before;}
    refreshStats(){
      const previous=this.player.maxHp;this.stats=Combat.stats(this.gear);
      this.player.maxHp=(HEROES[this.hero].hp+this.permanent.heart*8+this.rank('vitality')*25+this.stats.maxHp)*this.stats.hpScale;
      this.player.hp=Math.min(this.player.maxHp,this.player.hp+Math.max(0,this.player.maxHp-previous));
    }
    acquireGear(id){
      const item=Combat.item(id);if(this.state!=='running'||!item||(this.gear[id]||0)>=item.max)return false;
      this.gear[id]=(this.gear[id]||0)+1;this.refreshStats();this.checkpointRevision++;
      this.emit('gear',{id,count:this.gear[id],name:item.name,rarity:item.rarity});return true;
    }
    dropGear(x,z,minimum=0){
      if(this.loot.length>=12)return null;
      const available=Combat.GEAR.filter(item=>(this.gear[item.id]||0)<item.max&&item.rarity>=minimum);if(!available.length)return null;
      const total=available.reduce((sum,item)=>sum+Combat.RARITIES[item.rarity].weight,0);let roll=this.random()*total;
      const item=available.find(item=>(roll-=Combat.RARITIES[item.rarity].weight)<0)||available.at(-1);
      const drop={id:this.nextId++,gearId:item.id,x:clamp(x,-ARENA_LIMIT+1,ARENA_LIMIT-1),z:clamp(z,-ARENA_LIMIT+1,ARENA_LIMIT-1)};
      this.loot.push(drop);this.checkpointRevision++;this.emit('lootDrop',{x:drop.x,z:drop.z,rarity:item.rarity});return drop;
    }
    collectLoot(id){
      if(this.state!=='running')return false;const index=this.loot.findIndex(drop=>drop.id===id);if(index<0)return false;
      const [drop]=this.loot.splice(index,1);if(!this.acquireGear(drop.gearId)){this.heal(10);this.emit('heal',{amount:10});}
      this.checkpointRevision++;return true;
    }
    bankLoot(){for(const drop of [...this.loot])this.collectLoot(drop.id);}
    hitEnemy(enemy,base,source,knock=0,secondary=false){
      if(!enemy||enemy.dead||this.state!=='running'||!Number.isFinite(base)||base<=0)return 0;
      const stats=this.stats,kind=Combat.WEAPONS[source];let damage=base*(kind?stats[kind]:1);
      if(enemy.elite||enemy.type==='boss')damage*=stats.eliteDamage;
      const crit=secondary?{tier:0,multiplier:1}:Combat.critical(stats.critChance+(this.weaponStats(source)?.critical||0),stats.critDamage,this.random());
      damage*=crit.multiplier;
      if(crit.tier){this.criticalHits++;if(crit.tier===2)this.megaCriticalHits++;}
      const dealt=this.hurtEnemy(enemy,damage,knock,{source,critical:crit.tier})||0;
      if(!secondary){
        if(stats.lifesteal)this.heal(dealt*stats.lifesteal);
        if(!enemy.dead)for(const item of Combat.GEAR)if(item.proc&&this.gear[item.id]&&this.random()<Math.min(.8,item.chance*this.gear[item.id]))this.applyStatus(enemy,item.proc,base,item.id);
      }
      return dealt;
    }
    applyStatus(enemy,id,power=10,source=id){
      if(this.state!=='running'||!Combat.STATUS[id]||!enemy||enemy.dead||!Number.isFinite(power)||power<0)return false;
      const effects=enemy.statuses||(enemy.statuses={}),wet=effects.wet?.time>0,frozen=effects.freeze?.time>0,burning=effects.burn?.time>0;
      if((id==='wet'||id==='freeze')&&burning||id==='burn'&&(wet||frozen)){
        delete effects.burn;delete effects.wet;delete effects.freeze;this.reactions++;
        this.emit('reaction',{name:'Steam',x:enemy.x,z:enemy.z,color:'#e5ead9'});this.hitEnemy(enemy,power*.6,'reaction',0,true);return true;
      }
      let duration=Combat.STATUS[id].duration*this.stats.duration;
      if(id==='freeze'&&wet){duration*=1.5;delete effects.wet;}
      if(enemy.type==='boss'&&(id==='freeze'||id==='shock'))duration*=.25;
      const old=effects[id];effects[id]={time:Math.max(old?.time||0,duration),tick:old?.tick??.5,power:Math.max(old?.power||0,power),source,ownerId:this.actorId||null};
      this.emit('status',{status:id,x:enemy.x,z:enemy.z});
      if(id==='shock'&&wet){
        delete effects.wet;this.reactions++;this.emit('reaction',{name:'Chain shock',x:enemy.x,z:enemy.z,color:'#f1db82'});
        for(const target of this.enemies)if(!target.dead&&distance(enemy,target)<5)this.hitEnemy(target,power*.8,'reaction',0,true);
      }
      return true;
    }
    updateStatuses(enemy,dt){
      for(const [id,effect]of Object.entries(enemy.statuses||{})){
        effect.time-=dt;
        if(id==='burn'){effect.tick-=dt;if(effect.tick<=0){effect.tick+=.5;this.hitStatus(enemy,effect);}}
        if(effect.time<=0)delete enemy.statuses[id];if(enemy.dead)break;
      }
    }
    get stage(){return this.realmStages[this.realm];}
    get stageLabel(){return REALMS[this.realm].number+'-'+this.stage;}
    get stageTarget(){return STAGE_TARGETS[this.stage-1];}
    get stageReady(){return this.stageKills[this.realm]>=this.stageTarget;}
    get nextAdventureRealm(){return ADVENTURE_ROUTE.find(index=>!this.shrines.has(index))??null;}
    get adventureTransition(){return this.mode==='adventure'&&!this.boss&&(this.shrines.has(this.realm)||this.stage===3&&this.stageReady);}
    advanceStage(){
      if(this.mode!=='adventure'||this.state!=='running'||this.boss||this.stage>=3||!this.stageReady||this.shrines.has(this.realm))return false;
      const banked=this.shards.reduce((sum,item)=>sum+item.value,0);this.shards=[];this.enemies=[];this.projectiles=[];this.hazards=[];this.lockedTarget=null;
      this.bankLoot();this.realmStages[this.realm]++;this.stageKills[this.realm]=0;this.player.x=0;this.player.z=0;this.player.y=0;this.player.ground=0;this.player.vy=0;this.player.invincible=2;this.heal(15);this.spawnTimer=.8;this.checkpointRevision++;
      this.emit('stage',{realm:this.realm,stage:this.stage,label:this.stageLabel});if(banked)this.collect(banked);return true;
    }
    spawnRealmEnemy(x,z,elite=false){const pool=REALMS[this.realm].enemies,index=elite?pool.length-1:Math.floor(this.random()*pool.length);return this.spawnEnemy(pool[index],x,z,elite);}
    setAction(action, duration) {
      const priority={idle:0,walk:0,jump:1,glide:1,dash:2,attack:3,cast:3,ultimate:4,hurt:5,death:6,victory:6};
      if(this.player.actionTime>0&&(priority[this.player.action]||0)>(priority[action]||0))return;
      this.player.action=action;this.player.actionTime=duration;this.player.actionAge=0;
    }
    get travelBlockedReason() {
      if(this.mode==='adventure'&&this.boss&&!this.boss.dead)return 'Defeat '+this.boss.name+' to advance.';
      if(this.mode==='adventure')return this.shrines.has(this.realm)?'Map cleared. The next encounter starts automatically.':'Clear all three levels and defeat '+BOSSES[REALMS[this.realm].boss].name+' to advance.';
      if(this.travelCooldown>0)return 'Gate recharging · '+Math.ceil(this.travelCooldown)+'s';
      return '';
    }
    activateShrine(realm=this.realm) {
      if(this.shrines.has(realm))return false;
      this.shrines.add(realm);this.realmStages[realm]=3;const gift=REALMS[realm].gift;this.ranks[gift]=this.rank(gift)+1;
      if(gift==='vitality'){const hp=this.player.hp;this.refreshStats();this.player.hp=hp;this.heal(35);}
      this.player.invincible=Math.max(this.player.invincible,1.5);
      this.emit('shrine',{realm,x:0,z:-7});this.emit('nova',{x:0,z:-7,radius:9,color:REALMS[realm].accent});
      for(const enemy of this.enemies)if(Math.hypot(enemy.x,enemy.z+7)<9)this.hitEnemy(enemy,100*this.damageMultiplier,'shrine',5);
      this.checkpointRevision++;return true;
    }
    spawnBoss(id, final=false) {
      if(!BOSSES[id]||(this.boss&&!this.boss.dead))return null;
      const spec=BOSSES[id],enemy=this.spawnEnemy('boss',clamp(this.player.x+10,-ARENA_LIMIT+4,ARENA_LIMIT-4),clamp(this.player.z-10,-ARENA_LIMIT+4,ARENA_LIMIT-4));
      const health=(spec.hp+(this.mode==='adventure'&&!final?this.shrines.size*110:0))*(this.difficulty==='hard'?1.35:1)*(this.mode==='training'?1:1.08);
      Object.assign(enemy,{bossId:id,name:spec.name,hp:health,maxHp:health,speed:spec.speed,radius:spec.radius,damage:spec.damage*(this.difficulty==='hard'?1.25:1),realm:this.realm,final,stage:1,attackTimer:1.6,windup:0,attackCycle:0,action:'spawn',actionAge:0,spawnTime:.8,chargeTimer:0});
      this.boss=enemy;this.bossSpawned=true;this.player.invincible=Math.max(this.player.invincible,1.5);
      this.emit('boss',{id,name:spec.name,realm:this.realm});return enemy;
    }
    challengeGuardian() {
      if(this.mode!=='adventure'||this.state!=='running'||this.boss||this.shrines.has(this.realm)||this.stage!==3||!this.stageReady||this.adventureDelay>0)return false;
      // Bank the third wave before opening the separate boss encounter. Upgrades finish first.
      this.enemies=[];this.projectiles=[];this.hazards=[];this.lockedTarget=null;
      if(!this.bankBossRewards())return false;
      return !!this.spawnBoss(REALMS[this.realm].boss,false);
    }
    bankBossRewards(){
      const banked=this.shards.reduce((sum,item)=>sum+item.value,0);this.shards=[];this.bankLoot();
      if(banked)this.collect(banked);return this.state==='running';
    }
    progressAdventure(dt){
      if(!this.adventureTransition)return false;
      this.enemies=[];this.projectiles=[];this.hazards=[];this.lockedTarget=null;
      this.player.action='idle';this.player.actionTime=0;this.player.invincible=2;
      this.adventureDelay=Math.max(0,this.adventureDelay-dt);
      if(this.adventureDelay>0)return true;
      if(!this.shrines.has(this.realm)){this.challengeGuardian();return true;}
      const next=this.nextAdventureRealm;
      if(next!==null)this.enterRealm(next);
      else if(this.realm!==0)this.enterRealm(0);
      else if(this.bankBossRewards())this.spawnBoss('ganondorf',true);
      return true;
    }
    alignAdventure(){
      if(this.mode!=='adventure'||this.boss)return false;
      const next=this.nextAdventureRealm??0;
      // Older free-roam saves keep every seal and stage, then resume at the first unfinished map.
      if(this.realm===next)return false;
      this.realm=next;this.visited.add(next);this.enemies=[];this.projectiles=[];this.hazards=[];this.lockedTarget=null;this.adventureDelay=0;
      Object.assign(this.player,{x:0,z:0,y:0,ground:0,vy:0,invincible:2});this.checkpointRevision++;return true;
    }
    addHazard(x,z,radius,delay,damage=24) {
      if(this.hazards.length>=90)return;
      this.hazards.push({id:this.nextId++,x,z,radius,timer:delay,duration:delay,fired:false,life:delay+.4,damage});
    }
    enemyBolt(enemy,angle,speed=7) {
      if(this.projectiles.length>=300)return;
      const target=this.targetFor(enemy),y=this.groundAt(enemy.x,enemy.z)+1,d=Math.max(1,distance(enemy,target));
      this.projectiles.push({id:this.nextId++,ownerId:enemy.id,type:'hostile',hostile:true,x:enemy.x,z:enemy.z,y,vy:(target.y+target.ground+1-y)/d,vx:Math.cos(angle),vz:Math.sin(angle),speed,life:3.4,age:0,damage:enemy.damage*.8,radius:.28,hits:new Set(),color:BOSSES[enemy.bossId]?.color||'#d894b1'});
    }
    updateBoss(enemy,dt) {
      const spec=BOSSES[enemy.bossId]||BOSSES.phantom,p=this.targetFor(enemy);
      const stage=enemy.hp<enemy.maxHp*.33?3:enemy.hp<enemy.maxHp*.66?2:1;
      if(stage>enemy.stage){enemy.stage=stage;enemy.attackTimer=Math.min(enemy.attackTimer,.7);this.emit('bossPhase',{id:enemy.bossId,name:enemy.name,stage,x:enemy.x,z:enemy.z});}
      enemy.actionAge=(enemy.actionAge||0)+dt;
      if(enemy.spawnTime>0){enemy.spawnTime=Math.max(0,enemy.spawnTime-dt);enemy.action='spawn';if(enemy.spawnTime===0)enemy.actionAge=0;return;}
      if(enemy.chargeTimer>0){enemy.chargeTimer-=dt;enemy.x=clamp(enemy.x+enemy.chargeX*dt,-ARENA_LIMIT+1,ARENA_LIMIT-1);enemy.z=clamp(enemy.z+enemy.chargeZ*dt,-ARENA_LIMIT+1,ARENA_LIMIT-1);enemy.action='attack';return;}
      if(enemy.windup>0){
        enemy.windup=Math.max(0,enemy.windup-dt);enemy.action='windup';
        if(enemy.windup===0){
          const angle=Math.atan2(enemy.targetZ-enemy.z,enemy.targetX-enemy.x),kind=enemy.intent;
          if(kind==='charge'){enemy.chargeTimer=.65;enemy.chargeX=Math.cos(angle)*22;enemy.chargeZ=Math.sin(angle)*22;}
          else if(kind==='volley'){const count=6+enemy.stage*2;for(let i=0;i<count;i++)this.enemyBolt(enemy,angle+i*TAU/count,6.5+enemy.stage);}
          else if(kind==='teleport'){enemy.x=clamp(enemy.targetX+Math.cos(enemy.phase)*5,-23,23);enemy.z=clamp(enemy.targetZ+Math.sin(enemy.phase)*5,-23,23);for(let i=-1;i<=1;i++)this.enemyBolt(enemy,angle+i*.22,8);this.emit('blink',{x:enemy.x,z:enemy.z});}
          else if(kind==='summon'){for(let i=0;i<2+enemy.stage;i++){const a=i*TAU/(2+enemy.stage);this.spawnRealmEnemy(clamp(enemy.x+Math.cos(a)*3,-ARENA_LIMIT+1,ARENA_LIMIT-1),clamp(enemy.z+Math.sin(a)*3,-ARENA_LIMIT+1,ARENA_LIMIT-1));}}
          enemy.action='attack';enemy.actionAge=0;enemy.attackTimer=Math.max(1.25,3.4-enemy.stage*.4);
        }
        return;
      }
      enemy.attackTimer-=dt;enemy.action=enemy.actionAge<.3?'attack':'walk';
      if(enemy.attackTimer<=0){
        enemy.intent=spec.patterns[(enemy.attackCycle||0)%spec.patterns.length];enemy.attackCycle=(enemy.attackCycle||0)+1;enemy.windup=Math.max(.6,1.1-enemy.stage*.1);enemy.actionAge=0;enemy.targetX=p.x;enemy.targetZ=p.z;
        if(enemy.intent==='slam'){this.addHazard(p.x,p.z,3.2,enemy.windup,enemy.damage);if(enemy.stage>1)for(let i=0;i<enemy.stage;i++)this.addHazard(p.x+(this.random()-.5)*10,p.z+(this.random()-.5)*10,2.5,enemy.windup,enemy.damage);}
        if(enemy.intent==='charge'){const a=Math.atan2(p.z-enemy.z,p.x-enemy.x);for(let i=1;i<=6;i++)this.addHazard(clamp(enemy.x+Math.cos(a)*i*2.2,-ARENA_LIMIT+1,ARENA_LIMIT-1),clamp(enemy.z+Math.sin(a)*i*2.2,-ARENA_LIMIT+1,ARENA_LIMIT-1),.9,enemy.windup,enemy.damage*.75);}
        this.emit('warning',{x:enemy.x,z:enemy.z,kind:enemy.intent});return;
      }
      const d=Math.max(.01,distance(enemy,p)),desired=enemy.bossId==='colgera'||enemy.bossId==='helmaroc'?5:2;
      if(d>desired){enemy.x+=(p.x-enemy.x)/d*enemy.speed*dt;enemy.z+=(p.z-enemy.z)/d*enemy.speed*dt;}
    }
    weaponStats(id,rank=this.rank(id),rarity=0) {
      const base=Combat.ATTACKS[id];if(!base)return null;
      const r=Math.max(1,rank),history=(this.weaponUpgrades[id]||[]).slice(0,r-1);while(history.length<r-1)history.push(history.length<this.rank(id)-1?0:rarity);
      const growth=Combat.upgradeGrowth(id,history);
      return{damage:base.damage*growth.damage*(1+(r-1)*.04)*this.damageMultiplier,count:base.count+growth.count,cooldown:base.cooldown*growth.cooldown*this.cooldownMultiplier,radius:base.radius*growth.area,speed:base.speed*growth.speed,duration:base.duration*growth.duration,pierce:base.pierce+growth.pierce,bounce:growth.bounce,critical:growth.critical,status:growth.status,homing:!!base.homing};
    }
    upgradeSummary(id) {
      const rank=this.rank(id),before=this.weaponStats(id,rank),after=this.weaponStats(id,rank+1,this.choices.find(choice=>choice.id===id)?.rarity||0);
      if(!after)return UPGRADES.find(u=>u.id===id)?.desc||'Restore all health.';
      const multiplier=this.stats[Combat.WEAPONS[id]]||1,damage=Math.round(after.damage*multiplier),first=rank?Math.round(before.damage*multiplier)+' → '+damage:String(damage);
      const details=['Damage '+first,after.count+(id==='orbit'?' relics':' shots'),after.cooldown.toFixed(2)+'s'];
      for(const [key,label,format]of [['pierce','pierce',value=>value],['bounce','bounces',value=>value],['speed','speed',value=>value.toFixed(1)],['radius','radius',value=>value.toFixed(1)],['duration','duration',value=>value.toFixed(1)+'s'],['critical','crit bonus',value=>Math.round(value*100)+'%']])if(rank&&Math.abs(after[key]-before[key])>.00001)details.push(label+' '+format(before[key])+' → '+format(after[key]));
      return details.join(' · ');
    }
    weaponSummary(id){
      const stats=this.weaponStats(id);if(!stats)return '';
      return 'Damage '+Math.round(stats.damage*(this.stats[Combat.WEAPONS[id]]||1))+' · '+stats.count+(id==='orbit'?' relics':' shots')+' · '+stats.cooldown.toFixed(2)+'s'+(id==='nova'||id==='bomb'||id==='orbit'?' · radius '+stats.radius.toFixed(1):'')+(id==='orbit'?' · active '+stats.duration.toFixed(1)+'s':'')+(stats.pierce&&stats.pierce<99?' · '+stats.pierce+' pierce':'')+(stats.bounce?' · '+stats.bounce+' bounces':'')+(stats.critical?' · +'+Math.round(stats.critical*100)+'% crit':'');
    }
    explode(projectile) {
      if(projectile.exploded)return;projectile.exploded=true;projectile.type='bomb';
      this.emit('explosion',{x:projectile.x,z:projectile.z,radius:projectile.blastRadius||3,color:'#f0b46d'});
      for(const enemy of this.enemies)if(distance(enemy,projectile)<(projectile.blastRadius||3)+enemy.radius)this.hitProjectile(enemy,projectile,5);
    }
    get canCheckpoint(){return this.mode!=='training'&&['running','paused','upgrade'].includes(this.state)&&this.player.hp>0&&!this.boss;}
    checkpoint(){
      if(!this.canCheckpoint)return null;
      return {version:2,adventureDelay:this.adventureDelay,buildVersion:1,legacySlots:{...this.legacySlots},weaponUpgrades:Object.fromEntries(Object.keys(Combat.WEAPONS).filter(id=>this.rank(id)).map(id=>[id,[...(this.weaponUpgrades[id]||Array(this.rank(id)-1).fill(0))]])),choiceRarities:Object.fromEntries((this.state==='upgrade'?this.choices:[]).map(choice=>[choice.id,choice.rarity??0])),combatVersion:1,gear:{...this.gear},pendingLoot:this.loot.map(drop=>drop.gearId),damageBySource:{...this.damageBySource},criticalHits:this.criticalHits,megaCriticalHits:this.megaCriticalHits,reactions:this.reactions,runId:this.runId,hero:this.hero,mode:this.mode,difficulty:this.difficulty,state:this.state,choices:this.state==='upgrade'?this.choices.map(choice=>choice.id):[],permanent:{...this.permanent},realmStages:[...this.realmStages],stageKills:[...this.stageKills],realm:this.realm,time:this.time,level:this.level,xp:this.xp+this.shards.reduce((n,s)=>n+s.value,0)*this.stats.xpGain,ranks:{...this.ranks},healthFraction:this.player.hp/this.player.maxHp,energy:this.energy,kills:this.kills,damageDealt:this.damageDealt,damageTaken:this.damageTaken,shrines:[...this.shrines],visited:[...this.visited],refreshes:this.refreshes,skips:this.skips,banishes:this.banishes,banished:[...this.banished],revision:this.checkpointRevision};
    }
    static fromCheckpoint(raw){
      const validNumber=(value,min,max,integer=false)=>Number.isFinite(value)&&value>=min&&value<=max&&(!integer||Number.isInteger(value));
      if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==2||!Object.hasOwn(HEROES,raw.hero)||!['adventure','survival'].includes(raw.mode)||!['normal','hard'].includes(raw.difficulty)||typeof raw.runId!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(raw.runId))throw new Error('Invalid adventure checkpoint.');
      for(const [key,min,max,integer]of [['realm',0,REALMS.length-1,true],['time',0,7200,false],['level',1,500,true],['xp',0,1e7,false],['healthFraction',.0001,1,false],['energy',0,100,false],['kills',0,1e6,true],['refreshes',0,2,true],['skips',0,2,true],['banishes',0,1,true]])if(!validNumber(raw[key],min,max,integer))throw new Error('Invalid checkpoint '+key+'.');
      const indices=value=>Array.isArray(value)&&value.length<=REALMS.length&&new Set(value).size===value.length&&value.every(v=>validNumber(v,0,REALMS.length-1,true));
      if(!indices(raw.shrines)||!indices(raw.visited)||!raw.visited.includes(raw.realm)||!raw.ranks||typeof raw.ranks!=='object'||Array.isArray(raw.ranks)||!Array.isArray(raw.banished)||raw.banished.length>1||raw.banished.some(id=>!UPGRADES.some(u=>u.id===id)))throw new Error('Invalid checkpoint collection.');
      const game=new Game(raw.hero,Date.now(),{mode:raw.mode,difficulty:raw.difficulty,upgrades:raw.permanent,runId:raw.runId});
      if(raw.adventureDelay!==undefined){if(!validNumber(raw.adventureDelay,0,2))throw new Error('Invalid saved encounter transition.');game.adventureDelay=raw.adventureDelay;}
      game.shrines=new Set(raw.shrines);if(raw.gear!==undefined)game.gear=Combat.validateGear(raw.gear);
      if(Object.keys(raw.ranks).some(id=>!UPGRADES.some(item=>item.id===id)))throw new Error('Invalid checkpoint rank.');
      game.ranks={};for(const upgrade of UPGRADES){const value=raw.ranks[upgrade.id]??0;if(!validNumber(value,0,game.rankLimit(upgrade.id),true))throw new Error('Invalid checkpoint rank.');if(value)game.ranks[upgrade.id]=value;}
      if(raw.buildVersion!==undefined&&raw.buildVersion!==1)throw new Error('Unsupported saved build version.');
      if(raw.buildVersion===1){if(!raw.legacySlots||!validNumber(raw.legacySlots.weapons,0,6,true)||!validNumber(raw.legacySlots.charms,0,6,true))throw new Error('Invalid legacy slot capacity.');game.legacySlots={...raw.legacySlots};}
      else for(const [key,category]of[['weapons','WEAPON'],['charms','CHARM']]){const owned=game.slotCount(category),pending=raw.state==='upgrade'&&Array.isArray(raw.choices)&&raw.choices.some(id=>UPGRADES.some(item=>item.id===id&&item.category===category&&!game.learnedRank(id)));game.legacySlots[key]=Math.min(6,owned+(pending?1:0));}
      if(game.slotCount('WEAPON')>game.weaponSlots||game.slotCount('CHARM')>game.charmSlots)throw new Error('Saved equipment exceeds its slot capacity.');
      if(raw.weaponUpgrades!==undefined&&(!raw.weaponUpgrades||typeof raw.weaponUpgrades!=='object'||Array.isArray(raw.weaponUpgrades)||Object.keys(raw.weaponUpgrades).some(id=>!Object.hasOwn(Combat.WEAPONS,id)||!game.rank(id))))throw new Error('Invalid saved weapon upgrades.');
      for(const id of Object.keys(Combat.WEAPONS))if(game.rank(id)){
        const history=raw.weaponUpgrades?.[id]??Array(game.rank(id)-1).fill(0);
        if(!Array.isArray(history)||history.length!==game.rank(id)-1||history.some(value=>!validNumber(value,0,4,true)))throw new Error('Invalid saved weapon rarity history.');
        game.weaponUpgrades[id]=[...history];
      }
      if(raw.choiceRarities!==undefined&&(!raw.choiceRarities||typeof raw.choiceRarities!=='object'||Array.isArray(raw.choiceRarities)||Object.entries(raw.choiceRarities).some(([id,value])=>!raw.choices?.includes(id)||!validNumber(value,0,4,true))))throw new Error('Invalid saved choice rarity.');
      if(raw.realmStages!==undefined&&(!Array.isArray(raw.realmStages)||raw.realmStages.length!==REALMS.length||raw.realmStages.some(value=>!validNumber(value,1,3,true))))throw new Error('Invalid saved map levels.');
      if(raw.stageKills!==undefined&&(!Array.isArray(raw.stageKills)||raw.stageKills.length!==REALMS.length||raw.stageKills.some(value=>!validNumber(value,0,1000000,true))))throw new Error('Invalid saved level progress.');
      game.realmStages=raw.realmStages?[...raw.realmStages]:REALMS.map((_,i)=>raw.shrines.includes(i)?3:1);game.stageKills=raw.stageKills?[...raw.stageKills]:REALMS.map(()=>0);
      if(raw.shrines.some(index=>game.realmStages[index]!==3))throw new Error('A saved seal requires level three.');
      game.realm=raw.realm;game.time=raw.time;game.level=raw.level;game.xp=raw.xp;game.xpNeed=xpForLevel(raw.level);game.shrines=new Set(raw.shrines);game.visited=new Set(raw.visited);
      if(raw.combatVersion!==undefined&&raw.combatVersion!==1)throw new Error('Unsupported saved combat version.');
      if(raw.pendingLoot!==undefined){
        if(!Array.isArray(raw.pendingLoot)||raw.pendingLoot.length>12||raw.pendingLoot.some(id=>!Combat.item(id)))throw new Error('Invalid saved loot.');
        game.loot=raw.pendingLoot.map((gearId,i)=>({id:game.nextId++,gearId,x:Math.cos(i*2.4)*2,z:Math.sin(i*2.4)*2}));
      }
      if(raw.damageBySource!==undefined){
        const allowed=new Set([...Object.keys(Combat.WEAPONS),...Combat.GEAR.map(item=>item.id),'ultimate','shrine','reaction','thorns','other']);
        if(!raw.damageBySource||typeof raw.damageBySource!=='object'||Array.isArray(raw.damageBySource)||Object.entries(raw.damageBySource).some(([key,value])=>!allowed.has(key)||!validNumber(value,0,1e12)))throw new Error('Invalid saved damage data.');
        game.damageBySource={...raw.damageBySource};
      }
      for(const key of ['criticalHits','megaCriticalHits','reactions'])if(raw[key]!==undefined){if(!validNumber(raw[key],0,1e9,true))throw new Error('Invalid saved combat count.');game[key]=raw[key];}
      game.refreshStats();game.player.hp=raw.healthFraction*game.player.maxHp;game.player.invincible=2;
      game.energy=raw.energy;game.kills=raw.kills;game.damageDealt=validNumber(raw.damageDealt,0,1e10)?raw.damageDealt:0;game.damageTaken=validNumber(raw.damageTaken,0,1e8)?raw.damageTaken:0;
      game.refreshes=raw.refreshes;game.skips=raw.skips;game.banishes=raw.banishes;game.banished=new Set(raw.banished);game.checkpointRevision=Number.isInteger(raw.revision)?Math.max(1,raw.revision):1;game.eliteMinute=Math.floor(game.time/60);game.spawnTimer=1.5;
      if(raw.state==='upgrade'){
        if(!Array.isArray(raw.choices)||raw.choices.length<1||raw.choices.length>3||new Set(raw.choices).size!==raw.choices.length||raw.choices.some(id=>id!=='feast'&&!game.canOffer(UPGRADES.find(item=>item.id===id))))throw new Error('Invalid saved upgrade choices.');
        game.state='upgrade';game.choices=raw.choices.map(id=>({...id==='feast'?{id:'feast',name:'Red Potion',category:'RESTORE',icon:'plus',desc:'Restore all health.',max:Infinity}:UPGRADES.find(item=>item.id===id),rarity:raw.choiceRarities?.[id]??0}));
      }else game.checkLevel();game.alignAdventure();return game;
    }

    emit(type, data = {}) {
      if(this.events.length>=300){
        const important=['end','guardian','boss','travel','level','shrine','bossPhase','stage','stageClear'];
        if(!important.includes(type))return;
        const discard=this.events.findIndex(event=>!important.includes(event.type));this.events.splice(discard<0?0:discard,1);
      }
      this.events.push({type,...data});
    }
    drainEvents() { const out = this.events; this.events = []; return out; }
    rank(id) { return this.ranks[id] || 0; }
    get damageMultiplier() { return HEROES[this.hero].damage * (1 + this.rank('power') * .18) * (1+this.permanent.power*.05); }
    get cooldownMultiplier() { return Math.pow(.9, this.rank('haste'))/this.stats.attackSpeed; }
    get magnetRadius() { return 2.3 * (1 + this.rank('magnet') * .45) * (1+this.permanent.magnet*.12)+this.stats.pickupRange; }
    pause() { if (this.state === 'running') this.state = 'paused'; }
    resume() { if (this.state === 'paused') this.state = 'running'; }
    dash() {
      const p = this.player;
      if (this.state !== 'running' || p.dashCooldown > 0) return false;
      this.setAction('dash',.25);p.dash = .22; p.invincible = Math.max(p.invincible, .38); p.dashCooldown = 3.1;
      this.emit('dash', { x: p.x, z: p.z }); return true;
    }
    jump() { const p = this.player; if (this.state !== 'running' || p.y > .01) return false; p.vy = 9; p.y = .02; this.setAction('jump',.4);this.emit('jump'); return true; }
    ultimate() {
      if(this.state!=='running'||this.energy<100)return false;
      this.energy=0;const hero=HEROES[this.hero],p=this.player,radius=hero.ultimateRadius;
      this.setAction('ultimate',1.05);p.invincible=Math.max(p.invincible,hero.ultimateShield||1.2);
      if(hero.ultimateHeal)this.heal(hero.ultimateHeal);
      this.emit('ultimate',{x:p.x,z:p.z,radius,hero:this.hero,name:hero.ultimateName,color:hero.ultimateColor});
      for(const enemy of this.enemies)if(distance(enemy,p)<radius+enemy.radius)this.hitEnemy(enemy,hero.ultimateDamage*this.damageMultiplier,'ultimate',8);
      return true;
    }

    toggleAim() { if (this.state !== 'running') return; this.aimMode = this.aimMode === 'auto' ? 'manual' : 'auto'; this.lockedTarget = null; }
    lockTarget() {
      if (this.state !== 'running') return false;
      if (this.lockedTarget !== null) { this.lockedTarget = null; return false; }
      const enemy = this.nearest(24); this.lockedTarget = enemy ? enemy.id : null; return !!enemy;
    }
    attackTarget(range) {
      if (this.lockedTarget !== null) {
        const locked = this.enemies.find(e => e.id === this.lockedTarget && !e.dead && distance(e, this.player) <= range);
        if (locked) return locked;
        this.lockedTarget = null;
      }
      if (this.aimMode === 'auto') return this.nearest(range);
      return { x: this.player.x - Math.sin(this.cameraYaw) * range, z: this.player.z - Math.cos(this.cameraYaw) * range, id: null };
    }
    travel(destination) {
      if (this.state !== 'running' || this.travelBlockedReason || !REALMS[this.realm].links.includes(destination)) return false;
      return this.enterRealm(destination);
    }
    enterRealm(destination) {
      if(this.state!=='running'||!Number.isInteger(destination)||!REALMS[destination])return false;
      this.bankLoot();this.realm = destination; this.visited.add(destination); this.travelCooldown = 5;
      this.player.x = 0; this.player.z = 0; this.player.y = 0;this.player.ground=0; this.player.vy = 0; this.player.invincible = 2;
      this.enemies = this.enemies.filter(e => e.type === 'boss' && !e.dead);
      if (this.boss && !this.boss.dead) { this.boss.x = 12; this.boss.z = -12; }
      // Shards travel with the player; they cannot be duplicated or lost at a gate.
      const banked = this.shards.reduce((sum, s) => sum + s.value, 0); this.shards = [];
      this.projectiles = []; this.hazards = []; this.shrineCharge = 0; this.lockedTarget = null;
      this.checkpointRevision++;this.emit('travel', { realm: destination }); if (banked) this.collect(banked); return true;
    }
    get interaction(){
      if(Math.hypot(this.player.x,this.player.z+7)<3.4){
        if(this.mode==='adventure'&&!this.boss){
          if(this.adventureTransition)return null;
          if(!this.shrines.has(this.realm)&&this.stage<3)return{kind:'stage',name:this.stageReady?'Enter '+REALMS[this.realm].number+'-'+(this.stage+1):'Defeat '+Math.max(0,this.stageTarget-this.stageKills[this.realm])+' more enemies',blockedReason:this.stageReady?'':'Clear this level’s enemy wave first.'};
          if(!this.shrines.has(this.realm))return{kind:'stage',name:'Defeat '+Math.max(0,this.stageTarget-this.stageKills[this.realm])+' more enemies',blockedReason:'Clear level '+this.stageLabel+' before the final boss.'};
        }else if(this.mode==='survival'&&!this.shrines.has(this.realm))return{kind:'shrine',name:REALMS[this.realm].blessing};
      }
      for(let i=0;i<GATES.length;i++)if(distance(this.player,GATES[i])<3.5)return{kind:'gate',destination:REALMS[this.realm].links[i],name:REALMS[REALMS[this.realm].links[i]].name,blockedReason:this.travelBlockedReason};
      return null;
    }
    interact(){
      if(this.state!=='running')return false;const nearby=this.interaction;if(!nearby)return false;
      if(nearby.kind==='gate')return this.travel(nearby.destination);
      if(nearby.kind==='stage')return this.advanceStage();
      return this.activateShrine();
    }

    spawnEnemy(type, x, z, elite = false) {
      const species=ENEMIES[type]?type:null;if(species)type=ENEMIES[species].type;
      if (this.enemies.length >= 170 && type !== 'boss') return null;
      if (x === undefined) { const a = this.random() * TAU, r = 20 + this.random() * 7; x = this.player.x + Math.cos(a) * r; z = this.player.z + Math.sin(a) * r; }
      const specs = { slime: [17, 1.65, .6, 10], mushroom: [29, 1.3, .7, 14], bat: [12, 2.85, .48, 9], boar: [48, 2.05, .85, 17], boss: [2900, 1.3, 2.1, 26] };
      if(!specs[type])throw new Error('Unknown enemy.');
      const [baseHp, speed, radius, damage] = specs[type];
      if(type!=='boss'){x=clamp(x,-ARENA_LIMIT+1,ARENA_LIMIT-1);z=clamp(z,-ARENA_LIMIT+1,ARENA_LIMIT-1);}
      const scale = (type === 'boss' ? 1 : this.mode==='adventure'?1+this.shrines.size*.12:Math.min(3.5,1+this.time/170))*(this.difficulty==='hard'?1.35:1)*(type!=='boss'&&this.mode==='adventure'?1+(this.stage-1)*.2:1)*(type!=='boss'&&this.mode!=='training'?1.05:1);
      const enemy = { id: this.nextId++, type, x, z, hp: baseHp * scale * (elite ? 3 : 1), maxHp: baseHp * scale * (elite ? 3 : 1), speed: speed + (type === 'boss' ? 0 : this.time / 650), radius: radius * (elite ? 1.3 : 1), damage, elite, hitFlash: 0, orbitHit: 0, attackTimer: 3, phase: 0, dead: false, knockX: 0, knockZ: 0 };
      enemy.enemyId=species||({slime:'chuchu',mushroom:'deku_baba',bat:'keese',boar:'bokoblin'})[type];enemy.name=ENEMIES[enemy.enemyId]?.name||'Enemy';enemy.realm=this.realm;enemy.mapStage=this.stage;
      enemy.action='walk';enemy.actionAge=0;enemy.windup=0;enemy.damage*=this.difficulty==='hard'?1.25:1;
      if(type!=='boss'&&this.mode!=='training')enemy.speed*=1.05;
      if(type==='boss')Object.assign(enemy,{bossId:'phantom',name:BOSSES.phantom.name,stage:1,attackCycle:0,final:true,realm:this.realm,chargeTimer:0});
      this.enemies.push(enemy); if (type === 'boss') this.boss = enemy;
      return enemy;
    }
    nearest(range = 30) {
      let best = null, near = range;
      for (const e of this.enemies) { if (e.dead) continue; const d = distance(e, this.player); if (d < near) { near = d; best = e; } }
      return best;
    }
    hurtEnemy(e, damage, knock = 0, context={}) {
      if (e.dead || this.state !== 'running'||!Number.isFinite(damage)||damage<=0) return 0;
      if(e.type==='boss'&&e.bossId==='gohma'&&e.windup>0)damage*=1.3;
      if(e.type==='boss')knock*=.12;
      const dealt = Math.min(e.hp, damage); e.hp -= damage; e.hitFlash = .1; this.damageDealt += dealt;
      const source=context.source||'other';this.damageBySource[source]=(this.damageBySource[source]||0)+dealt;
      if (knock) { const d = Math.max(.01, distance(e, this.player)); e.knockX += (e.x - this.player.x) / d * knock; e.knockZ += (e.z - this.player.z) / d * knock; }
      this.emit('hit', { x: e.x, z: e.z, damage: Math.round(dealt), critical:context.critical||0, boss: e.type === 'boss' });
      if (e.hp <= 0) {
        e.dead = true; this.kills++; this.streak++; this.streakTimer = 4; this.bestStreak = Math.max(this.bestStreak, this.streak); this.energy = Math.min(100, this.energy + (e.elite ? 12 : 3)*(1+this.permanent.magic*.08)); this.emit('pop', { id:e.id,x: e.x, z: e.z, enemyType: e.type, enemyId:e.enemyId,bossId:e.bossId,elite: e.elite });
        if(e.type==='boss'){
          this.enemies=this.enemies.filter(enemy=>!enemy.dead);
          if(this.mode==='training'){this.boss=null;this.bossSpawned=false;return dealt;}
          if(this.mode==='adventure'&&!e.final){this.boss=null;this.bossSpawned=false;this.activateShrine(e.realm);this.heal(30);this.dropGear(e.x,e.z,2);this.adventureDelay=1.8;this.emit('guardian',{id:e.bossId,realm:e.realm,name:e.name,nextRealm:this.nextAdventureRealm??0});this.collect(18+this.shrines.size*9);return dealt;}
          this.state='won';this.setAction('victory',1.2);this.emit('end',{won:true});return dealt;
        }
        if(this.mode==='adventure'&&!this.shrines.has(this.realm)&&!this.stageReady&&e.realm===this.realm&&e.mapStage===this.stage){
          this.stageKills[this.realm]++;this.checkpointRevision++;
          if(this.stageReady){if(this.stage===3)this.adventureDelay=1.4;this.emit('stageClear',{realm:this.realm,stage:this.stage,label:this.stageLabel});}
        }
        this.shards.push({ id: this.nextId++, x: e.x, z: e.z, value: e.elite ? 18 : e.type === 'boar' ? 4 : 2 });
        // Preserve XP when the player leaves shards behind for a long run.
        if (this.shards.length > 350) { const first = this.shards.shift(); let near = this.shards[0]; for (const s of this.shards) if (distance(s, first) < distance(near, first)) near = s; near.value += first.value; }
        if(e.elite||this.kills%20===0)this.dropGear(e.x,e.z,e.elite?1:0);
        if (this.random() < .025 && this.player.hp < this.player.maxHp) { this.heal(5); this.emit('heal', { amount: 5 }); }
      }
      return dealt;
    }
    hurtPlayer(damage,attacker=null) {
      const p = this.player;
      if (p.invincible > 0 || this.state !== 'running'||this.mode==='training'&&this.training.invulnerable||!Number.isFinite(damage)||damage<=0) return;
      if(this.stats.evasion&&this.random()<this.stats.evasion){p.invincible=.15;this.emit('evade',{x:p.x,z:p.z});return;}
      damage*=(1-this.permanent.armor*.04)*100/(100+this.stats.armor);
      p.hp = Math.max(0, p.hp - damage);this.setAction('hurt',.38); p.invincible = .8; this.damageTaken += damage; this.emit('hurt', { damage });
      if (p.hp === 0) { this.setAction('death',1.2);this.state = 'lost'; this.emit('end', { won: false }); }
      else if(attacker&&!attacker.dead&&this.stats.thorns)this.hitEnemy(attacker,this.stats.thorns,'thorns',0,true);
    }
    collect(amount) { if(this.mode==='training'||!Number.isFinite(amount)||amount<=0)return;this.xp += amount*this.stats.xpGain; this.checkLevel(); }
    checkLevel() {
      if (this.xp >= this.xpNeed && this.state === 'running') {
        this.xp -= this.xpNeed; this.level++; this.xpNeed = xpForLevel(this.level);
        this.state = 'upgrade'; this.choices = this.rollUpgrades(); this.checkpointRevision++; this.emit('level', { level: this.level });
      }
    }
    rollUpgrades() {
      const pool = UPGRADES.filter(u => this.canOffer(u));
      if (!pool.length) return [{ id: 'feast', name: 'Red Potion', category: 'RESTORE', icon: 'plus', desc: 'Restore all health.', max: Infinity }];
      const picks = [];
      // Always offer one available weapon so a run can grow into a build.
      const weapons = pool.filter(u => u.category === 'WEAPON');
      if (weapons.length) picks.push(weapons[Math.floor(this.random() * weapons.length)]);
      while (picks.length < Math.min(3, pool.length)) {
        const available = pool.filter(u => !picks.includes(u)); picks.push(available[Math.floor(this.random() * available.length)]);
      }
      return picks.map(item=>({...item,rarity:item.category==='WEAPON'&&this.rank(item.id)>0?this.rollRarity():0}));
    }
    rollRarity(){
      let roll=this.random()*Combat.RARITIES.reduce((sum,item)=>sum+item.weight,0);
      for(let i=0;i<Combat.RARITIES.length;i++){roll-=Combat.RARITIES[i].weight;if(roll<0)return i;}return 0;
    }
    refreshChoices() {
      if (this.state !== 'upgrade' || this.refreshes <= 0) return false;
      this.refreshes--; this.choices = this.rollUpgrades(); this.checkpointRevision++; return true;
    }
    skipUpgrade() {
      if (this.state !== 'upgrade' || this.skips <= 0) return false;
      this.skips--; this.choices = []; this.state = 'running'; this.checkpointRevision++; this.checkLevel(); return true;
    }
    banishChoice(id) {
      if (this.state !== 'upgrade' || this.banishes <= 0 || !this.choices.some(u => u.id === id) || id === 'feast') return false;
      this.banishes--; this.banished.add(id); this.choices = this.rollUpgrades(); this.checkpointRevision++; return true;
    }
    choose(id) {
      if (this.state !== 'upgrade' || !this.choices.some(u => u.id === id)||(id!=='feast'&&!this.canOffer(UPGRADES.find(item=>item.id===id)))) return false;
      if (id === 'feast') this.player.hp = this.player.maxHp;
      else {
        if(Combat.WEAPONS[id]&&this.rank(id)>0){const history=this.weaponUpgrades[id]||(this.weaponUpgrades[id]=Array(this.rank(id)-1).fill(0));history.push(this.choices.find(item=>item.id===id).rarity??0);}
        this.ranks[id] = this.rank(id) + 1;
      }
      if (id === 'vitality') { const hp=this.player.hp;this.refreshStats();this.player.hp=hp;this.heal(35); }
      this.choices = []; this.state = 'running'; this.checkpointRevision++; this.emit('choose', { id }); this.checkLevel(); return true;
    }
    fire(type,target,angleOffset=0) {
      if(this.projectiles.length>=300)return;
      const p=this.player,stats=this.weaponStats(type),angle=Math.atan2(target.z-p.z,target.x-p.x)+angleOffset;
      const y=p.y+(p.ground||0)+1,vy=(this.groundAt(target.x,target.z)+1-y)/Math.max(1,distance(p,target));
      this.projectiles.push({id:this.nextId++,actorId:this.actorId||null,type,x:p.x,z:p.z,y,vy,vx:Math.cos(angle),vz:Math.sin(angle),life:stats.duration,duration:stats.duration,age:0,speed:stats.speed*this.stats.projectileSpeed,damage:stats.damage,radius:type==='bomb'?.3:stats.radius,blastRadius:type==='bomb'?stats.radius:0,pierce:stats.pierce,bounce:stats.bounce,homing:stats.homing,hits:new Set(),targetId:target.id,returning:false});
      this.setAction(type==='leaf'||type==='bomb'?'cast':'attack',.42);this.player.attackKind=type;
    }
    updateWeapons(dt) {
      for(const id of Object.keys(Combat.WEAPONS))this.cooldowns[id]-=dt;
      const target=this.attackTarget(26),p=this.player;
      for(const id of ['ember','leaf','bomb','boomerang'])if(target&&this.rank(id)&&this.cooldowns[id]<=0){
        const stats=this.weaponStats(id);
        for(let i=0;i<stats.count;i++)this.fire(id,target,(i-(stats.count-1)/2)*(id==='leaf'?.19:.16));
        this.cooldowns[id]=stats.cooldown;this.emit(id==='ember'?'shoot':id,{x:p.x,z:p.z});
      }
      if(this.rank('nova')&&this.cooldowns.nova<=0){const stats=this.weaponStats('nova');if(this.nearest(stats.radius+1)){
        this.setAction('cast',.65);this.player.attackKind='nova';this.emit('nova',{x:p.x,z:p.z,radius:stats.radius,color:'#f2bb78'});
        for(const enemy of this.enemies)if(distance(p,enemy)<stats.radius+enemy.radius)this.hitEnemy(enemy,stats.damage,'nova',4);
        this.cooldowns.nova=stats.cooldown;
      }}
      this.orbitActive=Math.max(0,this.orbitActive-dt);
      if(this.rank('orbit')){const stats=this.weaponStats('orbit');this.orbitAngle+=dt*stats.speed;
      if(this.cooldowns.orbit<=0){this.orbitActive=stats.duration;this.cooldowns.orbit=stats.cooldown;}
      for(const enemy of this.enemies){
        const key=this.actorId||'solo';enemy.orbitHits=enemy.orbitHits||{};enemy.orbitHits[key]=(enemy.orbitHits[key]||0)-dt;if(enemy.dead||enemy.orbitHits[key]>0)continue;
        if(this.orbitActive<=0)continue;
        for(let i=0;i<stats.count;i++){const angle=this.orbitAngle+i*TAU/stats.count,rock={x:p.x+Math.cos(angle)*stats.radius,z:p.z+Math.sin(angle)*stats.radius};
          if(distance(enemy,rock)<enemy.radius+.5){this.hitEnemy(enemy,stats.damage,'orbit',2.5);enemy.orbitHits[key]=.5;break;}
        }
      }}
    }

    updatePlayer(dt, input = { x: 0, y: 0 }) {
      const p = this.player;
      p.actionTime=Math.max(0,p.actionTime-dt);p.actionAge+=dt;
      if(p.actionTime===0)p.action=p.y>0?(p.gliding?'glide':'jump'):p.dash>0?'dash':Math.hypot(input.x||0,input.y||0)>.05?'walk':'idle';
      this.energy = Math.min(100, this.energy + dt * .75*(1+this.permanent.magic*.08));
      this.streakTimer = Math.max(0, this.streakTimer - dt); if (!this.streakTimer) this.streak = 0;
      this.cameraYaw = Number.isFinite(input.cameraYaw) ? input.cameraYaw : this.cameraYaw;
      p.gliding = p.y > .1 && p.vy < 0 && !!input.glide && p.stamina > 0;
      if (p.y > 0) { p.vy -= (p.gliding ? 4 : 23) * dt; if (p.gliding) { p.vy = Math.max(p.vy, -.9); p.stamina = Math.max(0, p.stamina - dt * .38); } p.y += p.vy * dt; if (p.y <= 0) { p.y = 0; p.vy = 0; p.gliding = false; } }
      else p.stamina = Math.min(1, p.stamina + dt * .65);
      p.invincible = Math.max(0, p.invincible - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt);
      const ix = Number.isFinite(input.x) ? input.x : 0, iy = Number.isFinite(input.y) ? input.y : 0;
      const len = Math.max(1, Math.hypot(ix, iy)), mx = ix / len, my = iy / len;
      let dx = mx * Math.cos(this.cameraYaw) - my * Math.sin(this.cameraYaw), dz = -mx * Math.sin(this.cameraYaw) - my * Math.cos(this.cameraYaw);
      if (Math.hypot(dx, dz) > .05) { p.dx = dx; p.dz = dz; p.facing = Math.atan2(dx, dz); }
      if (p.dash > 0) { dx = p.dx * 4.2; dz = p.dz * 4.2; p.dash = Math.max(0, p.dash - dt); }
      const speed = p.speed * (1 + this.rank('speed') * .1) * this.stats.moveSpeed * (p.gliding ? 1.3 : 1);
      const moved=this.flatTerrain?{x:clamp(p.x+dx*speed*dt,-ARENA_LIMIT,ARENA_LIMIT),z:clamp(p.z+dz*speed*dt,-ARENA_LIMIT,ARENA_LIMIT),ground:0}:Terrain.resolve(this.realm,this.stage,p.x,p.z,p.x+dx*speed*dt,p.z+dz*speed*dt,p.y,p.radius);
      p.y=Math.max(0,p.y+(p.ground||0)-moved.ground);p.x=moved.x;p.z=moved.z;p.ground=moved.ground;
      if (this.rank('regen')||this.stats.regen) this.heal((this.rank('regen')+this.stats.regen)*dt);
    }
    step(dt,input={x:0,y:0}){
      if(this.state!=='running'||!Number.isFinite(dt)||dt<=0)return;
      dt=Math.min(dt,.05);this.time+=dt;this.travelCooldown=Math.max(0,this.travelCooldown-dt);this.updateActors(dt,input);
      if(this.progressAdventure(dt))return;
      const p=this.player;
      this.spawnTimer -= dt;
      if ((this.mode==='adventure'?!this.boss&&!this.stageReady:this.mode==='survival'&&this.time<240) && this.spawnTimer <= 0) {
        const batch = Math.min(this.mode==='adventure'?2:3,1+Math.floor(this.time/85));
        for (let i = 0; i < batch; i++) this.spawnRealmEnemy();
        this.spawnTimer = Math.max(.35, (.85 - this.time / 650-(this.mode==='adventure'?(this.stage-1)*.08:0))*.9);
      }
      const minute = Math.floor(this.time / 60);
      if (this.mode!=='training'&&!(this.mode==='adventure'&&(this.stageReady||this.boss))&&minute > this.eliteMinute && minute < 4) { this.eliteMinute = minute; const elite=this.spawnRealmEnemy(undefined,undefined,true); this.emit('elite',{name:elite?.name||'Enemy'}); }
      if(this.mode==='survival'&&this.time>=240&&!this.bossSpawned)this.spawnBoss('phantom',true);
      if (this.bossSpawned && this.spawnTimer <= 0 && this.boss && !this.boss.dead) { this.spawnRealmEnemy(); this.spawnTimer = 1.4; }
      for(const enemy of this.enemies){
        if(enemy.dead)continue;this.updateStatuses(enemy,dt);if(enemy.dead)continue;const oldX=enemy.x,oldZ=enemy.z;
        if(enemy.dummy||enemy.statuses?.freeze||enemy.statuses?.shock){enemy.hitFlash=Math.max(0,enemy.hitFlash-dt);enemy.action='idle';continue;}
        const p=this.targetFor(enemy);let d=Math.max(.01,distance(p,enemy));const towardX=(p.x-enemy.x)/d,towardZ=(p.z-enemy.z)/d;
        enemy.hitFlash=Math.max(0,enemy.hitFlash-dt);enemy.phase+=dt;if(enemy.type!=='boss')enemy.actionAge=(enemy.actionAge||0)+dt;
        if(enemy.type==='boss')this.updateBoss(enemy,dt);
        else if(enemy.type==='mushroom'&&d<17){
          enemy.attackTimer-=dt;enemy.action=enemy.attackTimer<.45?'windup':'idle';
          if(enemy.attackTimer<=0){this.enemyBolt(enemy,Math.atan2(p.z-enemy.z,p.x-enemy.x),5.5);enemy.attackTimer=2.4;enemy.action='attack';enemy.actionAge=0;}
        }else if(enemy.type==='boar'&&d<enemy.radius+p.radius+1.25){
          enemy.attackTimer-=dt;
          if(enemy.windup>0){enemy.windup=Math.max(0,enemy.windup-dt);enemy.action='windup';if(enemy.windup===0){enemy.action='attack';enemy.actionAge=0;if(d<enemy.radius+p.radius+1.1&&p.y<1.1)this.hurtPlayer(enemy.damage,enemy,p);}}
          else if(enemy.attackTimer<=0){enemy.windup=.48;enemy.attackTimer=1.6;enemy.actionAge=0;}
          else enemy.action=enemy.actionAge<.3?'attack':'idle';
        }else{
          const sway=enemy.type==='bat'?Math.sin(enemy.phase*4+enemy.id)*.55:0,hop=enemy.type==='slime'?(.65+Math.max(0,Math.sin(enemy.phase*5))*.65):1;
          enemy.x+=(towardX+(-towardZ)*sway)*enemy.speed*hop*dt;enemy.z+=(towardZ+towardX*sway)*enemy.speed*hop*dt;enemy.action='walk';
        }
        if(!this.flatTerrain&&enemy.type!=='bat'&&!BOSSES[enemy.bossId]?.flying){const next=Terrain.resolve(this.realm,this.stage,oldX,oldZ,enemy.x,enemy.z,0,enemy.radius*.7);enemy.x=next.x;enemy.z=next.z;}
        enemy.ground=this.groundAt(enemy.x,enemy.z);
        enemy.x+=enemy.knockX*dt;enemy.z+=enemy.knockZ*dt;enemy.knockX*=Math.exp(-10*dt);enemy.knockZ*=Math.exp(-10*dt);
        d=distance(p,enemy);
        if(enemy.type!=='boar'&&d<p.radius+enemy.radius&&(p.y<1.1||enemy.type==='bat'||enemy.type==='boss'))this.hurtPlayer(enemy.damage,enemy,p);
      }
      // A spatial hash separates local pairs without an all-pairs crowd cost.
      const cells = new Map();
      for (const e of this.enemies) {
        if (e.dead) continue;
        const cx = Math.floor(e.x / 2), cz = Math.floor(e.z / 2);
        for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
          const neighbors = cells.get((cx + ox) + ',' + (cz + oz)); if (!neighbors) continue;
          for (const other of neighbors) {
            if (other.type === 'boss' || e.type === 'boss') continue;
            const d = distance(e, other), min = (e.radius + other.radius) * .75;
            if (d < min && d > .001) { const push = (min - d) * .4, sx = (e.x - other.x) / d * push, sz = (e.z - other.z) / d * push; e.x += sx; e.z += sz; other.x -= sx; other.z -= sz; }
          }
        }
        const key = cx + ',' + cz; if (!cells.has(key)) cells.set(key, []); cells.get(key).push(e);
      }
      this.updateAllWeapons(dt);
      for(const projectile of this.projectiles){
        const p=this.projectileOwner(projectile);
        const previous={x:projectile.x,z:projectile.z,y:projectile.y??this.groundAt(projectile.x,projectile.z)+1};
        projectile.life-=dt;projectile.age=(projectile.age||0)+dt;
        if(projectile.type==='bomb'){
          projectile.speed*=Math.exp(-dt*1.4);projectile.x+=projectile.vx*projectile.speed*dt;projectile.z+=projectile.vz*projectile.speed*dt;
          if(projectile.life<=0)this.explode(projectile);continue;
        }
        if(projectile.type==='boomerang'&&projectile.age>(projectile.duration??1.3)*.5){
          if(!projectile.returning){projectile.returning=true;projectile.hits.clear();}
          const d=Math.max(.01,distance(projectile,p)),steer=Math.min(1,dt*10);projectile.vx+=( (p.x-projectile.x)/d-projectile.vx)*steer;projectile.vz+=( (p.z-projectile.z)/d-projectile.vz)*steer;projectile.vy+=((p.y+p.ground+1-projectile.y)/d-projectile.vy)*steer;
          if(d<.7){projectile.life=0;continue;}
        }
        if(projectile.homing){
          const target=this.enemies.find(enemy=>enemy.id===projectile.targetId&&!enemy.dead);
          if(target){const d=distance(target,projectile);if(d>.01){const steer=Math.min(1,dt*5);projectile.vx+=((target.x-projectile.x)/d-projectile.vx)*steer;projectile.vz+=((target.z-projectile.z)/d-projectile.vz)*steer;projectile.vy+=((this.groundAt(target.x,target.z)+1-projectile.y)/d-projectile.vy)*steer;const length=Math.max(.01,Math.hypot(projectile.vx,projectile.vz));projectile.vx/=length;projectile.vz/=length;}}
        }
        projectile.x+=projectile.vx*projectile.speed*dt;projectile.z+=projectile.vz*projectile.speed*dt;
        projectile.y+=(projectile.vy||0)*projectile.speed*dt;
        if(projectile.y!==undefined&&projectile.y<this.groundAt(projectile.x,projectile.z)+.08){projectile.life=0;continue;}
        if(projectile.hostile){for(const target of this.damageTargets())if(hitAlong(previous,projectile,target,projectile.radius+target.radius,target.y+(target.ground||0)+1,1.3)){this.hurtPlayer(projectile.damage,this.enemies.find(enemy=>enemy.id===projectile.ownerId),target);projectile.life=0;break;}continue;}
        for(const enemy of this.enemies){
          if(enemy.dead||projectile.hits.has(enemy.id))continue;
          if(hitAlong(previous,projectile,enemy,projectile.radius+enemy.radius,this.groundAt(enemy.x,enemy.z)+1,Math.max(1.4,enemy.radius))){
            this.hitProjectile(enemy,projectile);projectile.hits.add(enemy.id);
            if(projectile.bounce>0){
              const next=this.enemies.filter(target=>!target.dead&&!projectile.hits.has(target.id)).sort((a,b)=>distance(a,projectile)-distance(b,projectile))[0];
              if(next){const d=Math.max(.01,distance(next,projectile));projectile.bounce--;projectile.targetId=next.id;projectile.vx=(next.x-projectile.x)/d;projectile.vz=(next.z-projectile.z)/d;projectile.vy=(this.groundAt(next.x,next.z)+1-projectile.y)/d;break;}
            }
            if((projectile.pierce??0)<=0){projectile.life=0;break;}projectile.pierce--;
          }
        }
      }
      this.projectiles=this.projectiles.filter(projectile=>projectile.life>0);
      for (const h of this.hazards) { h.timer -= dt; h.life -= dt; if (h.timer <= 0 && !h.fired) { h.fired = true; this.emit('slam', { x: h.x, z: h.z }); for(const target of this.damageTargets())if (distance(target, h) < h.radius + target.radius && target.y < 1.1) this.hurtPlayer(h.damage||30,null,target); } }
      this.hazards = this.hazards.filter(h => h.life > 0);
      for (const s of this.shards) {
        const p=this.pickupTarget(s);
        const d = distance(s, p);
        if (d < this.pickupRadius(p) + .5 && d > .01) { const pull = Math.min(d, (13 + 18 / Math.max(d, .2)) * dt); s.x += (p.x - s.x) / d * pull; s.z += (p.z - s.z) / d * pull; }
        if (distance(s, p) < .65) { s.collected = true; this.collect(s.value); this.emit('collect'); }
      }
      this.shards = this.shards.filter(s => !s.collected);
      for(const drop of [...this.loot]){const target=this.pickupTarget(drop);if(distance(drop,target)<1.25)this.collectLootFor(drop,target);}
      this.enemies = this.enemies.filter(e => !e.dead);
      // Reposition distant enemies so the bounded arena stays active.
      for (const e of this.enemies) if (e.type !== 'boss' && distance(e, this.targetFor(e)) > 50) { const p=this.targetFor(e),a = this.random() * TAU; e.x = clamp(p.x + Math.cos(a) * 24,-ARENA_LIMIT+1,ARENA_LIMIT-1); e.z = clamp(p.z + Math.sin(a) * 24,-ARENA_LIMIT+1,ARENA_LIMIT-1); }
    }
  }
  return { Game, HEROES, REALMS, ADVENTURE_ROUTE, STAGE_TARGETS, GATES, UPGRADES, BOSSES, PERMANENT, ENEMIES, Terrain, Combat, ARENA_LIMIT, xpForLevel, seeded, clamp };
});
