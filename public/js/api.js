// public/js/api.js
// 前端 API 调用模块

const API = {
  /** 获取看板汇总数据 */
  async getDashboardSummary(payPeriodId) {
    let url = APP_CONFIG.API_BASE + '/dashboard/summary';
    if (payPeriodId) url += `?pay_period_id=${payPeriodId}`;
    const res = await Auth.fetch(url);
    const json = await res.json();
    if (json.code !== 0) throw new Error(json.message);
    return json.data;
  },

  /** 获取发薪周期列表 */
  async getPayPeriods() {
    const res = await Auth.fetch(APP_CONFIG.API_BASE + '/pay-periods');
    const json = await res.json();
    if (json.code !== 0) throw new Error(json.message);
    return json.data;
  },

  /** 获取员工列表 */
  async getEmployees() {
    const res = await Auth.fetch(APP_CONFIG.API_BASE + '/employees');
    const json = await res.json();
    if (json.code !== 0) throw new Error(json.message);
    return json.data;
  },

  /** 导入数据（管理员） */
  async importData(payload) {
    const res = await Auth.fetch(APP_CONFIG.API_BASE + '/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.code !== 0) throw new Error(json.message);
    return json.data;
  },
};

window.API = API;
