insert into businesses (name, sort_order) values
  ('LP制作', 1),
  ('SNS', 2),
  ('広告制作', 3),
  ('コンサルティング', 4)
on conflict (name) do nothing;

insert into expense_categories (name, sort_order) values
  ('撮影関連', 1),
  ('通信費', 2),
  ('雑費', 3),
  ('撮影機材', 4),
  ('旅費交通費', 5)
on conflict (name) do nothing;

insert into members (name, is_settlement_participant) values
  ('都くん', true),
  ('だいち', true),
  ('あかね', true),
  ('凌太郎', true)
on conflict (name) do nothing;
