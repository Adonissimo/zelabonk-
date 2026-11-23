/* Independently authored Zelda equipment and combat rules. No reference assets or source code. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.BonkCombat=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const RARITIES=Object.freeze([
    {name:'Common',color:'#d3e2c9',weight:60},
    {name:'Uncommon',color:'#91dbaa',weight:27},
    {name:'Rare',color:'#91ccec',weight:10},
    {name:'Heroic',color:'#d5b1ef',weight:2.5},
    {name:'Legendary',color:'#f2d589',weight:.5}
  ]);
  const GEAR=Object.freeze([
    {id:'radish',name:'Hearty Radish',origin:'Breath of the Wild',icon:'heart',rarity:0,mods:{maxHp:15,hpScale:1.03},desc:'+15 health and +3% maximum health.'},
    {id:'violet',name:'Swift Violet',origin:'Breath of the Wild',icon:'boot',rarity:0,mods:{moveSpeed:1.07},desc:'+7% movement speed.'},
    {id:'princess',name:'Silent Princess',origin:'Breath of the Wild',icon:'sprout',rarity:0,mods:{evasion:.04},desc:'+4% chance to evade a hit.'},
    {id:'hawkeye',name:'Hawkeye',origin:'Twilight Princess',icon:'compass',rarity:0,mods:{critChance:.06},desc:'+6% critical chance.'},
    {id:'bow',name:'Hero’s Bow',origin:'The Wind Waker',icon:'arrow',rarity:0,mods:{projectileSpeed:1.15,critChance:.03},desc:'+15% projectile speed and +3% critical chance.'},
    {id:'harp',name:'Goddess’s Harp',origin:'Skyward Sword',icon:'wind',rarity:0,mods:{healing:1.15,regen:.3},desc:'+15% healing and +0.3 health per second.'},
    {id:'armor',name:'Soldier’s Armor',origin:'Breath of the Wild',icon:'shield',rarity:0,mods:{armor:5,armorScale:1.03},desc:'+5 armor and +3% armor.'},
    {id:'honey',name:'Courser Bee Honey',origin:'Breath of the Wild',icon:'magnet',rarity:0,mods:{pickupRange:1.5},desc:'+1.5 XP collection range.'},
    {id:'blade',name:'Ancient Blade',origin:'Tears of the Kingdom',icon:'sword',rarity:0,mods:{eliteDamage:1.15},desc:'+15% damage against elites and guardians.'},
    {id:'bracelet',name:'Goron Bracelet',origin:'Ocarina of Time',icon:'sword',rarity:1,mods:{physical:1.15},desc:'+15% physical weapon damage.'},
    {id:'rod',name:'Magic Rod',origin:'Tears of the Kingdom',icon:'bolt',rarity:1,mods:{magic:1.15},desc:'+15% magic weapon damage.'},
    {id:'edge',name:'Feathered Edge',origin:'Breath of the Wild',icon:'wind',rarity:1,mods:{attackSpeed:1.1},desc:'Weapons attack 10% faster.'},
    {id:'claymore',name:'Royal Guard’s Claymore',origin:'Breath of the Wild',icon:'sword',rarity:1,mods:{critDamage:.3},desc:'+30% critical damage.'},
    {id:'milk',name:'Lon Lon Milk',origin:'Ocarina of Time',icon:'plus',rarity:1,mods:{regen:1.2},desc:'+1.2 health per second.'},
    {id:'spikes',name:'Spiked Boko Shield',origin:'Breath of the Wild',icon:'shield',rarity:1,mods:{thorns:25},desc:'Reflect 25 damage when an enemy hits you.'},
    {id:'timeshift',name:'Timeshift Stone',origin:'Skyward Sword',icon:'clock',rarity:1,mods:{duration:1.2},desc:'+20% status duration.'},
    {id:'token',name:'Gold Skulltula Token',origin:'Ocarina of Time',icon:'relic',rarity:1,mods:{xpGain:1.15},desc:'+15% experience collected.'},
    {id:'tears',name:'Great Fairy’s Tears',origin:'Twilight Princess',icon:'plus',rarity:2,mods:{lifesteal:.03,healing:1.15},desc:'Heal for 3% of direct damage. +15% healing.'},
    {id:'firefruit',name:'Fire Fruit',origin:'Tears of the Kingdom',icon:'flame',rarity:2,proc:'burn',chance:.16,desc:'Hits have a 16% chance to burn for three seconds.'},
    {id:'icefruit',name:'Ice Fruit',origin:'Tears of the Kingdom',icon:'moon',rarity:2,proc:'freeze',chance:.12,desc:'Hits have a 12% chance to freeze. Bosses resist the freeze.'},
    {id:'splashfruit',name:'Splash Fruit',origin:'Tears of the Kingdom',icon:'wave',rarity:2,proc:'wet',chance:.2,desc:'Hits have a 20% chance to soak. Water improves freezing and shock.'},
    {id:'shockfruit',name:'Shock Fruit',origin:'Tears of the Kingdom',icon:'bolt',rarity:3,proc:'shock',chance:.12,desc:'Hits have a 12% chance to shock. Soaked targets take chain damage.'},
    {id:'ancientbow',name:'Ancient Bow',origin:'Breath of the Wild',icon:'arrow',rarity:3,mods:{critChance:.15},desc:'+15% critical chance. Above 100%, critical chance becomes mega-critical chance.'},
    {id:'adventurepouch',name:'Adventure Pouch',origin:'Skyward Sword',icon:'relic',rarity:4,max:1,desc:'Weapons can reach level 10 instead of 8.'},
    {id:'greenpotion',name:'Green Potion',origin:'Ocarina of Time',icon:'plus',rarity:3,max:1,desc:'Charms can reach level 12 instead of 10.'},
    {id:'fierce',name:'Fierce Deity Mask',origin:'Majora’s Mask',icon:'moon',rarity:4,max:1,mods:{physical:1.5,magic:1.5},desc:'+50% physical and magic damage.'}
  ].map(item=>Object.freeze({...item,max:item.max??10,mods:Object.freeze(item.mods||{})})));
  const BY_ID=new Map(GEAR.map(item=>[item.id,item]));
  const WEAPONS=Object.freeze({ember:'physical',leaf:'magic',orbit:'magic',nova:'magic',bomb:'physical',boomerang:'physical'});
  const UPGRADE_POWER=Object.freeze([1,1.2,1.45,1.75,2.1]);
  const ATTACKS=Object.freeze({
    ember:{damage:13,cooldown:1,count:1,radius:.5,speed:24,duration:.8,pierce:0,stats:['dmg','cd','count','pierce','speed','crit','bounce']},
    leaf:{damage:9,cooldown:1.25,count:2,radius:.5,speed:15,duration:1.6,pierce:0,homing:true,stats:['dmg','cd','count','speed','crit']},
    bomb:{damage:20,cooldown:1.9,count:1,radius:3.2,speed:15,duration:3,pierce:0,stats:['dmg','cd','count','area','status']},
    nova:{damage:22,cooldown:2.6,count:1,radius:6.5,speed:0,duration:0,pierce:99,stats:['dmg','cd','area','status','crit']},
    orbit:{damage:9,cooldown:5.5,count:2,radius:3.2,speed:3.2,duration:4,pierce:99,stats:['dmg','count','area','dur','speed','cd']},
    boomerang:{damage:14,cooldown:1.7,count:1,radius:.8,speed:17,duration:1.3,pierce:99,stats:['dmg','cd','count','area','speed','crit']}
  });
  // Midna channels the existing Fused Shadow slot into a close claw cleave.
  const SHADOW_CLAW=Object.freeze({damage:21,cooldown:1.05,count:2,radius:4.3,arc:1.9,speed:0,duration:.44,pierce:0,stats:Object.freeze(['dmg','cd','area','count','crit'])});
  // Starter variants use existing save slots while keeping their original game identities.
  const ROSTER_STARTERS=Object.freeze({
    midna:Object.freeze({...SHADOW_CLAW,motion:'shadow',melee:true}),
    tetra:Object.freeze({...SHADOW_CLAW,damage:22,cooldown:1.25,radius:4.25,arc:2.5,count:3,duration:.46,motion:'cutlass',melee:true,school:'physical'}),
    sheik:Object.freeze({...SHADOW_CLAW,damage:15,cooldown:.83,radius:3.4,arc:2.3,count:3,duration:.35,motion:'kunai',melee:true,school:'physical'}),
    skullkid:Object.freeze({...ATTACKS.nova,damage:23,cooldown:1.8,radius:2.25,castRange:12.5,motion:'fairy'}),
    impa:Object.freeze({...SHADOW_CLAW,damage:24,cooldown:1.36,radius:4.6,arc:2.18,count:3,duration:.58,motion:'giantBlade',melee:true,school:'physical'}),
    saria:Object.freeze({...ATTACKS.ember,damage:15,cooldown:1.07,radius:.31,speed:22,duration:1.12,castRange:20,motion:'slingshot',art:'slingshot',flight:'bolt',school:'physical'}),
    darunia:Object.freeze({...SHADOW_CLAW,damage:29,cooldown:1.65,radius:4.65,arc:2.65,count:4,duration:.58,motion:'hammer',melee:true}),
    ruto:Object.freeze({...ATTACKS.nova,damage:20,cooldown:1.74,radius:8.25,arc:1.48,castRange:8.75,motion:'rutoWave'}),
    nabooru:Object.freeze({...SHADOW_CLAW,damage:28,cooldown:1.6,radius:4.6,arc:2.28,count:3,duration:.57,motion:'axe',melee:true})
  });
  function upgradeGrowth(id,history=[],base=ATTACKS[id]){
    const result={damage:1,cooldown:1,count:0,area:1,speed:1,duration:1,pierce:0,bounce:0,critical:0,status:1};
    const keys=base?.stats;if(!keys)return result;
    for(let index=0;index<history.length;index++){
      const strength=UPGRADE_POWER[history[index]],count=strength>=1.6?3:2;result.damage+=.08;
      for(let offset=0;offset<Math.min(count,keys.length);offset++){
        const stat=keys[(index*count+offset)%keys.length];
        if(stat==='dmg')result.damage+=.22*strength;
        else if(stat==='cd')result.cooldown*=1-Math.min(.25,.08*strength);
        else if(stat==='count')result.count+=strength>=1.6?2:1;
        else if(stat==='crit')result.critical+=.05*strength;
        else if(stat==='status')result.status+=.25*strength;
        else if(stat==='pierce'||stat==='bounce')result[stat]+=Math.max(1,Math.round(strength));
        else result[stat==='dur'?'duration':stat]+=(stat==='dur'?.2:.15)*strength;
      }
    }return result;
  }
  const STATUS=Object.freeze({
    burn:{name:'Burn',duration:3,color:'#f2a56b'},
    freeze:{name:'Freeze',duration:1.5,color:'#9ce2ef'},
    wet:{name:'Soaked',duration:5,color:'#8bc9f4'},
    shock:{name:'Shock',duration:.65,color:'#f1db82'},
    seal:{name:'Sealed',duration:2.2,color:'#fff0b4'}
  });
  const MULTIPLIERS=new Set(['hpScale','armorScale','moveSpeed','projectileSpeed','healing','eliteDamage','physical','magic','attackSpeed','duration','xpGain']);
  function stats(gear){
    const result={maxHp:0,hpScale:1,armor:0,armorScale:1,moveSpeed:1,projectileSpeed:1,healing:1,eliteDamage:1,physical:1,magic:1,attackSpeed:1,duration:1,xpGain:1,regen:0,evasion:0,critChance:.05,critDamage:1.75,pickupRange:0,thorns:0,lifesteal:0};
    for(const item of GEAR){const count=gear[item.id]||0;if(!count)continue;for(const [key,value]of Object.entries(item.mods)){
      if(MULTIPLIERS.has(key))result[key]*=Math.pow(value,count);else result[key]+=value*count;
    }}
    result.armor*=result.armorScale;result.critChance=Math.min(2,result.critChance);result.evasion=Math.min(.75,result.evasion);result.lifesteal=Math.min(.5,result.lifesteal);
    return result;
  }
  function critical(chance,damage,roll){
    chance=Math.max(0,Math.min(2,chance));
    const tier=Math.floor(chance)+(roll<chance%1?1:0);
    return{tier,multiplier:tier===0?1:tier===1?damage:damage*(1+.5*(damage-1))};
  }
  function validateGear(raw){
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length>GEAR.length)throw new Error('Invalid saved equipment.');
    const out={};for(const [id,count]of Object.entries(raw)){
      const item=BY_ID.get(id);if(!item||!Number.isInteger(count)||count<1||count>item.max)throw new Error('Invalid saved equipment stack.');out[id]=count;
    }return out;
  }
  return{GEAR,RARITIES,WEAPONS,ATTACKS,SHADOW_CLAW,ROSTER_STARTERS,UPGRADE_POWER,upgradeGrowth,STATUS,stats,critical,validateGear,item:id=>BY_ID.get(id)};
});
