/* ZELDABONK simulation. Rendering and browser state live in app.js. */
(function (root, factory) {
  const api = factory(typeof module==='object'&&module.exports?require('./terrain.js'):root.BonkTerrain,typeof module==='object'&&module.exports?require('./combat.js'):root.BonkCombat,typeof module==='object'&&module.exports?require('./companions.js'):root.BonkCompanions);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BonkCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Terrain, Combat, Companions) {
  'use strict';
  const TAU = Math.PI * 2;
  const ARENA_LIMIT = Terrain.LIMIT;
  const HEROES = {
    link: {name:'Link',title:'Hero of Courage',hp:100,speed:6,weapon:'ember',starterName:'Master Sword',color:'#72cfc8',perk:'Sword cut · beam at full hearts',damage:1.2,origin:'Ocarina of Time / A Link Between Worlds',canonMove:'spin',ultimateDetail:'A close 360° sword sweep.',ultimateName:'Spin Attack',ultimateColor:'#efdc83',ultimateDamage:200,ultimateRadius:5.8},
    zelda: {name:'Zelda',title:'Princess of Hyrule',hp:85,speed:7,weapon:'leaf',starterName:'Light Arrows',color:'#c6b0e1',perk:'Draw and release Light Arrows',damage:1,origin:'Breath of the Wild',canonMove:'seal',ultimateDetail:'Golden light catches and seals foes around Zelda.',ultimateName:'Sealing Power',ultimateColor:'#fff0b4',ultimateDamage:150,ultimateRadius:12,ultimateStatus:'seal'},
    midna: {name:'Midna',title:'Twilight Princess',hp:150,speed:5.1,weapon:'orbit',starterName:'Hair-Hand Strike',color:'#86c4bc',perk:'Strike with her giant orange hair-hand',damage:1,origin:'Twilight Princess',canonMove:'fused',ultimateDetail:'Transform and strike enemies in a broad forward arc.',ultimateName:'Fused Shadow Transformation',ultimateColor:'#a2e5d3',ultimateDamage:230,ultimateRadius:8.2,ultimateArc:2.55,ultimateShield:2},
    tetra: {name:'Tetra',title:'Pirate Captain',hp:100,speed:6.5,weapon:'bomb',starterName:'Cutlass',color:'#79bbd1',perk:'Quick, broad cutlass attacks',damage:1.05,origin:'The Wind Waker / Hyrule Warriors',canonMove:'waterGun',ultimateDetail:'Fire a straight water shot along your aim.',ultimateName:'Water Gun',ultimateColor:'#95e1ee',ultimateDamage:242,ultimateRadius:1.5,ultimateAim:21,unlockBoss:'helmaroc',unlockText:'Defeat the Helmaroc King'},
    sheik: {name:'Sheik',title:'Sheikah Warrior',hp:90,speed:7.2,weapon:'boomerang',starterName:'Kunai',color:'#9cafd9',perk:'Fast close-range kunai cuts',damage:1.10,origin:'Ocarina of Time / Hyrule Warriors',canonMove:'harp',ultimateDetail:'Play the harp to send a magical pulse around Sheik.',ultimateName:'Sheikah Harp',ultimateColor:'#b5d4f9',ultimateDamage:155,ultimateRadius:7,ultimateShield:2,unlockSeals:3,unlockText:'Defeat three different guardians'},
    skullkid: {name:'Skull Kid',title:'Lost Woods Trickster',hp:90,speed:6.4,weapon:'nova',starterName:'Tatl & Tael',color:'#d4a768',perk:'Directs Tatl and Tael with music',damage:1.15,origin:'Majora’s Mask / Hyrule Warriors',canonMove:'moonCrash',ultimateDetail:'Bring the grinning Moon down on a targeted area.',ultimateName:'Moon Crash',ultimateColor:'#d5a7de',ultimateDamage:260,ultimateRadius:7.1,ultimateAim:20,unlockBoss:'majora',unlockText:'Defeat Majora’s Mask'},
    impa: {name:'Impa',title:'Sage of Shadow',hp:94,speed:7.05,weapon:'leaf',starterName:'Giant Blade',color:'#aca7dd',perk:'Close cuts with the Giant Blade',damage:1.04,origin:'Ocarina of Time / Hyrule Warriors',ootAlly:true,unlockBoss:'zant',unlockText:'Defeat Zant in the Palace of Twilight',canonMove:'waterBlade',ultimateDetail:'Draw the giant blade and sweep water forward.',ultimateName:'Giant Blade Water Strike',ultimateColor:'#99c8e8',ultimateDamage:175,ultimateRadius:9.4,ultimateArc:1.6},
    saria: {name:'Saria',title:'Sage of Forest',hp:88,speed:6.65,weapon:'nova',starterName:'Fairy Slingshot (loaned)',color:'#99dc84',perk:'Borrowed Fairy Slingshot · ocarina scene',damage:1,origin:'Ocarina of Time',ootAlly:true,unlockBoss:'gohma',unlockText:'Defeat Gohma inside the Great Deku Tree',canonMove:'ocarinaSong',ultimateDetail:'Play the ocarina. A story scene, not a combat skill.',ultimateName:'Saria’s Song · Scene',ultimateColor:'#bfe791',ultimateDamage:0,ultimateRadius:0,sceneOnly:true},
    darunia: {name:'Darunia',title:'Sage of Fire',hp:146,speed:5.12,weapon:'ember',starterName:'Megaton Hammer',color:'#e6a064',perk:'Heavy front-facing hammer strikes',damage:1.07,origin:'Ocarina of Time / Hyrule Warriors',ootAlly:true,unlockBoss:'colgera',unlockText:'Defeat Colgera at the Wind Temple',canonMove:'goronSlam',ultimateDetail:'Jump, curl into a boulder, and slam the ground.',ultimateName:'Goron Body Slam',ultimateColor:'#f2a668',ultimateDamage:210,ultimateRadius:6.4,ultimateShield:1.12},
    ruto: {name:'Ruto',title:'Sage of Water',hp:97,speed:6.55,weapon:'nova',starterName:'Zora Scale',color:'#81d7e5',perk:'Sends water forward to knock back enemies',damage:1,origin:'Ocarina of Time / Hyrule Warriors',ootAlly:true,unlockBoss:'morpha',unlockText:'Defeat Morpha in the Water Temple',canonMove:'rutoSurge',ultimateDetail:'Release a forward water surge that knocks foes back.',ultimateName:'Great Water Wave',ultimateColor:'#95e1ee',ultimateDamage:159,ultimateRadius:12.4,ultimateArc:1.65,ultimateStatus:'wet'},
    nabooru: {name:'Nabooru',title:'Sage of Spirit',hp:109,speed:6.4,weapon:'ember',starterName:'Iron Knuckle Axe',color:'#eabc72',perk:'Uses the axe in her Iron Knuckle form',damage:1.06,origin:'Ocarina of Time',ootAlly:true,unlockBoss:'kingbulblin',unlockText:'Defeat King Bulblin in Hyrule Castle Courtyard',canonMove:'spiritSage',ultimateDetail:'Raise the Spirit Medallion. A story scene, not a combat skill.',ultimateName:'Sage of Spirit Awakening · Scene',ultimateColor:'#f4cc80',ultimateDamage:0,ultimateRadius:0,sceneOnly:true}
  };
  const REALMS = [
    { id: 'hyrule', name: 'Hyrule Field', subtitle: 'Where courage begins', color: '#a3c874', sky: '#d4e8d3', ground: '#88aa60', fog: '#cadfc6', accent: '#e6cc81', blessing: 'Wallet', benefit: '+45% XP collection range', gift: 'magnet', boss: 'gohma' },
    { id: 'sea', name: 'The Great Sea', subtitle: 'Follow the wind beyond the horizon', color: '#76c9c6', sky: '#cbe9e6', ground: '#d5c18c', fog: '#d1e8de', accent: '#53c7d4', blessing: 'Heart Container', benefit: '+25 maximum health. Restore 35 health.', gift: 'vitality', boss: 'helmaroc' },
    { id: 'twilight', name: 'Twilight Realm', subtitle: 'A light between two worlds', color: '#ad91ca', sky: '#555b80', ground: '#636a8d', fog: '#73728c', accent: '#f4b583', blessing: 'Power Bracelet', benefit: '+18% weapon damage', gift: 'power', boss: 'zant' },
    { id: 'skyloft', name: 'Skyloft', subtitle: 'The earth ends. The adventure does not.', color: '#abd6df', sky: '#cae6ef', ground: '#a3b97a', fog: '#e0eff0', accent: '#f4dd9b', blessing: 'Wind Waker', benefit: 'Weapons attack 10% faster', gift: 'haste', boss: 'ghirahim' },
    { id: 'depths', name: 'The Depths', subtitle: 'Follow the lightroots through the gloom', color: '#9e8bac', sky: '#39303d', ground: '#685660', fog: '#634c61', accent: '#e6e8a3', blessing: 'Fairy', benefit: 'Restore 1 health per second', gift: 'regen', boss: 'colgera' },
    { id: 'termina', name: 'Termina Field', subtitle: 'Every ending holds another beginning', color: '#b6b9de', sky: '#5a6986', ground: '#7e8f9d', fog: '#9aabc1', accent: '#e3d99e', blessing: 'Bunny Hood', benefit: '+10% movement speed', gift: 'speed', boss: 'majora' }
  ];
  REALMS.push(
    {id:'kokiri',name:'Kokiri Forest',subtitle:'The village beneath the Great Deku Tree',color:'#83bc7d',sky:'#c8e3c1',ground:'#78a65b',fog:'#afcba7',accent:'#e7d38d',blessing:'Heart Container',benefit:'+25 maximum health. Restore 35 health.',gift:'vitality',boss:'gohma'},
    // Keep "lake" and slot 7 for saved games and existing links to this arena.
    {id:'lake',name:'Zora’s Fountain',subtitle:'A cliff-ringed spring watched by Lord Jabu-Jabu',color:'#83d6e0',sky:'#c6e3e9',ground:'#8aa99d',fog:'#abcfd5',accent:'#d4efe0',blessing:'Iron Boots',benefit:'+25 maximum health. Restore 35 health.',gift:'vitality',boss:'morpha'}
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
  REALMS.forEach((realm,index)=>{realm.enemies=pools[index];realm.origin=origins[index];realm.landmark=['Hyrule Castle','Tower of the Gods','Mirror of Twilight','Statue of the Goddess','Lightroot','Clock Tower','Great Deku Tree','Lord Jabu-Jabu'][index];realm.number=[3,4,5,6,7,8,1,2][index];});
  const ADVENTURE_ROUTE=Object.freeze(REALMS.map((_,index)=>index).sort((a,b)=>REALMS[a].number-REALMS[b].number));
  // Indexed by realm ID (not campaign order), keeping old saves and routes compatible.
  const GUARDIAN_LANDMARKS=Object.freeze([
    {name:'Hyrule Castle Courtyard',subtitle:'The warlord waits beneath the castle banners',style:'fortress',ground:'#6c7361',wall:'#495245',accent:'#d5ae69',sky:'#8b9a79',limit:26,attack:'Shieldbreak Charge'},
    {name:'Forsaken Fortress',subtitle:'The tower above the pirate stronghold',style:'tower',ground:'#647574',wall:'#35454e',accent:'#cbc184',sky:'#688c9e',limit:24,attack:'Raking Dive'},
    {name:'Palace of Twilight',subtitle:'Cross the shattered throne room',style:'twilight',ground:'#58526d',wall:'#342d4b',accent:'#eaac77',sky:'#332541',limit:24,attack:'Shadow Ambush'},
    {name:'Sky Keep',subtitle:'A chamber of blades above the clouds',style:'sky',ground:'#8a8b80',wall:'#636c78',accent:'#f3cd84',sky:'#a3bac5',limit:23,attack:'Blade Lattice'},
    {name:'Wind Temple',subtitle:'From the Depths to the storm above',style:'wind',ground:'#617b85',wall:'#435866',accent:'#a5e3e7',sky:'#6e9eb0',limit:26,attack:'Cyclone Barrage'},
    {name:'Inside the Moon',subtitle:'The field beyond the Clock Tower',style:'moon',ground:'#8a9268',wall:'#5d5d69',accent:'#e7cf9d',sky:'#8387a6',limit:24,attack:'Moonfall'},
    {name:'Great Deku Tree',subtitle:'Deep inside the roots of Kokiri Forest',style:'roots',ground:'#6b6344',wall:'#463929',accent:'#d4a764',sky:'#443d28',limit:23,attack:'Falling Brood'},
    {name:'Water Temple',subtitle:'Morpha awaits in the watery sanctum',style:'water',ground:'#527782',wall:'#325769',accent:'#8fd7d5',sky:'#37677c',limit:25,attack:'Tidal Cross'}
  ].map(Object.freeze));
  const STAGE_TARGETS=Object.freeze([12,18,24]);
  const KOKIRI=6, DEKU_ENTRY_Z=18, DEKU_ARENA_THRESHOLD=10.5, SARIA_RESCUE_TIME=3.6;
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
    {id:'orbit',name:'Fused Shadow',category:'WEAPON',icon:'orbit',desc:'Midna strikes with a close shadow claw. Other heroes summon orbiting relics.',max:8,origin:'Twilight Princess'},
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
      this.realm = this.mode==='survival'?(Number.isInteger(options.realm)&&REALMS[options.realm]?options.realm:0):6; this.visited = new Set([this.realm]); this.realmStages=REALMS.map(()=>1);this.stageKills=REALMS.map(()=>0); this.shrines = new Set(); this.shrineCharge = 0;this.adventureDelay=0;this.landmarkActive=false;
      this.reviewMapClears=this.mode==='adventure'&&options.reviewMapClears===true;
      this.awaitingMapClear=false;this.mapFinishedTime=null;this.mapStart={time:0,kills:0,damageDealt:0,damageTaken:0};
      this.landmarkApproach=false;this.sariaRescue=false;
      this.energy = 25; this.streak = 0; this.streakTimer = 0; this.bestStreak = 0;
      this.aimMode = 'auto'; this.cameraYaw = Math.PI / 4; this.lockedTarget = null;
      this.refreshes = 2; this.skips = 2; this.banishes = 1; this.banished = new Set();
      this.player.maxHp+=this.permanent.heart*8;this.player.hp=this.player.maxHp;this.player.action='idle';this.player.actionTime=0;this.player.actionAge=0;this.player.attackKind=null;
    }
    get landmark(){return this.landmarkActive?GUARDIAN_LANDMARKS[this.realm]:null;}
    get companions(){return Companions.followers(this);}
    get arenaLimit(){return this.landmark?.limit??ARENA_LIMIT;}
    get kokiriStory(){return this.realm===KOKIRI&&this.mode==='adventure'&&this.reviewMapClears&&!this.player.accountId;}
    get dekuTrailReady(){return this.kokiriStory&&!this.landmarkActive&&!this.boss&&this.stage===3&&this.stageReady&&!this.shrines.has(KOKIRI);}
    resolveLandmarkMove(fromX,fromZ,toX,toZ,radius=.52){
      if(this.kokiriStory&&this.landmarkActive)return Terrain.resolveDekuEntrance(fromX,fromZ,toX,toZ,radius);
      const bound=this.arenaLimit-radius;return{x:clamp(toX,-bound,bound),z:clamp(toZ,-bound,bound),ground:0};
    }
    groundAt(x,z){return this.flatTerrain||this.landmarkActive?0:Terrain.height(this.realm,this.stage,x,z);}
    waterAt(x,z,feet){
      if(this.flatTerrain||this.landmarkActive)return null;
      return Terrain.sampleWater(this.realm,this.stage,x,z,feet);
    }
    waterMotion(hero,x,z,feet){
      if(hero==='midna'||hero==='skullkid')return null;
      const wet=this.waterAt(x,z,feet);
      if(!wet)return null;
      const strength=Math.min(1,wet.depth/.55);
      return {...wet,speed:hero==='ruto'?1.12+strength*.20:.88-strength*.105};
    }
    placeAtLandmarkEntrance(){
      Object.assign(this.player,{canonSlam:null,canonCue:null,x:0,z:this.landmarkApproach?DEKU_ENTRY_Z:9,y:0,ground:0,vy:0,gliding:false,dash:0,dx:0,dz:-1,facing:Math.PI,invincible:2});
    }
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
    hitProjectile(enemy,projectile,knock=1.2){return this.hitEnemy(enemy,projectile.damage,projectile.source||projectile.type,knock);}
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
      this.player.canonSlam=null;this.player.canonCue=null;this.player.x=0;this.player.z=0;this.player.y=0;this.player.ground=0;this.player.vy=0;this.player.hp=this.player.maxHp;this.player.invincible=0;this.player.dashCooldown=0;
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
      const bound=this.arenaLimit-1;
      const drop={id:this.nextId++,gearId:item.id,x:clamp(x,-bound,bound),z:clamp(z,-bound,bound)};
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
      const stats=this.stats,kind=this.weaponSchool(source);let damage=base*(kind?stats[kind]:1);
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
      if(enemy.type==='boss'&&(id==='freeze'||id==='shock'||id==='seal'))duration*=.25;
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
      this.bankLoot();this.realmStages[this.realm]++;this.stageKills[this.realm]=0;this.player.canonSlam=null;this.player.canonCue=null;this.player.x=0;this.player.z=0;this.player.y=0;this.player.ground=0;this.player.vy=0;this.player.invincible=2;this.heal(15);this.spawnTimer=.8;this.checkpointRevision++;
      this.emit('stage',{realm:this.realm,stage:this.stage,label:this.stageLabel});if(banked)this.collect(banked);return true;
    }
    spawnRealmEnemy(x,z,elite=false){const pool=REALMS[this.realm].enemies,index=elite?pool.length-1:Math.floor(this.random()*pool.length);return this.spawnEnemy(pool[index],x,z,elite);}
    setAction(action, duration) {
      const priority={idle:0,walk:0,jump:1,glide:1,dash:2,attack:3,cast:3,ultimate:4,hurt:5,death:6,victory:6};
      if(this.player.actionTime>0&&(priority[this.player.action]||0)>(priority[action]||0))return false;
      this.player.action=action;this.player.actionTime=duration;this.player.actionAge=0;this.player.actionImpact=null;return true;
    }
    activateShrine(realm=this.realm, postponeCompanionNotice=false) {
      if(this.shrines.has(realm))return false;
      this.shrines.add(realm);this.realmStages[realm]=3;const gift=REALMS[realm].gift;this.ranks[gift]=this.rank(gift)+1;
      const companion=Companions.recruit(this,realm);
      if(companion&&!postponeCompanionNotice)this.emit('companionJoin',{hero:companion,realm});
      if(gift==='vitality'){const hp=this.player.hp;this.refreshStats();this.player.hp=hp;this.heal(35);}
      this.player.invincible=Math.max(this.player.invincible,1.5);
      this.emit('shrine',{realm,x:0,z:-7});this.emit('nova',{x:0,z:-7,radius:9,color:REALMS[realm].accent});
      for(const enemy of this.enemies)if(Math.hypot(enemy.x,enemy.z+7)<9)this.hitEnemy(enemy,100*this.damageMultiplier,'shrine',5);
      this.checkpointRevision++;return true;
    }
    spawnBoss(id, final=false) {
      if(!BOSSES[id]||(this.boss&&!this.boss.dead))return null;
      const spec=BOSSES[id],landmark=this.landmark,edge=this.arenaLimit-4;
      const enemy=this.spawnEnemy('boss',landmark?0:clamp(this.player.x+10,-edge,edge),landmark?-8:clamp(this.player.z-10,-edge,edge));
      const health=(spec.hp+(this.mode==='adventure'&&!final?this.shrines.size*110:0))*(this.difficulty==='hard'?1.35:1)*(this.mode==='training'?1:1.08);
      Object.assign(enemy,{bossId:id,name:spec.name,hp:health,maxHp:health,speed:spec.speed,radius:spec.radius,damage:spec.damage*(this.difficulty==='hard'?1.25:1),realm:this.realm,final,stage:1,attackTimer:1.6,windup:0,attackCycle:0,action:'spawn',actionAge:0,spawnTime:.8,chargeTimer:0});
      if(this.kokiriStory&&landmark&&id==='gohma'&&!final){enemy.gohmaTrial=true;enemy.exposure=0;}
      this.boss=enemy;this.bossSpawned=true;this.player.invincible=Math.max(this.player.invincible,1.5);
      this.emit('boss',{id,name:spec.name,realm:this.realm,...(landmark?{landmark:landmark.name}:{})});return enemy;
    }
    challengeGuardian() {
      if(this.mode!=='adventure'||this.state!=='running'||this.boss||this.landmarkApproach||this.shrines.has(this.realm)||this.stage!==3||!this.stageReady||this.adventureDelay>0)return false;
      // Bank the third wave before opening the separate boss encounter. Upgrades finish first.
      this.enemies=[];this.projectiles=[];this.hazards=[];this.lockedTarget=null;
      if(!this.bankBossRewards())return false;
      this.landmarkActive=true;
      this.landmarkApproach=this.kokiriStory;
      this.placeAtLandmarkEntrance();
      if(this.landmarkApproach){this.emit('landmarkEnter',{realm:this.realm,name:this.landmark.name});return true;}
      return !!this.spawnBoss(REALMS[this.realm].boss,false);
    }
    bankBossRewards(){
      const banked=this.shards.reduce((sum,item)=>sum+item.value,0);this.shards=[];this.bankLoot();
      if(banked)this.collect(banked);return this.state==='running';
    }
    get mapResult(){
      if(this.state!=='map-clear')return null;
      const next=this.nextAdventureRealm;
      return {realm:this.realm,nextRealm:next??0,nextIsFinal:next===null,companion:Companions.recruit(this,this.realm),
        time:Math.max(0,(this.mapFinishedTime??this.time)-this.mapStart.time),kills:Math.max(0,this.kills-this.mapStart.kills),
        damageDealt:Math.max(0,this.damageDealt-this.mapStart.damageDealt),damageTaken:Math.max(0,this.damageTaken-this.mapStart.damageTaken)};
    }
    continueAfterMap(){
      if(this.state!=='map-clear'||!this.awaitingMapClear)return false;
      const next=this.nextAdventureRealm??0;
      this.awaitingMapClear=false;this.mapFinishedTime=null;this.state='running';this.adventureDelay=0;this.checkpointRevision++;
      const entered=this.enterRealm(next);
      if(entered&&this.nextAdventureRealm===null)this.adventureDelay=.7;
      return entered;
    }
    startMapCounters(){
      this.mapStart={time:this.time,kills:this.kills,damageDealt:this.damageDealt,damageTaken:this.damageTaken};
    }
    progressAdventure(dt){
      if(this.landmarkApproach){
        if(this.player.z<=DEKU_ARENA_THRESHOLD){
          this.landmarkApproach=false;this.spawnBoss('gohma');
        }
        return true;
      }
      if(!this.adventureTransition)return false;
      this.enemies=[];this.projectiles=[];this.hazards=[];this.lockedTarget=null;
      if(this.dekuTrailReady){
        // Let the player walk from the village to the physical doorway before swapping maps.
        // Stage kills/loot persist in a checkpoint, so a reload can restart this walk safely.
        this.adventureDelay=Math.max(0,this.adventureDelay-dt);
        const mouth=Terrain.DEKU_PORTAL;
        if(this.adventureDelay===0&&this.player.y<.55&&Math.hypot(this.player.x-mouth.x,this.player.z-mouth.z)<=mouth.radius)
          this.challengeGuardian();
        return true;
      }
      this.player.action='idle';this.player.actionTime=0;this.player.canonCue=null;this.player.canonSlam=null;this.player.invincible=this.sariaRescue?0:2;
      this.adventureDelay=Math.max(0,this.adventureDelay-dt);
      if(this.adventureDelay>0)return true;
      if(this.sariaRescue){
        this.sariaRescue=false;
        this.emit('companionJoin',{hero:'saria',realm:KOKIRI,scene:true});
        this.checkLevel();if(this.state!=='running')return true;
      }
      if(!this.shrines.has(this.realm)){this.challengeGuardian();return true;}
      if(this.awaitingMapClear){
        if(this.bankBossRewards()){this.state='map-clear';this.checkpointRevision++;this.emit('mapClear',{realm:this.realm});}
        return true;
      }
      const next=this.nextAdventureRealm;
      if(next!==null)this.enterRealm(next);
      else if(this.realm!==0)this.enterRealm(0);
      else if(this.bankBossRewards()){this.landmarkActive=false;this.spawnBoss('ganondorf',true);}
      return true;
    }
    alignAdventure(){
      if(this.mode!=='adventure'||this.boss||this.awaitingMapClear)return false;
      const next=this.nextAdventureRealm??0;
      // Older free-roam saves keep every seal and stage, then resume at the first unfinished map.
      if(this.realm===next)return false;
      this.landmarkActive=false;this.landmarkApproach=false;this.realm=next;this.visited.add(next);this.enemies=[];this.projectiles=[];this.hazards=[];this.lockedTarget=null;this.adventureDelay=0;this.startMapCounters();
      Object.assign(this.player,{canonCue:null,canonSlam:null,x:0,z:0,y:0,ground:0,vy:0,invincible:2});this.checkpointRevision++;return true;
    }
    addHazard(x,z,radius,delay,damage=24,impactSize=0) {
      if(this.hazards.length>=90)return;
      this.hazards.push({id:this.nextId++,x,z,radius,timer:delay,duration:delay,fired:false,life:delay+.4,damage,impactSize});
    }
    enemyBolt(enemy,angle,speed=7) {
      if(this.projectiles.length>=300)return;
      const target=this.targetFor(enemy),y=this.groundAt(enemy.x,enemy.z)+1,d=Math.max(1,distance(enemy,target));
      this.projectiles.push({id:this.nextId++,ownerId:enemy.id,type:'hostile',hostile:true,x:enemy.x,z:enemy.z,y,vy:(target.y+target.ground+1-y)/d,vx:Math.cos(angle),vz:Math.sin(angle),speed,life:3.4,age:0,damage:enemy.damage*.8,radius:.28,hits:new Set(),color:BOSSES[enemy.bossId]?.color||'#d894b1'});
    }
    // Every landmark adds its own marked pattern to the guardian's standard rotation.
    markLandmarkAttack(enemy, target){
      const bound=this.arenaLimit-2, stage=enemy.stage, wait=enemy.windup, style=this.landmark.style;
      const x=clamp(target.x,-bound,bound),z=clamp(target.z,-bound,bound);
      const damage=enemy.damage*1.06, marked=new Set();
      const mark=(xx,zz,r,impactSize=0)=>{
        const hx=clamp(xx,-bound,bound),hz=clamp(zz,-bound,bound),key=Math.round(hx*10)+','+Math.round(hz*10);
        if(!marked.has(key)){marked.add(key);this.addHazard(hx,hz,r,wait,damage,impactSize);}
      };
      const line=(xx,zz,angle,count,gap,r)=>{for(let i=0;i<count;i++)mark(xx+Math.cos(angle)*i*gap,zz+Math.sin(angle)*i*gap,r);};
      if(style==='roots'){
        mark(x,z,3.1);
        for(let i=0;i<stage+2;i++){const a=i*TAU/(stage+2)+enemy.attackCycle*.3;mark(x+Math.cos(a)*4.7,z+Math.sin(a)*4.7,1.45);}
      }else if(style==='water'){
        line(x-6,z,0,5,3,1.6);line(x,z-6,Math.PI/2,5,3,1.6);
      }else if(style==='fortress'){
        const a=Math.atan2(z-enemy.z,x-enemy.x),length=Math.min(34,Math.max(7,distance(enemy,{x,z})+2)),count=Math.ceil(length/2.8);
        line(enemy.x,enemy.z,a,count+1,length/count,1.65+stage*.15);
      }else if(style==='tower'){
        line(x-8,z,0,7,2.6,1.5);
        if(stage>1)line(x-8,z+4,0,7,2.6,1.3);
      }else if(style==='twilight'){
        mark(x,z,3.3);mark(-x,-z,2.7);
        if(stage>1){mark(x+4,z-4,1.7);mark(x-4,z+4,1.7);}
      }else if(style==='sky'){
        line(x,z-8,Math.PI/2,7,2.6,1.45);
        line(x+(stage===3?-4:4),z-8,Math.PI/2,7,2.6,1.45);
      }else if(style==='wind'){
        mark(x,z,2.8);
        for(let i=0;i<stage+2;i++){const a=(i+.15)*(TAU/(stage+3))+enemy.attackCycle*.4;line(x+Math.cos(a)*4,z+Math.sin(a)*4,a,2,2.75,1.45);}
      }else if(style==='moon'){
        mark(x,z,4.25,7.5);
        if(stage>1)for(let i=0;i<3;i++){const a=i*TAU/3+enemy.attackCycle*.35;mark(x+Math.cos(a)*6.7,z+Math.sin(a)*6.7,1.75,2.25);}
      }
    }
    finishLandmarkAttack(enemy, angle){
      const style=this.landmark.style, stage=enemy.stage;
      if(style==='roots'){
        for(let i=0;i<stage;i++){const a=angle+(i-(stage-1)/2)*1.1;this.spawnRealmEnemy(enemy.x+Math.cos(a)*4,enemy.z+Math.sin(a)*4);}
      }else if(style==='fortress'){
        const duration=clamp(distance(enemy,{x:enemy.targetX,z:enemy.targetZ})/25,.26,1.3);
        enemy.chargeTimer=duration;enemy.chargeX=Math.cos(angle)*25;enemy.chargeZ=Math.sin(angle)*25;
      }else if(style==='twilight'){
        const bound=this.arenaLimit-2;
        enemy.x=clamp(enemy.targetX+Math.cos(angle+Math.PI/2)*6,-bound,bound);
        enemy.z=clamp(enemy.targetZ+Math.sin(angle+Math.PI/2)*6,-bound,bound);
        const follow=Math.atan2(enemy.targetZ-enemy.z,enemy.targetX-enemy.x);
        for(let i=-1;i<=1;i++)this.enemyBolt(enemy,follow+i*.25,8);
        this.emit('blink',{x:enemy.x,z:enemy.z});
      }
    }
    enemyPose(enemy,action,duration=0){
      if(enemy.action!==action){enemy.action=action;enemy.actionAge=0;}
      enemy.actionDuration=duration;
    }
    enemyStrike(enemy,kind){
      this.emit('enemyStrike',{x:enemy.x,z:enemy.z,enemyId:enemy.enemyId,bossId:enemy.bossId,
        kind,facing:enemy.facing||0,stage:enemy.stage,targetX:enemy.targetX,targetZ:enemy.targetZ});
    }
    updateDekuGohma(enemy,p,dt){
      // The marked attack finishes first; only then does the eye become an easy target.
      // Guard damage is reduced, not blocked, so slow automatic builds can still clear.
      if(enemy.exposure>0){
        enemy.exposure=Math.max(0,enemy.exposure-dt);
        if(!enemy.exposure){enemy.attackTimer=.7;this.enemyPose(enemy,'idle');}
        return;
      }
      if(enemy.windup>0){
        enemy.windup=Math.max(0,enemy.windup-dt);
        if(enemy.windup>0)return;
        const angle=Math.atan2(enemy.targetZ-enemy.z,enemy.targetX-enemy.x);
        if(enemy.intent==='landmark'&&this.enemies.filter(e=>!e.dead&&e.type!=='boss').length<5)this.finishLandmarkAttack(enemy,angle);
        const duration=2.6-.25*(enemy.stage-1);
        enemy.exposure=duration;this.enemyPose(enemy,'attack',.43);this.enemyStrike(enemy,enemy.intent);
        this.emit('gohmaExpose',{id:enemy.id,x:enemy.x,z:enemy.z,duration});
        return;
      }
      if(!this.damageTargets().some(target=>target.z<=DEKU_ARENA_THRESHOLD+.4))return;
      if((enemy.attackTimer-=dt)<=0){
        const cycle=enemy.attackCycle++;
        enemy.intent=cycle%2===0?'slam':'landmark';
        enemy.windup=1.22-.1*(enemy.stage-1);
        enemy.targetX=p.x;enemy.targetZ=Math.min(p.z,DEKU_ARENA_THRESHOLD);
        this.enemyPose(enemy,'windup',enemy.windup);
        const priorHazards=this.hazards.length;
        if(enemy.intent==='landmark')this.markLandmarkAttack(enemy,{x:enemy.targetX,z:enemy.targetZ});
        else{
          this.addHazard(enemy.targetX,enemy.targetZ,3.45,enemy.windup,enemy.damage,3.8);
          if(enemy.stage>1)for(const side of [-1,1])this.addHazard(clamp(enemy.targetX+side*5.4,-20,20),enemy.targetZ-2.3,1.65,enemy.windup,enemy.damage*.72);
        }
        // The hazard pass follows the AI pass. Start both clocks on the next tick.
        for(let i=priorHazards;i<this.hazards.length;i++)this.hazards[i].skipInitialTick=true;
        this.emit('warning',{x:enemy.x,z:enemy.z,kind:enemy.intent,label:enemy.intent==='slam'?'Root Slam':'Falling Brood'});
        return;
      }
      this.enemyPose(enemy,'walk');const d=distance(enemy,p);
      if(d>4.2){
        enemy.x+=(p.x-enemy.x)/d*enemy.speed*dt;
        enemy.z=Math.min(DEKU_ARENA_THRESHOLD-1,enemy.z+(p.z-enemy.z)/d*enemy.speed*dt);
      }
    }
    updateBoss(enemy,dt) {
      const spec=BOSSES[enemy.bossId]||BOSSES.phantom,p=this.targetFor(enemy), landmark=this.landmark, bound=this.arenaLimit-1;
      if(enemy.windup<=0&&!(enemy.chargeTimer>0))enemy.facing=Math.atan2(p.x-enemy.x,p.z-enemy.z);
      const stage=enemy.hp<enemy.maxHp*.33?3:enemy.hp<enemy.maxHp*.66?2:1;
      if(stage>enemy.stage){enemy.stage=stage;enemy.attackTimer=Math.min(enemy.attackTimer,.7);this.emit('bossPhase',{id:enemy.bossId,name:enemy.name,stage,x:enemy.x,z:enemy.z});}
      enemy.actionAge=(enemy.actionAge||0)+dt;
      if(enemy.spawnTime>0){enemy.spawnTime=Math.max(0,enemy.spawnTime-dt);this.enemyPose(enemy,'spawn',.8);if(enemy.spawnTime===0)this.enemyPose(enemy,'walk');return;}
      if(enemy.gohmaTrial){this.updateDekuGohma(enemy,p,dt);return;}
      if(enemy.chargeTimer>0){enemy.chargeTimer-=dt;enemy.x=clamp(enemy.x+enemy.chargeX*dt,-bound,bound);enemy.z=clamp(enemy.z+enemy.chargeZ*dt,-bound,bound);this.enemyPose(enemy,'attack',enemy.actionDuration||.65);return;}
      if(enemy.windup>0){
        enemy.windup=Math.max(0,enemy.windup-dt);this.enemyPose(enemy,'windup',enemy.actionDuration||1);
        if(enemy.windup===0){
          const angle=Math.atan2(enemy.targetZ-enemy.z,enemy.targetX-enemy.x),kind=enemy.intent;
          if(kind==='landmark'&&landmark)this.finishLandmarkAttack(enemy,angle);
          else if(kind==='charge'){enemy.chargeTimer=.65;enemy.chargeX=Math.cos(angle)*22;enemy.chargeZ=Math.sin(angle)*22;}
          else if(kind==='volley'){const count=6+enemy.stage*2;for(let i=0;i<count;i++)this.enemyBolt(enemy,angle+i*TAU/count,6.5+enemy.stage);}
          else if(kind==='teleport'){
            const edge=landmark?bound-1:23;
            enemy.x=clamp(enemy.targetX+Math.cos(enemy.phase)*5,-edge,edge);enemy.z=clamp(enemy.targetZ+Math.sin(enemy.phase)*5,-edge,edge);
            const aim=Math.atan2(enemy.targetZ-enemy.z,enemy.targetX-enemy.x);
            for(let i=-1;i<=1;i++)this.enemyBolt(enemy,aim+i*.22,8);this.emit('blink',{x:enemy.x,z:enemy.z});
          }
          else if(kind==='summon'){for(let i=0;i<2+enemy.stage;i++){const a=i*TAU/(2+enemy.stage);this.spawnRealmEnemy(clamp(enemy.x+Math.cos(a)*3,-bound,bound),clamp(enemy.z+Math.sin(a)*3,-bound,bound));}}
          enemy.facing=Math.atan2(enemy.targetX-enemy.x,enemy.targetZ-enemy.z);
          this.enemyPose(enemy,'attack',enemy.chargeTimer>0?enemy.chargeTimer:.43);
          this.enemyStrike(enemy,kind);enemy.attackTimer=landmark?2.8-enemy.stage*.37:Math.max(1.25,3.4-enemy.stage*.4);
        }
        return;
      }
      enemy.attackTimer-=dt;if(enemy.action!=='attack'||enemy.actionAge>=enemy.actionDuration)this.enemyPose(enemy,'walk');
      if(enemy.attackTimer<=0){
        const cycle=enemy.attackCycle||0, signature=landmark&&(cycle%(enemy.stage===3?2:3)===0);
        const normalCycle=landmark?(enemy.landmarkNormalCycle||0):cycle;
        enemy.intent=signature?'landmark':spec.patterns[normalCycle%spec.patterns.length];
        if(landmark&&!signature)enemy.landmarkNormalCycle=normalCycle+1;
        enemy.attackCycle=cycle+1;enemy.windup=signature?1.3-enemy.stage*.1:Math.max(.6,1.1-enemy.stage*.1);this.enemyPose(enemy,'windup',enemy.windup);enemy.targetX=p.x;enemy.targetZ=p.z;
        if(signature)this.markLandmarkAttack(enemy,p);
        if(enemy.intent==='slam'){
          const size=['morpha','colgera'].includes(enemy.bossId)?0:spec.radius*2.5;
          this.addHazard(p.x,p.z,3.2,enemy.windup,enemy.damage,size);
          if(enemy.stage>1)for(let i=0;i<enemy.stage;i++)this.addHazard(p.x+(this.random()-.5)*10,p.z+(this.random()-.5)*10,2.5,enemy.windup,enemy.damage,size*.54);
        }
        if(enemy.intent==='charge'){const a=Math.atan2(p.z-enemy.z,p.x-enemy.x);for(let i=1;i<=6;i++)this.addHazard(clamp(enemy.x+Math.cos(a)*i*2.2,-bound,bound),clamp(enemy.z+Math.sin(a)*i*2.2,-bound,bound),.9,enemy.windup,enemy.damage*.75);}
        this.emit('warning',{x:enemy.x,z:enemy.z,kind:enemy.intent,...(signature?{label:landmark.attack}:{})});return;
      }
      const d=Math.max(.01,distance(enemy,p)),desired=enemy.bossId==='colgera'||enemy.bossId==='helmaroc'?5:2;
      if(d>desired){enemy.x+=(p.x-enemy.x)/d*enemy.speed*dt;enemy.z+=(p.z-enemy.z)/d*enemy.speed*dt;}
    }
    weaponName(id) {
      const hero=HEROES[this.hero];
      return hero.weapon===id&&hero.starterName?hero.starterName:UPGRADES.find(u=>u.id===id)?.name||id;
    }
    weaponSchool(id){
      const hero=HEROES[this.hero],starter=hero.weapon===id?Combat.ROSTER_STARTERS[this.hero]:null;
      return starter?.school||Combat.WEAPONS[id];
    }
    weaponStats(id,rank=this.rank(id),rarity=0) {
      const hero=HEROES[this.hero],starter=hero.weapon===id?Combat.ROSTER_STARTERS[this.hero]:null;
      const base=starter||Combat.ATTACKS[id];if(!base)return null;
      const melee=base.melee;
      const r=Math.max(1,rank),history=(this.weaponUpgrades[id]||[]).slice(0,r-1);while(history.length<r-1)history.push(history.length<this.rank(id)-1?0:rarity);
      const growth=Combat.upgradeGrowth(id,history,base);
      return{damage:base.damage*growth.damage*(1+(r-1)*.04)*this.damageMultiplier,count:base.count+growth.count,cooldown:base.cooldown*growth.cooldown*this.cooldownMultiplier,radius:base.radius*growth.area,speed:base.speed*growth.speed,duration:base.duration*growth.duration,pierce:base.pierce+growth.pierce,bounce:growth.bounce,critical:growth.critical,status:growth.status,homing:!!base.homing,...(starter?{ally:this.hero,motion:base.motion,castRange:base.castRange,arc:base.arc,art:base.art,flight:base.flight}:{}),...(melee?{melee:true}:{})};
    }
    upgradeSummary(id) {
      const rank=this.rank(id),before=this.weaponStats(id,rank),after=this.weaponStats(id,rank+1,this.choices.find(choice=>choice.id===id)?.rarity||0);
      if(!after)return UPGRADES.find(u=>u.id===id)?.desc||'Restore all health.';
      const multiplier=this.stats[this.weaponSchool(id)]||1,damage=Math.round(after.damage*multiplier),first=rank?Math.round(before.damage*multiplier)+' → '+damage:String(damage);
      const details=[(after.melee?(after.ally?this.weaponName(id):'Melee strike')+' · ':'')+'Damage '+first,after.count+(after.melee?' targets':id==='orbit'?' relics':id==='nova'?' pulse':' shots'),after.cooldown.toFixed(2)+'s'];
      if(after.melee&&!rank)details.push('Reach '+after.radius.toFixed(1));
      for(const [key,label,format]of [['pierce','pierce',value=>value],['bounce','bounces',value=>value],['speed','speed',value=>value.toFixed(1)],['radius',after.melee?'reach':'radius',value=>value.toFixed(1)],['duration','duration',value=>value.toFixed(1)+'s'],['critical','crit bonus',value=>Math.round(value*100)+'%']])if(rank&&Math.abs(after[key]-before[key])>.00001)details.push(label+' '+format(before[key])+' → '+format(after[key]));
      return details.join(' · ');
    }
    weaponSummary(id){
      const stats=this.weaponStats(id);if(!stats)return '';
      if(stats.melee)return (stats.ally?this.weaponName(id):'Melee strike')+' · '+Math.round(stats.damage*this.stats[this.weaponSchool(id)])+' damage per target · '+stats.count+' targets · reach '+stats.radius.toFixed(1)+' · '+stats.cooldown.toFixed(2)+'s'+(stats.critical?' · +'+Math.round(stats.critical*100)+'% crit':'');
      if(stats.motion==='rutoWave')return 'Zora Scale · '+Math.round(stats.damage*this.stats.magic)+' damage · reach '+stats.radius.toFixed(1)+' · pushes enemies back · '+stats.cooldown.toFixed(2)+'s';
      if(stats.motion==='slingshot')return 'Borrowed Fairy Slingshot · '+Math.round(stats.damage*this.stats.physical)+' damage · '+stats.cooldown.toFixed(2)+'s';
      if(id==='ember'&&this.hero==='link')return 'Master Sword · at full hearts a beam flies forward, otherwise a close sword cut · '+stats.cooldown.toFixed(2)+'s';
      return 'Damage '+Math.round(stats.damage*(this.stats[this.weaponSchool(id)]||1))+' · '+stats.count+(id==='orbit'?' relics':id==='nova'?' pulse':' shots')+' · '+stats.cooldown.toFixed(2)+'s'+(id==='nova'||id==='bomb'||id==='orbit'?' · radius '+stats.radius.toFixed(1):'')+(id==='orbit'?' · active '+stats.duration.toFixed(1)+'s':'')+(stats.pierce&&stats.pierce<99?' · '+stats.pierce+' pierce':'')+(stats.bounce?' · '+stats.bounce+' bounces':'')+(stats.critical?' · +'+Math.round(stats.critical*100)+'% crit':'');
    }
    explode(projectile) {
      if(projectile.exploded)return;projectile.exploded=true;projectile.type='bomb';
      this.emit('explosion',{x:projectile.x,z:projectile.z,radius:projectile.blastRadius||3,color:'#f0b46d',impactSize:1.4});
      for(const enemy of this.enemies)if(distance(enemy,projectile)<(projectile.blastRadius||3)+enemy.radius)this.hitProjectile(enemy,projectile,5);
    }
    get canCheckpoint(){return this.mode!=='training'&&['running','paused','upgrade','map-clear'].includes(this.state)&&this.player.hp>0&&!this.boss;}
    checkpoint(){
      if(!this.canCheckpoint)return null;
      return {version:2,...(this.reviewMapClears?{reviewMapClears:true,awaitingMapClear:this.awaitingMapClear,mapFinishedTime:this.mapFinishedTime,mapStart:{...this.mapStart}}:{}),adventureDelay:this.sariaRescue?0:this.adventureDelay,buildVersion:1,legacySlots:{...this.legacySlots},weaponUpgrades:Object.fromEntries(Object.keys(Combat.WEAPONS).filter(id=>this.rank(id)).map(id=>[id,[...(this.weaponUpgrades[id]||Array(this.rank(id)-1).fill(0))]])),choiceRarities:Object.fromEntries((this.state==='upgrade'?this.choices:[]).map(choice=>[choice.id,choice.rarity??0])),combatVersion:1,gear:{...this.gear},pendingLoot:this.loot.map(drop=>drop.gearId),damageBySource:{...this.damageBySource},criticalHits:this.criticalHits,megaCriticalHits:this.megaCriticalHits,reactions:this.reactions,runId:this.runId,hero:this.hero,mode:this.mode,difficulty:this.difficulty,state:this.state,choices:this.state==='upgrade'?this.choices.map(choice=>choice.id):[],permanent:{...this.permanent},realmStages:[...this.realmStages],stageKills:[...this.stageKills],realm:this.realm,time:this.time,level:this.level,xp:this.xp+this.shards.reduce((n,s)=>n+s.value,0)*this.stats.xpGain,ranks:{...this.ranks},healthFraction:this.player.hp/this.player.maxHp,energy:this.energy,kills:this.kills,damageDealt:this.damageDealt,damageTaken:this.damageTaken,shrines:[...this.shrines],visited:[...this.visited],refreshes:this.refreshes,skips:this.skips,banishes:this.banishes,banished:[...this.banished],revision:this.checkpointRevision};
    }
    static fromCheckpoint(raw){
      const validNumber=(value,min,max,integer=false)=>Number.isFinite(value)&&value>=min&&value<=max&&(!integer||Number.isInteger(value));
      if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==2||!Object.hasOwn(HEROES,raw.hero)||!['adventure','survival'].includes(raw.mode)||!['normal','hard'].includes(raw.difficulty)||typeof raw.runId!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(raw.runId))throw new Error('Invalid adventure checkpoint.');
      for(const [key,min,max,integer]of [['realm',0,REALMS.length-1,true],['time',0,7200,false],['level',1,500,true],['xp',0,1e7,false],['healthFraction',.0001,1,false],['energy',0,100,false],['kills',0,1e6,true],['refreshes',0,2,true],['skips',0,2,true],['banishes',0,1,true]])if(!validNumber(raw[key],min,max,integer))throw new Error('Invalid checkpoint '+key+'.');
      const indices=value=>Array.isArray(value)&&value.length<=REALMS.length&&new Set(value).size===value.length&&value.every(v=>validNumber(v,0,REALMS.length-1,true));
      if(!indices(raw.shrines)||!indices(raw.visited)||!raw.visited.includes(raw.realm)||!raw.ranks||typeof raw.ranks!=='object'||Array.isArray(raw.ranks)||!Array.isArray(raw.banished)||raw.banished.length>1||raw.banished.some(id=>!UPGRADES.some(u=>u.id===id)))throw new Error('Invalid checkpoint collection.');
      const game=new Game(raw.hero,Date.now(),{mode:raw.mode,difficulty:raw.difficulty,upgrades:raw.permanent,runId:raw.runId,reviewMapClears:raw.reviewMapClears===true});
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
        const allowed=new Set([...Object.keys(Combat.WEAPONS),...Combat.GEAR.map(item=>item.id),'ultimate','shrine','reaction','thorns','companion','other']);
        if(!raw.damageBySource||typeof raw.damageBySource!=='object'||Array.isArray(raw.damageBySource)||Object.entries(raw.damageBySource).some(([key,value])=>!allowed.has(key)||!validNumber(value,0,1e12)))throw new Error('Invalid saved damage data.');
        game.damageBySource={...raw.damageBySource};
      }
      for(const key of ['criticalHits','megaCriticalHits','reactions'])if(raw[key]!==undefined){if(!validNumber(raw[key],0,1e9,true))throw new Error('Invalid saved combat count.');game[key]=raw[key];}
      game.refreshStats();game.player.hp=raw.healthFraction*game.player.maxHp;game.player.invincible=2;
      game.energy=raw.energy;game.kills=raw.kills;game.damageDealt=validNumber(raw.damageDealt,0,1e10)?raw.damageDealt:0;game.damageTaken=validNumber(raw.damageTaken,0,1e8)?raw.damageTaken:0;
      if(raw.awaitingMapClear!==undefined&&typeof raw.awaitingMapClear!=='boolean')throw new Error('Invalid saved map result.');
      if(raw.awaitingMapClear===true||raw.state==='map-clear'){
        if(!game.reviewMapClears||raw.awaitingMapClear!==true||!game.shrines.has(game.realm)||!['running','paused','upgrade','map-clear'].includes(raw.state))throw new Error('Invalid saved map result.');
        game.awaitingMapClear=true;game.landmarkActive=true;game.placeAtLandmarkEntrance();
      }
      if(raw.mapStart!==undefined){
        if(!raw.mapStart||typeof raw.mapStart!=='object'||Array.isArray(raw.mapStart)||Object.keys(game.mapStart).some(key=>!validNumber(raw.mapStart[key],0,game[key],key==='kills')))throw new Error('Invalid saved map statistics.');
        for(const key of Object.keys(game.mapStart))game.mapStart[key]=raw.mapStart[key];
      }else if(game.realm!==ADVENTURE_ROUTE[0])game.startMapCounters();
      if(raw.mapFinishedTime!==undefined&&raw.mapFinishedTime!==null){
        if(!game.awaitingMapClear||!validNumber(raw.mapFinishedTime,game.mapStart.time,game.time))throw new Error('Invalid saved map finish time.');
        game.mapFinishedTime=raw.mapFinishedTime;
      }
      game.refreshes=raw.refreshes;game.skips=raw.skips;game.banishes=raw.banishes;game.banished=new Set(raw.banished);game.checkpointRevision=Number.isInteger(raw.revision)?Math.max(1,raw.revision):1;game.eliteMinute=Math.floor(game.time/60);game.spawnTimer=1.5;
      if(raw.state==='upgrade'){
        if(!Array.isArray(raw.choices)||raw.choices.length<1||raw.choices.length>3||new Set(raw.choices).size!==raw.choices.length||raw.choices.some(id=>id!=='feast'&&!game.canOffer(UPGRADES.find(item=>item.id===id))))throw new Error('Invalid saved upgrade choices.');
        game.state='upgrade';game.choices=raw.choices.map(id=>({...id==='feast'?{id:'feast',name:'Red Potion',category:'RESTORE',icon:'plus',desc:'Restore all health.',max:Infinity}:UPGRADES.find(item=>item.id===id),rarity:raw.choiceRarities?.[id]??0}));
      }else if(raw.state==='map-clear')game.state='map-clear';else game.checkLevel();game.alignAdventure();return game;
    }

    emit(type, data = {}) {
      if(this.events.length>=300){
        const important=['end','guardian','companionJoin','boss','travel','level','shrine','bossPhase','stage','stageClear','mapClear','landmarkEnter','sariaRescue','gohmaExpose'];
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
      if (this.state !== 'running' || this.sariaRescue || p.dashCooldown > 0||p.canonSlam||p.canonCue) return false;
      this.setAction('dash',.25);p.dash = .22; p.invincible = Math.max(p.invincible, .38); p.dashCooldown = 3.1;
      this.emit('dash', { x: p.x, z: p.z }); return true;
    }
    jump() { const p = this.player; if (this.state !== 'running' || this.sariaRescue || p.y > .01 || p.canonSlam || p.canonCue) return false; p.vy = 9; p.y = .02; this.setAction('jump',.4);this.emit('jump'); return true; }
    ultimate() {
      const hero=HEROES[this.hero],p=this.player,radius=hero.ultimateRadius;
      if(this.state!=='running'||this.landmarkApproach||this.sariaRescue||this.energy<100||(p.actionTime>0&&(p.action==='hurt'||p.action==='ultimate')))return false;
      this.energy=0;
      const aimRange=hero.ultimateAim||(hero.ultimateArc?radius:0);
      const target=aimRange?this.attackTarget(aimRange):null;
      const dx=target?target.x-p.x:Math.sin(p.facing),dz=target?target.z-p.z:Math.cos(p.facing);
      const facing=Math.hypot(dx,dz)>.001?Math.atan2(dx,dz):p.facing;
      const moon=hero.canonMove==='moonCrash',slam=hero.canonMove==='goronSlam';
      const bound=this.arenaLimit-1,aimedPoint=moon?(target&&target.id!=null?target:{x:p.x+Math.sin(facing)*8,z:p.z+Math.cos(facing)*8}):p;
      const center=moon?{x:clamp(aimedPoint.x,-bound,bound),z:clamp(aimedPoint.z,-bound,bound)}:p;
      const release=hero.sceneOnly||slam?null:({moonCrash:1.64,seal:.333,harp:.333,waterBlade:.333,rutoSurge:.333}[hero.canonMove]||.445);
      const slamTime=.78;
      this.attackPose('ultimate',hero.canonMove,hero.sceneOnly?1.35:moon?release+.30:slam?1.11:1.05,dx,dz);
      if(p.action==='ultimate')p.actionImpact=slam?slamTime:release;
      if(!hero.sceneOnly)p.invincible=Math.max(p.invincible,moon?release+.20:hero.ultimateShield||1.2);
      this.emit('ultimate',{x:center.x,z:center.z,originX:p.x,originZ:p.z,radius,hero:this.hero,name:hero.ultimateName,color:hero.ultimateColor,
        ootAlly:!!hero.ootAlly,canonMove:hero.canonMove,phaseStyle:hero.canonMove,facing,arc:hero.ultimateArc||TAU,sceneOnly:!!hero.sceneOnly,release,
        ...(slam?{windup:slamTime}:{})});
      if(!hero.sceneOnly){
        p.dash=0;
        if(slam)p.canonSlam={age:0,duration:slamTime,startHeight:p.y,facing};
        else p.canonCue={release,facing,target:moon?center:target?.id!=null?{x:target.x,z:target.z}:null};
      }
      return true;
    }

    resolveCanonUltimate(cue){
      const hero=HEROES[this.hero],p=this.player,radius=hero.ultimateRadius;
      const facing=cue.facing;
      if(hero.canonMove==='waterGun'){
        const life=.88,speed=25,y=p.ground+p.y+1,vy=cue.target?(this.groundAt(cue.target.x,cue.target.z)+1-y)/Math.max(.15,distance(p,cue.target)):0;
        if(this.projectiles.length<300)this.projectiles.push({id:this.nextId++,actorId:this.actorId||null,type:'bomb',flight:'bolt',art:'waterShot',
          x:p.x,z:p.z,y,vy,vx:Math.sin(facing),vz:Math.cos(facing),speed,life,duration:life,age:0,
          damage:hero.ultimateDamage*this.damageMultiplier,radius,pierce:6,hits:new Set(),source:'ultimate'});
        return true;
      }
      if(hero.canonMove==='moonCrash'){
        const center=cue.target||p;
        this.emit('groundImpact',{x:center.x,z:center.z,impactSize:clamp(radius*1.5,7,12),style:'moonCrash'});
        for(const enemy of this.enemies)if(!enemy.dead&&distance(enemy,center)<radius+enemy.radius)this.hitEnemy(enemy,hero.ultimateDamage*this.damageMultiplier,'ultimate',8);
        return true;
      }
      for(const enemy of this.enemies)if(!enemy.dead&&distance(enemy,p)<radius+enemy.radius&&(!hero.ultimateArc||this.inStrikeArc(enemy,p,facing,hero.ultimateArc))){
        this.hitEnemy(enemy,hero.ultimateDamage*this.damageMultiplier,'ultimate',hero.canonMove==='rutoSurge'?14:8);
        if(hero.ultimateStatus&&!enemy.dead)this.applyStatus(enemy,hero.ultimateStatus,12,'ultimate');
      }
      return true;
    }

    inStrikeArc(enemy,center,facing,arc){
      const dx=enemy.x-center.x,dz=enemy.z-center.z,d=Math.hypot(dx,dz);
      return d<.001||(dx*Math.sin(facing)+dz*Math.cos(facing))/d>=Math.cos(arc*.5);
    }

    toggleAim() { if (this.state !== 'running') return; this.aimMode = this.aimMode === 'auto' ? 'manual' : 'auto'; this.lockedTarget = null; }
    lockTarget() {
      if (this.state !== 'running') return false;
      if (this.lockedTarget !== null) { this.lockedTarget = null; return false; }
      const enemy = this.nearest(24); this.lockedTarget = enemy ? enemy.id : null; return !!enemy;
    }
    attackTarget(range) {
      if(this.lockedTarget!==null){
        const locked=this.enemies.find(e=>e.id===this.lockedTarget&&!e.dead);
        if(locked&&distance(locked,this.player)<=range)return locked;
        // A short-range weapon must not cancel a living target locked for a longer-range weapon.
        if(!locked||distance(locked,this.player)>26)this.lockedTarget=null;
      }
      if(this.aimMode==='auto')return this.nearest(range);
      return {x:this.player.x-Math.sin(this.cameraYaw)*range,z:this.player.z-Math.cos(this.cameraYaw)*range,id:null};
    }
    enterRealm(destination) {
      // Only the ordered Adventure sequence can advance to another map.
      if(this.mode!=='adventure'||this.state!=='running'||this.boss||!this.shrines.has(this.realm)||this.awaitingMapClear||destination===this.realm||destination!==(this.nextAdventureRealm??0))return false;
      this.bankLoot();this.landmarkActive=false;this.landmarkApproach=false;this.realm = destination; this.visited.add(destination);
      this.player.canonSlam=null;this.player.canonCue=null;this.player.x = 0; this.player.z = 0; this.player.y = 0;this.player.ground=0; this.player.vy = 0; this.player.invincible = 2;
      this.enemies = [];
      // Bank leftover shards once when moving to the next Adventure map.
      const banked = this.shards.reduce((sum, s) => sum + s.value, 0); this.shards = [];
      this.projectiles = []; this.hazards = []; this.shrineCharge = 0; this.lockedTarget = null;
      this.startMapCounters();this.checkpointRevision++;this.emit('travel', { realm: destination }); if (banked) this.collect(banked); return true;
    }
    get interaction(){
      if(this.landmarkActive)return null;
      if(Math.hypot(this.player.x,this.player.z+7)<3.4){
        if(this.mode==='adventure'&&!this.boss){
          if(this.adventureTransition)return null;
          if(!this.shrines.has(this.realm)&&this.stage<3)return{kind:'stage',name:this.stageReady?'Enter '+REALMS[this.realm].number+'-'+(this.stage+1):'Defeat '+Math.max(0,this.stageTarget-this.stageKills[this.realm])+' more enemies',blockedReason:this.stageReady?'':'Clear this level’s enemy wave first.'};
          if(!this.shrines.has(this.realm))return{kind:'stage',name:'Defeat '+Math.max(0,this.stageTarget-this.stageKills[this.realm])+' more enemies',blockedReason:'Clear level '+this.stageLabel+' before the final boss.'};
        }else if(this.mode==='survival'&&!this.shrines.has(this.realm))return{kind:'shrine',name:REALMS[this.realm].blessing};
      }
      return null;
    }
    interact(){
      if(this.state!=='running')return false;const nearby=this.interaction;if(!nearby)return false;
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
      if(type!=='boss'){const bound=this.arenaLimit-1;x=clamp(x,-bound,bound);z=clamp(z,-bound,bound);}
      const scale = (type === 'boss' ? 1 : this.mode==='adventure'?1+this.shrines.size*.12:Math.min(3.5,1+this.time/170))*(this.difficulty==='hard'?1.35:1)*(type!=='boss'&&this.mode==='adventure'?1+(this.stage-1)*.2:1)*(type!=='boss'&&this.mode!=='training'?1.05:1);
      const enemy = { id: this.nextId++, type, x, z, hp: baseHp * scale * (elite ? 3 : 1), maxHp: baseHp * scale * (elite ? 3 : 1), speed: speed + (type === 'boss' ? 0 : this.time / 650), radius: radius * (elite ? 1.3 : 1), damage, elite, hitFlash: 0, orbitHit: 0, attackTimer: 3, phase: 0, dead: false, knockX: 0, knockZ: 0 };
      enemy.enemyId=species||({slime:'chuchu',mushroom:'deku_baba',bat:'keese',boar:'bokoblin'})[type];enemy.name=ENEMIES[enemy.enemyId]?.name||'Enemy';enemy.realm=this.realm;enemy.mapStage=this.stage;
      enemy.action='walk';enemy.actionAge=0;enemy.actionDuration=0;enemy.facing=0;enemy.windup=0;
      enemy.attackMotion=type==='mushroom'?'spit':type==='boar'?'swipe':type==='bat'?'dive':'lunge';enemy.damage*=this.difficulty==='hard'?1.25:1;
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
      if(e.gohmaTrial)damage*=e.exposure>0?1.6:.47;
      else if(e.type==='boss'&&e.bossId==='gohma'&&e.windup>0)damage*=1.3;
      if(e.type==='boss')knock*=.12;
      const dealt = Math.min(e.hp, damage); e.hp -= damage; e.hitFlash = .1;e.hitReact=.23; this.damageDealt += dealt;
      const source=context.source||'other';this.damageBySource[source]=(this.damageBySource[source]||0)+dealt;
      if (knock) { const d = Math.max(.01, distance(e, this.player)); e.knockX += (e.x - this.player.x) / d * knock; e.knockZ += (e.z - this.player.z) / d * knock; }
      this.emit('hit', { id:e.id, x:e.x, z:e.z, y:this.groundAt(e.x,e.z)+1, damage:Math.round(dealt), critical:context.critical||0, boss:e.type==='boss',source,heavy:source==='ultimate'||knock>=5,facing:Math.atan2(e.x-this.player.x,e.z-this.player.z) });
      if (e.hp <= 0) {
        e.dead = true; this.kills++; this.streak++; this.streakTimer = 4; this.bestStreak = Math.max(this.bestStreak, this.streak); this.energy = Math.min(100, this.energy + (e.elite ? 12 : 3)*(1+this.permanent.magic*.08)); this.emit('pop', { id:e.id,x: e.x, z: e.z, enemyType: e.type, enemyId:e.enemyId,bossId:e.bossId,facing:e.facing,elite: e.elite });
        if(e.type==='boss'){
          this.enemies=this.enemies.filter(enemy=>!enemy.dead);
          if(this.mode==='training'){this.boss=null;this.bossSpawned=false;return dealt;}
          if(this.mode==='adventure'&&!e.final){
            this.boss=null;this.bossSpawned=false;
            const rescue=e.gohmaTrial&&this.hero!=='saria';
            if(rescue){
              this.sariaRescue=true;this.enemies=[];this.projectiles=[];this.hazards=[];
              Object.assign(this.player,{y:0,vy:0,gliding:false,dash:0,ground:0,canonCue:null,canonSlam:null,action:'idle',actionTime:0,actionAge:0,invincible:SARIA_RESCUE_TIME+.2});
            }
            this.activateShrine(e.realm,rescue);this.heal(30);this.dropGear(e.x,e.z,2);
            this.adventureDelay=rescue?SARIA_RESCUE_TIME:1.8;this.awaitingMapClear=this.reviewMapClears;this.mapFinishedTime=this.reviewMapClears?this.time:null;
            this.emit('guardian',{id:e.bossId,realm:e.realm,name:e.name,nextRealm:this.nextAdventureRealm??0,scene:!!rescue});
            const xp=18+this.shrines.size*9;
            if(rescue){this.xp+=xp*this.stats.xpGain;this.emit('sariaRescue',{hero:'saria',realm:KOKIRI,duration:SARIA_RESCUE_TIME,x:e.x,z:e.z});}
            else this.collect(xp);
            return dealt;
          }
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
    attackPose(action,kind,duration,dx,dz){
      if(!this.setAction(action,duration))return;
      this.player.attackKind=kind;
      this.player.attackFacing=Math.hypot(dx,dz)>.001?Math.atan2(dx,dz):this.player.facing;
    }
    fire(type,target,angleOffset=0,lane=0) {
      if(this.projectiles.length>=300)return;
      const p=this.player,stats=this.weaponStats(type),dx=target.x-p.x,dz=target.z-p.z;
      if(!stats)return;
      const baseAngle=Math.hypot(dx,dz)>.001?Math.atan2(dz,dx):Math.PI/2-p.facing;
      // A volley starts at separate nocks and converges on the enemy, not a fixed screen axis.
      const x=p.x-Math.sin(baseAngle)*lane,z=p.z+Math.cos(baseAngle)*lane;
      const manual=target.id===null,aimX=manual?dx:target.x-x,aimZ=manual?dz:target.z-z,horizontal=Math.hypot(aimX,aimZ);
      const angle=(horizontal>.001?Math.atan2(aimZ,aimX):baseAngle)+angleOffset;
      const y=p.y+(p.ground||0)+1,vy=manual?0:(this.groundAt(target.x,target.z)+1-y)/Math.max(.15,horizontal);
      this.projectiles.push({id:this.nextId++,actorId:this.actorId||null,type,x,z,y,vy,vx:Math.cos(angle),vz:Math.sin(angle),life:stats.duration,duration:stats.duration,age:0,speed:stats.speed*this.stats.projectileSpeed,damage:stats.damage,radius:type==='bomb'?.3:stats.radius,blastRadius:type==='bomb'?stats.radius:0,pierce:stats.pierce,bounce:stats.bounce,homing:stats.homing,hits:new Set(),targetId:target.id,returning:false,...(stats.ally?{ally:stats.ally}:{}),...(stats.art?{art:stats.art}:{}),...(stats.flight?{flight:stats.flight}:{})});
      this.attackPose(type==='leaf'||type==='bomb'||stats.motion==='slingshot'?'cast':'attack',stats.motion||type,.42,dx,dz);
    }
    shadowStrike(stats){return this.meleeStrike('orbit',stats);}
    meleeStrike(slot,stats){
      const p=this.player,y=p.y+(p.ground||0)+1;
      const close=this.enemies.filter(e=>!e.dead&&distance(e,p)<=stats.radius+e.radius&&Math.abs(this.groundAt(e.x,e.z)+1-y)<=Math.max(1.65,e.radius))
        .sort((a,b)=>distance(a,p)-distance(b,p));
      const locked=close.find(e=>e.id===this.lockedTarget),target=locked||(this.aimMode==='auto'?close[0]:null);
      if(!target&&this.aimMode==='auto')return false;
      const dx=target?target.x-p.x:-Math.sin(this.cameraYaw),dz=target?target.z-p.z:-Math.cos(this.cameraYaw);
      const facing=Math.hypot(dx,dz)>.001?Math.atan2(dx,dz):p.facing;
      this.attackPose('attack',stats.motion||'shadow',stats.duration,dx,dz);
      const detail={x:p.x,z:p.z,y,facing,reach:stats.radius,radius:stats.radius,arc:stats.arc,duration:stats.duration};
      if(stats.motion==='shadow')this.emit('shadowStrike',detail);
      else if(stats.ally)this.emit('allyStrike',{...detail,hero:this.hero,kind:stats.motion,color:HEROES[this.hero].color,
        targetX:target?.x??p.x+Math.sin(facing)*stats.radius,targetZ:target?.z??p.z+Math.cos(facing)*stats.radius,
        ...(stats.motion==='hammer'&&p.y<=.15?{impactSize:1.85}:{})});
      const inArc=e=>this.inStrikeArc(e,p,facing,stats.arc);
      const victims=target?[target,...close.filter(e=>e!==target&&inArc(e))]:close.filter(inArc);
      for(const enemy of victims.slice(0,stats.count))this.hitEnemy(enemy,stats.damage,slot,stats.motion==='hammer'?6:3.5);
      return true;
    }
    allyPulse(stats){
      const p=this.player,target=this.attackTarget(stats.castRange);
      if(!target)return false;
      const aimed=Math.atan2(target.x-p.x,target.z-p.z),arc=stats.arc||TAU;
      const bound=this.arenaLimit-1,center=stats.motion==='fairy'?{x:clamp(target.x,-bound,bound),z:clamp(target.z,-bound,bound)}:p;
      this.attackPose('cast',stats.motion,.65,Math.sin(aimed),Math.cos(aimed));
      this.emit('allyStrike',{hero:this.hero,kind:stats.motion,x:p.x,z:p.z,y:this.groundAt(center.x,center.z)+.1,
        facing:aimed,arc,radius:stats.radius,duration:.65,color:HEROES[this.hero].color,targetX:center.x,targetZ:center.z});
      for(const enemy of this.enemies){
        if(enemy.dead||distance(enemy,center)>stats.radius+enemy.radius||(arc<TAU&&!this.inStrikeArc(enemy,p,aimed,arc)))continue;
        this.hitEnemy(enemy,stats.damage,'nova',stats.motion==='rutoWave'?8:1);
        if(stats.motion==='rutoWave'&&!enemy.dead)this.applyStatus(enemy,'wet',6,'nova');
      }
      return true;
    }
    updateWeapons(dt) {
      for(const id of Object.keys(Combat.WEAPONS))this.cooldowns[id]-=dt;
      const p=this.player;
      if(p.action==='ultimate'&&p.actionTime>0)return;
      for(const id of ['ember','leaf','bomb','boomerang'])if(this.rank(id)&&this.cooldowns[id]<=0){
        const stats=this.weaponStats(id),range=id==='ember'||id==='leaf'?Math.min(26,stats.duration*stats.speed*this.stats.projectileSpeed):26;
        if(stats.melee||(this.hero==='link'&&id==='ember'&&p.hp+1e-6<p.maxHp)){
          const melee=stats.melee?stats:{...stats,ally:'link',motion:'sword',radius:3.75,arc:2.45,duration:.35,count:Math.max(2,stats.count)};
          if(this.meleeStrike(id,melee))this.cooldowns[id]=stats.cooldown;continue;
        }
        const target=this.attackTarget(range);if(!target)continue;
        for(let i=0;i<stats.count;i++){
          const offset=i-(stats.count-1)/2;
          if(id==='leaf'||id==='ember')this.fire(id,target,0,offset*Math.min(.68,1.5/Math.max(1,stats.count-1)));
          else this.fire(id,target,offset*.16);
        }
        this.cooldowns[id]=stats.cooldown;this.emit(id==='ember'?'shoot':id,{x:p.x,z:p.z,
          ...(id==='ember'?{swordWave:true,hero:this.hero,facing:Math.atan2(target.x-p.x,target.z-p.z),y:p.y+(p.ground||0)+1}:{})});
      }
      if(this.rank('nova')&&this.cooldowns.nova<=0){
        const stats=this.weaponStats('nova');
        if(stats.flight==='bolt'){
          const target=this.attackTarget(stats.castRange);
          if(target){for(let i=0;i<stats.count;i++)this.fire('nova',target,(i-(stats.count-1)/2)*.095);this.cooldowns.nova=stats.cooldown;}
        }else if(stats.ally){if(this.allyPulse(stats))this.cooldowns.nova=stats.cooldown;}
        else {const target=this.nearest(stats.radius+1);if(target){
          this.attackPose('cast','nova',.65,target.x-p.x,target.z-p.z);this.emit('nova',{x:p.x,z:p.z,radius:stats.radius,color:'#f2bb78'});
          for(const enemy of this.enemies)if(distance(p,enemy)<stats.radius+enemy.radius)this.hitEnemy(enemy,stats.damage,'nova',4);
          this.cooldowns.nova=stats.cooldown;
        }}
      }
      this.orbitActive=Math.max(0,this.orbitActive-dt);
      if(this.rank('orbit')){const stats=this.weaponStats('orbit');
      if(stats.melee){
        this.orbitActive=0;
        if(this.cooldowns.orbit<=0&&this.shadowStrike(stats))this.cooldowns.orbit=stats.cooldown;
        return;
      }
      this.orbitAngle+=dt*stats.speed;
      if(this.cooldowns.orbit<=0){this.orbitActive=stats.duration;this.cooldowns.orbit=stats.cooldown;this.attackPose('cast','orbit',.47,p.dx,p.dz);}
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
      this.energy = Math.min(100, this.energy + dt * .75*(1+this.permanent.magic*.08));
      this.streakTimer = Math.max(0, this.streakTimer - dt); if (!this.streakTimer) this.streak = 0;
      this.cameraYaw = Number.isFinite(input.cameraYaw) ? input.cameraYaw : this.cameraYaw;
      const slam=p.canonSlam;
      if(slam){
        slam.age=Math.min(slam.duration,slam.age+dt);
        const time=slam.age/slam.duration,peak=Math.max(4.2,slam.startHeight+2.5);
        p.y=time<.45?slam.startHeight+(peak-slam.startHeight)*Math.sin(time/.45*Math.PI/2):peak*(1-Math.pow((time-.45)/.55,2));
        p.vy=0;p.gliding=false;
      }else{
        p.gliding = p.y > .1 && p.vy < 0 && !!input.glide && p.stamina > 0;
        // A hero can glide over a basin, not across its submerged floor.
        if(p.gliding&&this.waterAt(p.x,p.z,(p.ground||0)+p.y))p.gliding=false;
        if (p.y > 0) { p.vy -= (p.gliding ? 4 : 23) * dt; if (p.gliding) { p.vy = Math.max(p.vy, -.9); p.stamina = Math.max(0, p.stamina - dt * .38); } p.y += p.vy * dt; if (p.y <= 0) { p.y = 0; p.vy = 0; p.gliding = false; } }
        else p.stamina = Math.min(1, p.stamina + dt * .65);
      }
      p.invincible = Math.max(0, p.invincible - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt);
      const ix = Number.isFinite(input.x) ? input.x : 0, iy = Number.isFinite(input.y) ? input.y : 0;
      const len = Math.max(1, Math.hypot(ix, iy)), mx = ix / len, my = iy / len;
      let dx = mx * Math.cos(this.cameraYaw) - my * Math.sin(this.cameraYaw), dz = -mx * Math.sin(this.cameraYaw) - my * Math.cos(this.cameraYaw);
      if (Math.hypot(dx, dz) > .05) { p.dx = dx; p.dz = dz; p.facing = Math.atan2(dx, dz); }
      if (p.dash > 0) { dx = p.dx * 4.2; dz = p.dz * 4.2; p.dash = Math.max(0, p.dash - dt); }
      if(p.canonCue||slam){dx=0;dz=0;}
      if(slam)p.facing=slam.facing;
      const wet=p.gliding||slam?null:this.waterMotion(this.hero,p.x,p.z,(p.ground||0)+p.y);
      const speed = p.speed * (1 + this.rank('speed') * .1) * this.stats.moveSpeed * (p.gliding ? 1.3 : 1) * (wet?.speed??1);
      const limit=this.arenaLimit-p.radius;
      const toX=p.x+dx*speed*dt,toZ=p.z+dz*speed*dt;
      const moved=this.kokiriStory&&this.landmarkActive?this.resolveLandmarkMove(p.x,p.z,toX,toZ,p.radius):
        this.realm===KOKIRI&&this.flatTerrain&&!this.landmarkActive?Terrain.resolveKokiriBoundary(toX,toZ,p.radius):
        this.flatTerrain||this.landmarkActive?{x:clamp(toX,-limit,limit),z:clamp(toZ,-limit,limit),ground:0}:Terrain.resolve(this.realm,this.stage,p.x,p.z,toX,toZ,p.y,p.radius);
      p.y=Math.max(0,p.y+(p.ground||0)-moved.ground);p.x=moved.x;p.z=moved.z;p.ground=moved.ground;
      if(slam&&slam.age+1e-6>=slam.duration){
        const hero=HEROES[this.hero];p.canonSlam=null;p.y=0;
        this.emit('goronImpact',{x:p.x,z:p.z,radius:hero.ultimateRadius,color:hero.ultimateColor,impactSize:5.2});
        for(const enemy of this.enemies)if(!enemy.dead&&distance(enemy,p)<hero.ultimateRadius+enemy.radius)this.hitEnemy(enemy,hero.ultimateDamage*this.damageMultiplier,'ultimate',10);
      }
      if(p.canonCue&&p.actionAge+1e-6>=p.canonCue.release){const cue=p.canonCue;p.canonCue=null;this.resolveCanonUltimate(cue);}
      if(p.actionTime===0){
        const action=p.y>0?(p.gliding?'glide':'jump'):p.dash>0?'dash':Math.hypot(ix,iy)>.05?'walk':'idle';
        if(p.action!==action){p.action=action;p.actionAge=0;}
      }
      if (this.rank('regen')||this.stats.regen) this.heal((this.rank('regen')+this.stats.regen)*dt);
    }
    step(dt,input={x:0,y:0}){
      if(this.state!=='running'||!Number.isFinite(dt)||dt<=0)return;
      dt=Math.min(dt,.05);this.time+=dt;if(!this.sariaRescue)this.updateActors(dt,input);
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
      if (!this.landmarkActive && this.bossSpawned && this.spawnTimer <= 0 && this.boss && !this.boss.dead) { this.spawnRealmEnemy(); this.spawnTimer = 1.4; }
      for(const enemy of this.enemies){
        if(enemy.dead)continue;this.updateStatuses(enemy,dt);if(enemy.dead)continue;const oldX=enemy.x,oldZ=enemy.z;
        enemy.hitFlash=Math.max(0,enemy.hitFlash-dt);enemy.hitReact=Math.max(0,(enemy.hitReact||0)-dt);
        const committedGohma=enemy.gohmaTrial&&(enemy.windup>0||enemy.exposure>0);
        if(enemy.dummy||!committedGohma&&(enemy.statuses?.freeze||enemy.statuses?.shock||enemy.statuses?.seal)){
          if(enemy.dummy){this.enemyPose(enemy,'idle');enemy.actionAge=(enemy.actionAge||0)+dt;}continue;
        }
        const p=this.targetFor(enemy);let d=Math.max(.01,distance(p,enemy));const towardX=(p.x-enemy.x)/d,towardZ=(p.z-enemy.z)/d;
        enemy.phase+=dt;
        if(enemy.type==='boss')this.updateBoss(enemy,dt);
        else{
          enemy.actionAge=(enemy.actionAge||0)+dt;enemy.contactPoseTimer=Math.max(0,(enemy.contactPoseTimer||0)-dt);
          if(enemy.action!=='windup')enemy.facing=Math.atan2(towardX,towardZ);
          const recovery=enemy.action==='attack'&&enemy.actionAge<enemy.actionDuration;
          if(enemy.type==='mushroom'&&d<17){
            enemy.attackTimer-=dt;
            if(enemy.attackTimer<=0){
              enemy.facing=Math.atan2(towardX,towardZ);this.enemyBolt(enemy,Math.atan2(towardZ,towardX),5.5);enemy.attackTimer=2.4;
              this.enemyPose(enemy,'attack',.38);this.enemyStrike(enemy,'spit');
            }else if(enemy.attackTimer<.45)this.enemyPose(enemy,'windup',.45);
            else if(!recovery)this.enemyPose(enemy,'idle');
          }else if(enemy.type==='boar'&&(enemy.windup>0||d<enemy.radius+p.radius+1.25)){
            enemy.attackTimer-=dt;
            if(enemy.windup>0){
              enemy.windup=Math.max(0,enemy.windup-dt);this.enemyPose(enemy,'windup',.48);
              if(enemy.windup===0){this.enemyPose(enemy,'attack',.39);this.enemyStrike(enemy,'swipe');if(d<enemy.radius+p.radius+1.1&&p.y<1.1)this.hurtPlayer(enemy.damage,enemy,p);}
            }else if(enemy.attackTimer<=0){enemy.windup=.48;enemy.attackTimer=1.6;this.enemyPose(enemy,'windup',.48);}
            else if(!recovery)this.enemyPose(enemy,'idle');
          }else{
            const sway=enemy.type==='bat'?Math.sin(enemy.phase*4+enemy.id)*.55:0,hop=enemy.type==='slime'?(.65+Math.max(0,Math.sin(enemy.phase*5))*.65):1;
            enemy.x+=(towardX+(-towardZ)*sway)*enemy.speed*hop*dt;enemy.z+=(towardZ+towardX*sway)*enemy.speed*hop*dt;
            if(!recovery){
              if((enemy.type==='bat'||enemy.type==='slime')&&!enemy.contactPoseTimer&&d<p.radius+enemy.radius+1.1)this.enemyPose(enemy,'windup',.32);
              else this.enemyPose(enemy,'walk');
            }
          }
        }
        if(!this.flatTerrain&&!this.landmarkActive&&enemy.type!=='bat'&&!BOSSES[enemy.bossId]?.flying){const next=Terrain.resolve(this.realm,this.stage,oldX,oldZ,enemy.x,enemy.z,0,enemy.radius*.7);enemy.x=next.x;enemy.z=next.z;}
        enemy.x+=enemy.knockX*dt;enemy.z+=enemy.knockZ*dt;enemy.knockX*=Math.exp(-10*dt);enemy.knockZ*=Math.exp(-10*dt);
        if(this.kokiriStory&&this.landmarkActive){const next=this.resolveLandmarkMove(oldX,oldZ,enemy.x,enemy.z,enemy.radius);enemy.x=next.x;enemy.z=next.z;}
        enemy.ground=this.groundAt(enemy.x,enemy.z);
        d=distance(p,enemy);
        if(enemy.type!=='boar'&&d<p.radius+enemy.radius&&(p.y<1.1||enemy.type==='bat'||enemy.type==='boss')){
          if((enemy.type==='bat'||enemy.type==='slime')&&!enemy.contactPoseTimer){
            enemy.contactPoseTimer=.84;this.enemyPose(enemy,'attack',.34);this.enemyStrike(enemy,enemy.type==='bat'?'dive':'lunge');
          }
          this.hurtPlayer(enemy.damage,enemy,p);
        }
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
      // Knockback and crowd separation cannot shove enemies beyond the new hard bounds.
      for(const enemy of this.enemies){
        const bound=this.arenaLimit-enemy.radius;
        enemy.x=clamp(enemy.x,-bound,bound);enemy.z=clamp(enemy.z,-bound,bound);
        enemy.ground=this.groundAt(enemy.x,enemy.z);
      }
      this.updateAllWeapons(dt);
      if(this.sariaRescue)return;
      if(this.reviewMapClears)Companions.update(this,dt);
      if(this.sariaRescue)return;
      for(const projectile of this.projectiles){
        const p=this.projectileOwner(projectile);
        const previous={x:projectile.x,z:projectile.z,y:projectile.y??this.groundAt(projectile.x,projectile.z)+1};
        projectile.life-=dt;projectile.age=(projectile.age||0)+dt;
        if(this.landmarkActive&&Math.max(Math.abs(projectile.x),Math.abs(projectile.z))>this.arenaLimit+1){if(projectile.type==='bomb'&&!projectile.flight)this.explode(projectile);projectile.life=0;continue;}
        if(projectile.type==='bomb'&&!projectile.flight){
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
            this.hitProjectile(enemy,projectile);if(this.sariaRescue)return;projectile.hits.add(enemy.id);
            if(projectile.bounce>0){
              const next=this.enemies.filter(target=>!target.dead&&!projectile.hits.has(target.id)).sort((a,b)=>distance(a,projectile)-distance(b,projectile))[0];
              if(next){const d=Math.max(.01,distance(next,projectile));projectile.bounce--;projectile.targetId=next.id;projectile.vx=(next.x-projectile.x)/d;projectile.vz=(next.z-projectile.z)/d;projectile.vy=(this.groundAt(next.x,next.z)+1-projectile.y)/d;break;}
            }
            if((projectile.pierce??0)<=0){projectile.life=0;break;}projectile.pierce--;
          }
        }
      }
      this.projectiles=this.projectiles.filter(projectile=>projectile.life>0);
      for (const h of this.hazards) { if(h.skipInitialTick){h.skipInitialTick=false;continue;}h.timer -= dt; h.life -= dt; if (h.timer <= 0 && !h.fired) { h.fired = true; this.emit('slam', { x: h.x, z: h.z, impactSize:h.impactSize }); for(const target of this.damageTargets())if (distance(target, h) < h.radius + target.radius && target.y < 1.1) this.hurtPlayer(h.damage||30,null,target); } }
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
      for (const e of this.enemies) if (e.type !== 'boss' && distance(e, this.targetFor(e)) > 50) { const p=this.targetFor(e),a = this.random() * TAU,bound=this.arenaLimit-1; e.x = clamp(p.x + Math.cos(a) * 24,-bound,bound); e.z = clamp(p.z + Math.sin(a) * 24,-bound,bound); e.ground=this.groundAt(e.x,e.z); }
    }
  }
  return { Game, HEROES, REALMS, GUARDIAN_LANDMARKS, ADVENTURE_ROUTE, STAGE_TARGETS, UPGRADES, BOSSES, PERMANENT, ENEMIES, Terrain, Combat, COMPANION_BY_REALM:Companions.BY_REALM, ARENA_LIMIT, xpForLevel, seeded, clamp };
});
