import type { AppointmentItem, BarberProfile, NotificationItem, ServiceItem, UserProfile } from './types';

export const initialBarbers: BarberProfile[] = [
  {
    id: 'barber-sahil',
    name: 'Sahil',
    slug: 'sahil',
    image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    experience_years: 12,
    bio: 'Luxury barber delivering precision style for premium clients.',
    working_hours: {
      start: '09:00',
      end: '19:00',
      breaks: [{ start: '13:00', end: '14:00' }],
      off_days: ['Sun'],
    },
    is_available: true,
    created_at: '2026-05-01T08:00:00Z',
    updated_at: '2026-05-01T08:00:00Z',
  },
];

export const initialServices: ServiceItem[] = [
  {
    id: 'service-haircut',
    name: 'Hair Cut',
    description: 'Precision haircut tailored to your style.',
    price: 40,
    duration_minutes: 30,
    category: 'Cut',
    image_url: '/service-haircut.jpg',
    is_active: true,
    buffer_minutes: 10,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 'service-beard',
    name: 'Beard Trim',
    description: 'Sharp beard styling and contour shaping.',
    price: 25,
    duration_minutes: 20,
    category: 'Grooming',
    image_url: '/service-beard.jpg',
    is_active: true,
    buffer_minutes: 10,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 'service-combo',
    name: 'Hair + Beard Combo',
    description: 'Complete haircut and beard sculpt for a polished finish.',
    price: 65,
    duration_minutes: 60,
    category: 'Combo',
    image_url: '/service-combo.jpg',
    is_active: true,
    buffer_minutes: 15,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 'service-facial',
    name: 'Facial',
    description: 'Refreshing facial treatment for a healthy glow.',
    price: 55,
    duration_minutes: 45,
    category: 'Wellness',
    image_url: '/service-facial.jpg',
    is_active: true,
    buffer_minutes: 15,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  },
];

export const initialCustomers: UserProfile[] = [
  {
    id: 'customer-1',
    full_name: 'Maya Patel',
    email: 'maya@example.com',
    phone: '+1 (555) 908-2211',
    role: 'customer',
    favorite_barber_id: 'barber-sahil',
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  },
];

export const initialAppointments: AppointmentItem[] = [
  {
    id: 'appointment-001',
    user_id: 'customer-1',
    barber_id: 'barber-sahil',
    service_id: 'service-haircut',
    start_at: '2026-05-15T14:00:00Z',
    end_at: '2026-05-15T14:40:00Z',
    duration_minutes: 30,
    status: 'confirmed',
    is_emergency: false,
    created_at: '2026-05-13T12:00:00Z',
    updated_at: '2026-05-13T12:00:00Z',
  },
  {
    id: 'appointment-002',
    user_id: 'customer-1',
    barber_id: 'barber-sahil',
    service_id: 'service-beard',
    start_at: '2026-05-16T11:00:00Z',
    end_at: '2026-05-16T11:35:00Z',
    duration_minutes: 20,
    status: 'pending',
    is_emergency: false,
    created_at: '2026-05-13T12:15:00Z',
    updated_at: '2026-05-13T12:15:00Z',
  },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notification-1',
    user_id: 'customer-1',
    type: 'booking',
    message: 'Your upcoming appointment has been confirmed for 5/16 at 11:00 AM.',
    read: false,
    created_at: '2026-05-14T08:30:00Z',
  },
];
