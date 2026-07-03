# 人力成本分析平台 — 项目交接清单

> 编制日期：2026-07-03  
> 项目名称：nana（人力成本分析平台）  
> 本地路径：`labor-cost-dashboard/`

---

## 一、项目概览

| 维度 | 内容 |
|------|------|
| **项目目标** | 为跨区域团队提供工时与人力成本的实时分析看板，支持飞书 SSO 登录和区域权限控制 |
| **参考看板** | https://na0718.github.io/work-hours-dashboard/ |
| **上线地址** | https://nana-beta-lime.vercel.app |
| **技术栈** | HTML + CSS + Chart.js（前端） / Vercel Serverless Functions（后端） / Supabase PostgreSQL（数据库） |
| **认证方式** | 飞书 OAuth 2.0 → JWT（7 天有效期） |

### 权限角色

| 角色 | 权限范围 |
|------|---------|
| `admin` | 全页面（summary, dashboard, employees, settings） |
| `region_manager` | 总表 + 汇总 + 所属大区 |
| `viewer` | 只读，受限数据 |
| `unauthorized` | 无权限（显示"暂无访问权限"） |

---

## 二、架构总览

```
┌─────────────────────────────────┐
│  前端 (Vercel Static)            │
│  login.html → index.html        │
│  Chart.js 图表 + 3 张数据表     │
│  /js/auth.js 权限守卫           │
└──────────┬──────────────────────┘
           │ fetch('/api/...')
           ▼
┌─────────────────────────────────┐
│  Vercel Serverless Functions    │
│  /api/auth/feishu      302      │
│  /api/auth/callback    302      │
│  /api/auth/me          200      │
│  /api/dashboard/summary         │
│  /api/employees                 │
│  /api/pay-periods               │
│  /api/import                    │
│  /api/health                    │
└──────────┬──────────────────────┘
           │ @supabase/supabase-js
           ▼
┌─────────────────────────────────┐
│  Supabase (PostgreSQL)           │
│  7 张表 + 2 个视图 + RLS 策略   │
└─────────────────────────────────┘
```

---

## 三、当前进展

### ✅ 已完成

| 模块 | 内容 | 状态 |
|------|------|------|
| **GitHub** | 仓库 `na0718/nana` 已创建，代码已推送 | ✅ |
| **Supabase** | 7 张表 + 2 个视图 + RLS 策略已执行 | ✅ |
| **Vercel 部署** | 项目已部署，GitHub 自动触发 | ✅ |
| **飞书 App** | App ID: `cli_aace194cf7f85cb1`，回调已配置 | ✅ |
| **认证接入** | 飞书 SSO → JWT 签发 → 前端权限守卫，联调通过 | ✅ |
| **权限控制** | admin/region_manager/viewer 三级权限，实时查库 | ✅ |
| **环境变量** | 8 个变量已在 Vercel 配置（见第五节） | ✅ |
| **看板页面** | 14 个 KPI 卡片 + 6 张图表 + 3 张汇总表 | ✅ |
| **缓存控制** | JS/CSS/HTML 强制不缓存 | ✅ |
| **超级管理员** | `ou_990886081df9fe9ad05775a4d83877dc` 已设为 admin | ✅ |

### ⚠️ 待确认/待修复

| 事项 | 说明 | 优先级 |
|------|------|--------|
| **真实数据导入** | 看板数据全为空（`无活跃发薪周期`），需导入真实数据 | 🔴 高 |
| **员工数据录入** | 需通过 API 或 Supabase 直接导入员工、组织、工时、工资数据 | 🔴 高 |
| **自定义域名** | 当前域名 `nana-beta-lime.vercel.app`，如需自定义域名可绑定 | 🟡 中 |
| **飞书应用发布** | 确认飞书应用已发布并通过审核（否则只有应用管理员能登录） | 🟡 中 |

---

## 四、文件结构

```
labor-cost-dashboard/
├── api/                          # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── auth.js               # JWT 签发/验证 + 权限查询
│   │   ├── feishu.js             # 飞书 OAuth2 核心逻辑
│   │   ├── response.js           # 统一响应格式（原生 http）
│   │   └── supabase.js           # Supabase 客户端（ANON + SERVICE_ROLE）
│   ├── auth/
│   │   ├── feishu.js             # GET  302 → 飞书授权页
│   │   ├── callback.js           # GET  飞书回调，code → JWT
│   │   └── me.js                 # GET  校验 JWT + 实时查权限
│   ├── dashboard/
│   │   └── summary.js            # GET  看板汇总数据
│   ├── employees.js              # CRUD 员工数据
│   ├── health.js                 # 健康检查
│   ├── import.js                 # 批量数据导入
│   └── pay-periods.js            # 发薪周期管理
├── public/                       # 前端静态文件
│   ├── css/style.css             # 全局样式
│   ├── js/
│   │   ├── config.js             # 全局配置（API_BASE、货币、大区列表）
│   │   ├── auth.js               # 前端认证模块（登录/检查/注销/回调处理）
│   │   ├── api.js                # API 请求封装
│   │   ├── charts.js             # Chart.js 图表渲染
│   │   ├── tables.js             # 数据表渲染
│   │   └── dashboard.js          # 看板主控制器
│   ├── index.html                # 主看板页面
│   ├── login.html                # 登录页
│   └── assets/                   # 静态资源
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # 数据库初始化 SQL
├── scripts/
│   └── seed-data.js              # 示例数据生成脚本
├── vercel.json                   # Vercel 配置（缓存、重定向、路由）
├── package.json
├── .env.example                  # 环境变量模板
├── .env                          # 本地环境变量（不入库）
├── DEPLOY.md                     # 部署指南
└── README.md                     # 项目说明
```

---

## 五、环境变量 & 凭据

以下全部已在 Vercel Dashboard → nana → Settings → Environment Variables 配置：

| Key | 说明 | 值（示例） |
|-----|------|-----------|
| `FEISHU_APP_ID` | 飞书应用 ID | `cli_aace194cf7f85cb1` |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | `XiWzKoC8fqj1upcyycAyOgt1QVMOvoyr` |
| `JWT_SECRET` | JWT 签名密钥 | `568001bd341...` |
| `SUPABASE_URL` | Supabase 项目 URL | `https://lvpanhfazewogelrhaeb.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 | `eyJhbGciOi...` |
| `BASE_URL` | 部署域名 | `https://nana-beta-lime.vercel.app` |
| `ADMIN_OPEN_IDS` | 管理员飞书 Open ID（逗号分隔） | `ou_990886081df9fe9ad05775a4d83877dc` |

### 账号入口

| 平台 | 入口 |
|------|------|
| **GitHub 仓库** | https://github.com/Na0718/nana |
| **Vercel Dashboard** | https://vercel.com → na0718s-projects/nana |
| **Vercel 环境变量** | Vercel → nana → Settings → Environment Variables |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/lvpanhfazewogelrhaeb |
| **Supabase SQL Editor** | https://supabase.com/dashboard/project/lvpanhfazewogelrhaeb/sql/1 |
| **Supabase API Keys** | https://supabase.com/dashboard/project/lvpanhfazewogelrhaeb/settings/api |
| **飞书开放平台** | https://open.feishu.cn/app/cli_aace194cf7f85cb1 |
| **飞书回调地址** | `https://nana-beta-lime.vercel.app/api/auth/callback` |

---

## 六、数据库 Schema（Supabase）

### 表清单

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `regions` | 大区表 | name, sort_order |
| `organizations` | 组织架构（4/5 级） | name, level, parent_id, region_id |
| `employees` | 员工表 | employee_code, name, org_id, hourly_rate, status |
| `pay_periods` | 发薪周期 | name, start_date, end_date, region_id |
| `work_records` | 工时记录 | employee_id, pay_period_id, regular/overtime/paid_leave |
| `salary_records` | 工资记录 | employee_id, pay_period_id, regular/overtime/paid_leave |
| `user_permissions` | 用户权限 | feishu_open_id, role, allowed_regions |

### 视图

| 视图 | 说明 |
|------|------|
| `dashboard_summary` | 看板 KPI 汇聚视图 |
| `org_level4_summary` | 四级组织汇总视图 |

---

## 七、已修复的 Bug

| # | 问题 | 原因 | 修复方案 |
|---|------|------|---------|
| 1 | 飞书回调后 404 | `/login` vs `/login.html` 路径不匹配 | vercel.json 添加 307 重定向 |
| 2 | 登录后停留在登录页 | `location.reload()` 异步竞态 | 改为 `location.replace('/')` |
| 3 | 显示"暂无访问权限" | 旧 JWT 被签发为 unauthorized，前端缓存 | ① 实时查库 ② 禁止过期缓存 ③ 双源确认 |
| 4 | response.js 报错 | 使用 Express API，Vercel 是原生 http | 改为 `writeHead` + `end` |

---

## 八、下一步动作

### 🔴 紧急 — 数据导入

看板目前没有数据，`/api/dashboard/summary` 返回 `无活跃发薪周期`。

**数据导入路径：**

1. **Supabase 直接导入**（最快）  
   打开 [SQL Editor](https://supabase.com/dashboard/project/lvpanhfazewogelrhaeb/sql/1)，按顺序执行 INSERT：
   ```sql
   -- 1. 大区
   INSERT INTO regions (name) VALUES ('华东'), ('华南'), ('华北'), ('华中'), ('西南'), ('西北'), ('东北');
   
   -- 2. 组织（四级 + 五级）
   INSERT INTO organizations (name, level, parent_id, region_id) VALUES (...);
   
   -- 3. 员工
   INSERT INTO employees (employee_code, name, org_id, hourly_rate) VALUES (...);
   
   -- 4. 发薪周期
   INSERT INTO pay_periods (name, start_date, end_date) VALUES ('2026-06', '2026-06-01', '2026-06-30');
   
   -- 5. 工时 + 工资记录
   INSERT INTO work_records (...) VALUES (...);
   INSERT INTO salary_records (...) VALUES (...);
   ```

2. **API 批量导入**  
   `POST /api/import`（需 admin JWT），请求体格式见 `scripts/seed-data.js`。

3. **生成示例数据**  
   ```bash
   cd labor-cost-dashboard && node scripts/seed-data.js
   ```

### 🟡 中期 — 功能优化

| 事项 | 说明 |
|------|------|
| 自定义域名 | Vercel → Settings → Domains → 绑定公司域名 |
| 看板下钻 | 图表点击 → 展示组织/员工明细 |
| 月份切换 | 发薪周期选择器已做前端 UI，后端从传入 period_id 对应数据 |
| 更多分析维度 | 如同比/环比、趋势预测 |
| 大区 BP 权限配置 | 在 Supabase `user_permissions` 新增记录，role 设为 `region_manager`，filled `allowed_regions` |

### 🟢 长期 — 运维

| 事项 | 频率 | 说明 |
|------|------|------|
| Supabase 备份 | 每月 | Supabase Dashboard 可配置自动备份 |
| 环境变量审查 | 每季度 | 确认 JWT_SECRET 未泄露，更新飞书密钥 |
| 新管理员添加 | 按需 | Vercel 更新 `ADMIN_OPEN_IDS` + Supabase 插入 `user_permissions` |
| 数据库迁移 | 按需 | 新 SQL 文件放 `supabase/migrations/`，在 Supabase SQL Editor 执行 |

---

## 九、快速操作手册

### 添加新管理员
```bash
# 1. 在 Supabase SQL Editor 执行
INSERT INTO user_permissions (feishu_open_id, name, role)
VALUES ('新用户的OpenID', '姓名', 'admin');

# 2. 在 Vercel 更新环境变量
#    ADMIN_OPEN_IDS = ou_xxx,新用户的OpenID
#    然后 Redeploy
```

### 添加大区 BP
```sql
INSERT INTO user_permissions (feishu_open_id, name, role, allowed_regions)
VALUES ('ou_bp_openid', '张BP', 'region_manager', ARRAY['华东', '华南']);
```

### 查看当前管理员列表
```sql
SELECT * FROM user_permissions WHERE role = 'admin';
```

### 本地开发 & 部署
```bash
cd labor-cost-dashboard

# 修改代码后推送
git add -A && git commit -m "描述" && git push origin main

# （Vercel 会自动部署，无需手动操作）

# 如需强制部署
npx vercel --prod --yes
```

---

## 十、联系人 & 负责人

| 角色 | 飞书 Open ID | 系统角色 |
|------|-------------|---------|
| 管理员 | `ou_990886081df9fe9ad05775a4d83877dc` | admin |
| - | 待添加 | - |

---

> 此文档随项目迭代持续更新。每次重大变更后请同步更新本文件。
