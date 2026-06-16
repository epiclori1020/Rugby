create schema if not exists private;

create or replace function private.current_checkin_token_hash()
returns text
language sql
stable
set search_path = extensions, pg_catalog
as $$
  select encode(
    digest(
      coalesce(
        nullif(current_setting('request.headers', true), '')::json ->> 'x-checkin-token',
        ''
      ),
      'sha256'
    ),
    'hex'
  );
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.current_checkin_token_hash() to anon, authenticated;

alter table public.player_session_entries
add column if not exists checkin_source text not null default 'coach' check (
  checkin_source in ('coach', 'player_link', 'mixed')
),
add column if not exists player_submitted_at timestamptz null,
add column if not exists coach_edited_at timestamptz null,
add column if not exists player_note text not null default '';

create table public.public_checkin_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_definition_id text not null,
  session_title text not null,
  session_date date not null,
  token_hash text not null unique check (length(token_hash) = 64),
  expires_at timestamptz not null,
  closed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  client_updated_at timestamptz not null
);

create table public.public_checkin_link_players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  link_id uuid not null references public.public_checkin_links(id) on delete cascade,
  player_id uuid null references public.players(id) on delete set null,
  display_name text not null check (btrim(display_name) <> ''),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  client_updated_at timestamptz not null,
  unique (link_id, player_id)
);

create table public.public_checkin_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  link_id uuid not null references public.public_checkin_links(id) on delete cascade,
  link_player_id uuid not null references public.public_checkin_link_players(id) on delete cascade,
  player_id uuid null references public.players(id) on delete set null,
  readiness integer null check (readiness is null or readiness between 1 and 5),
  life_flag text not null default '',
  pain_score integer null check (pain_score is null or pain_score between 0 and 10),
  pain_location text not null default '',
  returner_flag text not null default 'offen' check (returner_flag in ('nein', 'ja', 'offen')),
  player_note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'imported', 'conflict', 'superseded')),
  submitted_at timestamptz not null default now(),
  imported_at timestamptz null,
  conflict_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  client_updated_at timestamptz not null default now()
);

create or replace function private.populate_public_checkin_submission_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  selected_player public.public_checkin_link_players%rowtype;
begin
  select *
  into selected_player
  from public.public_checkin_link_players
  where id = new.link_player_id
    and link_id = new.link_id
    and deleted_at is null;

  if not found then
    raise exception 'invalid public check-in player';
  end if;

  new.user_id := selected_player.user_id;
  new.player_id := selected_player.player_id;
  new.life_flag := btrim(coalesce(new.life_flag, ''));
  new.pain_location := btrim(coalesce(new.pain_location, ''));
  new.player_note := btrim(coalesce(new.player_note, ''));
  new.submitted_at := coalesce(new.submitted_at, now());
  new.client_updated_at := coalesce(new.client_updated_at, new.submitted_at);
  return new;
end;
$$;

create trigger populate_public_checkin_submission_owner
before insert on public.public_checkin_submissions
for each row
execute function private.populate_public_checkin_submission_owner();

grant select, insert, update, delete on public.public_checkin_links to authenticated;
grant select, insert, update, delete on public.public_checkin_link_players to authenticated;
grant select, insert, update, delete on public.public_checkin_submissions to authenticated;

grant select (id, session_definition_id, session_title, session_date, expires_at, closed_at)
on public.public_checkin_links to anon;
grant select (id, link_id, display_name, sort_order)
on public.public_checkin_link_players to anon;
grant insert (
  id,
  link_id,
  link_player_id,
  readiness,
  life_flag,
  pain_score,
  pain_location,
  returner_flag,
  player_note,
  submitted_at,
  client_updated_at
) on public.public_checkin_submissions to anon;

alter table public.public_checkin_links enable row level security;
alter table public.public_checkin_link_players enable row level security;
alter table public.public_checkin_submissions enable row level security;

create index public_checkin_links_user_session_idx
on public.public_checkin_links (user_id, session_definition_id)
where deleted_at is null;

create index public_checkin_link_players_link_idx
on public.public_checkin_link_players (link_id, sort_order)
where deleted_at is null;

create index public_checkin_submissions_user_status_idx
on public.public_checkin_submissions (user_id, status)
where deleted_at is null;

create policy "Users can select own public checkin links"
on public.public_checkin_links for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own public checkin links"
on public.public_checkin_links for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own public checkin links"
on public.public_checkin_links for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own public checkin links"
on public.public_checkin_links for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Anon can select active public checkin links by token"
on public.public_checkin_links for select to anon
using (
  token_hash = private.current_checkin_token_hash()
  and closed_at is null
  and deleted_at is null
  and expires_at > now()
);

create policy "Users can select own public checkin link players"
on public.public_checkin_link_players for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own public checkin link players"
on public.public_checkin_link_players for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own public checkin link players"
on public.public_checkin_link_players for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own public checkin link players"
on public.public_checkin_link_players for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Anon can select active public checkin link players by token"
on public.public_checkin_link_players for select to anon
using (
  deleted_at is null
  and exists (
    select 1
    from public.public_checkin_links link
    where link.id = public_checkin_link_players.link_id
      and link.token_hash = private.current_checkin_token_hash()
      and link.closed_at is null
      and link.deleted_at is null
      and link.expires_at > now()
  )
);

create policy "Users can select own public checkin submissions"
on public.public_checkin_submissions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update own public checkin submissions"
on public.public_checkin_submissions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own public checkin submissions"
on public.public_checkin_submissions for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Anon can insert active public checkin submissions by token"
on public.public_checkin_submissions for insert to anon
with check (
  exists (
    select 1
    from public.public_checkin_links link
    join public.public_checkin_link_players link_player
      on link_player.link_id = link.id
    where link.id = public_checkin_submissions.link_id
      and link_player.id = public_checkin_submissions.link_player_id
      and link.token_hash = private.current_checkin_token_hash()
      and link.closed_at is null
      and link.deleted_at is null
      and link.expires_at > now()
      and link_player.deleted_at is null
  )
);
