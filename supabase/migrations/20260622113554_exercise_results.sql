create table public.exercise_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  session_log_id uuid not null references public.session_logs(id) on delete cascade,
  exercise_key text not null check (btrim(exercise_key) <> ''),
  variant text not null default 'custom' check (variant in ('A_plus', 'A', 'B', 'C', 'D', 'custom')),
  sets integer null check (sets between 1 and 20),
  reps text not null default '',
  load_value numeric null check (load_value >= 0),
  load_unit text not null default 'kg' check (load_unit in ('kg', 'bodyweight', 'm', 's', 'reps', 'cm')),
  rpe numeric null check (rpe between 0 and 10),
  rir numeric null check (rir between 0 and 10),
  technique_quality text not null default 'not_recorded'
    check (technique_quality in ('good', 'ok', 'limited', 'poor', 'not_recorded')),
  pain_response text not null default 'unclear'
    check (pain_response in ('none', 'same', 'worse', 'better', 'unclear')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  client_updated_at timestamptz not null,
  constraint exercise_results_user_session_player_exercise_unique
    unique (user_id, session_log_id, player_id, exercise_key)
);

revoke all on table public.exercise_results from anon, authenticated;
grant select, insert, update, delete on table public.exercise_results to authenticated;

create index exercise_results_user_id_idx on public.exercise_results(user_id);
create index exercise_results_user_session_idx
  on public.exercise_results(user_id, session_log_id)
  where deleted_at is null;
create index exercise_results_user_player_exercise_updated_idx
  on public.exercise_results(user_id, player_id, exercise_key, client_updated_at desc)
  where deleted_at is null;
create index exercise_results_user_client_updated_active_idx
  on public.exercise_results(user_id, client_updated_at)
  where deleted_at is null;

alter table public.exercise_results enable row level security;

create policy "Users can select own exercise_results"
  on public.exercise_results
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own exercise_results"
  on public.exercise_results
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      exists (
        select 1
        from public.players
        where players.id = exercise_results.player_id
          and players.user_id = exercise_results.user_id
      )
    )
    and exists (
      select 1
      from public.session_logs
      where session_logs.id = exercise_results.session_log_id
        and session_logs.user_id = exercise_results.user_id
    )
  );

create policy "Users can update own exercise_results"
  on public.exercise_results
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      exists (
        select 1
        from public.players
        where players.id = exercise_results.player_id
          and players.user_id = exercise_results.user_id
      )
    )
    and exists (
      select 1
      from public.session_logs
      where session_logs.id = exercise_results.session_log_id
        and session_logs.user_id = exercise_results.user_id
    )
  );

create policy "Users can delete own exercise_results"
  on public.exercise_results
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
