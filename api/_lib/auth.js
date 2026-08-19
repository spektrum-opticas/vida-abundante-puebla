const crypto = require('crypto');

const COOKIE_NAME = 'va_admin';
const SESSION_HOURS = 12;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET no está configurado en Vercel');
  return secret;
}

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function sign(payload) {
  const secret = getSecret();
  const data = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(crypto.createHmac('sha256', secret).update(data).digest());
  return data + '.' + sig;
}

function verify(token) {
  try {
    const secret = getSecret();
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, sig] = parts;
    const expected = b64url(crypto.createHmac('sha256', secret).update(data).digest());
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(fromB64url(data).toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(function (pair) {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function setSessionCookie(res) {
  const token = sign({ exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 });
  res.setHeader(
    'Set-Cookie',
    COOKIE_NAME + '=' + encodeURIComponent(token) +
      '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + (SESSION_HOURS * 3600)
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', COOKIE_NAME + '=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  return !!verify(token);
}

module.exports = { setSessionCookie, clearSessionCookie, isAuthenticated };
