# 人力成本分析平台 — 部署指南

> ✅ 代码已推送至 [github.com/na0718/nana](https://github.com/na0718/nana)

## 第一步：初始化 Supabase 数据库

你的 Supabase 项目名：**nana**

1. 打开 Supabase Dashboard：https://supabase.com/dashboard/project/_/sql/1
2. 复制 `supabase/migrations/001_initial_schema.sql` 全部内容
3. 粘贴到 SQL Editor → 点击 **Run**
4. 进入 **Settings → API** 复制以下信息：
   - Project URL
   - `anon` public key
   - `service_role` key（仅 Vercel 后端用，不要暴露到前端）

| 配置项 | 入口 |
|--------|------|
| Supabase SQL Editor | https://supabase.com/dashboard/project/_/sql/1 |
| Supabase Project URL & Keys | https://supabase.com/dashboard/project/_/settings/api |

---

## 第二步：配置 Vercel 环境变量

你的 Vercel 项目已连接 GitHub 仓库 `na0718/nana`，每次推送会自动部署。

1. 打开 Vercel 项目设置：https://vercel.com/dashboard → 选择 **nana** 项目 → **Settings → Environment Variables**
2. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `FEISHU_APP_ID` | `cli_aace194cf7f85cb1` | 飞书应用 ID |
| `FEISHU_APP_SECRET` | `XiWzKoC8fqj1upcyycAyOgt1QVMOvoyr` | 飞书应用密钥 |
| `JWT_SECRET` | 生成一个随机字符串 | JWT 签名密钥 |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | 从 Supabase 复制 |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | 从 Supabase 复制 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | 从 Supabase 复制 |
| `BASE_URL` | `https://nana-xxx.vercel.app` | 部署后获取 |
| `ADMIN_OPEN_IDS` | 你的飞书 Open ID | 管理员标识 |

3. 点击 **Save** 后，在 Deployments 页面点击 **Redeploy** 让变量生效。

| 配置项 | 入口 |
|--------|------|
| Vercel 环境变量 | https://vercel.com/na0718s-projects/nana/settings/environment-variables（请替换为实际项目 ID） |

---

## 第三步：配置飞书应用回调地址

部署后获取 Vercel 域名（如 `https://nana-xxx.vercel.app`）。

在 [飞书开放平台](https://open.feishu.cn/app/cli_aace194cf7f85cb1) → 你的应用：

1. **安全设置** → 添加回调地址：
   - `https://你的域名.vercel.app/api/auth/callback`
2. **权限管理** → 添加权限：
   - `获取用户信息`
3. **发布应用** → 提交审核 → 通过后发布

| 配置项 | 入口 |
|--------|------|
| 飞书应用安全设置 | https://open.feishu.cn/app/cli_aace194cf7f85cb1/security |
| 飞书应用权限管理 | https://open.feishu.cn/app/cli_aace194cf7f85cb1/permission |

---

## 第四步：导入示例数据（可选）

```bash
# 生成示例数据
node scripts/seed-data.js

# 通过 API 导入（需要先获取 admin JWT）
# 登录后从浏览器控制台获取
curl -X POST https://你的域名.vercel.app/api/import \
  -H "Authorization: Bearer <your_admin_jwt>" \
  -H "Content-Type: application/json" \
  -d @scripts/sample-data.json
```

---

## 第五步：验证

1. 访问你的 Vercel 域名 → 自动跳转登录页
2. 点击「飞书账号登录」→ 授权
3. 登录后看到看板数据

---

## 常见问题

### 飞书登录后 500 错误
检查 Vercel 环境变量是否正确设置（特别是 FEISHU_APP_SECRET）

### 看板数据全为 0
确认已导入数据，检查 Supabase 连接是否正常

### 回调地址不匹配
飞书开放平台配置的回调地址必须与 `BASE_URL + /api/auth/callback` 完全一致

### 推送到 GitHub 失败
仓库名大小写敏感，实际是 `Na0718/nana`，但推送用 `na0718/nana` 即可。
