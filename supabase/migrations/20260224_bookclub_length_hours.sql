alter table public.bookclub_books
  add column if not exists length_hours numeric(6,2);

update public.bookclub_books
set length_hours = length_pages::numeric
where length_hours is null
  and exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'bookclub_books'
      and c.column_name = 'length_pages'
  );

alter table public.bookclub_books
  alter column length_hours set not null;

alter table public.bookclub_books
  add constraint bookclub_books_length_hours_check
  check (length_hours > 0 and length_hours <= 500)
  not valid;

alter table public.bookclub_books
  validate constraint bookclub_books_length_hours_check;

alter table public.bookclub_books
  drop constraint if exists bookclub_books_length_pages_check;

alter table public.bookclub_books
  drop column if exists length_pages;
