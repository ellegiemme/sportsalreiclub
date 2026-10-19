// Password login with server-side sessions stored in D1.

const COOKIE = 'ssrc_admin';
const SESSION_DAYS = 14;
const MAX_FAILS = 8;          // per IP, per 15 minutes
const ITERATIONS = 100000;    // PBKDF2 (the Workers runtime caps it at 100k)

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

async function sha256(text) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

export async function hashPassword(password, saltHex) {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return { hash: hex(bits), salt: hex(salt) };
}

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function clientIp(request) {
  return request.headers.get('cf-connecting-ip') || 'local';
}

export async function tooManyAttempts(db, ip) {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND at > datetime('now', '-15 minutes')`).bind(ip).first();
  return row.n >= MAX_FAILS;
}

export async function checkLogin(db, request, email, password) {
  const ip = clientIp(request);
  const user = await db.prepare('SELECT * FROM admin_users WHERE email = ?').bind(String(email).trim()).first();
  if (user) {
    const { hash } = await hashPassword(String(password), user.pass_salt);
    if (sameString(hash, user.pass_hash)) {
      await db.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
      return user;
    }
  }
  await db.prepare('INSERT INTO login_attempts (ip) VALUES (?)').bind(ip).run();
  return null;
}

export async function startSession(db, userId) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await db.prepare(`DELETE FROM admin_sessions WHERE expires_at < datetime('now')`).run();
  await db.prepare(`INSERT INTO admin_sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`)
    .bind(await sha256(token), userId).run();
  return `${COOKIE}=${token}; Path=/admin; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}

function readCookie(request) {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`));
  return m ? m[1] : null;
}

export async function currentUser(db, request) {
  const token = readCookie(request);
  if (!token) return null;
  return db.prepare(`SELECT u.id, u.email, u.name, u.is_owner FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')`).bind(await sha256(token)).first();
}

export async function endSession(db, request) {
  const token = readCookie(request);
  if (token) await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return `${COOKIE}=; Path=/admin; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Form posts must come from our own pages.
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
  return origin === new URL(request.url).origin;
}

export function setupKeyMatches(env, key) {
  return !!env.SETUP_KEY && typeof key === 'string' && sameString(key, env.SETUP_KEY);
}
