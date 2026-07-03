// api/employees.js
// GET/POST /api/employees — 员工列表 + 批量新增

const { getSupabase, getSupabaseAdmin } = require('./_lib/supabase');
const { extractToken, verifyJWT } = require('./_lib/auth');
const { ok, fail, handleOptions } = require('./_lib/response');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return handleOptions(req, res);

  // 认证
  const token = extractToken(req);
  if (!token) return fail(res, '未登录', 401, req);
  const payload = verifyJWT(token);
  if (!payload) return fail(res, '登录已过期', 401, req);

  const db = getSupabase();

  if (req.method === 'GET') {
    try {
      let query = db.from('employees').select(`
        id, employee_code, name, company, hourly_rate, annual_salary, status,
        organizations!inner(id, name, level, parent_id, regions(name))
      `);

      // 区域权限
      if (payload.role !== 'admin' && payload.allowed_regions?.length > 0) {
        // 需要通过 org → region 来过滤
        query = query.in('organizations.region_id', [/* need region UUIDs */]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return ok(res, data || [], req);
    } catch (err) {
      return fail(res, err.message, 500, req);
    }
  }

  if (req.method === 'POST') {
    if (payload.role !== 'admin') return fail(res, '无权操作', 403, req);

    try {
      const { employees } = req.body;
      if (!Array.isArray(employees) || employees.length === 0) {
        return fail(res, 'employees 数组不能为空', 400, req);
      }

      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from('employees')
        .upsert(employees, { onConflict: 'employee_code' })
        .select();

      if (error) throw error;
      return ok(res, data, req);
    } catch (err) {
      return fail(res, err.message, 500, req);
    }
  }

  return fail(res, 'Method not allowed', 405, req);
};
