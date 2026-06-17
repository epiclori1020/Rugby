alter table public.player_session_entries
add column if not exists session_reaction text not null default 'none' check (
  session_reaction in ('none', 'new_or_worse', 'unsure')
);

alter table public.public_checkin_submissions
add column if not exists session_reaction text not null default 'none' check (
  session_reaction in ('none', 'new_or_worse', 'unsure')
);

alter table public.player_session_entries
drop constraint if exists player_session_entries_checkin_source_check,
add constraint player_session_entries_checkin_source_check check (
  checkin_source in ('coach', 'player_link', 'player_kiosk', 'mixed')
);

revoke all on public.public_checkin_submissions from anon;

grant insert (
  id,
  link_id,
  link_player_id,
  readiness,
  life_flag,
  pain_score,
  pain_location,
  returner_flag,
  session_reaction,
  player_note,
  submitted_at,
  client_updated_at
) on public.public_checkin_submissions to anon;
