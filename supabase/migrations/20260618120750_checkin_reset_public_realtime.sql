alter table public.public_checkin_submissions
drop constraint if exists public_checkin_submissions_status_check,
add constraint public_checkin_submissions_status_check check (
  status in ('pending', 'imported', 'conflict', 'superseded', 'reset')
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'public_checkin_submissions'
  ) then
    alter publication supabase_realtime add table public.public_checkin_submissions;
  end if;
end $$;
