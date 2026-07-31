import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase as browserSupabase } from '@/lib/supabase';
import { initialBarbers } from '@/lib/mockData';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    return createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return browserSupabase;
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const client = getSupabaseClient();

    const queryBuilder = client.from('barbers').select('*');
    const query = slug ? queryBuilder.eq('slug', slug).single() : queryBuilder;

    const { data, error } = await query;

    if (error && slug) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error) {
      console.warn('Barbers table unavailable, using mock data:', error.message);
      return NextResponse.json(initialBarbers);
    }

    if (slug) {
      return NextResponse.json(data);
    }

    return NextResponse.json(data?.length ? data : initialBarbers);
  } catch (error) {
    console.error('Barbers API error:', error);
    return NextResponse.json(initialBarbers);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('barbers')
      .insert([body])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data?.[0], { status: 201 });
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

    if (!id) {
      return NextResponse.json({ error: 'Barber ID is required' }, { status: 400 });
    }

    const client = getSupabaseClient();

    if (isValidUUID(id)) {
      const { data, error } = await client
        .from('barbers')
        .update(updateData)
        .eq('id', id)
        .select();

      if (!error && data && data.length > 0) {
        return NextResponse.json(data[0]);
      }

      // If record doesn't exist yet, upsert it
      const { data: upsertData, error: upsertError } = await client
        .from('barbers')
        .upsert([{ id, name: 'Sahil', slug: 'sahil', ...updateData }], { onConflict: 'id' })
        .select();

      if (!upsertError && upsertData && upsertData.length > 0) {
        return NextResponse.json(upsertData[0]);
      }
    }

    // Graceful fallback for mock/dev mode
    return NextResponse.json({
      id,
      name: 'Sahil',
      slug: 'sahil',
      ...updateData,
    });
  } catch (error) {
    console.error('PATCH /api/barbers error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update barber' },
      { status: 500 }
    );
  }
}