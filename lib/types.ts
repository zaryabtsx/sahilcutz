export type UserRole = 'admin' | 'barber' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  favorite_barber_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BarberProfile {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  experience_years: number;
  bio: string;
  working_hours: {
    start: string;
    end: string;
    breaks: { start: string; end: string }[];
    off_days: string[];
    unavailable_dates?: string[];
  };
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  image_url: string;
  is_active: boolean;
  buffer_minutes?: number;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'emergency'
  | 'shifted';

export interface AppointmentItem {
  id: string;
  user_id: string;
  barber_id: string;
  service_id: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  is_emergency: boolean;
  shift_source_id?: string | null;
  emergency_override_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentShift {
  id: string;
  appointment_id: string;
  original_start_at: string;
  new_start_at: string;
  shift_reason: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'booking' | 'reminder' | 'reschedule' | 'emergency';
  message: string;
  related_appointment_id?: string | null;
  read: boolean;
  created_at: string;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
}
