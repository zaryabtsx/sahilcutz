#!/usr/bin/env node

/**
 * Database Setup Script
 * Initializes Supabase database with schema and seed data
 *
 * Usage:
 *   npx ts-node lib/setup-db.ts
 *   or
 *   node -r ts-node/register lib/setup-db.ts
 */

import { supabase } from '../lib/supabaseClient';
import { SAHIL_BARBER, SERVICES } from '../lib/seedDatabase';

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // 1. Create Barbers
    console.log('📝 Creating barbers...');
    const { error: barberError } = await supabase
      .from('barbers')
      .upsert([SAHIL_BARBER], { onConflict: 'id' });

    if (barberError) {
      console.error('❌ Error creating barbers:', barberError);
      throw barberError;
    }
    console.log('✅ Barbers created successfully\n');

    // 2. Create Services
    console.log('📝 Creating services...');
    const { error: servicesError } = await supabase
      .from('services')
      .upsert(SERVICES, { onConflict: 'id' });

    if (servicesError) {
      console.error('❌ Error creating services:', servicesError);
      throw servicesError;
    }
    console.log('✅ Services created successfully\n');

    // 3. Verify setup
    console.log('🔍 Verifying setup...');
    const { data: barbers, error: fetchBarbersError } = await supabase
      .from('barbers')
      .select('*');

    if (fetchBarbersError) {
      throw fetchBarbersError;
    }

    const { data: services, error: fetchServicesError } = await supabase
      .from('services')
      .select('*');

    if (fetchServicesError) {
      throw fetchServicesError;
    }

    console.log(`✅ Database setup complete!`);
    console.log(`   Barbers: ${barbers?.length || 0}`);
    console.log(`   Services: ${services?.length || 0}\n`);

    // 4. Display info
    console.log('📊 Database Summary:');
    console.log('─────────────────────────────────────');
    console.log('Barbers:');
    barbers?.forEach((b) => {
      console.log(`  • ${b.name} (${b.experience_years}+ years)`);
    });
    console.log('\nServices:');
    services?.forEach((s) => {
      console.log(`  • ${s.name} - $${s.price} (${s.duration_minutes} min)`);
    });
    console.log('─────────────────────────────────────\n');

    console.log('🎉 Ready to go! Your barber SaaS is initialized.\n');
    console.log('Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Visit: http://localhost:3000');
    console.log('3. Login with: admin@sahilcutzz.com / admin123\n');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
