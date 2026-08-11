-- 1. 凌太郎を削除（expenses.paid_by_member_id は ON DELETE SET NULL）
DELETE FROM members WHERE name = '凌太郎';

-- 2. 経費テーブルに割り勘対象メンバーカラムを追加（NULL = 全員）
ALTER TABLE expenses ADD COLUMN split_member_ids uuid[];

-- 3. advance_balances ビューを経費ごとの割り勘対象に対応させる
DROP VIEW IF EXISTS advance_balances;

CREATE VIEW advance_balances AS
WITH participants AS (
  SELECT id, name FROM members WHERE is_settlement_participant AND is_active
),
all_participant_ids AS (
  SELECT array_agg(id) AS ids FROM participants
),
expense_with_splits AS (
  SELECT
    date_trunc('month', e.incurred_on)::date AS month,
    e.amount,
    e.paid_by_member_id,
    COALESCE(
      CASE WHEN array_length(e.split_member_ids, 1) > 0 THEN e.split_member_ids END,
      a.ids
    ) AS split_ids
  FROM expenses e
  CROSS JOIN all_participant_ids a
),
months AS (
  SELECT DISTINCT month FROM expense_with_splits
),
grid AS (
  SELECT m.month, p.id AS member_id, p.name
  FROM months m
  CROSS JOIN participants p
),
member_totals AS (
  SELECT
    g.month,
    g.member_id,
    g.name,
    COALESCE(SUM(
      CASE WHEN ews.paid_by_member_id = g.member_id THEN ews.amount ELSE 0 END
    ), 0) AS paid_amount,
    COALESCE(SUM(
      CASE WHEN g.member_id = ANY(ews.split_ids)
      THEN ews.amount / array_length(ews.split_ids, 1)
      ELSE 0 END
    ), 0) AS fair_share
  FROM grid g
  LEFT JOIN expense_with_splits ews ON ews.month = g.month
  GROUP BY g.month, g.member_id, g.name
)
SELECT
  mt.month,
  mt.member_id,
  mt.name,
  mt.paid_amount,
  round(mt.fair_share) AS fair_share,
  mt.paid_amount - round(mt.fair_share) AS balance,
  s.id IS NOT NULL AS is_settled
FROM member_totals mt
LEFT JOIN settlements s ON s.period_month = mt.month AND s.member_id = mt.member_id;
