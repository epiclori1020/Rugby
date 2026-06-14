alter table public.player_session_entries
add column training_variant text null check (
  training_variant is null
  or training_variant in ('A_plus', 'A', 'B', 'C', 'D')
);
