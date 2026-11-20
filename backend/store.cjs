'use strict';
const fs = require('node:fs/promises'),
  path = require('node:path'),
  crypto = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');
const { Profile } = require('../profile.js'),
  { Combat, PERMANENT } = require('../core.js');
const { check, digest, token, HttpError, offer } = require('./security.cjs');
const one = async (db, sql, args = []) => (await db.query(sql, args)).rows[0];
const progress = (profile) => ({
  upgrades: profile.upgrades,
  guardians: profile.guardians,
  items: profile.items,
  gear: profile.gear,
  adventureWins: profile.adventureWins,
  survivalWins: profile.survivalWins,
  bestKills: profile.bestKills,
  bestTime: profile.bestTime,
});
const profileFrom = (row) =>
  new Profile({
    ...row.progress,
    rupees: row.rupees,
    runs: row.runs,
    wins: row.wins,
    totalKills: Number(row.total_kills),
  });
const CRAFT = Object.freeze({
  shockfruit: { cost: { firefruit: 2, splashfruit: 2 }, item: 'shockfruit', quantity: 1 },
  ancientbow: { cost: { bow: 3, blade: 2 }, item: 'ancientbow', quantity: 1 },
});
const MARKET = Object.freeze({
  radish: 15,
  violet: 15,
  hawkeye: 20,
  bow: 20,
  firefruit: 60,
  icefruit: 60,
  splashfruit: 60,
  shockfruit: 120,
});
class Store {
  static async open(directory) {
    const store = new Store();
    store.db = new PGlite(directory || 'memory://');
    try {
      await store.db.waitReady;
      const existing = await one(
        store.db,
        "SELECT to_regclass('public.schema_version') AS present",
      );
      if (existing.present) {
        const version = await one(store.db, 'SELECT max(version) AS version FROM schema_version');
        check(version.version === 1, 500, 'Unsupported database version.');
      }
      const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
      await store.db.transaction((tx) => tx.exec(schema));
      return store;
    } catch (error) {
      await store.db.close();
      throw error;
    }
  }
  close() {
    return this.db.close();
  }
  async account(username) {
    return one(this.db, 'SELECT id,username,password_hash FROM accounts WHERE username=$1', [
      username,
    ]);
  }
  async createAccount(username, passwordHash) {
    return this.db.transaction(async (tx) => {
      const id = crypto.randomUUID();
      await tx.query('INSERT INTO accounts(id,username,password_hash) VALUES($1,$2,$3)', [
        id,
        username,
        passwordHash,
      ]);
      await tx.query('INSERT INTO profiles(account_id) VALUES($1)', [id]);
      return { id, username };
    });
  }
  async session(accountId) {
    const value = token();
    await this.db.query(
      "INSERT INTO sessions(token_hash,account_id,expires_at) VALUES($1,$2,now()+interval '12 hours')",
      [digest(value), accountId],
    );
    return value;
  }
  async authenticate(value) {
    if (typeof value !== 'string' || !/^[-_a-zA-Z0-9]{43}$/.test(value)) return null;
    return one(
      this.db,
      'SELECT a.id,a.username,s.expires_at FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE token_hash=$1 AND expires_at>now()',
      [digest(value)],
    );
  }
  async logout(value) {
    if (value) await this.db.query('DELETE FROM sessions WHERE token_hash=$1', [digest(value)]);
  }
  async lock(tx, ids) {
    for (const id of [...new Set(ids)].sort())
      check(
        await one(tx, 'SELECT account_id FROM profiles WHERE account_id=$1 FOR UPDATE', [id]),
        404,
        'Account not found.',
      );
  }
  async getProfile(id) {
    const row = await one(this.db, 'SELECT * FROM profiles WHERE account_id=$1', [id]);
    check(row, 404, 'Account not found.');
    return {
      ...profileFrom(row).toJSON(),
      inventory: (
        await this.db.query(
          'SELECT item_id,quantity FROM inventory WHERE account_id=$1 AND quantity>0 ORDER BY item_id',
          [id],
        )
      ).rows,
    };
  }
  async getSave(id) {
    const row = await one(
      this.db,
      'SELECT revision,body,updated_at FROM cloud_saves WHERE account_id=$1',
      [id],
    );
    return row || { revision: 0, body: null };
  }
  async listRooms(user) {
    return (
      await this.db.query(
        'SELECT r.id,r.status,r.mode,r.difficulty,r.ranked,r.updated_at,m.hero FROM rooms r JOIN room_members m ON m.room_id=r.id WHERE m.account_id=$1 ORDER BY r.updated_at DESC LIMIT 20',
        [user],
      )
    ).rows;
  }
  async roomInvite(id, user) {
    return this.db.transaction(async (tx) => {
      const row = await one(tx, 'SELECT host_id,status FROM rooms WHERE id=$1 FOR UPDATE', [id]);
      check(row?.host_id === user, 403, 'Only the host can issue a room invitation.');
      check(row.status === 'lobby', 409, 'Invitations close when the run starts.');
      const invite = token();
      await tx.query('UPDATE rooms SET invite_hash=$2,revision=revision+1 WHERE id=$1', [
        id,
        digest(invite),
      ]);
      return { invite };
    });
  }
  async putSave(id, expected, body) {
    const normalized = Profile.import(JSON.stringify(body)).toJSON();
    return this.db.transaction(async (tx) => {
      await this.lock(tx, [id]);
      const old = await one(tx, 'SELECT revision FROM cloud_saves WHERE account_id=$1', [id]);
      check(
        (old?.revision || 0) === expected,
        409,
        'Save changed on another device. Fetch it before saving again.',
      );
      return one(
        tx,
        'INSERT INTO cloud_saves(account_id,revision,body) VALUES($1,1,$2) ON CONFLICT(account_id) DO UPDATE SET revision=cloud_saves.revision+1,body=EXCLUDED.body,updated_at=now() RETURNING revision,updated_at',
        [id, JSON.stringify(normalized)],
      );
    });
  }
  async changeItems(tx, id, items, direction) {
    for (const [item, count] of Object.entries(items)) {
      if (direction < 0) {
        const row = await one(
          tx,
          'UPDATE inventory SET quantity=quantity-$3 WHERE account_id=$1 AND item_id=$2 AND quantity >= $3 RETURNING quantity',
          [id, item, count],
        );
        check(row, 409, 'Insufficient available inventory. Reserved trade items cannot be spent.');
      } else
        await tx.query(
          'INSERT INTO inventory(account_id,item_id,quantity) VALUES($1,$2,$3) ON CONFLICT(account_id,item_id) DO UPDATE SET quantity=inventory.quantity+EXCLUDED.quantity',
          [id, item, count],
        );
    }
  }
  async operation(id, key, kind, payload, work) {
    const fingerprint = digest(JSON.stringify(payload));
    return this.db.transaction(async (tx) => {
      await this.lock(tx, [id]);
      const previous = await one(
        tx,
        'SELECT * FROM operations WHERE account_id=$1 AND request_id=$2',
        [id, key],
      );
      if (previous) {
        check(
          previous.kind === kind && previous.fingerprint === fingerprint,
          409,
          'This requestId was already used for a different action.',
        );
        return previous.result;
      }
      const result = await work(tx);
      await tx.query(
        'INSERT INTO operations(account_id,request_id,kind,fingerprint,result) VALUES($1,$2,$3,$4,$5)',
        [id, key, kind, fingerprint, JSON.stringify(result)],
      );
      return result;
    });
  }
  async purchaseUpgrade(id, key, upgrade) {
    check(
      PERMANENT.some((item) => item.id === upgrade),
      400,
      'Unknown permanent upgrade.',
    );
    return this.operation(id, key, 'upgrade', { upgrade }, async (tx) => {
      const profile = profileFrom(
        await one(tx, 'SELECT * FROM profiles WHERE account_id=$1', [id]),
      );
      check(profile.purchase(upgrade), 409, 'Upgrade is maxed or unaffordable.');
      await tx.query('UPDATE profiles SET rupees=$2,progress=$3 WHERE account_id=$1', [
        id,
        profile.rupees,
        JSON.stringify(progress(profile)),
      ]);
      return { rupees: profile.rupees, upgrades: profile.upgrades };
    });
  }
  async craft(id, key, recipe) {
    check(Object.hasOwn(CRAFT, recipe), 400, 'Unknown crafting recipe.');
    return this.operation(id, key, 'craft', { recipe }, async (tx) => {
      const rule = CRAFT[recipe];
      await this.changeItems(tx, id, rule.cost, -1);
      await this.changeItems(tx, id, { [rule.item]: rule.quantity }, 1);
      return { item: rule.item, quantity: rule.quantity };
    });
  }
  async market(id, key, item, quantity, side) {
    check(
      Object.hasOwn(MARKET, item) &&
        Number.isInteger(quantity) &&
        quantity >= 1 &&
        quantity <= 100 &&
        ['buy', 'sell'].includes(side),
      400,
      'Invalid market order.',
    );
    return this.operation(id, key, 'market', { item, quantity, side }, async (tx) => {
      const price = quantity * (side === 'buy' ? MARKET[item] : Math.floor(MARKET[item] / 2));
      if (side === 'buy') {
        check(
          await one(
            tx,
            'UPDATE profiles SET rupees=rupees-$2 WHERE account_id=$1 AND rupees >= $2 RETURNING rupees',
            [id, price],
          ),
          409,
          'Not enough rupees.',
        );
        await this.changeItems(tx, id, { [item]: quantity }, 1);
      } else {
        await this.changeItems(tx, id, { [item]: quantity }, -1);
        await tx.query('UPDATE profiles SET rupees=rupees+$2 WHERE account_id=$1', [id, price]);
      }
      return { item, quantity, side, price };
    });
  }
  async createRoom(host, config) {
    return this.db.transaction(async (tx) => {
      await this.lock(tx, [host]);
      const active = await one(
        tx,
        "SELECT r.id FROM rooms r JOIN room_members m ON m.room_id=r.id WHERE m.account_id=$1 AND r.status IN ('lobby','running')",
        [host],
      );
      check(!active, 409, 'Leave or finish your current room first.');
      const id = crypto.randomUUID(),
        invite = token();
      await tx.query(
        "INSERT INTO rooms(id,host_id,invite_hash,status,ranked,mode,difficulty,ruleset) VALUES($1,$2,$3,'lobby',$4,$5,$6,$7)",
        [id, host, digest(invite), config.ranked, config.mode, config.difficulty, '2.2.0-local-1'],
      );
      await tx.query('INSERT INTO room_members(room_id,account_id,hero) VALUES($1,$2,$3)', [
        id,
        host,
        config.hero,
      ]);
      return { id, invite };
    });
  }
  async room(id, user) {
    const row = await one(
      this.db,
      'SELECT r.* FROM rooms r JOIN room_members m ON m.room_id=r.id WHERE r.id=$1 AND m.account_id=$2',
      [id, user],
    );
    check(row, 404, 'Room not found.');
    row.members = (
      await this.db.query(
        'SELECT m.account_id,m.hero,a.username FROM room_members m JOIN accounts a ON a.id=m.account_id WHERE room_id=$1 ORDER BY m.account_id',
        [id],
      )
    ).rows;
    delete row.invite_hash;
    return row;
  }
  async joinRoom(id, user, invite, hero) {
    return this.db.transaction(async (tx) => {
      const room = await one(tx, 'SELECT * FROM rooms WHERE id=$1 FOR UPDATE', [id]);
      check(
        room && typeof invite === 'string' && room.invite_hash === digest(invite),
        404,
        'Room or invitation not found.',
      );
      const existing = await one(
        tx,
        'SELECT account_id FROM room_members WHERE room_id=$1 AND account_id=$2',
        [id, user],
      );
      if (existing) return { id };
      check(room.status === 'lobby', 409, 'The run has already started.');
      await this.lock(tx, [user]);
      check(
        !(await one(
          tx,
          "SELECT r.id FROM rooms r JOIN room_members m ON m.room_id=r.id WHERE m.account_id=$1 AND r.status IN ('lobby','running')",
          [user],
        )),
        409,
        'Leave or finish your current room first.',
      );
      const count = await one(
        tx,
        'SELECT count(*)::integer AS count FROM room_members WHERE room_id=$1',
        [id],
      );
      check(count.count < 4, 409, 'Room is full.');
      await tx.query('INSERT INTO room_members(room_id,account_id,hero) VALUES($1,$2,$3)', [
        id,
        user,
        hero,
      ]);
      await tx.query('UPDATE rooms SET revision=revision+1,updated_at=now() WHERE id=$1', [id]);
      return { id };
    });
  }
  async leaveRoom(id, user) {
    return this.db.transaction(async (tx) => {
      const room = await one(tx, 'SELECT * FROM rooms WHERE id=$1 FOR UPDATE', [id]);
      check(
        room &&
          (await one(tx, 'SELECT account_id FROM room_members WHERE room_id=$1 AND account_id=$2', [
            id,
            user,
          ])),
        404,
        'Room not found.',
      );
      check(
        room.status === 'lobby',
        409,
        'A started run keeps its membership for reconnect and settlement.',
      );
      if (room.host_id === user)
        await tx.query("UPDATE rooms SET status='closed',revision=revision+1 WHERE id=$1", [id]);
      else {
        await tx.query('DELETE FROM room_members WHERE room_id=$1 AND account_id=$2', [id, user]);
        await tx.query('UPDATE rooms SET revision=revision+1 WHERE id=$1', [id]);
      }
      return { left: true };
    });
  }
  async saveRoom(id, expected, status, snapshot) {
    const row = await one(
      this.db,
      'UPDATE rooms SET snapshot=$4,status=$3,revision=revision+1,updated_at=now() WHERE id=$1 AND revision=$2 RETURNING revision',
      [id, expected, status, JSON.stringify(snapshot)],
    );
    check(row, 409, 'Room changed on another server.');
    return row.revision;
  }
  async activeRooms() {
    return (await this.db.query("SELECT * FROM rooms WHERE status='running' ORDER BY id")).rows;
  }
  async settleRoom(id, game) {
    check(['won', 'lost'].includes(game.state), 409, 'The server run has not ended.');
    return this.db.transaction(async (tx) => {
      const room = await one(tx, 'SELECT * FROM rooms WHERE id=$1 FOR UPDATE', [id]);
      check(
        room && ['running', 'won', 'lost'].includes(room.status),
        409,
        'Room is not a server-owned run.',
      );
      const members = (
        await tx.query('SELECT account_id FROM room_members WHERE room_id=$1 ORDER BY account_id', [
          id,
        ])
      ).rows;
      await this.lock(
        tx,
        members.map((member) => member.account_id),
      );
      const results = [];
      for (const { account_id: accountId } of members) {
        const previous = await one(
          tx,
          'SELECT reward FROM run_results WHERE room_id=$1 AND account_id=$2',
          [id, accountId],
        );
        if (previous) {
          results.push({ accountId, reward: previous.reward, duplicate: true });
          continue;
        }
        const profile = profileFrom(
          await one(tx, 'SELECT * FROM profiles WHERE account_id=$1', [accountId]),
        );
        const result = game.withActor(accountId, () => profile.settle(game));
        if (game.state === 'lost' && (game.time < 10 || game.kills === 0)) {
          profile.rupees -= result.reward;
          result.reward = 0;
        }
        await tx.query(
          'INSERT INTO run_results(room_id,account_id,won,kills,duration_ms,reward,ranked,ruleset) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
          [
            id,
            accountId,
            game.state === 'won',
            game.kills,
            Math.floor(game.time * 1000),
            result.reward,
            room.ranked,
            room.ruleset,
          ],
        );
        await tx.query(
          'UPDATE profiles SET rupees=$2,runs=$3,wins=$4,total_kills=$5,progress=$6 WHERE account_id=$1',
          [
            accountId,
            profile.rupees,
            profile.runs,
            profile.wins,
            profile.totalKills,
            JSON.stringify(progress(profile)),
          ],
        );
        await this.changeItems(tx, accountId, game.members.get(accountId).gear, 1);
        results.push({ accountId, ...result });
      }
      await tx.query(
        'UPDATE rooms SET status=$2,snapshot=$3,revision=revision+1,updated_at=now() WHERE id=$1',
        [id, game.state, JSON.stringify(game.serialize())],
      );
      return results;
    });
  }
  async leaderboard() {
    return (
      await this.db.query(
        'SELECT a.username,sum(r.kills)::bigint AS kills,count(*)::integer AS runs,min(r.duration_ms) FILTER (WHERE r.won) AS best_win_ms FROM run_results r JOIN accounts a ON a.id=r.account_id WHERE r.ranked GROUP BY a.id,a.username ORDER BY kills DESC,best_win_ms ASC NULLS LAST,a.username LIMIT 20',
      )
    ).rows;
  }
  async clan(user) {
    const row = await one(
      this.db,
      'SELECT c.id,c.name,m.role FROM clans c JOIN clan_members m ON m.clan_id=c.id WHERE m.account_id=$1',
      [user],
    );
    if (!row) return null;
    row.members = (
      await this.db.query(
        'SELECT a.id,a.username,m.role FROM clan_members m JOIN accounts a ON a.id=m.account_id WHERE clan_id=$1 ORDER BY a.username',
        [row.id],
      )
    ).rows;
    return row;
  }
  async createClan(user, name) {
    check(
      typeof name === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9 _-]{2,31}$/.test(name),
      400,
      'Clan names use 3–32 letters, numbers, spaces or hyphens.',
    );
    return this.db.transaction(async (tx) => {
      await this.lock(tx, [user]);
      check(
        !(await one(tx, 'SELECT clan_id FROM clan_members WHERE account_id=$1', [user])),
        409,
        'Leave your current clan first.',
      );
      const id = crypto.randomUUID();
      await tx.query('INSERT INTO clans(id,name) VALUES($1,$2)', [id, name]);
      await tx.query("INSERT INTO clan_members(clan_id,account_id,role) VALUES($1,$2,'owner')", [
        id,
        user,
      ]);
      return { id, name };
    });
  }
  async inviteClan(user) {
    return this.db.transaction(async (tx) => {
      const member = await one(
        tx,
        "SELECT clan_id FROM clan_members WHERE account_id=$1 AND role='owner'",
        [user],
      );
      check(member, 403, 'Only the clan owner can invite members.');
      const invite = token();
      await tx.query(
        "INSERT INTO clan_invites(token_hash,clan_id,expires_at) VALUES($1,$2,now()+interval '1 day')",
        [digest(invite), member.clan_id],
      );
      return { invite };
    });
  }
  async joinClan(user, invite) {
    check(typeof invite === 'string' && invite.length === 43, 400, 'Invalid invitation.');
    return this.db.transaction(async (tx) => {
      const row = await one(
        tx,
        'SELECT c.id FROM clan_invites i JOIN clans c ON c.id=i.clan_id WHERE i.token_hash=$1 AND i.expires_at>now() FOR UPDATE OF c',
        [digest(invite)],
      );
      check(row, 404, 'Invitation not found or expired.');
      await this.lock(tx, [user]);
      check(
        !(await one(tx, 'SELECT clan_id FROM clan_members WHERE account_id=$1', [user])),
        409,
        'Leave your current clan first.',
      );
      const count = await one(
        tx,
        'SELECT count(*)::integer AS count FROM clan_members WHERE clan_id=$1',
        [row.id],
      );
      check(count.count < 30, 409, 'Clan is full.');
      await tx.query("INSERT INTO clan_members(clan_id,account_id,role) VALUES($1,$2,'member')", [
        row.id,
        user,
      ]);
      return { id: row.id };
    });
  }
  async leaveClan(user) {
    return this.db.transaction(async (tx) => {
      const member = await one(
        tx,
        'SELECT clan_id,role FROM clan_members WHERE account_id=$1 FOR UPDATE',
        [user],
      );
      check(member, 404, 'You are not in a clan.');
      if (member.role === 'owner') {
        const other = await one(
          tx,
          'SELECT account_id FROM clan_members WHERE clan_id=$1 AND account_id<>$2',
          [member.clan_id, user],
        );
        check(!other, 409, 'Remove other members before closing your clan.');
        await tx.query('DELETE FROM clans WHERE id=$1', [member.clan_id]);
      } else await tx.query('DELETE FROM clan_members WHERE account_id=$1', [user]);
      return { left: true };
    });
  }
  async kickClan(user, target) {
    return this.db.transaction(async (tx) => {
      const member = await one(
        tx,
        "SELECT clan_id FROM clan_members WHERE account_id=$1 AND role='owner'",
        [user],
      );
      check(member, 403, 'Only the clan owner can remove members.');
      check(user !== target, 400, 'Use leave to close your own clan.');
      const removed = await one(
        tx,
        'DELETE FROM clan_members WHERE clan_id=$1 AND account_id=$2 RETURNING account_id',
        [member.clan_id, target],
      );
      check(removed, 404, 'Member not found.');
      return { removed: true };
    });
  }
  async getTrade(id, user, db = this.db, lock = false) {
    const row = await one(
      db,
      'SELECT * FROM trades WHERE id=$1 AND (sender_id=$2 OR receiver_id=$2)' +
        (lock ? ' FOR UPDATE' : ''),
      [id, user],
    );
    check(row, 404, 'Trade not found.');
    return row;
  }
  async createTrade(sender, receiver, items, key) {
    check(sender !== receiver, 400, 'Choose another account.');
    check(Object.keys(items).length > 0, 400, 'Offer at least one item.');
    return this.operation(sender, key, 'trade', { receiver, items }, async (tx) => {
      check(
        await one(tx, 'SELECT id FROM accounts WHERE id=$1', [receiver]),
        404,
        'Recipient not found.',
      );
      await this.changeItems(tx, sender, items, -1);
      const id = crypto.randomUUID();
      return one(
        tx,
        "INSERT INTO trades(id,sender_id,receiver_id,status,sender_offer) VALUES($1,$2,$3,'open',$4) RETURNING *",
        [id, sender, receiver, JSON.stringify(items)],
      );
    });
  }
  async updateTrade(id, user, expected, items) {
    return this.db.transaction(async (tx) => {
      const trade = await this.getTrade(id, user, tx, true);
      check(
        trade.status === 'open' && trade.revision === expected,
        409,
        'Trade changed. Review its latest revision.',
      );
      await this.lock(tx, [trade.sender_id, trade.receiver_id]);
      const column = trade.sender_id === user ? 'sender_offer' : 'receiver_offer';
      await this.changeItems(tx, user, trade[column], 1);
      await this.changeItems(tx, user, items, -1);
      return one(
        tx,
        'UPDATE trades SET ' +
          column +
          '=$2,revision=revision+1,sender_accepted=false,receiver_accepted=false WHERE id=$1 RETURNING *',
        [id, JSON.stringify(items)],
      );
    });
  }
  async confirmTrade(id, user, expected) {
    return this.db.transaction(async (tx) => {
      const trade = await this.getTrade(id, user, tx, true);
      check(
        trade.revision === expected && trade.status !== 'cancelled',
        409,
        'Trade changed. Review its latest revision.',
      );
      if (trade.status === 'complete') return trade;
      await this.lock(tx, [trade.sender_id, trade.receiver_id]);
      trade[trade.sender_id === user ? 'sender_accepted' : 'receiver_accepted'] = true;
      if (trade.sender_accepted && trade.receiver_accepted) {
        await this.changeItems(tx, trade.receiver_id, trade.sender_offer, 1);
        await this.changeItems(tx, trade.sender_id, trade.receiver_offer, 1);
        trade.status = 'complete';
      }
      return one(
        tx,
        'UPDATE trades SET sender_accepted=$2,receiver_accepted=$3,status=$4 WHERE id=$1 RETURNING *',
        [id, trade.sender_accepted, trade.receiver_accepted, trade.status],
      );
    });
  }
  async cancelTrade(id, user, expected) {
    return this.db.transaction(async (tx) => {
      const trade = await this.getTrade(id, user, tx, true);
      check(
        trade.revision === expected && trade.status !== 'complete',
        409,
        'Trade changed or is complete.',
      );
      if (trade.status === 'cancelled') return trade;
      await this.lock(tx, [trade.sender_id, trade.receiver_id]);
      await this.changeItems(tx, trade.sender_id, trade.sender_offer, 1);
      await this.changeItems(tx, trade.receiver_id, trade.receiver_offer, 1);
      return one(tx, "UPDATE trades SET status='cancelled' WHERE id=$1 RETURNING *", [id]);
    });
  }
}
module.exports = { Store, one, profileFrom, CRAFT, MARKET };
