-- SQL migration: add missing payer_phone column to payments

alter table public.payments
  add column if not exists payer_phone text;
