'use strict';
const crypto = require('node:crypto'),
  { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const check = (condition, status, message) => {
  if (!condition) throw new HttpError(status, message);
};
const token = () => crypto.randomBytes(32).toString('base64url');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const uuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
function fields(body, allowed) {
  check(
    object(body) && Object.keys(body).every((key) => allowed.includes(key)),
    400,
    'Unexpected request fields.',
  );
  return body;
}
function credentials(body) {
  fields(body, ['username', 'password']);
  check(
    typeof body.username === 'string' && /^[a-zA-Z0-9_]{3,24}$/.test(body.username),
    400,
    'Use a username with 3–24 letters, numbers or underscores.',
  );
  check(
    typeof body.password === 'string' &&
      body.password.length >= 12 &&
      Buffer.byteLength(body.password) <= 128,
    400,
    'Use a password with 12–128 bytes.',
  );
  return { username: body.username.toLowerCase(), password: body.password };
}
async function passwordHash(password) {
  const salt = crypto.randomBytes(16),
    key = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
  return 'scrypt$32768$8$3$' + salt.toString('hex') + '$' + key.toString('hex');
}
async function passwordMatches(password, hash) {
  const match = /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(hash || '');
  if (!match) return false;
  const key = await scrypt(password, Buffer.from(match[1], 'hex'), 64, {
    N: 32768,
    r: 8,
    p: 3,
    maxmem: 64 * 1024 * 1024,
  });
  return crypto.timingSafeEqual(key, Buffer.from(match[2], 'hex'));
}
function revision(body) {
  check(
    Number.isSafeInteger(body.revision) && body.revision >= 0 && body.revision < 2147483647,
    400,
    'A valid expected revision is required.',
  );
  return body.revision;
}
function requestId(value) {
  check(
    typeof value === 'string' && /^[-a-zA-Z0-9]{12,80}$/.test(value),
    400,
    'Supply a unique requestId with 12–80 letters, numbers or hyphens.',
  );
  return value;
}
function offer(value) {
  const { Combat } = require('../core.js');
  check(
    object(value) && Object.keys(value).length <= 8,
    400,
    'An offer may contain up to eight item types.',
  );
  const result = {};
  for (const id of Object.keys(value).sort()) {
    check(
      Combat.item(id) && Number.isInteger(value[id]) && value[id] >= 1 && value[id] <= 1000,
      400,
      'Invalid trade item or quantity.',
    );
    result[id] = value[id];
  }
  return result;
}
class RateLimit {
  constructor() {
    this.entries = new Map();
  }
  take(key, limit, windowMs = 60000) {
    const now = Date.now();
    let entry = this.entries.get(key);
    if (!entry || entry.until <= now) {
      entry = { count: 0, until: now + windowMs };
      this.entries.set(key, entry);
    }
    check(++entry.count <= limit, 429, 'Too many requests. Try again shortly.');
    if (this.entries.size > 5000)
      for (const [id, value] of this.entries) if (value.until <= now) this.entries.delete(id);
  }
}
module.exports = {
  HttpError,
  check,
  token,
  digest,
  uuid,
  object,
  fields,
  credentials,
  passwordHash,
  passwordMatches,
  revision,
  requestId,
  offer,
  RateLimit,
};
