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
