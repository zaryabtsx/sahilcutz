import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Server misconfigured: missing Supabase configuration');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = getServerClient();

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('start_at', { ascending: false })
      .limit(50);

    if (appointmentsError) {
      return NextResponse.json({ error: appointmentsError.message }, { status: 400 });
    }

    const serviceIds = Array.from(new Set((appointments ?? []).map((appt) => appt.service_id).filter(isUuid)));
    const barberIds = Array.from(new Set((appointments ?? []).map((appt) => appt.barber_id).filter(isUuid)));

    const [servicesRes, barbersRes] = await Promise.all([
      serviceIds.length
        ? supabase.from('services').select('id, name, price').in('id', serviceIds)
        : Promise.resolve({ data: [], error: null }),
      barberIds.length
        ? supabase.from('barbers').select('id, name').in('id', barberIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (servicesRes.error) {
      return NextResponse.json({ error: servicesRes.error.message }, { status: 400 });
    }
    if (barbersRes.error) {
      return NextResponse.json({ error: barbersRes.error.message }, { status: 400 });
    }

    const servicesById = new Map((servicesRes.data ?? []).map((service) => [service.id, service]));
    const barbersById = new Map((barbersRes.data ?? []).map((barber) => [barber.id, barber]));

    const rows = (appointments ?? []).map((appointment) => ({
      ...appointment,
      services: appointment.service_id ? servicesById.get(appointment.service_id) ?? null : null,
      barbers: appointment.barber_id ? barbersById.get(appointment.barber_id) ?? null : null,
    }));

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
