import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '@/lib/mailer';
import { reminderEmailHtml } from '@/lib/emailTemplates';

export const dynamic = 'force-dynamic';

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

function getRequestSecret(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : '';

  return (
    request.headers.get('x-cron-secret') ||
    bearer ||
    request.nextUrl.searchParams.get('secret')
  );
}

function isActiveAppointment(status) {
  return !['cancelled', 'canceled', 'completed', 'no_show'].includes(String(status || '').toLowerCase());
}

function validIds(rows, key) {
  return Array.from(new Set(rows.map((row) => row[key]).filter(Boolean)));
}

export async function GET(request) {
  try {
    const configuredSecret = process.env.CRON_SECRET;
    if (!configuredSecret) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
    }

    if (getRequestSecret(request) !== configuredSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServerClient();
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, user_id, barber_id, service_id, start_at, end_at, status, reminder_sent')
      .gte('start_at', now.toISOString())
      .lte('start_at', next24Hours.toISOString())
      .or('reminder_sent.is.false,reminder_sent.is.null')
      .order('start_at', { ascending: true });

    if (appointmentsError) {
      return NextResponse.json({ error: appointmentsError.message }, { status: 400 });
    }

    const activeAppointments = (appointments || []).filter((appointment) =>
      isActiveAppointment(appointment.status),
    );

    if (!activeAppointments.length) {
      return NextResponse.json({ checked: 0, sent: 0, failed: 0 });
    }

    const userIds = validIds(activeAppointments, 'user_id');
    const serviceIds = validIds(activeAppointments, 'service_id');
    const barberIds = validIds(activeAppointments, 'barber_id');

    const [profilesRes, usersRes, servicesRes, barbersRes] = await Promise.all([
      userIds.length
        ? supabase.from('profiles').select('id, email, full_name').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? supabase.from('users').select('id, email, full_name').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      serviceIds.length
        ? supabase.from('services').select('id, name, price').in('id', serviceIds)
        : Promise.resolve({ data: [], error: null }),
      barberIds.length
        ? supabase.from('barbers').select('id, name').in('id', barberIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    for (const response of [profilesRes, usersRes, servicesRes, barbersRes]) {
      if (response.error) {
        return NextResponse.json({ error: response.error.message }, { status: 400 });
      }
    }

    const profilesById = new Map((profilesRes.data || []).map((row) => [row.id, row]));
    const usersById = new Map((usersRes.data || []).map((row) => [row.id, row]));
    const servicesById = new Map((servicesRes.data || []).map((row) => [row.id, row]));
    const barbersById = new Map((barbersRes.data || []).map((row) => [row.id, row]));

    let sent = 0;
    let failed = 0;

    for (const appointment of activeAppointments) {
      const customer = profilesById.get(appointment.user_id) || usersById.get(appointment.user_id);
      const service = servicesById.get(appointment.service_id);
      const barber = barbersById.get(appointment.barber_id);

      if (!customer?.email) {
        failed += 1;
        console.error(`Reminder skipped for appointment ${appointment.id}: missing customer email`);
        continue;
      }

      const result = await sendMail({
        to: customer.email,
        subject: 'Your Sahil Cutz appointment is tomorrow',
        html: reminderEmailHtml({
          serviceName: service?.name || 'Barber service',
          barberName: barber?.name || 'Sahil Cutz barber',
          startAt: appointment.start_at,
        }),
      });

      if (!result.success) {
        failed += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('id', appointment.id);

      if (updateError) {
        failed += 1;
        console.error(`Reminder sent but not marked for appointment ${appointment.id}: ${updateError.message}`);
        continue;
      }

      sent += 1;
    }

    return NextResponse.json({
      checked: activeAppointments.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error('Reminder route failed:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  return GET(request);
}
