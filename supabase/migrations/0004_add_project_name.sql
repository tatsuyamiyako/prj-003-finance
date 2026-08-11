-- 案件名カラムを追加
ALTER TABLE projects ADD COLUMN name text;

-- project_profits ビューに案件名を追加
CREATE OR REPLACE VIEW project_profits AS
SELECT
  p.id AS project_id,
  p.code,
  p.name AS project_name,
  p.client_name,
  b.name AS business_name,
  p.status,
  p.revenue_month,
  p.revenue_excl_tax,
  coalesce(e.cost, 0) AS cost,
  p.revenue_excl_tax - coalesce(e.cost, 0) AS gross_profit,
  CASE
    WHEN p.revenue_excl_tax = 0 THEN null
    ELSE round((p.revenue_excl_tax - coalesce(e.cost, 0)) / p.revenue_excl_tax, 4)
  END AS gross_margin
FROM projects p
LEFT JOIN businesses b ON b.id = p.business_id
LEFT JOIN (
  SELECT project_id, sum(amount) AS cost
  FROM expenses
  WHERE project_id IS NOT NULL
  GROUP BY project_id
) e ON e.project_id = p.id;
