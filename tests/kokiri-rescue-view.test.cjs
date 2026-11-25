const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const Terrain=require('../terrain.js');
const {Game}=require('../core.js');

function make(reducedMotion=false){
  const elements=new Map(),sounds=[],effects=[];
  const context={Terrain,reducedMotion,announcementTimer:0,clearTimeout(){},clamp:(x,lo,hi)=>Math.min(hi,Math.max(lo,x)),
    sound:value=>sounds.push(value),$:id=>{
      assert.ok(html.includes('id="'+id+'"'));
      if(!elements.has(id))elements.set(id,{hidden:true,textContent:'',classList:{remove(){}}});
      return elements.get(id);
    }};
  const methods=source.slice(source.indexOf('    startSariaRescue('),source.indexOf('    syncMap('));
  const Rescue=vm.runInNewContext('(class {\n'+methods+'\n})',context);
  const view=new Rescue();view.yaw=Math.PI/4;
  view.ultimateStage=(...args)=>effects.push(args);
  return {view,elements,sounds,effects};
}

test('one Saria walks in, plays once, then becomes the follower at the same landing position',()=>{
  const {view,elements,sounds,effects}=make();
  const game={time:10,state:'running',arenaLimit:23,player:{x:18,z:7},
    companions:[{id:'saria',hero:'saria',x:19,z:6}],groundAt:()=>0};
  view.startSariaRescue(game,{duration:3.6});
  const start=view.sariaRescuePose(game);
  assert.equal(start.action,'walk');
  assert.notEqual(Math.hypot(start.x-19,start.z-6),0);
  game.time=10.6;const walking=view.sariaRescuePose(game);
  assert.ok(Math.hypot(walking.x-19,walking.z-6)<Math.hypot(start.x-19,start.z-6));
  game.time=11.12;const song=view.sariaRescuePose(game);
  assert.equal(song.action,'ultimate');assert.equal(song.attackKind,'ocarinaSong');
  assert.equal(song.x,19);assert.equal(song.z,6);
  game.time=11.9;view.sariaRescuePose(game);
  assert.deepEqual(sounds,['sariaSong']);assert.equal(effects.length,1);
  game.time=12.75;const joined=view.sariaRescuePose(game);
  assert.equal(joined.id,'saria');assert.equal(joined.rescue,false);
  assert.equal(joined.x,game.companions[0].x);
  assert.match(elements.get('saria-rescue-line').textContent,/go together/);
  game.state='map-clear';assert.equal(view.sariaRescuePose(game),null);
  assert.equal(elements.get('saria-rescue-caption').hidden,true);
});

test('Saria does not clip through root walls when the player retreated into the passage',()=>{
  const {view}=make(),game=new Game('link',42,{mode:'adventure',reviewMapClears:true,flatTerrain:true});
  game.realmStages[game.realm]=3;game.stageKills[game.realm]=24;
  assert.equal(game.challengeGuardian(),true);
  for(let i=0;i<50&&!game.boss;i++)game.step(.05,{y:1,cameraYaw:0});
  assert.equal(game.boss.bossId,'gohma');
  // A Link sword beam already in flight can finish the boss after he retreats to the side.
  Object.assign(game.player,{x:3.8,z:19,facing:-Math.PI/2});
  assert.ok(game.hurtEnemy(game.boss,1e6)>0);
  const event=game.drainEvents().find(event=>event.type==='sariaRescue');
  assert.equal(event?.hero,'saria');
  const legal=pose=>Math.abs(pose.x)<=Terrain.DEKU_ENTRANCE.halfWidth-.38+1e-8;
  assert.ok(legal(game.companions[0]));
  view.startSariaRescue(game,event);
  for(let frame=0;frame<70;frame++){
    const posed=view.sariaRescuePose(game);
    if(posed.z>Terrain.DEKU_ENTRANCE.openingZ-.38)assert.ok(legal(posed));
    game.step(.05,{x:1,y:1,cameraYaw:0});
  }
  assert.equal(game.player.x,3.8);assert.equal(game.player.z,19);
  for(let frame=0;frame<35&&game.state!=='map-clear';frame++){
    if(game.state==='upgrade')game.choose(game.choices[0].id);else game.step(.05);
  }
  assert.equal(game.state,'map-clear');assert.equal(game.mapResult.companion,'saria');
  assert.equal(view.sariaRescuePose(game),null);
});

test('reduced motion keeps the rescue story with no extra copy of the player',()=>{
  const {view}=make(true);
  const game={time:1,state:'running',arenaLimit:23,player:{x:0,z:0},companions:[],groundAt:()=>0};
  view.startSariaRescue(game,{duration:3.6});
  assert.equal(view.sariaRescuePose(game),null);
  game.companions=[{id:'saria',hero:'saria',x:1,z:1}];
  view.startSariaRescue(game,{duration:3.6});
  const start=view.sariaRescuePose(game);
  game.time=1.46;const halfway=view.sariaRescuePose(game);
  assert.ok(Math.abs(halfway.x-(1+start.x)/2)<1e-8);
  assert.ok(Math.abs(halfway.z-(1+start.z)/2)<1e-8);
});

test('the muted scene opens no audio context and the audible scene schedules six ocarina pitches',()=>{
  const pitches=[],starts=[],envelopes=[];
  function Audio(){
    this.currentTime=10;this.destination={};
    this.createGain=()=>({gain:{setValueAtTime(value,at){envelopes.push([value,at]);},
      exponentialRampToValueAtTime(value,at){envelopes.push([value,at]);}},connect(){}});
    this.createOscillator=()=>({frequency:{setValueAtTime(hz){pitches.push(hz);}},
      connect(){},start(at){starts.push(at);},stop(){}});
  }
  const context={window:{AudioContext:Audio},storage:{volume:.6},soundEnabled:false,audio:null,masterGain:null};
  const song=source.match(/^  const SARIA_SONG=[^\n]+/m)[0];
  const start=source.indexOf('  function sound('),end=source.indexOf('  function updateSoundButton()',start);
  vm.createContext(context);vm.runInContext(song+'\n'+source.slice(start,end),context);
  context.sound('sariaSong');assert.equal(context.audio,null);assert.equal(pitches.length,0);
  context.soundEnabled=true;context.sound('sariaSong');
  assert.deepEqual(pitches.filter((_,i)=>i%2===0),[349.23,440,493.88,349.23,440,493.88]);
  assert.equal(starts.length,12);assert.ok(Math.abs(starts[10]-starts[0]-1.14)<1e-8);
  assert.deepEqual(envelopes[0],[.6,10]);
});
