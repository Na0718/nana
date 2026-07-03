// api/_lib/response.js
// 统一响应格式 + CORS 头（兼容 Vercel 原生 http.ServerResponse）

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://na0718.github.io',
  process.env.BASE_URL,
].filter(Boolean);

function getOrigin(req) {
  const origin = req.headers.origin || '';
  const matched = ALLOWED_ORIGINS.find((o) => origin.startsWith(o));
  return matched || ALLOWED_ORIGINS[0] || '*';
}

function corsHeaders(req) {
  return {
    'Access-Control-Allow-Origin': getOrigin(req),
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function json(res, data, status = 200, extraHeaders = {}) {
  const headers = { ...extraHeaders, 'Content-Type': 'application/json' };
  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

function ok(res, data, req) {
  return json(res, { code: 0, data }, 200, corsHeaders(req || {}));
}

function fail(res, message, status = 400, req) {
  return json(res, { code: -1, message }, status, corsHeaders(req || {}));
}

function handleOptions(req, res) {
  res.writeHead(204, corsHeaders(req));
  res.end();
}

module.exports = { corsHeaders, json, ok, fail, handleOptions };
