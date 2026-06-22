create table public.metric_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid null references public.players(id) on delete set null,
  session_log_id uuid null references public.session_logs(id) on delete set null,
  metric_key text not null check (btrim(metric_key) <> ''),
  value numeric not null check (value >= 0),
  attempt integer not null default 1 check (attempt between 1 and 20),
  is_valid boolean not null default true,
  body_side text not null default 'none' check (body_side in ('none', 'left', 'right')),
  context_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  client_updated_at timestamptz not null,
  constraint metric_results_user_session_player_metric_attempt_side_unique
    unique (user_id, session_log_id, player_id, metric_key, attempt, body_side)
);

revoke all on table public.metric_results from anon, authenticated;
grant select, insert, update, delete on table public.metric_results to authenticated;

create index metric_results_user_id_idx on public.metric_results(user_id);
create index metric_results_user_session_idx
  on public.metric_results(user_id, session_log_id)
  where deleted_at is null;
create index metric_results_user_player_metric_updated_idx
  on public.metric_results(user_id, player_id, metric_key, client_updated_at desc)
  where deleted_at is null and player_id is not null;
create index metric_results_user_client_updated_active_idx
  on public.metric_results(user_id, client_updated_at)
  where deleted_at is null;

alter table public.metric_results enable row level security;

create policy "Users can select own metric_results"
  on public.metric_results
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own metric_results"
  on public.metric_results
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      player_id is null
      or exists (
        select 1
        from public.players
        where players.id = metric_results.player_id
          and players.user_id = metric_results.user_id
      )
    )
    and (
      session_log_id is null
      or exists (
        select 1
        from public.session_logs
        where session_logs.id = metric_results.session_log_id
          and session_logs.user_id = metric_results.user_id
      )
    )
  );

create policy "Users can update own metric_results"
  on public.metric_results
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      player_id is null
      or exists (
        select 1
        from public.players
        where players.id = metric_results.player_id
          and players.user_id = metric_results.user_id
      )
    )
    and (
      session_log_id is null
      or exists (
        select 1
        from public.session_logs
        where session_logs.id = metric_results.session_log_id
          and session_logs.user_id = metric_results.user_id
      )
    )
  );

create policy "Users can delete own metric_results"
  on public.metric_results
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
