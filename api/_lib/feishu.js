// api/_lib/feishu.js
// 飞书 OAuth2 核心逻辑

const fetch = require('node-fetch');

const FEISHU_HOST = 'https://open.feishu.cn';

let cachedAppToken = null;
let cachedAppTokenExpiry = 0;

/** 获取 app_access_token（带缓存） */
async function getAppAccessToken() {
  if (cachedAppToken && Date.now() < cachedAppTokenExpiry) {
    return cachedAppToken;
  }

  const res = await fetch(`${FEISHU_HOST}/open-apis/auth/v3/app_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET,
    }),
  });
  const data = await res.json();

  if (data.code !== 0) {
    throw new Error(`Feishu app_access_token error: ${data.msg}`);
  }

  cachedAppToken = data.app_access_token;
  cachedAppTokenExpiry = Date.now() + (data.expire - 300) * 1000; // 提前 5 分钟刷新
  return cachedAppToken;
}

/** 生成飞书授权页 URL */
function getAuthUrl(state) {
  const redirectUri = `${process.env.BASE_URL}/api/auth/callback`;
  return `${FEISHU_HOST}/open-apis/authen/v1/authorize`
    + `?app_id=${process.env.FEISHU_APP_ID}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&state=${encodeURIComponent(state)}`;
}

/** 用临时授权码换取 user_access_token */
async function getUserAccessToken(code) {
  const appToken = await getAppAccessToken();
  const res = await fetch(`${FEISHU_HOST}/open-apis/authen/v1/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${appToken}`,
    },
    body: JSON.stringify({ grant_type: 'authorization_code', code }),
  });
  return res.json();
}

/** 获取用户信息 */
async function getUserInfo(userAccessToken) {
  const res = await fetch(`${FEISHU_HOST}/open-apis/authen/v1/user_info`, {
    headers: { Authorization: `Bearer ${userAccessToken}` },
  });
  return res.json();
}

/** 生成随机 state 参数 */
function generateState() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = {
  getAppAccessToken,
  getAuthUrl,
  getUserAccessToken,
  getUserInfo,
  generateState,
};
