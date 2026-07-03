// api/auth/callback.js
// GET /api/auth/callback — 飞书回调：code 换 token → 获取用户信息 → 签发 JWT → 302 到前端

const { getUserAccessToken, getUserInfo } = require('../_lib/feishu');
const { signJWT, getUserPermissions } = require('../_lib/auth');

module.exports = async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    res.writeHead(302, { Location: '/login?error=no_code' });
    res.end();
    return;
  }

  // 可选：校验 state
  // const cookieState = req.cookies?.feishu_state;
  // if (state && cookieState && state !== cookieState) { ... }

  try {
    // Step 1: code 换 user_access_token
    const tokenRes = await getUserAccessToken(code);
    if (tokenRes.code !== 0) {
      console.error('Feishu token error:', tokenRes);
      res.writeHead(302, { Location: '/login?error=token_failed' });
      res.end();
      return;
    }

    const userAccessToken = tokenRes.data.access_token;

    // Step 2: 获取用户信息
    const userRes = await getUserInfo(userAccessToken);
    if (userRes.code !== 0) {
      console.error('Feishu user info error:', userRes);
      res.writeHead(302, { Location: '/login?error=user_info_failed' });
      res.end();
      return;
    }

    const user = userRes.data;
    const openId = user.open_id || user.user_id;

    // Step 3: 查询用户权限
    const permissions = await getUserPermissions(openId);

    // Step 4: 签发 JWT
    const jwtToken = signJWT({
      open_id: openId,
      name: user.name || '未知用户',
      avatar_url: user.avatar_url || '',
      role: permissions.role,
      allowed_regions: permissions.allowed_regions,
      allowed_org_ids: permissions.allowed_org_ids,
      pages: permissions.pages,
    });

    // Step 5: JWT 写入 HttpOnly cookie + 302 回前端
    const secureCookie = process.env.BASE_URL?.startsWith('https') ? '; Secure' : '';
    res.setHeader('Set-Cookie', [
      `token=${jwtToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${secureCookie}`,
      `feishu_state=; HttpOnly; Path=/; Max-Age=0`,
    ]);

    // 将 token 也通过 URL 哈希传给前端（前端存 localStorage）
    res.writeHead(302, {
      Location: `/login?token=${encodeURIComponent(jwtToken)}&name=${encodeURIComponent(user.name || '')}`,
    });
    res.end();
  } catch (err) {
    console.error('Feishu callback error:', err);
    res.writeHead(302, { Location: '/login?error=server_error' });
    res.end();
  }
};
