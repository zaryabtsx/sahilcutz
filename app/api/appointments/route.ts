/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { insertEmergencyAppointment } from '@/lib/schedulingEngine';
import { sendMail } from '@/lib/mailer';
import {
  adminBookingNotificationHtml,
  bookingConfirmationHtml,
} from '@/lib/emailTemplates';
import { getAdvancePaymentAmount, isVolzixCompleted } from '@/lib/volzix';
import type { AppointmentItem } from '@/lib/types';

type ServerClient = ReturnType<typeof getServerClient>;
type DbError = { message: string };

interface CustomerRow {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface ServiceRow {
  id: string;
  name: string | null;
  price: number | string | null;
}

interface BarberRow {
  id: string;
  name: string | null;
}

interface AppointmentRow {
  id: string;
  user_id: string;
  barber_id: string;
  service_id: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  status: string;
}

interface BookingEmailDetails {
  customerEmail?: string;
  customerName?: string;
  serviceName?: string;
  barberName?: string;
  amountPaid?: number | string;
}

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
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function shouldSendBookingEmail(status: unknown) {
  const normalized = String(status || '').toLowerCase();
  return normalized !== 'pending' && normalized !== 'cancelled' && normalized !== 'canceled';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function normalizeEmailDetails(value: unknown): BookingEmailDetails | undefined {
  if (!isRecord(value)) return undefined;

  return {
    customerEmail: stringValue(value.customerEmail),
    customerName: stringValue(value.customerName),
    serviceName: stringValue(value.serviceName),
    barberName: stringValue(value.barberName),
    amountPaid:
      typeof value.amountPaid === 'number' || typeof value.amountPaid === 'string'
        ? value.amountPaid
        : undefined,
  };
}

async function maybeSingle<T>(promise: PromiseLike<{ data: T | null; error: DbError | null }>) {
  const { data, error } = await promise;
  if (error) {
    console.warn('Unable to load email detail:', error.message);
    return null;
  }
  return data;
}

async function sendBookingEmails({
  supabase,
  appointment,
  emailDetails,
}: {
  supabase: ServerClient;
  appointment: AppointmentRow;
  emailDetails?: BookingEmailDetails;
}) {
  try {
    const [profile, user, service, barber] = await Promise.all([
      isUuid(appointment.user_id)
        ? maybeSingle<CustomerRow>(
            supabase
              .from('profiles')
              .select('id, email, full_name')
              .eq('id', appointment.user_id)
              .maybeSingle(),
          )
        : Promise.resolve(null),
      isUuid(appointment.user_id)
        ? maybeSingle<CustomerRow>(
            supabase
              .from('users')
              .select('id, email, full_name')
              .eq('id', appointment.user_id)
              .maybeSingle(),
          )
        : Promise.resolve(null),
      isUuid(appointment.service_id)
        ? maybeSingle<ServiceRow>(
            supabase
              .from('services')
              .select('id, name, price')
              .eq('id', appointment.service_id)
              .maybeSingle(),
          )
        : Promise.resolve(null),
      isUuid(appointment.barber_id)
        ? maybeSingle<BarberRow>(
            supabase
              .from('barbers')
              .select('id, name')
              .eq('id', appointment.barber_id)
              .maybeSingle(),
          )
        : Promise.resolve(null),
    ]);

    const customer = profile || user;
    const customerEmail = emailDetails?.customerEmail || customer?.email;

    const details = {
      customerName:
        emailDetails?.customerName ||
        customer?.full_name ||
        customerEmail ||
        'Valued customer',
      customerEmail,
      serviceName:
        emailDetails?.serviceName ||
        service?.name ||
        'Barber service',
      barberName:
        emailDetails?.barberName ||
        barber?.name ||
        'Sahil Cutz barber',
      startAt: appointment.start_at,
      amountPaid:
        typeof emailDetails?.amountPaid !== 'undefined'
          ? emailDetails.amountPaid
          : service?.price || 0,
    };

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sahilcutzz.com';
    const emailPromises = [];

    if (customerEmail && shouldSendBookingEmail(appointment.status)) {
      emailPromises.push(
        sendMail({
          to: details.customerEmail,
          subject: 'Your Sahil Cutz booking is confirmed',
          html: bookingConfirmationHtml(details),
        }),
      );
    }

    emailPromises.push(
      sendMail({
        to: adminEmail,
        subject: 'New Sahil Cutz booking received',
        html: adminBookingNotificationHtml(details),
      }),
    );

    await Promise.all(emailPromises);
  } catch (error) {
    console.error('Booking email trigger failed:', error instanceof Error ? error.message : error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServerClient();
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get('barberId');
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let queryBuilder = supabase.from('appointments').select('*');

    if (barberId) {
      queryBuilder = queryBuilder.eq('barber_id', barberId);
    }
    if (userId) {
      queryBuilder = queryBuilder.eq('user_id', userId);
    }
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      queryBuilder = queryBuilder
        .gte('start_at', startOfDay.toISOString())
        .lte('end_at', endOfDay.toISOString());
    }

    const { data, error } = await queryBuilder.order('start_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerClient();
    const body = await request.json();
    const isEmergency = body.is_emergency;
    const { email_details: rawEmailDetails, ...appointmentPayload } = body;
    const emailDetails = normalizeEmailDetails(rawEmailDetails);

    // Basic validation to provide clearer errors before attempting DB insert
    const requiredFields = [
      'user_id', 'service_id', 'start_at', 'end_at', 'duration_minutes', 'barber_id', 'status'
    ];

    for (const field of requiredFields) {
      if (typeof (appointmentPayload as any)[field] === 'undefined' || (appointmentPayload as any)[field] === null || appointmentPayload[field] === '') {
        return NextResponse.json({ error: `Invalid request: missing required field '${field}'` }, { status: 400 });
      }
    }

    // Validate ISO timestamps
    try {
      new Date(String(appointmentPayload.start_at));
      new Date(String(appointmentPayload.end_at));
    } catch {
      return NextResponse.json({ error: 'Invalid request: start_at or end_at is not a valid date' }, { status: 400 });
    }

    // Check if payment is required (non-emergency bookings)
    if (!isEmergency) {
      const paymentId = appointmentPayload.payment_id;

      if (!paymentId) {
        return NextResponse.json(
          { error: 'Payment required: Please complete the advance payment to confirm your booking.' },
          { status: 400 }
        );
      }

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('id, status, user_id, amount')
        .eq('id', paymentId)
        .single();

      if (paymentError || !paymentData) {
        return NextResponse.json(
          { error: 'Payment not found. Please try booking again.' },
          { status: 400 }
        );
      }

      if (paymentData.user_id !== appointmentPayload.user_id) {
        return NextResponse.json(
          { error: 'Payment verification failed. This payment does not belong to your account.' },
          { status: 403 }
        );
      }

      if (!isVolzixCompleted(paymentData.status)) {
        return NextResponse.json(
          { error: `Payment not completed. Current status: ${paymentData.status}. Please complete the payment first.` },
          { status: 400 }
        );
      }

      const serviceQuery = await supabase
        .from('services')
        .select('price')
        .eq('id', appointmentPayload.service_id)
        .single();

      const servicePrice = serviceQuery.data?.price ?? 0;
      const requiredAdvance = getAdvancePaymentAmount(servicePrice);
      if (Number(paymentData.amount) < requiredAdvance) {
        return NextResponse.json(
          {
            error: `Payment amount is insufficient. Minimum advance payment is Rs. ${requiredAdvance.toLocaleString()}.`,
          },
          { status: 400 }
        );
      }
    }

    if (isEmergency) {
      const emergencyAppointment: Omit<AppointmentItem, 'id' | 'created_at' | 'updated_at'> = {
        user_id: appointmentPayload.user_id,
        barber_id: appointmentPayload.barber_id,
        service_id: appointmentPayload.service_id,
        start_at: appointmentPayload.start_at,
        end_at: appointmentPayload.end_at,
        duration_minutes: appointmentPayload.duration_minutes,
        status: 'emergency',
        is_emergency: true,
        notes: appointmentPayload.notes || null,
      };

      const result = await insertEmergencyAppointment(emergencyAppointment);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, shiftedAppointments: result.shiftedAppointments });
    }

    // Prevent double-booking: ensure no overlapping appointment exists for the same barber
    const requestedStart = new Date(String(appointmentPayload.start_at)).toISOString();
    const requestedEnd = new Date(String(appointmentPayload.end_at)).toISOString();

    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id,status,start_at,end_at')
      .eq('barber_id', appointmentPayload.barber_id)
      .neq('status', 'cancelled')
      .lt('start_at', requestedEnd)
      .gt('end_at', requestedStart);

    if (conflictError) {
      console.warn('Could not check appointment conflicts:', conflictError.message);
    } else if (Array.isArray(conflicts) && conflicts.length > 0) {
      return NextResponse.json({ error: 'Selected time slot is no longer available' }, { status: 409 });
    }

    // Remove fields not present on the appointments table (avoid schema cache errors)
    if ('payment_method' in appointmentPayload) {
      delete (appointmentPayload as any).payment_method;
    }

    const payloadWithDate = { ...appointmentPayload };
    if (!payloadWithDate.appointment_date && payloadWithDate.start_at) {
      payloadWithDate.appointment_date = String(payloadWithDate.start_at).slice(0, 10);
    }
    if (!payloadWithDate.appointment_time && payloadWithDate.start_at) {
      payloadWithDate.appointment_time = String(payloadWithDate.start_at).slice(11, 16);
    }
    if (!payloadWithDate.appointment_date && payloadWithDate.end_at) {
      payloadWithDate.appointment_date = String(payloadWithDate.end_at).slice(0, 10);
    }
    if (!payloadWithDate.appointment_time && payloadWithDate.end_at) {
      payloadWithDate.appointment_time = String(payloadWithDate.end_at).slice(11, 16);
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([payloadWithDate])
      .select()
      .single();

    if (error) {
      console.error('Appointment insert failed', { error: error.message, appointmentPayload });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const bankPayment = typeof body.payment_method === 'string' && body.payment_method === 'bank_transfer' && data?.payment_id
      ? await supabase
          .from('payments')
          .select('id, order_id, amount, currency, status, provider, payment_type')
          .eq('id', data.payment_id)
          .maybeSingle()
          .then((result) => (result.error ? null : result.data))
      : null;

    await supabase.from('notifications').insert([
      {
        user_id: appointmentPayload.user_id,
        type: 'booking',
        message: appointmentPayload.status === 'pending'
          ? `Your appointment is pending confirmation. We will update you once the advance payment is received.`
          : `Your appointment has been confirmed for ${new Date(appointmentPayload.start_at).toLocaleString()}`,
        related_appointment_id: data.id,
        read: false,
      },
    ]);

    if (shouldSendBookingEmail(appointmentPayload.status)) {
      await sendBookingEmails({ supabase, appointment: data as AppointmentRow, emailDetails });
    }

    return NextResponse.json({ appointment: data, bankPayment }, { status: 201 });
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
      { status: 500 },
    );
  }
}
