const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto');
const { PartyGame } = require('../party.cjs'),
  { Game } = require('../../core.js');
const a = crypto.randomUUID(),
  b = crypto.randomUUID();
const create = () =>
  new PartyGame(
    crypto.randomUUID(),
    [
      { id: a, hero: 'link' },
      { id: b, hero: 'zelda' },
    ],
    { mode: 'survival', seed: 123, flatTerrain: true },
  );

test('Adventure map transitions move the whole party and survive a room restart',()=>{
  const game=new PartyGame(crypto.randomUUID(),[{id:a,hero:'link'},{id:b,hero:'zelda'}],{mode:'adventure',seed:7});
  game.members.get(a).player.x=20;game.members.get(b).player.z=21;
  game.realmStages[6]=3;game.stageKills[6]=24;game.activateShrine(6);game.adventureDelay=.04;
  const restored=PartyGame.restore(game.serialize());assert.equal(restored.realm,7);assert.equal(restored.stage,1);
  for(const member of restored.members.values()){assert.equal(member.player.x,0);assert.equal(member.player.z,0);}
  game.step(.02);assert.equal(game.realm,6);game.step(.02);assert.equal(game.realm,7);
  for(const member of game.members.values()){assert.equal(member.player.x,0);assert.equal(member.player.z,0);}
  assert.equal(game.enterRealm(0),false);
});

test('weapon rarities and orbit timers remain actor-owned through choices and restart', () => {
  const game = create();
  game.collect(15);
  game.members.get(a).choices = [{ id: 'ember', rarity: 4 }];
  game.members.get(b).choices = [{ id: 'leaf', rarity: 1 }];
  Object.assign(game, game.members.get(a));
  game.chooseFor(a, 'choose', 'ember');
  game.chooseFor(b, 'choose', 'leaf');
  game.withActor(a, () => { game.orbitActive = 2; game.cooldowns.orbit = 3; });
  game.withActor(b, () => { game.orbitActive = 1; game.cooldowns.orbit = 4; });
  const restored = PartyGame.restore(JSON.parse(JSON.stringify(game.serialize())));
  assert.deepEqual(restored.members.get(a).weaponUpgrades, { ember: [4] });
  assert.deepEqual(restored.members.get(b).weaponUpgrades, { leaf: [1] });
  assert.equal(restored.members.get(a).orbitActive, 2);
  assert.equal(restored.members.get(b).orbitActive, 1);
  assert.equal(restored.members.get(a).cooldowns.orbit, 3);
  assert.equal(restored.members.get(b).cooldowns.orbit, 4);
});

test('older room snapshots gain defaults without dropping actors or oversized equipment', () => {
  const game = create();
  game.withActor(b, () => { game.ranks = { ember: 4, leaf: 1, bomb: 1, nova: 1 }; });
  const saved = JSON.parse(JSON.stringify(game.serialize()));
  for (const { actor } of saved.members) for (const key of ['weaponUpgrades', 'legacySlots', 'orbitActive']) delete actor[key];
  for (const { actor } of saved.members) delete actor.cooldowns.orbit;
  const restored = PartyGame.restore(saved);
  assert.equal(restored.members.get(a).ranks.ember, 1);
  assert.equal(restored.members.get(b).ranks.ember, 4);
  assert.equal(restored.members.get(b).legacySlots.weapons, 4);
  assert.equal(restored.members.get(b).orbitActive, 0);
  assert.equal(restored.members.get(b).cooldowns.orbit, 0.1);
  restored.withActor(b, () => assert.ok(Number.isFinite(restored.weaponStats('ember').damage)));
  assert.equal(restored.xpNeed, 15);
});
test('two actors share one clock and enemies target the nearest living player', () => {
  const game = create();
  game.spawnTimer = 999;
  game.members.get(b).player.x = 20;
  for (const member of game.members.values()) member.ranks = {};
  Object.assign(game, game.members.get(a));
  const enemy = game.spawnEnemy('slime', 24, 0);
  enemy.hp = 1000;
  game.inputs.set(a, { x: -1, y: 0, cameraYaw: 0 });
  game.inputs.set(b, { x: 1, y: 0, cameraYaw: 0 });
  for (let i = 0; i < 10; i++) game.step(0.02);
  assert.ok(Math.abs(game.time - 0.2) < 1e-10);
  assert.ok(game.members.get(a).player.x < 0);
  assert.ok(game.members.get(b).player.x > 20);
  assert.equal(game.targetFor(enemy).accountId, b);
  assert.ok(enemy.x < 24);
});
test('shared XP waits for separate valid choices, and menus freeze all actors', () => {
  const game = create();
  game.collect(15);
  assert.equal(game.level, 2);
  assert.equal(game.state, 'upgrade');
  const time = game.time;
  game.step(0.02);
  assert.equal(game.time, time);
  assert.throws(() => game.chooseFor(a, 'choose', 'unknown'));
  game.chooseFor(a, 'choose', game.members.get(a).choices[0].id);
  assert.equal(game.state, 'upgrade');
  assert.equal(game.members.get(a).choices.length, 0);
  assert.throws(() => game.chooseFor(a, 'choose', 'ember'));
  game.chooseFor(b, 'choose', game.members.get(b).choices[0].id);
  assert.equal(game.state, 'running');
  assert.equal(game.members.get(b).choices.length, 0);
});
test('peer weapons and status damage retain their owner and item modifiers', () => {
  const game = create();
  game.spawnTimer = 999;
  game.random = Object.assign(() => 0.99, { getState: () => 1 });
  const enemy = game.spawnEnemy('boar', 8, 0);
  enemy.hp = enemy.maxHp = 1000;
  game.withActor(b, () => {
    game.ranks.ember = 1;
    game.acquireGear('bracelet');
    game.fire('ember', enemy);
    game.applyStatus(enemy, 'burn', 100, 'firefruit');
  });
  const shot = game.projectiles[0];
  assert.equal(shot.actorId, b);
  const before = enemy.hp;
  game.hitProjectile(enemy, shot);
  assert.ok(enemy.hp < before);
  assert.ok(game.members.get(b).damageBySource.ember > 0);
  assert.equal(game.members.get(a).damageBySource.ember, undefined);
  game.updateStatuses(enemy, 0.5);
  assert.equal(game.members.get(b).damageBySource.firefruit, 18);
  assert.equal(game.members.get(a).damageBySource.firefruit, undefined);
});
test('one downed member does not end the party, and hazards can damage either actor', () => {
  const game = create();
  game.hurtPlayer(10000, null, game.members.get(b).player);
  assert.equal(game.state, 'running');
  assert.equal(game.members.get(b).player.hp, 0);
  assert.equal(game.drainEvents().filter((event) => event.type === 'end').length, 0);
  game.hurtPlayer(10000, null, game.members.get(a).player);
  assert.equal(game.state, 'lost');
  assert.equal(game.drainEvents().filter((event) => event.type === 'end').length, 1);
  const hazard = create();
  hazard.spawnTimer = 999;
  hazard.members.get(b).player.x = 10;
  hazard.addHazard(10, 0, 2, 0.01, 10);
  hazard.step(0.02);
  assert.equal(hazard.members.get(b).player.hp, 75);
  assert.equal(hazard.members.get(a).player.hp, 100);
});
test('an Adventure map change resets every actor and shrine gifts apply once to the whole party', () => {
  const game = new PartyGame(crypto.randomUUID(),[{id:a,hero:'link'},{id:b,hero:'zelda'}],{mode:'adventure'});
  game.activateShrine(game.realm);
  game.members.get(b).player.x = 20;
  assert.equal(game.enterRealm(7), true);
  for (const member of game.members.values()) assert.equal(member.player.x, 0);
  const before = new Map([...game.members].map(([id, member]) => [id, member.ranks.vitality || 0]));
  game.withActor(a, () => game.activateShrine(7));
  for (const [id, member] of game.members) assert.equal(member.ranks.vitality, before.get(id) + 1);
  assert.equal(game.activateShrine(7), false);
});
test('durable snapshots preserve RNG, builds, boss identity, projectiles and future simulation', () => {
  const game = create();
  game.spawnTimer = 999;
  game.spawnBoss('gohma');
  game.fire('ember', game.boss);
  game.projectiles[0].hits.add(777);
  game.withActor(b, () => game.acquireGear('radish'));
  for (let i = 0; i < 10; i++) game.step(0.02);
  const restored = PartyGame.restore(JSON.parse(JSON.stringify(game.serialize())));
  assert.equal(
    restored.boss,
    restored.enemies.find((enemy) => enemy.id === restored.boss.id),
  );
  assert.ok(restored.projectiles[0].hits instanceof Set);
  assert.ok(restored.projectiles[0].hits.has(777));
  for (let i = 0; i < 50; i++) {
    game.step(0.02);
    restored.step(0.02);
  }
  assert.deepEqual(restored.serialize(), game.serialize());
  const publicState = game.publicState(a);
  assert.equal(publicState.randomState, undefined);
  assert.equal(publicState.own.choices.length, 0);
  assert.equal(publicState.players.length, 2);
});
test('a one-member authoritative party keeps the existing solo simulation behavior', () => {
  const id = crypto.randomUUID(),
    party = new PartyGame(id, [{ id: a, hero: 'link' }], {
      seed: 8,
      mode: 'survival',
      flatTerrain: true,
    }),
    solo = new Game('link', 8, { mode: 'survival', flatTerrain: true });
  const input = { x: 0.5, y: 0.2, cameraYaw: 0.3 };
  party.inputs.set(a, input);
  for (let i = 0; i < 200; i++) {
    party.step(0.02);
    solo.step(0.02, input);
  }
  assert.equal(party.time, solo.time);
  assert.equal(party.player.x, solo.player.x);
  assert.equal(party.player.hp, solo.player.hp);
  assert.equal(party.kills, solo.kills);
});

test('party membership bounds and per-room storage failures preserve independent rooms', async () => {
  const players = Array.from({ length: 4 }, () => ({ id: crypto.randomUUID(), hero: 'link' }));
  const four = new PartyGame(crypto.randomUUID(), players, { mode: 'survival' });
  four.collect(15);
  assert.equal([...four.members.values()].filter((member) => member.choices.length).length, 4);
  assert.throws(() => new PartyGame(crypto.randomUUID(), [...players, players[0]]));
  assert.throws(() => new PartyGame(crypto.randomUUID(), [players[0], players[0]]));
  const { Rooms } = require('../rooms.cjs'),
    saved = [],
    manager = new Rooms({
      saveRoom: async (id) => {
        if (id === 'bad') throw new Error('Simulated write failure.');
        saved.push(id);
        return 2;
      },
    });
  for (const id of ['bad', 'good']) {
    const game = create();
    game.spawnTimer = 999;
    manager.rooms.set(id, {
      id,
      game,
      revision: 1,
      votes: new Set(),
      sockets: new Map(
        [...game.members.keys()].map((user) => [
          user,
          { expiresAt: Infinity, readyState: 1, bufferedAmount: 0, send() {} },
        ]),
      ),
      lastInput: new Map(),
      seq: new Map(),
      settled: false,
    });
  }
  await assert.rejects(() => manager.flush(), /Simulated write failure/);
  assert.deepEqual(saved, ['good']);
  manager.pump();
  assert.equal(manager.rooms.get('bad').game.time, 0);
  assert.equal(manager.rooms.get('good').game.time, 0.02);
});

test('both Adventurers enter the landmark and room restart retains the boss arena', () => {
  const game = new PartyGame(
    crypto.randomUUID(), [{ id: a, hero: 'link' }, { id: b, hero: 'zelda' }],
    { mode: 'adventure', seed: 42 },
  );
  game.members.get(a).player.x = 50;
  game.members.get(b).player.z = -50;
  game.realmStages[game.realm] = 3;
  game.stageKills[game.realm] = 24;
  assert.equal(game.challengeGuardian(), true);
  assert.equal(game.landmark.name, 'Great Deku Tree');
  for (const { player } of game.members.values()) {
    assert.ok(Math.abs(player.x) < game.arenaLimit);
    assert.ok(Math.abs(player.z) < game.arenaLimit);
    assert.equal(player.ground, 0);
  }
  const restored = PartyGame.restore(JSON.parse(JSON.stringify(game.serialize())));
  assert.equal(restored.landmark.name, 'Great Deku Tree');
  assert.equal(restored.boss.bossId, 'gohma');
  assert.equal(restored.boss, restored.enemies.find(e => e.type === 'boss'));
});
