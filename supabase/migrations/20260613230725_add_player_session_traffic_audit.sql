alter table public.player_session_entries
add column traffic_light_suggestion text null check (
  traffic_light_suggestion is null
  or traffic_light_suggestion in ('green', 'yellow', 'red')
),
add column traffic_light_was_manual boolean not null default false;
