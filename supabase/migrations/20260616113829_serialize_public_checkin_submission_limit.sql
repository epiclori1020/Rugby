create or replace function private.enforce_public_checkin_submission_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.link_id::text || ':' || new.link_player_id::text, 0));

  if (
    select count(*)
    from public.public_checkin_submissions submission
    where submission.link_id = new.link_id
      and submission.link_player_id = new.link_player_id
      and submission.deleted_at is null
  ) >= 20 then
    raise exception 'public check-in submission limit reached';
  end if;

  return new;
end;
$$;
