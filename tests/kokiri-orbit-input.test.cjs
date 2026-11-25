const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const { Game,Terrain,clamp }=require('../core.js');
const BonkCamera=require('../camera.js');
const { DEFAULT_BINDINGS,Profile }=require('../profile.js');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
function boot(options={}){
  const hooks=new Map(),docHooks=new Map(),windowHooks=new Map(),game=new Game('link',30,{mode:'adventure'});
  const bodyClasses=new Set(),nodes=new Map(),toasts=[];
  game.spawnTimer=999;game.rendered=null;
  const world={
    addEventListener:(n,h)=>hooks.set(n,h),
    setPointerCapture:n=>world.captured=n,
    focus(){},
    requestPointerLock(){
      world.lockRequests=(world.lockRequests||0)+1;
      if(options.reject)return Promise.reject(new Error('Not allowed'));
      if(!options.asyncLock)document.pointerLockElement=world;
    },
  };
  const view={yaw:0,pitch:.78,distance:30,render(game){game.rendered={yaw:view.yaw,pitch:view.pitch};}};
  const document={pointerLockElement:null,addEventListener:(n,h)=>docHooks.set(n,h),
    body:{classList:{toggle:(cls,on)=>on?bodyClasses.add(cls):bodyClasses.delete(cls)}},
    exitPointerLock(){document.pointerLockElement=null;document.exitCalls=(document.exitCalls||0)+1;}
  };
  const $=id=>{
    if(id==='world')return world;if(id==='moon-flash') return null;
    if(!nodes.has(id))nodes.set(id,{style:{},showModal(){this.open=true;},close(){this.open=false;}});
    return nodes.get(id);
  };
  const scope={
    view,game,Terrain,BonkCamera,document,clamp,
    storage:{bindings:DEFAULT_BINDINGS,mouseMode:options.free?'free':new Profile().mouseMode,sensitivity:1,invertY:false},
    keys:new Set(),stick:{x:0,y:0},touchGlide:false,innerWidth:1000,dialogStack:[],dialogOwnsPause:false,pendingBinding:null,
    lastTime:0,titleTime:0,hudTime:0,accumulator:0,wheelSaveTimer:null,
    $,requestAnimationFrame(){},handleEvents(){},updateHud(){},saveCheckpoint(){},setTimeout(){},clearTimeout(){},
    setPreference(){},toast(message){toasts.push(message);},
    window:{addEventListener:(n,h)=>windowHooks.set(n,h)},
  };
  const chunk=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
  vm.createContext(scope);
  vm.runInContext([
    chunk('  let cameraPointer=','  document.addEventListener(\'keydown\''),
    chunk('  function currentDialog(', '  function previewRealm('),
    chunk('  function pause(', '  function selectHero('),
    chunk('  function held(', '  function applyPreferences('),
    chunk('  window.addEventListener(\'keydown\',event=>{if(event.code', '  window.addEventListener(\'storage\''),
    'this.draw=frame;this.show=openDialog;this.closeMenu=closeDialog;'
  ].join('\n'),scope);
  const down=(event)=>hooks.get('pointerdown')(event||{pointerType:'mouse',button:0});
  const changed=()=>docHooks.get('pointerlockchange')();
  return {view,world,document,game,docHooks,windowHooks,scope,bodyClasses,toasts,$,move:(event)=>hooks.get('pointermove')(event),down,changed,wheel:(event)=>hooks.get('wheel')(event),draw:(ms)=>scope.draw(ms),contextMenu:(ev)=>hooks.get('contextmenu')(ev)};
}

test('real Kokiri input handlers orbit the view and rotate walking instead of only moving a HUD camera value',()=>{
  const {game,scope,view,move,draw,wheel}=boot();
  assert.equal(game.realm,Terrain.KOKIRI_REALM);
  game.player.x=0;game.player.z=0;
  move({pointerType:'mouse',clientX:500,movementX:-Math.PI/(2*.0035),movementY:45});
  scope.keys.add(DEFAULT_BINDINGS.up);draw(40);
  assert.ok(Math.abs(game.cameraYaw-Math.PI/2)<1e-9);
  assert.ok(game.player.x<-.2&&Math.abs(game.player.z)<1e-7,'W follows the new camera direction');
  assert.ok(game.rendered.pitch>.9);
  let blockedDefault=false;wheel({deltaY:100,preventDefault(){blockedDefault=true;}});
  assert.equal(blockedDefault,true);assert.ok(view.distance>30);
  move({pointerType:'mouse',clientX:0,movementX:0,movementY:0});
  draw(80);
  assert.ok(view.yaw>Math.PI/2,'edge turns are enabled');
});

test('Kokiri does not release mouse lock and pinch-free touch swipe still rotates in the Deku interior',()=>{
  const locked=boot();
  locked.down({pointerType:'mouse',button:0});
  locked.docHooks.get('pointerlockchange')();
  locked.move({pointerType:'mouse',clientX:500,movementX:70,movementY:-10});
  assert.equal(locked.view.yaw,0,'pointermove does not double up native relative mouse events');
  locked.docHooks.get('mousemove')({movementX:70,movementY:-10});
  locked.draw(40);
  assert.equal(locked.world.lockRequests,1);
  assert.equal(locked.bodyClasses.has('cursor-captured'),true);
  assert.equal(locked.document.pointerLockElement,locked.world);
  assert.ok(locked.game.rendered.yaw<-.2);
  const touch=boot();
  touch.game.landmark={style:'roots'};
  touch.down({pointerType:'touch',button:0,pointerId:8,clientX:110,clientY:90});
  touch.move({pointerType:'touch',pointerId:8,clientX:160,clientY:130});
  touch.draw(40);
  assert.equal(touch.world.captured,8);assert.equal(touch.world.lockRequests,undefined);assert.ok(touch.game.rendered.yaw<-.17);assert.ok(touch.game.rendered.pitch>.89);
});


test('Escape releases the native cursor, opens pause and waits for another deliberate click on resume',()=>{
  const b=boot();
  b.down();b.changed();assert.equal(b.document.pointerLockElement,b.world);
  let suppressed=false;
  b.windowHooks.get('keydown')({code:'Escape',preventDefault(){suppressed=true;}});
  b.changed();assert.equal(suppressed,true);assert.equal(b.document.pointerLockElement,null);
  assert.equal(b.bodyClasses.has('cursor-captured'),false);assert.equal(b.game.state,'paused');assert.equal(b.$('pause-dialog').open,true);
  b.down();assert.equal(b.world.lockRequests,1,'pause overlay cannot capture');
  b.scope.closeMenu();assert.equal(b.game.state,'running');assert.equal(b.document.pointerLockElement,null);
  b.down();b.changed();assert.equal(b.world.lockRequests,2);
  b.document.pointerLockElement=null;b.changed();assert.equal(b.game.state,'paused','browser consuming Escape also opens pause');
});

test('entering a modal cancels a pending pointer capture, even if permission arrives after resume',()=>{
  const b=boot({asyncLock:true});
  b.down();b.down();assert.equal(b.world.lockRequests,1,'one outstanding request');
  b.scope.show('map-dialog');b.scope.closeMenu();assert.equal(b.game.state,'running');
  b.document.pointerLockElement=b.world;b.changed();b.changed();
  assert.equal(b.document.exitCalls,1);assert.equal(b.document.pointerLockElement,null);
  assert.equal(b.bodyClasses.has('cursor-captured'),false);assert.equal(b.game.state,'running','programmatic release does not reopen pause');
});

test('run completion shows the cursor immediately, and right-click target lock is preserved',()=>{
  const b=boot();
  b.down();b.changed();
  let targets=0,prevented=false;b.game.lockTarget=()=>targets++;
  b.contextMenu({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(targets,1);
  b.game.state='lost';b.draw(40);b.changed();
  assert.equal(b.document.pointerLockElement,null);assert.equal(b.bodyClasses.has('cursor-captured'),false);
  b.down();assert.equal(b.world.lockRequests,1);
});

test('a rejected pointer capture keeps a visible cursor and working free look',async ()=>{
  const b=boot({reject:true});b.down();await Promise.resolve();await Promise.resolve();
  assert.equal(b.document.pointerLockElement,null);assert.equal(b.bodyClasses.has('cursor-captured'),false);
  assert.match(b.toasts[0],/Free mouse look still works/);
  assert.match(b.$('camera-controls-hint').textContent,/Mouse to look/);
  b.move({pointerType:'mouse',clientX:400,movementX:60,movementY:0});
  assert.ok(b.view.yaw<-.2);
});

test('capture defaults on for old saves but explicitly choosing Free survives a save round-trip',()=>{
  assert.equal(new Profile().mouseMode,'locked');
  assert.equal(new Profile({mouseMode:'free'}).mouseMode,'locked');
  const free=Profile.import(JSON.stringify(new Profile({mouseMode:'free',mouseModeChosen:true})));
  assert.equal(free.mouseMode,'free');assert.equal(free.mouseModeChosen,true);
  const b=boot({free:true});b.down();
  assert.equal(b.world.lockRequests,undefined);assert.equal(b.bodyClasses.has('cursor-captured'),false);
});
