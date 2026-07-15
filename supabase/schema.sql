-- Supabase schema for Sahil Cutzz Barber Appointment Management SaaS

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text,
  phone text,
  role text not null default 'customer',
  favorite_barber_id uuid null references barbers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists barbers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  image_url text,
  experience_years int not null default 0,
  bio text,
  working_hours jsonb not null default '{"start":"09:00","end":"18:00","breaks":[{"start":"13:00","end":"14:00"}],"off_days":["Sun"]}',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric not null default 0,
  duration_minutes int not null default 30,
  category text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  barber_id uuid not null references barbers(id),
  service_id uuid not null references services(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_minutes int not null,
  status text not null default 'pending',
  is_emergency boolean not null default false,
  reminder_sent boolean not null default false,
  shift_source_id uuid null references appointment_shifts(id),
  emergency_override_id uuid null references appointments(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists appointment_shifts (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references appointments(id),
  original_start_at timestamptz not null,
  new_start_at timestamptz not null,
  shift_reason text,
  created_at timestamptz not null default now()
);

create table if not exists schedules (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid not null references barbers(id),
  day_of_week text not null,
  open_time text not null,
  close_time text not null,
  breaks jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  type text not null,
  message text not null,
  related_appointment_id uuid null references appointments(id),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists analytics (
  id uuid primary key default uuid_generate_v4(),
  metric text not null,
  value numeric not null,
  metadata jsonb,
  recorded_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  barber_id uuid not null references barbers(id),
  rating int not null,
  comment text,
  created_at timestamptz not null default now()
);

-- Migration: run this in Supabase SQL Editor if your appointments table already exists.
alter table public.appointments
  add column if not exists reminder_sent boolean not null default false;

create index if not exists appointments_reminder_lookup_idx
  on public.appointments (start_at)
  where reminder_sent = false;

-- Payments table for Volzix payment gateway integration
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  order_id text not null unique,
  provider text not null default 'volzix',
  web_id text,
  flow_id text,
  payment_id text,
  transaction_id text,
  amount numeric not null,
  currency text not null default 'PKR',
  status text not null default 'pending',
  payment_type text not null default 'advance',
  service_id uuid references services(id),
  barber_id uuid references barbers(id),
  booking_date text,
  booking_time text,
  provider_response jsonb,
  webhook_payload jsonb,
  failure_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.payments
  add column if not exists provider text not null default 'volzix';
alter table public.payments
  add column if not exists web_id text;
alter table public.payments
  add column if not exists flow_id text;
alter table public.payments
  add column if not exists provider_response jsonb;
alter table public.payments
  add column if not exists webhook_payload jsonb;
alter table public.payments
  add column if not exists failure_reason text;

alter table public.appointments
  add column if not exists payment_id uuid references payments(id);

create index if not exists payments_user_id_idx on payments(user_id);
create index if not exists payments_order_id_idx on payments(order_id);
create index if not exists payments_status_idx on payments(status);
create index if not exists payments_payment_id_idx on payments(payment_id);
create index if not exists payments_provider_idx on payments(provider);
create index if not exists payments_web_id_idx on payments(web_id);
create index if not exists payments_flow_id_idx on payments(flow_id);
create unique index if not exists payments_web_id_unique_idx
  on payments(web_id)
  where web_id is not null;
create unique index if not exists payments_flow_id_unique_idx
  on payments(flow_id)
  where flow_id is not null;
create unique index if not exists payments_transaction_id_unique_idx
  on payments(transaction_id)
  where transaction_id is not null;

create table if not exists public.volzix_ipn_events (
  id uuid primary key default uuid_generate_v4(),
  event_id text not null unique,
  flow_id text,
  web_id text,
  status text,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists volzix_ipn_events_flow_id_idx on public.volzix_ipn_events(flow_id);
create index if not exists volzix_ipn_events_received_at_idx on public.volzix_ipn_events(received_at);
