// scripts/seed-data.js
// 生成示例数据并导入 Supabase
// 用法: node scripts/seed-data.js

const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env' });

const API_BASE = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// ================================================================
// 示例数据生成
// ================================================================

const REGIONS = ['华东', '华南', '华北', '华中', '西南', '西北', '东北'];

const ORG4_LIST = [
  { name: '上海片区', region: '华东' },
  { name: '杭州片区', region: '华东' },
  { name: '广州片区', region: '华南' },
  { name: '深圳片区', region: '华南' },
  { name: '北京片区', region: '华北' },
  { name: '武汉片区', region: '华中' },
  { name: '成都片区', region: '西南' },
  { name: '西安片区', region: '西北' },
  { name: '沈阳片区', region: '东北' },
];

const ORG5_GROUPS = ['操作组', '调度组', '分拣组', '维保组', '行政组', '管理组'];
const COMPANIES = ['云快递物流有限公司', 'GOFO供应链管理有限公司'];

// 随机姓名
const LAST_NAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜';
const FIRST_NAMES = '伟强文博浩宇志远明哲建华俊杰建国海涛鹏飞志强晓明建平';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDecimal(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function genName() {
  const last = LAST_NAMES[randInt(0, LAST_NAMES.length - 1)];
  const first = FIRST_NAMES[randInt(0, FIRST_NAMES.length - 1)];
  return last + first;
}

// 生成员工
const employees = [];
const employeeCodeMap = {};

for (let i = 0; i < 200; i++) {
  const org4 = pick(ORG4_LIST);
  const org5 = pick(ORG5_GROUPS);
  const code = `EMP${String(i + 1).padStart(5, '0')}`;
  const company = pick(COMPANIES);
  const hourlyRate = randDecimal(18, 45, 2);

  employees.push({
    employee_code: code,
    name: genName(),
    company,
    hourly_rate: hourlyRate,
    annual_salary: Math.round(hourlyRate * 2080), // 年标准工时 2080h
    status: 'active',
    // org_id and org relation will be set after creating orgs
    _org4_name: org4.name,
    _org5_name: org5,
    _region: org4.region,
  });
}

// 生成工时记录
const startDate = '2026-06-01';
const endDate = '2026-06-15';

function genWorkRecord() {
  const regular = randInt(60, 88);
  const overtime = Math.random() > 0.15 ? randInt(0, 25) : 0; // 85% 的人有加班
  const leave = Math.random() > 0.8 ? randInt(4, 16) : 0;       // 20% 的人有休假
  return {
    regular_hours: regular,
    overtime_hours: overtime,
    paid_leave_hours: leave,
  };
}

const workRecords = employees.map((e) => ({
  _employee_code: e.employee_code,
  ...genWorkRecord(),
}));

// 生成工资记录
const salaryRecords = employees.map((e) => {
  const wr = workRecords.find((w) => w._employee_code === e.employee_code);
  const rate = e.hourly_rate;
  const regularPay = wr.regular_hours * rate;
  const overtimePay = wr.overtime_hours * rate * 1.5;
  const leavePay = wr.paid_leave_hours * rate;
  return {
    _employee_code: e.employee_code,
    regular_pay: Math.round(regularPay * 100) / 100,
    overtime_pay: Math.round(overtimePay * 100) / 100,
    paid_leave_pay: Math.round(leavePay * 100) / 100,
  };
});

// ================================================================
// 统计预览
// ================================================================
const totalPay = salaryRecords.reduce((sum, s) => sum + s.regular_pay + s.overtime_pay + s.paid_leave_pay, 0);
const totalOvertimePay = salaryRecords.reduce((sum, s) => sum + s.overtime_pay, 0);
const totalHours = workRecords.reduce((sum, w) => sum + w.regular_hours + w.overtime_hours + w.paid_leave_hours, 0);
const totalOvertimeHours = workRecords.reduce((sum, w) => sum + w.overtime_hours, 0);

console.log('=== 示例数据统计 ==');
console.log(`员工总数: ${employees.length}`);
console.log(`工资总额: $${totalPay.toLocaleString()}`);
console.log(`加班工资占比: ${(totalOvertimePay / totalPay * 100).toFixed(1)}%`);
console.log(`总工时: ${totalHours.toFixed(1)}h`);
console.log(`加班率: ${(totalOvertimeHours / totalHours * 100).toFixed(1)}%`);
console.log(`单位工时成本: $${(totalPay / totalHours).toFixed(2)}/h`);

// ================================================================
// 构建导入 payload
// ================================================================
const payPeriod = {
  name: '2026年6月上',
  start_date: startDate,
  end_date: endDate,
  is_active: true,
};

// 输出完整的 JSON payload
const payload = {
  pay_period: payPeriod,
  employees: employees.map(({ _org4_name, _org5_name, _region, ...rest }) => rest),
  work_records: workRecords.map(({ _employee_code, ...rest }) => ({
    ...rest,
    // employee_id will need to be mapped after creation
  })),
  salary_records: salaryRecords.map(({ _employee_code, ...rest }) => rest),
};

// 打印为 JSON
console.log('\n=== 导入 Payload (JSON) ===');
console.log(JSON.stringify(payload, null, 2));

// 同时保存到文件
const fs = require('fs');
fs.writeFileSync('sample-data.json', JSON.stringify(payload, null, 2));
console.log('\n✅ 示例数据已保存到 sample-data.json');
