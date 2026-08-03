import { createClient } from '@supabase/supabase-js';
import { sendMail } from '@/lib/mailer';
import {
  adminBookingNotificationHtml,
  bookingConfirmationHtml,
} from '@/lib/emailTemplates';

export type ServerClient = ReturnType<typeof getServerClient>;

export interface PaymentRow {
  id: string;
  user_id: string;
  order_id: string;
  provider: string | null;
  payment_id: string | null;
  transaction_id: string | null;
  flow_id: string | null;
  web_id: string | null;
  amount: number | string;
  currency: string;
  status: string;
  service_id: string | null;
  barber_id: string | null;
  booking_date: string | null;
  booking_time: string | null;
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

interface CustomerRow {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface ServiceRow {
  id: string;
  name: string | null;
  price: number | string | null;
  duration_minutes: number | null;
}

interface BarberRow {
  id: string;
  name: string | null;
}

export function getServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

export async function maybeSingle<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await promise;
  if (error) {
    console.warn('Unable to load Volzix booking detail:', error.message);
    return null;
  }
  return data;
}

export async function loadPayment(supabase: ServerClient, {
  paymentId,
  orderId,
  webId,
  flowId,
}: {
  paymentId?: string | null;
  orderId?: string | null;
  webId?: string | null;
  flowId?: string | null;
}) {
  const lookups: Array<[string, string]> = [];
  if (orderId) lookups.push(['order_id', orderId]);
  if (webId) lookups.push(['web_id', webId]);
  if (flowId) lookups.push(['flow_id', flowId]);
  if (isUuid(paymentId)) lookups.push(['id', paymentId]);
  if (paymentId) lookups.push(['payment_id', paymentId]);

  for (const [column, value] of lookups) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq(column, value)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as PaymentRow;
  }

  return null;
}

async function sendBookingEmails({
  appointment,
  payment,
  service,
  barber,
  customer,
}: {
  appointment: AppointmentRow;
  payment: PaymentRow;
  service: ServiceRow | null;
  barber: BarberRow | null;
  customer: CustomerRow | null;
}) {
  const customerEmail = customer?.email;
  if (!customerEmail) {
    console.warn(`Volzix booking email skipped for appointment ${appointment.id}: missing customer email`);
    return;
  }

  const details = {
    customerName: customer?.full_name || customerEmail,
    customerEmail,
    serviceName: service?.name || 'Barber service',
    barberName: barber?.name || 'Sahil Cutz barber',
    startAt: appointment.start_at,
    amountPaid: payment.amount,
  };

  await Promise.all([
    sendMail({
      to: details.customerEmail,
      subject: 'Your Sahil Cutz booking is confirmed',
      html: bookingConfirmationHtml(details),
    }),
    sendMail({
      to: process.env.ADMIN_EMAIL || 'admin@sahilcutz.com',
      subject: 'New Sahil Cutz booking received',
      html: adminBookingNotificationHtml(details),
    }),
  ]);
}

export async function ensureAppointmentForPaidPayment(supabase: ServerClient, payment: PaymentRow) {
  const existing = await maybeSingle<AppointmentRow>(
    supabase
      .from('appointments')
      .select('*')
      .eq('payment_id', payment.id)
      .maybeSingle(),
  );

  if (existing) return existing;

  if (!payment.service_id || !payment.barber_id || !payment.booking_date || !payment.booking_time) {
    console.warn(`Volzix payment ${payment.id} completed but does not have enough booking data to create appointment`);
    return null;
  }

  const [profile, service, barber] = await Promise.all([
    maybeSingle<CustomerRow>(
      supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', payment.user_id)
        .maybeSingle(),
    ),
    maybeSingle<ServiceRow>(
      supabase
        .from('services')
        .select('id, name, price, duration_minutes')
        .eq('id', payment.service_id)
        .maybeSingle(),
    ),
    maybeSingle<BarberRow>(
      supabase
        .from('barbers')
        .select('id, name')
        .eq('id', payment.barber_id)
        .maybeSingle(),
    ),
  ]);

  const duration = Number(service?.duration_minutes || 30);
  const startAt = new Date(`${payment.booking_date}T${payment.booking_time}:00`);
  const endAt = new Date(startAt.getTime() + duration * 60 * 1000);

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      user_id: payment.user_id,
      barber_id: payment.barber_id,
      service_id: payment.service_id,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      duration_minutes: duration,
      status: 'Upcoming',
      is_emergency: false,
      payment_id: payment.id,
    })
    .select()
    .single();

  if (error || !appointment) {
    console.error('Volzix paid booking appointment creation failed:', error);
    return null;
  }

  await supabase.from('notifications').insert({
    user_id: payment.user_id,
    type: 'booking',
    message: `Your appointment has been confirmed for ${startAt.toLocaleString()}`,
    related_appointment_id: appointment.id,
    read: false,
  });

  await sendBookingEmails({
    appointment: appointment as AppointmentRow,
    payment,
    service,
    barber,
    customer: profile,
  });

  return appointment as AppointmentRow;
}
