# 人力成本分析平台 (nana)

飞书 SSO 登录 + 区域权限控制 + 人力成本分析看板。

## 技术栈

- **前端**: HTML + CSS + Chart.js（GitHub Pages 托管）
- **后端**: Vercel Serverless Functions (Node.js)
- **数据库**: Supabase (PostgreSQL)
- **认证**: 飞书 OAuth 2.0 + JWT

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入飞书凭证和 Supabase 连接信息

# 本地开发
vercel dev

# 部署
vercel --prod
```

## 数据库迁移

在 Supabase SQL Editor 中执行 `supabase/migrations/001_initial_schema.sql`

## 环境变量

| 变量 | 说明 |
|------|------|
| `FEISHU_APP_ID` | 飞书应用 ID |
| `FEISHU_APP_SECRET` | 飞书应用密钥 |
| `JWT_SECRET` | JWT 签名密钥 |
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 |
| `BASE_URL` | Vercel 部署域名 |
| `ADMIN_OPEN_IDS` | 管理员飞书 Open ID |

## 项目结构

```
├── api/                    # Vercel Serverless Functions
│   ├── _lib/               # 共享工具库
│   ├── auth/               # 飞书 OAuth 认证
│   ├── dashboard/          # 看板数据 API
│   ├── employees.js        # 员工管理
│   ├── pay-periods.js      # 发薪周期
│   └── import.js           # 数据导入
├── public/                 # 前端静态资源
│   ├── index.html          # 看板主页
│   ├── login.html          # 飞书登录页
│   ├── css/style.css       # 样式
│   └── js/                 # JavaScript 模块
├── supabase/
│   └── migrations/         # 数据库迁移文件
└── vercel.json             # Vercel 配置
```

## 权限模型

- **admin**: 全部数据可见
- **region_manager**: 仅可见所属区域数据
- **viewer**: 只读查看
