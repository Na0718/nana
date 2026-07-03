// public/js/tables.js
// 数据表格渲染模块

const Tables = {
  /** 渲染所有表格 */
  renderAll(data) {
    if (!data) return;
    this.renderOrg4(data.org_level4);
    this.renderOrg5(data.org_level4, data.org_level5);
    this.renderEmployees(data.employees);
  },

  /** 四级组织汇总表 */
  renderOrg4(orgs) {
    const tbody = document.querySelector('#table-org4 tbody');
    if (!tbody || !orgs) return;

    const rows = orgs.map((o) => `
      <tr>
        <td>${o.org_name}</td>
        <td class="num">${o.headcount}</td>
        <td class="num money">${fmtMoney(o.total_pay)}</td>
        <td class="num money">${fmtMoney(o.avg_pay)}</td>
        <td class="num pct">${fmtPct(o.overtime_pay_ratio)}</td>
        <td class="num">${Number(o.total_hours).toFixed(1)}</td>
        <td class="num">${Number(o.avg_hours).toFixed(1)}</td>
        <td class="num pct">${fmtPct(o.overtime_rate)}</td>
        <td class="num money">${APP_CONFIG.CURRENCY}${Number(o.cost_per_hour).toFixed(2)}</td>
      </tr>
    `).join('');

    tbody.innerHTML = rows || '<tr><td colspan="9" class="empty">暂无数据</td></tr>';
  },

  /** 五级组织汇总表 */
  renderOrg5(org4, org5) {
    const tbody = document.querySelector('#table-org5 tbody');
    if (!tbody || !org5) return;

    const orgMap = {};
    (org4 || []).forEach((o) => { orgMap[o.org_id] = o.org_name; });

    const rows = org5.map((o) => `
      <tr>
        <td>${o.org_name}</td>
        <td>${orgMap[o.parent_org_id] || '-'}</td>
        <td class="num">${o.headcount}</td>
        <td class="num money">${fmtMoney(o.total_pay)}</td>
        <td class="num money">${fmtMoney(o.avg_pay)}</td>
        <td class="num pct">${fmtPct(o.overtime_pay_ratio)}</td>
        <td class="num">${Number(o.total_hours).toFixed(1)}</td>
        <td class="num">${Number(o.avg_hours).toFixed(1)}</td>
        <td class="num pct">${fmtPct(o.overtime_rate)}</td>
      </tr>
    `).join('');

    tbody.innerHTML = rows || '<tr><td colspan="9" class="empty">暂无数据</td></tr>';
  },

  /** 员工明细表 */
  renderEmployees(emps) {
    const tbody = document.querySelector('#table-employees tbody');
    if (!tbody || !emps) return;

    const rows = emps.map((e) => {
      const wr = e.work_records?.[0] || {};
      const sr = e.salary_records?.[0] || {};
      return `
        <tr>
          <td>${e.employee_code}</td>
          <td>${e.name}</td>
          <td>${e.company || '-'}</td>
          <td>${e.org_name || '-'}</td>
          <td class="num money">${e.hourly_rate ? APP_CONFIG.CURRENCY + Number(e.hourly_rate).toFixed(2) + '/h' : (e.annual_salary ? APP_CONFIG.CURRENCY + Number(e.annual_salary).toLocaleString() + '/yr' : '-')}</td>
          <td class="num">${Number(wr.regular_hours || 0).toFixed(1)}</td>
          <td class="num">${Number(wr.overtime_hours || 0).toFixed(1)}</td>
          <td class="num">${Number(wr.paid_leave_hours || 0).toFixed(1)}</td>
          <td class="num"><strong>${(Number(wr.regular_hours || 0) + Number(wr.overtime_hours || 0) + Number(wr.paid_leave_hours || 0)).toFixed(1)}</strong></td>
          <td class="num money">${fmtMoney(sr.regular_pay)}</td>
          <td class="num money">${fmtMoney(sr.overtime_pay)}</td>
          <td class="num money">${fmtMoney(sr.paid_leave_pay)}</td>
          <td class="num money"><strong>${fmtMoney(Number(sr.regular_pay || 0) + Number(sr.overtime_pay || 0) + Number(sr.paid_leave_pay || 0))}</strong></td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = rows || '<tr><td colspan="12" class="empty">暂无数据</td></tr>';

    // 更新员工数量
    const countEl = document.getElementById('employee-count');
    if (countEl) countEl.textContent = emps.length;
  },
};

function fmtMoney(v) {
  return APP_CONFIG.CURRENCY + Number(v || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function fmtPct(v) {
  return (Number(v || 0) * 100).toFixed(1) + '%';
}

window.Tables = Tables;
