const { isAuthenticated } = require('./_lib/auth');

const ALLOWED_PREFIXES = ['data/', 'assets/img/uploads/'];
const REPO = process.env.GH_REPO || 'spektrum-opticas/vida-abundante-puebla';
const BRANCH = process.env.GH_BRANCH || 'main';

function isAllowedPath(path) {
  if (typeof path !== 'string' || !path.length) return false;
  if (path.indexOf('..') !== -1) return false;
  return ALLOWED_PREFIXES.some(function (prefix) { return path.indexOf(prefix) === 0; });
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Método no permitido' }));
  }

  if (!isAuthenticated(req)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ ok: false, error: 'No autenticado. Inicia sesión de nuevo.' }));
  }

  const token = process.env.GH_REPO_TOKEN;
  if (!token) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: 'GH_REPO_TOKEN no está configurado en el servidor.' }));
  }

  let body = '';
  await new Promise((resolve) => {
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', resolve);
  });

  let parsed;
  try {
    parsed = JSON.parse(body || '{}');
  } catch (e) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ ok: false, error: 'JSON inválido' }));
  }

  const path = parsed.path;

  if (!isAllowedPath(path)) {
    res.statusCode = 403;
    return res.end(JSON.stringify({ ok: false, error: 'Ruta no permitida: ' + path }));
  }

  let contentStr;
  if (parsed.base64) {
    if (typeof parsed.content !== 'string' || !parsed.content.length) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: 'Contenido de archivo faltante' }));
    }
    contentStr = parsed.content;
  } else {
    try {
      contentStr = Buffer.from(JSON.stringify(parsed.content, null, 2) + '\n', 'utf8').toString('base64');
    } catch (e) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: 'No se pudo procesar el contenido' }));
    }
  }

  const apiUrl = 'https://api.github.com/repos/' + REPO + '/contents/' + path;
  const ghHeaders = {
    Authorization: 'Bearer ' + token,
    'User-Agent': 'vida-abundante-admin',
    Accept: 'application/vnd.github+json'
  };

  try {
    let sha;
    const getRes = await fetch(apiUrl + '?ref=' + BRANCH, { headers: ghHeaders });
    if (getRes.status === 200) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      res.statusCode = 502;
      return res.end(JSON.stringify({ ok: false, error: 'Error al leer el archivo actual de GitHub: ' + errText }));
    }

    const putBody = {
      message: 'Actualización desde el panel de administración: ' + path,
      content: contentStr,
      branch: BRANCH
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders),
      body: JSON.stringify(putBody)
    });

    if (putRes.status !== 200 && putRes.status !== 201) {
      const errText = await putRes.text();
      res.statusCode = 502;
      return res.end(JSON.stringify({ ok: false, error: 'GitHub rechazó el cambio: ' + errText }));
    }

    const putJson = await putRes.json();
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, path: path, downloadUrl: putJson.content && putJson.content.download_url }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: 'Error de servidor: ' + String((e && e.message) || e) }));
  }
};
