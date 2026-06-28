import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken !== 'admin_verified') {
      return NextResponse.json({ error: 'Unauthorized admin request' }, { status: 401 });
    }

    const body = await request.json();
    const appointment = body.appointment;
    const overrideIds = Array.isArray(body.overrideIds) ? body.overrideIds : [];

    if (!appointment) {
      return NextResponse.json({ error: 'Missing appointment payload' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert(appointment)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (overrideIds.length) {
      const { error: overrideError } = await supabaseAdmin
        .from('appointments')
        .update({ status: 'Cancelled' })
        .in('id', overrideIds);

      if (overrideError) {
        return NextResponse.json({ error: overrideError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ appointment: data, overrideIds }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
