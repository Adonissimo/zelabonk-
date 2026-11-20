# ZeldaBonk local backend

This is a working, loopback-only backend for local development and automated tests. It is not deployed online. The game's current browser menus do not connect to it yet.

It implements local accounts and sessions, versioned per-account saves, authoritative one-to-four-player rooms, reconnect and restart recovery, server-issued ranked records and rewards, clans, escrow trading, crafting, a fixed-price market and permanent upgrades. The existing game simulation owns movement, enemies, damage, loot and progression. Clients send inputs, not results.

## Run locally

Requires Node.js 24 or newer. From the game source directory:

```powershell
npm ci --prefix backend --ignore-scripts
npm run backend -- --data-dir 'C:\path\to\private\zeldabonk-data'
```

The service listens only at `http://127.0.0.1:4180`. `--port 4181` selects another local port. `/health` returns service status. Ctrl+C saves active rooms and stops the service. Back up the entire data directory only after stopping the service; do not copy individual PostgreSQL files while it is running.

Without `--data-dir`, data is stored in `.local-data` under the current working directory. That directory and environment files are ignored by Git. The local static game server rejects dot-directories and backend paths. Use a private data directory outside any web server's document root.

PGlite provides embedded PostgreSQL 18.7 with real SQL transactions and disk persistence, without Docker or a database account. It is a single-process database, not a hosted PostgreSQL pool. The SQL schema uses PostgreSQL tables and constraints; migration to Supabase still needs a production database adapter, authentication integration and deployment verification.

## Verify

```powershell
npm run test:backend
npm test
```

Tests use isolated databases and generated local accounts. They exercise actual HTTP and two WebSocket clients, real-time movement, authorization, save conflicts, shared XP, team pause, disconnect/reconnect, service restart, deterministic simulation snapshots, duplicate settlement, escrow, concurrent overspending and transaction rollback. Tests never use the user's PokéBonk account or cloud credentials.

The authoritative party reuses `core.js`. Every actor has its own hero, build, health and cooldowns. Enemies target living party members; projectiles and status damage retain their owner. XP is shared, with the party's mean equipment XP bonus. All living players choose their own upgrade before the world resumes. Gate travel moves the whole party. Current co-op rules are this project's local ruleset, not a claim of exact PokéBonk parity.

## Authentication and request rules

Use JSON and `Origin: http://127.0.0.1:4180` for every write request. Cookies returned by registration or login are `HttpOnly`, `SameSite=Strict`, scoped to `/` and expire after twelve hours. The cookie is intentionally not `Secure` on loopback HTTP. Passwords use salted scrypt; only session-token hashes are stored. Do not use a real password for local test accounts.

The service rejects non-loopback Host headers, foreign/missing write Origins, unknown request fields, bodies over 260,000 bytes and unauthenticated private endpoints. No cross-origin access is enabled. A Vercel page cannot connect to this local API as though it were an online service.

Example local test account with a generated password and cookie session:

```powershell
$localBase = 'http://127.0.0.1:4180'
$localHeaders = @{ Origin = $localBase }
$localCredentials = @{
  username = 'tester_' + [guid]::NewGuid().ToString('N').Substring(0, 8)
  password = [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
} | ConvertTo-Json
Invoke-RestMethod "$localBase/api/auth/register" -Method Post `
  -Headers $localHeaders -ContentType 'application/json' `
  -Body $localCredentials -SessionVariable localSession
Invoke-RestMethod "$localBase/api/me" -WebSession $localSession
```

Only use generated accounts against this local service. The backend does not send email or create external accounts.

## HTTP API

Private routes derive account ownership from the session. They never accept an account ID to select another player's save or wallet.

| Method and path | Body or result |
|---|---|
| `GET /health` | Public local health; no database contents |
| `POST /api/auth/register` | `username`, `password`; creates local account and cookie |
| `POST /api/auth/login` | `username`, `password`; returns new cookie |
| `POST /api/auth/logout` | `{}`; revokes cookie and matching live connections |
| `GET /api/me` | Account identity and authoritative profile/inventory |
| `GET /api/accounts?username=...` | Public identity lookup for another local account, after sign-in |
| `GET /api/save` | Own `revision`, `body`, `updated_at`; revision 0 if absent |
| `PUT /api/save` | Expected `revision`, validated ZeldaBonk profile `body` |
| `GET /api/rooms` | Own recent rooms, for reconnect discovery |
| `POST /api/rooms` | `hero`, `mode` (`adventure`/`survival`), `difficulty`, boolean `ranked` |
| `GET /api/rooms/:id` | Member-only room metadata, without private simulation or invite token |
| `POST /api/rooms/:id/join` | `invite`, unlocked `hero`; lobby only |
| `POST /api/rooms/:id/invite` | `{}`; host rotates lobby invitation |
| `POST /api/rooms/:id/start` | `{}`; host only, all members connected |
| `POST /api/rooms/:id/leave` | `{}`; lobby only; host closes lobby |
| `POST /api/rooms/:id/abandon` | `{}`; host ends active team run as a loss |
| `GET /api/leaderboard` | Local server-owned ranked results only |
| `GET /api/clan` | Own clan and its roster |
| `POST /api/clan` | `name`; create a clan |
| `POST /api/clan/invite` | `{}`; owner creates one-day invitation |
| `POST /api/clan/join` | `invite`; one clan per account, maximum 30 members |
| `POST /api/clan/kick` | `accountId`; owner only, cannot remove self |
| `POST /api/clan/leave` | `{}`; owner can close only an otherwise empty clan |
| `POST /api/trades` | `requestId`, `receiverId`, `offer` mapping treasure IDs to quantities |
| `GET /api/trades/:id` | Participants only |
| `POST /api/trades/:id/offer` | Expected `revision`, replacement own `offer` |
| `POST /api/trades/:id/confirm` | Exact current `revision`; both participants must consent |
| `POST /api/trades/:id/cancel` | Current `revision`; either participant releases escrow |
| `GET /api/catalog` | Server crafting recipes and fixed market prices |
| `POST /api/craft` | Unique `requestId`, known `recipe` |
| `POST /api/market` | Unique `requestId`, `item`, integer `quantity`, `side` (`buy`/`sell`) |
| `POST /api/upgrades` | Unique `requestId`, permanent `upgrade` ID |

Use a fresh 12–80-character request ID per intended transaction. Retrying the same operation with the same ID returns its prior result; reusing it for a different payload returns 409. Offer changes reset both trade acceptances and increment its revision. Escrow items cannot be crafted, sold or offered elsewhere. Completed settlement and transfers cannot be repeated by retrying.

Cloud-save content is separate from the authoritative wallet and inventory. Uploading a rich offline save cannot grant server currency, unlocks, tradable items or ranked results. Importing or tampering with local browser storage never promotes an offline run into a ranked record.

## WebSocket protocol

Connect to `ws://127.0.0.1:4180/ws?room=ROOM_UUID` with the signed-in cookie and matching local Origin. Never place session tokens in URLs. The server sends `hello` with `nextSeq`; start or resume numbering from that value. A new connection replaces the account's earlier connection in that room.

Movement message:

```json
{"type":"input","seq":1,"x":1,"y":0,"cameraYaw":0,"glide":false}
```

Each axis must be within -1 and 1; yaw must be within -π and π. Movement normalizes diagonal input. Send fresh input while moving, and zero axes on release. Input expires after 250 milliseconds to prevent stuck movement.

Action messages:

```json
{"type":"action","seq":2,"action":"jump"}
{"type":"action","seq":3,"action":"choose","choice":"ember"}
```

Allowed actions: `dash`, `jump`, `ultimate`, `interact`, `aim`, `lock`, `choose`, `refresh`, `skip`, `banish`, `pause`, `resume`. Availability, cooldowns, resources, offered choices and proximity come from simulation state. Each player removes only their own pause vote. A disconnected member pauses the team's clock until reconnect.

Messages are limited to 8 KiB and rate-limited. Strictly increasing sequences reject replay; unaccepted messages do not consume a sequence. An `ack` confirms receipt, not disk durability. Snapshots arrive at 10 Hz and include each actor, shared enemies, hazards and loot, own choices, acknowledged sequence, pause/reconnect state and `settled`. The seed, random state and private persistent account data are not exposed.

Active room snapshots persist about every two seconds and on graceful shutdown. An abrupt process or power failure may roll back up to the latest completed snapshot; reconnect must use the server's returned sequence. Random state, projectile hit sets, builds, bosses and signed zero values survive persistence. A storage failure pauses the affected room; it does not prevent other rooms from saving. Terminal rewards and records commit together, exactly once per room/account. A zero-kill or sub-ten-second abandoned loss grants no rupees.

## Boundaries before online deployment

Browser sign-in/lobby/co-op rendering remains to be integrated. This service supplies real endpoints and room simulation, not a finished multiplayer browser experience.

Supabase authentication/JWT verification, production PostgreSQL connections and row-level policies, email recovery, TLS/reverse proxy configuration, public hosting, multi-process coordination, load testing and a production security review remain future work. Clans do not yet have reference missions or chat. The fixed market is not a player-listed auction market. No reference Daily/Relay/Expedition modes are fabricated by this backend.

Vercel still hosts the static single-player game. Backend paths are excluded/blocked in the static hosting configuration; no server is deployed by this local step. Do not expose the service through a tunnel or change its bind address as a shortcut to production deployment.
