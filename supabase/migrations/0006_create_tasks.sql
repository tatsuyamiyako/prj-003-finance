create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  project_id uuid references projects(id) on delete set null,
  assigned_to uuid references members(id) on delete set null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;
create policy "Authenticated users can manage tasks" on tasks
  for all using (auth.role() = 'authenticated');
