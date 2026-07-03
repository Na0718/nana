// api/auth/feishu.js
// GET /api/auth/feishu — 302 重定向到飞书授权页

const { getAuthUrl, generateState } = require('../_lib/feishu');

module.exports = async (req, res) => {
  const state = generateState();

  // 设置 state cookie（httpOnly，5 分钟有效）
  res.setHeader('Set-Cookie', `feishu_state=${state}; HttpOnly; Path=/; Max-Age=300; SameSite=Lax`);

  const authUrl = getAuthUrl(state);
  res.writeHead(302, { Location: authUrl });
  res.end();
};
