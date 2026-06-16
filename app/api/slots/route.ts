import { NextRequest, NextResponse } from 'next/server';
import { generateAvailableSlots, getAvailableDates } from '@/lib/schedulingEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get('barberId');
    const date = searchParams.get('date');
    const serviceDuration = parseInt(searchParams.get('serviceDuration') || '30', 10);
    const type = searchParams.get('type'); // 'slots' or 'dates'

    if (!barberId) {
      return NextResponse.json(
        { error: 'barberId is required' },
        { status: 400 }
      );
    }

    if (type === 'dates') {
      const availableDates = await getAvailableDates(barberId, serviceDuration, 30);
      return NextResponse.json({ availableDates });
    }

    if (!date) {
      return NextResponse.json(
        { error: 'date is required' },
        { status: 400 }
      );
    }

    const slots = await generateAvailableSlots(barberId, date, serviceDuration);
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
