const { isAuthenticated } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ authenticated: isAuthenticated(req) }));
};
