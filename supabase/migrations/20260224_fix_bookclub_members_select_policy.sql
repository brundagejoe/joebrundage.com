drop policy if exists "members select for members" on public.bookclub_members;

create or replace function public.current_user_is_bookclub_member(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookclub_members m
    where m.club_id = target_club_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.current_user_is_bookclub_member(uuid) from public;
grant execute on function public.current_user_is_bookclub_member(uuid) to authenticated;

create policy "members select for members"
  on public.bookclub_members
  for select
  to authenticated
  using (public.current_user_is_bookclub_member(club_id));
