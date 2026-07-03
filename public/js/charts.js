// public/js/charts.js
// Chart.js 图表渲染模块

const Charts = {
  instances: {},

  /** 销毁所有图表实例 */
  destroyAll() {
    Object.values(this.instances).forEach((c) => c.destroy());
    this.instances = {};
  },

  /** 渲染所有图表 */
  renderAll(data) {
    this.destroyAll();
    if (!data?.org_level4?.length) return;

    this.renderCostBar(data.org_level4);
    this.renderCostPerHour(data.org_level4);
    this.renderHoursBar(data.org_level4);
    this.renderMultiTrend(data.org_level4);
  },

  /** 成本总额 + 加班工资占比（组合图） */
  renderCostBar(orgs) {
    const ctx = document.getElementById('chart-cost-bar');
    if (!ctx) return;

    const labels = orgs.map((o) => o.org_name);
    const costs = orgs.map((o) => o.total_pay);
    const ratios = orgs.map((o) => (o.overtime_pay_ratio * 100));

    this.instances.costBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '工资总额',
            data: costs,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y',
          },
          {
            label: '加班工资占比',
            data: ratios,
            type: 'line',
            borderColor: '#ef4444',
            backgroundColor: '#ef4444',
            borderWidth: 2,
            pointRadius: 5,
            pointBackgroundColor: '#ef4444',
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          title: { display: true, text: '四级组织 — 成本总额 & 加班工资占比', font: { size: 14 } },
          tooltip: {
            callbacks: {
              label(ctx) {
                if (ctx.datasetIndex === 0) return '工资总额: $' + ctx.raw.toLocaleString();
                return '加班占比: ' + ctx.raw.toFixed(1) + '%';
              },
            },
          },
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: '工资总额 ($)' },
            ticks: { callback: (v) => '$' + (v / 1000).toFixed(0) + 'k' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: '加班占比 (%)' },
            ticks: { callback: (v) => v + '%' },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  },

  /** 单位工时成本（柱状图） */
  renderCostPerHour(orgs) {
    const ctx = document.getElementById('chart-cost-per-hour');
    if (!ctx) return;

    const labels = orgs.map((o) => o.org_name);
    const data = orgs.map((o) => o.cost_per_hour);

    this.instances.costPerHour = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '单位工时成本 ($/h)',
          data,
          backgroundColor: data.map((v, i) => {
            const max = Math.max(...data);
            const ratio = v / max;
            return ratio > 0.85 ? 'rgba(239, 68, 68, 0.7)'   // 红色 — 高成本
                 : ratio > 0.6  ? 'rgba(245, 158, 11, 0.7)'  // 橙色 — 中等
                 : 'rgba(34, 197, 94, 0.7)';                  // 绿色 — 低成本
          }),
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: '四级组织 — 单位工时成本 ($/h)', font: { size: 14 } },
        },
        scales: {
          y: {
            title: { display: true, text: '$/h' },
            ticks: { callback: (v) => '$' + v.toFixed(1) },
          },
        },
      },
    });
  },

  /** 人均工时 + 加班率（组合图） */
  renderHoursBar(orgs) {
    const ctx = document.getElementById('chart-hours-bar');
    if (!ctx) return;

    const labels = orgs.map((o) => o.org_name);
    const avgHours = orgs.map((o) => o.avg_hours);
    const overtimeRates = orgs.map((o) => (o.overtime_rate * 100));

    this.instances.hoursBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '人均工时 (h)',
            data: avgHours,
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: '#6366f1',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y',
          },
          {
            label: '加班率',
            data: overtimeRates,
            type: 'line',
            borderColor: '#f97316',
            backgroundColor: '#f97316',
            borderWidth: 2,
            pointRadius: 5,
            pointBackgroundColor: '#f97316',
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: '四级组织 — 人均工时 & 加班率', font: { size: 14 } },
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: '人均工时 (h)' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: '加班率 (%)' },
            ticks: { callback: (v) => v + '%' },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  },

  /** 多维度对比折线图组 */
  renderMultiTrend(orgs) {
    // 工时总量趋势
    const ctx1 = document.getElementById('chart-trend-hours');
    if (ctx1) {
      const labels = orgs.map((o) => o.org_name);
      this.instances.trendHours = new Chart(ctx1, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: '总工时 (h)', data: orgs.map((o) => o.total_hours), borderColor: '#3b82f6', tension: 0.3 },
            { label: '加班工时 (h)', data: orgs.map((o) => o.overtime_hours), borderColor: '#ef4444', tension: 0.3, borderDash: [5, 5] },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { title: { display: true, text: '工时总量趋势', font: { size: 13 } } },
        },
      });
    }

    // 人均指标
    const ctx2 = document.getElementById('chart-trend-avg');
    if (ctx2) {
      const labels = orgs.map((o) => o.org_name);
      this.instances.trendAvg = new Chart(ctx2, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: '人均工时 (h)', data: orgs.map((o) => o.avg_hours), borderColor: '#6366f1', tension: 0.3 },
            { label: '人均工资 ($)', data: orgs.map((o) => o.avg_pay), borderColor: '#10b981', tension: 0.3, yAxisID: 'y1' },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { title: { display: true, text: '人均指标', font: { size: 13 } } },
          scales: {
            y1: {
              type: 'linear',
              position: 'right',
              ticks: { callback: (v) => '$' + v.toLocaleString() },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });
    }

    // 效率与负荷
    const ctx3 = document.getElementById('chart-trend-efficiency');
    if (ctx3) {
      const labels = orgs.map((o) => o.org_name);
      this.instances.trendEff = new Chart(ctx3, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: '单位工时成本 ($/h)', data: orgs.map((o) => o.cost_per_hour), borderColor: '#f59e0b', tension: 0.3 },
            { label: '加班率 (%)', data: orgs.map((o) => (o.overtime_rate * 100)), borderColor: '#ef4444', tension: 0.3, yAxisID: 'y1' },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { title: { display: true, text: '效率与负荷', font: { size: 13 } } },
          scales: {
            y1: {
              type: 'linear',
              position: 'right',
              ticks: { callback: (v) => v + '%' },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });
    }
  },
};

window.Charts = Charts;
