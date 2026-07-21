'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { isAuthenticated, getSession, clearSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/types';
import { Bell, Clock, Heart, ArrowRight, LogOut, Loader2, RefreshCw, XCircle, CalendarDays } from 'lucide-react';
import { initialBarbers, initialNotifications } from '@/lib/mockData';

const statusStyles: Record<string, string> = {
  upcoming:   'bg-primary/10 text-primary',
  confirmed:  'bg-primary/10 text-primary',
  pending:    'bg-accent/10 text-accent',
  completed:  'bg-muted/10 text-muted-foreground',
  cancelled:  'bg-destructive/10 text-destructive',
  expired:    'bg-muted/10 text-muted-foreground',
  emergency:  'bg-red-500/10 text-red-500',
  shifted:    'bg-yellow-500/10 text-yellow-500',
};

const ACTIVE_STATUSES = new Set(['upcoming', 'pending', 'confirmed', 'in progress']);

interface AppointmentRow {
  id:               string;
  user_id:          string;
  barber_id:        string;
  service_id:       string;
  customer_name:    string;
  service_name?:    string | null;
  appointment_date: string;
  appointment_time: string;
  start_at:         string;
  end_at:           string;
  duration_minutes: number;
  revenue?:         number | null;
  status:           string;
  created_at:       string;
  services?:        { name: string; price: number } | null;
  barbers?:         { name: string } | null;
}

function normalizedStatus(status?: string | null): string {
  return (status || 'upcoming').toLowerCase();
}

function displayStatus(appt: AppointmentRow): string {
  const status = normalizedStatus(appt.status);
  if (status === 'completed' || status === 'cancelled') return status;
  return new Date(appt.end_at).getTime() < Date.now() ? 'expired' : status;
}

function statusLabel(status: string): string {
  return status.split(' ').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function serviceName(appt: AppointmentRow): string {
  if (appt.service_id === 'service-1' || appt.service_id === 'service-haircut') return 'Hair Cut';
  if (appt.service_id === 'service-2' || appt.service_id === 'service-beard') return 'Beard Trim';
  return appt.services?.name || appt.service_name || 'Service';
}

function servicePrice(appt: AppointmentRow): number | null {
  return appt.services?.price ?? appt.revenue ?? null;
}

export default function CustomerDashboardPage() {
  const router = useRouter();

  const [ready, setReady]               = useState(false);
  const [user, setUser]                 = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [apptLoading, setApptLoading]   = useState(true);
  const [apptError, setApptError]       = useState('');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentRow | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<Array<{ start: string; end: string; available: boolean }>>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    isAuthenticated().then((ok) => {
      if (!ok) {
        router.push('/auth/login');
        return;
      }
      const session = getSession();
      if (!session || (session.user.role !== 'customer' && session.user.role !== 'barber')) {
        router.push('/auth/login');
        return;
      }
      setUser(session.user);
      setReady(true);
    });
  }, [router]);

  const loadAppointments = async () => {
    if (!user?.id) return;

    setApptLoading(true);
    setApptError('');

    try {
      const response = await fetch(`/api/customer/appointments?userId=${encodeURIComponent(user.id)}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to load appointments.');
      }

      setAppointments(payload as AppointmentRow[]);
    } catch (err) {
      setAppointments([]);
      setApptError(err instanceof Error ? err.message : 'Unable to load appointments.');
    } finally {
      setApptLoading(false);
    }
  };

  // ── Fetch appointments from Supabase ────────────────────────
  useEffect(() => {
    if (!ready || !user) return;
    void loadAppointments();
  }, [ready, user]);

  const handleLogout = async () => {
    clearSession();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  useEffect(() => {
    if (!rescheduleTarget || !rescheduleDate) return;

    const loadSlots = async () => {
      setRescheduleLoading(true);
      setRescheduleError('');
      setRescheduleTime('');

      try {
        const response = await fetch(
          `/api/slots?barberId=${encodeURIComponent(rescheduleTarget.barber_id)}&date=${rescheduleDate}&serviceDuration=${rescheduleTarget.duration_minutes}`,
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? 'Unable to load available times.');
        }

        const slots = Array.isArray(payload) ? payload : payload.slots || [];
        setRescheduleSlots(slots);
      } catch (err) {
        setRescheduleSlots([]);
        setRescheduleError(err instanceof Error ? err.message : 'Unable to load available times.');
      } finally {
        setRescheduleLoading(false);
      }
    };

    void loadSlots();
  }, [rescheduleDate, rescheduleTarget]);

  const openReschedule = (appt: AppointmentRow) => {
    setRescheduleTarget(appt);
    setRescheduleDate(new Date(appt.start_at).toISOString().slice(0, 10));
    setRescheduleTime('');
    setRescheduleError('');
  };

  const cancelAppointment = async (appt: AppointmentRow) => {
    if (!user?.id || actionBusyId) return;

    setActionBusyId(appt.id);
    setApptError('');

    try {
      const response = await fetch('/api/customer/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', appointmentId: appt.id, userId: user.id }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to cancel appointment.');
      }

      await loadAppointments();
    } catch (err) {
      setApptError(err instanceof Error ? err.message : 'Unable to cancel appointment.');
    } finally {
      setActionBusyId(null);
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget || !rescheduleTime || !user?.id || actionBusyId) return;

    setActionBusyId(rescheduleTarget.id);
    setRescheduleError('');

    try {
      const selectedSlot = rescheduleSlots.find((slot) => slot.start === rescheduleTime);
      if (!selectedSlot) {
        throw new Error('Please choose a valid time slot.');
      }

      const response = await fetch('/api/customer/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          appointmentId: rescheduleTarget.id,
          userId: user.id,
          start_at: selectedSlot.start,
          end_at: selectedSlot.end,
          duration_minutes: rescheduleTarget.duration_minutes,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to reschedule appointment.');
      }

      setRescheduleTarget(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleSlots([]);
      await loadAppointments();
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : 'Unable to reschedule appointment.');
    } finally {
      setActionBusyId(null);
    }
  };

  const upcoming = useMemo(
    () => appointments
      .filter((appt) => ACTIVE_STATUSES.has(displayStatus(appt)))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
    [appointments],
  );

  const past = useMemo(
    () => appointments
      .filter((appt) => ['completed', 'cancelled', 'expired'].includes(displayStatus(appt)))
      .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()),
    [appointments],
  );

  const favoriteBarber       = initialBarbers[0];
  const activeNotifications  = initialNotifications.filter((n) => !n.read);

  // ── Loading spinner ─────────────────────────────────────────
  if (!ready) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-14 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-14 right-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="relative z-10 space-y-10"
        >
          {/* ── Header ── */}
          <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Customer dashboard</p>
                <h1 className="mt-3 text-4xl font-black text-foreground">
                  Welcome back, {user?.full_name || user?.email || 'Guest'}.
                </h1>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => router.push('/booking')}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-lg transition-all"
                >
                  Book appointment <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl border border-destructive/30 px-6 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-border bg-background/90 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Upcoming</p>
                <p className="mt-3 text-3xl font-black text-foreground">{upcoming.length}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background/90 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Total booked</p>
                <p className="mt-3 text-3xl font-black text-foreground">{appointments.length}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background/90 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Favorite barber</p>
                <p className="mt-3 text-3xl font-black text-foreground">{favoriteBarber.name}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background/90 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Alerts</p>
                <p className="mt-3 text-3xl font-black text-foreground">{activeNotifications.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-10 xl:grid-cols-[1.35fr_0.65fr]">
            <section className="space-y-6">

              {/* Profile details */}
              <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Profile details</p>
                    <h2 className="mt-2 text-2xl font-black text-foreground">Your personal data</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-3xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                    Customer
                  </div>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Name',           value: user?.full_name || 'Not set'   },
                    { label: 'Email',          value: user?.email     || '—'         },
                    { label: 'Phone',          value: user?.phone     || 'Not added' },
                    { label: 'Favorite barber', value: favoriteBarber.name           },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-3xl border border-border bg-background/90 p-5">
                      <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{label}</p>
                      <p className="mt-3 text-lg font-bold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming appointments */}
              <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 text-primary">
                  <div className="rounded-3xl bg-primary/15 p-3"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em]">Upcoming appointments</p>
                    <p className="mt-2 text-2xl font-black text-foreground">Never miss a premium session</p>
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  {apptLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : apptError ? (
                    <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
                      {apptError}
                    </div>
                  ) : upcoming.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-background/90 p-6 text-center text-sm text-muted-foreground">
                      No upcoming appointments.{' '}
                      <button onClick={() => router.push('/booking')} className="text-primary hover:underline">
                        Book one →
                      </button>
                    </div>
                  ) : (
                    upcoming.map((appt) => {
                      const status = displayStatus(appt);
                      const price = servicePrice(appt);
                      return (
                      <div key={appt.id} className="rounded-3xl border border-border bg-background/90 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{serviceName(appt)}</p>
                            <p className="mt-1 text-xl font-bold text-foreground">
                              {new Date(appt.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            {appt.barbers?.name && (
                              <p className="mt-1 text-xs text-muted-foreground">with {appt.barbers.name}</p>
                            )}
                          </div>
                          <div className={`rounded-3xl px-4 py-2 text-sm font-semibold ${statusStyles[status] ?? statusStyles.upcoming}`}>
                            {statusLabel(status)}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span>
                            {new Date(appt.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span>{appt.duration_minutes} min</span>
                          {price != null && (
                            <>
                              <span>•</span>
                              <span>PKR {Number(price).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            onClick={() => openReschedule(appt)}
                            disabled={actionBusyId === appt.id}
                            className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                          >
                            <RefreshCw className="h-4 w-4" /> Reschedule
                          </button>
                          <button
                            onClick={() => cancelAppointment(appt)}
                            disabled={actionBusyId === appt.id}
                            className="inline-flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" /> Cancel
                          </button>
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>

              {/* All appointments history */}
              {past.length > 0 && (
                <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-3 text-primary mb-6">
                    <div className="rounded-3xl bg-primary/15 p-3"><Clock className="w-5 h-5" /></div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em]">Past appointments</p>
                      <p className="mt-2 text-2xl font-black text-foreground">Your history</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {past
                      .map((appt) => {
                        const status = displayStatus(appt);
                        const price = servicePrice(appt);
                        return (
                        <div key={appt.id} className="rounded-3xl border border-border bg-background/90 p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">{serviceName(appt)}</p>
                              <p className="mt-1 text-xl font-bold text-foreground">
                                {new Date(appt.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              {appt.barbers?.name && (
                                <p className="mt-1 text-xs text-muted-foreground">with {appt.barbers.name}</p>
                              )}
                            </div>
                            <div className={`rounded-3xl px-4 py-2 text-sm font-semibold ${statusStyles[status] ?? statusStyles.expired}`}>
                              {statusLabel(status)}
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span>
                              {new Date(appt.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                            <span>•</span>
                            <span>{appt.duration_minutes} min</span>
                            {price != null && (
                              <>
                                <span>•</span>
                                <span>PKR {Number(price).toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                      })}
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-6">
              {/* Notifications */}
              <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 text-primary">
                  <div className="rounded-3xl bg-primary/15 p-3"><Bell className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em]">Notifications</p>
                    <p className="mt-2 text-2xl font-black text-foreground">Stay in control</p>
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  {activeNotifications.length > 0 ? (
                    activeNotifications.map((n) => (
                      <div key={n.id} className="rounded-3xl border border-border bg-background/90 p-4 text-sm text-foreground">
                        {n.message}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No new notifications. Your next appointment is secure.</p>
                  )}
                </div>
              </div>

              {/* Favorite barber */}
              <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 text-primary">
                  <div className="rounded-3xl bg-primary/15 p-3"><Heart className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em]">Favorite barber</p>
                    <p className="mt-2 text-2xl font-black text-foreground">{favoriteBarber.name}</p>
                  </div>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  Personalized appointment suggestions and a premium membership experience are coming soon.
                </p>
              </div>

              {/* Quick book */}
              <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Ready for your next visit?</p>
                <p className="mt-3 text-xl font-black text-foreground">Book your next session in seconds.</p>
                <button
                  onClick={() => router.push('/booking')}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20"
                >
                  Book now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>

      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl rounded-[32px] border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Reschedule appointment</p>
                <h3 className="mt-2 text-2xl font-black text-foreground">Pick a new time</h3>
              </div>
              <button
                onClick={() => {
                  setRescheduleTarget(null);
                  setRescheduleDate('');
                  setRescheduleTime('');
                  setRescheduleSlots([]);
                  setRescheduleError('');
                }}
                className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-foreground">
                <span className="mb-2 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> Choose another date
                </span>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={rescheduleDate}
                  onChange={(event) => setRescheduleDate(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </label>

              {rescheduleLoading ? (
                <div className="flex items-center justify-center rounded-3xl border border-border bg-background/80 py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : rescheduleError ? (
                <div className="rounded-3xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {rescheduleError}
                </div>
              ) : rescheduleSlots.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {rescheduleSlots.map((slot) => {
                    const isBooked = slot.available === false;
                    const isSelected = rescheduleTime === slot.start;
                    return (
                      <button
                        key={slot.start}
                        disabled={isBooked}
                        onClick={() => setRescheduleTime(slot.start)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                          isBooked
                            ? 'cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground'
                            : isSelected
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border bg-background/90 text-foreground hover:border-primary/40'
                        }`}
                      >
                        {new Date(slot.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {isBooked && ' • Booked'}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-border bg-background/80 p-4 text-sm text-muted-foreground">
                  No open slots are available for this date yet.
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => {
                  setRescheduleTarget(null);
                  setRescheduleDate('');
                  setRescheduleTime('');
                  setRescheduleSlots([]);
                  setRescheduleError('');
                }}
                className="rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Close
              </button>
              <button
                onClick={submitReschedule}
                disabled={!rescheduleTime || actionBusyId === rescheduleTarget.id}
                className="rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-50"
              >
                {actionBusyId === rescheduleTarget.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save new time'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
