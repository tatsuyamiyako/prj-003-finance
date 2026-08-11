create extension if not exists "pgcrypto";

create type project_status as enum (
  'lost',
  'won',
  'in_progress',
  'delivered',
  'paid'
);

create type invoice_status as enum ('not_sent', 'sent');
create type payment_status as enum ('unpaid', 'paid');

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name text not null unique,
  email text unique,
  is_settlement_participant boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  client_name text not null,
  business_id uuid references businesses (id) on delete set null,
  summary text,
  revenue_excl_tax numeric(12, 0) not null default 0,
  revenue_incl_tax numeric(12, 0) not null default 0,
  revenue_month date,
  payment_month date,
  status project_status not null default 'won',
  invoice_status invoice_status not null default 'not_sent',
  payment_status payment_status not null default 'unpaid',
  next_action text,
  notes text,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_revenue_month_idx on projects (revenue_month);
create index projects_status_idx on projects (status);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  incurred_on date not null,
  project_id uuid references projects (id) on delete set null,
  category_id uuid references expense_categories (id) on delete set null,
  description text not null,
  amount numeric(12, 0) not null,
  paid_by_member_id uuid references members (id) on delete set null,
  notes text,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_project_id_idx on expenses (project_id);
create index expenses_incurred_on_idx on expenses (incurred_on);
create index expenses_paid_by_idx on expenses (paid_by_member_id);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  period_month date not null,
  member_id uuid not null references members (id) on delete cascade,
  settled_amount numeric(12, 0) not null,
  settled_at timestamptz not null default now(),
  notes text,
  unique (period_month, member_id)
);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_set_updated_at
before update on projects
for each row execute function set_updated_at();

create trigger expenses_set_updated_at
before update on expenses
for each row execute function set_updated_at();

create view project_profits as
select
  p.id as project_id,
  p.code,
  p.client_name,
  b.name as business_name,
  p.status,
  p.revenue_month,
  p.revenue_excl_tax,
  coalesce(e.cost, 0) as cost,
  p.revenue_excl_tax - coalesce(e.cost, 0) as gross_profit,
  case
    when p.revenue_excl_tax = 0 then null
    else round((p.revenue_excl_tax - coalesce(e.cost, 0)) / p.revenue_excl_tax, 4)
  end as gross_margin
from projects p
left join businesses b on b.id = p.business_id
left join (
  select project_id, sum(amount) as cost
  from expenses
  where project_id is not null
  group by project_id
) e on e.project_id = p.id;

create view monthly_summary as
with revenue as (
  select date_trunc('month', revenue_month)::date as month, sum(revenue_excl_tax) as revenue
  from projects
  where revenue_month is not null
  group by 1
),
cost as (
  select date_trunc('month', incurred_on)::date as month, sum(amount) as cost
  from expenses
  group by 1
)
select
  coalesce(r.month, c.month) as month,
  coalesce(r.revenue, 0) as revenue,
  coalesce(c.cost, 0) as cost,
  coalesce(r.revenue, 0) - coalesce(c.cost, 0) as gross_profit,
  case
    when coalesce(r.revenue, 0) = 0 then null
    else round((coalesce(r.revenue, 0) - coalesce(c.cost, 0)) / r.revenue, 4)
  end as gross_margin
from revenue r
full outer join cost c on c.month = r.month;

create view advance_balances as
with participants as (
  select id, name from members where is_settlement_participant and is_active
),
paid as (
  select
    date_trunc('month', e.incurred_on)::date as month,
    e.paid_by_member_id as member_id,
    sum(e.amount) as paid_amount
  from expenses e
  where e.paid_by_member_id is not null
  group by 1, 2
),
months as (
  select distinct month from paid
),
grid as (
  select m.month, p.id as member_id, p.name
  from months m
  cross join participants p
),
totals as (
  select
    g.month,
    g.member_id,
    g.name,
    coalesce(paid.paid_amount, 0) as paid_amount,
    sum(coalesce(paid.paid_amount, 0)) over (partition by g.month) as month_total,
    count(*) over (partition by g.month) as participant_count
  from grid g
  left join paid on paid.month = g.month and paid.member_id = g.member_id
)
select
  t.month,
  t.member_id,
  t.name,
  t.paid_amount,
  round(t.month_total / t.participant_count) as fair_share,
  t.paid_amount - round(t.month_total / t.participant_count) as balance,
  s.id is not null as is_settled
from totals t
left join settlements s on s.period_month = t.month and s.member_id = t.member_id;

alter table businesses enable row level security;
alter table expense_categories enable row level security;
alter table members enable row level security;
alter table projects enable row level security;
alter table expenses enable row level security;
alter table settlements enable row level security;

create policy "authenticated read businesses" on businesses for select to authenticated using (true);
create policy "authenticated write businesses" on businesses for all to authenticated using (true) with check (true);

create policy "authenticated read categories" on expense_categories for select to authenticated using (true);
create policy "authenticated write categories" on expense_categories for all to authenticated using (true) with check (true);

create policy "authenticated read members" on members for select to authenticated using (true);
create policy "authenticated write members" on members for all to authenticated using (true) with check (true);

create policy "authenticated read projects" on projects for select to authenticated using (true);
create policy "authenticated write projects" on projects for all to authenticated using (true) with check (true);

create policy "authenticated read expenses" on expenses for select to authenticated using (true);
create policy "authenticated write expenses" on expenses for all to authenticated using (true) with check (true);

create policy "authenticated read settlements" on settlements for select to authenticated using (true);
create policy "authenticated write settlements" on settlements for all to authenticated using (true) with check (true);
