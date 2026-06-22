drop policy if exists "Users can insert own session_block_logs" on public.session_block_logs;
drop policy if exists "Users can update own session_block_logs" on public.session_block_logs;

create policy "Users can insert own session_block_logs"
  on public.session_block_logs
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.session_logs
      where session_logs.id = session_block_logs.session_log_id
        and session_logs.user_id = session_block_logs.user_id
    )
  );

create policy "Users can update own session_block_logs"
  on public.session_block_logs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.session_logs
      where session_logs.id = session_block_logs.session_log_id
        and session_logs.user_id = session_block_logs.user_id
    )
  );

drop policy if exists "Users can insert own exercise_results" on public.exercise_results;
drop policy if exists "Users can update own exercise_results" on public.exercise_results;

alter table public.exercise_results
  drop constraint if exists exercise_results_player_id_fkey,
  drop constraint if exists exercise_results_session_log_id_fkey,
  alter column player_id drop not null,
  alter column session_log_id drop not null;

alter table public.exercise_results
  add constraint exercise_results_player_id_fkey
    foreign key (player_id) references public.players(id) on delete set null,
  add constraint exercise_results_session_log_id_fkey
    foreign key (session_log_id) references public.session_logs(id) on delete set null;

create policy "Users can insert own exercise_results"
  on public.exercise_results
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      player_id is null
      or exists (
        select 1
        from public.players
        where players.id = exercise_results.player_id
          and players.user_id = exercise_results.user_id
      )
    )
    and (
      session_log_id is null
      or exists (
        select 1
        from public.session_logs
        where session_logs.id = exercise_results.session_log_id
          and session_logs.user_id = exercise_results.user_id
      )
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
      player_id is null
      or exists (
        select 1
        from public.players
        where players.id = exercise_results.player_id
          and players.user_id = exercise_results.user_id
      )
    )
    and (
      session_log_id is null
      or exists (
        select 1
        from public.session_logs
        where session_logs.id = exercise_results.session_log_id
          and session_logs.user_id = exercise_results.user_id
      )
    )
  );

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'public_checkin_submissions'
  ) then
    alter publication supabase_realtime drop table public.public_checkin_submissions;
  end if;
end $$;
