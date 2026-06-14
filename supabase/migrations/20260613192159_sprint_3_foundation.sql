create extension if not exists pgcrypto with schema extensions;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  position text not null default 'offen',
  cluster text not null default 'offen' check (
    cluster in ('front_row', 'locks', 'back_row', 'halves', 'centres', 'back_three', 'offen')
  ),
  active boolean not null default true,
  consent_status text not null default 'unklar' check (
    consent_status in ('vorhanden', 'offen', 'unklar')
  ),
  photo_consent_status text not null default 'not_asked' check (
    photo_consent_status in ('not_asked', 'allowed', 'denied')
  ),
  photo_path text null,
  photo_updated_at timestamptz null,
  returner_status text not null default 'offen' check (
    returner_status in ('nein', 'ja', 'offen')
  ),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  client_updated_at timestamptz not null
);

create table public.session_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_definition_id text not null,
  date date not null,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed')),
  coach text not null default '',
  group_size integer null check (group_size is null or group_size >= 0),
  weather_or_heat_note text not null default '',
  plan_changed boolean not null default false,
  duration_minutes integer null check (duration_minutes is null or duration_minutes >= 0),
  contact_index text not null default '',
  speed_exposure_note text not null default '',
  coach_review text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  client_updated_at timestamptz not null
);

create table public.player_session_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_log_id uuid null references public.session_logs(id) on delete set null,
  player_id uuid null references public.players(id) on delete set null,
  present boolean not null default false,
  readiness integer null check (readiness is null or readiness between 1 and 5),
  life_flag text not null default '',
  pain_score integer null check (pain_score is null or pain_score between 0 and 10),
  pain_location text not null default '',
  returner_flag text not null default 'offen' check (returner_flag in ('nein', 'ja', 'offen')),
  traffic_light text null check (traffic_light is null or traffic_light in ('green', 'yellow', 'red')),
  limits text[] not null default '{}',
  observation text not null default '',
  session_rpe integer null check (session_rpe is null or session_rpe between 0 and 10),
  duration_minutes integer null check (duration_minutes is null or duration_minutes >= 0),
  session_load integer generated always as (
    case
      when session_rpe is null or duration_minutes is null then null
      else session_rpe * duration_minutes
    end
  ) stored,
  post_pain_score integer null check (post_pain_score is null or post_pain_score between 0 and 10),
  post_pain_location text not null default '',
  e2_decision text null check (
    e2_decision is null or e2_decision in ('normal', 'C', 'D', 'kein_sprint', 'kein_cond', 'physio')
  ),
  next_step text null check (
    next_step is null or next_step in ('steigern', 'halten', 'reduzieren', 'klaeren')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  client_updated_at timestamptz not null
);

create table public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid null references public.players(id) on delete set null,
  session_log_id uuid null references public.session_logs(id) on delete set null,
  main_exercise text not null default '',
  load text not null default '',
  reps text not null default '',
  rpe text not null default '',
  power_or_sprint text not null default '',
  conditioning text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  client_updated_at timestamptz not null
);

create table public.baseline_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid null references public.players(id) on delete set null,
  session_log_id uuid null references public.session_logs(id) on delete set null,
  broad_jump_cm numeric null check (broad_jump_cm is null or broad_jump_cm >= 0),
  med_ball_chest_pass_m numeric null check (med_ball_chest_pass_m is null or med_ball_chest_pass_m >= 0),
  med_ball_weight_kg numeric null check (med_ball_weight_kg is null or med_ball_weight_kg >= 0),
  sprint_30m numeric null check (sprint_30m is null or sprint_30m >= 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  client_updated_at timestamptz not null
);

create table public.returner_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid null references public.players(id) on delete set null,
  session_log_id uuid null references public.session_logs(id) on delete set null,
  medical_contact_note text not null default '',
  current_stage text not null default '',
  speed_cap text not null default '',
  cod_decel_cap text not null default '',
  conditioning_cap text not null default '',
  contact_cap text not null default '',
  allowed_today text not null default '',
  planned_caps text not null default '',
  completed text not null default '',
  symptoms_during text not null default '',
  next_morning text not null default '',
  decision text null check (
    decision is null or decision in ('bleiben', 'steigern', 'reduzieren', 'rueckmelden')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  client_updated_at timestamptz not null
);

grant select, insert, update, delete on public.players to authenticated;
grant select, insert, update, delete on public.session_logs to authenticated;
grant select, insert, update, delete on public.player_session_entries to authenticated;
grant select, insert, update, delete on public.progress_entries to authenticated;
grant select, insert, update, delete on public.baseline_entries to authenticated;
grant select, insert, update, delete on public.returner_entries to authenticated;

revoke all on public.players from anon;
revoke all on public.session_logs from anon;
revoke all on public.player_session_entries from anon;
revoke all on public.progress_entries from anon;
revoke all on public.baseline_entries from anon;
revoke all on public.returner_entries from anon;

create index players_user_id_idx on public.players(user_id);
create index session_logs_user_id_idx on public.session_logs(user_id);
create index player_session_entries_user_id_idx on public.player_session_entries(user_id);
create index progress_entries_user_id_idx on public.progress_entries(user_id);
create index baseline_entries_user_id_idx on public.baseline_entries(user_id);
create index returner_entries_user_id_idx on public.returner_entries(user_id);

create index players_user_active_idx on public.players(user_id, active) where deleted_at is null;
create index players_client_updated_idx on public.players(user_id, client_updated_at);

alter table public.players enable row level security;
alter table public.session_logs enable row level security;
alter table public.player_session_entries enable row level security;
alter table public.progress_entries enable row level security;
alter table public.baseline_entries enable row level security;
alter table public.returner_entries enable row level security;

create policy "Users can select own players"
on public.players for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own players"
on public.players for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own players"
on public.players for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own players"
on public.players for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can select own session_logs"
on public.session_logs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own session_logs"
on public.session_logs for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own session_logs"
on public.session_logs for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own session_logs"
on public.session_logs for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can select own player_session_entries"
on public.player_session_entries for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own player_session_entries"
on public.player_session_entries for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own player_session_entries"
on public.player_session_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own player_session_entries"
on public.player_session_entries for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can select own progress_entries"
on public.progress_entries for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own progress_entries"
on public.progress_entries for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own progress_entries"
on public.progress_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own progress_entries"
on public.progress_entries for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can select own baseline_entries"
on public.baseline_entries for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own baseline_entries"
on public.baseline_entries for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own baseline_entries"
on public.baseline_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own baseline_entries"
on public.baseline_entries for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can select own returner_entries"
on public.returner_entries for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own returner_entries"
on public.returner_entries for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own returner_entries"
on public.returner_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own returner_entries"
on public.returner_entries for delete to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-photos',
  'player-photos',
  false,
  2097152,
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can select own player photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'player-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'players'
);

create policy "Users can insert own player photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'player-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'players'
);

create policy "Users can update own player photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'player-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'players'
)
with check (
  bucket_id = 'player-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'players'
);

create policy "Users can delete own player photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'player-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'players'
);
