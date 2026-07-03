// api/pay-periods.js
// GET /api/pay-periods — 发薪周期列表

const { getSupabase } = require('./_lib/supabase');
const { extractToken, verifyJWT } = require('./_lib/auth');
const { ok, fail, handleOptions } = require('./_lib/response');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  if (req.method !== 'GET') return fail(res, 'Method not allowed', 405, req);

  const token = extractToken(req);
  if (!token) return fail(res, '未登录', 401, req);
  const payload = verifyJWT(token);
  if (!payload) return fail(res, '登录已过期', 401, req);

  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('pay_periods')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return ok(res, data || [], req);
  } catch (err) {
    return fail(res, err.message, 500, req);
  }
};
