const crypto = require('crypto');
const { setSessionCookie } = require('./_lib/auth');

function safeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Método no permitido' }));
  }

  let body = '';
  await new Promise((resolve) => {
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', resolve);
  });

  let password = '';
  try {
    const parsed = JSON.parse(body || '{}');
    password = parsed.password || '';
  } catch (e) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ ok: false, error: 'Solicitud inválida' }));
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: 'ADMIN_PASSWORD no está configurado en el servidor. Configúralo en Vercel → Settings → Environment Variables.' }));
  }

  if (!password || !safeCompare(password, adminPassword)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ ok: false, error: 'Contraseña incorrecta' }));
  }

  setSessionCookie(res);
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
};
