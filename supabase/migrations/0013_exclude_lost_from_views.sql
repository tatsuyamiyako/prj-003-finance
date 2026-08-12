-- 失注案件を売上集計から除外

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
) e ON e.project_id = p.id
WHERE p.status <> 'lost';

CREATE OR REPLACE VIEW monthly_summary AS
WITH revenue AS (
  SELECT date_trunc('month', revenue_month)::date AS month, sum(revenue_excl_tax) AS revenue
  FROM projects
  WHERE revenue_month IS NOT NULL AND status <> 'lost'
  GROUP BY 1
),
cost AS (
  SELECT date_trunc('month', incurred_on)::date AS month, sum(amount) AS cost
  FROM expenses
  GROUP BY 1
)
SELECT
  coalesce(r.month, c.month) AS month,
  coalesce(r.revenue, 0) AS revenue,
  coalesce(c.cost, 0) AS cost,
  coalesce(r.revenue, 0) - coalesce(c.cost, 0) AS gross_profit,
  CASE
    WHEN coalesce(r.revenue, 0) = 0 THEN null
    ELSE round((coalesce(r.revenue, 0) - coalesce(c.cost, 0)) / r.revenue, 4)
  END AS gross_margin
FROM revenue r
FULL OUTER JOIN cost c ON c.month = r.month;
