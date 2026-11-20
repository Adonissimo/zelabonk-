# Online backend proposal

Status: the user chose to build and test locally first. A loopback-only Node backend now exists under backend/, using embedded PostgreSQL through PGlite. It implements local authentication, owner-scoped saves, shared authoritative rooms, reconnect/restart recovery, server settlement and ranked records, clans, escrow trading, crafting and a fixed-price market. See backend/README.md for runnable commands, protocol, tests and limits. No cloud resources have been created and no online backend is deployed. The Vercel game does not yet integrate these APIs.

## Deployment shape

The proposed hosted setup uses Supabase for authentication and PostgreSQL persistence, and a separate Render Node service for persistent WebSocket rooms and authoritative game simulation. Vercel continues serving the static game. Long-lived co-op rooms do not fit static hosting or short-lived request handlers.

The local implementation runs real PostgreSQL in-process without Docker. Production migration still needs a PostgreSQL connection adapter and Supabase authentication. Resource creation and hosting costs need separate approval. The free tiers have provider-specific limits and may sleep; continuous multiplayer hosting may cost money. No price or free production capacity is promised.

## Trust boundaries

- The browser sends player input and requested actions. It never supplies authoritative damage, loot rolls, currency balances, ranked scores or reward amounts.
- The local service hashes passwords and validates expiring opaque cookie sessions. Hosted Supabase integration will validate issuer, audience, expiry and signing keys. An invalid session cannot join a private room or access another player's saves.
- Local PostgreSQL holds authoritative profiles, inventory, versioned saves, room snapshots, clan membership and trade state. Only the Node service accesses this embedded database, through owner-scoped operations. Production row-level policies and build-plan persistence remain future work. Server-only credentials never enter browser assets or Git.
- The server runs the shared simulation for co-op and ranked sessions. It bounds input rates, sequence numbers, movement deltas and action frequency. Client prediction is presentation, not authority.
- Local offline saves remain usable for casual play. Importing a local save cannot manufacture an authoritative ranked record or tradable inventory.

## Required transactions

| Operation | Ownership and atomicity |
|---|---|
| Cloud save | Owner-scoped record, expected revision and conflict response; never overwrite another device silently |
| Run settlement | Server-owned run ID, completed result, unique settlement key, one database transaction for all rewards |
| Co-op reconnect | Membership-scoped room token, last accepted input sequence and server snapshot; expired or replaced sessions are rejected |
| Clan actions | Current membership/role checked on every mutation; invitations, role changes and removals are auditable |
| Trading | Both owners confirm the exact offer revision; escrow prevents spending listed items; transfer and completion commit atomically |
| Crafting/market | Recipe/price and owned balance checked on server; unique request key prevents duplicate grants |
| Ranked record | Validated server-run result, fixed ruleset and seed provenance; no browser-submitted score endpoint |

## Reviewable implementation sequence

1. Add schema migrations, owner-scoped persistence and authentication verification with local integration tests for cross-account denial.
2. Add versioned cloud saves and conflict handling while preserving offline play and existing local saves.
3. Add authoritative rooms with shared XP, disconnect/reconnect and bounded inputs. Verify two clients against one server.
4. Add server settlement and ranked records, then clans, trading and crafting/market transactions.
5. Supply environment-variable names, deployment settings and rollback steps. The user creates or selects their provider projects and stores secrets through the providers' settings.
6. Deploy only after the configuration and any hosting costs are approved. Verify public health, sign-in, two-client co-op, reconnect, rejected unauthorized requests and duplicate settlement protection.

The implementation must supply working endpoints, migrations and integration tests. Merely adding disabled menu buttons, browser-only rankings or empty service interfaces does not satisfy the requested online features.
