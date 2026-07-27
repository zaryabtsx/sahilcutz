'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { CalendarDays, Clock, AlertTriangle, Check, RotateCcw, Users, Sparkles, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { applyEmergencyOverride, generateAvailabilitySlots } from '@/lib/scheduling';
import type { AppointmentItem, BarberProfile, ServiceItem } from '@/lib/types';

const BARBER: BarberProfile = {
  id: 'barber-sahil',
  name: 'Sahil',
  slug: 'sahil',
  image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
  experience_years: 10,
  bio: 'Luxury barber and schedule manager, focused on premium performance.',
  working_hours: {
    start: '09:00',
    end: '19:00',
    breaks: [{ start: '13:00', end: '14:00' }],
    off_days: ['Sun'],
  },
  is_available: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SERVICES: ServiceItem[] = [
  { id: 'service-1', name: 'Hair Cut', description: '30 min', price: 45, duration_minutes: 30, category: 'Hair', image_url: '', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'service-2', name: 'Beard Trim', description: '20 min', price: 25, duration_minutes: 20, category: 'Beard', image_url: '', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const MOCK_APPOINTMENTS: AppointmentItem[] = [
  { id: 'a1', user_id: 'u1', barber_id: 'barber-sahil', service_id: 'service-1', start_at: `${new Date().toISOString().slice(0, 10)}T09:00:00Z`, end_at: `${new Date().toISOString().slice(0, 10)}T09:30:00Z`, duration_minutes: 30, status: 'confirmed', is_emergency: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a2', user_id: 'u2', barber_id: 'barber-sahil', service_id: 'service-2', start_at: `${new Date().toISOString().slice(0, 10)}T10:00:00Z`, end_at: `${new Date().toISOString().slice(0, 10)}T10:20:00Z`, duration_minutes: 20, status: 'confirmed', is_emergency: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a3', user_id: 'u3', barber_id: 'barber-sahil', service_id: 'service-1', start_at: `${new Date().toISOString().slice(0, 10)}T11:00:00Z`, end_at: `${new Date().toISOString().slice(0, 10)}T11:30:00Z`, duration_minutes: 30, status: 'confirmed', is_emergency: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export default function BarberDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>(MOCK_APPOINTMENTS);
  const [isAvailable, setIsAvailable] = useState(BARBER.is_available);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [todayOverride, setTodayOverride] = useState<AppointmentItem | null>(null);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/auth/login');
        return;
      }
      setSession(data.session);
    }
    checkSession();
  }, [router]);

  const availableSlots = useMemo(
    () => generateAvailabilitySlots(BARBER, new Date().toISOString().slice(0, 10), appointments, 30, 10, 15),
    [appointments],
  );

  const handleEmergencyInsert = () => {
    const emergency: AppointmentItem = {
      id: 'emergency-1',
      user_id: 'emergency-user',
      barber_id: BARBER.id,
      service_id: 'service-1',
      start_at: `${new Date().toISOString().slice(0, 10)}T10:00:00Z`,
      end_at: `${new Date().toISOString().slice(0, 10)}T10:30:00Z`,
      duration_minutes: 30,
      status: 'emergency',
      is_emergency: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { updatedAppointments } = applyEmergencyOverride(appointments, emergency, 10);
    setTodayOverride(emergency);
    setAppointments(updatedAppointments.filter((item) => item.id !== 'emergency-1' || item.is_emergency));
    setEmergencyMode(true);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 space-y-8">
          <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Barber Dashboard</p>
                <h1 className="mt-4 text-4xl font-black text-foreground">Sahil’s schedule and emergency control center</h1>
              </div>
              <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                <Sparkles className="w-4 h-4" />
                Availability: {isAvailable ? 'Online' : 'Offline'}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Today’s appointments', value: appointments.length, icon: CalendarDays },
                { label: 'Confirmed', value: appointments.filter((a) => a.status === 'confirmed').length, icon: Check },
                { label: 'Emergency', value: emergencyMode ? 1 : 0, icon: AlertTriangle },
                { label: 'Live slots', value: availableSlots.length, icon: Clock },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-border bg-background/90 p-6">
                  <div className="flex items-center gap-3 text-primary"><stat.icon className="w-5 h-5" /></div>
                  <p className="mt-4 text-sm uppercase tracking-[0.35em] text-muted-foreground">{stat.label}</p>
                  <p className="mt-3 text-3xl font-black text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_0.7fr]">
            <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-primary">Today’s schedule</p>
                  <h2 className="mt-4 text-2xl font-black text-foreground">Real-time appointment management</h2>
                </div>
                <button onClick={() => setIsAvailable((prev) => !prev)} className="rounded-3xl border border-border bg-background/90 px-5 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors duration-300">
                  {isAvailable ? 'Go offline' : 'Go online'}
                </button>
              </div>

              <div className="mt-8 space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-3xl border border-border bg-background/90 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{appointment.service_id === 'service-1' ? 'Hair Cut' : 'Beard Trim'}</p>
                        <p className="mt-1 text-lg font-bold text-foreground">{new Date(appointment.start_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                        {appointment.status}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>Duration: {appointment.duration_minutes} min</span>
                      <span>Emergency: {appointment.is_emergency ? 'Yes' : 'No'}</span>
                      {appointment.status === 'shifted' && <span className="rounded-full bg-accent/10 px-3 py-1">Shifted</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-3xl bg-primary/15 p-3 text-primary"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-primary">Emergency override</p>
                    <p className="mt-2 text-base font-black text-foreground">Insert an urgent booking and shift existing clients forward gracefully.</p>
                  </div>
                </div>
                <button onClick={handleEmergencyInsert} className="mt-8 inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  Create emergency booking <ArrowUpRight className="w-4 h-4" />
                </button>
                {todayOverride && (
                  <div className="mt-6 rounded-3xl border border-border bg-background/90 p-4 text-sm text-muted-foreground">
                    Emergency booking inserted at {new Date(todayOverride.start_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Existing appointments shifted automatically.
                  </div>
                )}
              </div>

              <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.35em] font-semibold text-primary">Live availability</p>
                <p className="mt-4 text-2xl font-black text-foreground">{availableSlots.length} bookable slots</p>
                <div className="mt-6 grid gap-3">
                  {availableSlots.slice(0, 4).map((slot) => (
                    <div key={slot.startAt} className="rounded-3xl border border-border bg-background/90 px-4 py-3 text-sm text-foreground">{slot.label}</div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
