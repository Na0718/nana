// public/js/config.js
// 前端全局配置

window.APP_CONFIG = {
  // 部署后自动使用当前域名，本地开发时手动修改
  API_BASE: window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api',
  // 页面名称映射
  PAGES: {
    summary:    '汇总面板',
    dashboard:  '人力成本看板',
    employees:  '员工管理',
    settings:   '系统设置',
  },
  // 大区名称列表
  REGIONS: ['华东', '华南', '华北', '华中', '西南', '西北', '东北'],
  // 货币符号
  CURRENCY: '$',
  // 数据精度
  DECIMAL_DIGITS: 2,
};
