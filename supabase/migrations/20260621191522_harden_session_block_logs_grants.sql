revoke all on table public.session_block_logs from anon, authenticated;
grant select, insert, update, delete on table public.session_block_logs to authenticated;
