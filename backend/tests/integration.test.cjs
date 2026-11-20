const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs/promises'),
  path = require('node:path'),
  crypto = require('node:crypto');
const WebSocket = require('ws'),
  { createBackend } = require('../server.cjs'),
  { Profile } = require('../../profile.js');
const key = () => crypto.randomUUID();
const eventually = async (predicate) => {
  const end = Date.now() + 4000;
  while (!predicate()) {
    if (Date.now() > end) throw new Error('Condition timed out.');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};
test('local PostgreSQL backend protects accounts, saves, authoritative rooms and atomic economy', async (t) => {
  const base = path.resolve(
    process.env.ZELDABONK_TEST_ROOT ||
      path.join(require('node:os').tmpdir(), 'zeldabonk-backend-tests'),
  );
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'run-'));
  let app = await createBackend({ dataDir: dir, port: 0, tick: false });
  const sockets = [];
  t.after(async () => {
    for (const socket of sockets) socket.ws.terminate();
    if (app) await app.close();
    const resolved = path.resolve(dir);
    assert.ok(resolved.startsWith(base + path.sep));
    await fs.rm(resolved, { recursive: true, force: true });
  });
  async function request(user, method, route, body, extra = {}) {
    const response = await fetch(app.url + route, {
      method,
      headers: {
        ...(user ? { Cookie: user.cookie } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: app.url }),
        ...extra,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  }
  const password = 'local-test-' + crypto.randomUUID();
  const register = async (username) => {
    const result = await request(null, 'POST', '/api/auth/register', { username, password });
    assert.equal(result.status, 201);
    return {
      ...result.body.account,
      cookie: result.headers.get('set-cookie').split(';')[0],
      cookieHeader: result.headers.get('set-cookie'),
    };
  };
  const alice = await register('local_alice'),
    bob = await register('local_bob'),
    outsider = await register('local_outsider');
  let room, wa, wb;
  async function connect(user, id) {
    const messages = [],
      ws = new WebSocket(app.url.replace('http:', 'ws:') + '/ws?room=' + id, {
        headers: { Cookie: user.cookie, Origin: app.url },
      });
    const client = {
      ws,
      messages,
      send: (body) => ws.send(JSON.stringify(body)),
      wait: async (predicate) => {
        await eventually(() => messages.some(predicate));
        return messages.find(predicate);
      },
    };
    ws.on('message', (data) => messages.push(JSON.parse(data)));
    ws.on('error', () => {});
    sockets.push(client);
    await client.wait((message) => message.type === 'hello');
    return client;
  }
  const quantity = async (user, item) =>
    (await app.store.getProfile(user.id)).inventory.find((row) => row.item_id === item)?.quantity ||
    0;
  await t.test(
    'hashed passwords, opaque sessions, generic login errors and sign-in isolation',
    async () => {
      assert.match(alice.cookieHeader, /HttpOnly/);
      assert.match(alice.cookieHeader, /SameSite=Strict/);
      const stored = await app.store.account(alice.username);
      assert.notEqual(stored.password_hash, password);
      assert.match(stored.password_hash, /^scrypt\$32768\$8\$3\$/);
      assert.equal((await request(null, 'GET', '/api/me')).status, 401);
      assert.equal(
        (await request(null, 'POST', '/api/auth/login', { username: 'no_such_user', password }))
          .status,
        401,
      );
      assert.equal(
        (
          await request(null, 'POST', '/api/auth/login', {
            username: alice.username,
            password: password + 'bad',
          })
        ).status,
        401,
      );
      const login = await request(null, 'POST', '/api/auth/login', {
        username: alice.username,
        password,
      });
      assert.equal(login.status, 200);
      assert.equal(login.body.account.id, alice.id);
      assert.equal(login.body.account.password_hash, undefined);
      const sessions = (
        await app.store.db.query('SELECT token_hash FROM sessions WHERE account_id=$1', [alice.id])
      ).rows;
      assert.ok(
        sessions.every(
          (row) => row.token_hash.length === 64 && !alice.cookie.includes(row.token_hash),
        ),
      );
    },
  );
  await t.test(
    'Origin, unexpected fields and malformed saves fail without state changes',
    async () => {
      assert.equal(
        (
          await request(
            alice,
            'POST',
            '/api/market',
            { requestId: key(), item: 'radish', quantity: 1, side: 'buy' },
            { Origin: 'https://attacker.invalid' },
          )
        ).status,
        403,
      );
      assert.equal(
        (await request(alice, 'PUT', '/api/save', { revision: 0, body: { game: 'invalid' } }))
          .status,
        400,
      );
      assert.equal(
        (
          await request(alice, 'PUT', '/api/save', {
            revision: 0,
            body: new Profile().toJSON(),
            accountId: bob.id,
          })
        ).status,
        400,
      );
      const rebound = await new Promise((resolve, reject) => {
        const req = require('node:http').get(
          app.url + '/health',
          { headers: { Host: 'attacker.invalid' } },
          (res) => {
            res.resume();
            res.on('end', () => resolve(res.statusCode));
          },
        );
        req.on('error', reject);
      });
      assert.equal(rebound, 403);
      const tooLarge = await request(alice, 'POST', '/api/rooms', { padding: 'x'.repeat(260001) });
      assert.equal(tooLarge.status, 413);
      await new Promise((resolve, reject) => {
        const ws = new WebSocket(app.url.replace('http:', 'ws:') + '/ws?room=' + key(), {
          headers: { Cookie: alice.cookie, Origin: 'https://attacker.invalid' },
        });
        ws.on('unexpected-response', (_req, res) => {
          assert.equal(res.statusCode, 403);
          res.resume();
          ws.terminate();
          resolve();
        });
        ws.on('open', () => {
          ws.terminate();
          reject(new Error('Cross-origin socket accepted.'));
        });
        ws.on('error', () => {});
      });
    },
  );
  await t.test(
    'cloud saves use owner scope and compare revisions, never minting server currency',
    async () => {
      const body = new Profile().toJSON();
      body.rupees = 999999;
      assert.equal((await request(alice, 'PUT', '/api/save', { revision: 0, body })).status, 200);
      assert.equal((await request(bob, 'GET', '/api/save')).body.revision, 0);
      const writes = await Promise.all([
        request(alice, 'PUT', '/api/save', { revision: 1, body }),
        request(alice, 'PUT', '/api/save', { revision: 1, body }),
      ]);
      assert.deepEqual(writes.map((result) => result.status).sort(), [200, 409]);
      assert.equal((await request(alice, 'GET', '/api/save')).body.revision, 2);
      assert.equal((await request(alice, 'GET', '/api/me')).body.profile.rupees, 0);
      assert.equal((await request(alice, 'GET', '/api/save/' + bob.id)).status, 404);
    },
  );
  await t.test(
    'private rooms require a real invitation, membership and host authority',
    async () => {
      room = (
        await request(alice, 'POST', '/api/rooms', {
          hero: 'link',
          mode: 'survival',
          difficulty: 'normal',
          ranked: true,
        })
      ).body;
      assert.ok(room.id && room.invite);
      assert.equal((await request(outsider, 'GET', '/api/rooms/' + room.id)).status, 404);
      assert.equal(
        (
          await request(bob, 'POST', '/api/rooms/' + room.id + '/join', {
            invite: 'invalid',
            hero: 'zelda',
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await request(bob, 'POST', '/api/rooms/' + room.id + '/join', {
            invite: room.invite,
            hero: 'zelda',
          })
        ).status,
        200,
      );
      assert.equal(
        (await request(bob, 'POST', '/api/rooms/' + room.id + '/start', {})).status,
        403,
      );
      wa = await connect(alice, room.id);
      wb = await connect(bob, room.id);
      assert.equal(
        (await request(alice, 'POST', '/api/rooms/' + room.id + '/start', {})).status,
        200,
      );
      const snapshot = await wa.wait((message) => message.type === 'snapshot' && message.game);
      assert.equal(snapshot.game.players.length, 2);
      assert.equal(snapshot.game.randomState, undefined);
      await new Promise((resolve, reject) => {
        const bad = new WebSocket(app.url.replace('http:', 'ws:') + '/ws?room=' + room.id, {
          headers: { Cookie: outsider.cookie, Origin: app.url },
        });
        bad.on('unexpected-response', (_req, res) => {
          assert.equal(res.statusCode, 404);
          res.resume();
          bad.terminate();
          resolve();
        });
        bad.on('open', () => {
          bad.terminate();
          reject(new Error('Non-member joined a room.'));
        });
        bad.on('error', () => {});
      });
    },
  );
  await t.test(
    'two real WebSocket clients move separate server actors and reject invented state or replay',
    async () => {
      wa.send({ type: 'input', seq: 1, x: 1, y: 0, cameraYaw: 0, glide: false });
      wb.send({ type: 'input', seq: 1, x: -1, y: 0, cameraYaw: 0, glide: false });
      await wa.wait((message) => message.type === 'ack' && message.seq === 1);
      await wb.wait((message) => message.type === 'ack' && message.seq === 1);
      for (let i = 0; i < 40; i++) app.rooms.pump();
      const game = app.rooms.rooms.get(room.id).game;
      assert.ok(game.members.get(alice.id).player.x > 3);
      assert.ok(game.members.get(bob.id).player.x < -3);
      assert.ok(Math.abs(game.time - 0.8) < 1e-8);
      const hp = game.members.get(alice.id).player.hp;
      wa.send({ type: 'input', seq: 2, x: 0, y: 0, cameraYaw: 0, glide: false, hp: 999999 });
      await wa.wait((message) => message.type === 'error' && message.status === 400);
      assert.equal(game.members.get(alice.id).player.hp, hp);
      const count = wa.messages.filter((message) => message.type === 'error').length;
      wa.send({ type: 'input', seq: 1, x: 0, y: 0, cameraYaw: 0, glide: false });
      await eventually(
        () => wa.messages.filter((message) => message.type === 'error').length > count,
      );
      assert.equal((await request(alice, 'POST', '/api/score', { score: 999999 })).status, 404);
      assert.deepEqual((await request(alice, 'GET', '/api/leaderboard')).body.records, []);
    },
  );
  await t.test(
    'shared upgrades, team pause and reconnect freeze the authoritative clock',
    async () => {
      const active = app.rooms.rooms.get(room.id),
        game = active.game;
      game.collect(15);
      wa.send({
        type: 'action',
        seq: 2,
        action: 'choose',
        choice: game.members.get(alice.id).choices[0].id,
      });
      await wa.wait((message) => message.type === 'ack' && message.seq === 2);
      assert.equal(game.state, 'upgrade');
      let clock = game.time;
      for (let i = 0; i < 10; i++) app.rooms.pump();
      assert.equal(game.time, clock);
      wb.send({
        type: 'action',
        seq: 2,
        action: 'choose',
        choice: game.members.get(bob.id).choices[0].id,
      });
      await wb.wait((message) => message.type === 'ack' && message.seq === 2);
      assert.equal(game.state, 'running');
      wa.send({ type: 'action', seq: 3, action: 'pause' });
      await wa.wait((message) => message.type === 'ack' && message.seq === 3);
      clock = game.time;
      for (let i = 0; i < 10; i++) app.rooms.pump();
      assert.equal(game.time, clock);
      wa.send({ type: 'action', seq: 4, action: 'resume' });
      await wa.wait((message) => message.type === 'ack' && message.seq === 4);
      app.rooms.pump();
      assert.ok(game.time > clock);
      wb.ws.terminate();
      await eventually(() => !active.sockets.has(bob.id));
      clock = game.time;
      for (let i = 0; i < 10; i++) app.rooms.pump();
      assert.equal(game.time, clock);
      wb = await connect(bob, room.id);
      assert.equal((await wb.wait((message) => message.type === 'hello')).nextSeq, 3);
      app.rooms.pump();
      assert.ok(game.time > clock);
    },
  );
  await t.test(
    'restart restores PostgreSQL sessions, cloud saves, room RNG and active world state',
    async () => {
      await app.rooms.flush();
      const before = app.rooms.rooms.get(room.id).game.serialize();
      await app.close();
      app = null;
      app = await createBackend({ dataDir: dir, port: 0, tick: false });
      assert.deepEqual(app.rooms.rooms.get(room.id).game.serialize(), before);
      assert.equal((await request(alice, 'GET', '/api/me')).status, 200);
      assert.equal((await request(alice, 'GET', '/api/save')).body.revision, 2);
      assert.equal((await request(bob, 'GET', '/api/save')).body.revision, 0);
      assert.equal((await request(alice, 'GET', '/api/rooms')).body.rooms[0].id, room.id);
      assert.deepEqual((await request(outsider, 'GET', '/api/rooms')).body.rooms, []);
      wa = await connect(alice, room.id);
      wb = await connect(bob, room.id);
      assert.equal((await wa.wait((message) => message.type === 'hello')).nextSeq, 5);
      assert.equal((await wb.wait((message) => message.type === 'hello')).nextSeq, 3);
    },
  );
  await t.test(
    'only terminal server simulation creates ranked results, rewards and loot, exactly once',
    async () => {
      const active = app.rooms.rooms.get(room.id),
        game = active.game;
      game.withActor(alice.id, () => game.acquireGear('firefruit'));
      game.time = 240;
      game.step(0.02);
      assert.ok(game.boss);
      game.hurtEnemy(game.boss, 1e9);
      assert.equal(game.state, 'won');
      await app.rooms.flush();
      const before = (await request(alice, 'GET', '/api/me')).body.profile;
      assert.equal(before.runs, 1);
      assert.equal(before.wins, 1);
      assert.ok(before.rupees > 0);
      assert.equal(await quantity(alice, 'firefruit'), 1);
      await Promise.all([app.store.settleRoom(room.id, game), app.store.settleRoom(room.id, game)]);
      assert.equal((await request(alice, 'GET', '/api/me')).body.profile.rupees, before.rupees);
      assert.equal(await quantity(alice, 'firefruit'), 1);
      const results = (
        await app.store.db.query('SELECT * FROM run_results WHERE room_id=$1', [room.id])
      ).rows;
      assert.equal(results.length, 2);
      assert.ok(results.every((row) => row.ranked && row.kills === game.kills));
      assert.equal((await request(alice, 'GET', '/api/leaderboard')).body.records.length, 2);
    },
  );
  await t.test(
    'clan membership and owner-only actions cannot cross authorization boundaries',
    async () => {
      assert.equal(
        (await request(alice, 'POST', '/api/clan', { name: 'Local Heroes' })).status,
        201,
      );
      const invite = (await request(alice, 'POST', '/api/clan/invite', {})).body.invite;
      assert.equal((await request(bob, 'POST', '/api/clan/join', { invite })).status, 200);
      assert.equal((await request(bob, 'POST', '/api/clan/invite', {})).status, 403);
      assert.equal(
        (await request(bob, 'POST', '/api/clan/kick', { accountId: alice.id })).status,
        403,
      );
      assert.equal(
        (await request(outsider, 'POST', '/api/clan/kick', { accountId: bob.id })).status,
        403,
      );
      assert.equal((await request(alice, 'POST', '/api/clan/leave', {})).status, 409);
      assert.equal(
        (await request(alice, 'POST', '/api/clan/kick', { accountId: bob.id })).status,
        200,
      );
      assert.equal((await request(bob, 'GET', '/api/clan')).body.clan, null);
    },
  );
  await t.test(
    'trade escrow, revision consent and simultaneous confirmation prevent duplicated or stolen items',
    async () => {
      await app.store.db.transaction(async (tx) => {
        await app.store.changeItems(tx, alice.id, { firefruit: 9, splashfruit: 10 }, 1);
        await app.store.changeItems(tx, bob.id, { violet: 10 }, 1);
      });
      const requestKey = key(),
        payload = { requestId: requestKey, receiverId: bob.id, offer: { firefruit: 4 } };
      const trade = (await request(alice, 'POST', '/api/trades', payload)).body;
      assert.equal(await quantity(alice, 'firefruit'), 6);
      assert.equal((await request(alice, 'POST', '/api/trades', payload)).body.id, trade.id);
      assert.equal(await quantity(alice, 'firefruit'), 6);
      assert.equal((await request(outsider, 'GET', '/api/trades/' + trade.id)).status, 404);
      assert.equal(
        (
          await request(alice, 'POST', '/api/trades/' + trade.id + '/offer', {
            revision: 1,
            offer: { firefruit: 1000 },
          })
        ).status,
        409,
      );
      assert.equal(await quantity(alice, 'firefruit'), 6);
      let updated = (
        await request(bob, 'POST', '/api/trades/' + trade.id + '/offer', {
          revision: 1,
          offer: { violet: 2 },
        })
      ).body;
      assert.equal(updated.revision, 2);
      assert.equal(
        (await request(alice, 'POST', '/api/trades/' + trade.id + '/confirm', { revision: 1 }))
          .status,
        409,
      );
      await request(alice, 'POST', '/api/trades/' + trade.id + '/confirm', { revision: 2 });
      updated = (
        await request(bob, 'POST', '/api/trades/' + trade.id + '/offer', {
          revision: 2,
          offer: { violet: 3 },
        })
      ).body;
      assert.equal(updated.sender_accepted, false);
      const confirmed = await Promise.all([
        request(alice, 'POST', '/api/trades/' + trade.id + '/confirm', { revision: 3 }),
        request(bob, 'POST', '/api/trades/' + trade.id + '/confirm', { revision: 3 }),
      ]);
      assert.ok(confirmed.every((result) => result.status === 200));
      assert.equal(await quantity(alice, 'violet'), 3);
      assert.equal(await quantity(bob, 'firefruit'), 4);
      await request(alice, 'POST', '/api/trades/' + trade.id + '/confirm', { revision: 3 });
      assert.equal(await quantity(alice, 'violet'), 3);
      assert.equal(
        (await request(bob, 'POST', '/api/trades/' + trade.id + '/cancel', { revision: 3 })).status,
        409,
      );
    },
  );
  await t.test(
    'cancelling escrow releases each side once and cannot spend reserved inventory',
    async () => {
      const trade = (
        await request(alice, 'POST', '/api/trades', {
          requestId: key(),
          receiverId: bob.id,
          offer: { firefruit: 6 },
        })
      ).body;
      assert.equal(await quantity(alice, 'firefruit'), 0);
      assert.equal(
        (await request(alice, 'POST', '/api/craft', { requestId: key(), recipe: 'shockfruit' }))
          .status,
        409,
      );
      await request(bob, 'POST', '/api/trades/' + trade.id + '/offer', {
        revision: 1,
        offer: { violet: 1 },
      });
      assert.equal(
        (await request(bob, 'POST', '/api/trades/' + trade.id + '/cancel', { revision: 2 })).status,
        200,
      );
      assert.equal(await quantity(alice, 'firefruit'), 6);
      assert.equal(await quantity(bob, 'violet'), 7);
      await request(alice, 'POST', '/api/trades/' + trade.id + '/cancel', { revision: 2 });
      assert.equal(await quantity(alice, 'firefruit'), 6);
    },
  );
  await t.test(
    'crafting and market transactions handle retry, rollback and concurrent overspending',
    async () => {
      const payload = { requestId: key(), recipe: 'shockfruit' };
      const repeated = await Promise.all([
        request(alice, 'POST', '/api/craft', payload),
        request(alice, 'POST', '/api/craft', payload),
      ]);
      assert.ok(repeated.every((result) => result.status === 200));
      assert.equal(await quantity(alice, 'shockfruit'), 1);
      assert.equal(await quantity(alice, 'firefruit'), 4);
      assert.equal(
        (await request(alice, 'POST', '/api/craft', { ...payload, recipe: 'ancientbow' })).status,
        409,
      );
      await app.store.db.query(
        'UPDATE inventory SET quantity=0 WHERE account_id=$1 AND item_id=$2',
        [alice.id, 'splashfruit'],
      );
      const before = await quantity(alice, 'firefruit');
      assert.equal(
        (await request(alice, 'POST', '/api/craft', { requestId: key(), recipe: 'shockfruit' }))
          .status,
        409,
      );
      assert.equal(await quantity(alice, 'firefruit'), before);
      await app.store.db.query('UPDATE profiles SET rupees=15 WHERE account_id=$1', [alice.id]);
      const orders = await Promise.all([
        request(alice, 'POST', '/api/market', {
          requestId: key(),
          item: 'radish',
          quantity: 1,
          side: 'buy',
        }),
        request(alice, 'POST', '/api/market', {
          requestId: key(),
          item: 'radish',
          quantity: 1,
          side: 'buy',
        }),
      ]);
      assert.deepEqual(orders.map((result) => result.status).sort(), [200, 409]);
      assert.equal(await quantity(alice, 'radish'), 1);
      assert.equal((await request(alice, 'GET', '/api/me')).body.profile.rupees, 0);
      assert.equal(
        (
          await request(alice, 'POST', '/api/market', {
            requestId: key(),
            item: 'radish',
            quantity: 1,
            side: 'buy',
            price: 0,
          })
        ).status,
        400,
      );
    },
  );
  await t.test('sign-out revokes an existing live socket and its session', async () => {
    const expired = await app.store.session(alice.id);
    await app.store.db.query(
      "UPDATE sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",
      [require('../security.cjs').digest(expired)],
    );
    assert.equal(
      (await request({ ...alice, cookie: 'zeldabonk_local_session=' + expired }, 'GET', '/api/me'))
        .status,
      401,
    );
    const created = (
      await request(outsider, 'POST', '/api/rooms', {
        hero: 'link',
        mode: 'survival',
        difficulty: 'normal',
        ranked: false,
      })
    ).body;
    const rotated = await request(outsider, 'POST', '/api/rooms/' + created.id + '/invite', {});
    assert.equal(rotated.status, 200);
    assert.notEqual(rotated.body.invite, created.invite);
    assert.equal(
      (await request(alice, 'POST', '/api/rooms/' + created.id + '/invite', {})).status,
      403,
    );
    const socket = await connect(outsider, created.id);
    assert.equal((await request(outsider, 'POST', '/api/auth/logout', {})).status, 200);
    assert.equal(app.rooms.rooms.get(created.id)?.sockets.has(outsider.id) || false, false);
    await eventually(() => socket.ws.readyState === 3);
    assert.equal((await request(outsider, 'GET', '/api/me')).status, 401);
  });
});

test('the real server clock advances two WebSocket actors without an internal test tick', async (t) => {
  const app = await createBackend({ port: 0 });
  const sockets = [];
  t.after(async () => {
    for (const ws of sockets) ws.terminate();
    await app.close();
  });
  const users = [];
  for (const username of ['live_alice', 'live_bob']) {
    const response = await fetch(app.url + '/api/auth/register', {
      method: 'POST',
      headers: { Origin: app.url, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: crypto.randomUUID() }),
    });
    assert.equal(response.status, 201);
    users.push({
      ...(await response.json()).account,
      cookie: response.headers.get('set-cookie').split(';')[0],
    });
  }
  const post = async (user, route, body) => {
    const response = await fetch(app.url + route, {
      method: 'POST',
      headers: { Origin: app.url, Cookie: user.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.ok(response.ok);
    return response.json();
  };
  const room = await post(users[0], '/api/rooms', {
    hero: 'link',
    mode: 'survival',
    difficulty: 'normal',
    ranked: false,
  });
  await post(users[1], '/api/rooms/' + room.id + '/join', { invite: room.invite, hero: 'zelda' });
  const states = [];
  for (const user of users) {
    const ws = new WebSocket(app.url.replace('http:', 'ws:') + '/ws?room=' + room.id, {
      headers: { Origin: app.url, Cookie: user.cookie },
    });
    sockets.push(ws);
    let ready = false;
    ws.on('error', () => {});
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.type === 'hello') ready = true;
      if (message.game) states.push(message.game);
    });
    await eventually(() => ready);
  }
  await post(users[0], '/api/rooms/' + room.id + '/start', {});
  sockets[0].send(
    JSON.stringify({ type: 'input', seq: 1, x: 1, y: 0, cameraYaw: 0, glide: false }),
  );
  sockets[1].send(
    JSON.stringify({ type: 'input', seq: 1, x: -1, y: 0, cameraYaw: 0, glide: false }),
  );
  await eventually(() =>
    states.some(
      (state) =>
        state.time >= 0.2 &&
        state.players.find((player) => player.id === users[0].id).player.x > 0 &&
        state.players.find((player) => player.id === users[1].id).player.x < 0,
    ),
  );
  assert.equal((await post(users[0], '/api/rooms/' + room.id + '/abandon', {})).ended, true);
  assert.ok((await app.store.getProfile(users[0].id)).rupees === 0);
});

test('the local static game server cannot serve backend files or private dot-directories', async (t) => {
  const child = require('node:child_process').spawn(
    process.execPath,
    [path.resolve(__dirname, '../../server.cjs')],
    { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
  );
  t.after(() => child.kill());
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Static server did not start.')), 4000);
    child.stdout.on('data', (data) => {
      const match = /http:\/\/127\.0\.0\.1:\d+/.exec(data.toString());
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
    child.on('error', reject);
  });
  assert.equal((await fetch(url + '/')).status, 200);
  assert.equal((await fetch(url + '/backend/schema.sql')).status, 403);
  assert.equal((await fetch(url + '/.local-data/PG_VERSION')).status, 403);
  assert.equal((await fetch(url + '/.git/config')).status, 403);
});
