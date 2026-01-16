create extension if not exists "pgcrypto";

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  track text not null check (track in ('estimations', 'behaviorals', 'reasoning')),
  category text not null,
  prompt text not null,
  rubric jsonb not null,
  example_answer text not null,
  suggested_time integer not null,
  companies text[] default '{}',
  created_at timestamp with time zone default now()
);

create index if not exists idx_questions_track on public.questions(track);
create index if not exists idx_questions_category on public.questions(category);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  ai_credits integer default 5,
  created_at timestamp with time zone default now()
);

create table if not exists public.user_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  response text not null,
  time_taken integer,
  ai_feedback text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_user_responses_user on public.user_responses(user_id);
create index if not exists idx_user_responses_question on public.user_responses(question_id);
create index if not exists idx_user_responses_created on public.user_responses(created_at);

alter table public.users enable row level security;
alter table public.user_responses enable row level security;
alter table public.questions enable row level security;

create policy "Users can view own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can view own responses"
  on public.user_responses for select using (auth.uid() = user_id);

create policy "Users can insert own responses"
  on public.user_responses for insert with check (auth.uid() = user_id);

create policy "Users can update own responses"
  on public.user_responses for update using (auth.uid() = user_id);

create policy "Questions are publicly readable"
  on public.questions for select using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
