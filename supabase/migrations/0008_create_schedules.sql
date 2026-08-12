create table schedules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table schedule_items (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules(id) on delete cascade,
  side text not null check (side in ('bruscape', 'client')),
  title text not null,
  due_date date,
  sort_order int not null default 0,
  is_done boolean not null default false,
  google_calendar_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table schedules enable row level security;
alter table schedule_items enable row level security;

create policy "Authenticated users can manage schedules" on schedules
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users can manage schedule_items" on schedule_items
  for all using (auth.role() = 'authenticated');
