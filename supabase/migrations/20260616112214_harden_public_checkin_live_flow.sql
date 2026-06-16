create or replace function private.is_active_public_checkin_link(checkin_link_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, extensions, pg_catalog
as $$
  select exists (
    select 1
    from public.public_checkin_links link
    where link.id = checkin_link_id
      and link.token_hash = private.current_checkin_token_hash()
      and link.closed_at is null
      and link.deleted_at is null
      and link.expires_at > now()
  );
$$;

create or replace function private.is_active_public_checkin_link_player(
  checkin_link_id uuid,
  checkin_link_player_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, private, extensions, pg_catalog
as $$
  select private.is_active_public_checkin_link(checkin_link_id)
    and exists (
      select 1
      from public.public_checkin_link_players link_player
      where link_player.id = checkin_link_player_id
        and link_player.link_id = checkin_link_id
        and link_player.deleted_at is null
    );
$$;

grant execute on function private.is_active_public_checkin_link(uuid) to anon, authenticated;
grant execute on function private.is_active_public_checkin_link_player(uuid, uuid) to anon, authenticated;

drop policy if exists "Anon can select active public checkin link players by token"
on public.public_checkin_link_players;

create policy "Anon can select active public checkin link players by token"
on public.public_checkin_link_players for select to anon
using (
  deleted_at is null
  and private.is_active_public_checkin_link(link_id)
);

drop policy if exists "Anon can insert active public checkin submissions by token"
on public.public_checkin_submissions;

create policy "Anon can insert active public checkin submissions by token"
on public.public_checkin_submissions for insert to anon
with check (
  private.is_active_public_checkin_link_player(link_id, link_player_id)
);

create or replace function private.enforce_public_checkin_submission_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
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

drop trigger if exists enforce_public_checkin_submission_limit
on public.public_checkin_submissions;

create trigger enforce_public_checkin_submission_limit
before insert on public.public_checkin_submissions
for each row
execute function private.enforce_public_checkin_submission_limit();

with ranked_open_links as (
  select
    id,
    row_number() over (
      partition by user_id, session_definition_id
      order by created_at desc, id desc
    ) as open_rank
  from public.public_checkin_links
  where closed_at is null
    and deleted_at is null
)
update public.public_checkin_links link
set
  closed_at = now(),
  updated_at = now(),
  client_updated_at = now()
from ranked_open_links ranked
where link.id = ranked.id
  and ranked.open_rank > 1;

create unique index if not exists public_checkin_links_one_open_session_idx
on public.public_checkin_links (user_id, session_definition_id)
where closed_at is null
  and deleted_at is null;
