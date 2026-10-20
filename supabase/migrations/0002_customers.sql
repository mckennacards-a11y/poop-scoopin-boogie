-- Customer accounts and sign-ups.
-- Paste into Supabase > SQL Editor and click Run (after 0001_init.sql).
--
-- Customers log in with a link emailed to them. They can only ever see the
-- client record whose email matches the email they logged in with.

alter table public.clients add column if not exists stripe_customer_id text;

-- Client ids that belong to the logged-in customer (matched by verified email).
create or replace function public.my_client_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.clients
  where email <> '' and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

drop policy if exists clients_customer_read on public.clients;
create policy clients_customer_read on public.clients for select to authenticated
  using (id in (select public.my_client_ids()));

drop policy if exists dogs_customer_read on public.dogs;
create policy dogs_customer_read on public.dogs for select to authenticated
  using (client_id in (select public.my_client_ids()));

drop policy if exists visits_customer_read on public.visits;
create policy visits_customer_read on public.visits for select to authenticated
  using (status = 'complete' and client_id in (select public.my_client_ids()));

-- Photos are stored as <visit id>/<file>. Customers may read photos of their own finished visits.
drop policy if exists visit_photos_customer_read on storage.objects;
create policy visit_photos_customer_read on storage.objects for select to authenticated
  using (
    bucket_id = 'visit-photos'
    and exists (
      select 1 from public.visits v
      where v.id::text = split_part(name, '/', 1)
        and v.status = 'complete'
        and v.client_id in (select public.my_client_ids())
    )
  );

-- Customers can update their own yard access details, nothing else.
create or replace function public.update_my_details(
  p_phone text,
  p_gate_code text,
  p_access_notes text,
  p_instructions text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.clients
  set phone = left(coalesce(p_phone, ''), 40),
      gate_code = left(coalesce(p_gate_code, ''), 40),
      access_notes = left(coalesce(p_access_notes, ''), 500),
      instructions = left(coalesce(p_instructions, ''), 1000)
  where id in (select public.my_client_ids());
$$;
revoke all on function public.update_my_details(text, text, text, text) from public, anon;
grant execute on function public.update_my_details(text, text, text, text) to authenticated;

-- New customer sign-ups from the public form. Anyone can submit; only staff can read.
create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  phone text not null default '' check (length(phone) <= 40),
  email text not null check (length(email) between 3 and 200),
  address text not null check (length(address) between 3 and 300),
  dog_count smallint not null default 1 check (dog_count between 1 and 20),
  plan text not null default 'weekly' check (plan in ('weekly', 'biweekly', 'one_time')),
  notes text not null default '' check (length(notes) <= 1000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.signups enable row level security;

drop policy if exists signups_public_insert on public.signups;
create policy signups_public_insert on public.signups for insert to anon, authenticated
  with check (handled = false);

drop policy if exists signups_staff on public.signups;
create policy signups_staff on public.signups for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

grant insert on public.signups to anon;
