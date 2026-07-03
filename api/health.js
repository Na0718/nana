// api/health.js
// GET /api/health — 服务健康检查

const { ok, handleOptions } = require('./_lib/response');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  return ok(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }, req);
};
