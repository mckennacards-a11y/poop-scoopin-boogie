-- Poop Scoopin Boogie: clients, dogs, visits, notes, staff.
-- Paste this whole file into Supabase > SQL Editor and click Run.

-- Staff: the people allowed into the app (you and your mom).
create table if not exists public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null,
  gate_code text not null default '',
  access_notes text not null default '',
  bag_disposal text not null default 'client_bin'
    check (bag_disposal in ('client_bin', 'take_away')),
  instructions text not null default '',
  plan text not null default 'weekly' check (plan in ('weekly', 'biweekly')),
  -- 0 = Sunday ... 6 = Saturday
  service_day smallint not null check (service_day between 0 and 6),
  -- For biweekly plans: any date that was a service day. Visits fall every 14 days from it.
  biweekly_anchor date,
  price_cents integer not null default 8500 check (price_cents >= 0),
  status text not null default 'active'
    check (status in ('active', 'payment_issue', 'paused', 'cancelled')),
  payment_issue_since date,
  paid_through date,
  route_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  breed text not null default '',
  temperament text not null default 'friendly'
    check (temperament in ('friendly', 'shy', 'jumpy', 'keep_out')),
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists dogs_client_idx on public.dogs (client_id);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  visit_date date not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'complete')),
  started_at timestamptz not null default now(),
  started_by uuid references auth.users (id),
  completed_at timestamptz,
  completed_by uuid references auth.users (id),
  checklist jsonb not null default '{}'::jsonb,
  yard_photo_path text,
  gate_photo_path text,
  notes text not null default '',
  emailed_at timestamptz,
  email_error text,
  unique (client_id, visit_date),
  -- A visit only counts as complete with both photos.
  constraint complete_needs_photos check (
    status <> 'complete' or (yard_photo_path is not null and gate_photo_path is not null)
  )
);
create index if not exists visits_date_idx on public.visits (visit_date);

create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  body text not null,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists client_notes_client_idx on public.client_notes (client_id);

-- Row level security: only staff can read or write anything.
alter table public.staff enable row level security;
alter table public.clients enable row level security;
alter table public.dogs enable row level security;
alter table public.visits enable row level security;
alter table public.client_notes enable row level security;

drop policy if exists staff_read on public.staff;
create policy staff_read on public.staff for select to authenticated using (public.is_staff());

drop policy if exists clients_all on public.clients;
create policy clients_all on public.clients for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists dogs_all on public.dogs;
create policy dogs_all on public.dogs for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists visits_all on public.visits;
create policy visits_all on public.visits for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists client_notes_all on public.client_notes;
create policy client_notes_all on public.client_notes for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Private bucket for yard and gate photos.
insert into storage.buckets (id, name, public)
values ('visit-photos', 'visit-photos', false)
on conflict (id) do nothing;

drop policy if exists visit_photos_staff on storage.objects;
create policy visit_photos_staff on storage.objects for all to authenticated
  using (bucket_id = 'visit-photos' and public.is_staff())
  with check (bucket_id = 'visit-photos' and public.is_staff());
