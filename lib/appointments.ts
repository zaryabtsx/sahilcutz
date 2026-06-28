/* eslint-disable prefer-const */
import { supabase } from './supabase';
import type { BarberProfile } from './types';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

/**
 * Generate available time slots for a given date and barber
 */
export async function generateAvailableSlots(
  barberId: string,
  date: string,
  serviceDurationMinutes: number,
  bufferMinutes: number = 0
): Promise<TimeSlot[]> {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);

  const barber = await getBarberProfile(barberId);
  if (!barber) return [];

  const workingHours = barber.working_hours;
  const [workStartHour, workStartMin] = workingHours.start.split(':').map(Number);
  const [workEndHour, workEndMin] = workingHours.end.split(':').map(Number);

  const dayOfWeek = localDate.toLocaleString('en-US', { weekday: 'short' });
  if (workingHours.off_days?.includes(dayOfWeek)) {
    return [];
  }

  const existingAppointments = await getAppointmentsByDateAndBarber(barberId, date);

  const slots: TimeSlot[] = [];
  const slotDuration = 15;

  let currentTime = new Date(localDate);
  currentTime.setHours(workStartHour, workStartMin, 0, 0);

  const endTime = new Date(localDate);
  endTime.setHours(workEndHour, workEndMin, 0, 0);

  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime);
    slotEnd.setMinutes(slotEnd.getMinutes() + serviceDurationMinutes + bufferMinutes);

    if (slotEnd > endTime) break;

    if (isTimeInBreak(currentTime, workingHours.breaks || [])) {
      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      continue;
    }

    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.start_at);
      const aptEnd = new Date(apt.end_at);
      return !(slotEnd <= aptStart || currentTime >= aptEnd);
    });

    slots.push({
      start: currentTime.toISOString(),
      end: slotEnd.toISOString(),
      available: !hasConflict,
    });

    currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
  }

  return slots;
}

/**
 * ADMIN: Create Manual Appointment / Slot
 */
export async function createManualAppointment(data: {
  barber_id: string;
  user_id?: string;
  customer_name?: string;
  service_name: string;
  start_at: string;
  end_at: string;
  revenue?: number;
  notes?: string;
  overrideAvailability?: boolean;
}) {
  try {
    if (!data.overrideAvailability) {
      const conflicts = await getConflictingAppointments(
        data.barber_id,
        data.start_at,
        data.end_at
      );

      if (conflicts.length > 0) {
        return { 
          success: false, 
          error: "Time slot already booked. Enable override to force create." 
        };
      }
    }

    const { data: newApt, error } = await supabase
      .from('appointments')
      .insert([{
        barber_id: data.barber_id,
        user_id: data.user_id || null,
        start_at: data.start_at,
        end_at: data.end_at,
        status: 'confirmed',
        is_emergency: true,
        is_manual: true,
        notes: data.notes || null,
      }])
      .select('*, barbers(name)')
      .single();

    if (error) throw error;

    return { success: true, data: newApt };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unable to create appointment.' };
  }
}

/* ==================== Helper Functions ==================== */

async function getConflictingAppointments(
  barberId: string,
  startTime: string,
  endTime: string
) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('barber_id', barberId)
    .neq('status', 'cancelled')
    .lt('start_at', endTime)
    .gt('end_at', startTime);

  if (error) return [];
  return data || [];
}

async function getAppointmentsByDateAndBarber(
  barberId: string,
  date: string
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('barber_id', barberId)
    .neq('status', 'cancelled')
    .gte('start_at', startOfDay.toISOString())
    .lte('end_at', endOfDay.toISOString());

  if (error) return [];
  return data || [];
}

async function getBarberProfile(barberId: string): Promise<BarberProfile | null> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('id', barberId)
    .single();

  if (error) return null;
  return data;
}

function isTimeInBreak(
  time: Date,
  breaks: Array<{ start: string; end: string }>
): boolean {
  const timeStr = time.toTimeString().slice(0, 5);
  return breaks.some((b) => timeStr >= b.start && timeStr < b.end);
}
