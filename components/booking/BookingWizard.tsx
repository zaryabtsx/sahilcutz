'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, Check, Clock, MapPin, Scissors, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { initialAppointments, initialBarbers, initialServices } from '@/lib/mockData';
import { generateAvailabilitySlots } from '@/lib/scheduling';
import type { BarberProfile, ServiceItem } from '@/lib/types';

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter your email'),
  phone: z.string().min(8, 'Enter a valid phone number'),
  notes: z.string().max(120).optional(),
});

type DetailsValues = z.infer<typeof detailsSchema>;

const stepCards = [
  { label: 'Select service', description: 'Choose from our premium grooming menu.' },
  { label: 'Choose barber', description: 'Pick the stylist that fits your style.' },
  { label: 'Select date', description: 'Choose the best day for your visit.' },
  { label: 'Pick time', description: 'Available slots recalculated in real time.' },
  { label: 'Confirm details', description: 'Finalize booking with your details.' },
];

export function BookingWizard() {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(initialServices[0].id);
  const [barberId, setBarberId] = useState(initialBarbers[0].id);
  const [date, setDate] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 2);
    return next.toISOString().slice(0, 10);
  });
  const [timeSlot, setTimeSlot] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const service = useMemo(() => initialServices.find((item) => item.id === serviceId) ?? initialServices[0], [serviceId]);
  const barber = useMemo(() => initialBarbers.find((item) => item.id === barberId) ?? initialBarbers[0], [barberId]);
  const slots = useMemo(
    () => generateAvailabilitySlots(barber, date, initialAppointments, service.duration_minutes, service.buffer_minutes ?? 10),
    [barber, date, service],
  );
  const { register, handleSubmit, formState: { errors } } = useForm<DetailsValues>({ resolver: zodResolver(detailsSchema) });

  const handleConfirm = handleSubmit(async (values) => {
    if (!timeSlot) {
      setError('Please choose an available time slot.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setConfirmed(true);
      setStep(0);
    } catch {
      setError('Unable to confirm booking right now.');
    } finally {
      setSaving(false);
    }
  });

  return (
    <section className="relative py-24 bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-primary font-semibold">Premium booking engine</span>
          <h2 className="mt-6 text-4xl font-black tracking-tight text-foreground">A modern barber booking experience built for luxury appointments.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm text-muted-foreground">Smart schedules, emergency override handling, and role-aware dashboards for customers, barbers, and admins.</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-start">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stepCards.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index, duration: 0.45 }}
                  className="rounded-3xl border border-border bg-card/90 p-6"
                  style={{ borderColor: step === index ? 'var(--color-primary)' : 'var(--color-border)' }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Step {String(index + 1).padStart(2, '0')}</p>
                      <h3 className="mt-3 text-lg font-bold text-foreground">{item.label}</h3>
                    </div>
                    <div className="text-sm font-black text-primary">{step === index ? 'Current' : 'Pending'}</div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-primary">Booking summary</p>
                  <h3 className="mt-2 text-3xl font-black text-foreground">{service.name}</h3>
                </div>
                <div className="rounded-3xl bg-background/80 px-5 py-3 text-sm text-muted-foreground border border-border">{service.duration_minutes} mins + {service.buffer_minutes ?? 10} mins buffer</div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-border bg-background/90 p-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Barber</p>
                  <p className="mt-3 text-xl font-bold text-foreground">{barber.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Experience: {barber.experience_years} years</p>
                </div>
                <div className="rounded-3xl border border-border bg-background/90 p-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Price</p>
                  <p className="mt-3 text-xl font-bold text-foreground">${service.price}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Category: {service.category}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 text-primary mb-8">
              <div className="rounded-3xl bg-primary/15 p-3"><Sparkles className="w-5 h-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em]">Live booking engine</p>
                <p className="text-lg font-black text-foreground">Complete your appointment in six elegant steps.</p>
              </div>
            </div>

            <div className="space-y-6">
              {step === 0 && (
                <div className="space-y-4">
                  {initialServices.map((item) => (
                    <motion.button
                      key={item.id}
                      onClick={() => setServiceId(item.id)}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-3xl border p-4 text-left transition-all"
                      style={{
                        background: serviceId === item.id ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
                        borderColor: serviceId === item.id ? 'var(--color-primary)' : 'var(--color-border)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="text-sm font-black text-foreground">${item.price}</div>
                      </div>
                    </motion.button>
                  ))}
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(1)} className="w-full rounded-3xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-black text-primary-foreground">Continue</motion.button>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Choose your barber</p>
                    <div className="mt-4 space-y-3">
                      {initialBarbers.map((barberItem) => (
                        <motion.button
                          key={barberItem.id}
                          onClick={() => setBarberId(barberItem.id)}
                          whileTap={{ scale: 0.98 }}
                          className="w-full rounded-3xl border p-4 text-left transition-all"
                          style={{
                            background: barberId === barberItem.id ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
                            borderColor: barberId === barberItem.id ? 'var(--color-primary)' : 'var(--color-border)',
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-foreground">{barberItem.name}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{barberItem.experience_years} years experience</p>
                            </div>
                            <span className="text-sm font-black text-foreground">{barberItem.is_available ? 'Open' : 'Offline'}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(0)} className="flex-1 rounded-3xl border border-border px-4 py-3 text-sm font-semibold text-foreground">Back</button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(2)} className="flex-1 rounded-3xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-black text-primary-foreground">Next</motion.button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.35em] text-muted-foreground">Appointment date</label>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-3 w-full rounded-3xl border border-border bg-background/90 px-4 py-3 text-foreground outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="flex-1 rounded-3xl border border-border px-4 py-3 text-sm font-semibold text-foreground">Back</button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(3)} className="flex-1 rounded-3xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-black text-primary-foreground">Next</motion.button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Choose a slot</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {slots.length > 0 ? (
                        slots.map((slot) => (
                          <motion.button
                            key={slot.label}
                            onClick={() => setTimeSlot(slot.label)}
                            whileTap={{ scale: 0.98 }}
                            className="rounded-3xl border p-4 text-left transition-all"
                            style={{
                              background: timeSlot === slot.label ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
                              borderColor: timeSlot === slot.label ? 'var(--color-primary)' : 'var(--color-border)',
                            }}
                          >
                            <div className="text-sm font-semibold text-foreground">{slot.label}</div>
                            <p className="mt-2 text-xs text-muted-foreground">{service.duration_minutes} minute service</p>
                          </motion.button>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-border bg-background/90 p-6 text-sm text-muted-foreground">No slots available for this day. Try a different date or barber.</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="flex-1 rounded-3xl border border-border px-4 py-3 text-sm font-semibold text-foreground">Back</button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(4)} className="flex-1 rounded-3xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-black text-primary-foreground">Next</motion.button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <form onSubmit={handleConfirm} className="space-y-5">
                  <div className="grid gap-4">
                    <label className="block text-sm text-foreground">
                      Full name
                      <input
                        {...register('fullName')}
                        type="text"
                        placeholder="Your full name"
                        className="mt-2 w-full rounded-3xl border border-border bg-background/90 px-4 py-3 text-foreground outline-none"
                      />
                      {errors.fullName && <p className="mt-2 text-xs text-destructive">{errors.fullName.message}</p>}
                    </label>
                    <label className="block text-sm text-foreground">
                      Email address
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="you@domain.com"
                        className="mt-2 w-full rounded-3xl border border-border bg-background/90 px-4 py-3 text-foreground outline-none"
                      />
                      {errors.email && <p className="mt-2 text-xs text-destructive">{errors.email.message}</p>}
                    </label>
                    <label className="block text-sm text-foreground">
                      Phone number
                      <input
                        {...register('phone')}
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="mt-2 w-full rounded-3xl border border-border bg-background/90 px-4 py-3 text-foreground outline-none"
                      />
                      {errors.phone && <p className="mt-2 text-xs text-destructive">{errors.phone.message}</p>}
                    </label>
                    <label className="block text-sm text-foreground">
                      Notes
                      <textarea
                        {...register('notes')}
                        placeholder="Special requests or style notes"
                        className="mt-2 w-full rounded-3xl border border-border bg-background/90 px-4 py-3 text-foreground outline-none"
                        rows={3}
                      />
                      {errors.notes && <p className="mt-2 text-xs text-destructive">{errors.notes.message}</p>}
                    </label>
                  </div>

                  {error && <div className="rounded-3xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

                  <div className="rounded-3xl border border-border bg-background/90 p-5">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration_minutes} min + {service.buffer_minutes ?? 10} min buffer</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-foreground">
                      <span className="font-semibold">{date}</span>
                      <span className="font-semibold">{timeSlot || 'No slot chosen'}</span>
                    </div>
                  </div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Includes {service.buffer_minutes ?? 10} minutes buffer and intelligent conflict prevention.</p>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(3)} type="button" className="flex-1 rounded-3xl border border-border px-4 py-3 text-sm font-semibold text-foreground">Back</button>
                    <motion.button whileTap={{ scale: 0.98 }} type="submit" className="flex-1 rounded-3xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-black text-primary-foreground">{saving ? 'Booking…' : 'Confirm appointment'}</motion.button>
                  </div>
                </form>
              )}

              {confirmed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl border border-primary/20 bg-primary/10 p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-foreground">Appointment confirmed</h3>
                  <p className="mt-2 text-sm text-muted-foreground">You’re booked for {service.name} with {barber.name} on {date} at {timeSlot}. A confirmation is being sent to your inbox.</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
