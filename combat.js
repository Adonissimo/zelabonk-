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
    {id:'fierce',name:'Fierce Deity Mask',origin:'Majora’s Mask',icon:'moon',rarity:4,max:1,mods:{physical:1.5,magic:1.5},desc:'+50% physical and magic damage.'}
  ].map(item=>Object.freeze({...item,max:item.max??10,mods:Object.freeze(item.mods||{})})));
  const BY_ID=new Map(GEAR.map(item=>[item.id,item]));
  const WEAPONS=Object.freeze({ember:'physical',leaf:'magic',orbit:'magic',nova:'magic',bomb:'physical',boomerang:'physical'});
  const STATUS=Object.freeze({
    burn:{name:'Burn',duration:3,color:'#f2a56b'},
    freeze:{name:'Freeze',duration:1.5,color:'#9ce2ef'},
    wet:{name:'Soaked',duration:5,color:'#8bc9f4'},
    shock:{name:'Shock',duration:.65,color:'#f1db82'}
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
  return{GEAR,RARITIES,WEAPONS,STATUS,stats,critical,validateGear,item:id=>BY_ID.get(id)};
});
