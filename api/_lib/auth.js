// api/_lib/auth.js
// JWT 签发/验证 + 用户权限查询

const jwt = require('jsonwebtoken');
const { getSupabase } = require('./supabase');

const JWT_EXPIRY = '7d';

/** 签发 JWT */
function signJWT(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/** 验证 JWT，返回 payload 或 null */
function verifyJWT(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

/** 从请求中提取 Bearer token */
function extractToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/** 查询用户权限 */
async function getUserPermissions(feishuOpenId) {
  const adminIds = (process.env.ADMIN_OPEN_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const db = getSupabase();
  const { data: userPerm } = await db
    .from('user_permissions')
    .select('*')
    .eq('feishu_open_id', feishuOpenId)
    .single();

  const isAdmin = adminIds.includes(feishuOpenId);

  if (isAdmin) {
    return {
      role: 'admin',
      allowed_regions: null,      // null = 全部
      allowed_org_ids: null,
      pages: ['summary', 'dashboard', 'employees', 'settings'],
    };
  }

  if (userPerm) {
    return {
      role: userPerm.role,
      allowed_regions: userPerm.allowed_regions || [],
      allowed_org_ids: userPerm.allowed_orgs || [],
      pages: ['summary', 'dashboard', 'employees'],
    };
  }

  // 已登录但未被授权
  return {
    role: 'unauthorized',
    allowed_regions: [],
    allowed_org_ids: [],
    pages: [],
  };
}

module.exports = { signJWT, verifyJWT, extractToken, getUserPermissions };
