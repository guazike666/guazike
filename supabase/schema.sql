-- =========================================================
-- 朝暮 · shared cloud state
-- Run this whole file in Supabase → SQL Editor.
-- =========================================================

create table if not exists public.couple_state (
  id integer primary key check (id = 1),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);

-- Who is allowed to read/write the couple state.
-- Rows are inserted manually from the SQL editor after creating the account.
create table if not exists public.couple_owner (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.couple_state enable row level security;
alter table public.couple_owner enable row level security;

drop policy if exists "owner can see own membership" on public.couple_owner;
create policy "owner can see own membership"
  on public.couple_owner
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "couple can read state" on public.couple_state;
create policy "couple can read state"
  on public.couple_state
  for select
  to authenticated
  using (
    exists (
      select 1 from public.couple_owner
      where user_id = auth.uid()
    )
  );

drop policy if exists "couple can insert state" on public.couple_state;
create policy "couple can insert state"
  on public.couple_state
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.couple_owner
      where user_id = auth.uid()
    )
  );

drop policy if exists "couple can update state" on public.couple_state;
create policy "couple can update state"
  on public.couple_state
  for update
  to authenticated
  using (
    exists (
      select 1 from public.couple_owner
      where user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.couple_owner
      where user_id = auth.uid()
    )
  );

-- Server-side timestamp so both devices can safely compare versions,
-- even when their clocks are slightly different.
create or replace function public.touch_couple_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists couple_state_touch on public.couple_state;
create trigger couple_state_touch
  before insert or update on public.couple_state
  for each row
  execute function public.touch_couple_state();

revoke all on public.couple_state from anon;
revoke all on public.couple_owner from anon;

grant select, insert, update, delete on public.couple_state to authenticated;
grant select on public.couple_owner to authenticated;

-- After creating the login user in Authentication → Users,
-- run this once with the same email. Repeat for a second account if needed:
--
-- insert into public.couple_owner (user_id)
-- select id from auth.users where email = 'you@example.com'
-- on conflict (user_id) do nothing;
