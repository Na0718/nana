// api/_lib/response.js
// 统一响应格式 + CORS 头

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://na0718.github.io',
  process.env.BASE_URL,
].filter(Boolean);

function corsHeaders(req) {
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGINS.some((o) => origin.startsWith(o)) ? origin : ALLOWED_ORIGINS[0] || '*';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function json(res, data, status = 200, extraHeaders = {}) {
  return res
    .status(status)
    .set({ ...extraHeaders, 'Content-Type': 'application/json' })
    .json(data);
}

function ok(res, data, req) {
  return json(res, { code: 0, data }, 200, corsHeaders(req));
}

function fail(res, message, status = 400, req) {
  return json(res, { code: -1, message }, status, corsHeaders(req));
}

function handleOptions(req, res) {
  res.status(204).set(corsHeaders(req)).end();
}

module.exports = { corsHeaders, json, ok, fail, handleOptions };
