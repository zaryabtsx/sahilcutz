/* eslint-disable prefer-const */
import { supabase } from './supabaseClient';
import type { AppointmentItem, BarberProfile, ServiceItem } from './types';

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
 * Now returns FULL ISO strings with correct local timezone handling
 */
export async function generateAvailableSlots(
  barberId: string,
  date: string,                    // YYYY-MM-DD
  serviceDurationMinutes: number,
  bufferMinutes: number = 0
): Promise<TimeSlot[]> {
  // Parse the date in local timezone
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);

  // Get barber working hours
  const barber = await getBarberProfile(barberId);
  if (!barber) return [];

  const workingHours = barber.working_hours;
  const [workStartHour, workStartMin] = workingHours.start.split(':').map(Number);
  const [workEndHour, workEndMin] = workingHours.end.split(':').map(Number);

  // Get day of week for breaks
  const dayOfWeek = localDate.toLocaleString('en-US', { weekday: 'short' });
  const isOffDay = workingHours.off_days?.includes(dayOfWeek);

  if (isOffDay) {
    return [];
  }

  // Get existing appointments for this date
  const existingAppointments = await getAppointmentsByDateAndBarber(barberId, date);

  const slots: TimeSlot[] = [];
  const slotDuration = 15; // 15-minute intervals

  let currentTime = new Date(localDate);
  currentTime.setHours(workStartHour, workStartMin, 0, 0);

  const endTime = new Date(localDate);
  endTime.setHours(workEndHour, workEndMin, 0, 0);

  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime);
    slotEnd.setMinutes(slotEnd.getMinutes() + serviceDurationMinutes + bufferMinutes);

    if (slotEnd > endTime) break;

    // Check if slot is during break
    const isBreak = isTimeInBreak(currentTime, workingHours.breaks || []);
    if (isBreak) {
      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      continue;
    }

    // Check for conflicts
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
 * Handle emergency appointment insertion with shifting
 */
export async function insertEmergencyAppointment(
  emergencyAppointment: Omit<AppointmentItem, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; shiftedAppointments: AppointmentItem[]; error?: string }> {
  try {
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
          message: `Your appointment has been rescheduled due to an emergency booking. New time: ${new Date(shifted.start_at).toLocaleString()}`,
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
): Promise<AppointmentItem[]> {
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

async function getService(serviceId: string): Promise<ServiceItem | null> {
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
  const timeStr = time.toTimeString().slice(0, 5);
  return breaks.some((b) => timeStr >= b.start && timeStr < b.end);
}

/**
 * Get available dates for the next N days
 */
export async function getAvailableDates(
  barberId: string,
  serviceDurationMinutes: number = 30,
  daysAhead: number = 30
): Promise<string[]> {
  const availableDates: string[] = [];
  const today = new Date();

  for (let i = 1; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const slots = await generateAvailableSlots(
      barberId,
      date.toISOString().split('T')[0],
      serviceDurationMinutes
    );

    if (slots.some((s) => s.available)) {
      availableDates.push(date.toISOString().split('T')[0]);
    }
  }

  return availableDates;
}