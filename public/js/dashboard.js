// public/js/dashboard.js
// 看板主控制器 — 数据加载 + 渲染调度

const Dashboard = {
  data: null,
  user: null,

  /** 初始化看板 */
  async init() {
    // 检查登录
    this.user = await Auth.checkAuth();
    if (!this.user) {
      window.location.href = '/login';
      return;
    }
    if (this.user.role === 'unauthorized') {
      this.showUnauthorized();
      return;
    }

    // 显示用户信息
    this.renderUserInfo();

    // 加载数据
    await this.loadData();

    // 渲染各模块
    this.renderKPICards();
    Charts.renderAll(this.data);
    Tables.renderAll(this.data);

    // 隐藏 loading
    document.getElementById('loading-overlay')?.classList.add('hidden');
  },

  /** 加载看板数据 */
  async loadData() {
    try {
      const periodSelector = document.getElementById('pay-period-selector');
      const periodId = periodSelector?.value || null;
      this.data = await API.getDashboardSummary(periodId);

      // 填充发薪周期选择器
      const periods = await API.getPayPeriods();
      this.renderPeriodSelector(periods, this.data.period?.id);
    } catch (err) {
      this.showError('数据加载失败: ' + err.message);
      throw err;
    }
  },

  /** 渲染发薪周期选择器 */
  renderPeriodSelector(periods, currentId) {
    const sel = document.getElementById('pay-period-selector');
    if (!sel) return;
    sel.innerHTML = periods.map((p) =>
      `<option value="${p.id}" ${p.id === currentId ? 'selected' : ''}>${p.name} (${p.start_date} ~ ${p.end_date})</option>`
    ).join('');
    sel.onchange = () => this.init();
  },

  /** 渲染用户信息 */
  renderUserInfo() {
    const el = document.getElementById('user-info');
    if (!el) return;
    const u = this.user;
    el.innerHTML = `
      <span class="user-avatar">${(u.name || 'U')[0]}</span>
      <span class="user-name">${u.name}</span>
      <span class="user-role-badge ${u.role}">${u.role === 'admin' ? '管理员' : u.role === 'region_manager' ? '区域经理' : '查看者'}</span>
      <button class="btn-logout" onclick="Auth.logout()">退出</button>
    `;
  },

  /** 渲染 KPI 卡片 */
  renderKPICards() {
    const d = this.data;
    if (!d?.kpi) return;
    const { cost, hours } = d.kpi;
    const C = APP_CONFIG.CURRENCY;

    // 成本 KPI
    this.setKPI('cost-total-pay',      this.fmtMoney(cost.total_pay));
    this.setKPI('cost-avg-pay',        this.fmtMoney(cost.avg_pay_per_person));
    this.setKPI('cost-regular-pay',    this.fmtMoney(cost.regular_pay),     this.pct(cost.regular_pay_ratio));
    this.setKPI('cost-overtime-pay',   this.fmtMoney(cost.overtime_pay),    this.pct(cost.overtime_pay_ratio));
    this.setKPI('cost-leave-pay',      this.fmtMoney(cost.paid_leave_pay),  this.pct(cost.paid_leave_pay_ratio));
    this.setKPI('cost-per-hour',       C + Number(cost.cost_per_hour).toFixed(2) + '/h');
    this.setKPI('cost-overtime-ratio', this.pct(cost.overtime_pay_ratio));

    // 工时 KPI
    this.setKPI('hours-headcount',     hours.headcount);
    this.setKPI('hours-total',         Number(hours.total_hours).toFixed(1) + ' h');
    this.setKPI('hours-avg',           Number(hours.avg_hours_per_person).toFixed(1) + ' h');
    this.setKPI('hours-regular',       Number(hours.regular_hours).toFixed(1) + ' h', this.pct(hours.regular_hours_ratio));
    this.setKPI('hours-overtime',      Number(hours.overtime_hours).toFixed(1) + ' h', this.pct(hours.overtime_hours_ratio));
    this.setKPI('hours-leave',         Number(hours.paid_leave_hours).toFixed(1) + ' h', this.pct(hours.paid_leave_hours_ratio));
    this.setKPI('hours-overtime-rate', this.pct(hours.overtime_rate));
  },

  setKPI(id, value, sub) {
    const el = document.getElementById(id);
    if (!el) return;
    el.querySelector('.kpi-value') && (el.querySelector('.kpi-value').textContent = value);
    if (sub !== undefined && el.querySelector('.kpi-sub')) {
      el.querySelector('.kpi-sub').textContent = sub;
    }
  },

  fmtMoney(v) {
    return APP_CONFIG.CURRENCY + Number(v || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  },

  pct(v) {
    return (Number(v || 0) * 100).toFixed(1) + '%';
  },

  showError(msg) {
    const el = document.getElementById('loading-overlay');
    if (el) {
      el.innerHTML = `<div class="error-message">${msg}</div>`;
      el.classList.remove('hidden');
    }
  },

  showUnauthorized() {
    // 可能是缓存的旧权限，强制清除后重试
    Auth.clearToken();
    const el = document.getElementById('loading-overlay');
    if (el) {
      el.innerHTML = `<div class="unauthorized-message">
        <h2>暂无访问权限</h2>
        <p>可能是权限缓存导致，请尝试重新登录或联系管理员。</p>
        <button class="btn-feishu-login" onclick="Auth.login()" style="background:#22c55e;">重新登录</button>
      </div>`;
      el.classList.remove('hidden');
    }
  },
};

window.Dashboard = Dashboard;
