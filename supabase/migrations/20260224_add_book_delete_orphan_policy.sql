create policy "books delete orphan by member"
  on public.bookclub_books
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.bookclub_members m
      where m.club_id = bookclub_books.club_id
        and m.user_id = auth.uid()
    )
    and not exists (
      select 1
      from public.bookclub_pitches p
      where p.book_id = bookclub_books.id
        and p.club_id = bookclub_books.club_id
        and p.round_number = bookclub_books.round_number
    )
  );
