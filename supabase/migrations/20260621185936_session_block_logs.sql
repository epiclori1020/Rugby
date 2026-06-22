create table public.session_block_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_log_id uuid not null references public.session_logs(id) on delete cascade,
  session_definition_id text not null,
  block_key text not null check (btrim(block_key) <> ''),
  block_title text not null default '',
  block_order integer not null check (block_order >= 0),
  planned_time text not null default '',
  planned_work text not null default '',
  status text not null default 'planned' check (status in ('planned', 'done', 'reduced', 'changed', 'skipped')),
  reason text not null default 'none' check (
    reason in ('none', 'time', 'weather', 'group', 'safety', 'equipment', 'coach_decision')
  ),
  coach_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  client_updated_at timestamptz not null,
  constraint session_block_logs_status_reason_check check (
    (status in ('planned', 'done') and reason = 'none')
    or (status in ('reduced', 'changed', 'skipped') and reason <> 'none')
  ),
  constraint session_block_logs_user_session_block_unique unique (user_id, session_log_id, block_key)
);

grant select, insert, update, delete on public.session_block_logs to authenticated;
revoke all on public.session_block_logs from anon;

create index session_block_logs_user_id_idx on public.session_block_logs(user_id);
create index session_block_logs_user_session_idx
  on public.session_block_logs(user_id, session_log_id)
  where deleted_at is null;
create index session_block_logs_user_session_block_idx
  on public.session_block_logs(user_id, session_log_id, block_key)
  where deleted_at is null;
create index session_block_logs_user_client_updated_active_idx
  on public.session_block_logs(user_id, client_updated_at)
  where deleted_at is null;

alter table public.session_block_logs enable row level security;

create policy "Users can select own session_block_logs"
  on public.session_block_logs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own session_block_logs"
  on public.session_block_logs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own session_block_logs"
  on public.session_block_logs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own session_block_logs"
  on public.session_block_logs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
