import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { initialServices } from '@/lib/mockData';

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
    const { data, error } = await supabase
      .from('services')
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