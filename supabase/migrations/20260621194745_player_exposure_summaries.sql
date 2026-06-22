create table public.player_exposure_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid null references public.players(id) on delete set null,
  session_log_id uuid null references public.session_logs(id) on delete set null,
  session_definition_id text not null,
  session_date date not null,
  speed_status text not null default 'none' check (speed_status in ('none', 'completed', 'reduced', 'skipped')),
  acceleration_status text not null default 'none' check (acceleration_status in ('none', 'completed', 'reduced', 'skipped')),
  cod_decel_status text not null default 'none' check (cod_decel_status in ('none', 'completed', 'reduced', 'skipped')),
  lower_strength_status text not null default 'none' check (lower_strength_status in ('none', 'completed', 'reduced', 'skipped')),
  upper_strength_status text not null default 'none' check (upper_strength_status in ('none', 'completed', 'reduced', 'skipped')),
  power_status text not null default 'none' check (power_status in ('none', 'completed', 'reduced', 'skipped')),
  conditioning_status text not null default 'none' check (conditioning_status in ('none', 'completed', 'reduced', 'skipped')),
  contact_prep_status text not null default 'none' check (contact_prep_status in ('none', 'completed', 'reduced', 'skipped')),
  neck_trunk_status text not null default 'none' check (neck_trunk_status in ('none', 'completed', 'reduced', 'skipped')),
  mobility_status text not null default 'none' check (mobility_status in ('none', 'completed', 'reduced', 'skipped')),
  reconditioning_status text not null default 'none' check (reconditioning_status in ('none', 'completed', 'reduced', 'skipped')),
  sources jsonb not null default '{}'::jsonb,
  manual_overrides jsonb not null default '{}'::jsonb,
  coach_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  client_updated_at timestamptz not null,
  constraint player_exposure_summaries_user_session_player_unique unique (user_id, session_log_id, player_id)
);

revoke all on table public.player_exposure_summaries from anon, authenticated;
grant select, insert, update, delete on table public.player_exposure_summaries to authenticated;

create index player_exposure_summaries_user_id_idx on public.player_exposure_summaries(user_id);
create index player_exposure_summaries_user_session_idx
  on public.player_exposure_summaries(user_id, session_log_id)
  where deleted_at is null;
create index player_exposure_summaries_user_player_date_idx
  on public.player_exposure_summaries(user_id, player_id, session_date desc)
  where deleted_at is null and player_id is not null;
create index player_exposure_summaries_user_client_updated_active_idx
  on public.player_exposure_summaries(user_id, client_updated_at)
  where deleted_at is null;

alter table public.player_exposure_summaries enable row level security;

create policy "Users can select own player_exposure_summaries"
  on public.player_exposure_summaries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own player_exposure_summaries"
  on public.player_exposure_summaries
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      player_id is null
      or exists (
        select 1
        from public.players
        where players.id = player_exposure_summaries.player_id
          and players.user_id = player_exposure_summaries.user_id
      )
    )
    and (
      session_log_id is null
      or exists (
        select 1
        from public.session_logs
        where session_logs.id = player_exposure_summaries.session_log_id
          and session_logs.user_id = player_exposure_summaries.user_id
      )
    )
  );

create policy "Users can update own player_exposure_summaries"
  on public.player_exposure_summaries
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
        where players.id = player_exposure_summaries.player_id
          and players.user_id = player_exposure_summaries.user_id
      )
    )
    and (
      session_log_id is null
      or exists (
        select 1
        from public.session_logs
        where session_logs.id = player_exposure_summaries.session_log_id
          and session_logs.user_id = player_exposure_summaries.user_id
      )
    )
  );

create policy "Users can delete own player_exposure_summaries"
  on public.player_exposure_summaries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
