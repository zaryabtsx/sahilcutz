alter table public.appointments
  add column if not exists notes text;

notify pgrst, 'reload schema';
