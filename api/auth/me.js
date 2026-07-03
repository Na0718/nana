// api/auth/me.js
// GET /api/auth/me — 校验 JWT + 重新查询最新权限（实时）

const { extractToken, verifyJWT, getUserPermissions } = require('../_lib/auth');
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

  // 每次请求都重新从 DB/环境变量查询最新权限
  // 这样修改权限后无需重新登录即可生效
  const freshPerms = await getUserPermissions(payload.open_id);

  return ok(res, {
    open_id: payload.open_id,
    name: payload.name,
    avatar_url: payload.avatar_url,
    role: freshPerms.role,
    allowed_regions: freshPerms.allowed_regions,
    allowed_org_ids: freshPerms.allowed_org_ids,
    pages: freshPerms.pages,
  }, req);
};
