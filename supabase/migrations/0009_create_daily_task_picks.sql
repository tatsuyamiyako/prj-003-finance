create table daily_task_picks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  pick_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique(task_id, member_id, pick_date)
);

alter table daily_task_picks enable row level security;

create policy "Authenticated users can manage daily_task_picks" on daily_task_picks
  for all using (auth.role() = 'authenticated');
