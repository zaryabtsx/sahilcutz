/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerClient, ensureAppointmentForPaidPayment } from '@/lib/volzix-server';

function getAdminTokenHeader(req: NextRequest) {
  return req.headers.get('x-admin-token');
}

export async function POST(request: NextRequest) {
  try {
    const adminToken = getAdminTokenHeader(request);
    if (adminToken !== 'admin_verified') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServerClient();

    // Find completed payments that do not yet have an appointment
    const { data: completedPayments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'completed');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: Array<{ paymentId: string; createdAppointmentId?: string | null; skipped?: boolean; error?: string }> = [];

    for (const p of (completedPayments ?? [])) {
      try {
        // ensureAppointmentForPaidPayment will return existing appointment or create one if booking data exists
        const appt = await ensureAppointmentForPaidPayment(supabase, p as any);
        if (appt && (appt as any).id) {
          // If appointment already existed but was not completed, and payment is completed, mark it completed
          try {
            const apptRow: any = appt;
            if (apptRow.status !== 'Completed') {
              await supabase.from('appointments').update({ status: 'Completed' }).eq('id', apptRow.id);
            }
          } catch (uErr: any) {
            // ignore update errors but report
            results.push({ paymentId: p.id, createdAppointmentId: (appt as any).id, error: `update_failed: ${uErr?.message ?? String(uErr)}` });
            continue;
          }
          results.push({ paymentId: p.id, createdAppointmentId: (appt as any).id });
        } else {
          results.push({ paymentId: p.id, skipped: true });
        }
      } catch (err: any) {
        results.push({ paymentId: p.id, error: err?.message ?? String(err) });
      }
    }

    return NextResponse.json({ processed: results.length, results }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
