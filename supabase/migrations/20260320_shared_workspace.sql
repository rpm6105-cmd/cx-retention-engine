create extension if not exists pgcrypto;

create table if not exists public.companies (
  id text primary key,
  name text,
  domain text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists company_id text references public.companies(id) on delete set null;
alter table public.profiles add column if not exists role text not null default 'csm';
alter table public.profiles add column if not exists is_approved boolean not null default false;
alter table public.profiles add column if not exists plan text not null default 'Starter';

create table if not exists public.customers (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  customer_id text,
  account_name text not null,
  name text,
  plan_type text,
  plan text,
  arr numeric default 0,
  mrr numeric default 0,
  active_users integer default 0,
  monthly_logins integer default 0,
  logins_last_30_days integer default 0,
  feature_usage_score numeric default 0,
  support_tickets_last_30_days integer default 0,
  support_tickets integer default 0,
  csat numeric default 0,
  nps numeric default 0,
  last_login_days_ago integer default 0,
  last_activity text,
  renewal_date date,
  health_score numeric default 0,
  health_category text,
  churn_risk text,
  assigned_csm_name text,
  assigned_csm_email text,
  plan_value numeric default 0,
  usage_trend jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_company_idx on public.customers(company_id);
create index if not exists customers_company_account_idx on public.customers(company_id, account_name);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  assigned_csm_email text,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique(company_id, customer_id)
);

create index if not exists assignments_company_idx on public.assignments(company_id);
create index if not exists assignments_profile_idx on public.assignments(assigned_profile_id);

create table if not exists public.tasks (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  customer_id text references public.customers(id) on delete cascade,
  customer_name text,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  owner_email text,
  title text not null,
  description text default '',
  priority text not null default 'Medium',
  due_date date,
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_company_idx on public.tasks(company_id);
create index if not exists tasks_owner_idx on public.tasks(owner_profile_id);

create table if not exists public.dataset_uploads (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  file_name text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  row_count integer not null default 0,
  status text not null default 'completed'
);

create index if not exists dataset_uploads_company_idx on public.dataset_uploads(company_id, uploaded_at desc);

insert into public.companies (id, name, domain)
select split_part(email, '@', 2), split_part(email, '@', 2), split_part(email, '@', 2)
from public.profiles
where email is not null
on conflict (id) do nothing;

update public.profiles
set company_id = coalesce(company_id, split_part(email, '@', 2)),
    role = case when coalesce(is_owner, false) then 'admin' else coalesce(role, 'csm') end,
    is_approved = coalesce(is_approved, false)
where company_id is null or role is null;
