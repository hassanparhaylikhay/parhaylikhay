-- Per-student progress for Lesson Mode.
-- One row per (user, lesson). The slide-by-slide state lives in `state` (JSONB)
-- so the schema can evolve without further migrations.

create table if not exists public.lesson_mode_progress (
  user_id    uuid references auth.users(id) on delete cascade not null,
  lesson_id  text not null,
  state      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_mode_progress enable row level security;

create policy "lesson_mode_progress: students read their own"
  on public.lesson_mode_progress for select
  using (auth.uid() = user_id);

create policy "lesson_mode_progress: students upsert their own"
  on public.lesson_mode_progress for insert
  with check (auth.uid() = user_id);

create policy "lesson_mode_progress: students update their own"
  on public.lesson_mode_progress for update
  using (auth.uid() = user_id);
