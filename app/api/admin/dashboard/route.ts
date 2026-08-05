import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface DashboardUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Server misconfigured: missing Supabase service role key');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken !== 'admin_verified') {
      return NextResponse.json({ error: 'Unauthorized admin request' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    const [appointmentsResult, barbersResult, profilesResult, legacyUsersResult, slotsResult, servicesResult, authUsersResult, paymentsResult] = await Promise.all([
      supabaseAdmin.from('appointments').select('*').order('start_at', { ascending: false }),
      supabaseAdmin.from('barbers').select('*'),
      supabaseAdmin.from('profiles').select('id, full_name, email, phone, created_at'),
      supabaseAdmin.from('users').select('id, full_name, email, phone, created_at'),
      supabaseAdmin.from('slots').select('*').order('slot_date').order('start_time'),
      supabaseAdmin.from('services').select('*').order('name'),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from('payments').select('id, amount, status, payment_type, user_id, created_at, completed_at, payment_id').eq('status', 'completed'),
    ]);

    if (appointmentsResult.error) {
      return NextResponse.json({ error: appointmentsResult.error.message }, { status: 400 });
    }

    const mergedUsers = new Map<string, DashboardUser>();

    const addUser = (user: Partial<DashboardUser> & { id?: string }) => {
      if (!user?.id) return;
      const existing = mergedUsers.get(user.id);
      const nextUser: DashboardUser = {
        id: user.id,
        name: user.name || existing?.name || 'Unknown User',
        email: user.email ?? existing?.email ?? null,
        phone: user.phone ?? existing?.phone ?? null,
        created_at: user.created_at || existing?.created_at || new Date().toISOString(),
      };
      mergedUsers.set(user.id, nextUser);
    };

    for (const row of (profilesResult.data ?? []) as Array<{ id: string; full_name?: string | null; email?: string | null; phone?: string | null; created_at?: string | null }>) {
      addUser({
        id: row.id,
        name: row.full_name || 'Unknown User',
        email: row.email ?? null,
        phone: row.phone ?? null,
        created_at: row.created_at || new Date().toISOString(),
      });
    }

    for (const row of (legacyUsersResult.data ?? []) as Array<{ id: string; full_name?: string | null; email?: string | null; phone?: string | null; created_at?: string | null }>) {
      addUser({
        id: row.id,
        name: row.full_name || 'Unknown User',
        email: row.email ?? null,
        phone: row.phone ?? null,
        created_at: row.created_at || new Date().toISOString(),
      });
    }

    for (const authUser of authUsersResult.data?.users ?? []) {
      addUser({
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.fullName || authUser.user_metadata?.name || authUser.email || 'Unknown User',
        email: authUser.email ?? null,
        phone: authUser.user_metadata?.phone ?? null,
        created_at: authUser.created_at ?? new Date().toISOString(),
      });
    }

    const appointmentRows = (appointmentsResult.data ?? []) as Array<Record<string, unknown>>;
    const normalizedAppointments = appointmentRows.map((appt) => {
      const appointmentDate =
        typeof appt.appointment_date === 'string' ? appt.appointment_date :
        typeof appt.start_at === 'string' ? appt.start_at.slice(0, 10) :
        typeof appt.end_at === 'string' ? appt.end_at.slice(0, 10) :
        null;
      const appointmentTime =
        typeof appt.appointment_time === 'string' ? appt.appointment_time :
        typeof appt.start_at === 'string' ? appt.start_at.slice(11, 16) :
        typeof appt.end_at === 'string' ? appt.end_at.slice(11, 16) :
        null;
      return {
        ...appt,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
      };
    });

    return NextResponse.json({
      appointments: normalizedAppointments,
      payments: paymentsResult.data ?? [],
      barbers: barbersResult.data ?? [],
      users: Array.from(mergedUsers.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      slots: slotsResult.data ?? [],
      services: servicesResult.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
