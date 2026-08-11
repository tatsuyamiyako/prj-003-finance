-- 案件にも割り勘対象メンバーを追加
ALTER TABLE projects ADD COLUMN split_member_ids uuid[];
