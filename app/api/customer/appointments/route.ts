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
        ? supabase.from('barbers').select('id, name, working_hours').in('id', barberIds)
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

    const rows = (appointments ?? []).map((appointment) => {
      const startAtDate = typeof appointment.start_at === 'string' ? new Date(appointment.start_at) : null;
      const appointmentDate = appointment.appointment_date || (startAtDate instanceof Date && !Number.isNaN(startAtDate.getTime())
        ? `${startAtDate.getUTCFullYear()}-${String(startAtDate.getUTCMonth() + 1).padStart(2, '0')}-${String(startAtDate.getUTCDate()).padStart(2, '0')}`
        : null);
      const appointmentTime = appointment.appointment_time || (startAtDate instanceof Date && !Number.isNaN(startAtDate.getTime())
        ? `${String(startAtDate.getUTCHours()).padStart(2, '0')}:${String(startAtDate.getUTCMinutes()).padStart(2, '0')}`
        : null);
      return {
        ...appointment,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        services: appointment.service_id ? servicesById.get(appointment.service_id) ?? null : null,
        barbers: appointment.barber_id ? barbersById.get(appointment.barber_id) ?? null : null,
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getServerClient();
    const body = await request.json();
    const action = typeof body?.action === 'string' ? body.action : '';
    const appointmentId = typeof body?.appointmentId === 'string' ? body.appointmentId : body?.id;
    const userId = typeof body?.userId === 'string' ? body.userId : undefined;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointment id' }, { status: 400 });
    }

    const { data: existingAppointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (userId && existingAppointment.user_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (action === 'cancel') {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'Cancelled' })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await supabase.from('notifications').insert([
        {
          user_id: existingAppointment.user_id,
          type: 'booking',
          message: 'Your appointment has been cancelled.',
          related_appointment_id: appointmentId,
          read: false,
        },
      ]);

      return NextResponse.json(data);
    }

    if (action === 'reschedule') {
      const startAt = typeof body?.start_at === 'string' ? body.start_at : undefined;
      const endAt = typeof body?.end_at === 'string' ? body.end_at : undefined;
      const durationMinutes = body?.duration_minutes;

      if (!startAt || !endAt) {
        return NextResponse.json({ error: 'Missing new appointment time' }, { status: 400 });
      }

      const requestedStart = new Date(startAt);
      const requestedEnd = new Date(endAt);

      if (Number.isNaN(requestedStart.getTime()) || Number.isNaN(requestedEnd.getTime())) {
        return NextResponse.json({ error: 'Invalid appointment time' }, { status: 400 });
      }

      const appointmentDate = typeof body?.appointment_date === 'string' && body.appointment_date
        ? body.appointment_date
        : `${requestedStart.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })}`;
      const originalDate = existingAppointment.appointment_date ||
        new Date(existingAppointment.start_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
      const todayInPakistan = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

      if (appointmentDate <= todayInPakistan || appointmentDate === originalDate) {
        return NextResponse.json({ error: 'Please choose a future date different from the current appointment date.' }, { status: 400 });
      }

      if (requestedEnd <= requestedStart || requestedStart <= new Date()) {
        return NextResponse.json({ error: 'Please choose a future appointment time.' }, { status: 400 });
      }

      const { data: conflictingAppointments, error: conflictError } = await supabase
        .from('appointments')
        .select('id')
        .eq('barber_id', existingAppointment.barber_id)
        .neq('id', appointmentId)
        .not('status', 'in', '(cancelled,Cancelled,canceled,Canceled,completed,Completed,rescheduled,Rescheduled)')
        .lt('start_at', requestedEnd.toISOString())
        .gt('end_at', requestedStart.toISOString());

      if (conflictError) {
        return NextResponse.json({ error: conflictError.message }, { status: 400 });
      }

      if ((conflictingAppointments ?? []).length > 0) {
        return NextResponse.json({ error: 'That time is no longer available. Please choose another slot.' }, { status: 409 });
      }

      const appointmentTime = typeof body?.appointment_time === 'string' && body.appointment_time
        ? body.appointment_time
        : `${String(requestedStart.getUTCHours()).padStart(2, '0')}:${String(requestedStart.getUTCMinutes()).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: existingAppointment.user_id,
          barber_id: existingAppointment.barber_id,
          service_id: existingAppointment.service_id,
          start_at: requestedStart.toISOString(),
          end_at: requestedEnd.toISOString(),
          duration_minutes: Number(durationMinutes || existingAppointment.duration_minutes || 0),
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: 'Booked',
          is_emergency: existingAppointment.is_emergency || false,
          payment_id: existingAppointment.payment_id || null,
          notes: existingAppointment.notes || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const { error: historyError } = await supabase
        .from('appointments')
        .update({
          status: 'Rescheduled',
        })
        .eq('id', appointmentId)
        .eq('user_id', existingAppointment.user_id);

      if (historyError) {
        await supabase.from('appointments').delete().eq('id', data.id);
        return NextResponse.json({ error: historyError.message }, { status: 400 });
      }

      await supabase.from('notifications').insert([
        {
          user_id: existingAppointment.user_id,
          type: 'reschedule',
          message: `Your appointment has been rescheduled to ${requestedStart.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}.`,
          related_appointment_id: data.id,
          read: false,
        },
      ]);

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
