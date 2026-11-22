'use strict';
const crypto = require('node:crypto');
const { PartyGame } = require('./party.cjs'),
  { check, fields, RateLimit, digest } = require('./security.cjs');
const ACTIONS = [
  'dash',
  'jump',
  'ultimate',
  'interact',
  'aim',
  'lock',
  'choose',
  'refresh',
  'skip',
  'banish',
  'pause',
  'resume',
];
class Rooms {
  constructor(store) {
    this.store = store;
    this.rooms = new Map();
    this.starting = new Set();
    this.timer = null;
    this.flushPromise = null;
    this.ticks = 0;
  }
  async restore() {
    for (const row of await this.store.activeRooms()) {
      check(row.snapshot?.game, 500, 'A running room has no saved simulation.');
      const game = PartyGame.restore(row.snapshot.game),
        members = (
          await this.store.db.query('SELECT account_id FROM room_members WHERE room_id=$1', [
            row.id,
          ])
        ).rows;
      check(
        members.length === game.members.size &&
          members.every((member) => game.members.has(member.account_id)),
        500,
        'Saved room membership differs from its simulation.',
      );
      this.rooms.set(row.id, {
        id: row.id,
        hostId: row.host_id,
        game,
        revision: row.revision,
        sockets: new Map(),
        seq: new Map(row.snapshot.seq || []),
        votes: new Set(row.snapshot.votes || []),
        lastInput: new Map(),
        settled: false,
      });
    }
  }
  async attach(id, user, ws, sessionToken) {
    const row = await this.store.room(id, user.id);
    check(['lobby', 'running'].includes(row.status), 409, 'This room has ended.');
    let room = this.rooms.get(id);
    if (!room) {
      room = {
        id,
        hostId: row.host_id,
        game: null,
        revision: row.revision,
        sockets: new Map(),
        seq: new Map(),
        votes: new Set(),
        lastInput: new Map(),
        settled: false,
      };
      this.rooms.set(id, room);
    }
    const previous = room.sockets.get(user.id);
    if (previous) previous.close(4009, 'Replaced by another connection.');
    ws.accountId = user.id;
    ws.sessionHash = digest(sessionToken);
    ws.expiresAt = new Date(user.expires_at).getTime();
    ws.alive = true;
    ws.limiter = new RateLimit();
    room.sockets.set(user.id, ws);
    ws.on('pong', () => (ws.alive = true));
    ws.on('message', (data, binary) => {
      try {
        check(room.sockets.get(user.id) === ws, 401, 'Connection replaced or revoked.');
        check(!binary, 400, 'Use JSON text messages.');
        ws.limiter.take('messages', 80, 1000);
        check(Date.now() < ws.expiresAt, 401, 'Session expired.');
        this.receive(room, user.id, JSON.parse(data.toString()));
      } catch (error) {
        this.send(ws, {
          type: 'error',
          status: error.status || 400,
          message: error.status ? error.message : 'Invalid JSON message.',
        });
        if (error.status === 429 || error.status === 401) ws.close(4008, 'Session or rate limit.');
      }
    });
    ws.on('close', () => {
      if (room.sockets.get(user.id) === ws) {
        room.sockets.delete(user.id);
        room.game?.inputs.delete(user.id);
        room.lastInput.delete(user.id);
        this.broadcast(room);
        if (!room.game && !room.sockets.size && this.rooms.get(id) === room) this.rooms.delete(id);
      }
    });
    ws.on('error', () => {});
    this.send(ws, {
      type: 'hello',
      roomId: id,
      accountId: user.id,
      nextSeq: (room.seq.get(user.id) || 0) + 1,
      ruleset: '2.3.0-local-1',
    });
    this.broadcast(room);
  }
  receive(room, user, body) {
    fields(
      body,
      body?.type === 'input'
        ? ['type', 'seq', 'x', 'y', 'cameraYaw', 'glide']
        : ['type', 'seq', 'action', 'choice'],
    );
    check(
      ['input', 'action'].includes(body.type) &&
        Number.isSafeInteger(body.seq) &&
        body.seq > (room.seq.get(user) || 0) &&
        body.seq <= (room.seq.get(user) || 0) + 1000,
      400,
      'Invalid or replayed input sequence.',
    );
    check(room.game && !room.settled, 409, 'The run is not active.');
    if (body.type === 'input') {
      check(
        Number.isFinite(body.x) &&
          Math.abs(body.x) <= 1 &&
          Number.isFinite(body.y) &&
          Math.abs(body.y) <= 1 &&
          Number.isFinite(body.cameraYaw) &&
          Math.abs(body.cameraYaw) <= Math.PI &&
          typeof body.glide === 'boolean',
        400,
        'Invalid movement input.',
      );
      check(room.game.members.get(user)?.player.hp > 0, 409, 'Downed players cannot move.');
      room.game.inputs.set(user, {
        x: body.x,
        y: body.y,
        cameraYaw: body.cameraYaw,
        glide: body.glide,
      });
      room.lastInput.set(user, Date.now());
    } else {
      check(
        ACTIONS.includes(body.action) &&
          (body.choice === undefined ||
            (typeof body.choice === 'string' && body.choice.length <= 30)),
        400,
        'Unknown game action.',
      );
      if (body.action === 'pause') room.votes.add(user);
      else if (body.action === 'resume') room.votes.delete(user);
      else {
        check(
          room.votes.size === 0 && room.sockets.size === room.game.members.size,
          409,
          'The team is paused or waiting for reconnect.',
        );
        room.game.action(user, body.action, body.choice);
      }
    }
    room.seq.set(user, body.seq);
    this.send(room.sockets.get(user), { type: 'ack', seq: body.seq });
    if (body.type === 'action') this.broadcast(room);
  }
  async start(id, host) {
    check(!this.starting.has(id), 409, 'Room start is already in progress.');
    this.starting.add(id);
    try {
      const row = await this.store.room(id, host);
      check(row.host_id === host, 403, 'Only the host can start this room.');
      check(row.status === 'lobby', 409, 'This room has already started.');
      const room = this.rooms.get(id);
      check(
        room && row.members.every((member) => room.sockets.has(member.account_id)),
        409,
        'Every member must connect before starting.',
      );
      const players = [];
      for (const member of row.members) {
        const profile = await this.store.getProfile(member.account_id);
        check(
          new (require('../profile.js').Profile)(profile).unlocked.includes(member.hero),
          409,
          'A selected hero is locked on the server profile.',
        );
        players.push({ id: member.account_id, hero: member.hero, upgrades: profile.upgrades });
      }
      const game = new PartyGame(id, players, {
        mode: row.mode,
        difficulty: row.difficulty,
        seed: crypto.randomInt(0, 2147483647),
      });
      const snapshot = { game: game.serialize(), seq: [], votes: [] };
      room.revision = await this.store.saveRoom(id, row.revision, 'running', snapshot);
      room.game = game;
      room.settled = false;
      this.broadcast(room);
      return { started: true };
    } finally {
      this.starting.delete(id);
    }
  }
  async abandon(id, user) {
    const row = await this.store.room(id, user);
    check(row.host_id === user, 403, 'Only the host can abandon the team run.');
    const room = this.rooms.get(id);
    check(
      room?.game && ['running', 'upgrade', 'paused'].includes(room.game.state),
      409,
      'No active run.',
    );
    room.game.state = 'lost';
    await this.flush();
    if (!room.settled) await this.flush();
    this.broadcast(room);
    return { ended: true };
  }
  send(ws, body) {
    if (!ws || ws.readyState !== 1) return;
    if (ws.bufferedAmount > 1024 * 1024) {
      ws.close(4008, 'Client is too slow. Reconnect for a new snapshot.');
      return;
    }
    ws.send(JSON.stringify(body));
  }
  broadcast(room) {
    for (const [user, ws] of room.sockets) {
      const waiting = room.game
        ? [...room.game.members.keys()].filter((id) => !room.sockets.has(id))
        : [];
      this.send(ws, {
        type: 'snapshot',
        roomId: room.id,
        ack: room.seq.get(user) || 0,
        paused: room.votes.size > 0 || waiting.length > 0 || !!room.storageError,
        waiting,
        storageError: !!room.storageError,
        settled: room.settled,
        game: room.game ? room.game.publicState(user) : null,
      });
    }
  }
  pump() {
    this.ticks++;
    for (const room of this.rooms.values()) {
      if (room.settled && Date.now() - room.terminalAt > 60000) {
        for (const ws of room.sockets.values()) ws.close(1000, 'Run complete.');
        this.rooms.delete(room.id);
        continue;
      }
      for (const [id, ws] of room.sockets)
        if (Date.now() >= ws.expiresAt) {
          ws.close(4001, 'Session expired.');
          room.sockets.delete(id);
        }
      if (
        room.game &&
        !room.settled &&
        !room.storageError &&
        room.votes.size === 0 &&
        room.sockets.size === room.game.members.size
      ) {
        for (const [id, time] of room.lastInput)
          if (Date.now() - time > 250) room.game.inputs.delete(id);
        room.game.step(0.02);
        room.game.drainEvents();
      }
      if (this.ticks % 5 === 0) this.broadcast(room);
      if (this.ticks % 1000 === 0)
        for (const ws of room.sockets.values()) {
          if (!ws.alive) ws.terminate();
          else {
            ws.alive = false;
            ws.ping();
          }
        }
    }
    if (
      this.ticks % 100 === 0 ||
      [...this.rooms.values()].some(
        (room) => room.game && !room.settled && ['won', 'lost'].includes(room.game.state),
      )
    )
      this.flush().catch(() => {});
  }
  flush() {
    if (this.flushPromise) return this.flushPromise;
    this.flushPromise = (async () => {
      const errors = [];
      for (const room of this.rooms.values())
        if (room.game && !room.settled) {
          try {
            if (['won', 'lost'].includes(room.game.state)) {
              await this.store.settleRoom(room.id, room.game);
              room.settled = true;
              room.terminalAt = Date.now();
            } else
              room.revision = await this.store.saveRoom(room.id, room.revision, 'running', {
                game: room.game.serialize(),
                seq: [...room.seq],
                votes: [...room.votes],
              });
            room.storageError = false;
          } catch (error) {
            room.storageError = true;
            this.broadcast(room);
            errors.push(error);
          }
        }
      if (errors.length) throw errors[0];
    })().finally(() => {
      this.flushPromise = null;
    });
    return this.flushPromise;
  }
  run() {
    if (!this.timer) this.timer = setInterval(() => this.pump(), 20);
  }
  disconnectSession(value) {
    const hash = digest(value || '');
    for (const room of this.rooms.values())
      for (const [id, ws] of room.sockets)
        if (ws.sessionHash === hash) {
          room.sockets.delete(id);
          room.game?.inputs.delete(id);
          room.lastInput.delete(id);
          ws.expiresAt = 0;
          ws.close(4001, 'Signed out.');
          this.broadcast(room);
        }
  }
  async close() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const room of this.rooms.values())
      for (const ws of room.sockets.values())
        ws.close(1001, 'Server stopping. Reconnect after restart.');
    if (this.flushPromise) await this.flushPromise;
    await this.flush();
  }
}
module.exports = { Rooms };
