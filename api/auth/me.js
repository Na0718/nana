// api/auth/me.js
// GET /api/auth/me — 校验 JWT，返回当前用户信息和权限

const { extractToken, verifyJWT } = require('../_lib/auth');
const { ok, fail, handleOptions } = require('../_lib/response');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return handleOptions(req, res);

  const token = extractToken(req);
  if (!token) {
    return fail(res, '未登录', 401, req);
  }

  const payload = verifyJWT(token);
  if (!payload) {
    return fail(res, '登录已过期，请重新登录', 401, req);
  }

  return ok(res, {
    open_id: payload.open_id,
    name: payload.name,
    avatar_url: payload.avatar_url,
    role: payload.role,
    allowed_regions: payload.allowed_regions,
    allowed_org_ids: payload.allowed_org_ids,
    pages: payload.pages,
  }, req);
};
