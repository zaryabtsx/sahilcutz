import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { insertEmergencyAppointment, generateAvailableSlots } from '@/lib/schedulingEngine';
import type { AppointmentItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get('barberId');
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let queryBuilder = supabase.from('appointments').select('*');

    if (barberId) {
      queryBuilder = queryBuilder.eq('barber_id', barberId) as any;
    }
    if (userId) {
      queryBuilder = queryBuilder.eq('user_id', userId) as any;
    }
    if (status) {
      queryBuilder = queryBuilder.eq('status', status) as any;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      queryBuilder = queryBuilder
        .gte('start_at', startOfDay.toISOString())
        .lte('end_at', endOfDay.toISOString()) as any;
    }

    const { data, error } = await queryBuilder.order('start_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const isEmergency = body.is_emergency;

    if (isEmergency) {
      // Use emergency override system
      const result = await insertEmergencyAppointment({
        user_id: body.user_id,
        barber_id: body.barber_id,
        service_id: body.service_id,
        start_at: body.start_at,
        end_at: body.end_at,
        duration_minutes: body.duration_minutes,
        status: 'emergency',
        is_emergency: true,
        notes: body.notes || null,
      } as any);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, shiftedAppointments: result.shiftedAppointments });
    } else {
      // Regular appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert([body])
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Create notification
      if (data?.[0]) {
        await supabase.from('notifications').insert([
          {
            user_id: body.user_id,
            type: 'booking',
            message: `Your appointment has been confirmed for ${new Date(body.start_at).toLocaleString()}`,
            related_appointment_id: data[0].id,
            read: false,
          },
        ]);
      }

      return NextResponse.json(data?.[0], { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data?.[0]);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
