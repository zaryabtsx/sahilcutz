'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { isAuthenticated, getSession, clearSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Bell, Clock, Heart, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { initialBarbers, initialNotifications, initialServices } from '@/lib/mockData';

const statusStyles: Record<string, string> = {
  confirmed:  'bg-primary/10 text-primary',
  pending:    'bg-accent/10 text-accent',
  completed:  'bg-muted/10 text-muted-foreground',
  cancelled:  'bg-destructive/10 text-destructive',
  emergency:  'bg-red-500/10 text-red-500',
  shifted:    'bg-yellow-500/10 text-yellow-500',
};

interface AppointmentRow {
  id:               string;
  user_id:          string;
  barber_id:        string;
  service_id:       string;
  customer_name:    string;
  service_name:     string;
  appointment_date: string;
  appointment_time: string;
  start_at:         string;
  end_at:           string;
  duration_minutes: number;
  revenue:          number;
  status:           'confirmed' | 'completed' | 'cancelled' | 'pending';
  created_at:       string;
}

export default function CustomerDashboardPage() {
  const router = useRouter();

  const [ready, setReady]               = useState(false);
  const [user, setUser]                 = useState<any>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [apptLoading, setApptLoading]   = useState(true);

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

  // ── Fetch appointments from Supabase ────────────────────────
  useEffect(() => {
    if (!ready || !user) return;

    const fetchAppointments = async () => {
      setApptLoading(true);

      // Always use the real Supabase auth user id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const uid = authUser?.id ?? user?.id;

      if (!uid) {
        setApptLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', uid)
        .order('start_at', { ascending: false })
        .limit(20);

      if (!error && data) setAppointments(data as AppointmentRow[]);
      setApptLoading(false);
    };

    fetchAppointments();
  }, [ready, user]);

  const handleLogout = async () => {
    clearSession();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const upcoming = appointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
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
                  ) : upcoming.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-background/90 p-6 text-center text-sm text-muted-foreground">
                      No upcoming appointments.{' '}
                      <button onClick={() => router.push('/booking')} className="text-primary hover:underline">
                        Book one →
                      </button>
                    </div>
                  ) : (
                    upcoming.map((appt) => (
                      <div key={appt.id} className="rounded-3xl border border-border bg-background/90 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{appt.service_name ?? 'Service'}</p>
                            <p className="mt-1 text-xl font-bold text-foreground">
                              {new Date(appt.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <div className={`rounded-3xl px-4 py-2 text-sm font-semibold ${statusStyles[appt.status]}`}>
                            {appt.status}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span>
                            {new Date(appt.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span>{appt.duration_minutes} min</span>
                          {appt.revenue != null && (
                            <>
                              <span>•</span>
                              <span>${appt.revenue}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* All appointments history */}
              {appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').length > 0 && (
                <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-3 text-primary mb-6">
                    <div className="rounded-3xl bg-primary/15 p-3"><Clock className="w-5 h-5" /></div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em]">Past appointments</p>
                      <p className="mt-2 text-2xl font-black text-foreground">Your history</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {appointments
                      .filter(a => a.status === 'completed' || a.status === 'cancelled')
                      .map((appt) => (
                        <div key={appt.id} className="rounded-3xl border border-border bg-background/90 p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">{appt.service_name ?? 'Service'}</p>
                              <p className="mt-1 text-xl font-bold text-foreground">
                                {new Date(appt.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <div className={`rounded-3xl px-4 py-2 text-sm font-semibold ${statusStyles[appt.status]}`}>
                              {appt.status}
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span>
                              {new Date(appt.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                            <span>•</span>
                            <span>{appt.duration_minutes} min</span>
                            {appt.revenue != null && (
                              <>
                                <span>•</span>
                                <span>${appt.revenue}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
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
    </div>
  );
}