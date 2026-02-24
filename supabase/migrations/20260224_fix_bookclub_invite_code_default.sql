alter table public.bookclubs
  alter column invite_code set default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
