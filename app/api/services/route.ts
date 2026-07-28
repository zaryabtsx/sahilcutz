import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { initialServices } from '@/lib/mockData';

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
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active');

    const queryBuilder = supabase.from('services').select('*');
    const query = isActive === 'true' ? queryBuilder.eq('is_active', true) : queryBuilder;

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      // ← fallback to mock data if table doesn't exist or query fails
      console.warn('Services table unavailable, using mock data:', error.message);
      return NextResponse.json(initialServices);
    }

    return NextResponse.json(data?.length ? data : initialServices);
  } catch (error) {
    console.error('Services API error:', error);
    return NextResponse.json(initialServices); // ← always return something
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('services')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
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
    const serviceId = body?.id;

    if (!serviceId) {
      return NextResponse.json({ error: 'Service id is required' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('services')
      .update(body)
      .eq('id', serviceId)
      .select()
      .single();

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

export async function DELETE(request: NextRequest) {
  try {
    const serviceId = request.nextUrl.searchParams.get('id');

    if (!serviceId) {
      return NextResponse.json({ error: 'Service id is required' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient.from('services').delete().eq('id', serviceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}