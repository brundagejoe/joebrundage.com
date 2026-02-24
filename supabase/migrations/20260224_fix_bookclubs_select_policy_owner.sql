drop policy if exists "bookclubs select for members" on public.bookclubs;

create policy "bookclubs select for members"
  on public.bookclubs
  for select
  to authenticated
  using (
    owner_user_id = auth.uid()
    or public.current_user_is_bookclub_member(id)
  );
