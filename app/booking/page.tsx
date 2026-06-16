/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Scissors, User, Clock, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import type { ServiceItem } from '@/lib/types';

const SERVICES: ServiceItem[] = [
  {
    id: 'service-1',
    name: 'Hair Cut',
    description: 'Precision haircut tailored to your style and confidence.',
    price: 45,
    duration_minutes: 30,
    category: 'Hair',
    image_url: 'https://images.unsplash.com/photo-1597262975002-c5c3b14bbd62?auto=format&fit=crop&w=900&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'service-2',
    name: 'Beard Trim',
    description: 'Sharp beard shaping and fade detail for a polished result.',
    price: 25,
    duration_minutes: 20,
    category: 'Beard',
    image_url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=900&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'service-3',
    name: 'Hair + Beard Combo',
    description: 'Complete grooming session for the full refined gentleman look.',
    price: 65,
    duration_minutes: 60,
    category: 'Combo',
    image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'service-4',
    name: 'Facial',
    description: 'Deep facial grooming with warm towel finish and infusion therapy.',
    price: 55,
    duration_minutes: 45,
    category: 'Wellness',
    image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface Barber {
  id: string;
  name: string;
}

interface Slot {
  id: string;
  barber_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function BookingPage() {
  const [step, setStep]                         = useState(0);
  const [selectedService, setSelectedService]   = useState<ServiceItem>(SERVICES[0]);
  const [selectedDate, setSelectedDate]         = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlotId, setSelectedSlotId]     = useState('');
  const [customerName, setCustomerName]         = useState('');
  const [customerEmail, setCustomerEmail]       = useState('');
  const [customerPhone, setCustomerPhone]       = useState('');
  const [confirmed, setConfirmed]               = useState(false);
  const [submitting, setSubmitting]             = useState(false);
  const [submitError, setSubmitError]           = useState('');

  // Supabase data
  const [barbers, setBarbers]                   = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber]     = useState<Barber | null>(null);
  const [slots, setSlots]                       = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots]         = useState(false);

  // ── Pre-fill from session ──────────────────────────────────
  useEffect(() => {
    const session = getSession();
    if (session?.user) {
      setCustomerName(session.user.full_name ?? '');
      setCustomerEmail(session.user.email ?? '');
      setCustomerPhone(session.user.phone ?? '');
    }
  }, []);

  // ── Fetch barbers from Supabase ────────────────────────────
  useEffect(() => {
    const fetchBarbers = async () => {
      const { data } = await supabase.from('barbers').select('id, name');
      if (data && data.length > 0) {
        setBarbers(data as Barber[]);
        setSelectedBarber(data[0] as Barber);
      }
    };
    fetchBarbers();
  }, []);

  // ── Fetch available slots from Supabase ───────────────────
  useEffect(() => {
    if (!selectedBarber || !selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlotId('');
      const { data } = await supabase
        .from('slots')
        .select('*')
        .eq('barber_id', selectedBarber.id)
        .eq('slot_date', selectedDate)
        .eq('is_available', true)
        .order('start_time', { ascending: true });
      setSlots((data ?? []) as Slot[]);
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [selectedBarber, selectedDate]);

  const currentSlot = slots.find(s => s.id === selectedSlotId);

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // ── Save to Supabase ───────────────────────────────────────
  const handleConfirm = async () => {
    if (!currentSlot || !selectedBarber) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const customSession = getSession();
      const userId = session?.user?.id ?? customSession?.user?.id ?? null;

      const startAt = `${currentSlot.slot_date}T${currentSlot.start_time}`;
      const endAt   = `${currentSlot.slot_date}T${currentSlot.end_time}`;

      // Insert appointment
      const { error: apptError } = await supabase.from('appointments').insert({
        user_id:          userId,
        barber_id:        selectedBarber.id,
        service_id:       selectedService.id,
        start_at:         startAt,
        end_at:           endAt,
        duration_minutes: selectedService.duration_minutes,
        customer_name:    customerName,
        service_name:     selectedService.name,
        appointment_date: currentSlot.slot_date,
        appointment_time: currentSlot.start_time,
        status:           'Upcoming',
        revenue:          selectedService.price,
      });

      if (apptError) { setSubmitError(apptError.message); return; }

      // Mark slot as booked
      await supabase
        .from('slots')
        .update({ is_available: false })
        .eq('id', currentSlot.id);

      setConfirmed(true);
      setTimeout(() => {
        setStep(0);
        setSelectedSlotId('');
        setConfirmed(false);
        setSubmitError('');
      }, 3200);

    } catch (err: any) {
      setSubmitError(err.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'rounded-3xl border border-border bg-background/90 px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30';

  return (
    <div className="min-h-screen bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-[520px] w-[520px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 grid gap-12 md:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-8">

            {/* ── Header + steps ── */}
            <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Smart Booking Flow</p>
                  <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground">Book your next appointment in smooth steps.</h1>
                </div>
                <div className="inline-flex items-center gap-2 rounded-3xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
                  <Sparkles className="w-4 h-4" /> Live availability
                </div>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-5">
                {['Service', 'Barber', 'Date & Time', 'Details', 'Confirm'].map((label, index) => (
                  <div
                    key={label}
                    className={`rounded-3xl border px-4 py-4 text-sm font-semibold ${step === index ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground bg-background/70'}`}
                  >
                    {index + 1}. {label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Steps ── */}
            <div className="rounded-[32px] border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-xl">

              {/* Step 0 — Service */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-3xl bg-primary/15 p-3 text-primary"><Scissors className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-primary">Choose Service</p>
                      <p className="text-base text-muted-foreground">Pick your preferred service.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {SERVICES.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`rounded-[28px] border p-5 text-left transition-all duration-300 ${selectedService.id === service.id ? 'border-primary bg-primary/10' : 'border-border bg-background/90 hover:border-primary/40'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xl font-black text-foreground">{service.name}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                          </div>
                          <div className="rounded-3xl bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">{service.duration_minutes} min</div>
                        </div>
                        <div className="mt-5 flex items-center justify-between text-sm font-semibold text-muted-foreground">
                          <span>{service.category}</span>
                          <span>${service.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 1 — Barber */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-3xl bg-accent/15 p-3 text-accent"><User className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-primary">Choose Barber</p>
                      <p className="text-base text-muted-foreground">Select your preferred barber.</p>
                    </div>
                  </div>

                  {barbers.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-background/90 p-6 text-sm text-muted-foreground flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading barbers…
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {barbers.map((barber) => (
                        <button
                          key={barber.id}
                          onClick={() => setSelectedBarber(barber)}
                          className={`rounded-[28px] border p-5 text-left transition-all duration-300 ${selectedBarber?.id === barber.id ? 'border-primary bg-primary/10' : 'border-border bg-background/90 hover:border-primary/40'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-3xl bg-primary/20 flex items-center justify-center text-2xl font-black text-primary">
                              {barber.name[0]}
                            </div>
                            <div>
                              <p className="text-xl font-black text-foreground">{barber.name}</p>
                              <p className="text-sm text-muted-foreground">Available for booking</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button onClick={() => setStep(0)} className="rounded-3xl border border-border bg-background/90 py-3 text-sm font-semibold text-muted-foreground">Back</button>
                    <button onClick={() => setStep(2)} disabled={!selectedBarber} className="rounded-3xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">View availability</button>
                  </div>
                </div>
              )}

              {/* Step 2 — Date & Time */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-3xl bg-primary/15 p-3 text-primary"><CalendarDays className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-primary">Choose Date & Time</p>
                      <p className="text-base text-muted-foreground">Pick a date and available slot.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
                      Appointment Date
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={inputCls}
                      />
                    </label>
                    <div className="rounded-3xl border border-border bg-background/90 p-4">
                      <p className="text-sm font-semibold text-foreground mb-2">Service Duration</p>
                      <p className="text-lg font-black text-foreground">{selectedService.duration_minutes} min</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedService.name}</p>
                    </div>
                  </div>

                  {/* Slots */}
                  {loadingSlots ? (
                    <div className="rounded-3xl border border-border bg-background/90 p-6 text-sm text-muted-foreground flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking availability…
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-background/90 p-6 text-sm text-muted-foreground">
                      No slots available for this date. Try another day or ask the admin to create slots.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`rounded-3xl border p-4 text-left transition-all duration-300 ${selectedSlotId === slot.id ? 'border-primary bg-primary/10' : 'border-border bg-background/90 hover:border-primary/40'}`}
                        >
                          <p className="text-lg font-black text-foreground">
                            {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{selectedService.name} • {selectedService.duration_minutes} min</p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button onClick={() => setStep(1)} className="rounded-3xl border border-border bg-background/90 py-3 text-sm font-semibold text-muted-foreground">Back</button>
                    <button onClick={() => setStep(3)} disabled={!selectedSlotId} className="rounded-3xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
                      Enter details
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Customer Details */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-3xl bg-accent/15 p-3 text-accent"><Clock className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-primary">Your Details</p>
                      <p className="text-base text-muted-foreground">Confirm your contact information.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
                      Full Name
                      <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
                      Email
                      <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-foreground sm:col-span-2">
                      Phone Number
                      <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputCls} />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button onClick={() => setStep(2)} className="rounded-3xl border border-border bg-background/90 py-3 text-sm font-semibold text-muted-foreground">Back</button>
                    <button
                      onClick={() => setStep(4)}
                      disabled={!customerName || !customerEmail || !customerPhone}
                      className="rounded-3xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
                    >
                      Review booking
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4 — Confirm */}
              {step === 4 && !confirmed && (
                <div className="space-y-8">
                  <div className="rounded-[28px] border border-border bg-background/80 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.35em] text-primary">Booking Summary</p>
                        <h2 className="mt-3 text-2xl font-black text-foreground">Confirm your appointment</h2>
                      </div>
                      <div className="rounded-3xl bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">{selectedService.category}</div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-border bg-card/90 p-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Service</p>
                        <p className="mt-3 text-lg font-black text-foreground">{selectedService.name}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{selectedService.duration_minutes} min • ${selectedService.price}</p>
                      </div>
                      <div className="rounded-3xl border border-border bg-card/90 p-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Schedule</p>
                        <p className="mt-3 text-lg font-black text-foreground">{selectedBarber?.name}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {selectedDate} • {currentSlot ? `${fmtTime(currentSlot.start_time)} – ${fmtTime(currentSlot.end_time)}` : '—'}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-border bg-card/90 p-4 sm:col-span-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Customer</p>
                        <p className="mt-3 text-lg font-black text-foreground">{customerName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{customerEmail} • {customerPhone}</p>
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {submitError}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button onClick={() => setStep(3)} className="rounded-3xl border border-border bg-background/90 py-3 text-sm font-semibold text-muted-foreground sm:w-1/2">
                      Edit details
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground disabled:opacity-60 sm:w-1/2"
                    >
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Confirm Appointment'}
                    </button>
                  </div>
                </div>
              )}

              {/* Success */}
              {confirmed && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[32px] border border-primary/30 bg-primary/10 p-6 text-center text-foreground"
                >
                  <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
                  <h3 className="text-2xl font-black">Appointment Confirmed!</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Your booking has been saved. Check your dashboard to see it.
                  </p>
                  <button
                    onClick={() => setStep(0)}
                    className="mt-6 rounded-3xl bg-foreground px-6 py-3 text-sm font-bold text-background"
                  >
                    Book another slot
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] font-semibold text-primary">Why Sahil Cutzz</p>
              <p className="mt-4 text-lg font-black text-foreground">A premium appointment system designed to feel as refined as the service.</p>
              <div className="mt-8 space-y-4 text-sm text-muted-foreground">
                {[
                  'Live slot availability — only real open times shown.',
                  'Slots auto-mark as booked once confirmed.',
                  'Emergency override managed from the admin panel.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-3 w-3 rounded-full bg-primary" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-3xl bg-primary/15 p-3 text-primary"><ShieldCheck className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-primary">Booking summary</p>
                  <p className="text-base font-black text-foreground">Your current selection</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl border border-border bg-background/90 p-4">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Service</p>
                  <p className="mt-2 text-lg font-black text-foreground">{selectedService.name}</p>
                  <p className="text-sm text-muted-foreground">${selectedService.price}</p>
                </div>
                <div className="rounded-3xl border border-border bg-background/90 p-4">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Barber</p>
                  <p className="mt-2 text-lg font-black text-foreground">{selectedBarber?.name ?? '—'}</p>
                </div>
                {currentSlot && (
                  <div className="rounded-3xl border border-border bg-background/90 p-4">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Time</p>
                    <p className="mt-2 text-lg font-black text-foreground">
                      {fmtTime(currentSlot.start_time)} – {fmtTime(currentSlot.end_time)}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedDate}</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </motion.div>
      </div>
    </div>
  );
}