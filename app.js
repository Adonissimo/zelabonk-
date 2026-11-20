(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  if(!window.BonkCore||!window.BonkProfile||!window.RelicArt||!window.THREE){$('error-screen').hidden=false;return;}
  const { Game, HEROES, REALMS, GATES, UPGRADES, BOSSES, PERMANENT, ENEMIES, Terrain, Combat, ARENA_LIMIT, seeded, clamp } = BonkCore;
  const {Profile,DEFAULT_BINDINGS,validBinding}=BonkProfile;
  const ICONS = {
    relic:'<path d="m12 2 5 8H7Zm-5 8 5 9H2Zm10 0 5 9H12Z"/>',
    sword:'<path d="m14 4 6-1-1 6-9 9-4-4Z"/><path d="m4 12 8 8M3 21l5-5"/>',
    shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m9 12 2 2 4-5"/>',
    leaf:'<path d="M20 3C10 2 3 6 4 13c1 6 9 8 13 2 2-3 2-8 3-12ZM3 21 15 9"/>',
    orbit:'<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-35 12 12)"/><circle cx="19" cy="6" r="2" fill="currentColor"/>',
    bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
    heart:'<path d="M20 5c-3-3-7-1-8 1-2-3-6-4-9-1-4 5 4 11 9 15 5-4 12-10 8-15Z"/>',
    wind:'<path d="M3 8h12c5 0 5-6 1-6-2 0-3 1-3 2M2 12h17c4 0 4 6 0 6-2 0-3-1-3-2M5 16h5c4 0 4 6 0 6"/>',
    magnet:'<path d="M5 3v10a7 7 0 0 0 14 0V3h-5v10a2 2 0 0 1-4 0V3Z"/><path d="M5 7h5m4 0h5"/>',
    plus:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/>',
    sprout:'<path d="M12 22V11C12 4 4 3 2 3c0 7 4 10 10 8Zm0 5c0-8 6-11 10-11 0 7-4 10-10 11Z"/>',
    boot:'<path d="M7 3h8v9l6 4v5H3v-7l4-1Z"/><path d="M3 17h18M10 6h5m-5 4h5"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    mute:'<path d="M11 4 5 9H2v6h3l6 5ZM17 9l5 6m0-6-5 6"/>',
    sound:'<path d="M11 4 5 9H2v6h3l6 5Zm4 4c3 2 3 6 0 8m3-12c6 4 6 12 0 16"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 9c0-4 7-4 6 0-1 2-3 1-3 5m0 3v.1"/>',
    fullscreen:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    pause:'<path d="M7 4v16M17 4v16"/>',
    map:'<path d="m3 5 6-2 6 3 6-2v16l-6 2-6-3-6 2Zm6-2v16m6-13v16"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    moon:'<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
    compass:'<circle cx="12" cy="12" r="10"/><path d="m16 7-2 7-7 3 3-7Z"/>',
    wing:'<path d="M2 11 12 5l10 6-10 7Zm10-6v13M2 11l3 7 7-3 7 3 3-7"/>',
    flame:'<path d="M13 2c2 7 7 9 7 13a8 8 0 1 1-16 0c0-3 2-6 5-8-1 7 6 5 4-5Z"/>',
    wave:'<path d="M2 8c4-6 6 6 10 0s6 6 10 0M2 15c4-6 6 6 10 0s6 6 10 0"/>',
    settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
    save:'<path d="M4 3h13l4 4v14H3V3Zm3 0v6h10V3M7 21v-8h10v8"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    tree:'<path d="m12 2-7 9h4l-6 7h18l-6-7h4Zm0 16v4"/>'
  };
  const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.relic}</svg>`;
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); delete el.dataset.icon; });
  const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion=systemMotion.matches;
  const touch=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  let view,game=null,selectedHero='link',selectedMode='adventure',selectedDifficulty='normal',titleTime=0,lastTime=0,hudTime=0,accumulator=0,loadoutKey='',soundEnabled=false,audio=null,masterGain=null;
  let toastTimer,announcementTimer,endingShown=false,endReadyAt=0,upgradeReadyAt=0,lastOutcome=null,banishMode=false,touchGlide=false,checkpointSavedRevision=0,checkpointSaving=false,profileBusy=false,pendingStart=null,pendingImport=null,pendingImportFingerprint='',journalTab='heroes',storageWarning='',storageAvailable=true;
  const keys=new Set(),stick={x:0,y:0},dialogStack=[];
  let dialogOwnsPause=false,pendingBinding=null,wheelSaveTimer=null,wasPointerLocked=false;
  let storage;
  const SAVE_KEY='zeldabonk-save-v2',BACKUP_KEY='zeldabonk-save-v2-backup';
  function readProfile(){
    if(!storageAvailable)return storage||new Profile();
    try{const text=localStorage.getItem(SAVE_KEY);if(text)return Profile.import(text);const old=localStorage.getItem('relic-wilds-v1');return old?Profile.migrate(JSON.parse(old)):new Profile();}
    catch(error){
      /* Private browsing still supports a full run. */
      try{const original=localStorage.getItem(SAVE_KEY);if(original){localStorage.setItem(BACKUP_KEY,original);storageWarning='A damaged save was backed up. You can start a new adventure.';}else{storageAvailable=false;storageWarning='Browser storage is unavailable. Export your progress before closing.';}}
      catch(_){storageAvailable=false;storageWarning='Browser storage is unavailable. Export your progress before closing.';}
      return typeof storage!=='undefined'&&storage?storage:new Profile();
    }
  }
  storage=readProfile();soundEnabled=storage.sound;reducedMotion=systemMotion.matches||storage.motion==='reduced';
  const formatTime=time=>Math.floor(time/60)+':'+String(Math.floor(time%60)).padStart(2,'0');
  const imageURLs=new Map();
  function artURL(kind,id,frame=0,action='idle'){const key=[kind,id,frame,action].join(':');if(!imageURLs.has(key))imageURLs.set(key,RelicArt.canvas(kind,id,0,frame,action).toDataURL());return imageURLs.get(key);}
  function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3400);}
  function persist(profile){
    storage=profile;
    if(storageAvailable)try{localStorage.setItem(SAVE_KEY,JSON.stringify(profile));}
    catch(_){/* Scores are optional when storage is unavailable. */storageAvailable=false;storageWarning='Progress is held in memory. Export it before closing this page.';toast(storageWarning);}
  }
  async function profileTransaction(change){
    const perform=()=>{const latest=readProfile(),result=change(latest);persist(latest);updateProfileUI();return result;};
    if(navigator.locks?.request)return navigator.locks.request(SAVE_KEY,perform);
    return perform();
  }
  function announce(realm){$('realm-announcement-name').textContent=realm.name;$('realm-announcement-subtitle').textContent=realm.subtitle;$('realm-announcement').classList.add('visible');clearTimeout(announcementTimer);announcementTimer=setTimeout(()=>$('realm-announcement').classList.remove('visible'),2300);}
  function sound(type){
    if(!soundEnabled)return;
    try{
      if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();masterGain=audio.createGain();masterGain.connect(audio.destination);}
      masterGain.gain.setValueAtTime(soundEnabled?storage.volume:0,audio.currentTime);if(audio.state==='suspended')audio.resume();
      const tones={shoot:[540,300,.055,.018,'sine'],leaf:[760,430,.08,.015,'sine'],bomb:[150,100,.18,.03,'triangle'],boomerang:[500,800,.17,.02,'sine'],collect:[1000,1500,.05,.023,'sine'],hurt:[140,65,.18,.08,'triangle'],dash:[190,490,.15,.04,'sine'],jump:[250,480,.12,.025,'sine'],level:[540,1080,.5,.07,'sine'],choose:[660,990,.25,.05,'sine'],nova:[180,800,.4,.065,'triangle'],explosion:[130,40,.4,.06,'triangle'],shrine:[440,1320,.8,.06,'sine'],travel:[300,900,.6,.055,'sine'],boss:[130,50,1.1,.08,'triangle'],pop:[310,140,.07,.016,'sine'],warning:[220,180,.2,.025,'triangle'],slam:[100,35,.35,.08,'triangle'],evolve:[440,1760,.8,.065,'sine'],end:[320,160,.7,.06,'sine'],purchase:[660,880,.3,.045,'sine']};
      const play=(note,start)=>{const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type=note[4];oscillator.frequency.setValueAtTime(note[0],start);oscillator.frequency.exponentialRampToValueAtTime(Math.max(1,note[1]),start+note[2]);gain.gain.setValueAtTime(note[3],start);gain.gain.exponentialRampToValueAtTime(.001,start+note[2]);oscillator.connect(gain);gain.connect(masterGain);oscillator.start(start);oscillator.stop(start+note[2]);};
      if(type==='guardian'||type==='victory'){[440,554,659,880].forEach((frequency,i)=>play([frequency,frequency*1.005,.25,.045,'sine'],audio.currentTime+i*.12));return;}
      if(tones[type])play(tones[type],audio.currentTime);
    }catch(_){/* Audio support is optional. */}
  }
  function updateSoundButton(){
    $('sound-button').innerHTML=icon(soundEnabled?'sound':'mute');$('sound-button').setAttribute('aria-label',soundEnabled?'Mute sound':'Enable sound');$('sound-button').setAttribute('aria-pressed',String(soundEnabled));
    if(masterGain&&audio)masterGain.gain.setValueAtTime(soundEnabled?storage.volume:0,audio.currentTime);
    document.body.classList.toggle('reduce-motion',reducedMotion);
  }

  // All meshes reuse geometry and materials. Realm changes dispose only local geometry.
  class WorldView {
    constructor() {
      this.renderer = new THREE.WebGLRenderer({ canvas: $('world'), antialias: false, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.4 : 1.75));
      this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#d4e8d3'); this.scene.fog = new THREE.Fog('#cadfc6', 75, 190);
      this.camera = new THREE.PerspectiveCamera(39, innerWidth / innerHeight, .1, 360);
      this.ambient = new THREE.HemisphereLight('#fffae4', '#587359', 1.5); this.scene.add(this.ambient);
      this.sun = new THREE.DirectionalLight('#fff2d1', 1.1); this.sun.position.set(-17, 35, 12); this.sun.castShadow = true; this.sun.shadow.mapSize.set(1024, 1024); Object.assign(this.sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 100 }); this.sun.shadow.normalBias = .08; this.sun.shadow.bias = -.0005; this.scene.add(this.sun); this.scene.add(this.sun.target);
      this.geometries = { sphere: new THREE.IcosahedronGeometry(1, 1), lowSphere: new THREE.IcosahedronGeometry(1, 0), box: new THREE.BoxGeometry(1, 1, 1), cone: new THREE.ConeGeometry(1, 1, 6), cylinder: new THREE.CylinderGeometry(1, 1, 1, 8), disc: new THREE.CircleGeometry(1, 20), diamond: new THREE.OctahedronGeometry(1), torus: new THREE.TorusGeometry(1, .09, 5, 24) };
      this.materials = new Map(); this.environment = new THREE.Group(); this.scene.add(this.environment); this.entities = new THREE.Group(); this.scene.add(this.entities);
      this.enemies = new Map(); this.projectiles = new Map(); this.shards = new Map(); this.hazards = new Map(); this.loot = new Map(); this.effects = []; this.orbits = [];
      this.dummy = new THREE.Object3D(); this.realm = -1; this.hero = null; this.heroId = null; this.cameraTarget = new THREE.Vector3(); this.lastPlayer = { x: 0, z: 0 }; this.shake = 0; this.elapsed = 0; this.yaw = Math.PI / 4; this.pitch = .78; this.distance = storage.cameraDistance;
      this.damageCanvas = document.createElement('canvas'); this.damageCanvas.width = 128; this.damageCanvas.height = 64;
      this.makeHero('link'); this.buildRealm(6); this.resize(); this.titlePose(0);
      this.renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); if (game) game.pause(); $('error-message').textContent = 'The graphics connection was lost. Reload to start a new adventure.'; $('error-screen').hidden = false; });
    }
    applySettings(){
      const quality=storage.graphics;
      if(this.quality!==quality){this.quality=quality;const ratio={low:.85,balanced:1.25,high:1.8}[quality];this.renderer.setPixelRatio(Math.min(devicePixelRatio,ratio));this.renderer.shadowMap.enabled=quality!=='low';this.sun.shadow.mapSize.set(quality==='high'?2048:1024,quality==='high'?2048:1024);if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.resize();}
      this.camera.fov=storage.cameraFov;this.camera.updateProjectionMatrix();if(this.savedDistance!==storage.cameraDistance){this.distance=storage.cameraDistance;this.savedDistance=storage.cameraDistance;}
      if(this.motes)this.motes.visible=quality!=='low'&&!reducedMotion;
    }
    mat(color, opts = {}) {
      const key = color + JSON.stringify(opts); if (!this.materials.has(key)) { const material = opts.basic ? new THREE.MeshBasicMaterial({ color, transparent: !!opts.opacity, opacity: opts.opacity ?? 1, side: opts.side || THREE.FrontSide, depthWrite: !opts.opacity }) : new THREE.MeshToonMaterial({ color, ...opts }); this.materials.set(key, material); }
      return this.materials.get(key);
    }
    mesh(type, color, scale = [1, 1, 1], pos = [0, 0, 0], parent = null, options = {}) {
      const mesh = new THREE.Mesh(this.geometries[type], this.mat(color, options)); mesh.scale.set(...scale); mesh.position.set(...pos);if(parent===this.environment)mesh.position.y+=Terrain.height(this.realm,this.levelStage||1,pos[0],pos[2]); if (parent) parent.add(mesh); return mesh;
    }
    shadow(parent, radius = .65, opacity = .18) { const m = this.mesh('disc', '#183b37', [radius, radius * .7, 1], [0, .025, 0], parent, { basic: true, opacity }); m.rotation.x = -Math.PI / 2; return m; }
    terrainMaterial(index,stone=false) { const key='terrain:'+index+':'+stone;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshLambertMaterial({map:RelicArt.terrain(index,stone)}));return this.materials.get(key); }
    makeHero(id) {
      if (this.hero) this.scene.remove(this.hero);
      if (this.heroShadow) this.scene.remove(this.heroShadow);
      this.heroId = id;
      this.hero = new THREE.Group(); this.heroRig = new THREE.Group(); this.hero.add(this.heroRig); this.scene.add(this.hero);
      this.heroSprite = RelicArt.sprite('hero', id, 1.8, 2.4); this.heroRig.add(this.heroSprite);
      this.heroShadow = new THREE.Group(); this.scene.add(this.heroShadow); this.shadow(this.heroShadow, .7, .22);
      this.glider = new THREE.Group(); this.glider.position.y = 2.7; this.hero.add(this.glider); this.glider.visible = false;
      this.mesh('box', '#d9bd77', [3.1,.08,1.3], [0,0,0], this.glider);
      this.mesh('box', '#588ca3', [2.9,.025,.3], [0,.06,.1], this.glider);
      for (const x of [-1,1]) this.mesh('cylinder', '#7b6049', [.025,1.3,.025], [x*.55,-.65,0], this.glider).rotation.z = -x*.5;
    }
    instanced(type, color, transforms, parent = this.environment, castShadow = false) {
      if (!transforms.length) return;
      const inst = new THREE.InstancedMesh(this.geometries[type], this.mat(color), transforms.length);
      transforms.forEach((t, i) => { this.dummy.position.set(t.x, t.y+(parent===this.environment?Terrain.height(this.realm,this.levelStage||1,t.x,t.z):0), t.z); this.dummy.scale.set(t.sx || 1, t.sy || 1, t.sz || 1); this.dummy.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0); this.dummy.updateMatrix(); inst.setMatrixAt(i, this.dummy.matrix); if (t.color) inst.setColorAt(i, new THREE.Color(t.color)); });
      inst.castShadow = castShadow; inst.receiveShadow = true; parent.add(inst); return inst;
    }
    clearGroup(group) { while (group.children.length) { const child=group.children[0];child.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.dispose();});group.remove(child); } }
    buildRealm(index,stage=1) {
      this.realm = index; this.levelStage=stage; this.clearGroup(this.environment); this.portalGroups = []; this.floating = []; this.water = null;
      const r = REALMS[index], rand = seeded(1977 + index * 391+stage*577), env = this.environment;
      this.scene.background.set(r.sky); this.scene.fog.color.set(r.fog); this.ambient.color.set(index === 2 ? '#c7c7ef' : index === 4 ? '#ffe2bc' : '#fff8e3'); this.ambient.groundColor.set(index === 2 ? '#4d4365' : '#657354'); this.sun.color.set(index === 2 || index === 5 ? '#e1dcff' : '#fff0ca');
      const groundTexture = RelicArt.terrain(index); groundTexture.repeat.set(72,72);
      if(!this.geometries.ground)this.geometries.ground=new THREE.PlaneGeometry(320,320,160,160);
      const vertices=this.geometries.ground.attributes.position;for(let i=0;i<vertices.count;i++)vertices.setZ(i,Terrain.height(index,stage,vertices.getX(i),-vertices.getY(i)));vertices.needsUpdate=true;this.geometries.ground.computeVertexNormals();
      const ground = new THREE.Mesh(this.geometries.ground, this.terrainMaterial(index));
      ground.rotation.x = -Math.PI/2; ground.position.y = -.03; ground.receiveShadow = true; env.add(ground);
      const wallMaterial = this.terrainMaterial(index,true);
      for (let tier=0;tier<3;tier++) {
        for (let x=-ARENA_LIMIT-30;x<=ARENA_LIMIT+30;x+=10) {
          const wall = new THREE.Mesh(this.geometries.box,wallMaterial); wall.scale.set(10,2.2+tier*1.3,7); wall.position.set(x,1+tier*.65,-ARENA_LIMIT-6-tier*7); wall.castShadow=true; wall.receiveShadow=true; env.add(wall);
          const top = this.mesh('box',r.ground,[10.1,.18,7.1],[x,2.2+tier*1.3,-ARENA_LIMIT-6-tier*7],env); top.receiveShadow=true;
        }
      }
      for(const side of [-1,1]) for(let z=-ARENA_LIMIT;z<=ARENA_LIMIT;z+=10){const wall=new THREE.Mesh(this.geometries.box,wallMaterial);wall.scale.set(5,2.1,10);wall.position.set(side*(ARENA_LIMIT+6),1,z);wall.castShadow=true;env.add(wall);this.mesh('box',r.ground,[5.1,.2,10.1],[side*(ARENA_LIMIT+6),2.12,z],env);}
      const grass = [], rocks = [], trunks = [], leaves = [], flowers = [], path = [];
      for (let i = 0; i < 360; i++) {
        const x = (rand() - .5) * 155, z = (rand() - .5) * 155;
        if (Math.hypot(x, z) < 10 || GATES.some(g => Math.hypot(g.x - x, g.z - z) < 5)) continue;
        const size = .2 + rand() * .45;
        if (i % 4 === 0) rocks.push({x, y: size * .45, z, sx:size*1.8, sy:size, sz:size*1.5, ry:rand()*6, color:i%8===0?'#aab1a1':'#839488'});
        else grass.push({x,y:size*.35,z,sx:.06,sy:size,sz:.4,ry:rand()*6,color:index===4?'#be9770':index===2?'#a1a0b3':index===5?'#bac5b4':i%2?'#c6cf94':'#718d4e'});
        if (i % 6 === 0) flowers.push({x:x+.3,y:.19,z:z+.2,sx:.12,sy:.12,sz:.12,color:index===2?'#e9b6de':index===4?'#f8c580':i%2?'#fcf3c7':'#e7bd91'});
      }
      this.instanced('lowSphere', '#9da58d', rocks, env, true);
      for(const obstacle of Terrain.layout(index,stage).obstacles){
        if(obstacle.kind==='tree'){const tree=RelicArt.sprite('tree',index===6?0:index,4.1,5.75);tree.position.set(obstacle.x,Terrain.height(index,stage,obstacle.x,obstacle.z),obstacle.z);tree.scale.multiplyScalar(obstacle.scale);env.add(tree);}
        else if(obstacle.kind==='rock')this.mesh('lowSphere','#919a82',[obstacle.radius*1.5,obstacle.height,obstacle.radius*1.5],[obstacle.x,.2,obstacle.z],env);
      }
      for(let i=0;i<(touch?120:190);i++){const x=(rand()-.5)*145,z=(rand()-.5)*145;if(Math.hypot(x,z)<3)continue;const flower=RelicArt.sprite('plant',index,.7,.7);flower.position.set(x,Terrain.height(index,stage,x,z)+.02,z);env.add(flower);}
      for (let i=0;i<3;i++) {
        const g = GATES[i]; for(let k=1;k<12;k++) {const t=k/12;path.push({x:g.x*t+(rand()-.5),y:.015,z:g.z*t+(rand()-.5),sx:.6+rand()*.4,sy:.045,sz:.7+rand()*.4,ry:rand()*6});}
      }
      this.instanced('cylinder',index===4?'#a2947b':'#c4c5a1',path);
      this.buildShrine(r, env);
      GATES.forEach((g, i) => this.buildGate(g, REALMS[r.links[i]], env, i));
      // Each realm has its own skyline and landmark, beyond a palette swap.
      if (index === 0) {
        this.buildRuin(9,-15,1.3,env); this.buildRuin(-11,8,.7,env);
        const castle=new THREE.Group();castle.position.set(-17,0,-26);env.add(castle);this.mesh('box','#c7c7b3',[13,8,5],[0,4,0],castle);for(const x of[-7,7]){this.mesh('cylinder','#d7d4be',[2.5,11,2.5],[x,5.5,0],castle);this.mesh('cone','#60818b',[3.4,5,3.4],[x,13,0],castle);}this.mesh('box','#777c73',[2.6,4,.2],[0,2,2.6],castle);
      }
      if (index === 1) {
        this.water = this.mesh('cylinder','#65b8bc',[24,.12,38],[45,-.05,0],env,{transparent:true,opacity:.87});
        for(let i=0;i<15;i++){const m=this.mesh('box','#e0f0df',[.11,.025,3+rand()*4],[26+rand()*34,.04,-30+rand()*60],env);this.floating.push({mesh:m,base:m.position.y,phase:rand()*6,water:true});}
        const boat=new THREE.Group();boat.position.set(25,.12,3);boat.rotation.y=-.3;env.add(boat);this.mesh('sphere','#a84535',[1.3,.45,3], [0,0,0],boat);this.mesh('cylinder','#72634c',[.07,5,.07],[0,2.5,0],boat);const sail=this.mesh('cone','#f4e4b9',[1.8,3.6,.07],[.4,3.2,0],boat);sail.rotation.z=-.25;this.floating.push({mesh:boat,base:.12,phase:1});this.buildRuin(-12,-11,.8,env);
      }
      if (index === 2) {
        for(let i=0;i<10;i++){const a=i*.628,x=Math.cos(a)*30,z=Math.sin(a)*30;this.mesh('diamond','#777090',[1.6,5+rand()*4,1.6],[x,3,z],env);const shard=this.mesh('diamond','#e7ab8d',[.3,.8,.3],[x,8+rand()*2,z],env,{emissive:'#a85546',emissiveIntensity:.35});this.floating.push({mesh:shard,base:shard.position.y,phase:rand()*6});}
        this.buildRuin(11,-13,1.5,env); const moon=this.mesh('sphere','#e9d4bc',[6,6,6],[-28,28,-49],env,{basic:true});
        const mirror=new THREE.Group();mirror.position.set(-15,3,-18);env.add(mirror);this.mesh('torus','#bda88f',[3.2,3.2,.5],[0,0,0],mirror);this.mesh('disc','#82aaa7',[2.8,2.8,1],[0,0,0],mirror,{basic:true,opacity:.7,side:THREE.DoubleSide});for(const x of[-3.3,3.3])this.mesh('box','#787383',[.8,7,1],[x,-.1,0],mirror);
      }
      if (index === 3) {
        const statue=new THREE.Group();statue.position.set(-12,2,-22);env.add(statue);this.mesh('cone','#bcc4b3',[2.2,5,1.6],[0,2.5,0],statue);this.mesh('sphere','#ccd0bd',[.9,1.1,.85],[0,5.7,0],statue);for(const side of [-1,1])this.mesh('box','#cbd1bc',[3,2.6,.5],[side*2.1,4.2,-.5],statue).rotation.z=-side*.48;
        for(let i=0;i<11;i++){const a=i*.571,rad=36+rand()*20,x=Math.cos(a)*rad,z=Math.sin(a)*rad,y=3+rand()*12;this.mesh('cone','#8a9b8d',[5+rand()*4,9+rand()*8,5+rand()*4],[x,y-6,z],env).rotation.z=Math.PI;this.mesh('cylinder','#b0c790',[6,.55,6],[x,y,z],env);const cloud=this.mesh('sphere','#eff6e7',[9,2,6],[x+3,y-5,z+1],env);this.floating.push({mesh:cloud,base:y-5,phase:a});}
        this.buildRuin(-12,-11,1,env);this.buildRuin(10,8,.65,env);
        const arch = this.mesh('torus','#c7c9a8',[5,5,1],[0,7,-28],env);arch.rotation.y=.4;
      }
      if (index === 4) {
        for(let i=0;i<16;i++){const a=i*.393,rad=28+rand()*15;const m=this.mesh('cone','#4e5356',[4+rand()*3,8+rand()*8,4+rand()*3],[Math.cos(a)*rad,3,Math.sin(a)*rad],env);m.castShadow=true;}
        for(let i=0;i<8;i++)this.mesh('box','#b54366',[.25,.025,8+rand()*5],[(rand()-.5)*45,.035,(rand()-.5)*45],env,{basic:true}).rotation.y=rand()*6;
        this.buildRuin(10,-11,1.3,env);
      }
      if (index === 5) {
        const moon=RelicArt.sprite('moon',0,10,10);moon.position.set(-16,13,-28);env.add(moon);
        const tower=new THREE.Group();tower.position.set(11,0,-22);env.add(tower);this.mesh('box','#a59a7d',[5,11,5],[0,5.5,0],tower);this.mesh('box','#bbae8d',[6,.7,6],[0,10.9,0],tower);this.mesh('cone','#785b70',[4,4,4],[0,13,0],tower);const clock=RelicArt.sprite('clock',0,3.7,3.7);clock.position.set(0,7.1,2.65);tower.add(clock);
        for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.cos(a)*26,z=Math.sin(a)*26;this.mesh('cylinder','#b8bca9',[1.1,9+(i%3)*2,1.1],[x,4,z],env);this.mesh('box','#d9d8b8',[2.8,.65,2.8],[x,8.8+(i%3),z],env);}
        const ring=this.mesh('torus','#e4d5a1',[6,6,.5],[0,7,-29],env);ring.rotation.x=.25;this.floating.push({mesh:ring,base:7,phase:1,rotate:true});this.mesh('sphere','#f3eac9',[5,5,5],[-35,32,-55],env,{basic:true});this.buildRuin(11,7,.7,env);
      }
      // Mountains and clouds make the horizon feel continuous beyond the arena.
      if(index===6){
        const deku=RelicArt.sprite('tree',6,12,16);deku.position.set(-21,0,-22);env.add(deku);
        for(let i=0;i<3;i++){const x=-19+i*18,z=14+(i%2)*8;this.mesh('cylinder','#987345',[3.2,4,3.2],[x,2,z],env);this.mesh('cone','#5c8152',[4.5,3,4.5],[x,5,z],env);this.mesh('box','#443e31',[1.1,2,.18],[x,1,z+3.15],env);this.mesh('box','#d8c487',[.8,.8,.12],[x+1.6,2.6,z+2.8],env);}
      }
      if(index===7){
        const lake=this.mesh('cylinder','#559eb8',[27,.1,45],[49,-.05,0],env,{transparent:true,opacity:.9});
        for(let i=0;i<9;i++)this.mesh('box','#d7e9d9',[.08,.03,4],[30+i*3,.05,-15+i*4],env);
        this.buildRuin(-13,-19,1.3,env);this.mesh('box','#adbaa8',[8,1,5],[19,.4,-19],env);for(const x of[16,22])this.mesh('cylinder','#cbd0b4',[.7,7,.7],[x,3.5,-20],env);
      }
      if(index===1){const tower=new THREE.Group();tower.position.set(32,0,-26);env.add(tower);for(let i=0;i<4;i++)this.mesh('cylinder','#ccc6a4',[5-i*.7,3,5-i*.7],[0,1.5+i*3,0],tower);this.mesh('box','#60787e',[1.6,3,.2],[0,7,3.7],tower);}
      if(index===4){const lightroot=new THREE.Group();lightroot.position.set(-16,0,-19);env.add(lightroot);this.mesh('cylinder','#b8bc8e',[.9,8,.9],[0,4,0],lightroot);for(const s of[-1,1]){const branch=this.mesh('cylinder','#bdc7a2',[.4,5,.4],[s*1.5,7,0],lightroot);branch.rotation.z=s*.65;this.mesh('sphere','#e2ecb1',[1.3,1.3,1.3],[s*3,9,0],lightroot,{emissive:'#d7e6a3',emissiveIntensity:.7});}}
      if(stage>1)for(let i=0;i<stage+1;i++){const angle=i*Math.PI*2/(stage+1),x=Math.cos(angle)*13,z=Math.sin(angle)*13;this.buildRuin(x,z,.35+stage*.1,env);}
      const mountains=[],clouds=[];
      for(let i=0;i<20;i++){const a=i*.314; mountains.push({x:Math.cos(a)*145,y:3,z:Math.sin(a)*145,sx:12+rand()*10,sy:14+rand()*14,sz:12+rand()*10,color:index===2?'#7f8198':index===4?'#7b7370':'#a8bfad'});if(i%2===0)clouds.push({x:Math.cos(a)*135,y:20+rand()*10,z:Math.sin(a)*135,sx:8+rand()*7,sy:1.2,sz:3+rand()*2});}
      this.instanced('cone','#b4c6b0',mountains);this.instanced('sphere',index===2?'#9b9bad':'#eef2dd',clouds);
      this.makeMotes(r,index);
    }
    buildRuin(x,z,s,parent) {
      const group=new THREE.Group();group.position.set(x,Terrain.height(this.realm,this.levelStage||1,x,z),z);group.scale.setScalar(s);parent.add(group);
      this.mesh('box','#a6b09c',[5,.4,3],[0,.15,0],group);
      for(const dx of [-1.7,1.7]){this.mesh('box','#c3c6ac',[.85,4,1],[dx,2.2,0],group).castShadow=true;this.mesh('box','#e0d9b7',[1.3,.4,1.4],[dx,4.3,0],group);}
      this.mesh('box','#cdd0b2',[5,.8,1.5],[0,4.7,0],group).castShadow=true;
      for(let i=0;i<4;i++)this.mesh('lowSphere','#b1baa2',[.55,.35,.6],[-2+i*1.2,.35,2+(i%2)],group);
    }
    buildShrine(realm,parent) {
      const group=new THREE.Group();group.position.set(0,0,-7);parent.add(group);this.shrine=group;
      for(let i=0;i<3;i++){const m=this.mesh('cylinder',i===2?'#c6c9b0':'#a4b397',[2.5-i*.4,.22,2.5-i*.4],[0,.11+i*.2,0],group);m.receiveShadow=true;}
      this.mesh('cylinder','#a5b5a7',[.5,1.2,.6],[0,1.17,0],group);
      this.shrineGem=this.mesh('diamond',realm.accent,[.48,.8,.48],[0,2.5,0],group,{emissive:realm.accent,emissiveIntensity:.3});
      this.shrineRing=this.mesh('torus',realm.accent,[1.05,1.05,1.05],[0,2.5,0],group,{basic:true});this.shrineRing.rotation.x=.4;
      for(let i=0;i<4;i++){const a=i*Math.PI/2;this.mesh('box','#b5c1aa',[.27,.75,.27],[Math.cos(a)*1.7,1,Math.sin(a)*1.7],group);}
    }
    buildGate(position,destination,parent,slot) {
      const group=new THREE.Group();group.position.set(position.x,0,position.z);group.rotation.y=Math.atan2(-position.x,-position.z);parent.add(group);
      this.mesh('cylinder','#aab59e',[2.7,.16,2.7],[0,.02,0],group);
      for(const x of [-1.4,1.4]){this.mesh('box','#b8c0a6',[.65,3.7,.8],[x,1.85,0],group).castShadow=true;this.mesh('diamond',destination.accent,[.16,.3,.16],[x,3.9,0],group,{emissive:destination.accent,emissiveIntensity:.5});}
      this.mesh('box','#d0ccb0',[3.8,.6,1],[0,3.6,0],group).castShadow=true;
      const surface=this.mesh('disc',destination.color,[1.28,1.65,1],[0,1.85,0],group,{basic:true,opacity:.46,side:THREE.DoubleSide});
      const ring=this.mesh('torus',destination.accent,[1.13,1.5,1],[0,1.85,.03],group,{basic:true});
      const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=96;const context=labelCanvas.getContext('2d');context.font='800 28px Nunito, sans-serif';context.textAlign='center';context.fillStyle='#fff7da';context.shadowBlur=8;context.shadowColor='#233d34';context.fillText(destination.name.toUpperCase(),256,53);
      const texture=new THREE.CanvasTexture(labelCanvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.SpriteMaterial({map:texture,depthTest:true,transparent:true});const label=new THREE.Sprite(material);label.position.set(0,4.6,0);label.scale.set(5.5,1.03,1);group.add(label);
      this.portalGroups.push({group,surface,ring,label,texture,material,slot});
    }
    makeMotes(realm,index) {
      if(this.motes){this.scene.remove(this.motes);this.motes.geometry.dispose();this.motes.material.dispose();}
      const random=seeded(86+index),positions=new Float32Array(100*3);for(let i=0;i<100;i++){positions[i*3]=(random()-.5)*65;positions[i*3+1]=.5+random()*8;positions[i*3+2]=(random()-.5)*65;}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));this.motes=new THREE.Points(geometry,new THREE.PointsMaterial({color:realm.accent,size:index===4?.09:.075,transparent:true,opacity:.6,depthWrite:false}));this.scene.add(this.motes);this.motes.visible=storage.graphics!=='low'&&!reducedMotion;
    }
    enemyModel(e) {
      const group=new THREE.Group(); this.entities.add(group);
      const height=e.type==='boss'?(BOSSES[e.bossId]?.height||5):e.type==='boar'?2.5:e.type==='bat'?1.65:1.7;
      const sprite=RelicArt.sprite(e.type==='boss'?'boss':'enemy',e.bossId||e.enemyId||e.type,height*.89,height);group.add(sprite);group.userData.sprite=sprite;
      this.shadow(group,e.radius*1.05,.17);if(e.elite)group.scale.setScalar(1.3);return group;
    }
    defeatEffect(event) {
      if(this.effects.length>100)return;
      const type=event.enemyType||'slime',boss=type==='boss',height=boss?(BOSSES[event.bossId]?.height||5):type==='boar'?2.5:1.7;
      const mesh=RelicArt.sprite(boss?'boss':'enemy',event.bossId||event.enemyId||type,height*.89,height);mesh.position.set(event.x,Terrain.height(this.realm,this.levelStage||1,event.x,event.z),event.z);mesh.material=mesh.material.clone();this.entities.add(mesh);
      this.effects.push({mesh,time:boss?1:.65,duration:boss?1:.65,kind:'ghost',actorKind:boss?'boss':'enemy',actorId:event.bossId||event.enemyId||type,material:mesh.material});
      this.popEffect(event.x,event.z,boss?'#f5dc9b':'#d5e6b8');
    }
    ultimateEffect(event) {
      const hero=game.hero,count=reducedMotion||storage.graphics==='low'?3:hero==='midna'?16:10;
      for(let i=0;i<count&&this.effects.length<120;i++){
        const angle=i*Math.PI*2/count,id=hero==='tetra'?'bomb':hero==='sheik'?'boomerang':hero==='zelda'?'leaf':'ember';
        const mesh=RelicArt.sprite('projectile',id,.85,.85);mesh.position.set(event.x,Terrain.height(this.realm,this.levelStage||1,event.x,event.z)+.8,event.z);this.entities.add(mesh);
        this.effects.push({mesh,time:.85,duration:.85,kind:'ultimate',ground:Terrain.height(this.realm,this.levelStage||1,event.x,event.z),hero,angle,x:event.x,z:event.z,radius:reducedMotion?2:event.radius*.75});
      }
      if(hero==='zelda'||hero==='skullkid')this.ringEffect(event.x,event.z,event.color,event.radius*.45,1);
    }
    syncMap(map,items,create,update) {
      const active=new Set();for(const item of items){active.add(item.id);let mesh=map.get(item.id);if(!mesh){mesh=create(item);map.set(item.id,mesh);}update(mesh,item);}
      for(const [id,mesh] of map)if(!active.has(id)){this.entities.remove(mesh);map.delete(id);}
    }
    ringEffect(x,z,color,radius,duration=.5) {
      if(this.effects.length>120)return;
      const mesh=this.mesh('torus',color,[.1,.1,.1],[x,Terrain.height(this.realm,this.levelStage||1,x,z)+.15,z],this.entities,{basic:true,opacity:.75});mesh.rotation.x=-Math.PI/2;
      this.effects.push({mesh,time:duration,duration,radius,kind:'ring'});
    }
    popEffect(x,z,color) {
      if(storage.graphics==='low'||this.effects.length>120)return;
      for(let i=0;i<4;i++){const mesh=this.mesh('lowSphere',color,[.12,.12,.12],[x,Terrain.height(this.realm,this.levelStage||1,x,z)+.55,z],this.entities,{basic:true});const a=i*Math.PI/2+Math.random();this.effects.push({mesh,time:.4,duration:.4,kind:'particle',vx:Math.cos(a)*2.4,vz:Math.sin(a)*2.4,vy:3});}
    }
    damageText(x,z,damage,critical=0) {
      if(storage.graphics==='low'||reducedMotion||this.effects.filter(e=>e.kind==='text').length>14)return;
      const canvas=document.createElement('canvas');canvas.width=192;canvas.height=64;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.font='900 '+(typeof damage==='string'?22:35)+'px Nunito,sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#344b43';const label=String(damage)+(critical===2?'!!':critical?'!':'');ctx.strokeText(label,96,43);ctx.fillStyle=critical===2?'#f0b8f5':critical?'#ffe37c':'#fff3ce';ctx.fillText(label,96,43);
      const texture=new THREE.CanvasTexture(canvas),material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false});const mesh=new THREE.Sprite(material);mesh.position.set(x,Terrain.height(this.realm,this.levelStage||1,x,z)+2,z);mesh.scale.set(2.3,.77,1);this.entities.add(mesh);this.effects.push({mesh,time:.65,duration:.65,kind:'text',texture,material});
    }
    clearDynamic() {
      this.clearGroup(this.entities);for(const map of [this.enemies,this.projectiles,this.shards,this.hazards,this.loot])map.clear();this.orbits=[];this.lockRing=null;for(const e of this.effects){if(e.texture)e.texture.dispose();if(e.material)e.material.dispose();}this.terminalAge=0;this.effects=[];
    }
    resize() { this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix(); }
    titlePose(time) {
      this.hero.position.set(0,0,0);this.hero.rotation.y=-.35;this.heroRig.position.y=reducedMotion?0:Math.sin(time*1.7)*.025;this.heroSprite.material=RelicArt.material('hero',this.heroId,0,RelicArt.animationFrame('idle',time),false,'idle');this.heroSprite.material.opacity=1;this.glider.visible=false;
      const mobile=innerWidth<700;
      const target=new THREE.Vector3(mobile?-3.3:-5.9,0,mobile?1.6:5.6);this.camera.position.set(16,17,19);this.camera.lookAt(target);
      this.hero.scale.setScalar(mobile?1.7:1.7);
    }
    render(game,dt,time) {
      const terminal=game&&['won','lost'].includes(game.state);
      const animate=!game||game.state==='running'||(terminal&&!endingShown)||(game.state==='upgrade'&&time<upgradeReadyAt);
      const effectDt=animate?dt:0;
      if(terminal&&!endingShown)this.terminalAge=(this.terminalAge||0)+dt;
      this.elapsed=game?game.time:time;time=this.elapsed;
      if(game){
        if(this.realm!==game.realm||this.levelStage!==game.stage){this.portalGroups.forEach(p=>{p.texture.dispose();p.material.dispose();});this.clearDynamic();this.buildRealm(game.realm,game.stage);}
        const p=game.player;this.hero.scale.setScalar(1);this.hero.position.set(p.x,p.y+(p.ground||0),p.z);
        const angle=p.facing-this.hero.rotation.y;this.hero.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*Math.min(1,dt*13);
        const moving=Math.hypot(p.x-this.lastPlayer.x,p.z-this.lastPlayer.z)>.001;this.lastPlayer={x:p.x,z:p.z};
        const walking=moving&&p.y===0&&game.state==='running';const action=terminal?(game.state==='won'?'victory':'death'):p.action|| (walking?'walk':'idle');const age=terminal?(this.terminalAge||0):p.actionAge;
        const angleToCamera=((p.facing-this.yaw)%(Math.PI*2)+Math.PI*2)%(Math.PI*2),direction=Math.round(angleToCamera/(Math.PI/2))%4;
        this.heroSprite.material=RelicArt.material('hero',this.heroId,direction,RelicArt.animationFrame(action,age),p.action==='hurt',action);
        this.heroRig.position.y=walking&&!reducedMotion?Math.abs(Math.sin(time*14))*.035:0;
        this.glider.visible=p.gliding;this.glider.rotation.z=Math.sin(time*2)*.04;this.hero.visible=true;this.heroSprite.material.opacity=p.invincible>0&&p.dash<=0?.65+Math.abs(Math.sin(time*15))*.35:1;
        this.heroShadow.position.set(p.x,p.ground||0,p.z);this.heroShadow.scale.setScalar(Math.max(.3,1-p.y*.08));
        const zoom=innerWidth<600?1.12:1,range=this.distance*zoom;const camPos=new THREE.Vector3(p.x+Math.sin(this.yaw)*Math.cos(this.pitch)*range,Math.sin(this.pitch)*range+(p.ground||0),p.z+Math.cos(this.yaw)*Math.cos(this.pitch)*range);this.camera.position.lerp(camPos,1-Math.exp(-6*dt));this.cameraTarget.lerp(new THREE.Vector3(p.x,.4+(p.ground||0),p.z),1-Math.exp(-8*dt));
        if(!reducedMotion&&this.shake>0){this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.z+=(Math.random()-.5)*this.shake;this.shake*=Math.exp(-8*dt);}
        this.camera.lookAt(this.cameraTarget);this.sun.position.set(p.x-17,35+(p.ground||0),p.z+12);this.sun.target.position.set(p.x,p.ground||0,p.z);
        this.syncMap(this.enemies,game.enemies.filter(e=>!e.dead),e=>this.enemyModel(e),(m,e)=>{
          m.position.set(e.x,game.groundAt(e.x,e.z),e.z);const sprite=m.userData.sprite,kind=e.type==='boss'?'boss':'enemy',id=e.bossId||e.enemyId||e.type,action=e.hitFlash>0?'hurt':e.action||'walk';
          sprite.position.y=BOSSES[e.bossId]?.flying?.5+Math.sin(time*3+e.id)*.12:e.type==='bat'?1+Math.sin(time*7+e.id)*.13:0;
          sprite.material=RelicArt.material(kind,id,0,RelicArt.animationFrame(action,e.actionAge||time),e.hitFlash>0,action);
          const status=['freeze','shock','burn','wet'].find(id=>e.statuses?.[id]);
          if(status&&!m.userData.statusRing){const ring=this.mesh('torus','#9ce2ef',[e.radius+.18,e.radius+.18,e.radius+.18],[0,.16,0],m,{basic:true});ring.rotation.x=-Math.PI/2;m.userData.statusRing=ring;}
          if(m.userData.statusRing){m.userData.statusRing.visible=!!status;if(status){m.userData.statusRing.material=this.mat(Combat.STATUS[status].color,{basic:true});m.userData.statusRing.position.y=.16+(reducedMotion?0:Math.sin(time*5)*.07);}}
        });
        if(!this.lockRing){this.lockRing=this.mesh('torus','#ffc778',[1,1,1],[0,.08,0],this.entities,{basic:true});this.lockRing.rotation.x=-Math.PI/2;}
        const locked=game.enemies.find(e=>e.id===game.lockedTarget&&!e.dead);this.lockRing.visible=!!locked;if(locked){this.lockRing.position.set(locked.x,game.groundAt(locked.x,locked.z)+.08,locked.z);this.lockRing.scale.setScalar(locked.radius+.35);}
        this.syncMap(this.shards,game.shards,s=>{const m=this.mesh('diamond',s.value>4?'#e8cd85':'#a5edce',[.17,.3,.17],[s.x,.4,s.z],this.entities,{basic:true});return m;},(m,s)=>{m.position.set(s.x,game.groundAt(s.x,s.z)+.38+Math.sin(time*3+s.id)*.08,s.z);m.rotation.y=time*1.8+s.id;m.scale.setScalar(s.value>4?.4:.25);});
        this.syncMap(this.loot,game.loot,drop=>{
          const group=new THREE.Group(),color=Combat.RARITIES[Combat.item(drop.gearId).rarity].color;this.entities.add(group);
          this.mesh('box','#745137',[.9,.55,.65],[0,.3,0],group);this.mesh('box',color,[.98,.22,.72],[0,.68,0],group);
          this.mesh('box','#f0d78b',[.13,.65,.75],[0,.38,0],group);const ring=this.mesh('torus',color,[.8,.8,.8],[0,.04,0],group,{basic:true});ring.rotation.x=-Math.PI/2;return group;
        },(m,drop)=>{m.position.set(drop.x,game.groundAt(drop.x,drop.z)+(reducedMotion?0:Math.sin(time*2+drop.id)*.05),drop.z);});
        this.syncMap(this.projectiles,game.projectiles,b=>{const sprite=RelicArt.sprite('projectile',b.type,b.type==='hostile'?.65:1,b.type==='hostile'?.65:1);this.entities.add(sprite);return sprite;},(m,b)=>{
          const direction=(Math.round(Math.atan2(b.vz,b.vx)*4/Math.PI)+8)%8,frame=Math.floor((b.age||0)*12)%8;
          m.material=RelicArt.material('projectile',b.type,direction,frame);
          m.position.set(b.x,(b.y??game.groundAt(b.x,b.z)+1)+(b.type==='bomb'?Math.sin(Math.min(1,b.age/1.15)*Math.PI)*2:0),b.z);
        });
        this.syncMap(this.hazards,game.hazards,h=>{const group=new THREE.Group();this.entities.add(group);const disc=this.mesh('disc','#d66b55',[h.radius,h.radius,1],[0,.05,0],group,{basic:true,opacity:.38});disc.rotation.x=-Math.PI/2;const ring=this.mesh('torus','#f6a086',[h.radius,h.radius,h.radius],[0,.06,0],group,{basic:true});ring.rotation.x=-Math.PI/2;group.userData.disc=disc;group.userData.ring=ring;return group;},(m,h)=>{m.position.set(h.x,game.groundAt(h.x,h.z),h.z);m.userData.ring.scale.setScalar(h.radius*clamp(1-h.timer/h.duration,.05,1));m.visible=!h.fired||Math.sin(time*35)>0;});
        const count=game.rank('orbit')?game.rank('orbit')+1:0;
        while(this.orbits.length<count){const m=this.mesh('diamond',game.rank('orbit')===7?'#f5d390':'#c5d4d0',[.3,.44,.3],[0,1,0],this.entities);this.orbits.push(m);}
        this.orbits.forEach((m,i)=>{m.visible=i<count;const a=game.orbitAngle+i*Math.PI*2/count;m.position.set(p.x+Math.cos(a)*2.6,(p.ground||0)+1+Math.sin(time*3+i)*.15,p.z+Math.sin(a)*2.6);m.rotation.set(time,time*.6,0);});
        const shrineReady=!game.shrines.has(game.realm)||(game.mode==='adventure'&&game.realm===0&&game.shrines.size===REALMS.length&&!terminal);this.shrineGem.visible=shrineReady&&!game.boss;this.shrineRing.visible=shrineReady&&!game.boss;this.portalGroups.forEach(portal=>{portal.surface.material.opacity=game.mode==='adventure'&&game.boss?.dead===false?.2:.78;});
      }else this.titlePose(time);
      this.shrineGem.rotation.y=time*.7;this.shrineGem.position.y=2.5+Math.sin(time*1.8)*.16;this.shrineRing.rotation.z=time*.25;
      this.portalGroups.forEach((p,i)=>{p.ring.rotation.z=Math.sin(time*.5+i)*.04;p.surface.scale.x=1.28+Math.sin(time*1.8+i)*.04;});
      this.floating.forEach(f=>{f.mesh.position.y=f.base+Math.sin(time*(f.water?.6:.8)+f.phase)*(f.water?.015:.23);if(f.rotate)f.mesh.rotation.z=time*.06;});
      if(this.motes){this.motes.rotation.y=time*.007;this.motes.position.y=Math.sin(time*.3)*.3;}
      for(const e of this.effects){
        e.time-=effectDt;const t=clamp(1-e.time/e.duration,0,1);
        if(e.kind==='ring')e.mesh.scale.setScalar(.1+e.radius*t);
        else if(e.kind==='particle'){e.mesh.position.x+=e.vx*effectDt;e.mesh.position.z+=e.vz*effectDt;e.mesh.position.y+=e.vy*effectDt;e.vy-=12*effectDt;e.mesh.scale.setScalar(.15*(1-t));}
        else if(e.kind==='text'){e.mesh.position.y+=effectDt*1.7;e.mesh.material.opacity=1-t;}
        else if(e.kind==='ghost'){e.material.map=RelicArt.material(e.actorKind,e.actorId,0,RelicArt.animationFrame('death',t),'','death').map;e.material.opacity=1-t;e.mesh.position.y=Terrain.height(this.realm,this.levelStage||1,e.mesh.position.x,e.mesh.position.z)+(reducedMotion?0:t*.4);}
        else if(e.kind==='ultimate'){const a=e.angle+(e.hero==='link'||e.hero==='midna'?t*5:0),radius=e.radius*Math.sin(t*Math.PI/2);e.mesh.position.set(e.x+Math.cos(a)*radius,(e.ground||0)+(e.hero==='zelda'?1+t*7:e.hero==='tetra'?1+Math.sin(t*Math.PI)*4:1+Math.sin(a*2)*.5),e.z+Math.sin(a)*radius);e.mesh.scale.setScalar(.9*(1-t)+.2);}
      }
      this.effects=this.effects.filter(e=>{if(e.time>0)return true;this.entities.remove(e.mesh);if(e.texture)e.texture.dispose();if(e.material)e.material.dispose();return false;});
      this.renderer.render(this.scene,this.camera);
      if(game){const projected=new THREE.Vector3(game.player.x,game.player.y+(game.player.ground||0)-.25,game.player.z);projected.project(this.camera);$('player-health').style.left=((projected.x*.5+.5)*innerWidth)+'px';$('player-health').style.top=((-projected.y*.5+.5)*innerHeight)+'px';}
    }
  }

  function currentDialog(){return dialogStack.at(-1)||null;}
  function clearInput(){keys.clear();stick.x=stick.y=0;touchGlide=false;$('joystick-knob').style.transform='';}
  function focusWorld(){if(game?.state==='running'&&!currentDialog())$('world').focus({preventScroll:true});}
  function openDialog(id){
    if(currentDialog()===id)return;
    if(document.pointerLockElement)document.exitPointerLock();pendingBinding=null;
    const previous=currentDialog();if(previous)$(previous).close();
    if(!dialogStack.length&&game?.state==='running'){game.pause();dialogOwnsPause=true;}
    dialogStack.push(id);clearInput();$(id).showModal();
  }
  function closeDialog(){
    pendingBinding=null;const id=dialogStack.pop();if(id)$(id).close();
    if(currentDialog()){if(currentDialog()==='inventory-dialog')renderInventory();$(currentDialog()).showModal();}
    else{if(dialogOwnsPause&&game?.state==='paused')game.resume();dialogOwnsPause=false;focusWorld();}
    clearInput();
  }
  function closeAll(){for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();dialogStack.length=0;dialogOwnsPause=false;clearInput();}
  function updateProfileUI(){
    document.querySelectorAll('[data-mode]').forEach(button=>{button.classList.toggle('selected',button.dataset.mode===selectedMode);button.setAttribute('aria-pressed',String(button.dataset.mode===selectedMode));});$('difficulty').value=selectedDifficulty;
    $('rupee-count').textContent=storage.rupees+' rupees';$('heroes-count').textContent=storage.unlocked.length+'/'+Object.keys(HEROES).length;$('achievement-count').textContent=storage.achievements.filter(item=>item.complete).length+'/'+storage.achievements.length;
    $('best-note').textContent=storage.runs?'Best: '+storage.bestKills+' defeated · '+storage.wins+' victories · '+storage.runs+' runs':'Eight maps. Three levels each. One final battle.';
    const checkpoint=storage.checkpoint;$('continue-button').hidden=!checkpoint;$('checkpoint-summary').hidden=!checkpoint;
    if(checkpoint){$('continue-button').querySelector('span').textContent='Continue '+(checkpoint.mode==='adventure'?'adventure':'survival');$('checkpoint-summary').textContent=HEROES[checkpoint.hero].name+' · '+REALMS[checkpoint.realm].name+(checkpoint.mode==='adventure'?' '+REALMS[checkpoint.realm].number+'-'+(checkpoint.realmStages?.[checkpoint.realm]||1):'')+' · '+checkpoint.shrines.length+'/'+REALMS.length+' · '+formatTime(checkpoint.time);}
    $('start-button').classList.toggle('start-secondary',!!checkpoint);$('start-button').querySelector('span').textContent=(checkpoint?'New ': 'Begin ')+(selectedMode==='adventure'?'adventure':'survival');
    $('run-note').textContent=selectedMode==='adventure'?'Defeat eight guardians, then Ganondorf in Hyrule.':'Survive four minutes, then defeat Phantom Ganon.';
    $('hero-choice-label').textContent='Hero: '+HEROES[selectedHero].name;$('hero-perk').textContent=HEROES[selectedHero].perk;
    document.querySelectorAll('.hero-option').forEach(button=>{const selected=button.dataset.hero===selectedHero;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
    if(currentDialog()==='camp-dialog')renderCamp();if(currentDialog()==='heroes-dialog')renderHeroes();if(currentDialog()==='journal-dialog')renderJournal();
  }
  async function saveCheckpoint(force=false){
    if(!game||checkpointSaving||!game.canCheckpoint||(!force&&game.checkpointRevision===checkpointSavedRevision))return;
    const run=game,revision=run.checkpointRevision;checkpointSaving=true;
    try{const saved=await profileTransaction(profile=>profile.saveCheckpoint(run));if(game===run){checkpointSavedRevision=revision;$('checkpoint-indicator').textContent=saved?(storageAvailable?'Realm checkpoint saved':'Progress in memory'):'Checkpoint owned by another tab';}}
    catch(error){toast(error.message);}finally{checkpointSaving=false;}
  }
  function setupRun(run){
    closeAll();game=run;if(run.mode!=='training'){selectedHero=run.hero;selectedMode=run.mode;selectedDifficulty=run.difficulty;}endingShown=false;endReadyAt=0;upgradeReadyAt=0;lastOutcome=null;banishMode=false;accumulator=0;loadoutKey='';checkpointSavedRevision=run.checkpointRevision;
    view.clearDynamic();view.portalGroups.forEach(portal=>{portal.texture.dispose();portal.material.dispose();});view.buildRealm(run.realm,run.stage);view.makeHero(run.hero);view.applySettings();view.hero.visible=true;view.cameraTarget.set(0,.4,0);view.camera.position.set(15,20,15);view.lastPlayer={x:0,z:0};
    document.body.classList.add('playing');for(const id of ['menu','menu-footer','menu-landmark'])$(id).hidden=true;for(const id of ['hud','pause-button'])$(id).hidden=false;$('touch-controls').hidden=!touch;$('damage-flash').style.opacity=0;
    $('checkpoint-indicator').textContent=run.mode==='training'?'Training · never saved':'Checkpoint ready';updateHud();announce({...REALMS[run.realm],name:REALMS[run.realm].name+(run.mode==='adventure'?' '+run.stageLabel:'')});sound('choose');focusWorld();if(run.state==='upgrade')showUpgrade();
    setTimeout(()=>{if(game===run&&run.state==='running')toast(run.mode==='training'?'Inventory opens your build and training controls.':run.mode==='adventure'?'Clear each level’s wave. The central shrine opens the next level.':touch?'Move with the stick. Weapons cast automatically.':'WASD moves. Weapons cast automatically.');},2300);
  }
  async function beginFresh(expectedCheckpointId=null){
    if(profileBusy)return;profileBusy=true;
    try{
      const runId=globalThis.crypto?.randomUUID?crypto.randomUUID():'run-'+Date.now()+'-'+Math.floor(Math.random()*1e6);
      const hero=selectedHero,mode=selectedMode,difficulty=selectedDifficulty;let run;
      await profileTransaction(profile=>{run=new Game(hero,Date.now(),{mode,difficulty,upgrades:profile.upgrades,runId});return profile.beginRun(run,expectedCheckpointId);});setupRun(run);
    }catch(error){toast(error.message);updateProfileUI();}finally{profileBusy=false;}
  }
  function requestStart(){
    if(storage.checkpoint){pendingStart=storage.checkpoint.runId;$('new-run-description').textContent='Saved: '+HEROES[storage.checkpoint.hero].name+' in '+REALMS[storage.checkpoint.realm].name+'. A new run replaces this checkpoint. Your rupees and permanent progress stay.';openDialog('new-run-dialog');}
    else beginFresh();
  }
  function continueRun(){try{storage=readProfile();setupRun(storage.resume());}catch(error){toast(error.message);}}
  async function home(){
    await saveCheckpoint(true);closeAll();game=null;view.clearDynamic();view.portalGroups.forEach(portal=>{portal.texture.dispose();portal.material.dispose();});view.buildRealm(6);view.makeHero(selectedHero);
    document.body.classList.remove('playing');for(const id of ['menu','menu-footer','menu-landmark'])$(id).hidden=false;for(const id of ['hud','pause-button','touch-controls','boss-hud','interaction'])$(id).hidden=true;
    $('realm-announcement').classList.remove('visible');$('toast').classList.remove('visible');$('damage-flash').style.opacity=0;updateProfileUI();$('start-button').focus({preventScroll:true});
  }
  function pause(){if(game?.state!=='running'||currentDialog())return;openDialog('pause-dialog');$('pause-description').textContent=game.mode==='training'?'Training is paused. Your saved adventure is unchanged.':game.boss?'Boss encounters restart from the previous safe checkpoint.':'Your adventure is paused. Safe progress is checkpointed.';$('quit-button').textContent=game.mode==='training'?'Exit training':game.boss?'Return to the last checkpoint':'Save and return to title';saveCheckpoint(true);}
  function selectHero(id){
    if(!Object.hasOwn(HEROES,id))return;
    if(!storage.unlocked.includes(id)){toast(HEROES[id].unlockText);return;}
    selectedHero=id;if(game&&['won','lost'].includes(game.state)){home();return;}
    if(!game)view.makeHero(id);updateProfileUI();sound('choose');if(currentDialog()==='heroes-dialog')closeDialog();
  }
  const realmIcons=['relic','wave','moon','wing','sprout','clock','tree','wave'];
  function buildMap(){
    const root=$('realm-map');root.textContent='';
    for(const realm of [...REALMS].sort((a,b)=>a.number-b.number)){
      const index=REALMS.indexOf(realm),button=document.createElement('button'),stage=game?.realmStages[index]||1;button.className='realm-node'+(game?.realm===index?' current':'');button.style.setProperty('--realm-color',realm.color);
      const sealed=game?.shrines.has(index),status=game?.realm===index?'YOU ARE HERE':sealed?'SEAL RESTORED':realm.origin;
      button.innerHTML='<span class="realm-orb">'+icon(realmIcons[index])+'</span><b>'+realm.name+'</b><small>'+status+'</small><span class="map-levels">'+[1,2,3].map(level=>'<i class="'+(sealed||stage>level?'complete':stage===level?'active':'')+'">'+realm.number+'-'+level+'</i>').join('')+'</span>';
      button.setAttribute('aria-label',realm.name+', levels '+realm.number+'-1 through '+realm.number+'-3'+(game?.realm===index?', current map':''));
      button.addEventListener('click',()=>{if(!game){view.portalGroups.forEach(portal=>{portal.texture.dispose();portal.material.dispose();});view.buildRealm(index);}$('map-description').textContent=realm.name+' · Seen in '+realm.origin;$('map-travel-hint').textContent='Landmark: '+realm.landmark+'. Enemies: '+realm.enemies.map(id=>ENEMIES[id].name).join(', ')+'. Guardian: '+BOSSES[realm.boss].name+'. Gates: '+realm.links.map(index=>REALMS[index].name).join(', ')+'.';});root.appendChild(button);
    }
    $('map-shrine-status').textContent=game?game.shrines.size+' / '+REALMS.length+' seals restored':'24 levels across eight connected Zelda maps.';
  }
  function openMap(){
    if(game&&!['running','paused'].includes(game.state))return;buildMap();$('map-description').textContent=game?.mode==='adventure'?'Restore the eight seals, then return to Hyrule.':'Eight maps. Ancient gates. Every path leads somewhere.';
    $('map-travel-hint').textContent=game?(game.travelBlockedReason||'At a gate, press E or tap Activate. Progress travels with you.'):'Select a realm to preview it. Close the map to begin.';openDialog('map-dialog');
  }
  function showUpgrade(){
    if(game?.state!=='upgrade')return;$('upgrade-level').textContent='Level '+game.level+' · Choose a power';$('upgrade-options').textContent='';
    game.choices.forEach((upgrade,i)=>{const rank=game.rank(upgrade.id),awakened=rank===6,button=document.createElement('button');button.className='upgrade-choice'+(awakened?' evolution':'');button.innerHTML=icon(upgrade.icon)+'<kbd>'+(i+1)+'</kbd><span class="upgrade-kind">'+(awakened?'AWAKENING':!rank?'NEW '+upgrade.category:upgrade.category)+'</span><h3>'+(awakened?upgrade.evolved:upgrade.name)+'</h3><p>'+game.upgradeSummary(upgrade.id)+'</p><span class="rank">'+(rank?'RANK '+rank+' → '+(rank+1):'RANK 1')+'</span>';button.addEventListener('click',()=>chooseUpgrade(upgrade.id));$('upgrade-options').appendChild(button);});
    for(const[action,count]of[['refresh',game.refreshes],['skip',game.skips],['banish',game.banishes]]){$(action+'-button').textContent=(action==='banish'&&banishMode?'Cancel banish':action[0].toUpperCase()+action.slice(1)+' ('+count+')')+' · '+({refresh:'F',skip:'X',banish:'Z'})[action];$(action+'-button').disabled=count===0;}
    $('upgrade-hint').textContent=banishMode?'Choose a card to exclude it from the rest of this run.':'1–3 choose · F refresh · X skip · Z banish · Tab inventory';$('upgrade-dialog').classList.toggle('banish-mode',banishMode);
    if(currentDialog()!=='upgrade-dialog')openDialog('upgrade-dialog');
  }
  function chooseUpgrade(id){
    if(!game)return;if(banishMode){if(game.banishChoice(id)){banishMode=false;showUpgrade();}return;}
    if(!game.choose(id))return;profileTransaction(profile=>profile.recordItem(id)).catch(error=>toast(error.message));clearInput();loadoutKey='';updateHud();
    if(game.state==='upgrade')showUpgrade();else{closeAll();focusWorld();saveCheckpoint();}
  }
  function upgradeAction(action){if(game?.state!=='upgrade')return;if(action==='refresh'&&game.refreshChoices()){banishMode=false;showUpgrade();}else if(action==='skip'&&game.skipUpgrade()){banishMode=false;if(game.state==='upgrade')showUpgrade();else{closeAll();focusWorld();saveCheckpoint();}}else if(action==='banish'&&game.banishes>0){banishMode=!banishMode;showUpgrade();}}
  function renderHeroes(){
    $('hero-roster').textContent='';$('heroes-description').textContent=storage.unlocked.length+' / '+Object.keys(HEROES).length+' heroes unlocked. Progress is shared across runs.';
    for(const[id,hero]of Object.entries(HEROES)){const unlocked=storage.unlocked.includes(id),button=document.createElement('button');button.className='roster-card'+(id===selectedHero?' selected':'')+(!unlocked?' locked':'');button.dataset.rosterHero=id;button.setAttribute('aria-disabled',String(!unlocked));button.innerHTML='<img alt="" src="'+artURL('hero',id)+'"><strong>'+hero.name+'</strong><span>'+hero.title+'</span><small>'+hero.hp+' HP · '+hero.speed+' speed</small><p>'+hero.perk+'</p><small>Ultimate: '+hero.ultimateName+'</small><b>'+(unlocked?'Choose hero':hero.unlockText)+'</b>';button.addEventListener('click',()=>selectHero(id));$('hero-roster').appendChild(button);}
  }
  function renderCamp(){
    $('camp-balance').textContent=storage.rupees+' rupees';$('camp-upgrades').textContent='';
    for(const item of PERMANENT){const row=document.createElement('div');row.className='camp-upgrade';const cost=storage.upgradeCost(item.id);row.innerHTML=icon(item.icon)+'<div><h3>'+item.name+'</h3><p>'+item.desc+'</p><small>RANK '+storage.upgrades[item.id]+' / '+item.max+'</small></div>';
      const button=document.createElement('button');button.dataset.purchase=item.id;button.className='secondary-button';button.textContent=cost===null?'Maxed':cost+' rupees';button.disabled=profileBusy||cost===null||storage.rupees<cost;button.addEventListener('click',async()=>{if(profileBusy)return;profileBusy=true;button.disabled=true;try{const bought=await profileTransaction(profile=>profile.purchase(item.id));if(bought){sound('purchase');toast(item.name+' upgraded for new runs.');}else toast('Not enough rupees, or this upgrade is already maxed.');}catch(error){toast(error.message);}finally{profileBusy=false;renderCamp();}});row.appendChild(button);$('camp-upgrades').appendChild(row);}
  }
  function renderJournal(){
    const root=$('journal-content');root.textContent='';document.querySelectorAll('[data-journal]').forEach(button=>button.classList.toggle('selected',button.dataset.journal===journalTab));
    const entries=journalTab==='enemies'?Object.entries(ENEMIES).map(([id,item])=>({id,name:item.name,detail:item.origin,status:REALMS.filter(realm=>realm.enemies.includes(id)).map(realm=>realm.name).join(' · '),kind:'enemy'})):journalTab==='heroes'?Object.entries(HEROES).map(([id,item])=>({id,name:item.name,detail:item.origin,status:storage.unlocked.includes(id)?'Unlocked':item.unlockText,kind:'hero'})):journalTab==='bosses'?Object.entries(BOSSES).map(([id,item])=>({id,name:item.name,detail:item.origin,status:storage.guardians.includes(id)||(id==='ganondorf'&&storage.adventureWins>0)||(id==='phantom'&&storage.survivalWins>0)?'Defeated':'Not yet defeated',kind:'boss'})):journalTab==='items'?UPGRADES.map(item=>({id:item.id,name:item.name,detail:item.origin,status:storage.items.includes(item.id)?'Discovered':'Find in a run',icon:item.icon})):storage.achievements.map(item=>({id:item.id,name:item.name,detail:item.desc,status:item.complete?'Complete':'In progress',icon:item.complete?'relic':'lock'}));
    if(journalTab==='items')entries.push(...Combat.GEAR.map(item=>({id:item.id,name:item.name,detail:item.desc+' · '+item.origin,status:Combat.RARITIES[item.rarity].name+' · '+(storage.gear.includes(item.id)?'Discovered':'Find in treasure'),icon:item.icon})));
    for(const entry of entries){const row=document.createElement('div');row.className='journal-row';row.innerHTML=(entry.kind?'<img alt="" src="'+artURL(entry.kind,entry.id)+'">':icon(entry.icon))+'<div><strong>'+entry.name+'</strong><small>'+entry.detail+'</small></div><span>'+entry.status+'</span>';root.appendChild(row);}
  }
  function openHeroes(){renderHeroes();openDialog('heroes-dialog');}
  function openCamp(){renderCamp();openDialog('camp-dialog');}
  function openJournal(){renderJournal();openDialog('journal-dialog');}
  function beginTraining(){
    const run=new Game(selectedHero,Date.now(),{mode:'training'});run.configureTraining({realm:6,stage:1,level:40,invulnerable:true});run.setTrainingBuild({[HEROES[run.hero].weapon]:8},{});setupRun(run);openTraining();
  }
  function openTraining(){
    if(game?.mode!=='training')return;
    $('training-hero').innerHTML=Object.entries(HEROES).map(([id,hero])=>'<option value="'+id+'">'+hero.name+'</option>').join('');$('training-hero').value=game.hero;
    $('training-realm').innerHTML=REALMS.map((realm,index)=>'<option value="'+index+'">'+realm.name+'</option>').join('');$('training-realm').value=game.realm;$('training-stage').value=game.stage;$('training-level').value=game.level;$('training-invulnerable').checked=game.training.invulnerable;
    $('training-ranks').textContent='';for(const item of UPGRADES){const label=document.createElement('label'),input=document.createElement('input');label.textContent=item.name;input.type='number';input.min=0;input.max=item.category==='WEAPON'?8:10;input.step=1;input.required=true;input.value=game.rank(item.id);input.dataset.trainingRank=item.id;label.appendChild(input);$('training-ranks').appendChild(label);}
    $('training-gear').innerHTML=Combat.GEAR.map(item=>'<option value="'+item.id+'">'+item.name+'</option>').join('');$('training-stacks').max=Combat.item($('training-gear').value).max;$('training-stacks').value=game.gear[$('training-gear').value]||1;$('training-status').textContent='World paused. Spawn a rival, then choose To training.';openDialog('training-dialog');
  }
  function applyTraining(event){
    event.preventDefault();if(game?.mode!=='training'||!$('training-form').reportValidity())return;
    const ranks=Object.fromEntries([...document.querySelectorAll('[data-training-rank]')].map(input=>[input.dataset.trainingRank,Number(input.value)]));
    if(!game.setTrainingBuild(ranks,game.gear)){$('training-status').textContent='Use up to four weapons and five charms. Remove another rank before adding a new one.';return;}
    game.configureTraining({hero:$('training-hero').value,realm:Number($('training-realm').value),stage:Number($('training-stage').value),level:Number($('training-level').value),invulnerable:$('training-invulnerable').checked});
    view.clearDynamic();view.makeHero(game.hero);loadoutKey='';updateHud();$('training-status').textContent='Build applied. Arena cleared. Spawn a rival to test it.';
  }
  function renderInventory(){
    if(!game)return;$('training-controls-button').hidden=game.mode!=='training';const p=game.player,s=game.stats,percent=value=>(value*100).toFixed(0)+'%';
    const entries=[['Health',Math.ceil(p.hp)+' / '+Math.ceil(p.maxHp)],['Level',game.level],['Seals',game.shrines.size+' / '+REALMS.length],['Physical damage',percent(game.damageMultiplier*s.physical)],['Magic damage',percent(game.damageMultiplier*s.magic)],['Critical chance',percent(s.critChance)],['Critical damage',percent(s.critDamage)],['Armor',s.armor.toFixed(1)],['Evasion',percent(s.evasion)],['Regeneration',((game.rank('regen')+s.regen)*s.healing).toFixed(1)+'/s'],['Lifesteal',percent(s.lifesteal)],['XP gain',percent(s.xpGain)]];
    $('inventory-stats').textContent='';for(const [label,value]of entries){const cell=document.createElement('span'),bold=document.createElement('b');bold.textContent=value;cell.append(bold,document.createTextNode(label));$('inventory-stats').appendChild(cell);}
    $('inventory-items').textContent='';
    for(const item of UPGRADES)if(game.rank(item.id)){const row=document.createElement('div');row.className='journal-row';row.innerHTML=icon(item.icon)+'<div><strong>'+item.name+' · Rank '+game.rank(item.id)+'</strong><small>'+(item.category==='WEAPON'?game.weaponSummary(item.id):item.desc)+'</small></div>';$('inventory-items').appendChild(row);}
    $('inventory-gear').textContent='';const equipment=Combat.GEAR.filter(item=>game.gear[item.id]);
    $('inventory-loot-note').textContent=equipment.length?'Each stack applies its listed effect. Status chances cap at 80%.':'Elites and every twentieth enemy drop treasure. Walk over a chest to collect equipment.';
    for(const item of equipment){const row=document.createElement('div');row.className='journal-row';row.innerHTML=icon(item.icon)+'<div><strong>'+item.name+' ×'+game.gear[item.id]+'</strong><small>'+item.desc+' · '+item.origin+'</small></div><span>'+Combat.RARITIES[item.rarity].name+'<br>'+game.gear[item.id]+' / '+item.max+'</span>';$('inventory-gear').appendChild(row);}
    $('inventory-damage').textContent='';const sources=Object.entries(game.damageBySource).sort((a,b)=>b[1]-a[1]);
    if(!sources.length)$('inventory-damage').textContent='Damage from weapons, treasure effects, and reactions appears here.';
    for(const [id,value]of sources){const row=document.createElement('div');row.className='damage-source';const label=document.createElement('span'),amount=document.createElement('b'),meter=document.createElement('meter');
      label.textContent=UPGRADES.find(item=>item.id===id)?.name||Combat.item(id)?.name||({ultimate:HEROES[game.hero].ultimateName,shrine:'Shrine blessing',reaction:'Elemental reactions',thorns:'Reflected damage',other:'Other damage'})[id]||id;
      amount.textContent=Math.round(value).toLocaleString();meter.max=Math.max(1,game.damageDealt);meter.value=value;meter.setAttribute('aria-label',label.textContent+' damage');row.append(label,amount,meter);$('inventory-damage').appendChild(row);
    }
  }
  function openInventory(){if(!game)return;renderInventory();openDialog('inventory-dialog');}
  function openSettings(){
    $('sound-setting').checked=soundEnabled;$('volume-setting').value=storage.volume;$('motion-setting').value=storage.motion;$('import-button').disabled=!!game;$('graphics-setting').value=storage.graphics;$('mouse-mode-setting').value=storage.mouseMode;$('sensitivity-setting').value=storage.sensitivity;$('sensitivity-value').textContent=storage.sensitivity.toFixed(1)+'×';$('invert-setting').checked=storage.invertY;$('fov-setting').value=storage.cameraFov;$('fov-value').textContent=storage.cameraFov+'°';$('distance-setting').value=Math.round(storage.cameraDistance);$('distance-value').textContent=Math.round(storage.cameraDistance);renderBindings();$('save-status').textContent=storageWarning||(!storageAvailable?'Progress is in memory. Export it before closing.':game?'Export is available now. Return to title before importing.':'Progress is saved in this browser. Export a backup before changing devices.');openDialog('settings-dialog');
  }
  function updateMinimap(){
    const c=$('minimap').getContext('2d'),p=game.player,center=110,scale=1.35;c.clearRect(0,0,220,220);c.save();c.beginPath();c.arc(center,center,105,0,Math.PI*2);c.clip();c.fillStyle='#272b43';c.fillRect(0,0,220,220);c.strokeStyle='#50556b';c.lineWidth=1;
    for(let n=-3;n<=3;n++){c.beginPath();c.moveTo(0,center+n*40);c.lineTo(220,center+n*40);c.moveTo(center+n*40,0);c.lineTo(center+n*40,220);c.stroke();}
    const point=(x,z,color,radius,pin=false)=>{let dx=(x-p.x)*scale,dz=(z-p.z)*scale;const length=Math.hypot(dx,dz);if(pin&&length>94){dx*=94/length;dz*=94/length;}c.fillStyle=color;c.beginPath();c.arc(center+dx,center+dz,radius,0,Math.PI*2);c.fill();};
    for(const enemy of game.enemies)if(!enemy.dead)point(enemy.x,enemy.z,enemy.type==='boss'?'#ffc4d8':'#ee7e82',enemy.type==='boss'?5:2);
    for(const drop of game.loot)point(drop.x,drop.z,'#f4d575',4,true);
    for(let i=0;i<GATES.length;i++){point(GATES[i].x,GATES[i].z,'#fff8df',7,true);point(GATES[i].x,GATES[i].z,REALMS[REALMS[game.realm].links[i]].color,4.5,true);}
    if(!game.shrines.has(game.realm)||(game.mode==='adventure'&&game.realm===0&&game.shrines.size===REALMS.length))point(0,-7,'#edcd6a',5);
    c.translate(center,center);c.rotate(-view.yaw);c.fillStyle='#fff8e3';c.beginPath();c.moveTo(0,-7);c.lineTo(5,6);c.lineTo(0,3);c.lineTo(-5,6);c.closePath();c.fill();c.restore();c.strokeStyle='#fff7dc';c.lineWidth=6;c.beginPath();c.arc(center,center,105,0,Math.PI*2);c.stroke();c.fillStyle='#fff7dc';c.font='900 11px Nunito,sans-serif';c.textAlign='center';c.fillText('N',110,18);
  }
  function updateHud(){
    if(!game)return;const p=game.player,hero=HEROES[game.hero];$('hero-name').textContent=hero.name;$('hero-title').textContent=hero.title;$('hero-portrait').src=artURL('hero',game.hero);$('health-text').textContent=Math.ceil(p.hp)+' / '+Math.ceil(p.maxHp);$('health-fill').style.width=p.hp/p.maxHp*100+'%';$('stamina-fill').style.width=p.stamina*100+'%';$('timer').textContent=formatTime(game.time);$('kills').textContent=game.kills;$('realm-name').textContent=REALMS[game.realm].name+(game.mode==='adventure'?' '+game.stageLabel:'');$('shrines-count').textContent=game.shrines.size+' / '+REALMS.length+' '+(game.mode==='adventure'?'seals':'shrines');$('xp-fill').style.width=Math.min(100,game.xp/game.xpNeed*100)+'%';$('level-label').textContent='LV. '+game.level;$('xp-label').textContent=game.mode==='training'?'PRACTICE':Math.floor(game.xp)+' / '+game.xpNeed;
    $('objective').textContent=game.mode==='training'?'TRAINING · NO PROGRESS SAVED':game.boss?'DEFEAT '+game.boss.name.toUpperCase():game.mode==='adventure'?game.shrines.size===REALMS.length?'RETURN TO HYRULE · GANONDORF':game.stage<3?'LEVEL '+game.stageLabel+' · '+Math.min(game.stageTarget,game.stageKills[game.realm])+'/'+game.stageTarget+' ENEMIES':'LEVEL '+game.stageLabel+' · CHALLENGE GUARDIAN':'PHANTOM GANON AT 4:00';
    $('dash-label').textContent=p.dashCooldown>0?'Dash '+p.dashCooldown.toFixed(1)+'s':'Dash ready';$('touch-dash').style.opacity=p.dashCooldown>0?'.5':'1';$('boss-hud').hidden=!game.boss||game.boss.dead;
    if(game.boss){$('boss-name').textContent=game.boss.name.toUpperCase();$('boss-phase').textContent='PHASE '+game.boss.stage;$('boss-fill').style.width=Math.max(0,game.boss.hp/game.boss.maxHp*100)+'%';}
    const nearby=game.interaction;$('interaction').hidden=!nearby||game.state!=='running';if(nearby)$('interaction-label').textContent=nearby.kind==='gate'?(nearby.blockedReason||'Travel to '+nearby.name):nearby.kind==='guardian'||nearby.kind==='final'||nearby.kind==='stage'?nearby.name:'Recover '+nearby.name;
    const key=JSON.stringify(game.ranks);if(key!==loadoutKey){loadoutKey=key;$('loadout').textContent='';const equipped=UPGRADES.filter(item=>item.category==='WEAPON'&&game.rank(item.id));$('hud').style.setProperty('--weapon-count',equipped.length);for(const item of equipped){const el=document.createElement('div');el.className='weapon-slot'+(game.rank(item.id)===7?' evolved':'');el.title=item.name+' · Rank '+game.rank(item.id);el.setAttribute('aria-label',el.title);el.innerHTML=icon(item.icon)+'<strong>'+item.name+'</strong><small>LV. '+game.rank(item.id)+'</small>';$('loadout').appendChild(el);}}
    $('player-health-fill').style.width=p.hp/p.maxHp*100+'%';$('player-health-value').textContent=Math.ceil(p.hp);$('ultimate-charge').style.strokeDashoffset=170*(1-game.energy/100);$('ultimate-button').disabled=game.energy<100||game.state!=='running';$('ultimate-button').classList.toggle('ready',game.energy>=100);$('ultimate-button').setAttribute('aria-label',game.energy>=100?'Use '+hero.ultimateName:hero.ultimateName+' '+Math.floor(game.energy)+'% charged');$('ultimate-label').textContent=hero.ultimateName.toUpperCase();$('streak').hidden=game.streak<2;$('streak-value').textContent='×'+game.streak;$('aim-button').innerHTML=(game.lockedTarget!==null?'TARGET LOCKED':game.aimMode.toUpperCase()+' AIM')+' <kbd>'+keyName(storage.bindings.aim)+'</kbd>';updateMinimap();
  }
  async function prepareOutcome(run){
    if(lastOutcome)return;lastOutcome={pending:true,reward:0,unlocks:[]};
    if(run.mode==='training'){lastOutcome={reward:0,unlocks:[]};return;}
    try{lastOutcome=await profileTransaction(profile=>profile.settle(run));}catch(error){lastOutcome={reward:0,unlocks:[]};toast(error.message);}
  }
  function showEnd(){
    if(endingShown||!game)return;endingShown=true;closeAll();$('touch-controls').hidden=true;const won=game.state==='won',result=lastOutcome||{reward:0,unlocks:[]};
    $('end-title').textContent=won?(game.mode==='adventure'?'The realms are restored.':'The dawn belongs to you.'):'Your courage remains.';$('end-description').textContent=won?(game.mode==='adventure'?'Eight guardians defeated. Ganondorf has fallen. Your next hero is waiting.':'Phantom Ganon has fallen. Your progress carries into the next run.'):'Return to the camp, strengthen your equipment, and try a new path.';$('end-icon').innerHTML=icon(won?'sun':'moon');
    $('end-stats').innerHTML='<div><strong>'+formatTime(game.time)+'</strong><span>TIME</span></div><div><strong>'+game.kills+'</strong><span>DEFEATED</span></div><div><strong>'+game.shrines.size+'/'+REALMS.length+'</strong><span>SEALS</span></div><div><strong>+'+result.reward+'</strong><span>RUPEES</span></div>';$('end-record').textContent='Level '+game.level+' · '+Math.round(game.damageDealt).toLocaleString()+' damage · '+storage.rupees+' rupees in your wallet';$('end-unlocks').textContent=result.unlocks?.length?'Unlocked: '+result.unlocks.map(id=>HEROES[id].name).join(', '):'';openDialog('end-dialog');
  }
  function handleEvents(){
    if(!game)return;let collectPlayed=false,popPlayed=false;
    for(const event of game.drainEvents()){
      if(event.type==='hit'){view.damageText(event.x,event.z,event.damage,event.critical);continue;}
      if(event.type==='gear'){sound('purchase');toast(Combat.RARITIES[event.rarity].name+' treasure: '+event.name+' ×'+event.count);if(game.mode!=='training')profileTransaction(profile=>profile.recordGear(event.id)).catch(error=>toast(error.message));continue;}
      if(event.type==='lootDrop'){view.ringEffect(event.x,event.z,Combat.RARITIES[event.rarity].color,2,.6);continue;}
      if(event.type==='status'){view.ringEffect(event.x,event.z,Combat.STATUS[event.status].color,1,.35);continue;}
      if(event.type==='reaction'){view.ringEffect(event.x,event.z,event.color,3,.5);view.damageText(event.x,event.z,event.name);continue;}
      if(event.type==='evade'){view.damageText(event.x,event.z,'Evaded');continue;}
      if(event.type==='pop'){view.defeatEffect(event);if(!popPlayed){sound('pop');popPlayed=true;}continue;}
      if(event.type==='collect'){if(!collectPlayed){sound('collect');collectPlayed=true;}continue;}
      if(event.type==='hurt'){view.shake=reducedMotion?0:.35;$('damage-flash').style.opacity=reducedMotion?.2:.6;}
      if(event.type==='dash')view.ringEffect(event.x,event.z,'#d0eaca',2,.3);
      if(event.type==='nova'||event.type==='explosion')view.ringEffect(event.x,event.z,event.color||'#f3c18d',event.radius,event.type==='explosion'?.55:.48);
      if(event.type==='slam'||event.type==='blink')view.ringEffect(event.x,event.z,'#e9c1d2',3,.4);
      if(event.type==='travel'){view.portalGroups.forEach(portal=>{portal.texture.dispose();portal.material.dispose();});view.clearDynamic();view.buildRealm(event.realm,game.stage);view.cameraTarget.set(0,.4,0);view.camera.position.set(15,20,15);announce(REALMS[event.realm]);loadoutKey='';}
      if(event.type==='shrine')toast(REALMS[event.realm].blessing+' · '+REALMS[event.realm].benefit);
      if(event.type==='guardian'){
        upgradeReadyAt=titleTime+.85;sound('guardian');toast(event.name+' defeated · seal '+game.shrines.size+'/'+REALMS.length);
        profileTransaction(profile=>profile.recordGuardian(event.id)).then(unlocks=>{if(unlocks.length)setTimeout(()=>toast(unlocks.map(id=>HEROES[id].name).join(', ')+' unlocked!'),1800);}).catch(error=>toast(error.message));
      }
      if(event.type==='elite')toast('Elite '+event.name+' has entered the map.');
      if(event.type==='stageClear'){sound('guardian');toast('Level '+event.label+' cleared. Reach the central shrine for the next level.');}
      if(event.type==='stage'){$('toast').classList.remove('visible');clearTimeout(toastTimer);view.clearDynamic();announce({name:REALMS[event.realm].name+' '+event.label,subtitle:event.stage===3?'The guardian awaits at the central shrine.':'Clear the wave, then reach the central shrine.'});}
      if(event.type==='boss'){announce({name:event.name,subtitle:game.mode==='adventure'?'Guardian battle · the gates are sealed':'Watch the wind-up. Dodge the warning circles.'});view.shake=reducedMotion?0:.5;}
      if(event.type==='bossPhase'){toast(event.name+' · Phase '+event.stage);view.ringEffect(event.x,event.z,BOSSES[event.id].color,4,.65);}
      if(event.type==='level')upgradeReadyAt=Math.max(upgradeReadyAt,titleTime+.12);
      if(event.type==='evolve')toast(UPGRADES.find(item=>item.id===event.id).evolved+' awakened!');
      if(event.type==='ultimate'){view.ringEffect(event.x,event.z,event.color,event.radius,.8);view.ringEffect(event.x,event.z,event.color,event.radius*.7,.55);view.ultimateEffect(event);toast(event.name+'!');sound('nova');}
      if(event.type==='end'){prepareOutcome(game);endReadyAt=titleTime+1.2;sound(event.won?'victory':'end');}
      else sound(event.type);
    }
    if(game.state==='upgrade'&&titleTime>=upgradeReadyAt&&(!currentDialog()||currentDialog()==='upgrade-dialog'))showUpgrade();
    if(['won','lost'].includes(game.state)&&!endingShown){if(!endReadyAt){prepareOutcome(game);endReadyAt=titleTime+1.2;}if(titleTime>=endReadyAt&&!lastOutcome?.pending)showEnd();}
  }
  function held(action,alternate){return keys.has(storage.bindings[action])||(!Object.values(storage.bindings).includes(alternate)&&keys.has(alternate));}
  function frame(ms){
    requestAnimationFrame(frame);const elapsed=Math.min((ms-lastTime)/1000||.016,.25),dt=Math.min(elapsed,.05);lastTime=ms;titleTime+=elapsed;
    if(game){
      const input={cameraYaw:view.yaw,x:(held('right','ArrowRight')?1:0)-(held('left','ArrowLeft')?1:0)+stick.x,y:(held('up','ArrowUp')?1:0)-(held('down','ArrowDown')?1:0)-stick.y,glide:keys.has(storage.bindings.jump)||touchGlide};
      if(game.state==='running'){accumulator+=elapsed;while(accumulator>=.02&&game.state==='running'){game.step(.02,input);accumulator-=.02;}}else accumulator=0;
      handleEvents();hudTime+=elapsed;if(hudTime>.08){updateHud();saveCheckpoint();hudTime=0;}const flash=Number($('damage-flash').style.opacity)||0;if(flash>0)$('damage-flash').style.opacity=Math.max(0,flash-elapsed*2.7);
    }
    view.render(game,dt,titleTime);
  }
  function applyPreferences(){soundEnabled=storage.sound;reducedMotion=systemMotion.matches||storage.motion==='reduced';updateSoundButton();view?.applySettings();updateControlHints();}
  const keyName=code=>code==='ShiftLeft'||code==='ShiftRight'?'Shift':code.replace(/^(Key|Digit|Arrow)/,'');
  function updateControlHints(){
    const b=storage.bindings;$('ultimate-button').querySelector('.ultimate-symbol').textContent=keyName(b.ultimate);$('interaction').querySelector('kbd').textContent=keyName(b.interact);$('map-button').querySelector('kbd').textContent=keyName(b.map);
    document.querySelector('.dash-status kbd').textContent=keyName(b.dash);
    document.querySelector('.desktop-controls').innerHTML='<span><kbd>'+[b.up,b.left,b.down,b.right].map(keyName).join(' ')+'</kbd> Move</span><span><kbd>'+keyName(b.jump)+'</kbd> Jump · glide</span><span><kbd>'+keyName(b.interact)+'</kbd> Interact</span><span><kbd>'+keyName(b.inventory)+'</kbd> Inventory</span><span>Mouse to look · Wheel to zoom</span>';
  }
  function renderBindings(){
    const labels={up:'Forward',down:'Back',left:'Left',right:'Right',jump:'Jump / glide',dash:'Dash',ultimate:'Ultimate',interact:'Interact',map:'Map',inventory:'Inventory',aim:'Aim mode',pause:'Pause'};const root=$('key-bindings');root.textContent='';
    for(const[action,label]of Object.entries(labels)){const button=document.createElement('button');button.dataset.rebind=action;button.className='binding-button'+(pendingBinding===action?' capturing':'');button.innerHTML='<span>'+label+'</span><kbd>'+(pendingBinding===action?'Press key…':keyName(storage.bindings[action]))+'</kbd>';button.addEventListener('click',()=>{pendingBinding=action;renderBindings();$('binding-status').textContent='Press a new key for '+label+'. Escape cancels.';});root.appendChild(button);}
  }
  async function setPreference(key,value){await profileTransaction(profile=>{profile[key]=value;});applyPreferences();}
  function exportProfile(){const blob=new Blob([JSON.stringify(storage,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='ZeldaBonk-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function importProfile(){
    if(!pendingImport||game)return;
    const perform=()=>{const latest=readProfile();if(JSON.stringify(latest)!==pendingImportFingerprint)throw new Error('Progress changed in another tab. Open the import again.');if(!storageAvailable)throw new Error('Browser backup is unavailable. Export your current profile before changing browsers.');localStorage.setItem(BACKUP_KEY,JSON.stringify(latest));localStorage.setItem(SAVE_KEY,JSON.stringify(pendingImport));storage=pendingImport;};
    try{if(navigator.locks?.request)await navigator.locks.request(SAVE_KEY,perform);else perform();pendingImport=null;closeAll();selectedHero=storage.unlocked.includes(selectedHero)?selectedHero:'link';view.makeHero(selectedHero);updateProfileUI();applyPreferences();toast('Progress imported. The previous profile is backed up in this browser.');}
    catch(error){toast(error.message);}
  }
  $('start-button').addEventListener('click',requestStart);$('continue-button').addEventListener('click',continueRun);$('confirm-continue').addEventListener('click',continueRun);$('confirm-new-run').addEventListener('click',()=>beginFresh(pendingStart));$('retry-button').addEventListener('click',requestStart);$('end-home-button').addEventListener('click',home);$('quit-button').addEventListener('click',home);$('resume-button').addEventListener('click',closeDialog);$('pause-button').addEventListener('click',pause);
  $('home-link').addEventListener('click',event=>{event.preventDefault();if(game)pause();else home();});
  document.querySelectorAll('.hero-option').forEach(button=>{const image=document.createElement('img');image.src=artURL('hero',button.dataset.hero);image.alt='';button.prepend(image);button.addEventListener('click',()=>selectHero(button.dataset.hero));});
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{selectedMode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(other=>{other.classList.toggle('selected',other===button);other.setAttribute('aria-pressed',String(other===button));});updateProfileUI();}));$('difficulty').addEventListener('change',event=>selectedDifficulty=event.target.value==='hard'?'hard':'normal');
  $('heroes-button').addEventListener('click',openHeroes);$('camp-button').addEventListener('click',openCamp);$('journal-button').addEventListener('click',openJournal);$('credits-button').addEventListener('click',()=>openDialog('credits-dialog'));document.querySelectorAll('[data-journal]').forEach(button=>button.addEventListener('click',()=>{journalTab=button.dataset.journal;renderJournal();}));
  $('map-button').addEventListener('click',openMap);$('pause-map-button').addEventListener('click',openMap);$('world-preview-button').addEventListener('click',openMap);$('inventory-button').addEventListener('click',openInventory);$('help-button').addEventListener('click',()=>openDialog('help-dialog'));$('help-done').addEventListener('click',closeDialog);$('settings-button').addEventListener('click',openSettings);$('pause-settings-button').addEventListener('click',openSettings);
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',closeDialog));
  $('training-button').addEventListener('click',beginTraining);$('training-controls-button').addEventListener('click',openTraining);$('training-form').addEventListener('submit',applyTraining);
  $('training-resume').addEventListener('click',()=>{if(game?.mode!=='training')return;closeAll();game.resume();focusWorld();});
  $('training-gear').addEventListener('change',()=>{const item=Combat.item($('training-gear').value);$('training-stacks').max=item.max;$('training-stacks').value=game?.gear[item.id]||1;});
  $('training-add-gear').addEventListener('click',()=>{if(game?.mode!=='training'||!$('training-stacks').reportValidity())return;const id=$('training-gear').value,count=Number($('training-stacks').value),gear={...game.gear};if(count)gear[id]=count;else delete gear[id];if(game.setTrainingBuild(game.ranks,gear)){$('training-status').textContent='Treasure stack updated. Inspect all active equipment in Inventory.';updateHud();}else $('training-status').textContent='Choose a valid equipment stack within its limit.';});
  $('training-spawn').addEventListener('click',()=>{if(game?.mode!=='training')return;$('training-status').textContent=game.spawnTrainingRivals($('training-rival').value)?'Rivals ready. Choose To training to resume.':'Clear the current guardian or some rivals before spawning more.';});
  $('training-reset').addEventListener('click',()=>{if(game?.resetTraining()){$('training-status').textContent='Arena and damage totals cleared. Build kept.';updateHud();}});
  $('sound-button').addEventListener('click',async()=>{await setPreference('sound',!soundEnabled);sound('choose');});$('sound-setting').addEventListener('change',event=>setPreference('sound',event.target.checked));$('volume-setting').addEventListener('input',event=>{const value=Number(event.target.value);if(Number.isFinite(value))setPreference('volume',clamp(value,0,1));});$('motion-setting').addEventListener('change',event=>setPreference('motion',event.target.value==='reduced'?'reduced':'system'));systemMotion.addEventListener('change',applyPreferences);
  $('graphics-setting').addEventListener('change',event=>setPreference('graphics',event.target.value));$('mouse-mode-setting').addEventListener('change',event=>setPreference('mouseMode',event.target.value));$('sensitivity-setting').addEventListener('input',event=>{const value=Number(event.target.value);$('sensitivity-value').textContent=value.toFixed(1)+'×';setPreference('sensitivity',value);});$('invert-setting').addEventListener('change',event=>setPreference('invertY',event.target.checked));$('fov-setting').addEventListener('input',event=>{const value=Number(event.target.value);$('fov-value').textContent=value+'°';setPreference('cameraFov',value);});$('distance-setting').addEventListener('input',event=>{const value=Number(event.target.value);$('distance-value').textContent=value;setPreference('cameraDistance',value);});
  $('reset-controls-button').addEventListener('click',()=>{pendingBinding=null;setPreference('bindings',{...DEFAULT_BINDINGS}).then(()=>{renderBindings();$('binding-status').textContent='Default keys restored.';});});
  $('reset-camera-button').addEventListener('click',async()=>{await profileTransaction(profile=>{profile.sensitivity=1;profile.invertY=false;profile.cameraFov=50;profile.cameraDistance=30;});view.yaw=Math.PI/4;view.pitch=.78;applyPreferences();openSettings();});
  $('fullscreen-button').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(_){toast('Fullscreen is unavailable in this browser.');}});
  $('export-button').addEventListener('click',exportProfile);$('import-button').addEventListener('click',()=>{if(!game)$('import-file').click();});$('import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>250000)throw new Error('Choose a save smaller than 250 KB.');pendingImport=Profile.import(await file.text());pendingImportFingerprint=JSON.stringify(readProfile());openDialog('import-dialog');}catch(error){toast(error.message);}finally{event.target.value='';}});$('confirm-import').addEventListener('click',importProfile);
  $('interact-button').addEventListener('click',()=>{if(game&&!game.interact()&&game.interaction?.blockedReason)toast(game.interaction.blockedReason);focusWorld();});$('ultimate-button').addEventListener('click',()=>{game?.ultimate();focusWorld();});$('aim-button').addEventListener('click',()=>{game?.toggleAim();focusWorld();});for(const action of ['refresh','skip','banish'])$(action+'-button').addEventListener('click',()=>upgradeAction(action));
  let cameraPointer=null,lastPointerX=0,lastPointerY=0;
  function look(dx,dy){if(!Number.isFinite(dx)||!Number.isFinite(dy))return;view.yaw-=dx*.0035*storage.sensitivity;view.pitch=clamp(view.pitch+dy*.003*storage.sensitivity*(storage.invertY?-1:1),.22,1.12);}
  $('world').addEventListener('pointerdown',event=>{
    if(game?.state!=='running'||event.button!==0)return;focusWorld();
    if(event.pointerType==='mouse'){
      if(storage.mouseMode==='locked'&&document.pointerLockElement!==$('world'))try{const request=$('world').requestPointerLock();request?.catch(()=>toast('Cursor capture is unavailable. Free mouse look is still active.'));}catch(_){toast('Cursor capture is unavailable. Free mouse look is still active.');}
      return;
    }
    cameraPointer=event.pointerId;lastPointerX=event.clientX;lastPointerY=event.clientY;$('world').setPointerCapture(event.pointerId);
  });
  $('world').addEventListener('pointermove',event=>{
    if(game?.state!=='running'||currentDialog())return;
    if(event.pointerType==='mouse'){look(event.movementX,event.movementY);return;}
    if(event.pointerId!==cameraPointer)return;look(event.clientX-lastPointerX,event.clientY-lastPointerY);lastPointerX=event.clientX;lastPointerY=event.clientY;
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture'])$('world').addEventListener(name,event=>{if(event.pointerId===cameraPointer)cameraPointer=null;});
  document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===$('world');if(wasPointerLocked&&!locked&&game?.state==='running'&&!currentDialog())pause();wasPointerLocked=locked;clearInput();});
  $('world').addEventListener('wheel',event=>{if(game?.state!=='running')return;event.preventDefault();view.distance=clamp(view.distance+event.deltaY*.018,18,52);const distance=view.distance;clearTimeout(wheelSaveTimer);wheelSaveTimer=setTimeout(()=>setPreference('cameraDistance',distance),300);},{passive:false});
  $('world').addEventListener('contextmenu',event=>{if(game?.state==='running'){event.preventDefault();game.lockTarget();}});
  document.addEventListener('keydown',event=>{
    if(pendingBinding&&currentDialog()==='settings-dialog'){
      event.preventDefault();event.stopPropagation();if(event.code==='Escape'){pendingBinding=null;renderBindings();$('binding-status').textContent='Key change cancelled.';return;}
      if(!validBinding(event.code)){$('binding-status').textContent='Use a letter, number, arrow, Space or Shift.';return;}
      if(Object.entries(storage.bindings).some(([action,code])=>action!==pendingBinding&&code===event.code)){$('binding-status').textContent='That key is already assigned. Choose another key.';return;}
      const bindings={...storage.bindings,[pendingBinding]:event.code};pendingBinding=null;setPreference('bindings',bindings).then(()=>{renderBindings();$('binding-status').textContent='Control saved.';});return;
    }
    const nativeControl=event.target instanceof Element&&!!event.target.closest('button,a,input,select,textarea,[contenteditable=true]');
    if(event.repeat)return;
    if(currentDialog()==='upgrade-dialog'){if(event.code==='Tab'){event.preventDefault();openInventory();return;}const index=Number(event.key)-1;if(index>=0&&index<game.choices.length)chooseUpgrade(game.choices[index].id);else if(event.code==='KeyF')upgradeAction('refresh');else if(event.code==='KeyX')upgradeAction('skip');else if(event.code==='KeyZ')upgradeAction('banish');return;}
    if(currentDialog()){if(event.code===storage.bindings.map&&currentDialog()==='map-dialog'){event.preventDefault();closeDialog();}return;}
    if(!game||game.state!=='running')return;if(nativeControl&&['Space','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))return;
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(event.code))event.preventDefault();
    if(event.code===storage.bindings.pause){pause();return;}if(event.code===storage.bindings.map){openMap();return;}if(event.code===storage.bindings.inventory||event.code==='Tab'){openInventory();return;}if(event.code===storage.bindings.ultimate){game.ultimate();return;}if(event.code===storage.bindings.aim){game.toggleAim();return;}if(event.code===storage.bindings.interact){if(!game.interact()&&game.interaction?.blockedReason)toast(game.interaction.blockedReason);return;}if(event.code===storage.bindings.jump)game.jump();if(event.code===storage.bindings.dash)game.dash();keys.add(event.code);
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  // Native dialog cancellation preserves pause ownership and cannot dismiss upgrades.
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('cancel',event=>{event.preventDefault();if(!['upgrade-dialog','end-dialog'].includes(currentDialog()))closeDialog();}));
  window.addEventListener('keydown',event=>{if(event.code==='Escape'&&!currentDialog()&&game?.state==='running'){event.preventDefault();pause();}},true);
  function focusLost(){clearInput();cameraPointer=null;if(game?.state==='running')pause();}window.addEventListener('blur',focusLost);document.addEventListener('visibilitychange',()=>{if(document.hidden)focusLost();});window.addEventListener('resize',()=>view?.resize());
  window.addEventListener('storage',event=>{if(event.key===SAVE_KEY){try{storage=readProfile();updateProfileUI();applyPreferences();}catch(_){toast('Progress changed in another tab.');}}});
  let joystickPointer=null;const joystick=$('joystick');
  function moveStick(event){if(event.pointerId!==joystickPointer)return;const rect=joystick.getBoundingClientRect(),dx=event.clientX-rect.left-rect.width/2,dy=event.clientY-rect.top-rect.height/2,length=Math.max(1,Math.hypot(dx,dy)/40);stick.x=clamp(dx/length/40,-1,1);stick.y=clamp(dy/length/40,-1,1);$('joystick-knob').style.transform='translate('+stick.x*35+'px,'+stick.y*35+'px)';}
  joystick.addEventListener('pointerdown',event=>{joystickPointer=event.pointerId;joystick.setPointerCapture(event.pointerId);moveStick(event);});joystick.addEventListener('pointermove',moveStick);const release=event=>{if(event.pointerId!==joystickPointer)return;joystickPointer=null;stick.x=stick.y=0;$('joystick-knob').style.transform='';};for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,release);
  $('touch-dash').addEventListener('pointerdown',event=>{event.preventDefault();game?.dash();});$('touch-jump').addEventListener('pointerdown',event=>{event.preventDefault();$('touch-jump').setPointerCapture(event.pointerId);touchGlide=true;game?.jump();});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('touch-jump').addEventListener(event,()=>touchGlide=false);
  updateProfileUI();applyPreferences();
  try{view=new WorldView();view.applySettings();requestAnimationFrame(frame);if(storageWarning)setTimeout(()=>toast(storageWarning),500);}catch(error){console.error(error);$('error-message').textContent=error.message;$('error-screen').hidden=false;}
  // A read-only diagnostic snapshot supports deterministic browser verification.
  Object.defineProperty(window,'relicWilds',{value:Object.freeze({get snapshot(){return game?{state:game.state,mode:game.mode,time:game.time,realm:game.realm,stage:game.stage,stageLabel:game.stageLabel,stageKills:game.stageKills[game.realm],level:game.level,hp:game.player.hp,kills:game.kills,energy:game.energy,action:game.player.action,aim:game.aimMode,camera:{yaw:view.yaw,pitch:view.pitch,distance:view.distance},visited:[...game.visited],shrines:[...game.shrines],boss:game.boss?{id:game.boss.bossId,name:game.boss.name,stage:game.boss.stage,hp:game.boss.hp,action:game.boss.action}:null,enemies:game.enemies.length,position:{x:game.player.x,y:game.player.y,z:game.player.z},profile:{rupees:storage.rupees,unlocked:storage.unlocked,checkpoint:!!storage.checkpoint}}:{state:'title',realm:view?.realm,profile:{rupees:storage.rupees,unlocked:storage.unlocked,checkpoint:!!storage.checkpoint}};}})});
})();
