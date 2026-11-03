-- =====================================================================
-- Couple Zone: Kumbukumbu (memories) + Maswali ya Wapenzi (quiz)
-- Endesha kwenye Supabase -> SQL Editor. Salama kuendesha mara nyingi.
-- =====================================================================

-- Kazi ya kuangalia kama mtumiaji yuko kwenye couple space (inazuia RLS loop)
create or replace function public.is_couple_member(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = cid and user_id = auth.uid()
  );
$$;
revoke all on function public.is_couple_member(uuid) from public;
grant execute on function public.is_couple_member(uuid) to authenticated;

-- ---------- Kumbukumbu ----------
create table if not exists public.couple_memories (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid references public.couples(id) on delete cascade,
  author_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text,
  content     text not null check (char_length(content) between 1 and 1000),
  created_at  timestamptz not null default now()
);
create index if not exists couple_memories_couple_idx on public.couple_memories (couple_id, created_at desc);
alter table public.couple_memories enable row level security;

drop policy if exists "memories read" on public.couple_memories;
create policy "memories read" on public.couple_memories for select to authenticated
  using (author_id = auth.uid() or (couple_id is not null and public.is_couple_member(couple_id)));

drop policy if exists "memories insert" on public.couple_memories;
create policy "memories insert" on public.couple_memories for insert to authenticated
  with check (author_id = auth.uid() and (couple_id is null or public.is_couple_member(couple_id)));

drop policy if exists "memories delete own" on public.couple_memories;
create policy "memories delete own" on public.couple_memories for delete to authenticated
  using (author_id = auth.uid());

-- ---------- Majibu ya maswali ----------
create table if not exists public.quiz_answers (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  couple_id    uuid references public.couples(id) on delete cascade,
  question_id  int  not null check (question_id between 0 and 99),
  own_choice   int  not null check (own_choice between 0 and 3),
  guess_choice int  not null check (guess_choice between 0 and 3),
  updated_at   timestamptz not null default now(),
  unique (user_id, question_id)
);
alter table public.quiz_answers enable row level security;

drop policy if exists "quiz read" on public.quiz_answers;
create policy "quiz read" on public.quiz_answers for select to authenticated
  using (user_id = auth.uid() or (couple_id is not null and public.is_couple_member(couple_id)));

drop policy if exists "quiz insert" on public.quiz_answers;
create policy "quiz insert" on public.quiz_answers for insert to authenticated
  with check (user_id = auth.uid() and (couple_id is null or public.is_couple_member(couple_id)));

drop policy if exists "quiz update own" on public.quiz_answers;
create policy "quiz update own" on public.quiz_answers for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (couple_id is null or public.is_couple_member(couple_id)));

drop policy if exists "quiz delete own" on public.quiz_answers;
create policy "quiz delete own" on public.quiz_answers for delete to authenticated
  using (user_id = auth.uid());

select 'tayari' as hali;
