drop policy if exists "Users can insert own player_session_entries" on public.player_session_entries;
drop policy if exists "Users can update own player_session_entries" on public.player_session_entries;
drop policy if exists "Users can insert own progress_entries" on public.progress_entries;
drop policy if exists "Users can update own progress_entries" on public.progress_entries;
drop policy if exists "Users can insert own baseline_entries" on public.baseline_entries;
drop policy if exists "Users can update own baseline_entries" on public.baseline_entries;
drop policy if exists "Users can insert own returner_entries" on public.returner_entries;
drop policy if exists "Users can update own returner_entries" on public.returner_entries;

create policy "Users can insert own player_session_entries"
on public.player_session_entries for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.players
    where players.id = player_session_entries.player_id
      and players.user_id = player_session_entries.user_id
  )
  and (
    session_log_id is null
    or exists (
      select 1
      from public.session_logs
      where session_logs.id = player_session_entries.session_log_id
        and session_logs.user_id = player_session_entries.user_id
    )
  )
);

create policy "Users can update own player_session_entries"
on public.player_session_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.players
    where players.id = player_session_entries.player_id
      and players.user_id = player_session_entries.user_id
  )
  and (
    session_log_id is null
    or exists (
      select 1
      from public.session_logs
      where session_logs.id = player_session_entries.session_log_id
        and session_logs.user_id = player_session_entries.user_id
    )
  )
);

create policy "Users can insert own progress_entries"
on public.progress_entries for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.players
    where players.id = progress_entries.player_id
      and players.user_id = progress_entries.user_id
  )
  and (
    session_log_id is null
    or exists (
      select 1
      from public.session_logs
      where session_logs.id = progress_entries.session_log_id
        and session_logs.user_id = progress_entries.user_id
    )
  )
);

create policy "Users can update own progress_entries"
on public.progress_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.players
    where players.id = progress_entries.player_id
      and players.user_id = progress_entries.user_id
  )
  and (
    session_log_id is null
    or exists (
      select 1
      from public.session_logs
      where session_logs.id = progress_entries.session_log_id
        and session_logs.user_id = progress_entries.user_id
    )
  )
);

create policy "Users can insert own baseline_entries"
on public.baseline_entries for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.players
    where players.id = baseline_entries.player_id
      and players.user_id = baseline_entries.user_id
  )
  and (
    session_log_id is null
    or exists (
      select 1
      from public.session_logs
      where session_logs.id = baseline_entries.session_log_id
        and session_logs.user_id = baseline_entries.user_id
    )
  )
);

create policy "Users can update own baseline_entries"
on public.baseline_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.players
    where players.id = baseline_entries.player_id
      and players.user_id = baseline_entries.user_id
  )
  and (
    session_log_id is null
    or exists (
      select 1
      from public.session_logs
      where session_logs.id = baseline_entries.session_log_id
        and session_logs.user_id = baseline_entries.user_id
    )
  )
);

create policy "Users can insert own returner_entries"
on public.returner_entries for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.players
    where players.id = returner_entries.player_id
      and players.user_id = returner_entries.user_id
  )
  and (
    session_log_id is null
    or exists (
      select 1
      from public.session_logs
      where session_logs.id = returner_entries.session_log_id
        and session_logs.user_id = returner_entries.user_id
    )
  )
);

create policy "Users can update own returner_entries"
on public.returner_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.players
    where players.id = returner_entries.player_id
      and players.user_id = returner_entries.user_id
  )
  and (
    session_log_id is null
    or exists (
      select 1
      from public.session_logs
      where session_logs.id = returner_entries.session_log_id
        and session_logs.user_id = returner_entries.user_id
    )
  )
);
