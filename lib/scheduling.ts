import { AppointmentItem, BarberProfile } from './types';

export interface TimeSlot {
  label: string;
  startAt: string;
  endAt: string;
  available: boolean;
}

export function isLastTwoDaysOfMonth(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return date.getDate() > daysInMonth - 2;
}

function toMinutes(value: string) {
  const [time, period] = value.split(' ');
  const [hourString, minuteString] = time.split(':');
  let hour = Number(hourString);
  const minutes = Number(minuteString);

  if (period?.toLowerCase() === 'pm' && hour !== 12) {
    hour += 12;
  }
  if (period?.toLowerCase() === 'am' && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minutes;
}

function minutesToLabel(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  const isPM = hour >= 12;
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalizedHour}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
}

function parseDailyTime(value: string) {
  const [hourString, minuteString] = value.split(':');
  return Number(hourString) * 60 + Number(minuteString);
}

function formatDateKey(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

function appointmentWindow(startMinutes: number, duration: number, buffer: number) {
  return { startMinutes, endMinutes: startMinutes + duration + buffer };
}

export function generateAvailabilitySlots(
  barber: BarberProfile,
  date: string,
  bookedAppointments: AppointmentItem[],
  serviceDuration: number,
  bufferMinutes = 10,
  stepMinutes = 15,
): TimeSlot[] {
  const dateKey = formatDateKey(date);
  const dayNameShort = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  const dayNameLong = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  const isOffDay = barber.working_hours.off_days?.some(
    (d: string) => d.toLowerCase() === dayNameShort.toLowerCase() || d.toLowerCase() === dayNameLong.toLowerCase()
  );
  const isUnavailableDate = barber.working_hours.unavailable_dates?.includes(dateKey);

  if (!barber.is_available || isOffDay || isUnavailableDate || isLastTwoDaysOfMonth(date)) {
    return [];
  }

  const start = parseDailyTime(barber.working_hours.start);
  const end = parseDailyTime(barber.working_hours.end);
  const breakSlots = barber.working_hours.breaks.map((item) => ({
    start: parseDailyTime(item.start),
    end: parseDailyTime(item.end),
  }));

  const occupiedWindows = bookedAppointments
    .filter((appt) => formatDateKey(appt.start_at) === dateKey)
    .map((appt) => appointmentWindow(toMinutes(appt.start_at.split('T')[1].slice(0, 5) + ' AM'), appt.duration_minutes, bufferMinutes));

  const customBooked = bookedAppointments
    .filter((appt) => formatDateKey(appt.start_at) === dateKey)
    .map((appt) => ({
      start: new Date(appt.start_at).getHours() * 60 + new Date(appt.start_at).getMinutes(),
      end: new Date(appt.end_at).getHours() * 60 + new Date(appt.end_at).getMinutes(),
    }));

  const ranges = [] as { start: number; end: number }[];

  for (let minutes = start; minutes + serviceDuration <= end; minutes += stepMinutes) {
    const appointmentEnd = minutes + serviceDuration;
    const overlapsBreak = breakSlots.some((item) => minutes < item.end && appointmentEnd > item.start);
    const overlapsBooked = customBooked.some((item) => minutes < item.end + bufferMinutes && appointmentEnd > item.start - bufferMinutes);
    const surroundedBySchedule = !overlapsBreak && !overlapsBooked;

    if (surroundedBySchedule) {
      ranges.push({ start: minutes, end: appointmentEnd });
    }
  }

  const uniqueSlots = ranges
    .filter((item, index) => index === 0 || item.start !== ranges[index - 1].start)
    .map((item) => ({
      label: minutesToLabel(item.start),
      startAt: `${dateKey}T${String(Math.floor(item.start / 60)).padStart(2, '0')}:${String(item.start % 60).padStart(2, '0')}:00Z`,
      endAt: `${dateKey}T${String(Math.floor(item.end / 60)).padStart(2, '0')}:${String(item.end % 60).padStart(2, '0')}:00Z`,
      available: true,
    }));

  return uniqueSlots;
}

export function applyEmergencyOverride(
  currentAppointments: AppointmentItem[],
  emergencyAppointment: AppointmentItem,
  bufferMinutes = 10,
) {
  const appointments = [...currentAppointments];
  const targetStart = new Date(emergencyAppointment.start_at).getTime();
  const movedAppointments: AppointmentItem[] = [];

  const sorted = appointments
    .filter((appt) => appt.id !== emergencyAppointment.id)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  let carryTime = targetStart + emergencyAppointment.duration_minutes * 60_000 + bufferMinutes * 60_000;

  sorted.forEach((appointment) => {
    const currentStart = new Date(appointment.start_at).getTime();
    if (currentStart < carryTime) {
      const originalStart = new Date(appointment.start_at).toISOString();
      appointment.start_at = new Date(carryTime).toISOString();
      appointment.end_at = new Date(carryTime + appointment.duration_minutes * 60_000).toISOString();
      appointment.status = 'shifted';
      appointment.shift_source_id = emergencyAppointment.id;
      movedAppointments.push({ ...appointment, start_at: originalStart });
      carryTime = new Date(appointment.end_at).getTime() + bufferMinutes * 60_000;
    } else {
      carryTime = currentStart + appointment.duration_minutes * 60_000 + bufferMinutes * 60_000;
    }
  });

  return {
    updatedAppointments: [emergencyAppointment, ...sorted],
    shifts: movedAppointments,
  };
}
