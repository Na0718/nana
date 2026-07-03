// api/dashboard/summary.js
// GET /api/dashboard/summary — 看板汇总数据
// 参数: ?pay_period_id=<uuid> (可选，默认取最新活跃周期)

const { getSupabase } = require('../_lib/supabase');
const { extractToken, verifyJWT, getUserPermissions } = require('../_lib/auth');
const { ok, fail, handleOptions } = require('../_lib/response');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  if (req.method !== 'GET') return fail(res, 'Method not allowed', 405, req);

  // 认证
  const token = extractToken(req);
  if (!token) return fail(res, '未登录', 401, req);
  const payload = verifyJWT(token);
  if (!payload) return fail(res, '登录已过期', 401, req);

  const db = getSupabase();
  const payPeriodId = req.query.pay_period_id;

  try {
    // 先确定当前发薪周期
    let periodQuery = db.from('pay_periods').select('*');
    if (payPeriodId) {
      periodQuery = periodQuery.eq('id', payPeriodId);
    } else {
      periodQuery = periodQuery.eq('is_active', true).limit(1);
    }
    const { data: periods } = await periodQuery;
    const period = periods?.[0];
    if (!period) return fail(res, '无活跃发薪周期', 404, req);

    // 汇总 KPI
    const { data: summary } = await db
      .from('dashboard_summary')
      .select('*')
      .eq('pay_period_id', period.id);

    // 四级组织数据
    let org4Query = db.from('org_level4_summary').select('*');
    // 区域权限控制
    if (payload.role !== 'admin' && payload.allowed_regions?.length > 0) {
      org4Query = org4Query.in('region_name', payload.allowed_regions);
    }

    const { data: org4Data } = await org4Query;

    // 五级组织数据（含员工明细）
    const { data: org5Data } = await db
      .from('organizations')
      .select(`
        id, name, level, parent_id,
        employees (
          id, employee_code, name, company,
          hourly_rate, annual_salary,
          work_records!inner(regular_hours, overtime_hours, paid_leave_hours),
          salary_records!inner(regular_pay, overtime_pay, paid_leave_pay)
        )
      `)
      .eq('level', 5);

    // 构建响应
    const kpi = summary?.[0] || {};
    const totalPay = Number(kpi.total_pay || 0);
    const totalHours = Number(kpi.total_hours || 0);
    const headcount = Number(kpi.total_employees || 1);

    const result = {
      period,
      kpi: {
        cost: {
          total_pay: totalPay,
          avg_pay_per_person: totalPay / headcount,
          regular_pay: Number(kpi.total_regular_pay || 0),
          regular_pay_ratio: totalPay > 0 ? Number(kpi.total_regular_pay || 0) / totalPay : 0,
          overtime_pay: Number(kpi.total_overtime_pay || 0),
          overtime_pay_ratio: totalPay > 0 ? Number(kpi.total_overtime_pay || 0) / totalPay : 0,
          paid_leave_pay: Number(kpi.total_paid_leave_pay || 0),
          paid_leave_pay_ratio: totalPay > 0 ? Number(kpi.total_paid_leave_pay || 0) / totalPay : 0,
          cost_per_hour: totalHours > 0 ? totalPay / totalHours : 0,
        },
        hours: {
          headcount,
          overtime_headcount: Number(kpi.employees_with_overtime || 0),
          total_hours: totalHours,
          avg_hours_per_person: totalHours / headcount,
          regular_hours: Number(kpi.total_regular_hours || 0),
          regular_hours_ratio: totalHours > 0 ? Number(kpi.total_regular_hours || 0) / totalHours : 0,
          overtime_hours: Number(kpi.total_overtime_hours || 0),
          overtime_hours_ratio: totalHours > 0 ? Number(kpi.total_overtime_hours || 0) / totalHours : 0,
          paid_leave_hours: Number(kpi.total_paid_leave_hours || 0),
          paid_leave_hours_ratio: totalHours > 0 ? Number(kpi.total_paid_leave_hours || 0) / totalHours : 0,
          overtime_rate: totalHours > 0 ? Number(kpi.total_overtime_hours || 0) / totalHours : 0,
        },
      },
      org_level4: (org4Data || []).map((o) => {
        const pay = Number(o.total_pay || 0);
        const hrs = Number(o.total_hours || 0);
        const hc = Number(o.headcount || 1);
        return {
          org_id: o.org_id,
          org_name: o.org_name,
          region_name: o.region_name,
          headcount: hc,
          total_pay: pay,
          avg_pay: pay / hc,
          overtime_pay: Number(o.overtime_pay || 0),
          overtime_pay_ratio: pay > 0 ? Number(o.overtime_pay || 0) / pay : 0,
          total_hours: hrs,
          avg_hours: hrs / hc,
          overtime_hours: Number(o.overtime_hours || 0),
          overtime_rate: hrs > 0 ? Number(o.overtime_hours || 0) / hrs : 0,
          cost_per_hour: hrs > 0 ? pay / hrs : 0,
        };
      }),
      org_level5: (org5Data || []).map(processOrg5),
      employees: (org5Data || []).flatMap((o) =>
        (o.employees || []).map((e) => ({
          ...e,
          org_name: o.name,
          org_id: o.id,
          parent_org_id: o.parent_id,
        }))
      ),
    };

    return ok(res, result, req);
  } catch (err) {
    console.error('Dashboard summary error:', err);
    return fail(res, '获取看板数据失败: ' + err.message, 500, req);
  }
};

function processOrg5(o) {
  const emps = o.employees || [];
  const hc = emps.length;
  let totalPay = 0, overtimePay = 0, totalHrs = 0, overtimeHrs = 0;

  emps.forEach((e) => {
    const wr = e.work_records?.[0] || {};
    const sr = e.salary_records?.[0] || {};
    const regularHrs = Number(wr.regular_hours || 0);
    const otHrs = Number(wr.overtime_hours || 0);
    const leaveHrs = Number(wr.paid_leave_hours || 0);
    const regularPay = Number(sr.regular_pay || 0);
    const otPay = Number(sr.overtime_pay || 0);
    const leavePay = Number(sr.paid_leave_pay || 0);
    totalPay += regularPay + otPay + leavePay;
    overtimePay += otPay;
    totalHrs += regularHrs + otHrs + leaveHrs;
    overtimeHrs += otHrs;
  });

  return {
    org_id: o.id,
    org_name: o.name,
    parent_org_id: o.parent_id,
    headcount: hc,
    total_pay: totalPay,
    avg_pay: hc > 0 ? totalPay / hc : 0,
    overtime_pay: overtimePay,
    overtime_pay_ratio: totalPay > 0 ? overtimePay / totalPay : 0,
    total_hours: totalHrs,
    avg_hours: hc > 0 ? totalHrs / hc : 0,
    overtime_hours: overtimeHrs,
    overtime_rate: totalHrs > 0 ? overtimeHrs / totalHrs : 0,
    cost_per_hour: totalHrs > 0 ? totalPay / totalHrs : 0,
  };
}
