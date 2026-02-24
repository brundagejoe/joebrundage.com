create policy "pitches delete self"
  on public.bookclub_pitches
  for delete
  to authenticated
  using (auth.uid() = user_id);
