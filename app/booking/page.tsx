'use client';

// ─────────────────────────────────────────────────────────────
//  app/booking/page.tsx
// ─────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { isAuthenticated, getSession } from '@/lib/auth';
import {
  ArrowLeft, ArrowRight, CheckCircle, Loader2,
  Clock, Scissors, Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  is_active: boolean;
}

interface AvailWindow {
  id: string;
  barber_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ComputedSlot {
  barber_id: string;
  start_time: string;
  end_time: string;
}

interface Barber {
  id: string;
  name: string;
}

interface BookedAppt {
  barber_id: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
}

// ── Helpers ───────────────────────────────────────────────────

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minsToTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

function fmtTime12(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function computeAvailableSlots(
  windows: AvailWindow[],
  booked: BookedAppt[],
  durationMins: number,
  barberId: string,
  selectedDate: string,
): ComputedSlot[] {
  const barberWindows = windows.filter(w => w.barber_id === barberId && w.is_available);
  if (!barberWindows.length) return [];

  const blockedRanges = booked
    .filter(b => b.barber_id === barberId && !['Cancelled', 'cancelled'].includes(b.status))
    .map(b => ({
      from: timeToMins(b.appointment_time),
      to:   timeToMins(b.appointment_time) + b.duration_minutes,
    }));

  const nowMins =
    isoDate(new Date()) === selectedDate
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : 0;

  const slots: ComputedSlot[] = [];

  barberWindows.forEach(win => {
    const winStart = timeToMins(win.start_time);
    const winEnd   = timeToMins(win.end_time);
    let cursor = winStart;

    while (cursor + durationMins <= winEnd) {
      const slotEnd = cursor + durationMins;

      if (cursor < nowMins) { cursor += durationMins; continue; }

      const overlaps = blockedRanges.some(r => cursor < r.to && slotEnd > r.from);
      if (!overlaps) {
        slots.push({ barber_id: barberId, start_time: minsToTime(cursor), end_time: minsToTime(slotEnd) });
      }
      cursor += durationMins;
    }
  });

  return slots;
}

// ── Step indicator ────────────────────────────────────────────

function Steps({ current }: { current: number }) {
  const steps = ['Service', 'Date & Time', 'Confirm'];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            i < current   ? 'bg-primary/20 text-primary' :
            i === current ? 'bg-primary text-primary-foreground' :
                            'bg-border/30 text-muted-foreground'
          }`}>
            {i < current ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
            {s}
          </div>
          {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function BookingPage() {
  const router = useRouter();

  const [ready, setReady]     = useState(false);
  const [user, setUser]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers]   = useState<Barber[]>([]);
  const [windows, setWindows]   = useState<AvailWindow[]>([]);
  const [booked, setBooked]     = useState<BookedAppt[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [step, setStep] = useState(0);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate]       = useState<string>(isoDate(new Date()));
  const [selectedSlot, setSelectedSlot]       = useState<ComputedSlot | null>(null);
  const [selectedBarber, setSelectedBarber]   = useState<string>('');

  // ── Confirmed booking snapshot — persists after slot state resets ──
  const [confirmedSlot, setConfirmedSlot]       = useState<ComputedSlot | null>(null);
  const [confirmedService, setConfirmedService] = useState<Service | null>(null);
  const [confirmedDate, setConfirmedDate]       = useState<string>('');
  const [confirmedBarberName, setConfirmedBarberName] = useState<string>('');

  const today = useMemo(() => new Date(), []);
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [submitting, setSubmitting]   = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [error, setError]             = useState('');

  // ── Auth guard ──
  useEffect(() => {
    isAuthenticated().then(ok => {
      if (!ok) { router.push('/auth/login'); return; }
      const session = getSession();
      setUser(session?.user ?? null);
      setReady(true);
    });
  }, [router]);

  // ── Load services + barbers once ──
  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      setLoading(true);
      const [svcRes, barberRes] = await Promise.all([
        supabase.from('services').select('*').eq('is_active', true).order('name'),
        supabase.from('barbers').select('id, name'),
      ]);
      setServices((svcRes.data ?? []) as Service[]);
      setBarbers((barberRes.data ?? []) as Barber[]);
      setLoading(false);
    };
    load();
  }, [ready]);

  // ── Load availability windows + booked appts when date changes ──
  const loadSlotsForDate = useCallback(async (date: string) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    const [winRes, apptRes] = await Promise.all([
      supabase.from('slots').select('*').eq('slot_date', date).eq('is_available', true),
      supabase
        .from('appointments')
        .select('barber_id, appointment_time, duration_minutes, status')
        .eq('appointment_date', date)
        .not('status', 'in', '("Cancelled","cancelled")'),
    ]);
    setWindows((winRes.data ?? []) as AvailWindow[]);
    setBooked((apptRes.data ?? []) as BookedAppt[]);
    setLoadingSlots(false);
  }, []);

  useEffect(() => {
    if (!ready || !selectedDate) return;
    loadSlotsForDate(selectedDate);
  }, [ready, selectedDate, loadSlotsForDate]);

  // ── Compute available slots ──
  const allComputedSlots = useMemo((): ComputedSlot[] => {
    if (!selectedService || !barbers.length) return [];
    const result: ComputedSlot[] = [];
    barbers.forEach(barber => {
      result.push(...computeAvailableSlots(windows, booked, selectedService.duration_minutes, barber.id, selectedDate));
    });
    return result.sort((a, b) => a.start_time.localeCompare(b.start_time) || a.barber_id.localeCompare(b.barber_id));
  }, [selectedService, windows, booked, barbers, selectedDate]);

  const visibleSlots = useMemo(() => {
    if (!selectedBarber) return allComputedSlots;
    return allComputedSlots.filter(s => s.barber_id === selectedBarber);
  }, [allComputedSlots, selectedBarber]);

  // ── Calendar helpers ──
  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const pickDate = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d < todayMidnight) return;
    setSelectedDate(isoDate(d));
    setSelectedSlot(null);
  };

  // ── Submit booking ──
  const submitBooking = async () => {
    if (!selectedService || !selectedSlot || !user) return;
    setError('');
    setSubmitting(true);

    // Snapshot before loadSlotsForDate resets selectedSlot to null
    const bookedSlot        = selectedSlot;
    const bookedService     = selectedService;
    const bookedDate        = selectedDate;
    const bookedBarberName  = barbers.find(b => b.id === selectedSlot.barber_id)?.name ?? '—';

    try {
      const { data: authUser } = await supabase.auth.getUser();
      const uid = authUser?.user?.id ?? user?.id;

      const { error: apptErr } = await supabase.from('appointments').insert({
        user_id:          uid,
        customer_name:    user.user_metadata?.full_name ?? user.email ?? 'Customer',
        service_name:     bookedService.name,
        service_id:       bookedService.id,
        appointment_date: bookedDate,
        appointment_time: bookedSlot.start_time,
        start_at:         `${bookedDate}T${bookedSlot.start_time}:00`,
        end_at:           `${bookedDate}T${bookedSlot.end_time}:00`,
        duration_minutes: bookedService.duration_minutes,
        barber_id:        bookedSlot.barber_id,
        revenue:          bookedService.price,
        status:           'Upcoming',
      });
      if (apptErr) throw apptErr;

      // Refresh slots — this resets selectedSlot, but we already snapshotted above
      await loadSlotsForDate(bookedDate);

      // Persist confirmed details for the success screen
      setConfirmedSlot(bookedSlot);
      setConfirmedService(bookedService);
      setConfirmedDate(bookedDate);
      setConfirmedBarberName(bookedBarberName);
      setBookingDone(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetBooking = () => {
    setBookingDone(false);
    setStep(0);
    setSelectedService(null);
    setSelectedSlot(null);
    setSelectedBarber('');
    setConfirmedSlot(null);
    setConfirmedService(null);
    setConfirmedDate('');
    setConfirmedBarberName('');
    setError('');
  };

  // ── Loading ──
  if (!ready || loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  // ── Success screen ──
  if (bookingDone) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full rounded-[32px] border border-border bg-card/90 p-10 text-center shadow-2xl backdrop-blur-xl"
      >
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-3xl font-black text-foreground">Booking confirmed!</h1>

        <p className="mt-3 text-muted-foreground">
          Your{' '}
          <span className="font-semibold text-foreground">{confirmedService?.name}</span>{' '}
          appointment is booked for{' '}
          <span className="font-semibold text-foreground">
            {fmtTime12(confirmedSlot?.start_time ?? '')}
          </span>{' '}
          on{' '}
          <span className="font-semibold text-foreground">
            {confirmedDate
              ? new Date(confirmedDate + 'T00:00:00').toLocaleDateString('en', { month: 'long', day: 'numeric' })
              : ''}
          </span>.
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          With <span className="font-semibold text-foreground">{confirmedBarberName}</span>
        </p>

        {/* Summary card */}
        <div className="mt-6 rounded-3xl border border-border bg-background/90 px-6 py-4 text-left space-y-3">
          {[
            { label: 'Service',  value: confirmedService?.name ?? '—' },
            { label: 'Duration', value: confirmedService ? `${confirmedService.duration_minutes} min` : '—' },
            { label: 'Price',    value: confirmedService ? `PKR ${Number(confirmedService.price).toLocaleString()}` : '—' },
            {
              label: 'Time',
              value: confirmedSlot
                ? `${fmtTime12(confirmedSlot.start_time)} → ${fmtTime12(confirmedSlot.end_time)}`
                : '—',
            },
            { label: 'Barber', value: confirmedBarberName },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="w-full rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20"
          >
            Go to dashboard
          </button>
          <button
            onClick={resetBooking}
            className="w-full rounded-3xl border border-border px-6 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Book another
          </button>
        </div>
      </motion.div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative max-w-4xl mx-auto">

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 space-y-8"
        >

          {/* ── Header ── */}
          <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Book appointment</p>
                <h1 className="mt-3 text-3xl font-black text-foreground">Sahil Cutzz</h1>
              </div>
              <Steps current={step} />
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ══ Step 0 — Service selection ══ */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.35em] text-primary">Step 1</p>
                  <h2 className="mt-3 text-2xl font-black text-foreground">Choose a service</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Select what you'd like done today.</p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {services.map(svc => (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedService(svc)}
                        className={`rounded-3xl border p-5 text-left transition-all hover:border-primary/50 ${
                          selectedService?.id === svc.id
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                            : 'border-border bg-background/90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <p className="font-bold text-foreground">{svc.name}</p>
                          </div>
                          {selectedService?.id === svc.id && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
                        </div>
                        {svc.description && <p className="mt-2 text-xs text-muted-foreground">{svc.description}</p>}
                        <div className="mt-4 flex items-center gap-4 text-sm">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" /> {svc.duration_minutes} min
                          </span>
                          <span className="inline-flex items-center gap-1 font-bold text-primary">
                            PKR {Number(svc.price).toLocaleString()}
                          </span>
                        </div>
                      </button>
                    ))}

                    {services.length === 0 && (
                      <div className="col-span-2 rounded-3xl border border-border bg-background/90 p-8 text-center text-sm text-muted-foreground">
                        No services available right now.
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => selectedService && setStep(1)}
                      disabled={!selectedService}
                      className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-40 transition-all"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ Step 1 — Date + Time ══ */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

                  {/* Calendar */}
                  <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.35em] text-primary">Step 2</p>
                    <h2 className="mt-3 text-2xl font-black text-foreground">Pick a date</h2>

                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <p className="font-bold text-foreground">{MONTHS[calMonth]} {calYear}</p>
                        <button onClick={nextMonth} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 mb-2">
                        {WEEKDAYS.map(d => (
                          <div key={d} className="text-center text-[10px] uppercase tracking-widest text-muted-foreground py-1">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {calDays.map((day, i) => {
                          if (day === null) return <div key={`empty-${i}`} />;
                          const dateStr = isoDate(new Date(calYear, calMonth, day));
                          const isPast  = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          const isSelected = dateStr === selectedDate;
                          const isToday    = dateStr === isoDate(today);
                          return (
                            <button
                              key={day}
                              onClick={() => pickDate(day)}
                              disabled={isPast}
                              className={`rounded-xl aspect-square flex items-center justify-center text-sm font-semibold transition-all ${
                                isSelected  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' :
                                isToday     ? 'border border-primary/40 text-primary' :
                                isPast      ? 'text-muted-foreground/30 cursor-not-allowed' :
                                              'text-foreground hover:bg-background/80'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedDate && (
                      <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                    )}
                  </div>

                  {/* Time picker */}
                  <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-primary">Available times</p>
                        <h2 className="mt-3 text-2xl font-black text-foreground">Choose a time</h2>
                      </div>
                      {selectedService && (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary whitespace-nowrap">
                          {selectedService.duration_minutes} min
                        </span>
                      )}
                    </div>

                    {barbers.length > 1 && (
                      <div className="mt-4">
                        <select
                          value={selectedBarber}
                          onChange={e => { setSelectedBarber(e.target.value); setSelectedSlot(null); }}
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
                        >
                          <option value="">Any barber</option>
                          {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="mt-6 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : visibleSlots.length === 0 ? (
                        <div className="rounded-3xl border border-border bg-background/90 p-6 text-center text-sm text-muted-foreground">
                          {windows.length === 0
                            ? 'No availability set for this date. Try another day.'
                            : 'No open slots for this service on this date. Try another day.'}
                        </div>
                      ) : (
                        visibleSlots.map(slot => {
                          const barberName = barbers.find(b => b.id === slot.barber_id)?.name ?? '';
                          const isSelected =
                            selectedSlot?.start_time === slot.start_time &&
                            selectedSlot?.barber_id  === slot.barber_id;
                          return (
                            <button
                              key={`${slot.barber_id}-${slot.start_time}`}
                              onClick={() => setSelectedSlot(isSelected ? null : slot)}
                              className={`w-full rounded-3xl border p-4 text-left transition-all hover:border-primary/40 ${
                                isSelected
                                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                                  : 'border-border bg-background/90'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-foreground">
                                    {fmtTime12(slot.start_time)}
                                    <span className="mx-1.5 text-muted-foreground font-normal">→</span>
                                    {fmtTime12(slot.end_time)}
                                  </p>
                                  {barberName && (
                                    <p className="text-xs text-muted-foreground mt-0.5">with {barberName}</p>
                                  )}
                                </div>
                                {isSelected && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => { setStep(0); setSelectedSlot(null); }}
                    className="inline-flex items-center gap-2 rounded-3xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => selectedSlot && setStep(2)}
                    disabled={!selectedSlot}
                    className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-40 transition-all"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══ Step 2 — Confirm ══ */}
            {step === 2 && selectedService && selectedSlot && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.35em] text-primary">Step 3</p>
                  <h2 className="mt-3 text-2xl font-black text-foreground">Confirm booking</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Review your appointment details below.</p>

                  <div className="mt-8 space-y-3">
                    {[
                      { label: 'Service',  value: selectedService.name },
                      { label: 'Duration', value: `${selectedService.duration_minutes} min` },
                      { label: 'Price',    value: `PKR ${Number(selectedService.price).toLocaleString()}` },
                      {
                        label: 'Date',
                        value: new Date(selectedDate + 'T00:00:00').toLocaleDateString('en', {
                          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                        }),
                      },
                      {
                        label: 'Time',
                        value: `${fmtTime12(selectedSlot.start_time)} → ${fmtTime12(selectedSlot.end_time)}`,
                      },
                      {
                        label: 'Barber',
                        value: barbers.find(b => b.id === selectedSlot.barber_id)?.name ?? '—',
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between rounded-3xl border border-border bg-background/90 px-5 py-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
                        <p className="font-bold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <p className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</p>
                  )}

                  <div className="mt-8 flex items-center gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 rounded-3xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </span>
                    </button>
                    <button
                      onClick={submitBooking}
                      disabled={submitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60 transition-all"
                    >
                      {submitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking…</>
                        : <><CheckCircle className="w-4 h-4" /> Confirm Booking</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}