(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  if(!window.BonkCore||!window.BonkProfile||!window.RelicArt||!window.THREE){$('error-screen').hidden=false;return;}
  const { Game, HEROES, REALMS, ADVENTURE_ROUTE, GUARDIAN_LANDMARKS, STAGE_TARGETS, UPGRADES, BOSSES, PERMANENT, ENEMIES, Terrain, Combat, ARENA_LIMIT, seeded, clamp } = BonkCore;
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
  let view,game=null,selectedHero='link',selectedMode='adventure',selectedSurvivalRealm=0,selectedAdventureRealm=ADVENTURE_ROUTE[0],selectedDifficulty='normal',titleTime=0,lastTime=0,hudTime=0,accumulator=0,loadoutKey='',soundEnabled=false,audio=null,masterGain=null;
  let mapActionBusy=false;
  let bossCue='',bossCueUntil=0;
  let toastTimer,announcementTimer,endingShown=false,endReadyAt=0,upgradeReadyAt=0,lastOutcome=null,banishMode=false,touchGlide=false,checkpointSavedRevision=0,checkpointSaving=null,profileBusy=false,pendingStart=null,pendingImport=null,pendingImportFingerprint='',journalTab='heroes',storageWarning='',storageAvailable=true;
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
  function announce(realm){const panel=$('realm-announcement');$('realm-announcement-name').textContent=realm.name;$('realm-announcement-subtitle').textContent=realm.subtitle;$('realm-announcement-kicker').hidden=!realm.landmark;panel.classList.toggle('landmark-arrival',!!realm.landmark);panel.classList.add('visible');clearTimeout(announcementTimer);announcementTimer=setTimeout(()=>panel.classList.remove('visible'),realm.landmark?3300:2300);}
  function sound(type){
    if(!soundEnabled)return;
    try{
      if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();masterGain=audio.createGain();masterGain.connect(audio.destination);}
      masterGain.gain.setValueAtTime(soundEnabled?storage.volume:0,audio.currentTime);if(audio.state==='suspended')audio.resume();
      const tones={shadowStrike:[220,94,.13,.028,'triangle'],shoot:[540,300,.055,.018,'sine'],leaf:[760,430,.08,.015,'sine'],bomb:[150,100,.18,.03,'triangle'],boomerang:[500,800,.17,.02,'sine'],collect:[1000,1500,.05,.023,'sine'],hurt:[140,65,.18,.08,'triangle'],dash:[190,490,.15,.04,'sine'],jump:[250,480,.12,.025,'sine'],level:[540,1080,.5,.07,'sine'],choose:[660,990,.25,.05,'sine'],nova:[180,800,.4,.065,'triangle'],explosion:[130,40,.4,.06,'triangle'],shrine:[440,1320,.8,.06,'sine'],travel:[300,900,.6,.055,'sine'],boss:[130,50,1.1,.08,'triangle'],pop:[310,140,.07,.016,'sine'],warning:[220,180,.2,.025,'triangle'],slam:[100,35,.35,.08,'triangle'],moonImpact:[125,32,.72,.095,'triangle'],evolve:[440,1760,.8,.065,'sine'],end:[320,160,.7,.06,'sine'],defeatProp:[465,155,.14,.029,'triangle'],purchase:[660,880,.3,.045,'sine']};
      const play=(note,start)=>{const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type=note[4];oscillator.frequency.setValueAtTime(note[0],start);oscillator.frequency.exponentialRampToValueAtTime(Math.max(1,note[1]),start+note[2]);gain.gain.setValueAtTime(note[3],start);gain.gain.exponentialRampToValueAtTime(.001,start+note[2]);oscillator.connect(gain);gain.connect(masterGain);oscillator.start(start);oscillator.stop(start+note[2]);};
      if(type==='guardian'||type==='victory'){[440,554,659,880].forEach((frequency,i)=>play([frequency,frequency*1.005,.25,.045,'sine'],audio.currentTime+i*.12));return;}
      if(type==='moonImpact')play([715,122,.075,.043,'triangle'],audio.currentTime);
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
      this.windClock={value:0};this.windStrength={value:1};this.materials = new Map(); this.environment = new THREE.Group(); this.scene.add(this.environment); this.entities = new THREE.Group(); this.scene.add(this.entities);
      this.enemies = new Map(); this.companions = new Map(); this.projectiles = new Map(); this.shards = new Map(); this.hazards = new Map(); this.loot = new Map(); this.effects = []; this.ultimateCues=[]; this.orbits = [];
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
      const key = color + (opts.texture?this.realm:'') + JSON.stringify(opts); const {texture,...materialOptions}=opts;const map=texture?(texture==='stone'?RelicArt.terrain(this.realm,true):RelicArt.surfaceTexture(texture,this.realm)):null; if (!this.materials.has(key)) { const material = opts.basic ? new THREE.MeshBasicMaterial({ color, transparent: !!opts.opacity, opacity: opts.opacity ?? 1, side: opts.side || THREE.FrontSide, depthWrite: !opts.opacity }) : new THREE.MeshToonMaterial({ color, ...materialOptions, ...(map?{map}:{}) }); this.materials.set(key, material); }
      return this.materials.get(key);
    }
    groundHeight(x,z) { return this.landmark ? 0 : Terrain.height(this.realm,this.levelStage||1,x,z); }
    mesh(type, color, scale = [1, 1, 1], pos = [0, 0, 0], parent = null, options = {}) {
      let geometry=this.geometries[type];
      if(type==='box'&&options.texture){
        const key='textured-box:'+scale.join(':');if(!this.geometries[key]){
          const box=geometry.clone(),uv=box.attributes.uv,faces=[[scale[2],scale[1]],[scale[2],scale[1]],[scale[0],scale[2]],[scale[0],scale[2]],[scale[0],scale[1]],[scale[0],scale[1]]];
          for(let face=0;face<6;face++)for(let vertex=0;vertex<4;vertex++){const i=face*4+vertex;uv.setXY(i,uv.getX(i)*faces[face][0]/2,uv.getY(i)*faces[face][1]/2);}this.geometries[key]=box;
        }geometry=this.geometries[key];
      }
      const mesh = new THREE.Mesh(geometry, this.mat(color, options)); mesh.scale.set(...scale); mesh.position.set(...pos);if(parent===this.environment)mesh.position.y+=this.groundHeight(pos[0],pos[2]); if (parent) parent.add(mesh); return mesh;
    }
    shadow(parent, radius = .65, opacity = .18) { const m = this.mesh('disc', '#183b37', [radius, radius * .7, 1], [0, .025, 0], parent, { basic: true, opacity }); m.rotation.x = -Math.PI / 2; return m; }
    terrainMaterial(index,stone=false) { const key='terrain:'+index+':'+stone;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshLambertMaterial({map:RelicArt.terrain(index,stone)}));return this.materials.get(key); }
    makeHero(id) {
      if (this.hero) {
        for(const mesh of this.glider?.userData.cloth||[]){mesh.geometry.dispose();mesh.material.dispose();}
        this.navi?.userData.glow.material.dispose();
        this.scene.remove(this.hero);
      }
      if (this.heroShadow) this.scene.remove(this.heroShadow);
      this.heroId = id;
      this.hero = new THREE.Group(); this.heroRig = new THREE.Group(); this.hero.add(this.heroRig); this.scene.add(this.hero);
      this.heroSprite = RelicArt.sprite('hero', id, 2.66, 2.66); this.heroRig.add(this.heroSprite);
      this.heroShadow = new THREE.Group(); this.scene.add(this.heroShadow); this.shadow(this.heroShadow, .7, .22);
      this.glider=this.buildGlideRig(id);this.hero.add(this.glider);
      this.navi=id==='link'?this.makeNavi():null;
      if(this.navi)this.hero.add(this.navi);
    }
    makeNavi(){
      if(!this.geometries.naviWing){
        const outline=new THREE.Shape();
        outline.moveTo(0,0);outline.lineTo(.10,.16);outline.lineTo(.27,.36);outline.lineTo(.44,.49);
        outline.lineTo(.47,.46);outline.lineTo(.39,.27);outline.lineTo(.27,.13);outline.lineTo(.13,.035);outline.closePath();
        this.geometries.naviWing=new THREE.ShapeGeometry(outline);
      }
      const fairy=new THREE.Group();
      fairy.name='Navi';
      const glow=new THREE.Sprite(new THREE.SpriteMaterial({
        color:'#77e7ff',map:this.moonEffectTexture('flash'),transparent:true,depthWrite:false,opacity:.24,
      }));
      glow.name='navi-glow';glow.scale.setScalar(.92);glow.renderOrder=11;fairy.add(glow);
      const bulb=this.mesh('sphere','#5eddf9',[.117,.117,.117],[0,0,0],fairy,{basic:true});
      bulb.name='navi-blue-orb';bulb.renderOrder=12;
      const spark=this.mesh('sphere','#dcfbff',[.073,.073,.073],[-.024,.023,.051],fairy,{basic:true});
      spark.renderOrder=13;
      const wings=[];
      for(const sign of [-1,1])for(const lower of [false,true]){
        const joint=new THREE.Group(),wing=new THREE.Mesh(this.geometries.naviWing,this.mat(lower?'#b0ecfa':'#dcfbff',{basic:true,opacity:lower?.67:.85,side:THREE.DoubleSide}));
        wing.scale.set(sign*(lower?.45:.82),lower?-.40:.80,1);
        joint.position.set(sign*.054,lower?-.045:.025,-.028);joint.add(wing);fairy.add(joint);
        wing.name='navi-'+(lower?'small':'large')+'-wing';wings.push({joint,sign,lower});
      }
      fairy.userData={glow,wings};
      return fairy;
    }
    naviPose(fairy,time,lossAge=null){
      if(!fairy)return;
      const still=reducedMotion,fallen=Number.isFinite(lossAge);
      const drift=still?0:Math.sin(time*2.6),lowered=fallen?clamp(lossAge/1.46,0,1):0;
      fairy.position.set(-.81+drift*.12,1.76+drift*.10-lowered*.82,.45+(still?0:.16*Math.cos(time*2.3)));
      const {glow,wings}=fairy.userData;
      // A faint two-second breath, never a hard on/off or screen flash.
      glow.material.opacity=still?.22:.19+.10*(.5+.5*Math.sin(time*2.75));
      for(const {joint,sign,lower} of wings){
        const flap=still?0:Math.sin(time*(lower?44:37)+(lower?.85:0));
        joint.rotation.set(.12+.09*flap,sign*(.24+.59*flap),sign*(.06+flap*(lower?.24:.19)));
      }
    }
    glideCloth(parent,nx,nz,paint,sample){
      // Flat-shaded fabric panels stay crisp beside the directional pixel sprites.
      const vertices=new Float32Array(nx*nz*18),colors=new Float32Array(vertices.length);
      const coords=[];
      for(let row=0;row<nz;row++)for(let col=0;col<nx;col++){
        const u=col/nx,v=row/nz,u1=(col+1)/nx,v1=(row+1)/nz;
        const ink=new THREE.Color(paint(col,row));
        for(const point of [[u,v],[u1,v],[u,v1],[u1,v],[u1,v1],[u,v1]]){
          ink.toArray(colors,coords.length*3);coords.push(point);
        }
      }
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3).setUsage(THREE.DynamicDrawUsage));
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));
      mesh.frustumCulled=false;parent.add(mesh);
      mesh.userData.flutter=t=>{
        const a=geometry.attributes.position;
        for(let i=0;i<coords.length;i++){ const [u,v]=coords[i];a.setXYZ(i,...sample(u,v,t)); }
        a.needsUpdate=true;
      };
      mesh.userData.flutter(0);
      return mesh;
    }
    buildGlideRig(id){
      const rig=new THREE.Group(),sway=new THREE.Group();
      const cloth=[];
      rig.name='signature-glide:'+id;rig.visible=false;rig.add(sway);
      const {PI,sin}=Math;
      const mesh=(name,geometry,color,scale,position,options={basic:true})=>{
        const piece=this.mesh(geometry,color,scale,position,sway,options);piece.name=name;return piece;
      };
      const ribbon=(name,nx,nz,paint,sample)=>{
        const piece=this.glideCloth(sway,nx,nz,paint,sample);piece.name=name;cloth.push(piece);return piece;
      };
      if(id==='link'){
        ribbon('canvas-wing',10,4,(c,r)=>
          c===0||c===9||r===0||r===3?'#513f35':(r===1&&(c===3||c===6)||r===2&&c>=4&&c<=5?'#367a91':(c+r)%3===0?'#e2b771':'#f3d492'),
        (u,v,t)=>{
          const x=(u-.5)*4.25;
          return [x*(1-.19*v),2.81+.23*(1-x*x/5)+sin(v*PI)*.20+.15*v*sin(t*7+u*6),1.01-1.72*v+.23*Math.abs(x)];
        });
        for(const x of [-1,1]){
          const strut=mesh('paraglider-strut','box','#755338',[.05,1.13,.06],[x*.74,2.40,.33]);
          strut.rotation.z=-x*.37;strut.rotation.x=.22;
        }
        mesh('wooden-grip','box','#5f4132',[1.02,.09,.10],[0,1.94,.11]);
        mesh('leading-edge','box','#9c7045',[3.08,.085,.08],[0,2.91,1.22]);
      }
      Object.assign(rig.userData,{id,equipped:id==='link',sway,cloth,start:null,phase:-1});
      this.updateGlideRig(rig,true,0,true);
      rig.visible=false;rig.userData.start=null;
      return rig;
    }
    updateGlideRig(rig,active,time,reduce){
      const g=rig.userData;
      active=!!(active&&g.equipped);rig.visible=active;
      if(!active){g.start=null;return;}
      if(g.start===null)g.start=time;
      const age=Math.max(0,time-g.start),t=reduce?0:age;
      if(g.phase===t&&g.reduced===reduce)return;
      const open=reduce?1:clamp(age/.18,.62,1);
      g.sway.scale.set(open,1,open);
      g.sway.rotation.set(reduce?0:Math.sin(t*2.7)*.041,0,reduce?0:Math.sin(t*3.35)*.085);
      g.sway.position.y=reduce?0:Math.sin(t*4.3)*.052;
      for(const mesh of g.cloth)mesh.userData.flutter(t);
      g.phase=t;g.reduced=reduce;
    }
    instanced(type, color, transforms, parent = this.environment, castShadow = false) {
      if (!transforms.length) return;
      const inst = new THREE.InstancedMesh(this.geometries[type], this.mat(color), transforms.length);
      transforms.forEach((t, i) => { this.dummy.position.set(t.x, t.y+(parent===this.environment?this.groundHeight(t.x,t.z):0), t.z); this.dummy.scale.set(t.sx || 1, t.sy || 1, t.sz || 1); this.dummy.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0); this.dummy.updateMatrix(); inst.setMatrixAt(i, this.dummy.matrix); if (t.color) inst.setColorAt(i, new THREE.Color(t.color)); });
      inst.castShadow = castShadow; inst.receiveShadow = true; parent.add(inst); return inst;
    }
    clearGroup(group) { while (group.children.length) { const child=group.children[0];child.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.dispose();});group.remove(child); } }
    buildRealm(index,stage=1) {
      this.landmark=null;this.scene.fog.near=75;this.scene.fog.far=190;
      this.realm = index; this.levelStage=stage; this.clearGroup(this.environment); this.floating = []; this.billboards=[];this.windmill=null;this.water = null;
      const r = REALMS[index], rand = seeded(1977 + index * 391+stage*577), env = this.environment;
      this.scene.background.set(r.sky); this.scene.fog.color.set(r.fog);this.ambient.intensity=index===4?.78:index===2?.95:1.2;this.sun.intensity=index===4?.85:index===2?1:1.3; this.ambient.color.set(index === 2 ? '#c7c7ef' : index === 4 ? '#ffe2bc' : '#fff8e3'); this.ambient.groundColor.set(index === 2 ? '#4d4365' : '#657354'); this.sun.color.set(index===4?'#b0ccd8':index === 2 || index === 5 ? '#e1dcff' : '#fff0ca');
      const groundTexture = RelicArt.terrain(index); groundTexture.repeat.set(42,42);
      if(!this.geometries.ground)this.geometries.ground=new THREE.PlaneGeometry(320,320,160,160);
      const vertices=this.geometries.ground.attributes.position;for(let i=0;i<vertices.count;i++)vertices.setZ(i,Terrain.height(index,stage,vertices.getX(i),-vertices.getY(i)));vertices.needsUpdate=true;this.geometries.ground.computeVertexNormals();
      const ground = new THREE.Mesh(this.geometries.ground, this.terrainMaterial(index));
      ground.rotation.x = -Math.PI/2; ground.position.y = -.03; ground.receiveShadow = true; env.add(ground);this.buildGroundOverlay(index,stage);
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
        if (Math.hypot(x, z) < 10 || Terrain.SCENIC_TRAILS.some(g => Math.hypot(g.x - x, g.z - z) < 5)) continue;
        const size = .2 + rand() * .45;
        if (i % 4 === 0) rocks.push({x, y: size * .45, z, sx:size*1.8, sy:size, sz:size*1.5, ry:rand()*6, color:i%8===0?'#aab1a1':'#839488'});
        else grass.push({x,y:size*.35,z,sx:.06,sy:size,sz:.4,ry:rand()*6,color:index===4?'#be9770':index===2?'#a1a0b3':index===5?'#bac5b4':i%2?'#c6cf94':'#718d4e'});
        if (i % 6 === 0) flowers.push({x:x+.3,y:.19,z:z+.2,sx:.12,sy:.12,sz:.12,color:index===2?'#e9b6de':index===4?'#f8c580':i%2?'#fcf3c7':'#e7bd91'});
      }
      this.instanced('lowSphere', '#9da58d', rocks, env, true);
      for(const obstacle of Terrain.layout(index,stage).obstacles){

        if(obstacle.kind==='rock')this.mesh('lowSphere','#919a82',[obstacle.radius*1.5,obstacle.height,obstacle.radius*1.5],[obstacle.x,.2,obstacle.z],env);
      }

      for (const g of Terrain.SCENIC_TRAILS) { for(let k=1;k<12;k++) {const t=k/12;path.push({x:g.x*t+(rand()-.5),y:.015,z:g.z*t+(rand()-.5),sx:.25+rand()*.25,sy:.025,sz:.3+rand()*.25,ry:rand()*6});}
      }
      this.instanced('cylinder',index===4?'#a2947b':'#c4c5a1',path);
      this.buildShrine(r, env);
      // Each realm has its own skyline and landmark, beyond a palette swap.
      if (index === 0) {
        this.buildRuin(9,-15,1.3,env); this.buildRuin(-11,8,.7,env);
        const castle=new THREE.Group();castle.position.set(-17,0,-26);env.add(castle);this.mesh('box','#c7c7b3',[13,8,5],[0,4,0],castle);for(const x of[-7,7]){this.mesh('cylinder','#d7d4be',[2.5,11,2.5],[x,5.5,0],castle);this.mesh('cone','#60818b',[3.4,5,3.4],[x,13,0],castle);}this.mesh('box','#777c73',[2.6,4,.2],[0,2,2.6],castle);
      }
      if (index === 1) {
        this.water = null;
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

      }
      if(index===7){

        for(let i=0;i<9;i++)this.mesh('box','#d7e9d9',[.08,.03,4],[30+i*3,.05,-15+i*4],env);
        this.buildRuin(-13,-19,1.3,env);this.mesh('box','#adbaa8',[8,1,5],[19,.4,-19],env);for(const x of[16,22])this.mesh('cylinder','#cbd0b4',[.7,7,.7],[x,3.5,-20],env);
      }
      if(index===1){const tower=new THREE.Group();tower.position.set(32,0,-26);env.add(tower);for(let i=0;i<4;i++)this.mesh('cylinder','#ccc6a4',[5-i*.7,3,5-i*.7],[0,1.5+i*3,0],tower);this.mesh('box','#60787e',[1.6,3,.2],[0,7,3.7],tower);}
      if(index===4){const lightroot=new THREE.Group();lightroot.position.set(-16,0,-19);env.add(lightroot);this.mesh('cylinder','#b8bc8e',[.9,8,.9],[0,4,0],lightroot);for(const s of[-1,1]){const branch=this.mesh('cylinder','#bdc7a2',[.4,5,.4],[s*1.5,7,0],lightroot);branch.rotation.z=s*.65;this.mesh('sphere','#e2ecb1',[1.3,1.3,1.3],[s*3,9,0],lightroot,{emissive:'#d7e6a3',emissiveIntensity:.7});}}
      if(stage>1)for(let i=0;i<stage+1;i++){const angle=i*Math.PI*2/(stage+1),x=Math.cos(angle)*13,z=Math.sin(angle)*13;this.buildRuin(x,z,.35+stage*.1,env);}
      const mountains=[],clouds=[];
      for(let i=0;i<20;i++){const a=i*.314; mountains.push({x:Math.cos(a)*145,y:3,z:Math.sin(a)*145,sx:12+rand()*10,sy:14+rand()*14,sz:12+rand()*10,color:index===2?'#7f8198':index===4?'#7b7370':'#a8bfad'});if(i%2===0)clouds.push({x:Math.cos(a)*135,y:20+rand()*10,z:Math.sin(a)*135,sx:8+rand()*7,sy:1.2,sz:3+rand()*2});}
      this.instanced('cone','#b4c6b0',mountains);this.instanced('sphere',index===2?'#9b9bad':'#eef2dd',clouds);
      this.buildWorldDressing(index,stage);this.makeMotes(r,index);
    }
    buildLandmark(index,stage,landmark) {
      this.realm=index; this.levelStage=stage; this.landmark=landmark;
      this.clearGroup(this.environment);
      this.floating=[];this.billboards=[];this.windmill=null;this.water=null;
      this.shrineGem=null;this.shrineRing=null;
      const {style,limit,ground,wall,accent,sky}=landmark,env=this.environment,random=seeded(8129+index*89);
      const box=(color,sx,sy,sz,x,y,z,lit=false)=>this.mesh('box',color,[sx,sy,sz],[x,y,z],env,lit?{basic:true}:{});
      const shape=(kind,color,sx,sy,sz,x,y,z,lit=false)=>this.mesh(kind,color,[sx,sy,sz],[x,y,z],env,lit?{basic:true}:{});
      const mix=(left,right,t)=>'#'+new THREE.Color(left).lerp(new THREE.Color(right),t).getHexString();
      const shade=mix(ground,'#080b17',.45),trim=mix(wall,accent,.25),span=limit*2;
      this.scene.background.set(sky);this.scene.fog.color.set(sky);
      this.scene.fog.near=style==='roots'?38:63;this.scene.fog.far=style==='roots'?100:145;
      this.ambient.intensity=1.15;this.ambient.color.set(mix('#fff1d9',accent,.22));this.ambient.groundColor.set(wall);
      this.sun.intensity=1.1;this.sun.color.set(mix('#fff5df',accent,.18));
      box(shade,span+1,1.2,span+1,0,-.65,0).receiveShadow=true;
      // A contiguous flat floor with color variation, not geometry the player can catch on.
      const tiles=[],count=18,step=span/count;
      for(let row=0;row<count;row++)for(let col=0;col<count;col++){
        const x=(col+.5)*step-limit,z=(row+.5)*step-limit;
        const pattern=style==='roots'?Math.cos(Math.hypot(x,z)*.75)*.12:style==='water'?Math.sin(row*.9+col*.3)*.12:
          style==='fortress'?((row+col)%2)*.11:style==='twilight'?(Math.abs(x)+Math.abs(z)<limit?.15:0):
          style==='wind'?Math.sin((row+col)*.8)*.1:style==='moon'?(Math.abs(x)<3||Math.abs(z)<3?.12:0):0;
        tiles.push({x,y:-.035,z,sx:step-.036,sy:.07,sz:step-.036,color:mix(ground,shade,.21+random()*.18+pattern)});
      }
      this.instanced('box','#ffffff',tiles).receiveShadow=true;
      // A low boundary reads at any camera angle; tall landmarks stay outside the walkable area.
      for(const side of [-1,1]){
        box(wall,span+.65,.35,.63,0,.15,(limit+.24)*side);
        box(wall,.63,.35,span+.65,(limit+.24)*side,.15,0);
        box(trim,span+.72,.07,.22,0,.35,(limit+.25)*side);
        box(trim,.22,.07,span+.72,(limit+.25)*side,.35,0);
      }
      const floorMark=(cx,cz,r,color)=>{
        const disc=shape('torus',color,r,r,.88,cx,.018,cz,true);disc.rotation.x=-Math.PI/2;
      };
      floorMark(0,0,style==='roots'?6.6:style==='water'?7.7:8.3,mix(ground,accent,.24));
      if(style==='water'||style==='twilight'||style==='moon')floorMark(0,0,11.1,mix(ground,accent,.17));
      const far=limit+7, edge=(a,offset)=>(limit+offset)/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));
      switch(style){
        case 'roots': {
          // Inside the trunk: bark ribs, spreading roots and amber sap lights.
          for(let i=0;i<13;i++){
            const a=i*Math.PI*2/13,bark=mix(wall,ground,random()*.34),rad=edge(a,7+random()*5);
            const x=Math.cos(a)*rad,z=Math.sin(a)*rad;
            const rib=shape('cylinder',bark,3+random()*2,24+random()*8,4,x,11,z);
            rib.rotation.z=Math.cos(a)*.09;rib.rotation.x=Math.sin(a)*.09;
            const root=shape('cone',mix(bark,'#25140e',.15),3.2,12,3.2,x,3,z);
            root.rotation.order='YXZ';root.rotation.y=1.57-a;root.rotation.z=1.05;
            shape('lowSphere',mix(wall,'#31573a',.24),7,4,7,x,18,z);
            shape('diamond',accent,.17,.42,.17,Math.cos(a)*edge(a,1.65),1.8,Math.sin(a)*edge(a,1.65),true);
          }
          for(const x of [-8,8]){
            const frame=box(wall,3,12,4,x,5,-far);
            frame.rotation.z=x>0?.36:-.36;
          }
          shape('lowSphere',mix(ground,accent,.17),13,3.7,6,0,11,-far-2);
          break;
        }
        case 'water': {
          box(mix(sky,accent,.26),span+40,.15,span+40,0,-.8,0);
          for(let i=-3;i<=3;i++){
            const x=i*8;
            box(wall,2.2,9,2.2,x,4,-far);
            box(trim,3,.55,3,x,8.7,-far);
            box(accent,.24,2.7,.14,x,5,-far+1.18,true);
            for(const side of [-1,1])box(wall,2.2,4+(i%2===0?3:0),2.2,side*far,2,x);
          }
          box(wall,55,2,3,0,9.7,-far);
          for(let i=0;i<16;i++)box(mix(sky,accent,.38),2+random()*8,.035,.14,(random()-.5)*(span+20),-.69,limit+1.5+random()*13,true);
          break;
        }
        case 'fortress': {
          for(let i=-4;i<=4;i++){
            const x=i*7;
            box(wall,7.05,6,4,x,2.8,-far);
            box(trim,2.8,2.1,4.25,x,6.4,-far);
            if(i%2===0)box(accent,.83,2.7,.13,x,4,-far+2.07);
          }
          for(const side of [-1,1]){
            shape('cylinder',wall,6,16,6,side*17,7,-far-5);
            shape('cone',trim,7,6,7,side*17,18,-far-5);
            for(let z=-24;z<=24;z+=12)box(wall,3,4,6,side*far,1.9,z);
          }
          break;
        }
        case 'tower': {
          box(mix('#203b52',sky,.3),span+55,.2,span+55,0,-.88,0);
          for(let i=0;i<4;i++)box(i%2===0?wall:trim,25-i*4,2.7,6,0,i*2.65+1,-far-i*.6);
          box(mix(wall,'#182d3f',.5),6,5,.2,0,2.8,-far+3.08);
          for(const x of [-11,-6,6,11]){
            box(trim,2.3,5,2.3,x,2.4,-far+5);
            shape('diamond',accent,.45,.75,.45,x,5.6,-far+5,true);
          }
          for(let i=0;i<22;i++){
            const a=i*Math.PI*2/22;
            box(mix(sky,accent,.34),3+random()*4,.04,.2,Math.cos(a)*(limit+12),-.73,Math.sin(a)*(limit+12),true).rotation.y=-a;
          }
          break;
        }
        case 'twilight': {
          for(let i=0;i<15;i++){
            const a=i*Math.PI*2/15,rad=edge(a,7+random()*5);
            shape('diamond',i%2?wall:trim,2.4,7+random()*7,2.4,Math.cos(a)*rad,3+random()*3,Math.sin(a)*rad);
            shape('diamond',accent,.21,1,.21,Math.cos(a)*edge(a,1.4),1.6,Math.sin(a)*edge(a,1.4),true);
          }
          const mirror=shape('torus',accent,8,8,1.14,0,8.5,-far-5,true);
          mirror.rotation.y=.15;
          const inner=shape('disc',mix(sky,wall,.6),7.45,7.45,1,0,8.5,-far-5.9,true);
          inner.rotation.y=.15;
          break;
        }
        case 'sky': {
          shape('cylinder',wall,limit*1.4,3,limit*1.4,0,-2.5,0);
          for(let i=0;i<12;i++){
            const a=i*.5236,rad=limit+13+random()*12,x=Math.cos(a)*rad,z=Math.sin(a)*rad;
            shape('lowSphere','#edf6ed',7+random()*5,1.4,6,x,-.75+random()*3,z);
            if(i%2===0)shape('cone',wall,3.5,7,3.5,x,1,z).rotation.z=Math.PI;
          }
          for(const x of [-8,-4,4,8]){
            shape('cylinder',trim,1.14,7,1.14,x,3.5,-far+1);
            shape('diamond',accent,.7,1.2,.7,x,7.9,-far+1,true);
          }
          box(wall,20,.8,3,0,7.1,-far+1);
          break;
        }
        case 'wind': {
          for(let i=0;i<12;i++){
            const a=i*.5236,rad=edge(a,8+random()*4),x=Math.cos(a)*rad,z=Math.sin(a)*rad;
            const spike=shape('cone',i%2?wall:trim,3.4,14+random()*7,3.4,x,5,z);
            spike.rotation.z=Math.cos(a)*.3;spike.rotation.x=-Math.sin(a)*.3;
            shape('lowSphere',mix(wall,accent,.35),3.5,1.25,1.9,x,2,z);
          }
          for(const x of [-13,-6,6,13]){
            shape('cylinder',trim,.28,6,.28,x,3,-far+1);
            box(mix(trim,accent,.35),4,.7,.1,x+2,5.7,-far+1);
            shape('diamond',accent,.3,.65,.3,x,6.5,-far+1,true);
          }
          break;
        }
        case 'moon': {
          box(wall,13,18,9,0,8,-far-4);
          box(trim,14.5,1.25,9.5,0,17,-far-4);
          shape('cone',wall,10,7.5,8,0,20.5,-far-4);
          const face=shape('disc','#f2d9a1',3.7,3.7,1,0,12,-far+.66,true);
          face.material=this.mat('#f2d9a1',{basic:true,side:THREE.DoubleSide});
          box(wall,.21,2.25,.18,0,12.9,-far+.72,true);
          const hand=box(wall,.24,1.62,.19,.59,11.65,-far+.74,true);hand.rotation.z=1;
          for(const x of [-15,15])box(trim,7,4,5,x,1.9,-far);
          shape('sphere','#e3ddd5',6.3,6.3,6.3,-20,25,-far-16,true);
          break;
        }
      }
      this.makeMotes(landmark,index);
    }
    billboardBatch(kind,id,items,width,height){
      if(!items.length)return;
      if(!this.geometries.pixelQuad)this.geometries.pixelQuad=new THREE.PlaneGeometry(1,1).translate(0,.5,0);
      const variant=items[0].variant||0,key='billboard:'+kind+':'+id+':'+variant;
      if(!this.materials.has(key)){
        const material=new THREE.MeshBasicMaterial({map:RelicArt.material(kind,id,0,variant).map,alphaTest:.45,side:THREE.DoubleSide});
        if(kind==='tree'||kind==='plant'){
          material.onBeforeCompile=shader=>{
            shader.uniforms.windTime=this.windClock;shader.uniforms.windStrength=this.windStrength;
            shader.vertexShader='uniform float windTime;uniform float windStrength;\n'+shader.vertexShader;
            shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat phase=instanceMatrix[3].x*0.13+instanceMatrix[3].z*0.19;transformed.x+=sin(windTime*1.7+phase)*position.y*position.y*'+(kind==='tree'?'0.012':'0.055')+'*windStrength;');
          };
          material.customProgramCacheKey=()=>kind+'-wind-v1';
        }
        this.materials.set(key,material);
      }
      const mesh=new THREE.InstancedMesh(this.geometries.pixelQuad,this.materials.get(key),items.length);mesh.frustumCulled=false;mesh.castShadow=kind==='tree';mesh.receiveShadow=false;
      const anchored=items.map(item=>({...item,y:this.groundHeight(item.x,item.z)}));
      this.environment.add(mesh);this.billboards.push({mesh,items:anchored,width,height,kind});this.billboardOrientation=null;
    }
    updateBillboards(){
      const quality=storage.graphics;
      for(const batch of this.billboards)batch.mesh.count=batch.kind==='tree'?batch.items.length:Math.max(1,Math.floor(batch.items.length*(quality==='low'?.48:quality==='high'?1:.83)));
      if(this.billboardOrientation&&Math.abs(this.billboardOrientation.dot(this.camera.quaternion))>.99999)return;
      this.billboardOrientation=this.camera.quaternion.clone();
      for(const batch of this.billboards){
        batch.items.forEach((item,i)=>{this.dummy.position.set(item.x,item.y+.02,item.z);this.dummy.quaternion.copy(this.camera.quaternion);this.dummy.scale.set(batch.width*item.scale,batch.height*item.scale,1);this.dummy.updateMatrix();batch.mesh.setMatrixAt(i,this.dummy.matrix);});batch.mesh.instanceMatrix.needsUpdate=true;
      }
    }
    buildGroundOverlay(index,stage){
      if(!this.geometries.groundOverlay)this.geometries.groundOverlay=new THREE.PlaneGeometry(128,128,64,64);
      const geometry=this.geometries.groundOverlay,vertices=geometry.attributes.position;
      for(let i=0;i<vertices.count;i++)vertices.setZ(i,Terrain.height(index,stage,vertices.getX(i),-vertices.getY(i)));vertices.needsUpdate=true;geometry.computeVertexNormals();
      const key='overlay:'+index+':'+stage;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshLambertMaterial({map:RelicArt.groundOverlay(index,stage),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
      const overlay=new THREE.Mesh(geometry,this.materials.get(key));overlay.rotation.x=-Math.PI/2;overlay.position.y=.01;overlay.receiveShadow=true;this.environment.add(overlay);
    }
    buildWorldDressing(index,stage){
      const layout=Terrain.layout(index,stage),trees=layout.obstacles.filter(item=>item.kind==='tree'),artRealm=index===6?0:index;
      for(let variant=0;variant<3;variant++)this.billboardBatch('tree',artRealm,trees.filter(item=>item.id%3===variant).map(item=>({...item,variant})),4.5,6);
      for(let variant=0;variant<4;variant++){
        this.billboardBatch('plant',index,layout.details.filter(item=>item.kind==='plant'&&item.variant===variant),1.15,1.15);
        this.billboardBatch('prop',index,layout.details.filter(item=>item.kind==='prop'&&item.variant===variant),1.75,1.75);
      }
      const markers=[],reeds=[];
      for(const trail of Terrain.SCENIC_TRAILS){const length=Math.hypot(trail.x,trail.z),nx=-trail.z/length,nz=trail.x/length;for(const t of[.28,.63])markers.push({x:trail.x*t+nx*3.6,z:trail.z*t+nz*3.6,variant:index===2||index===4||index===7?1:2,scale:1});}
      this.billboardBatch('prop',index,markers,1.8,1.8);
      if(index===1||index===7){for(let i=0;i<30;i++){const z=-35+i*2.4;reeds.push({x:13+Math.sin(i*.7+stage)*1.8,z,variant:1,scale:.7+(i%4)*.18});}this.billboardBatch('plant',index,reeds,1.3,1.8);}
      const env=this.environment;
      for(const trail of Terrain.SCENIC_TRAILS){
        const length=Math.hypot(trail.x,trail.z),x=trail.x*.22-trail.z/length*3.5,z=trail.z*.22+trail.x/length*3.5;
        this.mesh('box',index===4?'#796b7c':'#8e7955',[.12,1.65,.12],[x,.8,z],env,{texture:'wood'});
        this.mesh('box','#494a4a',[.42,.48,.42],[x,1.73,z],env);this.mesh('box',index===4?'#a9e4d7':index===2?'#e5b593':'#ffe2a0',[.32,.31,.32],[x,1.76,z],env,{basic:true});
        this.mesh('cone','#797b65',[.38,.25,.38],[x,2.1,z],env);
      }
      if(index===6){
        for(let i=0;i<3;i++){
          const x=-19+i*18,z=14+(i%2)*8,home=new THREE.Group();home.position.set(x,Terrain.height(index,stage,x,z),z);env.add(home);
          this.mesh('cylinder','#ffffff',[3.21,3.95,3.21],[0,2,0],home,{texture:'wood'});
          this.mesh('cone','#ffffff',[4.55,3.05,4.55],[0,5,0],home,{texture:'roof'});
          this.mesh('box','#493e32',[1.25,2.15,.2],[0,1.08,3.22],home);
          for(const sx of[-1.65,1.65]){this.mesh('box','#4b4634',[1.03,1.08,.22],[sx,2.52,2.82],home);this.mesh('box','#e9d293',[.73,.78,.24],[sx,2.52,2.84],home,{basic:true});this.mesh('box','#65523a',[.08,.8,.28],[sx,2.52,2.88],home);}
          for(let step=0;step<3;step++)this.mesh('box','#a58d63',[1.7,.19,1.1],[0,.1+step*.17,4.1-step*.5],home,{texture:'wood'});
          for(const side of[-1,1]){this.mesh('box','#776346',[.12,.95,3],[side*2.4,.5,4.1],home,{texture:'wood'});this.mesh('box','#c5b38a',[.12,.13,3],[side*2.4,1.04,4.1],home);}
        }
      }
      if(index===0||index===5){for(const x of[-8,8]){const banner=this.mesh('box','#ffffff',[1.4,2.6,.08],[x,3.1,-15],env,{texture:'cloth'});this.mesh('cylinder','#867052',[.06,4.6,.06],[x,2.3,-15],env);banner.rotation.y=.2;}}
      if(index===3){const mill=new THREE.Group();mill.position.set(16,Terrain.height(index,stage,16,-17),-17);env.add(mill);this.mesh('cylinder','#e3d7b0',[1.5,6,1.5],[0,3,0],mill);this.mesh('cone','#ffffff',[2.3,2.8,2.3],[0,7.1,0],mill,{texture:'roof'});const sails=new THREE.Group();sails.position.set(0,5.5,1.6);mill.add(sails);for(let i=0;i<4;i++){const blade=new THREE.Group();blade.rotation.z=i*Math.PI/2;sails.add(blade);this.mesh('box','#a78c64',[.13,4,.13],[0,1.6,0],blade);this.mesh('box','#e8dfb6',[.85,2.3,.08],[.35,2.05,0],blade);}this.windmill=sails;}
    }
    buildRuin(x,z,s,parent) {
      const group=new THREE.Group();group.position.set(x,this.groundHeight(x,z),z);group.scale.setScalar(s);parent.add(group);
      this.mesh('box','#dadcc8',[5,.4,3],[0,.15,0],group,{texture:'stone'});
      for(const dx of [-1.7,1.7]){this.mesh('box','#ffffff',[.85,4,1],[dx,2.2,0],group,{texture:'stone'}).castShadow=true;this.mesh('box','#e0d9b7',[1.3,.4,1.4],[dx,4.3,0],group);}
      this.mesh('box','#ffffff',[5,.8,1.5],[0,4.7,0],group,{texture:'stone'}).castShadow=true;
      for(const side of[-1,1]){for(let i=0;i<5;i++)this.mesh('box',this.realm===4?'#8eabb0':'#789263',[.22,.38,.1],[side*1.65,4-i*.42,.54],group);this.mesh('box','#b1bd93',[1.1,.1,1.12],[side*1.7,4.52,0],group);}
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
    makeMotes(realm,index) {
      if(this.motes){this.scene.remove(this.motes);this.motes.geometry.dispose();this.motes.material.dispose();}
      const random=seeded(86+index),positions=new Float32Array(100*3);for(let i=0;i<100;i++){positions[i*3]=(random()-.5)*65;positions[i*3+1]=.5+random()*8;positions[i*3+2]=(random()-.5)*65;}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));this.motes=new THREE.Points(geometry,new THREE.PointsMaterial({color:realm.accent,size:index===4?.09:.075,transparent:true,opacity:.6,depthWrite:false}));this.scene.add(this.motes);this.motes.visible=storage.graphics!=='low'&&!reducedMotion;
    }
    enemyModel(e) {
      const group=new THREE.Group(); this.entities.add(group);
      const height=e.type==='boss'?(BOSSES[e.bossId]?.height||5):e.type==='boar'?2.5:e.type==='bat'?1.65:1.7;
      const sprite=RelicArt.sprite(e.type==='boss'?'boss':'enemy',e.bossId||e.enemyId||e.type,height*.89,height);group.add(sprite);group.userData.sprite=sprite;
      group.userData.spriteHeight=height;
      this.shadow(group,e.radius*1.05,.17);if(e.elite)group.scale.setScalar(1.3);return group;
    }
    enemyPose(group,e,game,time){
      const sprite=group.userData.sprite,height=group.userData.spriteHeight;
      const boss=e.type==='boss',kind=boss?'boss':'enemy',id=e.bossId||e.enemyId||e.type,
        base=e.action||'walk',react=(!['windup','attack','spawn'].includes(base)&&e.hitReact>0);
      const action=react?'hurt':base,motion=boss?(e.intent||''):e.attackMotion||'';
      const rawAge=react?Math.max(0,.24-e.hitReact):Number.isFinite(e.actionAge)?e.actionAge:0;
      const duration=Number.isFinite(e.actionDuration)&&e.actionDuration>0?e.actionDuration:({windup:.55,attack:.36,spawn:.8}[action]||0);
      const progress=duration?clamp(rawAge/duration,0,.999):0;
      // Play each keyed tell once over its actual simulation window. Loop only walks and idle.
      const span={windup:6/7,attack:6/14,spawn:6/7}[action],age=span?span*progress:rawAge;
      const frame=reducedMotion?
        action==='attack'?3:action==='windup'?4:action==='spawn'?4:0:RelicArt.animationFrame(action,age);
      const facing=Number.isFinite(e.facing)?e.facing:Math.atan2(game.player.x-e.x,game.player.z-e.z);
      const heading=Math.atan2(this.camera.position.x-e.x,this.camera.position.z-e.z),
        direction=BonkCamera.direction(facing,heading),attack=action==='attack'||action==='windup',
        flip=attack&&direction>=5?1:0,stage=boss?(e.stage||1):1;
      group.position.set(e.x,game.groundAt(e.x,e.z),e.z);
      sprite.material=RelicArt.material(kind,id,boss&&attack?motion||0:0,frame,false,action,flip);
      const phase=(e.phase??time)+e.id*.61,air=boss?!!BOSSES[id]?.flying:e.type==='bat';
      let lift=air?(boss?.5:1):0,sx=1,sy=1;
      if(!reducedMotion){
        const gait=(id==='seahat'?phase*12:id==='takkuri'?phase*6:phase*(boss?3:7));
        if(air)lift+=Math.sin(gait)*(boss?.12:.16);
        if(action==='walk'){
          if(e.type==='slime'){
            const hop=Math.max(0,Math.sin(phase*6));
            lift=hop*(id==='tektite'?.28:.13);sy=.92+hop*.18;sx=1.09-hop*.17;
          }else if(e.type==='boar'){
            lift=Math.max(0,Math.sin(phase*(id==='skulltula'?8:11)))*(id==='evermean'?.05:.10);
          }
        }else if(action==='windup'){
          const crouch=motion==='charge'||motion==='lunge'||motion==='swipe'||motion==='dive';
          if(crouch){sx=1+.08*progress;sy=1-(.12+.03*stage)*progress;}
          if(air&&motion==='dive')lift+=.30*progress;
        }else if(action==='attack'){
          const beat=Math.sin(Math.PI*progress);
          if(motion==='charge'||motion==='lunge'||motion==='swipe'){sx=1+.15*beat;sy=1-.08*beat;}
          else if(motion==='volley'||motion==='spit'){sx=1+.10*beat;sy=1+.08*beat;}
          if(motion==='dive'||(air&&motion==='landmark'))lift=Math.max(.18,lift-.46*beat);
        }else if(action==='hurt'){
          sx=1-.09*(1-rawAge/.24);sy=1+.08*(1-rawAge/.24);
        }
      }
      sprite.position.y=lift;sprite.scale.set(height*.89*sx,height*sy,1);
      const status=['seal','freeze','shock','burn','wet'].find(id=>e.statuses?.[id]);
      if(status&&!group.userData.statusRing){const ring=this.mesh('torus','#9ce2ef',[e.radius+.18,e.radius+.18,e.radius+.18],[0,.16,0],group,{basic:true});ring.rotation.x=-Math.PI/2;group.userData.statusRing=ring;}
      if(group.userData.statusRing){
        group.userData.statusRing.visible=!!status;
        if(status){group.userData.statusRing.material=this.mat(Combat.STATUS[status].color,{basic:true});group.userData.statusRing.position.y=.16+(reducedMotion?0:Math.sin(time*5)*.07);}
      }
    }
    enemyStrikeEffect(event){
      if(this.effects.length>108)return;
      const id=event.bossId||event.enemyId;
      // A small weapon/face accent, not another ground telegraph or an apparent hitbox.
      const colors={deku_baba:'#bbd086',deku_scrub:'#cfad73',octorok:'#82cad9',keese:'#dfbded',
        seahat:'#cce6b7',shadow_kargarok:'#ab96ef',takkuri:'#f7bc95',skulltula:'#ffe09b',
        lizalfos:'#aff2aa',shadow_beast:'#b6a4f5',gloom_bokoblin:'#d58ccc',evermean:'#cfb58a'};
      const color=BOSSES[event.bossId]?.color||colors[id]||'#f4cca0',kind=event.kind;
      const caster=kind==='summon'||kind==='teleport'||kind==='volley'||kind==='spit';
      const count=reducedMotion||storage.graphics==='low'?1:event.bossId?5:3;
      const height=event.bossId?1.55:.95,baseHeight=this.groundHeight(event.x,event.z)+height,origin=event.facing||0;
      for(let i=0;i<count;i++){
        const spread=i-(count-1)/2,facing=origin+spread*(caster?.26:.38),
          dx=Math.sin(facing),dz=Math.cos(facing),offset=event.bossId?1.05:.52,reach=event.bossId?1.35:.79;
        const size=event.bossId?.24:.16;
        const mesh=this.mesh(caster?'diamond':kind==='dive'?'lowSphere':'box',color,[size,size,size],[event.x+dx*offset,baseHeight,event.z+dz*offset],this.entities,{basic:true});
        mesh.rotation.y=facing;
        const duration=reducedMotion?.20:caster?.29:.26;
        this.effects.push({mesh,time:duration,duration,kind:'enemyStrike',x:event.x,z:event.z,y:baseHeight,
          offset,reach,dx,dz,size,caster});
      }
    }
    defeatEffect(event) {
      if(this.effects.length>100)return;
      const type=event.enemyType||'slime',boss=type==='boss',height=boss?(BOSSES[event.bossId]?.height||5):type==='boar'?2.5:1.7;
      const mesh=RelicArt.sprite(boss?'boss':'enemy',event.bossId||event.enemyId||type,height*.89,height);mesh.position.set(event.x,this.groundHeight(event.x,event.z),event.z);mesh.material=mesh.material.clone();this.entities.add(mesh);
      this.effects.push({mesh,time:boss?1:.65,duration:boss?1:.65,kind:'ghost',actorKind:boss?'boss':'enemy',actorId:event.bossId||event.enemyId||type,
        facing:event.facing,stage:event.stage||1,material:mesh.material});
      this.popEffect(event.x,event.z,boss?'#f5dc9b':'#d5e6b8');
    }
    aimBillboard(mesh,vx,vy,vz,width,height) {
      const length=Math.hypot(vx,vy,vz);
      if(!length)return;
      const [center,ahead,right]=this.aimPoints||(this.aimPoints=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]);
      // Project in screen units: normalized-device X and Y have different scales on wide screens.
      center.copy(mesh.position).project(this.camera);
      ahead.copy(mesh.position).addScaledVector(right.set(vx,vy,vz),1/length).project(this.camera);
      const m=this.camera.matrixWorld.elements;
      right.set(mesh.position.x+m[0],mesh.position.y+m[1],mesh.position.z+m[2]).project(this.camera);
      const dx=(ahead.x-center.x)*this.camera.aspect,dy=ahead.y-center.y;
      const distance=Math.hypot(dx,dy),reference=Math.abs((right.x-center.x)*this.camera.aspect);
      if(distance>1e-5)mesh.material.rotation=Math.atan2(dy,dx);
      const visibleLength=reference>1e-5?clamp(distance/reference,.32,1.1):1;
      mesh.scale.set(width*visibleLength,height,1);
    }
    projectileModel(type,width,height,directed=false) {
      const mesh=RelicArt.sprite('projectile',type,width,height);
      mesh.center.set(.5,.5);
      if(directed){mesh.material=mesh.material.clone();mesh.userData.ownedMaterial=mesh.material;}
      this.entities.add(mesh);return mesh;
    }
    projectileArt(b){return b.art||(b.ally==='impa'?'impaNeedle':b.type);}
    projectileDirected(b){return ['ember','leaf','impaNeedle','waterShot'].includes(this.projectileArt(b));}
    createProjectile(b){
      const art=this.projectileArt(b),diameter=b.radius?clamp(b.radius*1.85,2.4,4.7):3.15;
      const size=art==='moonKick'?diameter:art==='slingshot'?.52:b.type==='hostile'?.65:1;
      return this.projectileModel(art,size,size,this.projectileDirected(b));
    }
    projectilePose(mesh,b,game) {
      const frame=Math.floor((b.age||0)*12)%8;
      const art=this.projectileArt(b),directed=this.projectileDirected(b),needle=art==='impaNeedle';
      mesh.position.set(b.x,(b.y??game.groundAt(b.x,b.z)+1)+(b.type==='bomb'&&b.flight!=='bolt'?Math.sin(Math.min(1,(b.age||0)/1.15)*Math.PI)*2:0),b.z);
      if(art==='ember'){
        const age=Math.max(0,b.age||0),duration=b.duration||.8,progress=clamp(age/duration,0,1);
        // Open quickly enough to read on a point-blank hit; then widen and dissipate in flight.
        const spread=1-Math.exp(-age*12),waveFrame=reducedMotion?4:Math.min(7,Math.floor(spread*8));
        mesh.material.map=RelicArt.material('projectile','ember',0,waveFrame).map;
        mesh.material.alphaTest=.12;
        mesh.material.opacity=1-clamp((progress-.58)/.42,0,1)*.76;
        this.aimBillboard(mesh,b.vx,b.vy||0,b.vz,reducedMotion?2.75:2.55+spread*.6,reducedMotion?3.85:3.25+spread*1.35);
      }else if(directed){
        mesh.material.map=RelicArt.material('projectile',art,0,frame).map;
        const width=needle?1.3:art==='waterShot'?2.35:1.75;
        this.aimBillboard(mesh,b.vx,b.vy||0,b.vz,width,needle?.52:art==='waterShot'?.87:1.35);
      }else mesh.material=RelicArt.material('projectile',art,0,frame);
    }
    swordWaveRelease(event){
      if(this.effects.length>110||!Number.isFinite(event.facing))return;
      const duration=reducedMotion?.14:.2,mesh=this.projectileModel('ember',1.7,2.55,true);
      mesh.material.alphaTest=.12;mesh.renderOrder=8;
      const effect={mesh,material:mesh.material,kind:'swordWaveRelease',time:duration,duration,
        x:event.x,z:event.z,y:event.y??this.groundHeight(event.x,event.z)+1,
        dx:Math.sin(event.facing),dz:Math.cos(event.facing)};
      this.positionSwordWaveRelease(effect,0);this.effects.push(effect);
    }
    positionSwordWaveRelease(effect,t){
      const travel=reducedMotion?.72:.52+t*.8,{mesh,x,y,z,dx,dz}=effect;
      mesh.position.set(x+dx*travel,y+.05,z+dz*travel);
      mesh.material.map=RelicArt.material('projectile','ember',0,reducedMotion?3:Math.min(5,1+Math.floor(t*6))).map;
      mesh.material.opacity=.8*(1-t);
      this.aimBillboard(mesh,dx,0,dz,1.7+t*.25,reducedMotion?2.65:2.45+t*.95);
    }
    shadowStrikeEffect(event) {
      if(this.effects.length>115)return;
      const duration=event.duration||.4,reach=event.radius??event.reach??2;
      const mesh=this.projectileModel('shadowHand',reach,reach*.68,true);
      mesh.renderOrder=7;
      const effect={mesh,material:mesh.material,kind:'shadowStrike',time:duration,duration,reach,angle:event.facing,
        x:event.x,y:(event.y??this.groundHeight(event.x,event.z)+.95)+this.heroHoverLift('midna',this.elapsed||0)*.7,z:event.z};
      this.positionShadowStrike(effect,0);this.effects.push(effect);
    }
    positionShadowStrike(effect,t) {
      const {mesh,reach,angle,x,y,z}=effect,dx=Math.sin(angle),dz=Math.cos(angle);
      // The hand extends and retracts from the same wrist point; it's never a detached shot.
      const stretch=reducedMotion?.86:.28+.72*Math.sin(Math.PI*clamp(t,0,1))**.85;
      const length=reach*stretch,center=length*.49;
      mesh.position.set(x+dx*center,y+(reducedMotion?0:Math.sin(t*Math.PI)*.15),z+dz*center);
      this.aimBillboard(mesh,dx,0,dz,length,reach*(.42+.12*stretch));
      mesh.material.opacity=1-clamp((t-.69)/.31,0,1);
    }
    allyPulse(event){
      const style=event.kind;
      if(event.type==='companionStrike'&&['slingshot','kunai','rutoWave'].includes(style)){
        this.companionShot(event,{kunai:'impaNeedle',slingshot:'slingshot',rutoWave:'waterShot'}[style]);
        return;
      }
      if(style==='fairy'){
        const x=event.targetX??event.x,z=event.targetZ??event.z;
        this.canonParticles({...event,x,z,radius:Math.min(event.radius||1.4,1.5)},style,4,event.duration||.48);
        return;
      }
      if(['sword','cutlass','giantBlade','hammer','rutoWave','axe','kunai'].includes(style)){
        this.canonParticles(event,style,style==='hammer'?6:7,event.duration||.36);
      }
    }
    companionShot(event,art){
      if(this.effects.length>105||!Number.isFinite(event.targetX)||!Number.isFinite(event.targetZ))return;
      const {x,z,targetX,targetZ}=event;
      const duration=reducedMotion?.13:.20,mesh=this.projectileModel(art,.5,.5,true);
      const effect={mesh,material:mesh.material,kind:'companionShot',art,time:duration,duration,
        x,y:event.y??this.groundHeight(x,z)+.75,z,dx:targetX-x,dz:targetZ-z,
        endHeight:this.groundHeight(targetX,targetZ)+.82};
      this.positionCompanionShot(effect,.11);this.effects.push(effect);
    }
    positionCompanionShot(e,t){
      const travel=reducedMotion?.72:t;
      const {mesh,x,y,z,dx,dz,endHeight}=e,dy=endHeight-y;
      mesh.position.set(x+dx*travel,y+dy*travel,z+dz*travel);
      mesh.material.opacity=.86*(1-t*t);
      if(e.art==='impaNeedle'||e.art==='waterShot')this.aimBillboard(mesh,dx,dy,dz,e.art==='waterShot'?1.66:.83,e.art==='waterShot'?.61:.34);
    }
    canonParticles(event,style,n,duration){
      if(this.effects.length>106)return;
      const count=Math.min(120-this.effects.length,n,reducedMotion||storage.graphics==='low'?4:n);
      const {x,z}=event,ground=this.groundHeight(x,z);
      const water=['rutoWave','rutoSurge','waterGun','waterBlade'].includes(style);
      const shadow=style==='fused',dust=style==='hammer'||style==='goronRoll',fairy=style==='fairy';
      const arc=event.arc??(Math.PI*2),facing=event.facing??0,radius=event.radius||event.reach||2;
      for(let i=0;i<count;i++){
        const spread=i/Math.max(1,count-1)-.5;
        const color=water?['#52b2d4','#a9ecf6','#def8ff'][i%3]:shadow?['#282038','#704b87','#82d1c2'][i%3]:
          dust?['#957052','#ac8057','#e0b47b'][i%3]:fairy?['#fff2a9','#bc99fa','#fcfff0'][i%3]:event.color||'#ffe9b8';
        const geometry=shadow?'box':dust?'lowSphere':'diamond';
        const mesh=this.mesh(geometry,color,[.15,.15,.15],[x,ground+.2,z],this.entities,{basic:true});
        const fx={mesh,time:duration,duration,kind:'canonParticle',style,angle:facing+spread*arc*.9,x,z,
          y:water&&style!=='rutoWave'?ground+.35:(event.y??ground+.25),radius,spread,n:i,water,dust,shadow,fairy};
        this.positionCanonParticle(fx,.08);this.effects.push(fx);
      }
    }
    positionCanonParticle(e,t){
      const m=reducedMotion?.6:t,{style,mesh,radius,spread,n,water,dust,shadow,fairy}=e;
      const melee=['sword','cutlass','giantBlade','axe','kunai'].includes(style);
      const wave=Math.sin(Math.PI*m),dir=e.angle+(melee?(m-.5)*.64:fairy?m*4:0);
      const reach=melee?.73+.11*m:fairy?.18+.72*m:shadow?.11+.38*m:dust?.25+.42*m:.18+.78*m;
      const x=e.x+Math.sin(dir)*radius*reach,z=e.z+Math.cos(dir)*radius*reach;
      const floor=this.groundHeight(x,z);
      const rise=water?wave*(style==='rutoSurge'?1.2:.48):shadow?m*2.7:fairy?.72+wave*.68:melee?spread*.65:wave*.42;
      mesh.position.set(x,Math.max(floor+.09,e.y+rise),z);
      mesh.rotation.set((water?.8:.35)+m,dir,melee?.65+spread*.55:0);
      const s=(dust?.23:water?.26:shadow?.27:fairy?.15:.17)*(1-t*.93);
      mesh.scale.set(s,shadow?s:melee?s*1.7:water?s*(1.6+n%2):s,dust?s:melee?s*2.7:s*.73);
    }
    ultimateEffect(event,at,player){
      const style=event.phaseStyle,staged=Number.isFinite(at),scene=event.sceneOnly;
      const grounded={...event,y:player&&style!=='moonCrash'?(player.ground??this.groundHeight(player.x,player.z))+(player.y||0):event.y};
      if(style==='goronSlam'&&staged)return; // The core notifies the view on actual landing, not at a guessed time.
      if(staged&&event.release>0&&!scene){
        if(style==='moonCrash'){
          this.ultimateStage(grounded,'windup',event.release,undefined,at);
          return; // The simulation's groundImpact event owns contact, damage, and the blast.
        }
        (this.ultimateCues??=[]).push({at:at+event.release,event});
        if(style==='seal'||style==='fused')this.ultimateStage(grounded,'windup',event.release);
        return;
      }
      const duration={spin:.48,seal:.82,harp:.83,fused:.65,waterBlade:.57,goronSlam:.76,rutoSurge:.83,waterGun:.28,moonCrash:1.34,ocarinaSong:1.33,spiritSage:1.33}[style];
      if(duration)this.ultimateStage(grounded,scene?'scene':'release',duration,player);
      if(style==='ocarinaSong'&&staged&&scene)this.ultimateStage({...grounded,visualDelay:duration},'healing',duration+2.25,player);
    }
    // Low-poly surfaces are shared by cast instead of allocating new geometry every frame.
    ultimateStrip(key,arc,width,depth,profile){
      key='ultimate-strip:'+key;
      if(!this.geometries[key]){
        const vertices=[],segments=14;
        const sample=(i,inner)=>{
          const u=i/segments,a=(u-.5)*arc,[w,h]=profile(u),r=1-(inner?width*w:0);
          return [Math.sin(a)*r,(inner?h-depth*w:h),Math.cos(a)*r];
        };
        for(let i=0;i<segments;i++)vertices.push(...sample(i,0),...sample(i,1),...sample(i+1,0),...sample(i+1,0),...sample(i,1),...sample(i+1,1));
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));this.geometries[key]=geometry;
      }
      return key;
    }
    moonFallProgress(t){
      const u=clamp((t-.12)/.88,0,1);
      return u*(.58+.42*u);
    }
    moonFallPosition(x,y,z,t,camera=this.camera){
      const anchor=new THREE.Vector3(x,y,z);
      const fall=reducedMotion?clamp((t-.12)/.88,0,1):this.moonFallProgress(t);
      if(!camera?.isPerspectiveCamera||fall>=1)return anchor;
      const ground=anchor.clone().project(camera);
      if(ground.z>=1||ground.z<=-1)return anchor.add(new THREE.Vector3((1-fall)*2,(1-fall)*26,0));
      // Camera only maps the launch once. Looking around later does not drag the Moon.
      const side=ground.x<0?1:-1;
      const launch=ground.clone();launch.x+=side*.22;launch.y=1.28;
      launch.unproject(camera);
      const lift=Math.max(0,y+19-launch.y);
      ground.x+=side*.22*(1-fall)**2;
      ground.y=1.28+(ground.y-1.28)*fall;
      ground.unproject(camera);
      ground.y+=lift*(1-fall)**2;
      return ground;
    }
    moonSurface(){
      if(this.moonSurfaceCache)return this.moonSurfaceCache;
      const width=192,height=96,pixels=new Uint8Array(width*height*4);
      const art=RelicArt.canvas?.('moon','crash');
      const face=art?.getContext('2d').getImageData(0,0,art.width,art.height).data;
      const craters=Array.from({length:24},(_,i)=>{
        const y=Math.sin(i*14.97)*.94,a=i*2.39996,r=Math.sqrt(1-y*y);
        const radius=.11+(i%5)*.031;
        return {x:Math.cos(a)*r,y,z:Math.sin(a)*r,inside:radius**2,outside:(radius+.033)**2};
      });
      for(let v=0;v<height;v++)for(let u=0;u<width;u++){
        const theta=Math.PI*(1-(v+.5)/height),phi=2*Math.PI*(u+.5)/width;
        const x=-Math.cos(phi)*Math.sin(theta),y=Math.cos(theta),z=Math.sin(phi)*Math.sin(theta);
        let value=124+13*Math.sin(x*10+y*6-z*14)+9*Math.sin(x*25+y*13+z*17)+((u*13+v*31+u*v)%19)-9;
        for(const c of craters){
          const dx=x-c.x,dy=y-c.y,dz=z-c.z,d=dx*dx+dy*dy+dz*dz;
          if(d<c.inside)value-=23;
          else if(d<c.outside)value+=dx+dy<0?17:5;
        }
        const at=(u+v*width)*4;
        const artX=Math.floor(art?.width*(.50+x*.47)),artY=Math.floor(art?.height*(.50-y*.47));
        const source=face&&z>0&&artX>=0&&artY>=0&&artX<art.width&&artY<art.height?(artX+artY*art.width)*4:-1;
        const mix=source<0?0:face[source+3]/255*clamp((z-.24)/.25,0,1);
        const slate=[value,value-5,value-11];
        for(let i=0;i<3;i++)pixels[at+i]=Math.round(clamp(slate[i]*(1-mix)+(mix?face[source+i]*mix:0),0,255));
        pixels[at+3]=255;
      }
      const map=new THREE.DataTexture(pixels,width,height);map.name='moon:cratered-world-surface';
      map.colorSpace=THREE.SRGBColorSpace;map.magFilter=map.minFilter=THREE.NearestFilter;map.needsUpdate=true;
      return this.moonSurfaceCache={map,geometry:new THREE.SphereGeometry(.5,40,24)};
    }
    makeTurningMoon(name,materials){
      const {map,geometry}=this.moonSurface();
      const material=new THREE.MeshLambertMaterial({map,transparent:true,depthWrite:false,color:'#f4efe0'});
      const globe=new THREE.Mesh(geometry,material),pivot=new THREE.Group();
      globe.name='cratered-moon-globe';globe.position.y=.5;globe.rotation.order='YXZ';globe.renderOrder=4;
      pivot.name=name;pivot.material=material;pivot.add(globe);
      pivot.userData.globe=globe;materials.push(material);
      return pivot;
    }
    turnMoon(globe,yaw,t){
      const dive=this.moonFallProgress(t),roll=reducedMotion?.04:.18*Math.sin(t*Math.PI*1.55);
      // A positive X rotation points the face (+Z on the texture) down toward the impact.
      globe.rotation.set(.17+1.19*dive,yaw-.43+.97*dive,roll,'YXZ');
    }
    moonFlashOpacity(age){
      if(age<0||age>=.20)return 0;
      const peak=reducedMotion?.08:.34;
      return peak*clamp(age/.026,0,1)*((.20-age)/.174)**1.65;
    }
    makeMoonShadow(){
      const sectors=24,rings=[0,.60,.79,.92,1],alphas=[.88,.86,.69,.32,0],xy=[],rgba=[],indices=[];
      for(let ring=0;ring<rings.length;ring++)for(let n=0;n<sectors;n++){
        const a=n*Math.PI*2/sectors;
        xy.push(Math.cos(a)*rings[ring],Math.sin(a)*rings[ring]);
        rgba.push(.028,.014,.041,alphas[ring]);
        if(ring===0)continue;
        const i=ring*sectors+n,j=ring*sectors+((n+1)%sectors),k=i-sectors,l=j-sectors;
        indices.push(k,l,i,l,j,i);
      }
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(xy.length/2*3),3));
      geometry.setAttribute('color',new THREE.Float32BufferAttribute(rgba,4));geometry.setIndex(indices);
      const material=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
      const shadow=new THREE.Mesh(geometry,material);
      shadow.name='moon-approach-shadow';shadow.frustumCulled=false;shadow.renderOrder=2;shadow.userData.outline=xy;
      return shadow;
    }
    positionMoonShadow(shadow,x,z,radius,t){
      const proximity=this.moonFallProgress(t),size=radius*(.22+.82*proximity);
      const xy=shadow.userData.outline,pts=shadow.geometry.getAttribute('position');
      for(let i=0;i<pts.count;i++){
        const wx=x+xy[i*2]*size,wz=z+xy[i*2+1]*size;
        pts.setXYZ(i,wx,this.groundHeight(wx,wz)+.062,wz);
      }
      pts.needsUpdate=true;
      shadow.material.opacity=(.40+.53*proximity)*clamp(t/.065,0,1);
      shadow.userData.radius=size;
    }
    moonCameraFocus(player){
      if(reducedMotion)return {x:player.x,z:player.z};
      const cue=this.effects.find(e=>e.style==='moonCrash'&&e.phase==='windup'&&e.mesh.visible);
      const blast=this.effects.find(e=>e.style==='moonCrash'&&e.phase==='release'&&e.mesh.visible);
      const focus=cue??blast;
      if(!focus)return {x:player.x,z:player.z};
      const w=.72*(cue?1:clamp(blast.time/blast.duration,0,1));
      return {x:player.x+(focus.x-player.x)*w,z:player.z+(focus.z-player.z)*w};
    }
    moonEffectTexture(kind){
      const textures=this.moonEffectTextures??={};
      if(textures[kind])return textures[kind];
      const size=32,data=new Uint8Array(size*size*4);
      const lobes=[[0,.09,.75],[-.33,.24,.41],[.36,.10,.43],[.21,-.34,.39],[-.22,-.25,.46]];
      for(let y=0;y<size;y++)for(let x=0;x<size;x++){
        const u=(x+.5)*2/size-1,v=(y+.5)*2/size-1;
        const flash=kind==='flash';
        const density=flash?clamp(1-Math.hypot(u,v),0,1)**1.7
          :clamp(Math.max(...lobes.map(([dx,dy,r])=>1-Math.hypot(u-dx,v-dy)/r))*2.5,0,1);
        const grain=((x*19+y*31+(x*y)%11)%13)/13;
        const pixel=(x+y*size)*4,value=flash?255:Math.round(181+density*56+grain*14);
        data[pixel]=data[pixel+1]=data[pixel+2]=value;
        data[pixel+3]=Math.round(255*density*(flash?1:.83+.17*grain));
      }
      const texture=new THREE.DataTexture(data,size,size);
      texture.magFilter=kind==='flash'?THREE.LinearFilter:THREE.NearestFilter;
      texture.minFilter=texture.magFilter;texture.needsUpdate=true;
      return textures[kind]=texture;
    }
    moonImpact(event){
      const fall=this.effects.find(e=>e.style==='moonCrash'&&e.phase==='windup'&&e.mesh.visible);
      for(const e of this.effects.filter(e=>e.style==='moonCrash'&&e.phase==='windup')){
        e.time=0;e.mesh.visible=false;
      }
      const impact={...event,phaseStyle:'moonCrash',moonYaw:fall?.moonYaw};
      this.ultimateStage(impact,'aftermath',4.7); // Lingers independently of the brief impact burst.
      this.ultimateEffect(impact);
    }
    ultimateStage(event,phase,duration,player,startTime){
      if(event.phaseStyle!=='moonCrash'&&this.effects.filter(effect=>effect.kind==='ultimateSignature'&&effect.time>0).length>=6)return;
      const {x,z,facing=0,phaseStyle:style}=event,ground=this.groundHeight(x,z);
      const mesh=new THREE.Group(),materials=[],parts=[],ownedGeometry=[];
      const mode=(reducedMotion||storage.graphics==='low'),count=n=>mode?Math.ceil(n/2):n;
      const add=(name,type,color,alpha=.94)=>{
        const material=new THREE.MeshBasicMaterial({color,opacity:0,transparent:true,side:THREE.DoubleSide,depthWrite:false});
        const m=new THREE.Mesh(this.geometries[type],material);
        m.name=name;mesh.add(m);materials.push(material);parts.push({m,alpha});return m;
      };
      const puff=(name,mapKind,color,alpha,order=3)=>{
        const material=new THREE.SpriteMaterial({map:this.moonEffectTexture(mapKind),color,opacity:0,transparent:true,depthWrite:false});
        const m=new THREE.Sprite(material);m.name=name;m.renderOrder=order;mesh.add(m);
        materials.push(material);parts.push({m,alpha});return m;
      };
      const curve=(name,key,color,arc,width,depth,profile,alpha)=>add(name,this.ultimateStrip(key,arc,width,depth,profile),color,alpha);
      const taper=u=>Math.sin(Math.PI*u);
      if(phase==='healing'&&style==='ocarinaSong'){
        add('saria-healing-area','torus','#b9ef8b',.64);
        add('saria-healing-inner-ring','torus','#e6f6b1',.42);
        for(let i=0;i<count(6);i++){
          add('saria-healing-cross-wide','box','#b8ee9c',.92);
          add('saria-healing-cross-tall','box','#e8ffbf',.92);
        }
        for(let i=0;i<count(12);i++)add('saria-healing-mote','diamond',i%2?'#dbffad':'#8bdb88',.78);
      }else if(phase==='aftermath'&&style==='moonCrash'){
        for(let i=0;i<count(12);i++){
          puff('moon-residual-smoke','smoke',['#756773','#88777d','#a28b87'][i%3],.45,3);
        }
      }else if(phase==='windup'){
        if(style==='moonCrash'){
          const moon=this.makeTurningMoon('descending-grinning-moon',materials);
          mesh.add(moon);parts.push({m:moon,alpha:1});
          const shadow=this.makeMoonShadow();mesh.add(shadow);parts.push({m:shadow,alpha:1});
          materials.push(shadow.material);ownedGeometry.push(shadow.geometry);
          add('moon-landing-marker','torus','#ce9ad8',.44);
          const tailCount=count(12);
          for(let i=0;i<tailCount;i++){
            const smoke=puff('moon-descent-smoke','smoke',['#605461','#8a777d','#b09796'][i%3],.71,3);
            smoke.userData.tail=i/Math.max(1,tailCount-1);
          }
        }else for(let i=0;i<count(style==='seal'?6:10);i++)add(style==='seal'?'gathering-light':'gathering-twilight',style==='seal'?'diamond':'box',style==='seal'?'#ffeda0':(i%3?'#46324f':'#78dbca'));
      }else switch(style){
        case 'spin':
          curve('blade-sweep','spin-edge','#ffefb0',4.78,.27,.07,u=>[taper(u),0]);
          curve('white-cutting-edge','spin-shine','#ffffff',3.69,.07,.045,u=>[taper(u),0]);
          curve('lower-sword-trail','spin-tail','#6dd8d6',3.06,.21,.07,u=>[taper(u),0],.61);break;
        case 'seal':
          for(let i=0;i<3;i++)add('triforce-edge','box','#ffe7a0');
          for(let i=0;i<3;i++)add('triforce-inner-edge','box','#fff4ba');
          for(let i=0;i<3;i++)add('pillar-of-sealing-light','diamond',i%2?'#ffecb3':'#fff8d4',.8);
          for(let i=0;i<count(9);i++)add('ascending-light','diamond',i%2?'#fff8d7':'#ffca60');break;
        case 'harp':
          for(let i=0;i<3;i++)curve('harp-string-wave','harp-string','#cce4ff',5.4,.032,.14,u=>[.65+taper(u)*.35,Math.sin(u*Math.PI*4)*.27],.68);
          for(let i=0;i<count(8);i++)add('harp-pluck','diamond',i%2?'#fff5dc':'#baceff');break;
        case 'fused':
          for(let i=0;i<5;i++)curve('fused-shadow-limb','fused-limb',i%2?'#725081':'#332240',.28,.64,1.47,u=>[taper(u),1.15+.38*taper(u)]);
          for(let i=0;i<count(12);i++)add('twilight-square','box',i%3?'#745792':'#76e6cb');break;
        case 'waterBlade':
          curve('blade-water-wall','water-blade','#339fc9',1.57,.56,1.56,u=>[taper(u),1.39*taper(u)],.86);
          curve('blade-foam-edge','water-blade-foam','#d8f6ff',1.57,.14,.27,u=>[taper(u),1.46*taper(u)]);
          for(let i=0;i<count(8);i++)add('blade-splash','diamond',i%2?'#d8f6ff':'#7bd8f4');break;
        case 'rutoSurge':
          curve('breaking-wave-face','ruto-face','#2baac4',1.56,.63,1.51,u=>[taper(u),1.2*taper(u)],.85);
          curve('breaking-wave-crest','ruto-crest','#b4f7f3',1.51,.20,.42,u=>[taper(u),1.28*taper(u)]);
          curve('following-water-swell','ruto-back','#57cde0',1.64,.70,.67,u=>[taper(u),.50*taper(u)],.68);
          for(let i=0;i<count(11);i++)add('sea-foam','lowSphere',i%2?'#e6fdff':'#76def0');break;
        case 'goronSlam':
          add('boulder-impact-floor-ring','torus','#e8bf8c',.80);
          for(let i=0;i<count(10);i++)add('boulder-impact-dust','lowSphere',['#b57548','#c68a53','#e1ad74'][i%3],.76);
          for(let i=0;i<count(7);i++)add('boulder-impact-rocks','diamond',i%2?'#80523d':'#9b6a51');break;
        case 'waterGun':
          for(let i=0;i<count(8);i++)add('pistol-muzzle-spray','diamond',i%2?'#a4edff':'#eaffff');break;
        case 'moonCrash':
          add('moon-impact-outer-shockwave','torus','#d7a3df',.8);
          add('moon-impact-inner-shockwave','torus','#eec4ab',.9);
          const contact=this.makeTurningMoon('moon-impact-contact',materials);
          mesh.add(contact);parts.push({m:contact,alpha:1});
          add('moon-impact-fireball','lowSphere','#ed8854',.92);
          add('moon-impact-hot-core','lowSphere','#f1bd87',.72);
          puff('moon-impact-faint-flash','flash','#ffdcb2',.27,5);
          for(let i=0;i<count(18);i++)puff('moon-impact-smoke','smoke',['#544852','#79606a','#a0827b'][i%3],.73,3);
          for(let i=0;i<count(16);i++)add('lunar-impact-debris','diamond',i%3?'#78627b':'#ffb05c',.97);
          break;
        case 'ocarinaSong':
          for(let i=0;i<3;i++)curve('ocarina-sound-ripple','ocarina-ripple','#a7d99c',3,.064,.11,u=>[taper(u),.10*Math.sin(u*Math.PI)],.70);
          for(let i=0;i<count(5);i++){
            add('ocarina-note-head','lowSphere',i%2?'#f3ebbd':'#bfedaa');
            add('ocarina-note-stem','box',i%2?'#f3ebbd':'#bfedaa');
          }break;
        case 'spiritSage':
          add('spirit-medallion-face','lowSphere','#c68c3b');
          add('spirit-medallion-rim','torus','#ffe097');
          for(let i=0;i<3;i++)add('spirit-emblem-petal','diamond','#fff2c3');
          for(let i=0;i<count(6);i++)add('medallion-glints','diamond','#f9cf76');break;
        default:return;
      }
      mesh.name='ultimate:'+style+':'+phase;
      const moonYaw=event.moonYaw??(this.camera?Math.atan2(this.camera.position.x-x,this.camera.position.z-z):facing);
      const effect={mesh,materials,parts,ownedGeometry,player,kind:'ultimateSignature',style,phase,x,z,y:event.y??ground,facing,moonYaw,radius:event.radius||0,time:duration,duration,startTime,visualDelay:event.visualDelay||0};
      this.entities.add(mesh);this.positionUltimateStage(effect,0);this.effects.push(effect);
    }
    positionUltimateStage(e,t){
      const {parts,style,phase,radius}=e;
      const follow=(phase==='scene'||phase==='healing')&&e.player,x=follow?follow.x:e.x,z=follow?follow.z:e.z;
      const y=follow?(follow.ground??this.groundHeight(x,z))+(follow.y||0):e.y;
      const facing=(phase==='scene'||phase==='healing')&&this.camera?Math.atan2(this.camera.position.x-x,this.camera.position.z-z):e.facing;
      // Reduced motion holds readable shapes, with a single fade instead of repeated pulses.
      const m=reducedMotion?.60:t,fade=t<.12?.34+.66*t/.12:1-Math.pow(clamp((t-.12)/.88,0,1),1.6);
      const sin=Math.sin(facing),cos=Math.cos(facing),tau=2*Math.PI;
      const put=(p,sx,sy,sz,right=0,up=0,front=0,ry=0,rz=0,rx=0,relativeGround=false)=>{
        const wx=x+right*cos+front*sin,wz=z-right*sin+front*cos;
        p.position.set(wx,(relativeGround?this.groundHeight(wx,wz):y)+up,wz);
        p.rotation.set(rx,facing+ry,rz);p.scale.set(sx,sy,sz);
      };
      for(let i=0;i<parts.length;i++){
        const {m:p,alpha}=parts[i],k=i/Math.max(1,parts.length-1);
        p.material.opacity=alpha*fade;
        if(phase==='healing'){
          // A visual area blooms after the final note; no stats or hit boxes change.
          const seconds=t*e.duration-e.visualDelay,life=clamp(seconds/(e.duration-e.visualDelay),0,1);
          p.visible=seconds>0&&life<1;
          const spread=reducedMotion?1:1-(1-life)**3;
          const alphaFade=clamp(seconds/.20,0,1)*(1-life)**.65;
          if(i<2){
            const r=(i===0?5.2:3.9)*(.25+.75*spread);
            put(p,r,r,.045,0,.12+i*.08,0,0,0,-Math.PI/2,true);
            p.material.opacity=alpha*alphaFade;
          }else{
            const cross=p.name.includes('cross'),n=cross?Math.floor((i-2)/2):i;
            const tall=p.name==='saria-healing-cross-tall',ang=n*2.39996;
            const reach=(cross?1.25+(n%5)*.69:2.1+(n%6)*.49)*(.40+spread*.60);
            const up=.34+(n%4)*.38+(reducedMotion?.67:life*(.8+(n%3)*.25));
            const h=cross?(tall?.31:.082):.16,w=cross?(tall?.089:.32):.10;
            put(p,w,h,.062,Math.sin(ang)*reach,up,Math.cos(ang)*reach,0,!cross&&n%2?.35:0,0,true);
            p.material.opacity=alpha*alphaFade*(reducedMotion?1:.73+.27*Math.cos(life*5+n)**2);
          }
          continue;
        }
        if(phase==='aftermath'){
          const seconds=t*e.duration,delay=.28+(i%5)*.12;
          const drift=reducedMotion?.26:1-Math.exp(-Math.max(0,seconds-delay)*.51);
          const angle=i*2.399963+(i%2?-.25:.40),outer=i%3!==0;
          const offset=radius*((outer?.20:.05)+(i%4)*.034+drift*(outer?.26:.14));
          const breeze=radius*.17*drift;
          const size=radius*(.26+(i%4)*.025+drift*.24);
          const lift=radius*(.11+(i%5)*.025+drift*(outer?.13:.32));
          put(p,size,size*(outer?.67:.88),1,Math.sin(angle)*offset+breeze,lift,Math.cos(angle)*offset,0,0,0,true);
          p.material.rotation=reducedMotion?0:(i%2?1:-1)*(.12+drift*.36);
          const fadeIn=clamp((seconds-delay)/.62,0,1),fadeOut=clamp((1-t)/(.45+(i%4)*.05),0,1);
          p.material.opacity=alpha*fadeIn*fadeOut*(reducedMotion?.68:1);
          p.visible=p.material.opacity>.001;
          continue;
        }
        if(phase==='windup'){
          if(style==='moonCrash'){
            const d=clamp(radius*1.5,7,12),ground=this.groundHeight(x,z),base=ground+.05;
            if(i===0){
              const size=d*(reducedMotion?1:.85+.15*this.moonFallProgress(t));
              if(t>=.12&&!e.pathCamera&&this.camera?.isPerspectiveCamera){
                e.pathCamera=this.camera.clone();e.pathCamera.updateMatrixWorld();
              }
              p.scale.setScalar(size);
              p.position.copy(this.moonFallPosition(x,base,z,t,e.pathCamera??this.camera));
              this.turnMoon(p.userData.globe,e.moonYaw,t);
              p.visible=t>.12; // Natural camera clipping reveals the sphere as it enters.
              p.material.opacity=1;
            }else if(i===1){
              this.positionMoonShadow(p,x,z,radius||5,t);
            }else if(i===2){
              const r=radius||5;
              put(p,r,r,.13,0,.14,0,0,0,-Math.PI/2,true);
            }else{
              const age=p.userData.tail,lag=.01+age*.15,local=t-lag;
              p.visible=local>.15;
              const camera=e.pathCamera??this.camera;
              const tail=this.moonFallPosition(x,base,z,Math.max(0,local),camera),matrix=camera?.matrixWorld.elements;
              const puffSize=d*(.37+age*.36);
              p.scale.set(puffSize,puffSize*(.82+age*.22),1);
              p.position.copy(tail);
              if(matrix){
                const right=(i%2?1:-1)*d*(.28+age*.13)*(reducedMotion?1:.8+.2*Math.sin(t*3+i));
                const lift=d*(.33+age*.32);
                p.position.addScaledVector(new THREE.Vector3(matrix[0],matrix[1],matrix[2]),right);
                p.position.addScaledVector(new THREE.Vector3(matrix[4],matrix[5],matrix[6]),lift);
              }
              p.material.rotation=reducedMotion?0:(i%2?1:-1)*(.3+age*.45);
              p.material.opacity=alpha*clamp((local-.15)/.10,0,1)*(1-age*.62)*(reducedMotion?.65:1);
            }
          }else{
            const a=k*tau+(style==='seal'?m*1.4:3*m),r=(style==='seal'?1.60:2.15)*(1-m*.70);
            put(p,.18+.17*m,.42+.35*m,.17,Math.sin(a)*r,.5+1.5*m+(i%3)*.26,Math.cos(a)*r,a,m);
          }
          continue;
        }
        switch(style){
          case 'spin': {
            const r=radius*(.42+.58*Math.sin(m*Math.PI*.5))*(1-i*.045);
            put(p,r,.98,r,0,.94-i*.14,0,m*tau-i*.7,i===2?-.12:0);break;
          }
          case 'seal': {
            const r=Math.min(radius,10)*(.13+.77*Math.sin(m*Math.PI*.5));
            if(i<6){
              const inner=i>=3,a=(inner?i-2:i+.5)*tau/3,d=r*(inner?.25:.5);
              put(p,r*Math.sqrt(3)*(inner?.5:1),.09,.18,Math.sin(a)*d,.20,Math.cos(a)*d,a,0,0,true);
            }else if(i<9){
              const a=(i-6)*tau/3;
              const h=2.4+3.1*Math.sin(m*Math.PI*.7);
              put(p,.32,h*.55,.32,Math.sin(a)*r,h*.55,Math.cos(a)*r,a,0,0,true);
            }else{
              const a=i*2.4,r1=r*(i%3+1)*.25;
              put(p,.17,.37,.17,Math.sin(a)*r1,.45+m*(2.4+i%4*.49),Math.cos(a)*r1,a,m*.3,0,true);
            }
            break;
          }
          case 'harp': {
            if(i<3){
              const r=radius*(.14+.72*m)*(1-i*.105);
              put(p,r,1,r,0,.48+i*.43,0,i*.7+m*.76);
            }else{
              const a=i*2.4+m*1.25,r=radius*(.20+.50*m);
              put(p,.13,.27,.13,Math.sin(a)*r,1.1+.89*m+(i%3)*.25,Math.cos(a)*r,a,.23);
            }
            break;
          }
          case 'fused': {
            const a=(i<5?(i/4-.5):k-.5)*(i<5?2.42:2.12);
            if(i<5){
              const r=radius*(.18+.65*m)*(i%2?.73:1);
              put(p,r,1.0+.65*Math.sin(m*Math.PI),r,0,.58,0,a,i%2?.23:-.23);
            }else{
              const r=radius*(.11+.61*m)*(i%2?.71:1);
              put(p,.22,.25,.22,Math.sin(a)*r,.55+(i%3)*.51+1.1*m,Math.cos(a)*r,a+m,.35);
            }
            break;
          }
          case 'waterBlade': {
            if(i<2){
              const r=radius*(.24+.64*Math.sin(m*Math.PI*.5)),h=1.16+.79*Math.sin(Math.PI*m);
              put(p,r,h,r,0,.16+(i?.05:0),0,(.22-m*.43),.27-m*.45);
            }else{
              const a=(k-.58)*1.93,r=radius*(.30+.55*m);
              put(p,.15,.28,.15,Math.sin(a)*r,.18+Math.sin(Math.PI*m)*(1+(i%3)*.48),Math.cos(a)*r,a,m*.52,0,true);
            }
            break;
          }
          case 'rutoSurge': {
            const r=radius*(.17+.80*m),h=.9+.60*Math.sin(Math.PI*m);
            if(i<3){
              const r1=r*(i===2?.77:1);put(p,r1,h,r1,0,.08+i*.04,0,0,0,0,true);
            }else{
              const a=(k-.59)*1.95,r1=r*(.77+(i%3)*.083);
              put(p,.21,.14,.23,Math.sin(a)*r1,.10+Math.sin(Math.PI*m)*(1.1+(i%3)*.42),Math.cos(a)*r1,a,0,0,true);
            }
            break;
          }
          case 'goronSlam': {
            if(i===0){
              const r=radius*(.32+.64*Math.sin(m*Math.PI*.5));
              put(p,r,r,.17,0,.18,0,0,0,-Math.PI/2,true);
            }else{
              const rock=p.name==='boulder-impact-rocks',a=i*2.39996,r=radius*(.12+(i%3)*.078+(.62-(i%2)*.12)*m);
              const lift=rock?Math.sin(Math.PI*m)*(1.55+(i%3)*.42):.13+m*(.44+(i%3)*.19);
              const s=rock?.19+(i%3)*.08:.38+m*.58;
              put(p,s,s*(rock?1.15:.63),s,Math.sin(a)*r,lift,Math.cos(a)*r,a,m*2,0,true);
            }
            break;
          }
          case 'waterGun': {
            const front=.58+m*(1.4+(i%3)*1.05),side=(k-.5)*(.21+m*.86);
            put(p,.10,.10,.28,side,1.02+(i%3-1)*.17,front,side,.19);break;
          }
          case 'moonCrash': {
            const a=i*2.39996,blast=reducedMotion?.48:1-(1-m)**3;
            if(i<2){
              const r=radius*(.16+blast*.9)*(i?.72:1);
              put(p,r,r,.23,0,.16+i*.22,0,0,0,-Math.PI/2,true);
              p.material.opacity=alpha*(1-t)**1.8;
            }else if(p.name==='moon-impact-contact'){
              const d=clamp(radius*1.5,7,12);
              const squash=reducedMotion?0:Math.min(m,.14);
              p.position.set(x,this.groundHeight(x,z)+.05,z);
              p.scale.set(d*(1+squash*.45),d*(1-squash*2),d*(1+squash*.45));
              this.turnMoon(p.userData.globe,e.moonYaw,1);
              p.visible=t<.14;
              p.material.opacity=alpha*clamp(1-t/.14,0,1);
            }else if(i<5){
              const s=radius*((i===3?.19:.13)+blast*(i===3?.48:.3));
              put(p,s,s*(i===3?.83:.68),s,0,s*.38,0,0,0,0,true);
              p.material.opacity=alpha*(1-clamp(t/(i===3?.47:.30),0,1))**1.2*(reducedMotion?.62:1);
            }else if(p.name==='moon-impact-faint-flash'){
              const time=t*e.duration,start=.028,length=.24;
              const pulse=clamp((time-start)/.045,0,1)*clamp((start+length-time)/.18,0,1);
              const s=radius*(reducedMotion?.84:.68+.28*clamp(time/.22,0,1));
              put(p,s,s,1,0,.64,0,0,0,0,true);
              p.material.opacity=alpha*pulse*(reducedMotion?.42:1);
              p.visible=pulse>0;
            }else if(p.name==='moon-impact-smoke'){
              const n=i-6,outer=n%3!==0;
              const r=radius*(.09+blast*(outer?.46+(n%4)*.07:.17));
              const s=(outer?2.0:2.5)+(n%4)*.24+m*(outer?2.6:3.2);
              const lift=outer?.48+m*(1.4+(n%3)*.2):.62+m*(3.2+(n%4)*.49);
              put(p,s,s*.87,1,Math.sin(a)*r,lift,Math.cos(a)*r,a,0,0,true);
              p.material.rotation=reducedMotion?0:(n%2?1:-1)*(.18+(.36+n%5*.12)*m);
              p.material.opacity=alpha*clamp(.17+t*8,0,1)*(1-t)**.9*(reducedMotion?.71:1);
            }else{
              const r=radius*(.1+m*(.62+(i%4)*.1)),s=.18+(i%4)*.13;
              put(p,s,s*(1.8-.8*m),s,Math.sin(a)*r,.30+(1.45+(i%5)*.43)*4*m*(1-m),Math.cos(a)*r,a,m*6,0,true);
              p.material.opacity=alpha*(1-t);
            }
            break;
          }
          case 'ocarinaSong': {
            if(i<3){
              const r=.72+m*.95+(i*.21);
              put(p,r,r,r,0,1.45+i*.19,0,0,0,.18);
            }else{
              const n=Math.floor((i-3)/2),stem=(i-3)%2;
              const local=reducedMotion?.45:clamp((m-n*.11)/.55,0,1);
              p.material.opacity*=Math.sin(local*Math.PI);
              const r=.50+.86*local,side=(n%2?1:-1)*r*(.55+n*.11)+(stem?.064:0),up=1.51+local*1.14+(stem?.15:0);
              put(p,stem?.044:.14,stem?.14:.095,.07,side,up,.46+(n%3)*.21,0,stem?-.11:0);
            }
            break;
          }
          case 'spiritSage': {
            const rise=2.18+.46*Math.sin(m*Math.PI),turn=(m-.5)*1.9;
            if(i<5){
              const a=(i-2)*tau/3,sx=i===0?.48:i===1?.44:.10,sy=i===0?.48:i===1?.44:.16;
              put(p,sx,sy,i===0?.078:i===1?.30:.06,i<2?0:Math.sin(a)*.20,rise+(i<2?0:Math.cos(a)*.20),i<2?.21:.29,turn,a*(i>1));
            }else{
              const a=i*2.4+m*1.1,r=.54+.41*m;
              put(p,.085,.18,.085,Math.sin(a)*r,rise+Math.cos(a)*r,.31,a);
            }
            break;
          }
        }
      }
    }
    makeDefeatProp(hero) {
      // Locally centered; polearms lie lengthwise along Z. Every piece shares the
      // view's primitives, but owns its finish so the whole prop can be faded out.
      const group=new THREE.Group();
      group.name='defeat-prop:'+hero;
      const palette=new Map();
      function part(geometry,color,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
        if(!palette.has(color))palette.set(color,new THREE.MeshLambertMaterial({color,flatShading:true,transparent:true}));
        const object=new THREE.Mesh(this.geometries[geometry],palette.get(color));
        object.position.set(x,y,z);object.rotation.set(rx,ry,rz);object.scale.set(geometry==='cylinder'?sx*.5:sx,sy,geometry==='cylinder'?sz*.5:sz);
        group.add(object);return object;
      }
      const model=part.bind(this);
      const box=(...a)=>model('box',...a);
      const bar=(color,x1,z1,x2,z2,w,h,y=0)=>{
        box(color,(x1+x2)/2,y,(z1+z2)/2,w,h,Math.hypot(x2-x1,z2-z1),0,Math.atan2(x2-x1,z2-z1));
      };
      const poly=(color,x,y,z,w,h,d)=>model('diamond',color,x,y,z,w,h,d);
      const disk=(color,x,y,z,w,h,d)=>model('cylinder',color,x,y,z,w,h,d);
      const band=(color,x,y,z,r)=>model('torus',color,x,y,z,r,r,r,Math.PI/2);
      if(hero==='link'){
        box('#59487b',0,0,-.64,.16,.13,.42);
        box('#ba944f',0,0,-.91,.17,.14,.12);
        box('#5e587d',0,0,-.42,.57,.16,.16);
        bar('#9d8cb2',-.29,-.40,-.42,-.65,.10,.10,.01);
        bar('#9d8cb2',.29,-.40,.42,-.65,.10,.10,.01);
        box('#9aabba',0,0,.18,.22,.095,1.06);
        box('#dbe7d9',0,.053,.20,.10,.026,.98);
        poly('#bfced0',0,0,.76,.11,.049,.23);
      }else if(hero==='zelda'){
        const outline=[[-.15,-.85],[.22,-.67],[.43,-.36],[.52,0],[.43,.36],[.22,.67],[-.15,.85]];
        for(let i=1;i<outline.length;i++){
          const [a,b]=outline[i-1],[c,d]=outline[i];
          bar(i%2?'#c98d46':'#e8b763',a,b,c,d,.13,.11);
          bar('#f0d18a',a,b,c,d,.046,.022,.069);
        }
        bar('#d4c8aa',-.15,-.85,-.15,.85,.022,.035);
        box('#9b6742',.49,0,0,.15,.135,.25);
        for(const z of [-.86,.86])poly('#f1e4ae',-.15,0,z,.105,.08,.12);
      }else if(hero==='midna'){
        const stone=poly('#383047',0,0,0,.52,.18,.68);stone.rotation.y=.30;
        poly('#514362',-.21,.07,-.08,.23,.13,.41);
        poly('#71c1ad',.16,.19,.13,.23,.027,.26);
        poly('#acd8c5',.16,.218,.13,.10,.021,.12);
        bar('#654e76',-.35,.24,.08,-.31,.068,.043,.12);
        bar('#7fb0a6',-.40,-.10,-.24,-.33,.056,.044,.11);
      }else if(hero==='tetra'){
        bar('#425a7c',0,-.39,.02,.21,.18,.12);
        bar('#a9b9bf',.02,.16,.10,.50,.21,.09);
        bar('#e8dec4',.05,.24,.12,.48,.07,.035,.065);
        poly('#b7c8c6',.16,0,.60,.12,.052,.23);
        box('#513f3a',-.02,0,-.59,.135,.12,.40);
        box('#d3a867',0,0,-.40,.33,.14,.11);
        bar('#bf8d4e',-.17,-.40,-.17,-.65,.065,.08);
        bar('#b7844c',-.17,-.65,-.065,-.77,.075,.08);
      }else if(hero==='sheik'){
        poly('#a5bac3',0,0,.30,.205,.068,.56);
        poly('#e0e7d4',0,.04,.33,.079,.035,.38);
        bar('#544659',0,-.23,0,-.72,.14,.12);
        for(const z of [-.30,-.44,-.58])box('#9c5453',0,.065,z,.153,.034,.051);
        band('#a0a49d',0,0,-.79,.11);
      }else if(hero==='skullkid'){
        const horn=[[-.30,-.56],[-.43,-.19],[-.32,.16],[-.10,.39],[.22,.61],[.40,.65]];
        for(let i=1;i<horn.length;i++){
          const [a,b]=horn[i-1],[c,d]=horn[i];
          bar(i%2?'#a88342':'#cba451',a,b,c,d,.105+i*.046,.15+i*.018);
          bar('#e3bc60',a,b,c,d,.032+i*.019,.045,.077+i*.009);
        }
        model('cylinder','#86613b',.39,0,.65,.39,.10,.39,Math.PI/2,0,-.43);
        model('cylinder','#584638',.43,0,.71,.24,.035,.24,Math.PI/2,0,-.43);
        poly('#e0c46a',-.29,.03,-.60,.11,.09,.13);
      }else if(hero==='saria'){
        model('lowSphere','#c69863',0,0,.03,.40,.19,.54);
        model('sphere','#e4bf82',-.03,.08,.12,.35,.13,.39);
        bar('#bb8656',.14,.00,.36,-.39,.25,.17,.01);
        box('#e3bc81',.36,.05,-.37,.19,.12,.16,0,.36);
        for(const [x,z] of [[-.16,-.06],[0,-.065],[-.13,.13],[.045,.14],[-.08,.30]]){
          disk('#685142',x,.205,z,.065,.028,.065);
        }
      }else if(hero==='darunia'){
        box('#3e3333',0,0,-.40,.22,.19,1.07);
        box('#756253',0,.10,-.31,.095,.033,.81);
        box('#ad8757',0,0,-.93,.24,.22,.13);
        model('cylinder','#33323c',0,0,.35,.78,1.02,.78,0,0,Math.PI/2);
        for(const x of [-.45,.45]){
          model('cylinder','#8e7662',x,0,.35,.81,.09,.81,0,0,Math.PI/2);
          model('cylinder','#a9a5a5',x*1.17,0,.35,.70,.08,.70,0,0,Math.PI/2);
          model('cylinder','#cfc4b6',x*1.25,0,.35,.53,.035,.53,0,0,Math.PI/2);
        }
      }else if(hero==='impa'){
        box('#654a3d',0,0,-.74,.14,.13,.56);
        for(const z of [-.97,-.83,-.69,-.55])box('#af875d',0,.065,z,.16,.045,.054);
        disk('#b89b60',0,0,-.42,.51,.10,.52);
        box('#73899b',0,0,.14,.34,.13,1.09);
        box('#b7c8c9',0,.072,.16,.27,.035,1.04);
        bar('#e6e5d2',-.14,-.38,-.14,.61,.049,.032,.078);
        poly('#a7bac1',0,0,.70,.17,.071,.22);
        band('#ecd29b',0,.066,-.42,.15);
      }else if(hero==='ruto'){
        poly('#407d9d',0,0,0,.48,.12,.69);
        poly('#76c5c3',-.02,.105,.05,.35,.048,.49);
        poly('#b0e6d9',-.04,.152,.13,.20,.017,.30);
        for(const bias of [-1,1]){
          bar('#438c9c',0,-.32,bias*.24,-.09,.048,.027,.133);
          bar('#61a9b0',0,-.06,bias*.20,.19,.044,.025,.147);
        }
      }else if(hero==='nabooru'){
        disk('#9d623e',0,0,0,1.07,.15,1.07);
        disk('#ddab61',0,.08,0,.91,.06,.91);
        band('#ecc981',0,.12,0,.45);
        for(const n of [0,1,2]){
          const a=n*2.094395,x=Math.sin(a)*.17,z=Math.cos(a)*.17;
          const symbol=poly('#9b6045',x,.14,z,.09,.015,.23);symbol.rotation.y=a;
        }
        poly('#e9c978',0,.16,0,.10,.03,.12);
      }
      group.userData.materials=[...palette.values()];
      return group;
    }
    defeatBodyPosition(scene,t){
      const {spec,originX,originZ,facing,fallHeight}=scene;
      const [side,forward,turn,recoil]=spec.body,land=spec.contact;
      const u=clamp(t/land,0,1),rise=u*u*(3-2*u);
      const skid=clamp((t-land)/.22,0,1),slide=(1-(1-skid)**3);
      const scale=reducedMotion?.57:1;
      const lateral=scale*(side*(rise+.14*slide)+recoil*Math.sin(Math.PI*u)*.24);
      const advance=scale*(forward*(rise+.18*slide)-recoil*Math.sin(Math.PI*u)*.38);
      const x=clamp(originX+Math.cos(facing)*lateral+Math.sin(facing)*advance,-scene.limit,scene.limit);
      const z=clamp(originZ-Math.sin(facing)*lateral+Math.cos(facing)*advance,-scene.limit,scene.limit);
      const hang=spec.style==='twilight'||spec.style==='fairies'?.31:.12;
      const drop=clamp((u-hang)/(1-hang),0,1);
      const height=fallHeight*(1-drop**2.15);
      const press=clamp(1-Math.abs(t-land-.025)/.085,0,1);
      return {x,z,ground:this.groundHeight(x,z),height,press,face:facing+turn*rise*scale};
    }
    defeatGearPose(e,t){
      const {gear,spec,facing,originX,originZ,bounds}=e;
      const [release,land,side,front,spin,hop]=spec.prop,at=Math.max(release,spec.contact*spec.beats[0]);
      const travel=clamp((t-at)/(land-at),0,1);
      const bounce=clamp((t-land)/.17,0,1),skid=1-(1-bounce)**2;
      const limit=e.limit,dropScale=reducedMotion?.77:1,drift=(travel+.15*skid)*dropScale;
      const slip=gear.userData.offset??0;
      const lateral=.21+side*drift+slip,forward=.16+front*drift;
      const x=clamp(originX+Math.cos(facing)*lateral+Math.sin(facing)*forward,-limit,limit);
      const z=clamp(originZ-Math.sin(facing)*lateral+Math.cos(facing)*forward,-limit,limit);
      const spinScale=reducedMotion?.31:1;
      gear.rotation.set(spinScale*(.24*(1-travel)+spin*Math.sin(Math.PI*travel)),facing+travel*spinScale*spin+skid*.25,
        spinScale*(.42*(1-travel)+.22*Math.sin(Math.PI*bounce)));
      gear.position.set(x,0,z);
      gear.updateMatrixWorld(true);
      bounds.setFromObject(gear);
      const fall=(1-travel**2.45)*(e.fallHeight+1.12);
      const spring=hop*Math.sin(Math.PI*bounce)*(reducedMotion?.38:1);
      gear.position.y=this.groundHeight(x,z)-bounds.min.y+.014+fall+spring;
      gear.visible=t>=at;
      for(const material of gear.userData.materials)material.opacity=.98*clamp((1-t)/.13,0,1);
      const spark=e.gearRipple,beat=clamp((t-land)/.106,0,1);
      spark.position.set(x,this.groundHeight(x,z)+.044,z);
      spark.scale.set(.15+beat*.41,.15+beat*.41,.085);
      spark.rotation.x=-Math.PI/2;
      spark.material.opacity=(t>=land?1:0)*(1-beat)*(reducedMotion?.34:.75);
    }
    defeatFootAnchor(hero,direction,frame){
      if(!RelicArt.canvas)return 0;
      const canvas=RelicArt.canvas('hero',hero,direction,frame,'death');
      const cache=this.defeatAnchors??=new WeakMap();
      if(cache.has(canvas))return cache.get(canvas);
      const {width:w,height:h}=canvas,{data}=canvas.getContext('2d').getImageData(0,0,w,h);
      const seen=new Uint8Array(w*h),q=new Int32Array(w*h);
      let size=0,lowest=h-1;
      // Use the largest connected region, so a loose spark never becomes the contact point.
      for(let i=0;i<w*h;i++){
        if(seen[i]||data[i*4+3]<128)continue;
        let first=0,last=1,bottom=0;q[0]=i;seen[i]=1;
        while(first<last){
          const j=q[first++],row=Math.floor(j/w),col=j%w;
          bottom=Math.max(bottom,row);
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            const x=col+dx,y=row+dy,k=y*w+x;
            if(x<0||x>=w||y<0||y>=h||seen[k]||data[k*4+3]<128)continue;
            seen[k]=1;q[last++]=k;
          }
        }
        if(last>size){size=last;lowest=bottom;}
      }
      const value=size?clamp((h-1-lowest)/h,0,.77):0;
      cache.set(canvas,value);return value;
    }
    heroDefeatSpec(hero){
      const plan={
        link:['sparks','#f4cc89','#91b77f','diamond',.54],
        zelda:['seal','#fff1b8','#d7a661','diamond',.61],
        midna:['twilight','#8263a0','#9ed2c2','box',.68],
        tetra:['spray','#abd9e4','#ec9a7e','lowSphere',.53],
        sheik:['veil','#dfecdf','#91a0bf','box',.49],
        skullkid:['fairies','#fff1aa','#d7a3ec','diamond',.65],
        impa:['steel','#ddf2ff','#d3a879','diamond',.51],
        saria:['leaves','#b4e487','#fff0a6','diamond',.56],
        darunia:['stone','#c39855','#f2c585','lowSphere',.55],
        ruto:['ripple','#a3e2df','#5faeca','lowSphere',.58],
        nabooru:['spirit','#f0b56f','#c97c8a','diamond',.59],
      }[hero];
      if(!plan)return null;
      const [style,a,b,geometry,contact]=plan;
      // Body: lateral step, forward step, turn, recoil. Gear: release, contact, side, travel, spin, bounce.
      const stories={
        link:[[.27,-.64,-.17,.45],[.13,.35,-.82,.77,4.8,.18],2.08,[.12,.29,.53,.79]],
        zelda:[[-.17,.24,.12,.12],[.16,.35,.71,.51,2.8,.07],2.26,[.14,.35,.59,.83]],
        midna:[[-.56,-.69,-.30,.35],[.16,.41,.86,-.87,5.9,.17],2.24,[.18,.40,.68,.83]],
        tetra:[[.55,1.06,.37,.51],[.09,.27,.82,1.18,6.3,.24],1.96,[.09,.31,.52,.74]],
        sheik:[[-.64,-.45,-.51,.43],[.10,.27,-.73,1.02,7.0,.11],1.88,[.08,.31,.60,.83]],
        skullkid:[[.68,-.78,.44,.39],[.11,.39,-.66,1.05,5.2,.29],2.22,[.10,.33,.57,.78]],
        impa:[[-.22,.60,-.24,.26],[.16,.31,-.59,1.12,2.65,.075],2.05,[.12,.32,.48,.84]],
        saria:[[-.35,.44,-.13,.31],[.10,.34,.62,.64,4.1,.15],2.13,[.10,.25,.51,.80]],
        darunia:[[.07,-.52,.17,.24],[.12,.27,.83,.98,2.6,.065],2.24,[.19,.36,.63,.85]],
        ruto:[[.64,.78,.29,.24],[.16,.35,-.78,.80,5.6,.19],2.23,[.15,.37,.56,.80]],
        nabooru:[[-.48,.57,-.23,.24],[.12,.32,.88,.55,6.8,.24],2.14,[.13,.34,.52,.84]],
      };
      const [body,prop,time,beats]=stories[hero];
      return {style,colors:[a,b],geometry,contact,time,body,prop,beats};
    }
    defeatPoseFrame(hero,age,between=false){
      const spec=this.heroDefeatSpec(hero);
      if(!spec)return RelicArt.animationFrame('death',age);
      const t=clamp(age/spec.time,0,1),land=spec.contact;
      const knots=[0,...spec.beats.map(b=>b*land),land,land+(1-land)*.30,land+(1-land)*.74];
      let key=0;
      while(key+1<knots.length&&t+1e-7>=knots[key+1])key++;
      if(!between||key===7)return key;
      return key+((t-knots[key])/(knots[key+1]-knots[key])>=.5?.5:0);
    }
    heroDefeatFx(hero,player,limit=64){
      const spec=this.heroDefeatSpec(hero);
      if(this.heroDefeat||!spec)return;
      const root=new THREE.Group(),parts=[],materials=[];
      root.name='defeat:'+hero;
      const add=(kind,shape,slot)=>{
        const material=new THREE.MeshBasicMaterial({color:spec.colors[slot],transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
        const mesh=new THREE.Mesh(this.geometries[shape],material);mesh.name='defeat-'+kind;
        root.add(mesh);parts.push({mesh,kind});materials.push(material);
      };
      for(let i=0;i<(reducedMotion||storage.graphics==='low'?6:12);i++)add('mote',spec.geometry,i%2);
      add('ground-ring','torus',0);add('ground-ring','torus',1);
      if(['seal','spirit','fairies','veil'].includes(spec.style)){
        for(let i=0;i<(spec.style==='spirit'?1:spec.style==='fairies'?2:3);i++)
          add(spec.style,spec.style==='veil'?'box':'diamond',i%2);
      }
      const gear=this.makeDefeatProp(hero);
      root.add(gear);materials.push(...gear.userData.materials);
      add('contact-shade','disc',0);
      add('gear-ripple','torus',1);
      const gearRipple=parts.pop().mesh;
      const shade=parts.at(-1).mesh;shade.material.color.set('#141b20');
      const e={kind:'heroDefeat',mesh:root,parts,materials,time:spec.time,duration:spec.time,spec,gear,gearRipple,
        originX:player.x,originZ:player.z,fallHeight:(player.y||0)+this.heroHoverLift(hero,this.elapsed||0),
        facing:player.facing||0,bounds:new THREE.Box3(),limit};
      const touch=this.defeatBodyPosition(e,spec.contact);e.x=touch.x;e.z=touch.z;
      this.heroDefeat=e;this.entities.add(root);this.effects.push(e);this.positionHeroDefeat(e,0);return e;
    }
    positionHeroDefeat(e,t){
      const {style,contact}=e.spec,{x,z,facing}=e,slow=reducedMotion;
      const metal=style==='steel'||style==='sparks',water=style==='ripple'||style==='spray',
        stone=style==='stone',mist=style==='veil'||style==='twilight',leaf=style==='leaves';
      this.defeatGearPose(e,t);
      let rings=0,extra=0;
      for(let i=0;i<e.parts.length;i++){
        const {mesh:p,kind}=e.parts[i];
        if(kind==='contact-shade'){
          const body=this.defeatBodyPosition(e,t);
          const spread=clamp(t/contact,0,1);
          p.position.set(body.x,body.ground+.052,body.z);
          p.scale.set(.50+spread*.31,.31+spread*.20,1);
          p.rotation.set(-Math.PI/2,0,body.face);
          p.material.opacity=.28*clamp(t/.15,0,1)*(.55+spread*.45)*clamp((1-t)/.08,0,1);
        }else if(kind==='ground-ring'){
          const n=rings++,local=clamp((t-contact-.05*n)/.34,0,1);
          const r=(slow?.65:.15+local*.85)*(stone?2.4:water?2.1:1.27)*(n?.81:1);
          p.scale.set(r,r,.078);p.rotation.x=-Math.PI/2;
          p.position.set(x,this.groundHeight(x,z)+.065+n*.045,z);
          p.material.opacity=(t>=contact+.05*n?1:0)*(1-local)*clamp((1-t)/.11,0,1)*(slow?.24:water||stone?.61:.42);
        } else if(kind!=='mote'){
          const n=extra++,open=slow?.48:clamp((t-.12)/.62,0,1);
          const alpha=clamp(t/.15,0,1)*clamp((1-t)/.30,0,1);
          if(kind==='fairies'){
            const a=n*Math.PI+open*2.8,r=.48+open*(1.19+n*.25);
            p.position.set(x+Math.sin(a)*r,this.groundHeight(x,z)+1+open*(1+n*.5),z+Math.cos(a)*r);
            p.scale.setScalar(.14);p.rotation.y=open*5;p.material.opacity=alpha;
          }else if(kind==='veil'){
            p.position.set(x+(n-1)*.44+open*.76,this.groundHeight(x,z)+.52+n*.18+open*.58,z-.5+open*.38);
            p.scale.set(.48+open*.2,.03,.08);p.rotation.z=.21+n*.12+open*.26;p.material.opacity=.38*alpha;
          }else{
            const d=n===0?0:n===1?-.36:.36;
            p.position.set(x+Math.cos(facing)*d,this.groundHeight(x,z)+1.30+open*.72+(n===0?.30:0),z-Math.sin(facing)*d);
            p.scale.set(kind==='spirit'?.40:.21,kind==='spirit'?.40:.21,.07);
            p.rotation.y=facing+open;p.material.opacity=alpha*.73;
          }
        }else{
          const start=(metal||water||stone?contact-.02:.19)+(i%5)*.030;
          const q=clamp((t-start)/(.57-(i%3)*.049),0,1),u=slow?.5:q;
          const a=facing+(metal?(i%2?1:-1)*(.30+i*.14):i*2.39996)+(mist?u:0);
          const r=.24+(i%4)*.13+u*(stone?1.39:metal||water?1.12:.72);
          const xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r;
          const up=(metal||water||stone)?Math.sin(Math.PI*u)*(water?.83:stone?.51:.42):.60+u*(leaf?1.24:.88)+(i%3)*.22;
          const s=(.078+(i%4)*.025)*(1-q*.36);
          p.position.set(xx,this.groundHeight(xx,zz)+.12+up,zz);
          p.scale.set(s*(mist?1.55:1),s*(leaf?.57:metal?1.8:1),s*.86);p.rotation.set(a*.8,u*3+i*.42,a*.73);
          p.material.opacity=(1-q)**.8*clamp(q/.12,0,1)*clamp((1-t)/.13,0,1)*(slow?.55:.86);
        }
      }
    }
    heroPoseFrame(action,age,remaining,kind=null,impact=null){
      const frames=RelicArt.ANIMATIONS?.[action]?.[0];
      if(reducedMotion&&action==='glide')return 0;
      const total=age+(remaining||0);
      if(!frames||!['attack','cast','ultimate','dash','hurt'].includes(action)||!(total>1e-6))
        return RelicArt.animationFrame(action,age);
      if(action==='ultimate'&&Number.isFinite(impact)&&impact>0&&impact<total){
        const key={spin:3,seal:3,fused:4,waterGun:4,harp:3,moonCrash:6,waterBlade:3,goronSlam:6,rutoSurge:3}[kind]??3;
        // Step onto the authored contact pose at the simulation's actual release/landing time.
        const frame=age+1e-6<impact?Math.floor(age/impact*key):
          key+Math.floor(clamp((age-impact)/(total-impact),0,1)*(frames-key));
        return clamp(frame,0,frames-1);
      }
      return clamp(Math.floor(age/total*frames),0,frames-1);
    }
    heroHoverLift(id,time,groundedEnd=false){
      if(groundedEnd||(id!=='skullkid'&&id!=='midna'))return 0;
      const midna=id==='midna';
      return (midna?.56:.74)+(reducedMotion?0:Math.sin((time||0)*(midna?2:2.4))*(midna?.085:.11));
    }
    companionModel(entry){
      const root=new THREE.Group();
      const sprite=RelicArt.sprite('hero',entry.hero,1.95,1.95);
      root.add(sprite);this.entities.add(root);
      const accent=this.mesh('torus','#a0f0d3',[.69,.69,.12],[0,.065,0],root,{basic:true,opacity:.69});
      accent.rotation.x=-Math.PI/2;
      const pip=this.mesh('diamond','#c2ffe9',[.11,.16,.09],[0,2.01,0],root,{basic:true});
      Object.assign(root.userData,{sprite,pip});return root;
    }
    companionPose(root,entry,game){
      const action=entry.action||'idle',heading=Math.atan2(this.camera.position.x-entry.x,this.camera.position.z-entry.z);
      const direction=BonkCamera.direction(entry.facing??0,heading);
      root.position.set(entry.x,Number.isFinite(entry.y)?entry.y:game.groundAt(entry.x,entry.z),entry.z);
      const hover=this.heroHoverLift(entry.hero,game.time);
      root.userData.sprite.position.y=hover;
      root.userData.pip.position.y=2.01+hover;
      root.userData.sprite.material=RelicArt.material('hero',entry.hero,direction,this.heroPoseFrame(action,entry.actionAge||0,entry.actionTime,entry.attackKind),false,action,entry.attackKind??null);
    }
    syncMap(map,items,create,update) {
      const active=new Set();for(const item of items){active.add(item.id);let mesh=map.get(item.id);if(!mesh){mesh=create(item);map.set(item.id,mesh);}update(mesh,item);}
      for(const [id,mesh] of map)if(!active.has(id)){this.entities.remove(mesh);mesh.userData.ownedMaterial?.dispose();map.delete(id);}
    }
    paintedImpactCrater(x,z,size,limit,lip,interior,next,material){
      // A ground-hugging decal: dark facets and a one-sided highlight imply depth.
      const radius=.30+size*.33, sides=size>=8?40:size>=4?28:20;
      const positions=[],colors=[],indices=[],rings=[];
      const phase=next()*Math.PI*2;
      const dark=interior.clone().multiplyScalar(.47),shade=interior.clone().lerp(lip,.17);
      const edges=Array.from({length:sides},(_,i)=>({
        a:phase+(i+(next()-.5)*.44)*Math.PI*2/sides,
        width:.84+next()*.29,value:.86+next()*.24,
      }));
      // Closely spaced rings keep the decal against uneven outdoor terrain.
      const bands=[[0,.49],[.57,.38],[.73,.22],[.86,.08],[.94,.10],[1.01,.78],[1.10,.37]];
      function tone(a,j){
        const light=Math.max(0,Math.cos(a+2.15));
        if(j<3)return dark.clone().lerp(shade,bands[j][1]);
        const facing=1-light;
        return j===3?dark.clone().lerp(shade,.36*facing)
          :j===4?interior.clone().lerp(lip,.17*facing)
          :interior.clone().lerp(lip,bands[j][1]*(.22+.78*light));
      }
      const sampleBand=(r,j,k,t)=>{
        const ids=[];
        for(const {a,width,value} of edges){
          const reach=radius*r*width,wx=clamp(x+Math.cos(a)*reach,-limit,limit),wz=clamp(z+Math.sin(a)*reach,-limit,limit);
          const paint=tone(a,j).lerp(tone(a,k),t).multiplyScalar(1+(value-1)*Math.min(1,r));
          ids.push(positions.length/3);
          positions.push(wx,this.groundHeight(wx,wz)+.043,wz);colors.push(paint.r,paint.g,paint.b);
        }
        rings.push(ids);
      };
      sampleBand(0,0,0,0);
      for(let j=1;j<bands.length;j++){
        const r0=bands[j-1][0],r1=bands[j][0],steps=Math.ceil((r1-r0)*radius/.33);
        for(let k=1;k<=steps;k++)sampleBand(r0+(r1-r0)*k/steps,j-1,j,k/steps);
      }
      for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){
        const k=(i+1)%sides,a=rings[j][i],b=rings[j][k],c=rings[j+1][i],d=rings[j+1][k];
        indices.push(a,b,c,b,d,c);
      }
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
      geometry.setIndex(indices);
      const mesh=new THREE.Mesh(geometry,material);
      mesh.name='shaded-impact-crater';mesh.renderOrder=1;
      return {mesh,geometry,radius};
    }
    groundCrack({x,z,impactSize,style},delay=0){
      if(![x,z,impactSize].every(Number.isFinite)||impactSize<=0)return;
      const size=clamp(impactSize,.5,12),limit=this.landmark?.limit??64;
      if(Math.abs(x)>limit||Math.abs(z)>limit)return;
      const budget=storage.graphics==='low'?9:16;
      const cracks=this.effects.filter(e=>e.kind==='groundCrack');
      if(cracks.length>=budget){
        const smallest=cracks.reduce((a,b)=>a.size<=b.size?a:b);
        if(smallest.size>size)return;
        this.entities.remove(smallest.mesh);this.disposeEffect(smallest);
        this.effects.splice(this.effects.indexOf(smallest),1);
      }
      // Cracks are painted on the floor, with a dark core and offset bevel colors.
      const large=size>=4,lunar=style==='moonCrash'||style==='moonfall';
      const rim=new THREE.Color(lunar?'#9a849b':style==='goronSlam'||style==='hammer'?'#c58f63':'#a8a089');
      const split=new THREE.Color(lunar?'#211928':'#241a17');
      const shade=split.clone().lerp(rim,.28),edge=split.clone().lerp(rim,.77);
      const positions=[],colors=[],segments=[],reach=size*.82;
      let seed=(Math.round(x*507)^Math.round(z*811)^Math.round(size*500))>>>0;
      const next=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      const vertex=(pt,dx,dz,paint)=>{
        const wx=clamp(x+pt.x+dx,-limit,limit),wz=clamp(z+pt.z+dz,-limit,limit);
        positions.push(wx,this.groundHeight(wx,wz)+.043,wz);colors.push(paint.r,paint.g,paint.b);
      };
      const line=(a,b,wa,wb)=>{
        const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
        if(length<.001)return;
        const steps=Math.ceil(length/.37),nx=-dz/length,nz=dx/length;
        const lerp=(u,v,t)=>u+(v-u)*t;
        for(let i=0;i<steps;i++){
          const u=i/steps,v=(i+1)/steps;
          const p={x:lerp(a.x,b.x,u),z:lerp(a.z,b.z,u)},q={x:lerp(a.x,b.x,v),z:lerp(a.z,b.z,v)};
          segments.push({p,q,nx,nz,w1:lerp(wa,wb,u),w2:lerp(wa,wb,v),distance:Math.max(Math.hypot(p.x,p.z),Math.hypot(q.x,q.z))});
        }
      };
      const spokes=large?(size>=8?9:7):5,offset=next()*Math.PI*2;
      const mouth=.30+size*.33;
      for(let i=0;i<spokes;i++){
        const angle=offset+(i+(next()-.5)*.5)*Math.PI*2/spokes;
        const length=reach*(i===0?1:.67+next()*.33),width=(.060+size*.037)*(.62+next()*.58);
        const inner=mouth*(.87+next()*.08);
        let a={x:Math.cos(angle)*inner,z:Math.sin(angle)*inner};
        for(let j=1;j<=4;j++){
          const t=j/4,wobble=(next()-.5)*(.38+j*.025),r=inner+(Math.max(inner+.07,length)-inner)*t;
          const b={x:Math.cos(angle+wobble)*r,z:Math.sin(angle+wobble)*r};
          const w=width*(1-t*.9);
          line(a,b,width*(1-(j-1)/4*.9),w);
          if((j===2&&(large||i%2===0))||(j===3&&size>=8&&i%2===0)){
            const branchAngle=angle+(i%2?1:-1)*(.62+next()*.46);
            const len=length*(j===2?.32:.21);
            const elbow={x:b.x+Math.cos(branchAngle)*len*.48,z:b.z+Math.sin(branchAngle)*len*.48};
            const tip={x:elbow.x+Math.cos(branchAngle-.31)*len*.52,z:elbow.z+Math.sin(branchAngle-.31)*len*.52};
            line(b,elbow,w*.72,w*.39);line(elbow,tip,w*.39,.006);
          }
          a=b;
        }
      }
      segments.sort((a,b)=>a.distance-b.distance);
      for(const {p,q,nx,nz,w1,w2} of segments){
        const band=(u,v,paint)=>{
          vertex(p,nx*w1*u,nz*w1*u,paint);vertex(p,nx*w1*v,nz*w1*v,paint);vertex(q,nx*w2*u,nz*w2*u,paint);
          vertex(q,nx*w2*u,nz*w2*u,paint);vertex(p,nx*w1*v,nz*w1*v,paint);vertex(q,nx*w2*v,nz*w2*v,paint);
        };
        const litSide=nx*.55+nz*.83>0;
        band(-1.45,-.84,litSide?rim:shade);
        band(-.84,-.56,litSide?edge:shade);
        band(-.56,.54,split);
        band(.54,.82,litSide?shade:edge);
        band(.82,1.35,litSide?shade:rim);
      }
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
      const material=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
      const crack=new THREE.Mesh(geometry,material);crack.name='shaded-impact-cracks';crack.renderOrder=2;
      const crater=this.paintedImpactCrater(x,z,size,limit,rim,split,next,material);
      const mesh=new THREE.Group();mesh.name='painted-impact-scar';mesh.add(crater.mesh,crack);this.entities.add(mesh);
      const duration=1.54+size*.33,effect={mesh,geometry,material,crater,kind:'groundCrack',time:duration+delay,duration,size,vertexCount:positions.length/3};
      this.positionGroundCrack(effect);this.effects.push(effect);
      return effect;
    }
    positionGroundCrack(e){
      const age=e.duration-e.time;
      e.mesh.visible=age>=-1e-6;
      const progress=reducedMotion?1:clamp(.36+age/(.12+e.size*.016),.36,1);
      e.geometry.setDrawRange(0,Math.floor(e.vertexCount/30*progress)*30);
      e.material.opacity=.96*clamp(e.time/.62,0,1);
    }
    ringEffect(x,z,color,radius,duration=.5) {
      if(this.effects.length>120)return;
      const mesh=this.mesh('torus',color,[.1,.1,.1],[x,this.groundHeight(x,z)+.15,z],this.entities,{basic:true,opacity:.75});mesh.rotation.x=-Math.PI/2;
      this.effects.push({mesh,time:duration,duration,radius,kind:'ring'});
    }
    popEffect(x,z,color) {
      if(storage.graphics==='low'||this.effects.length>120)return;
      for(let i=0;i<4;i++){const mesh=this.mesh('lowSphere',color,[.12,.12,.12],[x,this.groundHeight(x,z)+.55,z],this.entities,{basic:true});const a=i*Math.PI/2+Math.random();this.effects.push({mesh,time:.4,duration:.4,kind:'particle',vx:Math.cos(a)*2.4,vz:Math.sin(a)*2.4,vy:3});}
    }
    damageText(x,z,damage,critical=0) {
      if(storage.graphics==='low'||reducedMotion||this.effects.filter(e=>e.kind==='text').length>14)return;
      const canvas=document.createElement('canvas');canvas.width=192;canvas.height=64;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.font='900 '+(typeof damage==='string'?22:35)+'px Nunito,sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#344b43';const label=String(damage)+(critical===2?'!!':critical?'!':'');ctx.strokeText(label,96,43);ctx.fillStyle=critical===2?'#f0b8f5':critical?'#ffe37c':'#fff3ce';ctx.fillText(label,96,43);
      const texture=new THREE.CanvasTexture(canvas),material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false});const mesh=new THREE.Sprite(material);mesh.position.set(x,this.groundHeight(x,z)+2,z);mesh.scale.set(2.3,.77,1);this.entities.add(mesh);this.effects.push({mesh,time:.65,duration:.65,kind:'text',texture,material});
    }
    disposeEffect(e){
      e.texture?.dispose();e.material?.dispose();e.geometry?.dispose();e.crater?.geometry.dispose();
      for(const material of e.materials||[])material.dispose();
      for(const geometry of e.ownedGeometry||[])geometry.dispose();
    }
    clearDynamic() {
      for(const mesh of this.projectiles.values())mesh.userData.ownedMaterial?.dispose();this.clearGroup(this.entities);for(const map of [this.enemies,this.companions,this.projectiles,this.shards,this.hazards,this.loot])map.clear();this.orbits=[];this.lockRing=null;for(const e of this.effects)this.disposeEffect(e);this.terminalAge=0;this.heroDefeat=null;this.effects=[];this.ultimateCues=[];
    }
    resize() { this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix(); }
    titlePose(time) {
      this.hero.position.set(0,0,0);this.hero.rotation.y=-.35;this.heroSprite.center.y=0;this.heroSprite.scale.set(2.66,2.66,1);this.heroRig.position.y=this.heroHoverLift(this.heroId,time)+(!['skullkid','midna'].includes(this.heroId)&&!reducedMotion?Math.sin(time*1.7)*.025:0);this.heroSprite.material=RelicArt.material('hero',this.heroId,0,RelicArt.animationFrame('idle',time),false,'idle');this.heroSprite.material.opacity=1;this.updateGlideRig(this.glider,false,time,reducedMotion);
      const mobile=innerWidth<700;
      const target=new THREE.Vector3(mobile?-3.3:-5.9,0,mobile?1.6:5.6);this.camera.position.set(16,17,19);this.camera.lookAt(target);
      this.hero.scale.setScalar(mobile?1.7:1.7);
      if(this.navi){this.naviPose(this.navi,time);this.navi.rotation.y=Math.atan2(16,19)-this.hero.rotation.y;}
    }
    render(game,dt,time) {
      const terminal=game&&['won','lost'].includes(game.state);
      const animate=!game||game.state==='running'||(terminal&&!endingShown)||(game.state==='upgrade'&&time<upgradeReadyAt);
      const effectDt=animate?dt:0;
      if(terminal&&!endingShown)this.terminalAge=(this.terminalAge||0)+dt;
      this.elapsed=game?game.time:time;time=this.elapsed;
      if(game){
        if(this.realm!==game.realm||this.levelStage!==game.stage||this.landmark!==(game.landmark||null)){
          this.clearDynamic();
          if(game.landmark)this.buildLandmark(game.realm,game.stage,game.landmark);
          else this.buildRealm(game.realm,game.stage);
        }
        if(this.ultimateCues.length){
          this.ultimateCues=this.ultimateCues.filter(cue=>{
            if(cue.at>time)return true;
            const p=game.player;
            this.ultimateEffect({...cue.event,x:p.x,z:p.z},undefined,p);return false;
          });
        }
        const p=game.player,lost=game.state==='lost',deathAge=this.terminalAge||0;
        if(lost&&!endingShown)this.heroDefeatFx(game.hero,p,game.arenaLimit-.4);
        const dead=this.heroDefeat,deathProgress=dead?clamp(deathAge/dead.duration,0,1):0;
        const landed=lost&&dead?this.defeatBodyPosition(dead,deathProgress):null;
        const fall=landed?landed.height:p.y,ground=landed?landed.ground:(p.ground||0);
        this.hero.scale.setScalar(1);this.hero.position.set(landed?.x??p.x,fall+ground,landed?.z??p.z);
        const moving=Math.hypot(p.x-this.lastPlayer.x,p.z-this.lastPlayer.z)>.001;this.lastPlayer={x:p.x,z:p.z};
        const walking=moving&&p.y===0&&game.state==='running';
        let action=terminal?(game.state==='won'?'victory':'death'):p.gliding&&['glide','jump','walk','idle'].includes(p.action)?'glide':p.action||(walking?'walk':'idle');
        if(action==='glide'&&game.hero!=='link'&&game.hero!=='midna')action='jump';
        const age=terminal?(this.terminalAge||0):p.actionAge;
        const aimed=(action==='attack'||action==='cast'||action==='ultimate')&&p.actionTime>0&&Number.isFinite(p.attackFacing),facing=landed?landed.face:aimed?p.attackFacing:p.facing;
        const angle=facing-this.hero.rotation.y;this.hero.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*Math.min(1,dt*13);
        const hover=lost?0:this.heroHoverLift(game.hero,time);
        this.heroRig.position.y=hover+(walking&&game.hero!=='skullkid'&&game.hero!=='midna'&&!reducedMotion?Math.abs(Math.sin(time*14))*.035:0);
        this.updateGlideRig(this.glider,!terminal&&!!p.gliding,time,reducedMotion);this.hero.visible=true;
        this.heroShadow.position.set(this.hero.position.x,ground,this.hero.position.z);
        this.heroShadow.scale.setScalar(Math.max(.3,1-fall*.08-hover*.11));
        const focus=landed??(lost?p:this.moonCameraFocus(p)),zoom=innerWidth<600?1.12:1;
        const cameraBeat=lost&&!reducedMotion?1-(1-deathProgress)**2:0,range=this.distance*zoom*(1-.21*cameraBeat);
        const yaw=this.yaw+cameraBeat*(dead?.spec.body[0]<0?-.16:.16),pitch=Math.max(.20,this.pitch-.10*cameraBeat);
        const camPos=new THREE.Vector3(focus.x+Math.sin(yaw)*Math.cos(pitch)*range,Math.sin(pitch)*range+ground,focus.z+Math.cos(yaw)*Math.cos(pitch)*range);
        camPos.y=Math.max(camPos.y,this.groundHeight(camPos.x,camPos.z)+.85);
        this.camera.position.lerp(camPos,1-Math.exp(-6*dt));
        this.camera.position.y=Math.max(this.camera.position.y,this.groundHeight(this.camera.position.x,this.camera.position.z)+.85);
        this.cameraTarget.lerp(new THREE.Vector3(focus.x,.4+this.groundHeight(focus.x,focus.z),focus.z),1-Math.exp(-8*dt));
        if(!reducedMotion&&this.shake>0){this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.z+=(Math.random()-.5)*this.shake;this.shake*=Math.exp(-8*dt);}
        this.camera.lookAt(this.cameraTarget);this.camera.updateMatrixWorld();
        const cameraHeading=Math.atan2(this.camera.position.x-this.hero.position.x,this.camera.position.z-this.hero.position.z);
        const direction=BonkCamera.direction(facing,cameraHeading);
        const frame=lost?this.defeatPoseFrame(game.hero,age,true):this.heroPoseFrame(action,age,p.actionTime,p.attackKind,p.actionImpact);
        this.heroSprite.center.y=lost?this.defeatFootAnchor(game.hero,direction,frame):0;
        this.heroSprite.scale.set(2.66,2.66,1); // Articulated cels, not whole-sprite squash.
        if(this.navi){
          this.naviPose(this.navi,time+(lost?deathAge:0),lost?deathAge:null);
          this.navi.rotation.y=cameraHeading-this.hero.rotation.y;
        }
        this.heroSprite.material=RelicArt.material('hero',this.heroId,direction,frame,p.action==='hurt',action,(action==='attack'||action==='cast')?p.attackKind:null);
        this.heroSprite.material.opacity=lost?1-.14*clamp((deathProgress-.87)/.13,0,1):(p.invincible>0&&p.dash<=0?.65+Math.abs(Math.sin(time*15))*.35:1);
        this.sun.position.set(p.x-17,35+(p.ground||0),p.z+12);this.sun.target.position.set(p.x,p.ground||0,p.z);
        this.syncMap(this.companions,game.companions||[],c=>this.companionModel(c),(m,c)=>this.companionPose(m,c,game));
        this.syncMap(this.enemies,game.enemies.filter(e=>!e.dead),e=>this.enemyModel(e),(m,e)=>this.enemyPose(m,e,game,time));
        if(!this.lockRing){this.lockRing=this.mesh('torus','#ffc778',[1,1,1],[0,.08,0],this.entities,{basic:true});this.lockRing.rotation.x=-Math.PI/2;}
        const locked=game.enemies.find(e=>e.id===game.lockedTarget&&!e.dead);this.lockRing.visible=!!locked;if(locked){this.lockRing.position.set(locked.x,game.groundAt(locked.x,locked.z)+.08,locked.z);this.lockRing.scale.setScalar(locked.radius+.35);}
        this.syncMap(this.shards,game.shards,s=>{const m=this.mesh('diamond',s.value>4?'#e8cd85':'#a5edce',[.17,.3,.17],[s.x,.4,s.z],this.entities,{basic:true});return m;},(m,s)=>{m.position.set(s.x,game.groundAt(s.x,s.z)+.38+Math.sin(time*3+s.id)*.08,s.z);m.rotation.y=time*1.8+s.id;m.scale.setScalar(s.value>4?.4:.25);});
        this.syncMap(this.loot,game.loot,drop=>{
          const group=new THREE.Group(),color=Combat.RARITIES[Combat.item(drop.gearId).rarity].color;this.entities.add(group);
          this.mesh('box','#745137',[.9,.55,.65],[0,.3,0],group);this.mesh('box',color,[.98,.22,.72],[0,.68,0],group);
          this.mesh('box','#f0d78b',[.13,.65,.75],[0,.38,0],group);const ring=this.mesh('torus',color,[.8,.8,.8],[0,.04,0],group,{basic:true});ring.rotation.x=-Math.PI/2;return group;
        },(m,drop)=>{m.position.set(drop.x,game.groundAt(drop.x,drop.z)+(reducedMotion?0:Math.sin(time*2+drop.id)*.05),drop.z);});
        this.syncMap(this.projectiles,game.projectiles,b=>this.createProjectile(b),(m,b)=>this.projectilePose(m,b,game));
        this.syncMap(this.hazards,game.hazards,h=>{const group=new THREE.Group();this.entities.add(group);const disc=this.mesh('disc','#d66b55',[h.radius,h.radius,1],[0,.05,0],group,{basic:true,opacity:.38});disc.rotation.x=-Math.PI/2;const ring=this.mesh('torus','#f6a086',[h.radius,h.radius,h.radius],[0,.06,0],group,{basic:true});ring.rotation.x=-Math.PI/2;group.userData.disc=disc;group.userData.ring=ring;return group;},(m,h)=>{m.position.set(h.x,game.groundAt(h.x,h.z),h.z);m.userData.ring.scale.setScalar(h.radius*clamp(1-h.timer/h.duration,.05,1));m.visible=!h.fired;});
        const orbit=game.weaponStats('orbit'),count=game.hero!=='midna'&&game.rank('orbit')&&game.orbitActive>0?orbit.count:0;
        while(this.orbits.length<count){const m=this.mesh('diamond','#c5d4d0',[.3,.44,.3],[0,1,0],this.entities);this.orbits.push(m);}
        this.orbits.forEach((m,i)=>{m.visible=i<count;if(!m.visible)return;const a=game.orbitAngle+i*Math.PI*2/count;m.position.set(p.x+Math.cos(a)*orbit.radius,(p.ground||0)+1+Math.sin(time*3+i)*.15,p.z+Math.sin(a)*orbit.radius);m.rotation.set(time,time*.6,0);});
        const shrineReady=!game.shrines.has(game.realm)||(game.mode==='adventure'&&game.realm===0&&game.shrines.size===REALMS.length&&!terminal);if(this.shrineGem)this.shrineGem.visible=shrineReady&&!game.boss;if(this.shrineRing)this.shrineRing.visible=shrineReady&&!game.boss;
      }else this.titlePose(time);
      if(this.shrineGem){this.shrineGem.rotation.y=time*.7;this.shrineGem.position.y=2.5+Math.sin(time*1.8)*.16;this.shrineRing.rotation.z=time*.25;}
      this.floating.forEach(f=>{f.mesh.position.y=f.base+Math.sin(time*(f.water?.6:.8)+f.phase)*(f.water?.015:.23);if(f.rotate)f.mesh.rotation.z=time*.06;});
      if(this.motes){this.motes.rotation.y=time*.007;this.motes.position.y=Math.sin(time*.3)*.3;}
      for(const e of this.effects){
        e.time-=effectDt;const t=clamp(1-e.time/e.duration,0,1);
        if(e.kind==='ring')e.mesh.scale.setScalar(.1+e.radius*t);
        else if(e.kind==='particle'){e.mesh.position.x+=e.vx*effectDt;e.mesh.position.z+=e.vz*effectDt;e.mesh.position.y+=e.vy*effectDt;e.vy-=12*effectDt;e.mesh.scale.setScalar(.15*(1-t));}
        else if(e.kind==='text'){e.mesh.position.y+=effectDt*1.7;e.mesh.material.opacity=1-t;}
        else if(e.kind==='ghost'){
          const heading=Math.atan2(this.camera.position.x-e.mesh.position.x,this.camera.position.z-e.mesh.position.z);
          const flip=Number.isFinite(e.facing)&&BonkCamera.direction(e.facing,heading)>=5?1:0;
          e.material.map=RelicArt.material(e.actorKind,e.actorId,0,reducedMotion?5:RelicArt.animationFrame('death',t),false,'death',flip).map;
          e.material.opacity=1-t;e.mesh.position.y=this.groundHeight(e.mesh.position.x,e.mesh.position.z)+(reducedMotion?0:t*(e.actorKind==='boss'?.55:.32));
        }
        else if(e.kind==='enemyStrike'){
          const travel=e.offset+(reducedMotion?0:e.reach*t);
          e.mesh.position.set(e.x+e.dx*travel,e.y+(reducedMotion?0:Math.sin(Math.PI*t)*(e.caster?.34:.14)),e.z+e.dz*travel);
          const size=e.size*(1-t*.86);e.mesh.scale.set(size,e.caster?size:size*.65,e.caster?size:size*1.9);
        }
        else if(e.kind==='swordWaveRelease')this.positionSwordWaveRelease(e,t);
        else if(e.kind==='shadowStrike')this.positionShadowStrike(e,t);
        else if(e.kind==='companionShot')this.positionCompanionShot(e,t);
        else if(e.kind==='canonParticle')this.positionCanonParticle(e,t);
        else if(e.kind==='heroDefeat'){
          this.positionHeroDefeat(e,t);
          if(t>=e.spec.prop[1]&&!e.gearLanded){e.gearLanded=true;sound(e.spec.style==='stone'?'slam':'defeatProp');}
        }
        else if(e.kind==='groundCrack')this.positionGroundCrack(e);
        else if(e.kind==='ultimateSignature'){
          const phaseTime=Number.isFinite(e.startTime)?clamp((time-e.startTime)/e.duration,0,1):t;
          if(Number.isFinite(e.startTime)&&e.mesh.visible)e.time=e.startTime+e.duration+.08-time;
          this.positionUltimateStage(e,phaseTime);
        }
      }
      this.effects=this.effects.filter(e=>{if(e.time>0)return true;this.entities.remove(e.mesh);this.disposeEffect(e);return false;});
      this.windClock.value=time;this.windStrength.value=reducedMotion||storage.graphics==='low'?0:1;if(this.windmill)this.windmill.rotation.z=reducedMotion?0:time*.25;this.updateBillboards();
      this.renderer.render(this.scene,this.camera);
      if(game){$('player-health').hidden=game.state==='lost';const projected=new THREE.Vector3(game.player.x,game.player.y+(game.player.ground||0)-.25,game.player.z);projected.project(this.camera);$('player-health').style.left=((projected.x*.5+.5)*innerWidth)+'px';$('player-health').style.top=((-projected.y*.5+.5)*innerHeight)+'px';}
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
  function previewRealm(index,subtitle='Realm preview'){
    view.buildRealm(index);
    $('menu-landmark-name').textContent=REALMS[index].name.toUpperCase();
    $('menu-landmark-note').textContent=subtitle;
  }
  function adventureRealmStatus(index,checkpoint){
    if(checkpoint?.shrines.includes(index))return 'Cleared';
    if(index===ADVENTURE_ROUTE[0])return 'Starting map';
    if(checkpoint&&index===ADVENTURE_ROUTE.find(realm=>!checkpoint.shrines.includes(realm)))return 'Saved route';
    return 'Locked';
  }
  function previewSelectedRealm(){
    if(game)return;
    const index=selectedMode==='survival'?selectedSurvivalRealm:selectedAdventureRealm,checkpoint=storage.checkpoint?.mode==='adventure'?storage.checkpoint:null;
    previewRealm(index,selectedMode==='survival'?'Selected Survival map':'Adventure preview · '+adventureRealmStatus(index,checkpoint));
  }
  function updateRealmPicker(){
    const select=$('realm-picker'),adventure=selectedMode==='adventure',checkpoint=storage.checkpoint?.mode==='adventure'?storage.checkpoint:null;
    const labels=ADVENTURE_ROUTE.map(index=>REALMS[index].name+(adventure?' · '+adventureRealmStatus(index,checkpoint):''));
    const key=labels.join('|');
    if(select.dataset.realms!==key){
      select.replaceChildren(...ADVENTURE_ROUTE.map((index,n)=>{const option=document.createElement('option');option.value=index;option.textContent=labels[n];return option;}));
      select.dataset.realms=key;
    }
    select.value=adventure?selectedAdventureRealm:selectedSurvivalRealm;
    $('realm-picker-note').textContent=adventure?'Preview any realm. New Adventures start in Kokiri Forest.':'Choose the map you’ll play for this run.';
  }
  function updateProfileUI(){
    document.querySelectorAll('[data-mode]').forEach(button=>{button.classList.toggle('selected',button.dataset.mode===selectedMode);button.setAttribute('aria-pressed',String(button.dataset.mode===selectedMode));});$('difficulty').value=selectedDifficulty;updateRealmPicker();
    $('rupee-count').textContent=storage.rupees+' rupees';$('heroes-count').textContent=storage.unlocked.length+'/'+Object.keys(HEROES).length;$('achievement-count').textContent=storage.achievements.filter(item=>item.complete).length+'/'+storage.achievements.length;
    $('best-note').textContent=storage.runs?'Best: '+storage.bestKills+' defeated · '+storage.wins+' victories · '+storage.runs+' runs':'Eight maps. Three levels each. One final battle.';
    const checkpoint=storage.checkpoint;$('continue-button').hidden=!checkpoint;$('checkpoint-summary').hidden=!checkpoint;
    if(checkpoint){const realm=checkpoint.awaitingMapClear?checkpoint.realm:checkpoint.mode==='adventure'?(ADVENTURE_ROUTE.find(index=>!checkpoint.shrines.includes(index))??0):checkpoint.realm;$('continue-button').querySelector('span').textContent='Continue '+(checkpoint.mode==='adventure'?'adventure':'survival');$('checkpoint-summary').textContent=HEROES[checkpoint.hero].name+' · '+REALMS[realm].name+(checkpoint.awaitingMapClear?' · Map cleared':checkpoint.mode==='adventure'?' '+REALMS[realm].number+'-'+(checkpoint.realmStages?.[realm]||1):'')+(checkpoint.mode==='adventure'?' · '+checkpoint.shrines.length+'/'+REALMS.length+' seals':'')+' · '+formatTime(checkpoint.time);}
    $('start-button').classList.toggle('start-secondary',!!checkpoint);$('start-button').querySelector('span').textContent=(checkpoint?'New ': 'Begin ')+(selectedMode==='adventure'?'adventure':'survival');
    $('menu-headline').textContent=selectedMode==='adventure'?'Eight seals. One final battle.':'One map. Four minutes.';
    $('menu-intro').innerHTML=selectedMode==='adventure'?'Eight Zelda maps. Three levels each.<br>Defeat each landmark guardian to move onward.':'Pick one of eight maps.<br>Face Phantom Ganon without leaving it.';
    $('run-note').textContent=selectedMode==='adventure'?'Clear three levels, defeat the guardian, then review your results.':'Survive four minutes in '+REALMS[selectedSurvivalRealm].name+', then defeat Phantom Ganon.';
    $('hero-choice-label').textContent='Hero: '+HEROES[selectedHero].name;$('hero-perk').textContent=HEROES[selectedHero].perk;
    document.querySelectorAll('.hero-option').forEach(button=>{const selected=button.dataset.hero===selectedHero;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
    if(currentDialog()==='camp-dialog')renderCamp();if(currentDialog()==='heroes-dialog')renderHeroes();if(currentDialog()==='journal-dialog')renderJournal();
  }
  async function saveCheckpoint(force=false){
    while(force&&checkpointSaving)await checkpointSaving;
    if(!game||checkpointSaving||!game.canCheckpoint||(!force&&game.checkpointRevision===checkpointSavedRevision))return;
    const run=game,revision=run.checkpointRevision;
    const commit=profileTransaction(profile=>run.canCheckpoint?profile.saveCheckpoint(run):null)
      .then(saved=>{if(game===run&&saved!==null){checkpointSavedRevision=revision;$('checkpoint-indicator').textContent=saved?(storageAvailable?'Realm checkpoint saved':'Progress in memory'):'Checkpoint owned by another tab';}})
      .catch(error=>toast(error.message));
    checkpointSaving=commit;
    try{await commit;}finally{if(checkpointSaving===commit)checkpointSaving=null;}
  }
  function setupRun(run){
    closeAll();game=run;if(run.mode==='adventure')run.reviewMapClears=true;if(run.mode!=='training'){selectedHero=run.hero;selectedMode=run.mode;selectedDifficulty=run.difficulty;if(run.mode==='survival')selectedSurvivalRealm=run.realm;else selectedAdventureRealm=run.mapResult?.nextRealm??run.realm;}endingShown=false;endReadyAt=0;upgradeReadyAt=0;lastOutcome=null;banishMode=false;accumulator=0;loadoutKey='';checkpointSavedRevision=run.checkpointRevision;
    view.clearDynamic();if(run.landmark)view.buildLandmark(run.realm,run.stage,run.landmark);else view.buildRealm(run.realm,run.stage);view.makeHero(run.hero);view.applySettings();view.hero.visible=true;view.cameraTarget.set(0,.4,0);view.camera.position.set(15,20,15);view.lastPlayer={x:0,z:0};
    document.body.classList.add('playing');for(const id of ['menu','menu-footer','menu-landmark'])$(id).hidden=true;for(const id of ['hud','pause-button'])$(id).hidden=false;$('touch-controls').hidden=!touch;$('damage-flash').style.opacity=0;
    $('checkpoint-indicator').textContent=run.mode==='training'?'Training · never saved':'Checkpoint ready';updateHud();announce({...REALMS[run.realm],name:REALMS[run.realm].name+(run.mode==='adventure'?' '+run.stageLabel:'')});sound('choose');focusWorld();if(run.state==='upgrade')showUpgrade();else if(run.state==='map-clear')showMapClear();
    setTimeout(()=>{if(game===run&&run.state==='running')toast(run.mode==='training'?'Inventory opens your build and training controls.':run.mode==='adventure'?'Clear each level’s wave. The central shrine opens the next level.':touch?'Move with the stick. Weapons cast automatically.':'WASD moves. Weapons cast automatically.');},2300);
  }
  async function beginFresh(expectedCheckpointId=null){
    if(profileBusy)return;profileBusy=true;
    try{
      const runId=globalThis.crypto?.randomUUID?crypto.randomUUID():'run-'+Date.now()+'-'+Math.floor(Math.random()*1e6);
      const hero=selectedHero,mode=selectedMode,difficulty=selectedDifficulty,realm=selectedSurvivalRealm;let run;
      await profileTransaction(profile=>{run=new Game(hero,Date.now(),{mode,difficulty,...(mode==='survival'?{realm}:{reviewMapClears:true}),upgrades:profile.upgrades,runId});return profile.beginRun(run,expectedCheckpointId);});setupRun(run);
    }catch(error){toast(error.message);updateProfileUI();}finally{profileBusy=false;}
  }
  function requestStart(){
    if(!storage.unlocked.includes(selectedHero))selectedHero='link';
    if(storage.checkpoint){pendingStart=storage.checkpoint.runId;$('new-run-description').textContent='Saved: '+HEROES[storage.checkpoint.hero].name+' in '+REALMS[storage.checkpoint.realm].name+'. A new run replaces this checkpoint. Your rupees and permanent progress stay.';openDialog('new-run-dialog');}
    else beginFresh();
  }
  function continueRun(){try{storage=readProfile();setupRun(storage.resume());}catch(error){toast(error.message);}}
  async function home(){
    await saveCheckpoint(true);closeAll();game=null;view.clearDynamic();if(!storage.unlocked.includes(selectedHero))selectedHero='link';previewSelectedRealm();view.makeHero(selectedHero);
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
    const root=$('realm-map'),adventure=(game?.mode||selectedMode)==='adventure';root.textContent='';
    $('map-adventure-legend').hidden=!adventure;$('map-current-legend').hidden=!game;
    for(const [routeIndex,index] of ADVENTURE_ROUTE.entries()){
      const realm=REALMS[index],button=document.createElement('button'),stage=game?.realmStages[index]||1;button.className='realm-node'+(game?.realm===index?' current':'');button.style.setProperty('--realm-color',realm.color);
      const sealed=adventure&&game?.shrines.has(index),status=game?.realm===index?'YOU ARE HERE':sealed?'MAP CLEARED':adventure&&game?'LOCKED':realm.origin;
      const landmark=GUARDIAN_LANDMARKS[index],thirdCleared=game?.stageKills[index]>=STAGE_TARGETS[2],bossStatus=sealed?'Defeated':game?.realm===index&&game.landmark&&game.boss?'In battle':stage===3&&thirdCleared?'Next encounter':'After '+realm.number+'-3';
      button.innerHTML='<span class="realm-orb">'+icon(realmIcons[index])+'</span><b>'+realm.name+'</b><small>'+status+'</small>'+(adventure?'<span class="map-levels">'+[1,2,3].map(level=>'<i class="'+(sealed||stage>level||level===3&&thirdCleared?'complete':stage===level&&game?.realm===index?'active':'')+'">'+realm.number+'-'+level+'</i>').join('')+'</span><small>Guardian: '+BOSSES[realm.boss].name+'<br>'+bossStatus+'</small>':'<small>'+realm.landmark+'</small>');
      button.setAttribute('aria-label',realm.name+(adventure?', levels '+realm.number+'-1 through '+realm.number+'-3, guardian '+BOSSES[realm.boss].name+' at '+landmark.name+', '+bossStatus:'')+', '+status);
      button.addEventListener('click',()=>{
        if(!game)previewRealm(index);
        $('map-description').textContent=realm.name+' · Seen in '+realm.origin;
        const info='Landmark: '+realm.landmark+'. Enemies: '+realm.enemies.map(id=>ENEMIES[id].name).join(', ')+'.';
        const next=REALMS[ADVENTURE_ROUTE[routeIndex+1]]?.name||'Ganondorf in Hyrule Field';
        $('map-realm-info').textContent=info+(adventure?' Guardian: '+BOSSES[realm.boss].name+' at '+landmark.name+'. After victory: '+next+'.':'');
      });root.appendChild(button);
    }
    $('map-shrine-status').textContent=adventure?(game?game.shrines.size+' / '+REALMS.length+' seals restored':'24 levels across eight separate maps.'):'Eight separate arenas';
  }
  function openMap(){
    if(game&&!['running','paused'].includes(game.state))return;
    const adventure=(game?.mode||selectedMode)==='adventure';buildMap();
    $('map-description').textContent=adventure?'Clear three levels and the guardian on each map. Review your results after each guardian, then choose when to continue.':'Eight separate realms. Each Survival run stays on its chosen map.';
    $('map-realm-info').textContent=game?'Select a realm to read about it.':'Select a realm to preview it.';openDialog('map-dialog');
  }
  function showUpgrade(){
    if(game?.state!=='upgrade')return;$('upgrade-level').textContent='Level '+game.level+' · Weapons '+game.slotCount('WEAPON')+'/'+game.weaponSlots+' · Charms '+game.slotCount('CHARM')+'/'+game.charmSlots;$('upgrade-options').textContent='';
    game.choices.forEach((upgrade,i)=>{const rank=game.rank(upgrade.id),rarity=Combat.RARITIES[upgrade.rarity??0],weaponUpgrade=upgrade.category==='WEAPON'&&rank>0,button=document.createElement('button');button.className='upgrade-choice';button.innerHTML=icon(upgrade.icon)+'<kbd>'+(i+1)+'</kbd><span class="upgrade-kind">'+(weaponUpgrade?rarity.name+' upgrade':!game.learnedRank(upgrade.id)?'NEW '+upgrade.category:upgrade.category)+'</span><h3>'+(upgrade.category==='WEAPON'?game.weaponName(upgrade.id):upgrade.name)+'</h3><p>'+game.upgradeSummary(upgrade.id)+'</p><span class="rank">'+(upgrade.id==='feast'?'RESTORE HEALTH':(rank?'LEVEL '+rank+' → '+(rank+1):'LEVEL 1')+' / '+game.rankLimit(upgrade.id))+'</span>';button.addEventListener('click',()=>chooseUpgrade(upgrade.id));$('upgrade-options').appendChild(button);});
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
    const unlockedIds=new Set(storage.unlocked);
    $('hero-roster').textContent='';$('oot-hero-roster').textContent='';
    $('heroes-description').textContent=unlockedIds.size+' / '+Object.keys(HEROES).length+' heroes unlocked. Defeat guardians in Adventure to grow your roster, or try anyone in Training Grounds.';
    for(const [id,hero] of Object.entries(HEROES)){
      const unlocked=unlockedIds.has(id),selected=unlocked&&id===selectedHero,button=document.createElement('button');
      button.type='button';button.className='roster-card'+(selected?' selected':'')+(!unlocked?' locked':'');
      button.dataset.rosterHero=id;button.setAttribute('aria-disabled',String(!unlocked));button.setAttribute('aria-pressed',String(selected));
      button.innerHTML='<img alt="" src="'+artURL('hero',id)+'"><strong>'+hero.name+'</strong><span>'+hero.title+'</span><small>'+hero.hp+' HP · '+hero.speed+' speed</small><p>'+hero.perk+'</p><small class="hero-special-name">'+(hero.sceneOnly?'Story action: ':'Ultimate: ')+hero.ultimateName.replace(/ · Scene$/,'')+'</small><small class="hero-special-detail">'+hero.ultimateDetail+'</small><b>'+(selected?'Selected':unlocked?'Choose hero':hero.unlockText)+'</b>';
      button.addEventListener('click',()=>selectHero(id));$(hero.ootAlly?'oot-hero-roster':'hero-roster').appendChild(button);
    }
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
    const entries=Object.entries(HEROES),options=entries=>entries.map(([id,hero])=>'<option value="'+id+'">'+hero.name+'</option>').join('');
    $('training-hero').innerHTML='<optgroup label="Original roster">'+options(entries.filter(([,hero])=>!hero.ootAlly))+'</optgroup><optgroup label="Ocarina of Time allies">'+options(entries.filter(([,hero])=>hero.ootAlly))+'</optgroup>';
    $('training-hero').value=game.hero;$('training-starter-note').textContent='Starter: '+game.weaponName(HEROES[game.hero].weapon)+'. Load it to reset the pending kit.';

    $('training-realm').innerHTML=REALMS.map((realm,index)=>'<option value="'+index+'">'+realm.name+'</option>').join('');$('training-realm').value=game.realm;$('training-stage').value=game.stage;$('training-level').value=game.level;$('training-invulnerable').checked=game.training.invulnerable;
    $('training-ranks').textContent='';for(const item of UPGRADES){const label=document.createElement('label'),input=document.createElement('input');const caption=document.createElement('span');caption.dataset.trainingName=item.id;caption.textContent=item.category==='WEAPON'?game.weaponName(item.id):item.name;label.appendChild(caption);input.type='number';input.min=0;input.max=game.rankLimit(item.id);input.step=1;input.required=true;input.value=game.rank(item.id);input.dataset.trainingRank=item.id;input.setAttribute('aria-label',caption.textContent+' level');label.appendChild(input);if(item.category==='WEAPON'){const rarity=document.createElement('select');rarity.dataset.trainingRarity=item.id;rarity.setAttribute('aria-label',caption.textContent+' upgrade rarity');rarity.innerHTML=Combat.RARITIES.map((item,index)=>'<option value="'+index+'">'+item.name+'</option>').join('');rarity.value=game.weaponUpgrades[item.id]?.at(-1)??0;label.appendChild(rarity);}$('training-ranks').appendChild(label);}
    $('training-gear').innerHTML=Combat.GEAR.map(item=>'<option value="'+item.id+'">'+item.name+'</option>').join('');$('training-stacks').max=Combat.item($('training-gear').value).max;$('training-stacks').value=game.gear[$('training-gear').value]||1;$('training-status').textContent='World paused. Spawn a rival, then choose To training.';openDialog('training-dialog');
  }
  function stageTrainingStarter(){
    const id=$('training-hero').value;
    if(game?.mode!=='training'||!Object.hasOwn(HEROES,id))return;
    const hero=HEROES[id],base=UPGRADES.find(item=>item.id===hero.weapon),starter=hero.starterName||base.name;
    for(const input of document.querySelectorAll('[data-training-rank]')){
      const itemId=input.dataset.trainingRank;
      const caption=UPGRADES.find(item=>item.id===itemId)?.name||itemId,name=itemId===hero.weapon?starter:caption;
      input.value=itemId===hero.weapon?Math.min(8,Number(input.max)):0;
      input.setAttribute('aria-label',name+' level');
      const label=input.parentElement?.querySelector('[data-training-name]');if(label)label.textContent=name;
    }
    for(const select of document.querySelectorAll('[data-training-rarity]')){
      const itemId=select.dataset.trainingRarity,name=itemId===hero.weapon?starter:UPGRADES.find(item=>item.id===itemId)?.name||itemId;
      select.value='0';select.setAttribute('aria-label',name+' upgrade rarity');
    }
    $('training-starter-note').textContent='Staged: '+starter+' at level 8. Apply build to equip it.';
    $('training-status').textContent='Starter kit selected. Apply build before spawning rivals.';
  }
  function applyTraining(event){
    event.preventDefault();if(game?.mode!=='training'||!$('training-form').reportValidity())return;
    const ranks=Object.fromEntries([...document.querySelectorAll('[data-training-rank]')].map(input=>[input.dataset.trainingRank,Number(input.value)]));
    const rarities=Object.fromEntries([...document.querySelectorAll('[data-training-rarity]')].map(input=>[input.dataset.trainingRarity,Number(input.value)]));
    if(!game.setTrainingBuild(ranks,game.gear,rarities)){$('training-status').textContent='Use up to four weapons and five charms. Remove another rank before adding a new one.';return;}
    game.configureTraining({hero:$('training-hero').value,realm:Number($('training-realm').value),stage:Number($('training-stage').value),level:Number($('training-level').value),invulnerable:$('training-invulnerable').checked});
    view.clearDynamic();view.makeHero(game.hero);loadoutKey='';updateHud();$('training-starter-note').textContent='Starter: '+game.weaponName(HEROES[game.hero].weapon)+'. Load it to reset the pending kit.';$('training-status').textContent='Build applied. Arena cleared. Spawn a rival to test it.';
  }
  function renderInventory(){
    if(!game)return;$('training-controls-button').hidden=game.mode!=='training';const p=game.player,s=game.stats,percent=value=>(value*100).toFixed(0)+'%';
    const entries=[['Health',Math.ceil(p.hp)+' / '+Math.ceil(p.maxHp)],['Level',game.level],['Seals',game.shrines.size+' / '+REALMS.length],['Physical damage',percent(game.damageMultiplier*s.physical)],['Magic damage',percent(game.damageMultiplier*s.magic)],['Critical chance',percent(s.critChance)],['Critical damage',percent(s.critDamage)],['Armor',s.armor.toFixed(1)],['Evasion',percent(s.evasion)],['Regeneration',((game.rank('regen')+s.regen)*s.healing).toFixed(1)+'/s'],['Lifesteal',percent(s.lifesteal)],['XP gain',percent(s.xpGain)]];
    $('inventory-stats').textContent='';for(const [label,value]of entries){const cell=document.createElement('span'),bold=document.createElement('b');bold.textContent=value;cell.append(bold,document.createTextNode(label));$('inventory-stats').appendChild(cell);}
    $('inventory-slots').textContent='Weapons '+game.slotCount('WEAPON')+' / '+game.weaponSlots+' · Charms '+game.slotCount('CHARM')+' / '+game.charmSlots+'. '+(game.mode==='training'?'All slots unlocked in training.': 'Unlock a fourth weapon and up to five charms at the Great Fairy camp for new runs.');
    $('inventory-items').textContent='';
    for(const item of UPGRADES)if(game.rank(item.id)){const row=document.createElement('div');row.className='journal-row';row.innerHTML=icon(item.icon)+'<div><strong>'+(item.category==='WEAPON'?game.weaponName(item.id):item.name)+' · Level '+game.learnedRank(item.id)+' / '+(game.rankLimit(item.id)-game.shrineRanks(item.id))+(game.shrineRanks(item.id)?' + '+game.shrineRanks(item.id)+' shrine bonus':'')+'</strong><small>'+(item.category==='WEAPON'?game.weaponSummary(item.id):item.desc)+'</small></div>';$('inventory-items').appendChild(row);}
    $('inventory-gear').textContent='';const equipment=Combat.GEAR.filter(item=>game.gear[item.id]);
    $('inventory-loot-note').textContent=equipment.length?'Each stack applies its listed effect. Status chances cap at 80%.':'Elites and every twentieth enemy drop treasure. Walk over a chest to collect equipment.';
    for(const item of equipment){const row=document.createElement('div');row.className='journal-row';row.innerHTML=icon(item.icon)+'<div><strong>'+item.name+' ×'+game.gear[item.id]+'</strong><small>'+item.desc+' · '+item.origin+'</small></div><span>'+Combat.RARITIES[item.rarity].name+'<br>'+game.gear[item.id]+' / '+item.max+'</span>';$('inventory-gear').appendChild(row);}
    $('inventory-damage').textContent='';const sources=Object.entries(game.damageBySource).sort((a,b)=>b[1]-a[1]);
    if(!sources.length)$('inventory-damage').textContent='Damage from weapons, treasure effects, and reactions appears here.';
    for(const [id,value]of sources){const row=document.createElement('div');row.className='damage-source';const label=document.createElement('span'),amount=document.createElement('b'),meter=document.createElement('meter');
      label.textContent=(Object.hasOwn(Combat.WEAPONS,id)?game.weaponName(id):UPGRADES.find(item=>item.id===id)?.name)||Combat.item(id)?.name||({ultimate:HEROES[game.hero].ultimateName,shrine:'Shrine blessing',companion:'Ally support',reaction:'Elemental reactions',thorns:'Reflected damage',other:'Other damage'})[id]||id;
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
    if(!game.landmark&&(!game.shrines.has(game.realm)||(game.mode==='adventure'&&game.realm===0&&game.shrines.size===REALMS.length)))point(0,-7,'#edcd6a',5);
    c.translate(center,center);c.rotate(-view.yaw);c.fillStyle='#fff8e3';c.beginPath();c.moveTo(0,-7);c.lineTo(5,6);c.lineTo(0,3);c.lineTo(-5,6);c.closePath();c.fill();c.restore();c.strokeStyle='#fff7dc';c.lineWidth=6;c.beginPath();c.arc(center,center,105,0,Math.PI*2);c.stroke();c.fillStyle='#fff7dc';c.font='900 11px Nunito,sans-serif';c.textAlign='center';c.fillText('N',110,18);
  }
  function updateHud(){
    if(!game)return;const p=game.player,hero=HEROES[game.hero];$('hero-name').textContent=hero.name;$('hero-title').textContent=hero.title;$('hero-portrait').src=artURL('hero',game.hero);$('health-text').textContent=Math.ceil(p.hp)+' / '+Math.ceil(p.maxHp);$('health-fill').style.width=p.hp/p.maxHp*100+'%';$('stamina-fill').style.width=p.stamina*100+'%';$('timer').textContent=formatTime(game.time);$('kills').textContent=game.kills;$('realm-name').textContent=game.landmark?.name||(REALMS[game.realm].name+(game.mode==='adventure'?(game.boss?' · Final boss':' '+game.stageLabel):''));$('shrines-count').textContent=game.mode==='adventure'?game.shrines.size+' / '+REALMS.length+' seals':game.mode==='survival'?(game.shrines.has(game.realm)?'Shrine claimed':'Shrine available'):'Practice';$('xp-fill').style.width=Math.min(100,game.xp/game.xpNeed*100)+'%';$('level-label').textContent='LV. '+game.level;$('xp-label').textContent=game.mode==='training'?'PRACTICE':Math.floor(game.xp)+' / '+game.xpNeed;
    $('objective').textContent=game.mode==='training'?'TRAINING · NO PROGRESS SAVED':game.boss?'DEFEAT '+game.boss.name.toUpperCase():game.mode==='adventure'?game.shrines.has(game.realm)?'MAP CLEARED · NEXT MAP':game.stage===3&&game.stageReady?'LEVEL CLEARED · LANDMARK NEXT':'LEVEL '+game.stageLabel+' · '+Math.min(game.stageTarget,game.stageKills[game.realm])+'/'+game.stageTarget+' ENEMIES':'PHANTOM GANON AT 4:00';
    $('dash-label').textContent=p.dashCooldown>0?'Dash '+p.dashCooldown.toFixed(1)+'s':'Dash ready';$('touch-dash').style.opacity=p.dashCooldown>0?'.5':'1';$('boss-hud').hidden=!game.boss||game.boss.dead;
    const cue=$('boss-attack-cue'),cueVisible=!!(game.boss&&!game.boss.dead&&game.time<bossCueUntil);cue.hidden=!cueVisible;if(cueVisible&&cue.textContent!==bossCue)cue.textContent=bossCue;
    if(game.boss){$('boss-name').textContent=game.boss.name.toUpperCase();$('boss-phase').textContent='PHASE '+game.boss.stage;$('boss-fill').style.width=Math.max(0,game.boss.hp/game.boss.maxHp*100)+'%';}
    const nearby=game.interaction;$('interaction').hidden=!nearby||game.state!=='running';if(nearby)$('interaction-label').textContent=nearby.kind==='stage'?nearby.name:'Recover '+nearby.name;
    const key=JSON.stringify(game.ranks);if(key!==loadoutKey){loadoutKey=key;$('loadout').textContent='';const equipped=UPGRADES.filter(item=>item.category==='WEAPON'&&game.rank(item.id));$('hud').style.setProperty('--weapon-count',equipped.length);for(const item of equipped){const el=document.createElement('div');el.className='weapon-slot';const name=game.weaponName(item.id);el.title=name+' · Rank '+game.rank(item.id);el.setAttribute('aria-label',el.title);el.innerHTML=icon(item.icon)+'<strong>'+name+'</strong><small>LV. '+game.rank(item.id)+'</small>';$('loadout').appendChild(el);}}
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
    $('end-stats').innerHTML='<div><strong>'+formatTime(game.time)+'</strong><span>TIME</span></div><div><strong>'+game.kills+'</strong><span>DEFEATED</span></div><div><strong>'+(game.mode==='survival'?(game.shrines.has(game.realm)?'1/1':'0/1'):game.shrines.size+'/'+REALMS.length)+'</strong><span>'+(game.mode==='survival'?'SHRINE':'SEALS')+'</span></div><div><strong>+'+result.reward+'</strong><span>RUPEES</span></div>';$('end-record').textContent='Level '+game.level+' · '+Math.round(game.damageDealt).toLocaleString()+' damage · '+storage.rupees+' rupees in your wallet';$('end-unlocks').textContent=result.unlocks?.length?'Unlocked: '+result.unlocks.map(id=>HEROES[id].name).join(', '):'';openDialog('end-dialog');
  }
  function showMapClear(){
    const result=game?.mapResult;
    if(game?.state!=='map-clear'||!result||currentDialog()==='map-clear-dialog')return;
    const realm=REALMS[result.realm],guardian=BOSSES[realm.boss];
    $('map-clear-title').textContent=realm.name+' cleared.';
    $('map-clear-subtitle').textContent=guardian.name+' defeated at '+GUARDIAN_LANDMARKS[result.realm].name+'.';
    $('map-clear-time').textContent=formatTime(result.time);
    $('map-clear-kills').textContent=result.kills.toLocaleString();
    $('map-clear-damage').textContent=Math.round(result.damageDealt).toLocaleString();
    $('map-clear-damage-taken').textContent=Math.round(result.damageTaken).toLocaleString();
    $('map-clear-next-name').textContent=result.nextIsFinal?'Ganondorf · Hyrule Field':REALMS[result.nextRealm].name;
    const recruits=Object.values(HEROES).filter(hero=>hero.unlockBoss===realm.boss).map(hero=>hero.name);
    const companion=result.companion&&HEROES[result.companion];
    const recruit=$('map-clear-recruit');recruit.hidden=!companion&&!recruits.length;
    recruit.textContent=companion?companion.name+' joined your party and is available for new runs.':recruits.length?'Roster reward: '+recruits.join(' and ')+' available for new runs.':'';
    $('map-clear-status').textContent='Continue now or come back to this checkpoint.';
    $('touch-controls').hidden=true;closeAll();openDialog('map-clear-dialog');saveCheckpoint();
  }
  async function chooseMapResult(action){
    if(mapActionBusy||game?.state!=='map-clear')return;
    mapActionBusy=true;$('map-clear-continue').disabled=$('map-clear-home').disabled=true;
    try{
      if(action==='home'){
        selectedAdventureRealm=game.mapResult.nextRealm??0;
        await home();
      }else if(game.continueAfterMap()){
        selectedAdventureRealm=game.realm;
        closeAll();$('touch-controls').hidden=!touch;focusWorld();await saveCheckpoint(true);
      }
    }catch(error){$('map-clear-status').textContent=error.message;}
    finally{mapActionBusy=false;$('map-clear-continue').disabled=$('map-clear-home').disabled=false;}
  }
  function handleEvents(){
    if(!game)return;let collectPlayed=false,popPlayed=false;
    for(const event of game.drainEvents()){
      if(event.type==='hit'){view.damageText(event.x,event.z,event.damage,event.critical);continue;}
      if(event.type==='shoot'&&event.swordWave){view.swordWaveRelease(event);sound('shoot');continue;}
      if(event.type==='shadowStrike'){view.shadowStrikeEffect(event);sound('shadowStrike');continue;}
      if(event.type==='enemyStrike'){view.enemyStrikeEffect(event);continue;}
      if(event.type==='allyStrike'||event.type==='companionStrike'){
        view.allyPulse(event);
        if(event.impactSize){
          const forwardX=Math.sin(event.facing),forwardZ=Math.cos(event.facing);
          const reach=clamp(((event.targetX-event.x)*forwardX+(event.targetZ-event.z)*forwardZ),.65,1.9);
          view.groundCrack({x:event.x+forwardX*reach,z:event.z+forwardZ*reach,impactSize:event.impactSize,style:'hammer'},.22);
        }
        if(event.type==='allyStrike')sound(event.kind==='hammer'?'slam':event.kind==='rutoWave'||event.kind==='fairy'?'leaf':'shoot');
        continue;
      }
      if(event.type==='companionJoin'){toast(HEROES[event.hero].name+' joined your party.');continue;}
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
      if(event.type==='travel'){view.clearDynamic();view.buildRealm(event.realm,game.stage);view.cameraTarget.set(0,.4,0);view.camera.position.set(15,20,15);announce({name:REALMS[event.realm].name+(game.mode==='adventure'&&game.shrines.size<REALMS.length?' '+game.stageLabel:''),subtitle:game.mode==='adventure'?(game.shrines.size===REALMS.length?'The final battle with Ganondorf.':'Three levels, then this map’s final boss.'):REALMS[event.realm].subtitle});loadoutKey='';}
      if(event.type==='shrine')toast(REALMS[event.realm].blessing+' · '+REALMS[event.realm].benefit);
      if(event.type==='guardian'){
        upgradeReadyAt=titleTime+.85;sound('guardian');announce({name:REALMS[event.realm].name+' cleared',subtitle:event.name+' defeated. Next: '+REALMS[event.nextRealm].name+'.'});toast('Seal '+game.shrines.size+'/'+REALMS.length+' · rewards carry into the next encounter.');
        profileTransaction(profile=>profile.recordGuardian(event.id)).then(unlocks=>{if(unlocks.length)setTimeout(()=>toast(unlocks.map(id=>HEROES[id].name).join(', ')+' unlocked!'),1800);}).catch(error=>toast(error.message));
      }
      if(event.type==='elite')toast('Elite '+event.name+' has entered the map.');
      if(event.type==='stageClear'){sound('guardian');toast('Level '+event.label+' cleared. '+(event.stage===3?'The guardian’s landmark awaits.':'Reach the central shrine for the next level.'));}
      if(event.type==='stage'){$('toast').classList.remove('visible');clearTimeout(toastTimer);view.clearDynamic();announce({name:REALMS[event.realm].name+' '+event.label,subtitle:event.stage===3?'Clear 24 enemies to reach the guardian’s landmark.':'Clear the wave, then reach the central shrine.'});}
      if(event.type==='boss'){bossCueUntil=0;if(game.landmark){view.cameraTarget.set(game.player.x,.4,game.player.z);view.camera.position.set(game.player.x+13,20,game.player.z+13);view.yaw=Math.PI/4;announce({name:game.landmark.name,subtitle:event.name+' · '+game.landmark.subtitle,landmark:true});}else announce({name:event.name,subtitle:game.mode==='adventure'?(event.id==='ganondorf'?'Final battle · restore the realms':'Three levels cleared · map final boss'):'Watch the wind-up. Dodge the warning circles.'});view.shake=reducedMotion?0:.5;}
      if(event.type==='warning'&&game.boss){
        bossCue=event.label||({charge:'Charge',volley:'Volley',summon:'Summon',slam:'Ground slam',teleport:'Teleport'}[event.kind]||'Guard up');
        bossCueUntil=game.time+Math.max(1.15,(game.boss.actionDuration||0)+.23);
      }
      if(event.type==='bossPhase'){toast(event.name+' · Phase '+event.stage);view.ringEffect(event.x,event.z,BOSSES[event.id].color,4,.65);}
      if(event.type==='level')upgradeReadyAt=Math.max(upgradeReadyAt,titleTime+.12);
      if(event.type==='groundImpact'){
        view.groundCrack(event);
        if(event.style==='moonCrash'){
          view.moonImpact({...event,radius:HEROES.skullkid.ultimateRadius});
          view.moonFlash={at:titleTime,x:event.x,z:event.z};
          view.shake=reducedMotion?0:.72;sound('moonImpact');
        }else sound('slam');
        continue;
      }
      if(event.impactSize&&(event.type==='slam'||event.type==='explosion'))view.groundCrack(event);
      if(event.type==='goronImpact'){
        view.groundCrack({...event,style:'goronSlam'});
        view.ultimateEffect({...event,phaseStyle:'goronSlam'});sound('slam');continue;
      }
      if(event.type==='ultimate'){
        view.ultimateEffect(event,game.time,game.player);toast(event.name+'!');
        sound(event.sceneOnly?'shrine':event.phaseStyle==='waterGun'?'shoot':event.phaseStyle==='goronSlam'?'jump':event.phaseStyle==='moonCrash'?'warning':'nova');continue;
      }
      if(event.type==='end'){prepareOutcome(game);endReadyAt=titleTime+(event.won?1.2:view.heroDefeatSpec(game.hero)?.time??2.35);sound(event.won?'victory':'end');}
      else sound(event.type);
    }
    if(game.state==='upgrade'&&titleTime>=upgradeReadyAt&&!currentDialog())showUpgrade();
    if(game.state==='map-clear'&&!mapActionBusy)showMapClear();
    if(['won','lost'].includes(game.state)&&!endingShown){
      const loss=game.state==='lost',wait=loss?(view.heroDefeatSpec(game.hero)?.time??2.35):1.2;
      if(!endReadyAt){prepareOutcome(game);endReadyAt=titleTime+wait;}
      if(titleTime>=endReadyAt&&(!loss||(view.terminalAge||0)>=wait)&&!lastOutcome?.pending)showEnd();
    }
  }
  function held(action,alternate){return keys.has(storage.bindings[action])||(!Object.values(storage.bindings).includes(alternate)&&keys.has(alternate));}
  function frame(ms){
    requestAnimationFrame(frame);const elapsed=Math.min((ms-lastTime)/1000||.016,.25),dt=Math.min(elapsed,.05);lastTime=ms;titleTime+=elapsed;
    if(game){
      if(game.state==='running'&&!currentDialog()&&mouseEdgeX!==null&&document.pointerLockElement!==$('world'))view.yaw=BonkCamera.wrap(view.yaw+BonkCamera.edgeTurn(mouseEdgeX,innerWidth,elapsed,storage.sensitivity));
      const input={cameraYaw:view.yaw,x:(held('right','ArrowRight')?1:0)-(held('left','ArrowLeft')?1:0)+stick.x,y:(held('up','ArrowUp')?1:0)-(held('down','ArrowDown')?1:0)-stick.y,glide:keys.has(storage.bindings.jump)||touchGlide};
      if(game.state==='running'){accumulator+=elapsed;while(accumulator>=.02&&game.state==='running'){game.step(.02,input);accumulator-=.02;}}else accumulator=0;
      handleEvents();hudTime+=elapsed;if(hudTime>.08){updateHud();saveCheckpoint();hudTime=0;}const flash=Number($('damage-flash').style.opacity)||0;if(flash>0)$('damage-flash').style.opacity=Math.max(0,flash-elapsed*2.7);
    }
    view.render(game,dt,titleTime);
    const burst=view.moonFlash,overlay=$('moon-flash');
    if(overlay){
      const age=burst?titleTime-burst.at:Infinity;
      if(game&&burst&&age<.20){
        const hit=new THREE.Vector3(burst.x,view.groundHeight(burst.x,burst.z)+.7,burst.z).project(view.camera);
        overlay.style.setProperty('--flare-x',clamp((hit.x*.5+.5)*100,0,100)+'%');
        overlay.style.setProperty('--flare-y',clamp((.5-hit.y*.5)*100,0,100)+'%');
        overlay.style.opacity=view.moonFlashOpacity(age);
      }else if(burst){overlay.style.opacity=0;view.moonFlash=null;}
    }
  }
  function applyPreferences(){mouseEdgeX=null;soundEnabled=storage.sound;reducedMotion=systemMotion.matches||storage.motion==='reduced';updateSoundButton();view?.applySettings();updateControlHints();}
  const keyName=code=>code==='ShiftLeft'||code==='ShiftRight'?'Shift':code.replace(/^(Key|Digit|Arrow)/,'');
  function updateControlHints(){
    const b=storage.bindings;$('ultimate-button').querySelector('.ultimate-symbol').textContent=keyName(b.ultimate);$('interaction').querySelector('kbd').textContent=keyName(b.interact);$('map-button').querySelector('kbd').textContent=keyName(b.map);
    document.querySelector('.dash-status kbd').textContent=keyName(b.dash);
    document.querySelector('.desktop-controls').innerHTML='<span><kbd>'+[b.up,b.left,b.down,b.right].map(keyName).join(' ')+'</kbd> Move</span><span><kbd>'+keyName(b.jump)+'</kbd> Jump · hold to slow descent</span><span><kbd>'+keyName(b.interact)+'</kbd> Interact</span><span><kbd>'+keyName(b.inventory)+'</kbd> Inventory</span><span>Mouse to look · Wheel to zoom</span>';
  }
  function renderBindings(){
    const labels={up:'Forward',down:'Back',left:'Left',right:'Right',jump:'Jump / slow descent',dash:'Dash',ultimate:'Ultimate',interact:'Interact',map:'Map',inventory:'Inventory',aim:'Aim mode',pause:'Pause'};const root=$('key-bindings');root.textContent='';
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
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{if(selectedMode===button.dataset.mode)return;selectedMode=button.dataset.mode;previewSelectedRealm();updateProfileUI();}));
  $('difficulty').addEventListener('change',event=>selectedDifficulty=event.target.value==='hard'?'hard':'normal');
  $('realm-picker').addEventListener('change',event=>{
    const index=Number(event.target.value);if(!REALMS[index])return;
    if(selectedMode==='survival')selectedSurvivalRealm=index;else selectedAdventureRealm=index;
    previewSelectedRealm();updateProfileUI();
  });
  $('map-clear-continue').addEventListener('click',()=>chooseMapResult('continue'));
  $('map-clear-home').addEventListener('click',()=>chooseMapResult('home'));
  $('heroes-button').addEventListener('click',openHeroes);$('camp-button').addEventListener('click',openCamp);$('journal-button').addEventListener('click',openJournal);$('credits-button').addEventListener('click',()=>openDialog('credits-dialog'));document.querySelectorAll('[data-journal]').forEach(button=>button.addEventListener('click',()=>{journalTab=button.dataset.journal;renderJournal();}));
  $('map-button').addEventListener('click',openMap);$('pause-map-button').addEventListener('click',openMap);$('world-preview-button').addEventListener('click',openMap);$('inventory-button').addEventListener('click',openInventory);$('help-button').addEventListener('click',()=>openDialog('help-dialog'));$('help-done').addEventListener('click',closeDialog);$('settings-button').addEventListener('click',openSettings);$('pause-settings-button').addEventListener('click',openSettings);
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',closeDialog));
  $('training-button').addEventListener('click',beginTraining);$('training-controls-button').addEventListener('click',openTraining);$('training-form').addEventListener('submit',applyTraining);$('training-hero').addEventListener('change',stageTrainingStarter);$('training-load-starter').addEventListener('click',stageTrainingStarter);
  $('training-resume').addEventListener('click',()=>{if(game?.mode!=='training')return;closeAll();game.resume();focusWorld();});
  $('training-gear').addEventListener('change',()=>{const item=Combat.item($('training-gear').value);$('training-stacks').max=item.max;$('training-stacks').value=game?.gear[item.id]||1;});
  $('training-add-gear').addEventListener('click',()=>{if(game?.mode!=='training'||!$('training-stacks').reportValidity())return;const id=$('training-gear').value,count=Number($('training-stacks').value),gear={...game.gear};if(count)gear[id]=count;else delete gear[id];if(game.setTrainingBuild(game.ranks,gear)){document.querySelectorAll('[data-training-rank]').forEach(input=>input.max=game.rankLimit(input.dataset.trainingRank));$('training-status').textContent='Treasure updated. Weapon cap '+(gear.adventurepouch?10:8)+'; charm cap '+(gear.greenpotion?12:10)+'.';updateHud();}else $('training-status').textContent='Keep treasure within its stack limit. Lower weapon or charm levels before removing a cap-extending treasure.';});
  $('training-spawn').addEventListener('click',()=>{if(game?.mode!=='training')return;$('training-status').textContent=game.spawnTrainingRivals($('training-rival').value)?'Rivals ready. Choose To training to resume.':'Clear the current guardian or some rivals before spawning more.';});
  $('training-reset').addEventListener('click',()=>{if(game?.resetTraining()){$('training-status').textContent='Arena and damage totals cleared. Build kept.';updateHud();}});
  $('sound-button').addEventListener('click',async()=>{await setPreference('sound',!soundEnabled);sound('choose');});$('sound-setting').addEventListener('change',event=>setPreference('sound',event.target.checked));$('volume-setting').addEventListener('input',event=>{const value=Number(event.target.value);if(Number.isFinite(value))setPreference('volume',clamp(value,0,1));});$('motion-setting').addEventListener('change',event=>setPreference('motion',event.target.value==='reduced'?'reduced':'system'));systemMotion.addEventListener('change',applyPreferences);
  $('graphics-setting').addEventListener('change',event=>setPreference('graphics',event.target.value));$('mouse-mode-setting').addEventListener('change',event=>setPreference('mouseMode',event.target.value));$('sensitivity-setting').addEventListener('input',event=>{const value=Number(event.target.value);$('sensitivity-value').textContent=value.toFixed(1)+'×';setPreference('sensitivity',value);});$('invert-setting').addEventListener('change',event=>setPreference('invertY',event.target.checked));$('fov-setting').addEventListener('input',event=>{const value=Number(event.target.value);$('fov-value').textContent=value+'°';setPreference('cameraFov',value);});$('distance-setting').addEventListener('input',event=>{const value=Number(event.target.value);$('distance-value').textContent=value;setPreference('cameraDistance',value);});
  $('reset-controls-button').addEventListener('click',()=>{pendingBinding=null;setPreference('bindings',{...DEFAULT_BINDINGS}).then(()=>{renderBindings();$('binding-status').textContent='Default keys restored.';});});
  $('reset-camera-button').addEventListener('click',async()=>{await profileTransaction(profile=>{profile.sensitivity=1;profile.invertY=false;profile.cameraFov=50;profile.cameraDistance=30;});mouseEdgeX=null;view.yaw=Math.PI/4;view.pitch=.78;applyPreferences();openSettings();});
  $('fullscreen-button').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(_){toast('Fullscreen is unavailable in this browser.');}});
  $('export-button').addEventListener('click',exportProfile);$('import-button').addEventListener('click',()=>{if(!game)$('import-file').click();});$('import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>250000)throw new Error('Choose a save smaller than 250 KB.');pendingImport=Profile.import(await file.text());pendingImportFingerprint=JSON.stringify(readProfile());openDialog('import-dialog');}catch(error){toast(error.message);}finally{event.target.value='';}});$('confirm-import').addEventListener('click',importProfile);
  $('interact-button').addEventListener('click',()=>{if(game&&!game.interact()&&game.interaction?.blockedReason)toast(game.interaction.blockedReason);focusWorld();});$('ultimate-button').addEventListener('click',()=>{game?.ultimate();focusWorld();});$('aim-button').addEventListener('click',()=>{game?.toggleAim();focusWorld();});for(const action of ['refresh','skip','banish'])$(action+'-button').addEventListener('click',()=>upgradeAction(action));
  let cameraPointer=null,lastPointerX=0,lastPointerY=0,mouseEdgeX=null;
  function look(dx,dy){Object.assign(view,BonkCamera.rotate(view.yaw,view.pitch,dx,dy,storage.sensitivity,storage.invertY));}
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
    if(event.pointerType==='mouse'){mouseEdgeX=event.clientX;look(event.movementX,event.movementY);return;}
    if(event.pointerId!==cameraPointer)return;look(event.clientX-lastPointerX,event.clientY-lastPointerY);lastPointerX=event.clientX;lastPointerY=event.clientY;
  });
  $('world').addEventListener('pointerleave',()=>{mouseEdgeX=null;});
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
  // Native cancellation preserves pause ownership and leaves upgrade and results choices explicit.
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('cancel',event=>{event.preventDefault();if(!['upgrade-dialog','end-dialog','map-clear-dialog'].includes(currentDialog()))closeDialog();}));
  window.addEventListener('keydown',event=>{if(event.code==='Escape'&&!currentDialog()&&game?.state==='running'){event.preventDefault();pause();}},true);
  function focusLost(){clearInput();cameraPointer=null;mouseEdgeX=null;if(game?.state==='running')pause();}window.addEventListener('blur',focusLost);document.addEventListener('visibilitychange',()=>{if(document.hidden)focusLost();});window.addEventListener('resize',()=>view?.resize());
  window.addEventListener('storage',event=>{if(event.key===SAVE_KEY){try{storage=readProfile();updateProfileUI();applyPreferences();}catch(_){toast('Progress changed in another tab.');}}});
  let joystickPointer=null;const joystick=$('joystick');
  function moveStick(event){if(event.pointerId!==joystickPointer)return;const rect=joystick.getBoundingClientRect(),dx=event.clientX-rect.left-rect.width/2,dy=event.clientY-rect.top-rect.height/2,length=Math.max(1,Math.hypot(dx,dy)/40);stick.x=clamp(dx/length/40,-1,1);stick.y=clamp(dy/length/40,-1,1);$('joystick-knob').style.transform='translate('+stick.x*35+'px,'+stick.y*35+'px)';}
  joystick.addEventListener('pointerdown',event=>{joystickPointer=event.pointerId;joystick.setPointerCapture(event.pointerId);moveStick(event);});joystick.addEventListener('pointermove',moveStick);const release=event=>{if(event.pointerId!==joystickPointer)return;joystickPointer=null;stick.x=stick.y=0;$('joystick-knob').style.transform='';};for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,release);
  $('touch-dash').addEventListener('pointerdown',event=>{event.preventDefault();game?.dash();});$('touch-jump').addEventListener('pointerdown',event=>{event.preventDefault();$('touch-jump').setPointerCapture(event.pointerId);touchGlide=true;game?.jump();});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('touch-jump').addEventListener(event,()=>touchGlide=false);
  updateProfileUI();applyPreferences();
  try{view=new WorldView();view.applySettings();requestAnimationFrame(frame);if(storageWarning)setTimeout(()=>toast(storageWarning),500);}catch(error){console.error(error);$('error-message').textContent=error.message;$('error-screen').hidden=false;}
  // A read-only diagnostic snapshot supports deterministic browser verification.
  Object.defineProperty(window,'relicWilds',{value:Object.freeze({get snapshot(){return game?{state:game.state,mode:game.mode,time:game.time,realm:game.realm,landmark:game.landmark?.name||null,arenaLimit:game.arenaLimit,stage:game.stage,stageLabel:game.stageLabel,stageKills:game.stageKills[game.realm],level:game.level,hp:game.player.hp,kills:game.kills,energy:game.energy,action:game.player.action,aim:game.aimMode,camera:{yaw:view.yaw,pitch:view.pitch,distance:view.distance},visited:[...game.visited],shrines:[...game.shrines],boss:game.boss?{id:game.boss.bossId,name:game.boss.name,stage:game.boss.stage,hp:game.boss.hp,action:game.boss.action}:null,enemies:game.enemies.length,position:{x:game.player.x,y:game.player.y,z:game.player.z},profile:{rupees:storage.rupees,unlocked:storage.unlocked,checkpoint:!!storage.checkpoint}}:{state:'title',realm:view?.realm,profile:{rupees:storage.rupees,unlocked:storage.unlocked,checkpoint:!!storage.checkpoint}};}})});
})();
