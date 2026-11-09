-- Maestro AI: multi-learner account model and learning records
create extension if not exists pgcrypto;

create table if not exists public.guardian_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learner_profiles (
  id uuid primary key default gen_random_uuid(),
  guardian_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  birth_year smallint,
  age_band text not null check (age_band in ('4-8','9-16','adult')),
  learning_preferences jsonb not null default '{}'::jsonb,
  avatar_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists learner_profiles_guardian_idx on public.learner_profiles(guardian_user_id);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  lesson_id text not null,
  status text not null default 'in_progress' check (status in ('in_progress','mastered')),
  attempts integer not null default 0 check (attempts >= 0),
  best_score numeric(5,2) check (best_score between 0 and 100),
  mastered_at timestamptz,
  last_position jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (learner_id, lesson_id)
);
create index if not exists lesson_progress_learner_idx on public.lesson_progress(learner_id, updated_at desc);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  instrument text not null,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  notes_played integer not null default 0 check (notes_played >= 0),
  accuracy numeric(5,2) check (accuracy between 0 and 100),
  timing_deviation_ms numeric(8,2),
  session_summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists practice_sessions_learner_idx on public.practice_sessions(learner_id, started_at desc);

create table if not exists public.generated_pieces (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  title text not null,
  prompt text,
  provider text not null default 'procedural',
  model text,
  audio_path text,
  midi_path text,
  arrangement jsonb not null default '{}'::jsonb,
  duration_seconds integer,
  created_at timestamptz not null default now()
);
create index if not exists generated_pieces_learner_idx on public.generated_pieces(learner_id, created_at desc);

create table if not exists public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  target_minutes integer not null default 60 check (target_minutes between 5 and 1000),
  week_start date not null,
  created_at timestamptz not null default now(),
  unique (learner_id, week_start)
);

alter table public.guardian_accounts enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.generated_pieces enable row level security;
alter table public.weekly_goals enable row level security;

-- Make the migration safe to re-run in a staging project.
drop policy if exists "guardians manage own account" on public.guardian_accounts;
drop policy if exists "guardians manage own learners" on public.learner_profiles;
drop policy if exists "guardians manage learner progress" on public.lesson_progress;
drop policy if exists "guardians manage learner practice" on public.practice_sessions;
drop policy if exists "guardians manage learner pieces" on public.generated_pieces;
drop policy if exists "guardians manage learner goals" on public.weekly_goals;

create policy "guardians manage own account" on public.guardian_accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "guardians manage own learners" on public.learner_profiles
  for all using (guardian_user_id = auth.uid()) with check (guardian_user_id = auth.uid());

create policy "guardians manage learner progress" on public.lesson_progress
  for all using (exists (select 1 from public.learner_profiles p where p.id = learner_id and p.guardian_user_id = auth.uid()))
  with check (exists (select 1 from public.learner_profiles p where p.id = learner_id and p.guardian_user_id = auth.uid()));

create policy "guardians manage learner practice" on public.practice_sessions
  for all using (exists (select 1 from public.learner_profiles p where p.id = learner_id and p.guardian_user_id = auth.uid()))
  with check (exists (select 1 from public.learner_profiles p where p.id = learner_id and p.guardian_user_id = auth.uid()));

create policy "guardians manage learner pieces" on public.generated_pieces
  for all using (exists (select 1 from public.learner_profiles p where p.id = learner_id and p.guardian_user_id = auth.uid()))
  with check (exists (select 1 from public.learner_profiles p where p.id = learner_id and p.guardian_user_id = auth.uid()));

create policy "guardians manage learner goals" on public.weekly_goals
  for all using (exists (select 1 from public.learner_profiles p where p.id = learner_id and p.guardian_user_id = auth.uid()))
  with check (exists (select 1 from public.learner_profiles p where p.id = learner_id and p.guardian_user_id = auth.uid()));


-- Private audio bucket. Store objects under <auth-user-id>/<learner-id>/<filename>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('maestro-audio', 'maestro-audio', false, 52428800, array['audio/mpeg','audio/wav','audio/mp4','audio/midi','audio/x-midi'])
on conflict (id) do nothing;

drop policy if exists "guardians read own audio" on storage.objects;
drop policy if exists "guardians upload own audio" on storage.objects;
drop policy if exists "guardians update own audio" on storage.objects;
drop policy if exists "guardians delete own audio" on storage.objects;

create policy "guardians read own audio" on storage.objects
  for select using (bucket_id = 'maestro-audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "guardians upload own audio" on storage.objects
  for insert with check (bucket_id = 'maestro-audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "guardians update own audio" on storage.objects
  for update using (bucket_id = 'maestro-audio' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'maestro-audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "guardians delete own audio" on storage.objects
  for delete using (bucket_id = 'maestro-audio' and (storage.foldername(name))[1] = auth.uid()::text);
