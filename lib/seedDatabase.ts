import { supabase } from './supabase';
import type { UserProfile, BarberProfile, ServiceItem } from './types';

const SAHIL_BARBER: BarberProfile = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Sahil',
  slug: 'sahil',
  image_url:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
  experience_years: 10,
  bio: 'Master barber with 10 years of experience in luxury grooming',
  working_hours: {
    start: '09:00',
    end: '19:00',
    breaks: [{ start: '13:00', end: '14:00' }],
    off_days: ['Sunday'],
  },
  is_available: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SERVICES: ServiceItem[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Classic Haircut',
    description: 'Precision cutting tailored to your style and face shape',
    price: 45,
    duration_minutes: 30,
    category: 'Hair',
    image_url:
      'https://images.unsplash.com/photo-1759134198561-e2041049419c?w=500&h=500&fit=crop',
    is_active: true,
    buffer_minutes: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Beard Trim',
    description: 'Professional beard shaping and grooming with premium oils',
    price: 25,
    duration_minutes: 20,
    category: 'Beard',
    image_url:
      'https://images.unsplash.com/photo-1657105052497-f996284ffff8?w=500&h=500&fit=crop',
    is_active: true,
    buffer_minutes: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Hair + Beard Combo',
    description: 'Complete grooming package for the modern gentleman',
    price: 65,
    duration_minutes: 45,
    category: 'Combo',
    image_url:
      'https://images.unsplash.com/photo-1553521041-d168abd31de3?w=500&h=500&fit=crop',
    is_active: true,
    buffer_minutes: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Hot Towel Shave',
    description: 'Traditional straight razor shave with hot towel treatment',
    price: 55,
    duration_minutes: 40,
    category: 'Shave',
    image_url:
      'https://images.unsplash.com/photo-1596362601603-b74f6ef166e4?w=500&h=500&fit=crop',
    is_active: true,
    buffer_minutes: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Hair Coloring',
    description: 'Expert color treatment and highlights with premium products',
    price: 85,
    duration_minutes: 90,
    category: 'Color',
    image_url:
      'https://images.unsplash.com/photo-1590540178973-02381b349071?w=500&h=500&fit=crop',
    is_active: true,
    buffer_minutes: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function seedDatabase() {
  try {
    // Seed Barbers
    console.log('Seeding barbers...');
    const { error: barberError } = await supabase
      .from('barbers')
      .insert([SAHIL_BARBER])
      .select();

    if (barberError && !barberError.message.includes('duplicate')) {
      console.error('Error seeding barbers:', barberError);
    } else {
      console.log('✓ Barbers seeded');
    }

    // Seed Services
    console.log('Seeding services...');
    const { error: servicesError } = await supabase
      .from('services')
      .insert(SERVICES)
      .select();

    if (servicesError && !servicesError.message.includes('duplicate')) {
      console.error('Error seeding services:', servicesError);
    } else {
      console.log('✓ Services seeded');
    }

    console.log('✓ Database seeding completed');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}

// Export seed data
export { SAHIL_BARBER, SERVICES };
