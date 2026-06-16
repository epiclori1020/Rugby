revoke all on public.public_checkin_links from anon, authenticated;
revoke all on public.public_checkin_link_players from anon, authenticated;
revoke all on public.public_checkin_submissions from anon, authenticated;

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
