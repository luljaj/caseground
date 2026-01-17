alter table public.users
  add column if not exists username text;

create unique index if not exists idx_users_username_lower
  on public.users (lower(username));

alter table public.users
  add constraint users_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');
