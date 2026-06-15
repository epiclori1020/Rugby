-- Performance Sprint: keep existing RLS/policies unchanged, add query indexes used by sync pulls.
create index if not exists players_user_client_updated_active_idx
on public.players (user_id, client_updated_at)
where deleted_at is null;

create index if not exists session_logs_user_client_updated_active_idx
on public.session_logs (user_id, client_updated_at)
where deleted_at is null;

create index if not exists player_session_entries_user_client_updated_active_idx
on public.player_session_entries (user_id, client_updated_at)
where deleted_at is null;

create index if not exists progress_entries_user_client_updated_active_idx
on public.progress_entries (user_id, client_updated_at)
where deleted_at is null;

create index if not exists baseline_entries_user_client_updated_active_idx
on public.baseline_entries (user_id, client_updated_at)
where deleted_at is null;

create index if not exists returner_entries_user_client_updated_active_idx
on public.returner_entries (user_id, client_updated_at)
where deleted_at is null;
