'use strict';
const http = require('node:http'),
  path = require('node:path');
const { WebSocketServer } = require('ws');
const { Store, CRAFT, MARKET } = require('./store.cjs'),
  { Rooms } = require('./rooms.cjs');
const { HEROES } = require('../core.js');
const {
  HttpError,
  check,
  fields,
  credentials,
  passwordHash,
  passwordMatches,
  token,
  uuid,
  revision,
  requestId,
  offer,
  RateLimit,
} = require('./security.cjs');
const COOKIE = 'zeldabonk_local_session';
const sessionCookie = (value) =>
  COOKIE + '=' + value + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=' + (value ? 43200 : 0);
function readCookie(req) {
  const match = (req.headers.cookie || '')
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(COOKIE + '='));
  return match?.slice(COOKIE.length + 1) || '';
}
async function jsonBody(req) {
  check(
    (req.headers['content-type'] || '').split(';')[0] === 'application/json',
    415,
    'Use application/json.',
  );
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    check(size <= 260000, 413, 'Request body is too large.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}
async function createBackend(options = {}) {
  const store = options.store || (await Store.open(options.dataDir)),
    rooms = new Rooms(store),
    limiter = new RateLimit(),
    dummyHash = await passwordHash(token());
  try {
    await rooms.restore();
  } catch (error) {
    if (!options.store) await store.close();
    throw error;
  }
  let port;
  let stopping = false;
  let closingPromise;
  const allowed = (req) => {
    const host = req.headers.host;
    check(
      host === '127.0.0.1:' + port || host === 'localhost:' + port,
      403,
      'This service accepts loopback hosts only.',
    );
    return 'http://' + host;
  };
  const origin = (req) =>
    check(req.headers.origin === allowed(req), 403, 'A matching local Origin header is required.');
  const auth = async (req) => {
    const user = await store.authenticate(readCookie(req));
    check(user, 401, 'Sign in first.');
    return user;
  };
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const send = (status, body) => {
      res.writeHead(status);
      res.end(JSON.stringify(body));
    };
    try {
      check(!stopping, 503, 'The local backend is stopping.');
      allowed(req);
      check(req.url.length <= 2048, 414, 'URL is too long.');
      const url = new URL(req.url, 'http://127.0.0.1'),
        route = url.pathname,
        method = req.method;
      if (method === 'GET' && route === '/health') {
        send(200, {
          status: 'ok',
          service: 'zeldabonk-local',
          ruleset: '2.1.0-local-1',
          onlineDeployment: false,
        });
        return;
      }
      if (method === 'GET' && route === '/') {
        send(200, {
          service: 'ZeldaBonk local backend',
          documentation: 'backend/README.md',
          health: '/health',
          gameUIIntegration: false,
        });
        return;
      }
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) origin(req);
      else check(method === 'GET', 405, 'Method not allowed.');
      if (method === 'POST' && ['/api/auth/register', '/api/auth/login'].includes(route)) {
        limiter.take('auth:' + req.socket.remoteAddress, 30);
        const input = credentials(await jsonBody(req));
        let user;
        if (route.endsWith('/register')) {
          limiter.take('register:' + req.socket.remoteAddress, 10, 3600000);
          user = await store.createAccount(input.username, await passwordHash(input.password));
        } else {
          const account = await store.account(input.username),
            valid = await passwordMatches(input.password, account?.password_hash || dummyHash);
          check(account && valid, 401, 'Username or password is incorrect.');
          user = { id: account.id, username: account.username };
        }
        const value = await store.session(user.id);
        res.setHeader('Set-Cookie', sessionCookie(value));
        send(route.endsWith('/register') ? 201 : 200, { account: user });
        return;
      }
      const user = await auth(req);
      limiter.take('api:' + user.id, 300);
      let body;
      const read = async (allowedFields) => fields((body = await jsonBody(req)), allowedFields);
      if (method === 'POST' && route === '/api/auth/logout') {
        await read([]);
        await store.logout(readCookie(req));
        rooms.disconnectSession(readCookie(req));
        res.setHeader('Set-Cookie', sessionCookie(''));
        send(200, { signedOut: true });
        return;
      }
      if (method === 'GET' && route === '/api/me') {
        send(200, {
          account: { id: user.id, username: user.username },
          profile: await store.getProfile(user.id),
        });
        return;
      }
      if (method === 'GET' && route === '/api/accounts') {
        const username = url.searchParams.get('username');
        check(
          typeof username === 'string' && /^[a-zA-Z0-9_]{3,24}$/.test(username),
          400,
          'Supply a valid username.',
        );
        const account = await store.account(username.toLowerCase());
        check(account, 404, 'Account not found.');
        send(200, { id: account.id, username: account.username });
        return;
      }
      if (method === 'GET' && route === '/api/save') {
        send(200, await store.getSave(user.id));
        return;
      }
      if (method === 'PUT' && route === '/api/save') {
        await read(['revision', 'body']);
        let saved;
        try {
          saved = await store.putSave(user.id, revision(body), body.body);
        } catch (error) {
          if (error.status || error.code) throw error;
          throw new HttpError(400, 'Invalid ZeldaBonk save.');
        }
        send(200, saved);
        return;
      }
      if (method === 'GET' && route === '/api/catalog') {
        send(200, { recipes: CRAFT, market: MARKET });
        return;
      }
      if (method === 'POST' && route === '/api/craft') {
        await read(['requestId', 'recipe']);
        send(200, await store.craft(user.id, requestId(body.requestId), body.recipe));
        return;
      }
      if (method === 'POST' && route === '/api/market') {
        await read(['requestId', 'item', 'quantity', 'side']);
        send(
          200,
          await store.market(
            user.id,
            requestId(body.requestId),
            body.item,
            body.quantity,
            body.side,
          ),
        );
        return;
      }
      if (method === 'POST' && route === '/api/upgrades') {
        await read(['requestId', 'upgrade']);
        send(200, await store.purchaseUpgrade(user.id, requestId(body.requestId), body.upgrade));
        return;
      }
      if (method === 'GET' && route === '/api/leaderboard') {
        send(200, { records: await store.leaderboard() });
        return;
      }
      if (method === 'GET' && route === '/api/rooms') {
        send(200, { rooms: await store.listRooms(user.id) });
        return;
      }
      if (method === 'POST' && route === '/api/rooms') {
        await read(['hero', 'mode', 'difficulty', 'ranked']);
        check(
          Object.hasOwn(HEROES, body.hero) &&
            ['adventure', 'survival'].includes(body.mode) &&
            ['normal', 'hard'].includes(body.difficulty) &&
            typeof body.ranked === 'boolean',
          400,
          'Invalid room settings.',
        );
        const profile = await store.getProfile(user.id);
        check(
          new (require('../profile.js').Profile)(profile).unlocked.includes(body.hero),
          403,
          'Hero is locked on this server account.',
        );
        send(201, await store.createRoom(user.id, body));
        return;
      }
      const roomMatch = /^\/api\/rooms\/([^/]+)(?:\/(join|start|leave|abandon|invite))?$/.exec(
        route,
      );
      if (roomMatch) {
        const [, id, action] = roomMatch;
        check(uuid(id), 400, 'Invalid room ID.');
        if (method === 'GET' && !action) {
          const room = await store.room(id, user.id);
          delete room.snapshot;
          send(200, room);
          return;
        }
        if (method === 'POST' && action) {
          if (action === 'join') {
            await read(['invite', 'hero']);
            check(Object.hasOwn(HEROES, body.hero), 400, 'Unknown hero.');
            const profile = await store.getProfile(user.id);
            check(
              new (require('../profile.js').Profile)(profile).unlocked.includes(body.hero),
              403,
              'Hero is locked on this server account.',
            );
            send(200, await store.joinRoom(id, user.id, body.invite, body.hero));
          } else {
            await read([]);
            if (action === 'start') send(200, await rooms.start(id, user.id));
            else if (action === 'abandon') send(200, await rooms.abandon(id, user.id));
            else if (action === 'invite') send(200, await store.roomInvite(id, user.id));
            else {
              const result = await store.leaveRoom(id, user.id);
              const room = rooms.rooms.get(id);
              if (room) {
                if (room.hostId === user.id) {
                  for (const ws of room.sockets.values()) ws.close(4000, 'Lobby closed.');
                  rooms.rooms.delete(id);
                } else room.sockets.get(user.id)?.close(4000, 'Left lobby.');
              }
              send(200, result);
            }
          }
          return;
        }
      }
      if (method === 'GET' && route === '/api/clan') {
        send(200, { clan: await store.clan(user.id) });
        return;
      }
      if (method === 'POST' && route === '/api/clan') {
        await read(['name']);
        send(201, await store.createClan(user.id, body.name));
        return;
      }
      if (method === 'POST' && route === '/api/clan/invite') {
        await read([]);
        send(201, await store.inviteClan(user.id));
        return;
      }
      if (method === 'POST' && route === '/api/clan/join') {
        await read(['invite']);
        send(200, await store.joinClan(user.id, body.invite));
        return;
      }
      if (method === 'POST' && route === '/api/clan/leave') {
        await read([]);
        send(200, await store.leaveClan(user.id));
        return;
      }
      if (method === 'POST' && route === '/api/clan/kick') {
        await read(['accountId']);
        check(uuid(body.accountId), 400, 'Invalid account ID.');
        send(200, await store.kickClan(user.id, body.accountId));
        return;
      }
      if (method === 'POST' && route === '/api/trades') {
        await read(['requestId', 'receiverId', 'offer']);
        check(uuid(body.receiverId), 400, 'Invalid recipient.');
        send(
          201,
          await store.createTrade(
            user.id,
            body.receiverId,
            offer(body.offer),
            requestId(body.requestId),
          ),
        );
        return;
      }
      const tradeMatch = /^\/api\/trades\/([^/]+)(?:\/(offer|confirm|cancel))?$/.exec(route);
      if (tradeMatch) {
        const [, id, action] = tradeMatch;
        check(uuid(id), 400, 'Invalid trade ID.');
        if (method === 'GET' && !action) {
          send(200, await store.getTrade(id, user.id));
          return;
        }
        if (method === 'POST' && action) {
          await read(action === 'offer' ? ['revision', 'offer'] : ['revision']);
          const expected = revision(body);
          send(
            200,
            action === 'offer'
              ? await store.updateTrade(id, user.id, expected, offer(body.offer))
              : action === 'confirm'
                ? await store.confirmTrade(id, user.id, expected)
                : await store.cancelTrade(id, user.id, expected),
          );
          return;
        }
      }
      throw new HttpError(404, 'Endpoint not found.');
    } catch (error) {
      const status =
        error.status || (error.code === '23505' ? 409 : error.code === '23514' ? 409 : 500);
      send(status, {
        error:
          status === 500
            ? 'The local backend could not complete this request.'
            : error.status
              ? error.message
              : 'This change conflicts with existing data.',
      });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.maxHeadersCount = 40;
  server.maxConnections = 100;
  const wss = new WebSocketServer({ noServer: true, maxPayload: 8192, perMessageDeflate: false });
  server.on('upgrade', async (req, socket, head) => {
    socket.on('error', () => {});
    try {
      origin(req);
      limiter.take('upgrade:' + req.socket.remoteAddress, 60);
      const url = new URL(req.url, 'http://127.0.0.1');
      check(
        url.pathname === '/ws' &&
          [...url.searchParams.keys()].every((key) => key === 'room') &&
          uuid(url.searchParams.get('room')),
        400,
        'Invalid room socket URL.',
      );
      const user = await auth(req),
        id = url.searchParams.get('room');
      await store.room(id, user.id);
      check(!stopping, 503, 'Server stopping.');
      wss.handleUpgrade(req, socket, head, (ws) => {
        rooms
          .attach(id, user, ws, readCookie(req))
          .catch(() => ws.close(4003, 'Room unavailable.'));
      });
    } catch (error) {
      socket.end('HTTP/1.1 ' + (error.status || 400) + ' Rejected\r\nConnection: close\r\n\r\n');
    }
  });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(options.port ?? 4180, '127.0.0.1', () => {
        port = server.address().port;
        server.removeListener('error', reject);
        resolve();
      });
    });
  } catch (error) {
    wss.close();
    if (!options.store) await store.close();
    throw error;
  }
  if (options.tick !== false) rooms.run();
  return {
    server,
    store,
    rooms,
    url: 'http://127.0.0.1:' + port,
    close() {
      if (closingPromise) return closingPromise;
      closingPromise = (async () => {
        stopping = true;
        let failure;
        try {
          await rooms.close();
        } catch (error) {
          failure = error;
        }
        for (const ws of wss.clients) ws.terminate();
        await new Promise((resolve) => wss.close(resolve));
        await new Promise((resolve) => server.close(resolve));
        if (!options.store) await store.close();
        if (failure) throw failure;
      })();
      return closingPromise;
    },
  };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  let port = 4180,
    dataDir = path.resolve('.local-data');
  for (let i = 0; i < args.length; i += 2) {
    check(
      typeof args[i + 1] === 'string' && !args[i + 1].startsWith('--'),
      400,
      'Each option requires a value.',
    );
    if (args[i] === '--port') port = Number(args[i + 1]);
    else if (args[i] === '--data-dir') dataDir = path.resolve(args[i + 1]);
    else throw new Error('Use --port or --data-dir.');
  }
  check(
    Number.isInteger(port) && port >= 1024 && port <= 65535,
    400,
    'Choose a port from 1024 to 65535.',
  );
  createBackend({ port, dataDir })
    .then((app) => {
      process.stdout.write(
        'ZeldaBonk LOCAL backend: ' +
          app.url +
          '\nDatabase: ' +
          dataDir +
          '\nNo cloud resources are used.\n',
      );
      let closing = false;
      const close = () => {
        if (closing) return;
        closing = true;
        app.close().then(
          () => process.exit(0),
          () => process.exit(1),
        );
      };
      process.on('SIGINT', close);
      process.on('SIGTERM', close);
    })
    .catch((error) => {
      process.stderr.write('Local backend failed to start: ' + error.message + '\n');
      process.exitCode = 1;
    });
}
module.exports = { createBackend, readCookie };
