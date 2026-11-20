/* RELIC WILDS simulation. Rendering and browser state live in app.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BonkCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TAU = Math.PI * 2;
  const HEROES = {
    pip: { name: 'Ari', title: 'The wayfarer', hp: 100, speed: 6, weapon: 'ember', color: '#72cfc8', perk: '+20% damage · Rune blade', damage: 1.2 },
    pebble: { name: 'Rook', title: 'The stonebound', hp: 150, speed: 5.1, weapon: 'orbit', color: '#b7b8bd', perk: '+50 health · Orbiting relics', damage: 1 },
    sprig: { name: 'Fern', title: 'The wildling', hp: 85, speed: 7, weapon: 'leaf', color: '#b3ce78', perk: 'Fast movement · Wind blades', damage: 1 }
  };
  const REALMS = [
    { id: 'verdant', name: 'Verdant Reach', subtitle: 'Where the old forest remembers', color: '#a3c874', sky: '#d4e8d3', ground: '#88aa60', fog: '#cadfc6', accent: '#e6cc81', blessing: 'Forest grace', benefit: '+45% shard collection range', links: [1, 5, 3] },
    { id: 'tide', name: 'Tideglass Coast', subtitle: 'Follow the wind beyond the horizon', color: '#76c9c6', sky: '#cbe9e6', ground: '#d5c18c', fog: '#d1e8de', accent: '#53c7d4', blessing: 'Ocean heart', benefit: '+25 maximum health. Restore 35 health.', links: [0, 2, 4] },
    { id: 'dusk', name: 'Dusk Hollow', subtitle: 'A light between two worlds', color: '#ad91ca', sky: '#555b80', ground: '#636a8d', fog: '#73728c', accent: '#f4b583', blessing: 'Twilight might', benefit: '+18% damage to all weapons', links: [1, 3, 5] },
    { id: 'sky', name: 'Zephyr Isles', subtitle: 'The earth ends. The adventure does not.', color: '#abd6df', sky: '#cae6ef', ground: '#a3b97a', fog: '#e0eff0', accent: '#f4dd9b', blessing: 'Skyward haste', benefit: 'All weapons attack 10% faster', links: [2, 4, 0] },
    { id: 'ember', name: 'Ember Depths', subtitle: 'An ancient fire stirs below', color: '#d59b74', sky: '#6d6468', ground: '#706a63', fog: '#aa8e7e', accent: '#ffb469', blessing: 'Ember renewal', benefit: 'Restore 1 health every second', links: [3, 5, 1] },
    { id: 'moon', name: 'Moonveil Ruins', subtitle: 'Every ending holds another beginning', color: '#b6b9de', sky: '#5a6986', ground: '#7e8f9d', fog: '#9aabc1', accent: '#e3d99e', blessing: 'Timeless stride', benefit: '+10% movement speed', links: [4, 0, 2] }
  ];
  const GATES = [{ x: -16, z: -16 }, { x: 16, z: -16 }, { x: 0, z: 21 }];
  const UPGRADES = [
    { id: 'ember', name: 'Rune blade', category: 'WEAPON', icon: 'sword', desc: 'A spectral blade seeks the nearest enemy.', next: 'More damage and faster blades. Extra shot at rank 4.', evolved: 'Dawnbreaker', max: 7 },
    { id: 'orbit', name: 'Orbiting relics', category: 'WEAPON', icon: 'orbit', desc: 'Two ancient stones circle you and strike enemies.', next: 'Add another relic and increase impact damage.', evolved: 'Celestial orbit', max: 7 },
    { id: 'nova', name: 'Thunder bloom', category: 'WEAPON', icon: 'bolt', desc: 'An electric bloom blasts everything nearby.', next: 'Bigger blooms, more damage, shorter cooldown.', evolved: 'Superbloom', max: 7 },
    { id: 'leaf', name: 'Wind blades', category: 'WEAPON', icon: 'leaf', desc: 'Send a fan of piercing wind through the swarm.', next: 'More blades, more damage, faster volleys.', evolved: 'Tempest wings', max: 7 },
    { id: 'power', name: 'Wild heart', category: 'CHARM', icon: 'heart', desc: '+18% damage to all weapons.', max: 5 },
    { id: 'haste', name: 'Quick paws', category: 'CHARM', icon: 'wind', desc: 'All weapons attack 10% faster.', max: 5 },
    { id: 'magnet', name: 'Pocket gravity', category: 'CHARM', icon: 'magnet', desc: '+45% shard collection range.', max: 4 },
    { id: 'vitality', name: 'Second breakfast', category: 'CHARM', icon: 'plus', desc: '+25 maximum health. Restore 35 health.', max: 5 },
    { id: 'regen', name: 'Forest remedy', category: 'CHARM', icon: 'sprout', desc: 'Restore 1 health every second.', max: 4 },
    { id: 'speed', name: 'Trail runner', category: 'CHARM', icon: 'boot', desc: '+10% movement speed.', max: 3 }
  ];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function seeded(seed) {
    return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  class Game {
    constructor(hero = 'pip', seed = Date.now()) {
      if (!HEROES[hero]) throw new Error('Unknown creature');
      this.random = seeded(seed); this.hero = hero; this.state = 'running'; this.time = 0;
      this.player = { x: 0, z: 0, y: 0, vy: 0, gliding: false, stamina: 1, hp: HEROES[hero].hp, maxHp: HEROES[hero].hp, speed: HEROES[hero].speed, radius: .52, facing: 0, invincible: 0, dash: 0, dashCooldown: 0, dx: 0, dz: 1 };
      this.enemies = []; this.shards = []; this.projectiles = []; this.hazards = []; this.events = [];
      this.level = 1; this.xp = 0; this.xpNeed = 12; this.kills = 0; this.nextId = 1; this.ranks = { [HEROES[hero].weapon]: 1 };
      this.cooldowns = { ember: .3, nova: 1.5, leaf: .4 }; this.spawnTimer = .2; this.eliteMinute = 0;
      this.bossSpawned = false; this.boss = null; this.choices = []; this.orbitAngle = 0; this.damageTaken = 0; this.damageDealt = 0;
      this.realm = 0; this.visited = new Set([0]); this.shrines = new Set(); this.travelCooldown = 0; this.shrineCharge = 0;
    }
    emit(type, data = {}) { if (this.events.length < 300) this.events.push({ type, ...data }); }
    drainEvents() { const out = this.events; this.events = []; return out; }
    rank(id) { return this.ranks[id] || 0; }
    get damageMultiplier() { return HEROES[this.hero].damage * (1 + this.rank('power') * .18); }
    get cooldownMultiplier() { return Math.pow(.9, this.rank('haste')); }
    get magnetRadius() { return 2.3 * (1 + this.rank('magnet') * .45); }
    pause() { if (this.state === 'running') this.state = 'paused'; }
    resume() { if (this.state === 'paused') this.state = 'running'; }
    dash() {
      const p = this.player;
      if (this.state !== 'running' || p.dashCooldown > 0) return false;
      p.dash = .22; p.invincible = Math.max(p.invincible, .38); p.dashCooldown = 3.1;
      this.emit('dash', { x: p.x, z: p.z }); return true;
    }
    jump() { const p = this.player; if (this.state !== 'running' || p.y > .01) return false; p.vy = 9; p.y = .02; this.emit('jump'); return true; }
    travel(destination) {
      if (this.state !== 'running' || this.travelCooldown > 0 || !REALMS[this.realm].links.includes(destination)) return false;
      this.realm = destination; this.visited.add(destination); this.travelCooldown = 5;
      this.player.x = 0; this.player.z = 0; this.player.y = 0; this.player.vy = 0; this.player.invincible = 2;
      this.enemies = this.enemies.filter(e => e.type === 'boss' && !e.dead);
      if (this.boss && !this.boss.dead) { this.boss.x = 12; this.boss.z = -12; }
      // Shards travel with the player; they cannot be duplicated or lost at a gate.
      const banked = this.shards.reduce((sum, s) => sum + s.value, 0); this.shards = [];
      this.projectiles = []; this.hazards = []; this.shrineCharge = 0;
      this.emit('travel', { realm: destination }); if (banked) this.collect(banked); return true;
    }
    get interaction() {
      if (Math.hypot(this.player.x, this.player.z + 7) < 3.4 && !this.shrines.has(this.realm)) return { kind: 'shrine', name: REALMS[this.realm].blessing };
      for (let i = 0; i < GATES.length; i++) if (distance(this.player, GATES[i]) < 3.5) return { kind: 'gate', destination: REALMS[this.realm].links[i], name: REALMS[REALMS[this.realm].links[i]].name };
      return null;
    }
    interact() {
      if (this.state !== 'running') return false;
      const nearby = this.interaction; if (!nearby) return false;
      if (nearby.kind === 'gate') return this.travel(nearby.destination);
      this.shrines.add(this.realm);
      const gifts = ['magnet', 'vitality', 'power', 'haste', 'regen', 'speed'];
      const gift = gifts[this.realm]; this.ranks[gift] = this.rank(gift) + 1;
      if (gift === 'vitality') { this.player.maxHp += 25; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35); }
      this.player.invincible = Math.max(this.player.invincible, 1.5);
      this.emit('shrine', { realm: this.realm, x: 0, z: -7 });
      this.emit('nova', { x: 0, z: -7, radius: 9 });
      for (const e of this.enemies) if (Math.hypot(e.x, e.z + 7) < 9) this.hurtEnemy(e, 100 * this.damageMultiplier, 5);
      return true;
    }
    spawnEnemy(type, x, z, elite = false) {
      if (this.enemies.length >= 170 && type !== 'boss') return null;
      if (x === undefined) { const a = this.random() * TAU, r = 20 + this.random() * 7; x = this.player.x + Math.cos(a) * r; z = this.player.z + Math.sin(a) * r; }
      const specs = { slime: [17, 1.65, .6, 10], mushroom: [29, 1.3, .7, 14], bat: [12, 2.85, .48, 9], boar: [48, 2.05, .85, 17], boss: [2900, 1.3, 2.1, 26] };
      const [baseHp, speed, radius, damage] = specs[type];
      const scale = type === 'boss' ? 1 : 1 + this.time / 170;
      const enemy = { id: this.nextId++, type, x, z, hp: baseHp * scale * (elite ? 3 : 1), maxHp: baseHp * scale * (elite ? 3 : 1), speed: speed + (type === 'boss' ? 0 : this.time / 650), radius: radius * (elite ? 1.3 : 1), damage, elite, hitFlash: 0, orbitHit: 0, attackTimer: 3, phase: 0, dead: false, knockX: 0, knockZ: 0 };
      this.enemies.push(enemy); if (type === 'boss') this.boss = enemy;
      return enemy;
    }
    nearest(range = 30) {
      let best = null, near = range;
      for (const e of this.enemies) { if (e.dead) continue; const d = distance(e, this.player); if (d < near) { near = d; best = e; } }
      return best;
    }
    hurtEnemy(e, damage, knock = 0) {
      if (e.dead || this.state !== 'running') return;
      const dealt = Math.min(e.hp, damage); e.hp -= damage; e.hitFlash = .1; this.damageDealt += dealt;
      if (knock) { const d = Math.max(.01, distance(e, this.player)); e.knockX += (e.x - this.player.x) / d * knock; e.knockZ += (e.z - this.player.z) / d * knock; }
      this.emit('hit', { x: e.x, z: e.z, damage: Math.round(damage), boss: e.type === 'boss' });
      if (e.hp <= 0) {
        e.dead = true; this.kills++; this.emit('pop', { x: e.x, z: e.z, type: e.type, elite: e.elite });
        if (e.type === 'boss') { this.state = 'won'; this.emit('end', { won: true }); return; }
        this.shards.push({ id: this.nextId++, x: e.x, z: e.z, value: e.elite ? 18 : e.type === 'boar' ? 4 : 2 });
        // Preserve XP when the player leaves shards behind for a long run.
        if (this.shards.length > 350) { const first = this.shards.shift(); let near = this.shards[0]; for (const s of this.shards) if (distance(s, first) < distance(near, first)) near = s; near.value += first.value; }
        if (this.random() < .025 && this.player.hp < this.player.maxHp) { this.player.hp = Math.min(this.player.maxHp, this.player.hp + 5); this.emit('heal', { amount: 5 }); }
      }
    }
    hurtPlayer(damage) {
      const p = this.player;
      if (p.invincible > 0 || this.state !== 'running') return;
      p.hp = Math.max(0, p.hp - damage); p.invincible = .8; this.damageTaken += damage; this.emit('hurt', { damage });
      if (p.hp === 0) { this.state = 'lost'; this.emit('end', { won: false }); }
    }
    collect(amount) { this.xp += amount; this.checkLevel(); }
    checkLevel() {
      if (this.xp >= this.xpNeed && this.state === 'running') {
        this.xp -= this.xpNeed; this.level++; this.xpNeed = Math.floor(10 + this.level * 4 + Math.pow(this.level, 1.35));
        this.state = 'upgrade'; this.choices = this.rollUpgrades(); this.emit('level', { level: this.level });
      }
    }
    rollUpgrades() {
      const pool = UPGRADES.filter(u => this.rank(u.id) < u.max);
      if (!pool.length) return [{ id: 'feast', name: 'A well-earned snack', category: 'RESTORE', icon: 'plus', desc: 'Restore all health.', max: Infinity }];
      const picks = [];
      // Always offer one available weapon so a run can grow into a build.
      const weapons = pool.filter(u => u.category === 'WEAPON');
      if (weapons.length) picks.push(weapons[Math.floor(this.random() * weapons.length)]);
      while (picks.length < Math.min(3, pool.length)) {
        const available = pool.filter(u => !picks.includes(u)); picks.push(available[Math.floor(this.random() * available.length)]);
      }
      return picks;
    }
    choose(id) {
      if (this.state !== 'upgrade' || !this.choices.some(u => u.id === id)) return false;
      if (id === 'feast') this.player.hp = this.player.maxHp;
      else this.ranks[id] = this.rank(id) + 1;
      if (id === 'vitality') { this.player.maxHp += 25; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35); }
      if (this.rank(id) === 7) this.emit('evolve', { id });
      this.choices = []; this.state = 'running'; this.emit('choose', { id }); this.checkLevel(); return true;
    }
    fire(type, target, angleOffset = 0) {
      const p = this.player, rank = this.rank(type), angle = Math.atan2(target.z - p.z, target.x - p.x) + angleOffset;
      const evolved = rank === 7;
      this.projectiles.push({ id: this.nextId++, type, x: p.x, z: p.z, vx: Math.cos(angle), vz: Math.sin(angle), life: type === 'leaf' ? 1.65 : 2.5, speed: type === 'leaf' ? 14 : 17, damage: (type === 'ember' ? 13 + rank * 5 : 10 + rank * 4) * this.damageMultiplier * (evolved ? 1.5 : 1), radius: type === 'ember' ? .28 : .42, hits: new Set(), targetId: target.id });
    }
    updateWeapons(dt) {
      for (const id of ['ember', 'leaf', 'nova']) this.cooldowns[id] -= dt;
      const target = this.nearest(26), p = this.player;
      if (target && this.rank('ember') && this.cooldowns.ember <= 0) {
        const rank = this.rank('ember'), count = rank >= 7 ? 4 : rank >= 4 ? 2 : 1;
        for (let i = 0; i < count; i++) this.fire('ember', target, (i - (count - 1) / 2) * .18);
        this.cooldowns.ember = Math.max(.25, .85 - rank * .055) * this.cooldownMultiplier; this.emit('shoot');
      }
      if (target && this.rank('leaf') && this.cooldowns.leaf <= 0) {
        const rank = this.rank('leaf'), count = 2 + Math.ceil(rank / 2);
        for (let i = 0; i < count; i++) this.fire('leaf', target, (i - (count - 1) / 2) * .19);
        this.cooldowns.leaf = (1.55 - rank * .1) * this.cooldownMultiplier; this.emit('leaf');
      }
      if (this.rank('nova') && this.cooldowns.nova <= 0 && this.nearest(5 + this.rank('nova') * .6)) {
        const rank = this.rank('nova'), radius = 4 + rank * .65;
        this.emit('nova', { x: p.x, z: p.z, radius });
        for (const e of this.enemies) if (distance(p, e) < radius + e.radius) this.hurtEnemy(e, (20 + rank * 12) * this.damageMultiplier, 4);
        this.cooldowns.nova = (4.5 - rank * .28) * this.cooldownMultiplier;
      }
      this.orbitAngle += dt * (2.4 + this.rank('haste') * .3);
      if (this.rank('orbit')) {
        const rank = this.rank('orbit'), count = rank + 1;
        for (const e of this.enemies) {
          e.orbitHit -= dt;
          if (e.dead || e.orbitHit > 0) continue;
          for (let i = 0; i < count; i++) {
            const a = this.orbitAngle + i * TAU / count, rock = { x: p.x + Math.cos(a) * 2.6, z: p.z + Math.sin(a) * 2.6 };
            if (distance(e, rock) < e.radius + .5) { this.hurtEnemy(e, (10 + rank * 5) * this.damageMultiplier, 2.5); e.orbitHit = .45; break; }
          }
        }
      }
    }
    step(dt, input = { x: 0, y: 0 }) {
      if (this.state !== 'running' || !Number.isFinite(dt) || dt <= 0) return;
      dt = Math.min(dt, .05); this.time += dt;
      const p = this.player;
      this.travelCooldown = Math.max(0, this.travelCooldown - dt);
      p.gliding = p.y > .1 && p.vy < 0 && !!input.glide && p.stamina > 0;
      if (p.y > 0) { p.vy -= (p.gliding ? 4 : 23) * dt; if (p.gliding) { p.vy = Math.max(p.vy, -.9); p.stamina = Math.max(0, p.stamina - dt * .38); } p.y += p.vy * dt; if (p.y <= 0) { p.y = 0; p.vy = 0; p.gliding = false; } }
      else p.stamina = Math.min(1, p.stamina + dt * .65);
      p.invincible = Math.max(0, p.invincible - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt);
      const ix = Number.isFinite(input.x) ? input.x : 0, iy = Number.isFinite(input.y) ? input.y : 0;
      const len = Math.max(1, Math.hypot(ix, iy)), mx = ix / len, my = iy / len;
      let dx = (mx - my) * Math.SQRT1_2, dz = (-mx - my) * Math.SQRT1_2;
      if (Math.hypot(dx, dz) > .05) { p.dx = dx; p.dz = dz; p.facing = Math.atan2(dx, dz); }
      if (p.dash > 0) { dx = p.dx * 4.2; dz = p.dz * 4.2; p.dash = Math.max(0, p.dash - dt); }
      const speed = p.speed * (1 + this.rank('speed') * .1) * (p.gliding ? 1.3 : 1);
      p.x = clamp(p.x + dx * speed * dt, -65, 65); p.z = clamp(p.z + dz * speed * dt, -65, 65);
      if (this.rank('regen')) p.hp = Math.min(p.maxHp, p.hp + this.rank('regen') * dt);
      this.spawnTimer -= dt;
      if (this.time < 240 && this.spawnTimer <= 0) {
        const batch = 1 + Math.floor(this.time / 85);
        for (let i = 0; i < batch; i++) { const r = this.random(); this.spawnEnemy(this.time > 65 && r > .87 ? 'boar' : this.time > 25 && r > .65 ? 'bat' : r > .4 ? 'mushroom' : 'slime'); }
        this.spawnTimer = Math.max(.25, .85 - this.time / 460);
      }
      const minute = Math.floor(this.time / 60);
      if (minute > this.eliteMinute && minute < 4) { this.eliteMinute = minute; this.spawnEnemy('boar', undefined, undefined, true); this.emit('elite'); }
      if (this.time >= 240 && !this.bossSpawned) {
        this.bossSpawned = true; this.spawnEnemy('boss', p.x + 12, p.z - 12); this.emit('boss');
      }
      if (this.bossSpawned && this.spawnTimer <= 0 && this.boss && !this.boss.dead) { this.spawnEnemy('slime'); this.spawnTimer = 1.4; }
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = Math.max(.01, distance(p, e)), towardX = (p.x - e.x) / d, towardZ = (p.z - e.z) / d;
        e.hitFlash = Math.max(0, e.hitFlash - dt); e.phase += dt;
        e.x += (towardX * e.speed + e.knockX) * dt; e.z += (towardZ * e.speed + e.knockZ) * dt;
        e.knockX *= Math.exp(-10 * dt); e.knockZ *= Math.exp(-10 * dt);
        if (e.type === 'boss') {
          e.attackTimer -= dt;
          if (e.attackTimer <= 0) {
            const attacks = e.hp < e.maxHp * .5 ? 3 : 1;
            for (let i = 0; i < attacks; i++) this.hazards.push({ id: this.nextId++, x: p.x + (i ? (this.random() - .5) * 10 : 0), z: p.z + (i ? (this.random() - .5) * 10 : 0), radius: 3, timer: 1.4, duration: 1.4, fired: false, life: 1.8 });
            e.attackTimer = e.hp < e.maxHp * .5 ? 2.2 : 3.2; this.emit('warning');
          }
        }
        if (d < p.radius + e.radius && (p.y < 1.1 || e.type === 'bat' || e.type === 'boss')) this.hurtPlayer(e.damage);
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
      this.updateWeapons(dt);
      for (const b of this.projectiles) {
        b.life -= dt;
        if (b.type === 'ember') {
          const target = this.enemies.find(e => e.id === b.targetId && !e.dead);
          if (target) { const d = distance(target, b); if (d > .01) { const steer = Math.min(1, dt * 5); b.vx += ((target.x - b.x) / d - b.vx) * steer; b.vz += ((target.z - b.z) / d - b.vz) * steer; const n = Math.max(.01, Math.hypot(b.vx, b.vz)); b.vx /= n; b.vz /= n; } }
        }
        b.x += b.vx * b.speed * dt; b.z += b.vz * b.speed * dt;
        for (const e of this.enemies) {
          if (e.dead || b.hits.has(e.id)) continue;
          if (distance(b, e) < b.radius + e.radius) { this.hurtEnemy(e, b.damage, 1.2); b.hits.add(e.id); if (b.type === 'ember') { b.life = 0; break; } }
        }
      }
      this.projectiles = this.projectiles.filter(b => b.life > 0);
      for (const h of this.hazards) { h.timer -= dt; h.life -= dt; if (h.timer <= 0 && !h.fired) { h.fired = true; this.emit('slam', { x: h.x, z: h.z }); if (distance(p, h) < h.radius + p.radius && p.y < 1.1) this.hurtPlayer(30); } }
      this.hazards = this.hazards.filter(h => h.life > 0);
      for (const s of this.shards) {
        const d = distance(s, p);
        if (d < this.magnetRadius + .5 && d > .01) { const pull = Math.min(d, (13 + 18 / Math.max(d, .2)) * dt); s.x += (p.x - s.x) / d * pull; s.z += (p.z - s.z) / d * pull; }
        if (distance(s, p) < .65) { s.collected = true; this.collect(s.value); this.emit('collect'); }
      }
      this.shards = this.shards.filter(s => !s.collected);
      this.enemies = this.enemies.filter(e => !e.dead);
      // Reposition distant enemies so the bounded arena stays active.
      for (const e of this.enemies) if (e.type !== 'boss' && distance(e, p) > 50) { const a = this.random() * TAU; e.x = p.x + Math.cos(a) * 24; e.z = p.z + Math.sin(a) * 24; }
    }
  }
  return { Game, HEROES, REALMS, GATES, UPGRADES, seeded, clamp };
});
