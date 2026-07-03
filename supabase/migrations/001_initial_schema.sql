-- ============================================================
-- 人力成本分析平台 — 数据库初始化 Schema
-- Migration: 001_initial_schema
-- ============================================================

-- 1. 大区表
CREATE TABLE IF NOT EXISTS regions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 组织架构表（支持 4 级和 5 级）
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  level       INT NOT NULL CHECK (level IN (4, 5)),  -- 4=四级组织(片区), 5=五级组织(职能组)
  parent_id   UUID REFERENCES organizations(id) ON DELETE SET NULL,
  region_id   UUID REFERENCES regions(id) ON DELETE SET NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 员工表
CREATE TABLE IF NOT EXISTS employees (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code  TEXT NOT NULL UNIQUE,      -- 工号
  name           TEXT NOT NULL,              -- 姓名
  company        TEXT,                       -- 公司名称
  org_id         UUID REFERENCES organizations(id) ON DELETE SET NULL, -- 所属五级组织
  hourly_rate    DECIMAL(10,2),              -- 时薪
  annual_salary  DECIMAL(12,2),              -- 年薪
  status         TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 发薪周期
CREATE TABLE IF NOT EXISTS pay_periods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  region_id   UUID REFERENCES regions(id) ON DELETE SET NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 工时记录
CREATE TABLE IF NOT EXISTS work_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pay_period_id    UUID NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE,
  regular_hours    DECIMAL(10,2) DEFAULT 0,
  overtime_hours   DECIMAL(10,2) DEFAULT 0,
  paid_leave_hours DECIMAL(10,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, pay_period_id)
);

-- 6. 工资记录
CREATE TABLE IF NOT EXISTS salary_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pay_period_id   UUID NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE,
  regular_pay     DECIMAL(12,2) DEFAULT 0,
  overtime_pay    DECIMAL(12,2) DEFAULT 0,
  paid_leave_pay  DECIMAL(12,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, pay_period_id)
);

-- 7. 用户权限表（飞书 SSO）
CREATE TABLE IF NOT EXISTS user_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feishu_open_id  TEXT NOT NULL UNIQUE,
  name            TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'region_manager', 'viewer')),
  allowed_regions TEXT[] DEFAULT '{}',
  allowed_orgs    UUID[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 触发器：自动更新 updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_employees_updated_at') THEN
    CREATE TRIGGER trg_employees_updated_at
      BEFORE UPDATE ON employees
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_permissions_updated_at') THEN
    CREATE TRIGGER trg_user_permissions_updated_at
      BEFORE UPDATE ON user_permissions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ============================================================
-- 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(org_id);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_region ON organizations(region_id);
CREATE INDEX IF NOT EXISTS idx_work_records_employee ON work_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_records_period ON work_records(pay_period_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_employee ON salary_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_period ON salary_records(pay_period_id);
CREATE INDEX IF NOT EXISTS idx_pay_periods_region ON pay_periods(region_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_openid ON user_permissions(feishu_open_id);

-- ============================================================
-- RLS 策略（Row Level Security）
-- ============================================================

-- 员工表：所有认证用户可读
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON employees
  FOR SELECT USING (auth.role() = 'authenticated');

-- 工时记录：所有认证用户可读
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON work_records
  FOR SELECT USING (auth.role() = 'authenticated');

-- 工资记录：仅 service_role 可写，所有认证用户可读
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON salary_records
  FOR SELECT USING (auth.role() = 'authenticated');

-- 组织架构：所有认证用户可读
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON organizations
  FOR SELECT USING (auth.role() = 'authenticated');

-- 用户权限表：仅 service_role 可操作
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full for service_role" ON user_permissions
  USING (true) WITH CHECK (true);

-- ============================================================
-- 看板汇总视图
-- ============================================================
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
  pp.id          AS pay_period_id,
  pp.name        AS pay_period_name,
  pp.start_date,
  pp.end_date,
  r.name         AS region_name,
  r.id           AS region_id,
  COUNT(DISTINCT e.id)                                    AS total_employees,
  COUNT(DISTINCT CASE WHEN wr.overtime_hours > 0 THEN e.id END) AS employees_with_overtime,
  COALESCE(SUM(wr.regular_hours), 0)                      AS total_regular_hours,
  COALESCE(SUM(wr.overtime_hours), 0)                     AS total_overtime_hours,
  COALESCE(SUM(wr.paid_leave_hours), 0)                   AS total_paid_leave_hours,
  COALESCE(SUM(wr.regular_hours + wr.overtime_hours + wr.paid_leave_hours), 0) AS total_hours,
  COALESCE(SUM(sr.regular_pay), 0)                        AS total_regular_pay,
  COALESCE(SUM(sr.overtime_pay), 0)                       AS total_overtime_pay,
  COALESCE(SUM(sr.paid_leave_pay), 0)                     AS total_paid_leave_pay,
  COALESCE(SUM(sr.regular_pay + sr.overtime_pay + sr.paid_leave_pay), 0) AS total_pay
FROM pay_periods pp
LEFT JOIN regions r ON pp.region_id = r.id
LEFT JOIN employees e ON TRUE
LEFT JOIN organizations o ON e.org_id = o.id
LEFT JOIN work_records wr ON wr.employee_id = e.id AND wr.pay_period_id = pp.id
LEFT JOIN salary_records sr ON sr.employee_id = e.id AND sr.pay_period_id = pp.id
GROUP BY pp.id, pp.name, pp.start_date, pp.end_date, r.name, r.id;

-- 四级组织汇总视图
CREATE OR REPLACE VIEW org_level4_summary AS
SELECT
  o4.id          AS org_id,
  o4.name        AS org_name,
  o4.level       AS org_level,
  r.name         AS region_name,
  r.id           AS region_id,
  pp.id          AS pay_period_id,
  COUNT(DISTINCT e.id)                                          AS headcount,
  COALESCE(SUM(wr.regular_hours + wr.overtime_hours + wr.paid_leave_hours), 0) AS total_hours,
  COALESCE(SUM(wr.overtime_hours), 0)                           AS overtime_hours,
  COALESCE(SUM(sr.regular_pay + sr.overtime_pay + sr.paid_leave_pay), 0)       AS total_pay,
  COALESCE(SUM(sr.overtime_pay), 0)                             AS overtime_pay
FROM organizations o4
JOIN organizations o5 ON o5.parent_id = o4.id AND o5.level = 5
JOIN employees e ON e.org_id = o5.id
LEFT JOIN work_records wr ON wr.employee_id = e.id AND wr.pay_period_id = (
  SELECT id FROM pay_periods WHERE is_active = true LIMIT 1
)
LEFT JOIN salary_records sr ON sr.employee_id = e.id AND sr.pay_period_id = (
  SELECT id FROM pay_periods WHERE is_active = true LIMIT 1
)
LEFT JOIN pay_periods pp ON pp.id = wr.pay_period_id
LEFT JOIN regions r ON o4.region_id = r.id
WHERE o4.level = 4
GROUP BY o4.id, o4.name, o4.level, r.name, r.id, pp.id;
