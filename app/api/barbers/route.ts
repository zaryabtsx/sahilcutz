import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { initialBarbers } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const queryBuilder = supabase.from('barbers').select('*');
    const query = slug ? queryBuilder.eq('slug', slug).single() : queryBuilder;

    const { data, error } = await query;

    if (error && slug) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error) {
      // ← fallback to mock data if table doesn't exist or query fails
      console.warn('Barbers table unavailable, using mock data:', error.message);
      return NextResponse.json(initialBarbers);
    }

    if (slug) {
      return NextResponse.json(data);
    }

    return NextResponse.json(data?.length ? data : initialBarbers);
  } catch (error) {
    console.error('Barbers API error:', error);
    return NextResponse.json(initialBarbers); // ← always return something
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
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

    const { data, error } = await supabase
      .from('barbers')
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