'use strict';
const { Game, REALMS, UPGRADES, seeded, xpForLevel } = require('../core.js');
const { check, uuid } = require('./security.cjs');
const ACTOR_FIELDS = [
  'hero',
  'player',
  'permanent',
  'ranks',
  'gear',
  'stats',
  'cooldowns',
  'orbitAngle',
  'energy',
  'streak',
  'streakTimer',
  'bestStreak',
  'aimMode',
  'cameraYaw',
  'lockedTarget',
  'refreshes',
  'skips',
  'banishes',
  'banished',
  'choices',
  'damageBySource',
  'legacySlots',
  'weaponUpgrades',
  'orbitActive',
];
const WORLD_FIELDS = Object.keys(new Game('link', 1)).filter(
  (key) => !ACTOR_FIELDS.includes(key) && !['random', 'events'].includes(key),
);
const pack = (value) =>
  Object.is(value, -0)
    ? { $number: '-0' }
    : value instanceof Set
      ? { $set: [...value].map(pack) }
      : Array.isArray(value)
        ? value.map(pack)
        : value && typeof value === 'object'
          ? Object.fromEntries(
              Object.entries(value)
                .filter(([, item]) => item !== undefined)
                .map(([key, item]) => [key, pack(item)]),
            )
          : value === Infinity
            ? { $number: 'Infinity' }
            : value;
function unpack(value) {
  if (!value || typeof value !== 'object') return value;
  if (Object.hasOwn(value, '$set')) return new Set(value.$set.map(unpack));
  if (value.$number === 'Infinity') return Infinity;
  if (value.$number === '-0') return -0;
  if (Array.isArray(value)) return value.map(unpack);
  check(
    !Object.keys(value).some((key) => ['__proto__', 'constructor', 'prototype'].includes(key)),
    500,
    'Invalid persisted simulation.',
  );
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, unpack(item)]));
}
class PartyGame extends Game {
  constructor(id, players, options = {}) {
    check(
      players.length >= 1 &&
        players.length <= 4 &&
        players.every((player) => uuid(player.id)) &&
        new Set(players.map((player) => player.id)).size === players.length,
      400,
      'A party needs one to four distinct authenticated members.',
    );
    super(players[0].hero, options.seed ?? 1, {
      ...options,
      runId: id,
      upgrades: players[0].upgrades,
    });
    this.members = new Map();
    this.actorId = players[0].id;
    this.inputs = new Map();
    this.player.accountId = this.actorId;
    this.captureActor();
    for (const player of players.slice(1)) {
      const actor = new Game(player.hero, 1, { ...options, runId: id, upgrades: player.upgrades });
      actor.player.accountId = player.id;
      this.members.set(player.id, Object.fromEntries(ACTOR_FIELDS.map((key) => [key, actor[key]])));
    }
  }
  captureActor() {
    if (this.actorId && this.members)
      this.members.set(
        this.actorId,
        Object.fromEntries(ACTOR_FIELDS.map((key) => [key, this[key]])),
      );
  }
  withActor(id, work) {
    check(this.members.has(id), 404, 'Player is not in this room.');
    const previous = this.actorId;
    this.captureActor();
    Object.assign(this, this.members.get(id));
    this.actorId = id;
    try {
      return work();
    } finally {
      this.captureActor();
      Object.assign(this, this.members.get(previous));
      this.actorId = previous;
    }
  }
  alive() {
    return [...this.members.values()]
      .map((member) => member.player)
      .filter((player) => player.hp > 0);
  }
  targetFor(entity) {
    return (
      this.alive().reduce(
        (best, player) =>
          !best ||
          Math.hypot(entity.x - player.x, entity.z - player.z) <
            Math.hypot(entity.x - best.x, entity.z - best.z)
            ? player
            : best,
        null,
      ) || this.player
    );
  }
  damageTargets() {
    return this.alive();
  }
  pickupTarget(item) {
    return this.targetFor(item);
  }
  pickupRadius(player) {
    return this.withActor(player.accountId, () => this.magnetRadius);
  }
  collectLootFor(drop, player) {
    return this.withActor(player.accountId, () => super.collectLootFor(drop));
  }
  projectileOwner(projectile) {
    return this.members.get(projectile.actorId)?.player || this.player;
  }
  hitProjectile(enemy, projectile, knock = 1.2) {
    return this.withActor(projectile.actorId || this.actorId, () =>
      super.hitProjectile(enemy, projectile, knock),
    );
  }
  hitStatus(enemy, effect) {
    return this.withActor(effect.ownerId || this.actorId, () => super.hitStatus(enemy, effect));
  }
  updateActors(dt) {
    for (const [id, member] of this.members)
      if (member.player.hp > 0)
        this.withActor(id, () => this.updatePlayer(dt, this.inputs.get(id) || { x: 0, y: 0 }));
  }
  updateAllWeapons(dt) {
    for (const [id, member] of this.members)
      if (member.player.hp > 0) this.withActor(id, () => this.updateWeapons(dt));
  }
  hurtPlayer(damage, attacker, target = this.player) {
    return this.withActor(target.accountId, () => {
      super.hurtPlayer(damage, attacker);
      if (this.state === 'lost' && this.alive().length) this.state = 'running';
    });
  }
  emit(type, data = {}) {
    if (type === 'end' && !data.won && this.members && this.alive().length) {
      super.emit('playerDown', { accountId: this.actorId });
      return;
    }
    super.emit(type, { ...data, accountId: this.actorId || null });
  }
  collect(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const members = [...this.members.values()];
    this.xp +=
      (amount * members.reduce((sum, member) => sum + member.stats.xpGain, 0)) / members.length;
    this.checkLevel();
  }
  checkLevel() {
    if (!this.members) return super.checkLevel();
    this.captureActor();
    if ([...this.members.values()].some((member) => member.choices.length)) {
      this.state = 'upgrade';
      return;
    }
    if (this.state !== 'running' || this.xp < this.xpNeed) return;
    this.xp -= this.xpNeed;
    this.level++;
    this.xpNeed = xpForLevel(this.level);
    this.state = 'upgrade';
    for (const id of this.members.keys())
      this.withActor(id, () => {
        this.choices = this.player.hp > 0 ? this.rollUpgrades() : [];
      });
    this.emit('level', { level: this.level });
  }
  chooseFor(id, kind, choice) {
    check(this.state === 'upgrade', 409, 'No upgrade is pending.');
    const actor = this.members.get(id);
    check(
      actor && actor.player.hp > 0 && actor.choices.length,
      409,
      'You have no pending upgrade.',
    );
    const accepted = this.withActor(id, () =>
      kind === 'choose'
        ? super.choose(choice)
        : kind === 'refresh'
          ? super.refreshChoices()
          : kind === 'skip'
            ? super.skipUpgrade()
            : super.banishChoice(choice),
    );
    check(accepted, 409, 'That upgrade action is unavailable.');
    this.captureActor();
    this.state = [...this.members.values()].some((member) => member.choices.length)
      ? 'upgrade'
      : 'running';
    if (this.state === 'running') this.checkLevel();
    return true;
  }
  resetPartyPositions() {
    for (const member of this.members.values())
      Object.assign(member.player, { x: 0, z: 0, y: 0, ground: 0, vy: 0, invincible: 2 });
  }
  travel(destination) {
    const result = super.travel(destination);
    if (result) this.resetPartyPositions();
    return result;
  }
  advanceStage() {
    const result = super.advanceStage();
    if (result) this.resetPartyPositions();
    return result;
  }
  activateShrine(realm = this.realm) {
    const result = super.activateShrine(realm);
    if (result)
      for (const id of this.members.keys())
        if (id !== this.actorId)
          this.withActor(id, () => {
            const gift = REALMS[realm].gift;
            this.ranks[gift] = this.rank(gift) + 1;
            if (gift === 'vitality') {
              const health = this.player.hp;
              this.refreshStats();
              this.player.hp = health;
              this.heal(35);
            }
          });
    return result;
  }
  action(id, kind, choice) {
    if (['choose', 'refresh', 'skip', 'banish'].includes(kind))
      return this.chooseFor(id, kind, choice);
    check(
      this.state === 'running' && this.members.get(id)?.player.hp > 0,
      409,
      'This player cannot act now.',
    );
    return this.withActor(id, () =>
      ({
        dash: () => this.dash(),
        jump: () => this.jump(),
        ultimate: () => this.ultimate(),
        interact: () => this.interact(),
        aim: () => this.toggleAim(),
        lock: () => this.lockTarget(),
      })[kind](),
    );
  }
  serialize() {
    this.captureActor();
    return pack({
      version: 1,
      randomState: this.random.getState(),
      world: Object.fromEntries(WORLD_FIELDS.map((key) => [key, this[key]])),
      members: [...this.members].map(([id, actor]) => ({ id, actor })),
    });
  }
  static restore(raw) {
    const saved = unpack(raw);
    check(
      saved?.version === 1 && Array.isArray(saved.members) && saved.members.length <= 4,
      500,
      'Unsupported saved room.',
    );
    const players = saved.members.map(({ id, actor }) => ({
      id,
      hero: actor.hero,
      upgrades: actor.permanent,
    }));
    const game = new PartyGame(saved.world.runId, players, {
      mode: saved.world.mode,
      difficulty: saved.world.difficulty,
    });
    for (const key of WORLD_FIELDS) if (Object.hasOwn(saved.world, key)) game[key] = saved.world[key];
    for (const { id, actor } of saved.members) {
      const defaults = game.members.get(id);
      const restored = { ...defaults, ...actor, cooldowns: { ...defaults.cooldowns, ...actor.cooldowns } };
      if (!actor.legacySlots) {
        const learned = item => (restored.ranks[item.id] || 0) - (item.category === 'CHARM' ? [...game.shrines].filter(index => REALMS[index].gift === item.id).length : 0);
        for (const [key, category] of [['weapons', 'WEAPON'], ['charms', 'CHARM']]) {
          const pending = restored.choices.some(choice => UPGRADES.some(item => item.id === choice.id && item.category === category && learned(item) <= 0));
          restored.legacySlots[key] = Math.min(6, UPGRADES.filter(item => item.category === category && learned(item) > 0).length + (pending ? 1 : 0));
        }
      }
      game.members.set(id, restored);
    }
    Object.assign(game, game.members.get(game.actorId));
    game.random = seeded(saved.randomState);
    game.xpNeed = xpForLevel(game.level);
    game.boss = game.boss ? game.enemies.find((enemy) => enemy.id === game.boss.id) || null : null;
    return game;
  }
  publicState(user) {
    this.captureActor();
    const own = this.members.get(user);
    check(own, 404, 'Player is not in this room.');
    return {
      state: this.state,
      time: this.time,
      realm: this.realm,
      stage: this.stage,
      level: this.level,
      xp: this.xp,
      xpNeed: this.xpNeed,
      kills: this.kills,
      shrines: [...this.shrines],
      players: [...this.members].map(([id, member]) => ({
        id,
        hero: member.hero,
        player: { ...member.player },
        ranks: member.ranks,
        energy: member.energy,
      })),
      own: {
        gear: own.gear,
        choices: own.choices.map((choice) => ({ id: choice.id, name: choice.name, rarity: choice.rarity ?? 0 })),
        refreshes: own.refreshes,
        skips: own.skips,
        banishes: own.banishes,
      },
      enemies: this.enemies
        .filter((enemy) => !enemy.dead)
        .map((enemy) => ({
          id: enemy.id,
          x: enemy.x,
          z: enemy.z,
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          enemyId: enemy.enemyId,
          bossId: enemy.bossId,
          action: enemy.action,
          statuses: Object.keys(enemy.statuses || {}),
        })),
      projectiles: this.projectiles.map((projectile) => ({
        id: projectile.id,
        type: projectile.type,
        x: projectile.x,
        y: projectile.y,
        z: projectile.z,
        age: projectile.age,
      })),
      shards: this.shards,
      loot: this.loot,
      hazards: this.hazards,
    };
  }
}
module.exports = { PartyGame };
