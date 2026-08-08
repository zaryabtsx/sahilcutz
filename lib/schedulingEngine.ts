/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { isLastTwoDaysOfMonth } from './scheduling';
import type { AppointmentItem, BarberProfile, ServiceItem } from './types';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Server misconfigured: missing Supabase service role key');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type AppointmentRow = AppointmentItem & {
  appointment_date?: string | null;
  appointment_time?: string | null;
};

interface TimeSlot {
  start: string;      // Full ISO string (e.g. 2026-05-17T09:00:00.000Z)
  end: string;        // Full ISO string
  available: boolean;
}

interface AvailabilityResult {
  date: string;
  slots: TimeSlot[];
}

/**
 * Generate available time slots for a given date and barber
 * Now returns FULL ISO strings with correct local timezone handling (Asia/Karachi UTC+5)
 */
export async function generateAvailableSlots(
  barberId: string,
  date: string,                    // YYYY-MM-DD
  serviceDurationMinutes: number,
  bufferMinutes: number = 0
): Promise<TimeSlot[]> {
  const barberProfile = await getBarberProfile(barberId);
  if (!barberProfile || !barberProfile.working_hours) {
    return [];
  }

  const workingHours = barberProfile.working_hours;
  if (!workingHours.start || !workingHours.end) {
    return [];
  }

  // Parse the date in Pakistan Standard Time (+05:00)
  const pktDateObj = new Date(`${date}T00:00:00+05:00`);

  // Get day of week for off days in PKT
  const dayOfWeekShort = pktDateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Karachi' });
  const dayOfWeekLong = pktDateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Karachi' });
  const isOffDay = workingHours.off_days?.some(
    (d: string) => d.toLowerCase() === dayOfWeekShort.toLowerCase() || d.toLowerCase() === dayOfWeekLong.toLowerCase()
  );
  const isUnavailableDate = workingHours.unavailable_dates?.includes(date);
  const manualWindows = await getManualAvailabilityWindows(barberId, date);
  const isClosedByDefault = !manualWindows.length && isLastTwoDaysOfMonth(date);

  if (isOffDay || isUnavailableDate || isClosedByDefault) {
    return [];
  }

  // Get existing appointments for this date
  const existingAppointments = await getAppointmentsByDateAndBarber(barberId, date) as AppointmentRow[];

  const slots: TimeSlot[] = [];
  const slotDuration = 15; // 15-minute intervals
  const windows = manualWindows.length
    ? manualWindows
    : [{ start_time: workingHours.start, end_time: workingHours.end }];

  for (const window of windows) {
    let currentTime = new Date(`${date}T${window.start_time}:00+05:00`);
    const endTime = new Date(`${date}T${window.end_time}:00+05:00`);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + (serviceDurationMinutes + bufferMinutes) * 60000);

      if (slotEnd > endTime) break;

      // Check if slot is during break
      const isBreak = isTimeInBreak(currentTime, workingHours.breaks || []);
      if (isBreak) {
        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
        continue;
      }

      // Check for conflicts
      const hasConflict = existingAppointments.some((apt) => {
        let aptStart: Date | null = null;
        let aptEnd: Date | null = null;

        if (apt.start_at && apt.end_at) {
          aptStart = new Date(apt.start_at);
          aptEnd = new Date(apt.end_at);
        }

        if (!aptStart || !aptEnd) {
          if (apt.appointment_date && apt.appointment_time) {
            const iso = buildLocalIsoTimestamp(apt.appointment_date, apt.appointment_time);
            aptStart = new Date(iso);
            const duration = Number(apt.duration_minutes) || 30;
            aptEnd = new Date(aptStart.getTime() + duration * 60000);
          }
        }

        if (!aptStart || !aptEnd || Number.isNaN(aptStart.getTime()) || Number.isNaN(aptEnd.getTime())) {
          return false;
        }

        return !(slotEnd <= aptStart || currentTime >= aptEnd);
      });

      slots.push({
        start: currentTime.toISOString(),
        end: slotEnd.toISOString(),
        available: !hasConflict,
      });

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }
  }

  return slots;
}

/**
 * Handle emergency appointment insertion with shifting
 */
export async function insertEmergencyAppointment(
  emergencyAppointment: Omit<AppointmentItem, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; shiftedAppointments: AppointmentItem[]; error?: string }> {
  try {
    const supabase = getServiceClient();
    const conflicting = await getConflictingAppointments(
      emergencyAppointment.barber_id,
      emergencyAppointment.start_at,
      emergencyAppointment.end_at
    );

    if (conflicting.length === 0) {
      const { data, error } = await supabase.from('appointments').insert([
        { ...emergencyAppointment, is_emergency: true },
      ]).select();

      if (error) throw error;

      return { success: true, shiftedAppointments: [] };
    }

    const shiftedAppointments: AppointmentItem[] = [];
    const appointmentIds: string[] = [];

    for (const conflictingApt of conflicting) {
      const service = await getService(conflictingApt.service_id);
      if (!service) continue;

      let searchDate = new Date(emergencyAppointment.end_at);
      let found = false;

      for (let i = 0; i < 7; i++) {
        const dateStr = searchDate.toISOString().split('T')[0];

        const slots = await generateAvailableSlots(
          emergencyAppointment.barber_id,
          dateStr,
          service.duration_minutes
        );

        if (slots.length > 0) {
          const firstSlot = slots[0];

          shiftedAppointments.push({
            ...conflictingApt,
            start_at: firstSlot.start,
            end_at: firstSlot.end,
          });

          appointmentIds.push(conflictingApt.id);
          found = true;
          break;
        }

        searchDate.setDate(searchDate.getDate() + 1);
      }

      if (!found) {
        throw new Error(`Could not find available slot for appointment ${conflictingApt.id}`);
      }
    }

    // Update shifted appointments
    for (const shifted of shiftedAppointments) {
      await supabase
        .from('appointments')
        .update({ start_at: shifted.start_at, end_at: shifted.end_at })
        .eq('id', shifted.id);

      await supabase.from('appointment_shifts').insert([
        {
          appointment_id: shifted.id,
          original_start_at: conflicting.find((a) => a.id === shifted.id)?.start_at,
          new_start_at: shifted.start_at,
          shift_reason: 'Emergency appointment override',
        },
      ]);
    }

    // Insert emergency appointment
    const { error } = await supabase.from('appointments').insert([
      { ...emergencyAppointment, is_emergency: true },
    ]);

    if (error) throw error;

    // Send notifications
    for (const shifted of shiftedAppointments) {
      await supabase.from('notifications').insert([
        {
          user_id: shifted.user_id,
          type: 'reschedule',
          message: `Your appointment has been rescheduled due to an emergency booking. New time: ${new Date(shifted.start_at).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`,
          related_appointment_id: shifted.id,
          read: false,
        },
      ]);
    }

    return { success: true, shiftedAppointments };
  } catch (error) {
    return {
      success: false,
      shiftedAppointments: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/* ==================== Helper Functions ==================== */

async function getConflictingAppointments(
  barberId: string,
  startTime: string,
  endTime: string
): Promise<AppointmentItem[]> {
  const supabase = getServiceClient();
  const CANCELLED_STATUSES = ['cancelled', 'Cancelled', 'canceled', 'Canceled'];
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .or(`barber_id.eq.${barberId},barber_id.is.null`)
    .not('status', 'in', `(${CANCELLED_STATUSES.join(',')})`)
    .lt('start_at', endTime)
    .gt('end_at', startTime);

  if (error) return [];
  return data || [];
}

async function getManualAvailabilityWindows(
  barberId: string,
  date: string
): Promise<Array<{ start_time: string; end_time: string }>> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('slots')
    .select('start_time, end_time')
    .eq('barber_id', barberId)
    .eq('slot_date', date)
    .eq('is_available', true);

  if (error) return [];
  return (data ?? []).map((row: any) => ({
    start_time: row.start_time,
    end_time: row.end_time,
  }));
}

async function getAppointmentsByDateAndBarber(
  barberId: string,
  date: string
): Promise<AppointmentItem[]> {
  const supabase = getServiceClient();
  // Use Pakistan Standard Time (UTC+5) boundaries to avoid server-UTC mismatch
  const startOfDayPKT = new Date(`${date}T00:00:00+05:00`);
  const endOfDayPKT = new Date(`${date}T23:59:59.999+05:00`);

  const CANCELLED_STATUSES = ['cancelled', 'Cancelled', 'canceled', 'Canceled'];

  // Query by appointment_date field — scoped to this barber
  const dateQuery = await supabase
    .from('appointments')
    .select('*')
    .not('status', 'in', `(${CANCELLED_STATUSES.join(',')})`)
    .eq('appointment_date', date)
    .eq('barber_id', barberId);

  // Query by timestamp overlap — also scoped to this barber
  const overlapQuery = await supabase
    .from('appointments')
    .select('*')
    .not('status', 'in', `(${CANCELLED_STATUSES.join(',')})`)
    .lte('start_at', endOfDayPKT.toISOString())
    .gt('end_at', startOfDayPKT.toISOString())
    .eq('barber_id', barberId);

  if (dateQuery.error || overlapQuery.error) return [];

  const allAppointments = [...(dateQuery.data || []), ...(overlapQuery.data || [])];
  const uniqueAppointments = Array.from(
    new Map(allAppointments.map((appt) => [appt.id, appt])).values(),
  );

  // Exclude pending appointments that have no confirmed payment — they haven't
  // actually secured the slot yet.
  return uniqueAppointments.filter((appt) => {
    const normalizedStatus = String(appt.status || '').trim().toLowerCase();
    if (normalizedStatus === 'pending') {
      // Only block if payment is confirmed
      const payStatus = String(appt.payment_status || '').trim().toLowerCase();
      const confirmedStatuses = ['completed', 'complete', 'success', 'paid', 'settled', 'confirmed', 'succeeded'];
      return confirmedStatuses.includes(payStatus);
    }
    return true;
  });
}

async function getBarberProfile(barberId: string): Promise<BarberProfile | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('id', barberId)
    .single();

  if (error) return null;
  return data;
}

async function getService(serviceId: string): Promise<ServiceItem | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single();

  if (error) return null;
  return data;
}

function isTimeInBreak(
  time: Date,
  breaks: Array<{ start: string; end: string }>
): boolean {
  // Convert time to PKT HH:MM string for break comparison
  const pktTimeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Karachi' });
  return breaks.some((b) => pktTimeStr >= b.start && pktTimeStr < b.end);
}

function buildLocalIsoTimestamp(date: string, time: string): string {
  // Server-side: interpret `date` + `time` as Pakistan local time (UTC+05:00)
  // and produce a canonical ISO string in UTC.
  const isoWithOffset = `${date}T${time}:00+05:00`;
  const parsed = new Date(isoWithOffset);
  return parsed.toISOString();
}

/**
 * Get available dates for the next N days (computed in Asia/Karachi timezone)
 */
export async function getAvailableDates(
  barberId: string,
  serviceDurationMinutes: number = 30,
  daysAhead: number = 30
): Promise<string[]> {
  const availableDates: string[] = [];
  const now = new Date();
  const pktFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' });
  const todayPktStr = pktFormatter.format(now); // e.g. "2026-08-08"

  const [year, month, day] = todayPktStr.split('-').map(Number);
  const baseDate = new Date(Date.UTC(year, month - 1, day));

  for (let i = 1; i <= daysAhead; i++) {
    const nextDate = new Date(baseDate);
    nextDate.setUTCDate(baseDate.getUTCDate() + i);
    const dateStr = nextDate.toISOString().split('T')[0];

    const slots = await generateAvailableSlots(
      barberId,
      dateStr,
      serviceDurationMinutes
    );

    if (slots.some((s) => s.available)) {
      availableDates.push(dateStr);
    }
  }

  return availableDates;
}