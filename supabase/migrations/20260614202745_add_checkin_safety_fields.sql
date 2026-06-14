alter table public.player_session_entries
add column if not exists red_flag text not null default 'none' check (
  red_flag in ('none', 'head_neck_neuro', 'acute_instability')
),
add column if not exists movement_concern boolean not null default false;
