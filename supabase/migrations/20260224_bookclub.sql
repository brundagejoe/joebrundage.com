create extension if not exists pgcrypto;

create table if not exists public.bookclubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  phase text not null default 'submission' check (phase in ('submission', 'voting', 'reading')),
  current_round integer not null default 1,
  meeting_at timestamptz,
  active_book_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookclub_members (
  club_id uuid not null references public.bookclubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table if not exists public.bookclub_books (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.bookclubs(id) on delete cascade,
  round_number integer not null,
  title text not null,
  author text not null,
  length_hours numeric(6,2) not null check (length_hours > 0 and length_hours <= 500),
  normalized_title text not null,
  normalized_author text not null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (club_id, round_number, normalized_title, normalized_author)
);

create table if not exists public.bookclub_pitches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.bookclubs(id) on delete cascade,
  round_number integer not null,
  book_id uuid not null references public.bookclub_books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pitch text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, round_number, user_id)
);

create table if not exists public.bookclub_votes (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.bookclubs(id) on delete cascade,
  round_number integer not null,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.bookclub_books(id) on delete cascade,
  rank integer not null check (rank > 0),
  created_at timestamptz not null default now(),
  unique (club_id, round_number, voter_user_id, rank),
  unique (club_id, round_number, voter_user_id, book_id)
);

alter table public.bookclubs
  add constraint bookclubs_active_book_id_fkey
  foreign key (active_book_id)
  references public.bookclub_books(id)
  on delete set null;

create index if not exists idx_bookclub_members_user on public.bookclub_members(user_id, joined_at desc);
create index if not exists idx_bookclub_books_club_round on public.bookclub_books(club_id, round_number);
create index if not exists idx_bookclub_pitches_club_round on public.bookclub_pitches(club_id, round_number);
create index if not exists idx_bookclub_votes_club_round on public.bookclub_votes(club_id, round_number);

alter table public.bookclubs enable row level security;
alter table public.bookclub_members enable row level security;
alter table public.bookclub_books enable row level security;
alter table public.bookclub_pitches enable row level security;
alter table public.bookclub_votes enable row level security;

create policy "bookclubs select for members"
  on public.bookclubs
  for select
  to authenticated
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.bookclub_members m
      where m.club_id = bookclubs.id
        and m.user_id = auth.uid()
    )
  );

create policy "bookclubs insert owner"
  on public.bookclubs
  for insert
  to authenticated
  with check (auth.uid() = owner_user_id);

create policy "bookclubs owner update"
  on public.bookclubs
  for update
  to authenticated
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

create policy "members select for members"
  on public.bookclub_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookclub_members self
      where self.club_id = bookclub_members.club_id
        and self.user_id = auth.uid()
    )
  );

create policy "members self join"
  on public.bookclub_members
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "members owner update"
  on public.bookclub_members
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.bookclubs c
      where c.id = bookclub_members.club_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "books select for members"
  on public.bookclub_books
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookclub_members m
      where m.club_id = bookclub_books.club_id
        and m.user_id = auth.uid()
    )
  );

create policy "books insert by member"
  on public.bookclub_books
  for insert
  to authenticated
  with check (
    auth.uid() = created_by_user_id
    and exists (
      select 1
      from public.bookclub_members m
      where m.club_id = bookclub_books.club_id
        and m.user_id = auth.uid()
    )
  );

create policy "pitches select for members"
  on public.bookclub_pitches
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookclub_members m
      where m.club_id = bookclub_pitches.club_id
        and m.user_id = auth.uid()
    )
  );

create policy "pitches insert self"
  on public.bookclub_pitches
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.bookclub_members m
      where m.club_id = bookclub_pitches.club_id
        and m.user_id = auth.uid()
    )
  );

create policy "pitches update self"
  on public.bookclub_pitches
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "votes select own or owner"
  on public.bookclub_votes
  for select
  to authenticated
  using (
    auth.uid() = voter_user_id
    or exists (
      select 1
      from public.bookclubs c
      where c.id = bookclub_votes.club_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "votes insert self"
  on public.bookclub_votes
  for insert
  to authenticated
  with check (
    auth.uid() = voter_user_id
    and exists (
      select 1
      from public.bookclub_members m
      where m.club_id = bookclub_votes.club_id
        and m.user_id = auth.uid()
    )
  );

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_bookclubs_updated_at on public.bookclubs;
create trigger trg_bookclubs_updated_at
before update on public.bookclubs
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_bookclub_pitches_updated_at on public.bookclub_pitches;
create trigger trg_bookclub_pitches_updated_at
before update on public.bookclub_pitches
for each row execute function public.set_updated_at_timestamp();
