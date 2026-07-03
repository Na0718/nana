// api/import.js
// POST /api/import — 批量导入数据（JSON 格式）
// Body: { pay_period: {...}, employees: [...], work_records: [...], salary_records: [...] }

const { getSupabaseAdmin } = require('./_lib/supabase');
const { extractToken, verifyJWT } = require('./_lib/auth');
const { ok, fail, handleOptions } = require('./_lib/response');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405, req);

  const token = extractToken(req);
  if (!token) return fail(res, '未登录', 401, req);
  const payload = verifyJWT(token);
  if (!payload) return fail(res, '登录已过期', 401, req);
  if (payload.role !== 'admin') return fail(res, '仅管理员可导入数据', 403, req);

  const db = getSupabaseAdmin();
  const { pay_period, employees, work_records, salary_records } = req.body || {};

  const results = { pay_period: null, employees: 0, work_records: 0, salary_records: 0 };

  try {
    // Step 1: 创建发薪周期
    if (pay_period) {
      const { data: pp } = await db
        .from('pay_periods')
        .upsert(pay_period, { onConflict: 'name' })
        .select()
        .single();
      results.pay_period = pp;
    }

    // Step 2: 导入员工
    if (Array.isArray(employees) && employees.length > 0) {
      const { data: emps } = await db
        .from('employees')
        .upsert(employees, { onConflict: 'employee_code' })
        .select();
      results.employees = emps?.length || 0;
    }

    // Step 3: 导入工时记录
    if (Array.isArray(work_records) && work_records.length > 0) {
      const { error: wrErr } = await db
        .from('work_records')
        .upsert(work_records, { onConflict: 'employee_id,pay_period_id' });
      if (wrErr) throw wrErr;
      results.work_records = work_records.length;
    }

    // Step 4: 导入工资记录
    if (Array.isArray(salary_records) && salary_records.length > 0) {
      const { error: srErr } = await db
        .from('salary_records')
        .upsert(salary_records, { onConflict: 'employee_id,pay_period_id' });
      if (srErr) throw srErr;
      results.salary_records = salary_records.length;
    }

    return ok(res, results, req);
  } catch (err) {
    console.error('Import error:', err);
    return fail(res, '导入失败: ' + err.message, 500, req);
  }
};
