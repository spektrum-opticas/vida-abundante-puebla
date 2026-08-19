const { clearSessionCookie } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Método no permitido' }));
  }

  clearSessionCookie(res);
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
};
