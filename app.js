(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const { Game, HEROES, REALMS, GATES, UPGRADES, seeded, clamp } = BonkCore;
  const ICONS = {
    relic:'<path d="m12 2 7 10-7 10-7-10Z"/><path d="m5 12 7-4 7 4-7 4Z"/>',
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
    tree:'<path d="m12 2-7 9h4l-6 7h18l-6-7h4Zm0 16v4"/>'
  };
  const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.relic}</svg>`;
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); delete el.dataset.icon; });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  let view, game = null, selectedHero = 'pip', titleTime = 0, lastTime = 0, hudTime = 0, accumulator = 0, loadoutKey = '', soundEnabled = false, audio = null;
  let toastTimer, announcementTimer, mapFromPause = false, auxiliaryPaused = false, touchGlide = false, endingShown = false;
  const keys = new Set(), stick = { x: 0, y: 0 };
  let storage = {};
  try { storage = JSON.parse(localStorage.getItem('relic-wilds-v1') || '{}') || {}; } catch (_) { /* Private browsing still supports a full run. */ }
  if (typeof storage !== 'object' || Array.isArray(storage)) storage = {};
  soundEnabled = storage.sound === true;
  const formatTime = time => Math.floor(time / 60) + ':' + String(Math.floor(time % 60)).padStart(2, '0');
  function save() { try { localStorage.setItem('relic-wilds-v1', JSON.stringify(storage)); } catch (_) { /* Scores are optional when storage is unavailable. */ } }
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3200); }
  function announce(realm) { $('realm-announcement-name').textContent = realm.name; $('realm-announcement-subtitle').textContent = realm.subtitle; $('realm-announcement').classList.add('visible'); clearTimeout(announcementTimer); announcementTimer = setTimeout(() => $('realm-announcement').classList.remove('visible'), 3000); }
  function sound(type) {
    if (!soundEnabled) return;
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const now = audio.currentTime;
      const notes = { shoot: [540, 300, .055, .018, 'sine'], leaf: [760, 430, .08, .015, 'sine'], collect: [1000, 1500, .05, .023, 'sine'], hurt: [140, 65, .18, .08, 'triangle'], dash: [190, 490, .15, .04, 'sine'], jump: [250, 480, .12, .025, 'sine'], level: [540, 1080, .5, .07, 'sine'], choose: [660, 990, .25, .05, 'sine'], nova: [180, 800, .4, .065, 'triangle'], shrine: [440, 1320, .8, .06, 'sine'], travel: [300, 900, .6, .055, 'sine'], boss: [130, 50, 1.1, .08, 'triangle'], pop: [310, 140, .07, .016, 'sine'], warning: [220, 180, .2, .025, 'triangle'], slam: [100, 35, .35, .08, 'triangle'], evolve: [440, 1760, .8, .065, 'sine'], end: [320, 160, .7, .06, 'sine'] };
      const n = notes[type]; if (!n) return;
      const osc = audio.createOscillator(), gain = audio.createGain(); osc.type = n[4]; osc.frequency.setValueAtTime(n[0], now); osc.frequency.exponentialRampToValueAtTime(n[1], now + n[2]); gain.gain.setValueAtTime(n[3], now); gain.gain.exponentialRampToValueAtTime(.001, now + n[2]); osc.connect(gain); gain.connect(audio.destination); osc.start(now); osc.stop(now + n[2]);
    } catch (_) { /* Audio support is optional. */ }
  }
  function updateSoundButton() { $('sound-button').innerHTML = icon(soundEnabled ? 'sound' : 'mute'); $('sound-button').setAttribute('aria-label', soundEnabled ? 'Mute sound' : 'Enable sound'); $('sound-button').setAttribute('aria-pressed', String(soundEnabled)); }

  // All meshes reuse geometry and materials. Realm changes dispose only local geometry.
  class WorldView {
    constructor() {
      this.renderer = new THREE.WebGLRenderer({ canvas: $('world'), antialias: true, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.4 : 1.75));
      this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#d4e8d3'); this.scene.fog = new THREE.Fog('#cadfc6', 42, 110);
      this.camera = new THREE.PerspectiveCamera(39, innerWidth / innerHeight, .1, 220);
      this.ambient = new THREE.HemisphereLight('#fffae4', '#587359', 2.3); this.scene.add(this.ambient);
      this.sun = new THREE.DirectionalLight('#fff2d1', 3.2); this.sun.position.set(-17, 35, 12); this.sun.castShadow = true; this.sun.shadow.mapSize.set(1024, 1024); Object.assign(this.sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 100 }); this.sun.shadow.normalBias = .08; this.sun.shadow.bias = -.0005; this.scene.add(this.sun); this.scene.add(this.sun.target);
      this.geometries = { sphere: new THREE.IcosahedronGeometry(1, 1), lowSphere: new THREE.IcosahedronGeometry(1, 0), box: new THREE.BoxGeometry(1, 1, 1), cone: new THREE.ConeGeometry(1, 1, 6), cylinder: new THREE.CylinderGeometry(1, 1, 1, 8), disc: new THREE.CircleGeometry(1, 20), diamond: new THREE.OctahedronGeometry(1), torus: new THREE.TorusGeometry(1, .09, 5, 24) };
      this.materials = new Map(); this.environment = new THREE.Group(); this.scene.add(this.environment); this.entities = new THREE.Group(); this.scene.add(this.entities);
      this.enemies = new Map(); this.projectiles = new Map(); this.shards = new Map(); this.hazards = new Map(); this.effects = []; this.orbits = [];
      this.dummy = new THREE.Object3D(); this.realm = -1; this.hero = null; this.heroId = null; this.cameraTarget = new THREE.Vector3(); this.lastPlayer = { x: 0, z: 0 }; this.shake = 0; this.elapsed = 0;
      this.damageCanvas = document.createElement('canvas'); this.damageCanvas.width = 128; this.damageCanvas.height = 64;
      this.makeHero('pip'); this.buildRealm(0); this.resize(); this.titlePose(0);
      this.renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); if (game) game.pause(); $('error-message').textContent = 'The graphics connection was lost. Reload to start a new adventure.'; $('error-screen').hidden = false; });
    }
    mat(color, opts = {}) {
      const key = color + JSON.stringify(opts); if (!this.materials.has(key)) { const material = opts.basic ? new THREE.MeshBasicMaterial({ color, transparent: !!opts.opacity, opacity: opts.opacity ?? 1, side: opts.side || THREE.FrontSide, depthWrite: !opts.opacity }) : new THREE.MeshToonMaterial({ color, ...opts }); this.materials.set(key, material); }
      return this.materials.get(key);
    }
    mesh(type, color, scale = [1, 1, 1], pos = [0, 0, 0], parent = null, options = {}) {
      const mesh = new THREE.Mesh(this.geometries[type], this.mat(color, options)); mesh.scale.set(...scale); mesh.position.set(...pos); if (parent) parent.add(mesh); return mesh;
    }
    shadow(parent, radius = .65, opacity = .18) { const m = this.mesh('disc', '#183b37', [radius, radius * .7, 1], [0, .025, 0], parent, { basic: true, opacity }); m.rotation.x = -Math.PI / 2; return m; }
    makeHero(id) {
      if (this.hero) { this.hero.traverse(mesh=>{if(mesh.isMesh&&!Object.values(this.geometries).includes(mesh.geometry))mesh.geometry.dispose();});this.scene.remove(this.hero); }
      if (this.heroShadow) this.scene.remove(this.heroShadow);
      this.heroId = id; const hero = new THREE.Group(); this.hero = hero; this.scene.add(hero); const rig = new THREE.Group(); hero.add(rig); this.heroRig = rig;
      this.heroShadow = new THREE.Group(); this.scene.add(this.heroShadow); this.shadow(this.heroShadow, .65, .2);
      const skin = id === 'pebble' ? '#a5aaa2' : '#eac296', cloth = id === 'pebble' ? '#747c88' : id === 'sprig' ? '#79a86d' : '#5caba5', dark = '#405b54';
      this.mesh('sphere', cloth, [.4, .47, .29], [0, .91, 0], rig);
      this.mesh('box', '#e5d9b0', [.66, .13, .48], [0, .64, 0], rig);
      this.heroHead = this.mesh('sphere', skin, [.35, .36, .32], [0, 1.58, .035], rig);
      this.mesh('sphere', id === 'pebble' ? '#788a86' : '#6b5143', [.37, .25, .32], [0, 1.78, -.03], rig);
      this.mesh('box', '#cbd0ae', [.47, .07, .55], [0, 1.76, .02], rig);
      for (const x of [-.12, .12]) this.mesh('box', '#273b3a', [.048, .065, .028], [x, 1.59, .327], rig);
      this.mesh('cone', '#f0cf81', [.07, .22, .07], [.25, 1.96, -.05], rig).rotation.z = -.5;
      this.heroLegs = [];
      for (const x of [-.18, .18]) {
        const leg = new THREE.Group(); leg.position.set(x, .57, 0); rig.add(leg); this.mesh('box', dark, [.23, .39, .25], [0, -.18, 0], leg); this.mesh('box', '#715c45', [.25, .19, .38], [0, -.42, .055], leg); this.heroLegs.push(leg);
        this.mesh('sphere', skin, [.12, .24, .12], [x * 2.8, .99, .07], rig);
      }
      this.cape = this.mesh('cone', id === 'sprig' ? '#c5c87b' : '#e5c384', [.46, .82, .2], [0, .99, -.3], rig); this.cape.rotation.x = -.25; this.cape.rotation.z = Math.PI;
      const sword = new THREE.Group(); sword.position.set(.55, .8, .1); sword.rotation.z = -.3; rig.add(sword); this.heroSword = sword;
      this.mesh('box', '#d9e9df', [.115, .7, .065], [0, .45, 0], sword); this.mesh('cone', '#e6f5e9', [.082, .2, .05], [0, .9, 0], sword); this.mesh('box', '#e4c477', [.42, .08, .12], [0, .1, 0], sword); this.mesh('cylinder', '#625548', [.055, .26, .055], [0, -.07, 0], sword);
      const shield = this.mesh('sphere', '#596d70', [.3, .38, .11], [-.53, 1.03, .1], rig); shield.rotation.y = -.3;
      this.mesh('diamond', '#e0ca8b', [.1, .15, .06], [-.53, 1.05, .22], rig);
      this.glider = new THREE.Group(); this.glider.position.y = 2.6; hero.add(this.glider); this.glider.visible = false;
      const wingShape = new THREE.Shape(); wingShape.moveTo(-1.8, 0); wingShape.lineTo(-1.05, .8); wingShape.lineTo(0, 1.05); wingShape.lineTo(1.05, .8); wingShape.lineTo(1.8, 0); wingShape.lineTo(.85, -.24); wingShape.lineTo(0, -.1); wingShape.lineTo(-.85, -.24); wingShape.closePath();
      const wing = new THREE.Mesh(new THREE.ShapeGeometry(wingShape), this.mat('#e0c991', { side: THREE.DoubleSide })); wing.rotation.x = -Math.PI / 2; this.glider.add(wing);
      for (const x of [-1, 1]) { const pole = this.mesh('cylinder', '#625c48', [.018, 1.7, .018], [x * .55, -.75, .05], this.glider); pole.rotation.z = x * -.55; }
      rig.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    }
    instanced(type, color, transforms, parent = this.environment, castShadow = false) {
      if (!transforms.length) return;
      const inst = new THREE.InstancedMesh(this.geometries[type], this.mat(color), transforms.length);
      transforms.forEach((t, i) => { this.dummy.position.set(t.x, t.y, t.z); this.dummy.scale.set(t.sx || 1, t.sy || 1, t.sz || 1); this.dummy.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0); this.dummy.updateMatrix(); inst.setMatrixAt(i, this.dummy.matrix); if (t.color) inst.setColorAt(i, new THREE.Color(t.color)); });
      inst.castShadow = castShadow; inst.receiveShadow = true; parent.add(inst); return inst;
    }
    clearGroup(group) { while (group.children.length) { const child=group.children[0];child.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.dispose();});group.remove(child); } }
    buildRealm(index) {
      this.realm = index; this.clearGroup(this.environment); this.portalGroups = []; this.floating = []; this.water = null;
      const r = REALMS[index], rand = seeded(1977 + index * 391), env = this.environment;
      this.scene.background.set(r.sky); this.scene.fog.color.set(r.fog); this.ambient.color.set(index === 2 ? '#c7c7ef' : index === 4 ? '#ffe2bc' : '#fff8e3'); this.ambient.groundColor.set(index === 2 ? '#4d4365' : '#657354'); this.sun.color.set(index === 2 || index === 5 ? '#e1dcff' : '#fff0ca');
      const ground = this.mesh('cylinder', r.ground, [96, 1, 96], [0, -.6, 0], env); ground.receiveShadow = true;
      const clearing = this.mesh('cylinder', index === 1 ? '#decc9d' : index === 4 ? '#817467' : index === 2 ? '#777694' : index === 5 ? '#929fa2' : '#a6b67d', [10, .06, 10], [0, -.05, -3], env); clearing.receiveShadow = true;
      const grass = [], rocks = [], trunks = [], leaves = [], flowers = [], path = [];
      for (let i = 0; i < 250; i++) {
        const x = (rand() - .5) * 125, z = (rand() - .5) * 125;
        if (Math.hypot(x, z) < 10 || GATES.some(g => Math.hypot(g.x - x, g.z - z) < 5)) continue;
        const size = .2 + rand() * .45;
        if (i % 4 === 0) rocks.push({x, y: size * .45, z, sx:size*1.8, sy:size, sz:size*1.5, ry:rand()*6, color:i%8===0?'#aab1a1':'#839488'});
        else grass.push({x,y:size*.35,z,sx:.06,sy:size,sz:.4,ry:rand()*6,color:index===4?'#be9770':index===2?'#a1a0b3':index===5?'#bac5b4':i%2?'#c6cf94':'#718d4e'});
        if (i % 6 === 0) flowers.push({x:x+.3,y:.19,z:z+.2,sx:.12,sy:.12,sz:.12,color:index===2?'#e9b6de':index===4?'#f8c580':i%2?'#fcf3c7':'#e7bd91'});
      }
      for (let i = 0; i < 54; i++) {
        const a = rand() * Math.PI * 2, rad = 18 + rand() * 47, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
        if (GATES.some(g => Math.hypot(g.x - x, g.z - z) < 5) || index === 1 && x > 13 || index === 3 && i % 3) continue;
        const s = .8 + rand() * 1.15;
        trunks.push({x,y:1.5*s,z,sx:.3*s,sy:3*s,sz:.3*s,rz:(rand()-.5)*.13});
        if (index === 1) {
          for (let j=0;j<5;j++) leaves.push({x:x+Math.cos(j*1.256)*1.5*s,y:3.4*s,z:z+Math.sin(j*1.256)*1.5*s,sx:2.3*s,sy:.28*s,sz:.6*s,ry:-j*1.256,color:j%2?'#73aa6a':'#9ac474'});
        } else if (index !== 4) {
          for (let j=0;j<3;j++) leaves.push({x:x+(rand()-.5)*s,y:(3+j*.78)*s,z:z+(rand()-.5)*s,sx:(2.35-j*.35)*s,sy:1.7*s,sz:(2.2-j*.3)*s,ry:rand()*6,color:index===2?['#9794b0','#a6a6be','#747d9b'][j]:index===5?['#afbfb4','#c6caba','#829e9a'][j]:['#8fad68','#a8bf78','#759e60'][j]});
        } else rocks.push({x,y:1.4*s,z,sx:s,sy:3*s,sz:s,ry:a,color:'#5f6063'});
      }
      this.instanced('cone', '#a8b678', grass); this.instanced('lowSphere', '#9da58d', rocks, env, true); this.instanced('cylinder', index===2?'#64617a':'#877657', trunks, env, true); this.instanced('sphere', '#9ebc78', leaves, env, true); this.instanced('lowSphere','#f7e6b2',flowers);
      for (let i=0;i<3;i++) {
        const g = GATES[i]; for(let k=1;k<12;k++) {const t=k/12;path.push({x:g.x*t+(rand()-.5),y:.015,z:g.z*t+(rand()-.5),sx:.6+rand()*.4,sy:.045,sz:.7+rand()*.4,ry:rand()*6});}
      }
      this.instanced('cylinder',index===4?'#a2947b':'#c4c5a1',path);
      this.buildShrine(r, env);
      GATES.forEach((g, i) => this.buildGate(g, REALMS[r.links[i]], env, i));
      // Each realm has its own skyline and landmark, beyond a palette swap.
      if (index === 0) {
        this.buildRuin(9,-15,1.3,env); this.buildRuin(-11,8,.7,env);
        const trunk = this.mesh('cylinder','#7b7351',[1.4,10,1.4],[-19,4.8,-9],env);trunk.castShadow=true;
        for(let i=0;i<8;i++){const a=i*.785;const m=this.mesh('sphere',i%2?'#9fba72':'#b1c989',[5.2,3.4,4.5],[-19+Math.cos(a)*3,10+Math.sin(a*2),-9+Math.sin(a)*3],env);m.castShadow=true;}
      }
      if (index === 1) {
        this.water = this.mesh('cylinder','#65b8bc',[24,.12,38],[45,-.05,0],env,{transparent:true,opacity:.87});
        for(let i=0;i<15;i++){const m=this.mesh('box','#e0f0df',[.11,.025,3+rand()*4],[26+rand()*34,.04,-30+rand()*60],env);this.floating.push({mesh:m,base:m.position.y,phase:rand()*6,water:true});}
        const boat=new THREE.Group();boat.position.set(25,.12,3);boat.rotation.y=-.3;env.add(boat);this.mesh('sphere','#9b7956',[1.3,.45,3], [0,0,0],boat);this.mesh('cylinder','#72634c',[.07,5,.07],[0,2.5,0],boat);const sail=this.mesh('cone','#f4e4b9',[1.8,3.6,.07],[.4,3.2,0],boat);sail.rotation.z=-.25;this.floating.push({mesh:boat,base:.12,phase:1});this.buildRuin(-12,-11,.8,env);
      }
      if (index === 2) {
        for(let i=0;i<10;i++){const a=i*.628,x=Math.cos(a)*30,z=Math.sin(a)*30;this.mesh('diamond','#777090',[1.6,5+rand()*4,1.6],[x,3,z],env);const shard=this.mesh('diamond','#e7ab8d',[.3,.8,.3],[x,8+rand()*2,z],env,{emissive:'#a85546',emissiveIntensity:.35});this.floating.push({mesh:shard,base:shard.position.y,phase:rand()*6});}
        this.buildRuin(11,-13,1.5,env); const moon=this.mesh('sphere','#e9d4bc',[6,6,6],[-28,28,-49],env,{basic:true});
      }
      if (index === 3) {
        for(let i=0;i<11;i++){const a=i*.571,rad=36+rand()*20,x=Math.cos(a)*rad,z=Math.sin(a)*rad,y=3+rand()*12;this.mesh('cone','#8a9b8d',[5+rand()*4,9+rand()*8,5+rand()*4],[x,y-6,z],env).rotation.z=Math.PI;this.mesh('cylinder','#b0c790',[6,.55,6],[x,y,z],env);const cloud=this.mesh('sphere','#eff6e7',[9,2,6],[x+3,y-5,z+1],env);this.floating.push({mesh:cloud,base:y-5,phase:a});}
        this.buildRuin(-12,-11,1,env);this.buildRuin(10,8,.65,env);
        const arch = this.mesh('torus','#c7c9a8',[5,5,1],[0,7,-28],env);arch.rotation.y=.4;
      }
      if (index === 4) {
        for(let i=0;i<16;i++){const a=i*.393,rad=28+rand()*15;const m=this.mesh('cone','#4e5356',[4+rand()*3,8+rand()*8,4+rand()*3],[Math.cos(a)*rad,3,Math.sin(a)*rad],env);m.castShadow=true;}
        for(let i=0;i<8;i++)this.mesh('box','#f1a16b',[.15,.025,8+rand()*5],[(rand()-.5)*45,.035,(rand()-.5)*45],env,{basic:true}).rotation.y=rand()*6;
        this.buildRuin(10,-11,1.3,env);
      }
      if (index === 5) {
        for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.cos(a)*26,z=Math.sin(a)*26;this.mesh('cylinder','#b8bca9',[1.1,9+(i%3)*2,1.1],[x,4,z],env);this.mesh('box','#d9d8b8',[2.8,.65,2.8],[x,8.8+(i%3),z],env);}
        const ring=this.mesh('torus','#e4d5a1',[6,6,.5],[0,7,-29],env);ring.rotation.x=.25;this.floating.push({mesh:ring,base:7,phase:1,rotate:true});this.mesh('sphere','#f3eac9',[5,5,5],[-35,32,-55],env,{basic:true});this.buildRuin(11,7,.7,env);
      }
      // Mountains and clouds make the horizon feel continuous beyond the arena.
      const mountains=[],clouds=[];
      for(let i=0;i<20;i++){const a=i*.314; mountains.push({x:Math.cos(a)*88,y:3,z:Math.sin(a)*88,sx:12+rand()*10,sy:14+rand()*14,sz:12+rand()*10,color:index===2?'#7f8198':index===4?'#7b7370':'#a8bfad'});if(i%2===0)clouds.push({x:Math.cos(a)*65,y:20+rand()*10,z:Math.sin(a)*65,sx:8+rand()*7,sy:1.2,sz:3+rand()*2});}
      this.instanced('cone','#b4c6b0',mountains);this.instanced('sphere',index===2?'#9b9bad':'#eef2dd',clouds);
      this.makeMotes(r,index);
    }
    buildRuin(x,z,s,parent) {
      const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(s);parent.add(group);
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
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));this.motes=new THREE.Points(geometry,new THREE.PointsMaterial({color:realm.accent,size:index===4?.09:.075,transparent:true,opacity:.6,depthWrite:false}));this.scene.add(this.motes);
    }
    enemyModel(e) {
      const group=new THREE.Group();this.entities.add(group);const body=new THREE.Group();group.add(body);const dark='#34434c';let main;
      if(e.type==='slime'){
        main=this.mesh('sphere',this.realm===2?'#a390bb':'#7db8a1',[.62,.58,.59],[0,.55,0],body);this.mesh('cone','#c4d8a2',[.2,.45,.18],[.1,1.19,0],body).rotation.z=-.45;
        for(const x of [-.2,.2])this.mesh('box',dark,[.085,.13,.06],[x,.65,.51],body);
      }else if(e.type==='mushroom'){
        main=this.mesh('cylinder','#d7cbae',[.32,.72,.32],[0,.45,0],body);this.mesh('sphere',this.realm===2?'#b199bd':'#c98671',[.84,.45,.74],[0,1,0],body);this.mesh('sphere','#eed9ad',[.16,.07,.15],[.2,1.4,.13],body);
        for(const x of [-.13,.13])this.mesh('box',dark,[.07,.11,.04],[x,.58,.31],body);
      }else if(e.type==='bat'){
        main=this.mesh('sphere','#7c829c',[.36,.4,.3],[0,1.1,0],body);group.userData.wings=[];
        for(const x of [-1,1]){const w=this.mesh('cone','#9c9bb4',[.45,.9,.1],[x*.5,1.2,0],body);w.rotation.z=x*1.25;group.userData.wings.push(w);this.mesh('sphere','#edcf9c',[.065,.08,.05],[x*.12,1.15,.28],body);}
      }else if(e.type==='boar'){
        main=this.mesh('sphere',e.elite?'#8b7293':'#8d8588',[.8,.7,.95],[0,.85,0],body);this.mesh('sphere','#b9a393',[.42,.35,.45],[0,.76,.9],body);for(const x of [-1,1]){this.mesh('cone','#e2d7b4',[.17,.55,.17],[x*.35,.8,1.05],body).rotation.x=-.7;this.mesh('sphere','#e9c287',[.08,.08,.05],[x*.37,1.12,.74],body);this.mesh('cone','#aaa1a0',[.18,.6,.18],[x*.4,1.6,-.1],body);}
      }else{
        main=this.mesh('sphere','#4e586b',[1.6,2.1,1.3],[0,2.2,0],body);this.mesh('sphere','#88919b',[1.3,1.1,1],[0,4.15,.1],body);this.mesh('box','#eab788',[1.6,.17,.25],[0,4.2,1.05],body,{emissive:'#ffbd86',emissiveIntensity:.6});
        for(const x of [-1,1]){this.mesh('sphere','#737d87',[.8,1.2,.8],[x*1.9,2.5,0],body);this.mesh('box','#9b9c9d',[1.1,1.1,1.1],[x*2,1.3,.2],body);this.mesh('cone','#bec2ae',[.4,1.5,.4],[x*.9,5.3,0],body).rotation.z=-x*.3;this.mesh('sphere','#737d87',[.7,.9,.7],[x*.85,.6,0],body);}
        this.mesh('diamond','#e7b38d',[.47,.77,.3],[0,2.65,1.3],body,{emissive:'#ffad7b',emissiveIntensity:.5});
      }
      group.userData.body=body;group.userData.main=main;group.userData.baseMaterial=main.material;
      const shadow=this.shadow(group,e.radius*1.05,.16);group.userData.shadow=shadow;
      if(e.elite)group.scale.setScalar(1.3);
      return group;
    }
    syncMap(map,items,create,update) {
      const active=new Set();for(const item of items){active.add(item.id);let mesh=map.get(item.id);if(!mesh){mesh=create(item);map.set(item.id,mesh);}update(mesh,item);}
      for(const [id,mesh] of map)if(!active.has(id)){this.entities.remove(mesh);map.delete(id);}
    }
    ringEffect(x,z,color,radius,duration=.5) {
      const mesh=this.mesh('torus',color,[.1,.1,.1],[x,.15,z],this.entities,{basic:true,opacity:.75});mesh.rotation.x=-Math.PI/2;
      this.effects.push({mesh,time:duration,duration,radius,kind:'ring'});
    }
    popEffect(x,z,color) {
      if(this.effects.length>120)return;
      for(let i=0;i<4;i++){const mesh=this.mesh('lowSphere',color,[.12,.12,.12],[x,.55,z],this.entities,{basic:true});const a=i*Math.PI/2+Math.random();this.effects.push({mesh,time:.4,duration:.4,kind:'particle',vx:Math.cos(a)*2.4,vz:Math.sin(a)*2.4,vy:3});}
    }
    damageText(x,z,damage) {
      if(reducedMotion||this.effects.filter(e=>e.kind==='text').length>14)return;
      const canvas=document.createElement('canvas');canvas.width=96;canvas.height=64;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.font='900 35px Nunito,sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#344b43';ctx.strokeText(String(damage),48,43);ctx.fillStyle='#fff3ce';ctx.fillText(String(damage),48,43);
      const texture=new THREE.CanvasTexture(canvas),material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false});const mesh=new THREE.Sprite(material);mesh.position.set(x,2,z);mesh.scale.set(1.15,.77,1);this.entities.add(mesh);this.effects.push({mesh,time:.65,duration:.65,kind:'text',texture,material});
    }
    clearDynamic() {
      this.clearGroup(this.entities);for(const map of [this.enemies,this.projectiles,this.shards,this.hazards])map.clear();this.orbits=[];for(const e of this.effects)if(e.texture){e.texture.dispose();e.material.dispose();}this.effects=[];
    }
    resize() { this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix(); }
    titlePose(time) {
      this.hero.position.set(0,0,0);this.hero.rotation.y=-.35;this.heroRig.position.y=Math.sin(time*1.7)*.025;this.heroLegs.forEach(l=>l.rotation.x=0);this.glider.visible=false;
      const mobile=innerWidth<700;
      const target=new THREE.Vector3(mobile?-3.3:-5.9,0,mobile?1.6:5.6);this.camera.position.set(16,17,19);this.camera.lookAt(target);
      this.hero.scale.setScalar(mobile?1.7:1.7);
    }
    render(game,dt,time) {
      this.elapsed=time;
      if(game){
        if(this.realm!==game.realm){this.portalGroups.forEach(p=>{p.texture.dispose();p.material.dispose();});this.clearDynamic();this.buildRealm(game.realm);}
        const p=game.player;this.hero.scale.setScalar(1);this.hero.position.set(p.x,p.y,p.z);
        const angle=p.facing-this.hero.rotation.y;this.hero.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*Math.min(1,dt*13);
        const moving=Math.hypot(p.x-this.lastPlayer.x,p.z-this.lastPlayer.z)>.001;this.lastPlayer={x:p.x,z:p.z};
        const walking=moving&&p.y===0&&game.state==='running';this.heroLegs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(time*14+i*Math.PI)*.6:0);
        this.heroRig.position.y=walking?Math.abs(Math.sin(time*14))*.08:0;this.cape.rotation.x=-.25+(walking?.25:0)+Math.sin(time*3)*.06;this.heroSword.rotation.x=Math.sin(time*4)*.07;
        this.glider.visible=p.gliding;this.glider.rotation.z=Math.sin(time*2)*.04;this.hero.visible=p.invincible<=0||p.dash>0||Math.sin(time*35)>-.35;
        this.heroShadow.position.set(p.x,0,p.z);this.heroShadow.scale.setScalar(1-p.y*.08);
        const zoom=innerWidth<600?1.15:1;const camPos=new THREE.Vector3(p.x+15*zoom,20*zoom,p.z+15*zoom);this.camera.position.lerp(camPos,1-Math.exp(-6*dt));this.cameraTarget.lerp(new THREE.Vector3(p.x,.4,p.z),1-Math.exp(-8*dt));
        if(!reducedMotion&&this.shake>0){this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.z+=(Math.random()-.5)*this.shake;this.shake*=Math.exp(-8*dt);}
        this.camera.lookAt(this.cameraTarget);this.sun.position.set(p.x-17,35,p.z+12);this.sun.target.position.set(p.x,0,p.z);
        this.syncMap(this.enemies,game.enemies,e=>this.enemyModel(e),(m,e)=>{m.position.set(e.x,0,e.z);m.rotation.y=Math.atan2(p.x-e.x,p.z-e.z);const body=m.userData.body;body.position.y=e.type==='bat'?Math.sin(time*8+e.id)*.18:Math.abs(Math.sin(time*5+e.id))*.09;const s=e.type==='slime'?1+Math.sin(time*6+e.id)*.07:1;body.scale.set(1/s,s,1/s);m.userData.main.material=e.hitFlash>0?this.mat('#fff2d3'):m.userData.baseMaterial;if(m.userData.wings)m.userData.wings.forEach((w,i)=>w.rotation.z=(i?1:-1)*(1.2+Math.sin(time*16)*.4));});
        this.syncMap(this.shards,game.shards,s=>{const m=this.mesh('diamond',s.value>4?'#e8cd85':'#a5edce',[.17,.3,.17],[s.x,.4,s.z],this.entities,{basic:true});return m;},(m,s)=>{m.position.set(s.x,.38+Math.sin(time*3+s.id)*.08,s.z);m.rotation.y=time*1.8+s.id;m.scale.setScalar(s.value>4?.4:.25);});
        this.syncMap(this.projectiles,game.projectiles,b=>{const m=this.mesh(b.type==='leaf'?'diamond':'cone',b.type==='leaf'?'#d8f2a9':'#c2f9e3',b.type==='leaf'?[.2,.12,.5]:[.16,.65,.16],[b.x,1,b.z],this.entities,{basic:true});return m;},(m,b)=>{m.position.set(b.x,1,b.z);m.rotation.set(Math.PI/2,0,-Math.atan2(b.vz,b.vx)+Math.PI/2);});
        this.syncMap(this.hazards,game.hazards,h=>{const group=new THREE.Group();this.entities.add(group);const disc=this.mesh('disc','#d66b55',[h.radius,h.radius,1],[0,.05,0],group,{basic:true,opacity:.38});disc.rotation.x=-Math.PI/2;const ring=this.mesh('torus','#f6a086',[h.radius,h.radius,h.radius],[0,.06,0],group,{basic:true});ring.rotation.x=-Math.PI/2;group.userData.disc=disc;group.userData.ring=ring;return group;},(m,h)=>{m.position.set(h.x,0,h.z);m.userData.ring.scale.setScalar(h.radius*clamp(1-h.timer/h.duration,.05,1));m.visible=!h.fired||Math.sin(time*35)>0;});
        const count=game.rank('orbit')?game.rank('orbit')+1:0;
        while(this.orbits.length<count){const m=this.mesh('diamond',game.rank('orbit')===7?'#f5d390':'#c5d4d0',[.3,.44,.3],[0,1,0],this.entities);this.orbits.push(m);}
        this.orbits.forEach((m,i)=>{m.visible=i<count;const a=game.orbitAngle+i*Math.PI*2/count;m.position.set(p.x+Math.cos(a)*2.6,1+Math.sin(time*3+i)*.15,p.z+Math.sin(a)*2.6);m.rotation.set(time,time*.6,0);});
        this.shrineGem.visible=!game.shrines.has(game.realm);this.shrineRing.visible=!game.shrines.has(game.realm);
      }else this.titlePose(time);
      this.shrineGem.rotation.y=time*.7;this.shrineGem.position.y=2.5+Math.sin(time*1.8)*.16;this.shrineRing.rotation.z=time*.25;
      this.portalGroups.forEach((p,i)=>{p.ring.rotation.z=Math.sin(time*.5+i)*.04;p.surface.scale.x=1.28+Math.sin(time*1.8+i)*.04;});
      this.floating.forEach(f=>{f.mesh.position.y=f.base+Math.sin(time*(f.water?.6:.8)+f.phase)*(f.water?.015:.23);if(f.rotate)f.mesh.rotation.z=time*.06;});
      if(this.motes){this.motes.rotation.y=time*.007;this.motes.position.y=Math.sin(time*.3)*.3;}
      for(const e of this.effects){e.time-=dt;const t=1-e.time/e.duration;if(e.kind==='ring'){e.mesh.scale.setScalar(.1+e.radius*t);}else if(e.kind==='particle'){e.mesh.position.x+=e.vx*dt;e.mesh.position.z+=e.vz*dt;e.mesh.position.y+=e.vy*dt;e.vy-=12*dt;e.mesh.scale.setScalar(.15*(1-t));}else if(e.kind==='text'){e.mesh.position.y+=dt*1.7;e.mesh.material.opacity=1-t;}}
      this.effects=this.effects.filter(e=>{if(e.time>0)return true;this.entities.remove(e.mesh);if(e.texture){e.texture.dispose();e.material.dispose();}return false;});
      this.renderer.render(this.scene,this.camera);
    }
  }

  function updateBest() { $('best-note').textContent = Number.isFinite(storage.bestKills) && storage.bestKills > 0 ? `Personal best: ${storage.bestKills} defeated · ${storage.wins || 0} victories` : 'Four weapons. Six shrines. A world connected.'; }
  function closeAll() { document.querySelectorAll('dialog[open]').forEach(d=>d.close()); keys.clear();stick.x=stick.y=0;touchGlide=false; }
  function focusWorld() { if(game?.state==='running'&&!document.querySelector('dialog[open]'))$('world').focus({preventScroll:true}); }
  function start() {
    closeAll();game=new Game(selectedHero);endingShown=false;loadoutKey='';accumulator=0;view.clearDynamic();view.portalGroups.forEach(p=>{p.texture.dispose();p.material.dispose();});view.buildRealm(0);view.makeHero(selectedHero);view.hero.visible=true;
    view.cameraTarget.set(0,.4,0);view.camera.position.set(15,20,15);view.lastPlayer={x:0,z:0};
    document.body.classList.add('playing');for(const id of ['menu','menu-footer','menu-landmark'])$(id).hidden=true;for(const id of ['hud','pause-button'])$(id).hidden=false;$('touch-controls').hidden=!touch;
    $('damage-flash').style.opacity=0;updateHud();announce(REALMS[0]);sound('choose');focusWorld();
    setTimeout(()=>{if(game&&game.time<5)toast(touch?'Move with the stick. Your weapons attack automatically.':'WASD to move. Your relics attack automatically.');},2200);
  }
  function home() { closeAll();game=null;view.clearDynamic();view.hero.visible=true;view.heroRig.visible=true;view.portalGroups.forEach(p=>{p.texture.dispose();p.material.dispose();});view.buildRealm(0);view.makeHero(selectedHero);document.body.classList.remove('playing');for(const id of ['menu','menu-footer','menu-landmark'])$(id).hidden=false;for(const id of ['hud','pause-button','touch-controls','boss-hud','interaction'])$(id).hidden=true;$('realm-announcement').classList.remove('visible');$('toast').classList.remove('visible');$('damage-flash').style.opacity=0;updateBest(); }
  function pause() { if(!game||game.state!=='running')return;game.pause();keys.clear();$('pause-dialog').showModal();sound('choose'); }
  function resume() { $('pause-dialog').close();if(game)game.resume();keys.clear();focusWorld(); }
  function auxiliaryOpen(id) {
    if(game&&game.state==='upgrade')return;
    auxiliaryPaused=!!game&&game.state==='running';if(auxiliaryPaused)game.pause();keys.clear();$(id).showModal();
  }
  function auxiliaryClose(id) { $(id).close();if(auxiliaryPaused&&game)game.resume();auxiliaryPaused=false;keys.clear();focusWorld(); }
  const realmIcons=['tree','wave','moon','wing','flame','clock'];
  function buildMap() {
    const root=$('realm-map');root.textContent='';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 650 360');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
    const positions=REALMS.map((r,i)=>{const a=-Math.PI/2+i*Math.PI/3;return{x:50+Math.cos(a)*34,y:50+Math.sin(a)*36};});
    for(let i=0;i<REALMS.length;i++)for(const j of REALMS[i].links)if(j>i){const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',positions[i].x*6.5);line.setAttribute('y1',positions[i].y*3.6);line.setAttribute('x2',positions[j].x*6.5);line.setAttribute('y2',positions[j].y*3.6);line.setAttribute('stroke-dasharray','4 5');svg.appendChild(line);}
    root.appendChild(svg);
    REALMS.forEach((r,i)=>{const button=document.createElement('button');button.type='button';button.className='realm-node'+(game&&game.realm===i?' current':'');button.style.left=positions[i].x+'%';button.style.top=positions[i].y+'%';button.style.setProperty('--realm-color',r.color);button.innerHTML=`<span class="realm-orb">${icon(realmIcons[i])}</span><b>${r.name}</b><small>${game?(game.realm===i?'YOU ARE HERE':game.shrines.has(i)?'SHRINE AWAKENED':game.visited.has(i)?'EXPLORED':'UNDISCOVERED'):'Preview realm'}</small>`;
      button.setAttribute('aria-label',r.name+(game&&game.realm===i?', current realm':''));button.addEventListener('click',()=>{if(game){toast(`${r.name} · ${r.benefit}${game.shrines.has(i)?' · shrine awakened':''}`);}else{view.portalGroups.forEach(p=>{p.texture.dispose();p.material.dispose();});view.buildRealm(i);$('map-description').textContent=r.subtitle;$('map-travel-hint').textContent=r.name+' · Shrine blessing: '+r.benefit;}});root.appendChild(button);});
    $('map-shrine-status').textContent=game?`${game.shrines.size} / 6 shrines awakened`:'Six unique realms, connected by ancient gates.';
  }
  function openMap(fromPause=false){if(game&&game.state!=='running'&&game.state!=='paused')return;mapFromPause=fromPause;if(fromPause)$('pause-dialog').close();buildMap();$('map-description').textContent='Six realms. Ancient gates. Every path leads somewhere.';$('map-travel-hint').textContent=game?'Find a glowing gate and press E to cross. Your power travels with you.':'Select a realm to preview its world. Close the map to begin.';auxiliaryOpen('map-dialog');}
  function closeMap(){auxiliaryClose('map-dialog');if(mapFromPause&&game){$('pause-dialog').showModal();mapFromPause=false;}}
  function showUpgrade(){
    if($('upgrade-dialog').open||!game||game.state!=='upgrade')return;
    $('upgrade-level').textContent=`Level ${game.level} · Choose a blessing`;$('upgrade-options').textContent='';
    game.choices.forEach((u,i)=>{const rank=game.rank(u.id),evolved=rank===6,button=document.createElement('button');button.className='upgrade-choice'+(evolved?' evolution':'');button.innerHTML=`${icon(u.icon)}<kbd>${i+1}</kbd><span class="upgrade-kind">${evolved?'EVOLUTION':!rank?'NEW '+u.category:u.category}</span><h3>${evolved?u.evolved:u.name}</h3><p>${rank&&u.next?u.next:u.desc}</p><span class="rank">${rank?'RANK '+rank+' → '+(rank+1):'RANK 1'}${evolved?' · FULLY AWAKENED':''}</span>`;button.addEventListener('click',()=>chooseUpgrade(u.id));$('upgrade-options').appendChild(button);});
    keys.clear();$('upgrade-dialog').showModal();
  }
  function chooseUpgrade(id){if(!game||!game.choose(id))return;$('upgrade-dialog').close();keys.clear();loadoutKey='';updateHud();if(game.state==='upgrade')showUpgrade();else focusWorld();}
  function updateHud(){
    if(!game)return;const p=game.player;$('health-text').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;$('health-fill').style.width=(p.hp/p.maxHp*100)+'%';$('stamina-fill').style.width=p.stamina*100+'%';$('timer').textContent=formatTime(game.time);$('kills').textContent=game.kills;$('realm-name').textContent=REALMS[game.realm].name;$('shrines-count').textContent=game.shrines.size+' / 6 shrines';$('xp-fill').style.width=Math.min(100,game.xp/game.xpNeed*100)+'%';$('level-label').textContent='LV. '+game.level;$('xp-label').textContent=game.xp+' / '+game.xpNeed;
    $('dash-label').textContent=p.dashCooldown>0?'Dash '+p.dashCooldown.toFixed(1)+'s':'Dash ready';$('touch-dash').style.opacity=p.dashCooldown>0?'.5':'1';
    $('objective').textContent=game.bossSpawned?'DEFEAT THE HOLLOW WARDEN':'THE WARDEN WAKES AT 4:00';
    $('boss-hud').hidden=!game.boss||game.boss.dead;if(game.boss)$('boss-fill').style.width=Math.max(0,game.boss.hp/game.boss.maxHp*100)+'%';
    const interaction=game.interaction;$('interaction').hidden=!interaction||game.state!=='running';if(interaction)$('interaction-label').textContent=interaction.kind==='gate'?(game.travelCooldown>0?'Gate recharging · '+Math.ceil(game.travelCooldown)+'s':'Travel to '+interaction.name):'Awaken '+interaction.name;
    const key=JSON.stringify(game.ranks);if(key!==loadoutKey){loadoutKey=key;$('loadout').textContent='';UPGRADES.filter(u=>u.category==='WEAPON'&&game.rank(u.id)).forEach(u=>{const el=document.createElement('div');el.className='weapon-slot'+(game.rank(u.id)===7?' evolved':'');el.title=(game.rank(u.id)===7?u.evolved:u.name)+' · Rank '+game.rank(u.id);el.setAttribute('aria-label',el.title);el.innerHTML=icon(u.icon)+`<small>${'·'.repeat(game.rank(u.id))}</small>`;$('loadout').appendChild(el);});}
  }
  function showEnd(){
    if(endingShown||!game)return;endingShown=true;closeAll();const won=game.state==='won';$('touch-controls').hidden=true;
    const record=game.kills>(Number(storage.bestKills)||0);storage.bestKills=Math.max(Number(storage.bestKills)||0,game.kills);storage.bestTime=Math.max(Number(storage.bestTime)||0,game.time);if(won)storage.wins=(Number(storage.wins)||0)+1;save();
    $('end-title').textContent=won?'The dawn belongs to you.':'The wilds remember you.';$('end-description').textContent=won?'The Hollow Warden has fallen. Across six realms, the ancient gates glow a little brighter.':'Even the longest journey starts again. Return stronger. Take another path.';$('end-icon').innerHTML=icon(won?'sun':'moon');
    $('end-stats').innerHTML=`<div><strong>${formatTime(game.time)}</strong><span>TIME SURVIVED</span></div><div><strong>${game.kills}</strong><span>DEFEATED</span></div><div><strong>${game.level}</strong><span>LEVEL REACHED</span></div><div><strong>${game.visited.size}/6</strong><span>REALMS VISITED</span></div>`;$('end-record').textContent=record?'A new personal best. The next story is yours.':`${game.shrines.size} shrines awakened · ${Math.round(game.damageDealt).toLocaleString()} damage dealt`;$('end-dialog').showModal();
  }
  function handleEvents(){
    if(!game)return;let collectSound=false,popSound=false;
    for(const e of game.drainEvents()){
      if(e.type==='hit'){view.damageText(e.x,e.z,e.damage);continue;}
      if(e.type==='pop'){view.popEffect(e.x,e.z,e.type==='boss'?'#f1dca0':'#bbd9b2');if(!popSound){sound('pop');popSound=true;}continue;}
      if(e.type==='collect'){if(!collectSound){sound('collect');collectSound=true;}continue;}
      if(e.type==='hurt'){view.shake=reducedMotion?0:.45;$('damage-flash').style.opacity=.7;}
      if(e.type==='dash')view.ringEffect(e.x,e.z,'#d0eaca',2,.3);
      if(e.type==='nova')view.ringEffect(e.x,e.z,'#d3ecd0',e.radius,.48);
      if(e.type==='slam'){view.ringEffect(e.x,e.z,'#f8c096',3.5,.4);view.shake=reducedMotion?0:.2;}
      if(e.type==='travel'){view.portalGroups.forEach(p=>{p.texture.dispose();p.material.dispose();});view.clearDynamic();view.buildRealm(e.realm);view.cameraTarget.set(0,.4,0);view.camera.position.set(15,20,15);announce(REALMS[e.realm]);loadoutKey='';}
      if(e.type==='shrine')toast(REALMS[e.realm].blessing+' · '+REALMS[e.realm].benefit);
      if(e.type==='elite')toast('An ancient sentinel has entered the realm.');
      if(e.type==='boss'){toast('The Hollow Warden awakens. Watch the warning circles.');view.shake=reducedMotion?0:.8;}
      if(e.type==='evolve')toast((UPGRADES.find(u=>u.id===e.id)?.evolved||'Your weapon')+' awakened!');
      sound(e.type);
    }
    if(game.state==='upgrade')showUpgrade();if(game.state==='won'||game.state==='lost')showEnd();
  }
  function frame(ms){
    requestAnimationFrame(frame);const elapsed=Math.min((ms-lastTime)/1000||.016,.25),dt=Math.min(elapsed,.05);lastTime=ms;titleTime+=elapsed;
    if(game){const input={x:((keys.has('KeyD')||keys.has('ArrowRight'))?1:0)-((keys.has('KeyA')||keys.has('ArrowLeft'))?1:0)+stick.x,y:((keys.has('KeyW')||keys.has('ArrowUp'))?1:0)-((keys.has('KeyS')||keys.has('ArrowDown'))?1:0)-stick.y,glide:keys.has('Space')||touchGlide};if(game.state==='running'){accumulator+=elapsed;while(accumulator>=.02&&game.state==='running'){game.step(.02,input);accumulator-=.02;}}else accumulator=0;handleEvents();hudTime+=elapsed;if(hudTime>.07){updateHud();hudTime=0;}const flash=Number($('damage-flash').style.opacity)||0;if(flash>0)$('damage-flash').style.opacity=Math.max(0,flash-elapsed*2.7);}
    view.render(game,dt,titleTime);
  }

  document.querySelectorAll('[data-hero]').forEach(button=>button.addEventListener('click',()=>{selectedHero=button.dataset.hero;document.querySelectorAll('[data-hero]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});$('hero-perk').textContent=HEROES[selectedHero].perk;view.makeHero(selectedHero);sound('choose');}));
  $('start-button').addEventListener('click',start);$('retry-button').addEventListener('click',start);$('resume-button').addEventListener('click',resume);$('pause-button').addEventListener('click',()=>game?.state==='paused'?resume():pause());$('quit-button').addEventListener('click',home);$('end-home-button').addEventListener('click',home);
  $('home-link').addEventListener('click',e=>{e.preventDefault();if(!game)home();else if(game.state==='running')pause();});
  $('sound-button').addEventListener('click',()=>{soundEnabled=!soundEnabled;storage.sound=soundEnabled;save();updateSoundButton();sound('choose');});
  $('fullscreen-button').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(_){toast('Fullscreen is unavailable in this browser.');}});
  $('help-button').addEventListener('click',()=>auxiliaryOpen('help-dialog'));$('help-done').addEventListener('click',()=>auxiliaryClose('help-dialog'));
  $('map-button').addEventListener('click',()=>openMap());$('world-preview-button').addEventListener('click',()=>openMap());$('pause-map-button').addEventListener('click',()=>openMap(true));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.dataset.close==='map-dialog'?closeMap():auxiliaryClose(b.dataset.close)));
  $('interact-button').addEventListener('click',()=>{if(game&&!game.interact()&&game.travelCooldown>0)toast('The gate is recharging.');});
  document.addEventListener('keydown',e=>{
    const nativeControl=e.target instanceof Element&&!!e.target.closest('button,a,input,select,textarea,[contenteditable="true"]');
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&game?.state==='running'&&!document.querySelector('dialog[open]')&&!nativeControl)e.preventDefault();
    if(e.repeat)return;
    if($('upgrade-dialog').open){const n=Number(e.key)-1;if(n>=0&&n<game.choices.length)chooseUpgrade(game.choices[n].id);return;}
    if(e.code==='Escape')return;
    if($('help-dialog').open||$('map-dialog').open||$('end-dialog').open)return;
    if(nativeControl&&['Space','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))return;
    if(e.code==='KeyP'){game?.state==='paused'?resume():pause();return;}
    if(e.code==='KeyM'){openMap($('pause-dialog').open);return;}
    if(e.code==='KeyE'&&game){if(!game.interact()&&game.interaction?.kind==='gate')toast('The gate is recharging.');return;}
    if(e.code==='ShiftLeft'||e.code==='ShiftRight')game?.dash();
    if(e.code==='Space')game?.jump();
    keys.add(e.code);
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  // Native dialog cancellation preserves pause ownership and cannot dismiss upgrades.
  $('upgrade-dialog').addEventListener('cancel',e=>e.preventDefault());$('end-dialog').addEventListener('cancel',e=>e.preventDefault());
  $('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('map-dialog').addEventListener('cancel',e=>{e.preventDefault();closeMap();});$('help-dialog').addEventListener('cancel',e=>{e.preventDefault();auxiliaryClose('help-dialog');});
  window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!document.querySelector('dialog[open]')&&game?.state==='running'){e.preventDefault();pause();}},true);
  function focusLost(){keys.clear();stick.x=stick.y=0;touchGlide=false;$('joystick-knob').style.transform='';if(game?.state==='running')pause();}
  window.addEventListener('blur',focusLost);document.addEventListener('visibilitychange',()=>{if(document.hidden)focusLost();});window.addEventListener('resize',()=>view?.resize());
  let joystickPointer=null;
  const joystick=$('joystick');
  function moveStick(e){if(e.pointerId!==joystickPointer)return;const r=joystick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.max(1,Math.hypot(dx,dy)/40);stick.x=clamp(dx/len/40,-1,1);stick.y=clamp(dy/len/40,-1,1);$('joystick-knob').style.transform=`translate(${stick.x*35}px,${stick.y*35}px)`;}
  joystick.addEventListener('pointerdown',e=>{joystickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);moveStick(e);});joystick.addEventListener('pointermove',moveStick);
  function releaseStick(e){if(e.pointerId!==joystickPointer)return;joystickPointer=null;stick.x=stick.y=0;$('joystick-knob').style.transform='';}
  joystick.addEventListener('pointerup',releaseStick);joystick.addEventListener('pointercancel',releaseStick);joystick.addEventListener('lostpointercapture',releaseStick);
  $('touch-dash').addEventListener('pointerdown',e=>{e.preventDefault();game?.dash();});
  $('touch-jump').addEventListener('pointerdown',e=>{e.preventDefault();$('touch-jump').setPointerCapture(e.pointerId);touchGlide=true;game?.jump();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])$('touch-jump').addEventListener(name,()=>{touchGlide=false;});
  updateBest();updateSoundButton();
  try{if(typeof THREE==='undefined')throw new Error('The 3D library did not load. Keep all game files together, then open index.html.');view=new WorldView();requestAnimationFrame(frame);}catch(error){console.error(error);$('error-message').textContent=error.message;$('error-screen').hidden=false;}
  // A read-only diagnostic snapshot supports deterministic browser verification.
  Object.defineProperty(window,'relicWilds',{value:Object.freeze({get snapshot(){return game?{state:game.state,time:game.time,realm:game.realm,level:game.level,hp:game.player.hp,kills:game.kills,visited:[...game.visited],shrines:[...game.shrines],enemies:game.enemies.length,position:{x:game.player.x,y:game.player.y,z:game.player.z}}:{state:'title',realm:view?.realm};}})});
})();
