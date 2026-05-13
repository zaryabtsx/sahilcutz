'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, Clock, CalendarDays, Scissors, ArrowUpRight,
  ChevronRight, Sparkles, MapPin, Bell
} from 'lucide-react';

const SLOTS    = ['09:00 AM', '10:30 AM', '12:00 PM', '01:30 PM', '03:00 PM', '04:30 PM'];
const SERVICES = [
  { name: 'Classic Haircut', price: '$45', duration: '30 min', color: '#6366f1' },
  { name: 'Beard Trim',      price: '$25', duration: '20 min', color: '#10b981' },
  { name: 'Haircut + Beard', price: '$65', duration: '45 min', color: '#f59e0b' },
  { name: 'Hot Towel Shave', price: '$55', duration: '40 min', color: '#ec4899' },
];
const DATES = [
  { day: 'Mon', date: 12 },
  { day: 'Tue', date: 13 },
  { day: 'Wed', date: 14 },
  { day: 'Thu', date: 15 },
  { day: 'Fri', date: 16 },
  { day: 'Sat', date: 17 },
];
const STEPS = ['Service', 'Date & Time', 'Confirm'];
const PERKS = [
  { icon: Bell,         text: 'SMS reminder 1 hour before' },
  { icon: CalendarDays, text: 'Reschedule with one tap' },
  { icon: MapPin,       text: '5 min from city center' },
  { icon: Clock,        text: 'Open 6 AM – 10 PM daily' },
];

export function BookingPreview() {
  const [step, setStep]               = useState(0);
  const [selectedService, setService] = useState(0);
  const [selectedDate, setDate]       = useState(2);
  const [selectedSlot, setSlot]       = useState(4);
  const [confirmed, setConfirmed]     = useState(false);

  const svc = SERVICES[selectedService];

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => { setConfirmed(false); setStep(0); }, 3200);
  };

  return (
    <section id="booking" className="relative py-28 bg-background overflow-hidden">

      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 -left-48 w-[520px] h-[520px] rounded-full blur-[140px] opacity-[0.07]" style={{ background: 'var(--color-primary)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.06]" style={{ background: 'var(--color-accent)' }} />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section label + headline ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
              color: 'var(--color-primary)',
              border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Easy Booking
          </span>
          <h2 className="text-[clamp(2.2rem,5.5vw,4rem)] font-black leading-none tracking-tight text-foreground">
            Reserve in a moment.{' '}
            <span
              className="bg-clip-text text-transparent italic"
              style={{ backgroundImage: 'linear-gradient(100deg, var(--color-primary), var(--color-accent))' }}
            >
              Look unforgettable.
            </span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
            Pick your service and time — we handle the rest.
          </p>
        </motion.div>

        {/* ── Two column: phone left, info right ── */}
        <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">

          {/* ── PHONE MOCKUP ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:w-[340px] flex-shrink-0 mx-auto lg:mx-0"
          >
            <div
              className="relative mx-auto w-[300px] sm:w-[320px] rounded-[44px] p-[10px] shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, color-mix(in srgb, var(--color-border) 80%, transparent), color-mix(in srgb, var(--color-border) 30%, transparent))',
                boxShadow: '0 40px 80px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {/* Screen */}
              <div
                className="relative rounded-[36px] overflow-hidden"
                style={{
                  background: 'var(--color-background)',
                  border: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)',
                  minHeight: 580,
                }}
              >
                {/* Status bar */}
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                  <span className="text-[11px] font-bold text-foreground">9:41</span>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full" style={{ background: 'var(--color-foreground)' }} />
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-2 rounded-sm border border-foreground/40 flex items-center justify-end pr-0.5">
                      <div className="w-2 h-1 rounded-sm" style={{ background: 'var(--color-foreground)' }} />
                    </div>
                  </div>
                </div>

                {/* App header */}
                <div className="px-5 pb-3 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                      <Scissors className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-black text-foreground">Sahil Cutzz</span>
                  </div>
                </div>

                {/* Step bar */}
                <div className="px-5 mb-4">
                  <div className="flex gap-1">
                    {STEPS.map((s, i) => (
                      <div key={s} className="flex flex-col items-center gap-1 flex-1">
                        <div
                          className="h-1 w-full rounded-full transition-all duration-500"
                          style={{
                            background: i <= step
                              ? 'linear-gradient(90deg, var(--color-primary), var(--color-accent))'
                              : 'color-mix(in srgb, var(--color-border) 60%, transparent)',
                          }}
                        />
                        <span className="text-[9px] font-semibold" style={{ color: i <= step ? 'var(--color-primary)' : 'var(--color-muted-foreground)' }}>
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Screen body */}
                <div className="px-5 pb-6" style={{ minHeight: 440 }}>
                  <AnimatePresence mode="wait">

                    {/* STEP 0 */}
                    {step === 0 && !confirmed && (
                      <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-2">
                        <p className="text-xs font-black text-foreground mb-3">Choose a service</p>
                        {SERVICES.map((s, i) => (
                          <motion.button
                            key={s.name}
                            onClick={() => setService(i)}
                            whileTap={{ scale: 0.97 }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left"
                            style={{
                              background: selectedService === i ? `color-mix(in srgb, ${s.color} 12%, transparent)` : 'color-mix(in srgb, var(--color-border) 25%, transparent)',
                              border: `1.5px solid ${selectedService === i ? s.color + '50' : 'transparent'}`,
                            }}
                          >
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.color }}>
                              <Scissors className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground leading-tight">{s.name}</p>
                              <p className="text-[10px] text-muted-foreground">{s.duration}</p>
                            </div>
                            <span className="text-xs font-black flex-shrink-0" style={{ color: s.color }}>{s.price}</span>
                          </motion.button>
                        ))}
                        <motion.button onClick={() => setStep(1)} whileTap={{ scale: 0.97 }} className="mt-3 w-full py-3 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                          Continue <ChevronRight className="w-3.5 h-3.5" />
                        </motion.button>
                      </motion.div>
                    )}

                    {/* STEP 1 */}
                    {step === 1 && !confirmed && (
                      <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
                        <div>
                          <p className="text-xs font-black text-foreground mb-2">Pick a date</p>
                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {DATES.map((d, i) => (
                              <motion.button key={d.date} onClick={() => setDate(i)} whileTap={{ scale: 0.93 }}
                                className="flex flex-col items-center gap-0.5 px-2.5 py-2.5 rounded-2xl flex-shrink-0 min-w-[42px] transition-all"
                                style={{
                                  background: selectedDate === i ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'color-mix(in srgb, var(--color-border) 35%, transparent)',
                                  boxShadow: selectedDate === i ? '0 4px 16px color-mix(in srgb, var(--color-primary) 35%, transparent)' : 'none',
                                }}
                              >
                                <span className="text-[9px] font-semibold" style={{ color: selectedDate === i ? 'rgba(255,255,255,0.75)' : 'var(--color-muted-foreground)' }}>{d.day}</span>
                                <span className="text-sm font-black" style={{ color: selectedDate === i ? '#fff' : 'var(--color-foreground)' }}>{d.date}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground mb-2">Choose a time</p>
                          <div className="grid grid-cols-2 gap-2">
                            {SLOTS.map((s, i) => (
                              <motion.button key={s} onClick={() => setSlot(i)} whileTap={{ scale: 0.95 }}
                                className="py-2.5 rounded-xl text-xs font-bold transition-all"
                                style={{
                                  background: selectedSlot === i ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'color-mix(in srgb, var(--color-border) 30%, transparent)',
                                  color: selectedSlot === i ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                                  border: `1.5px solid ${selectedSlot === i ? 'color-mix(in srgb, var(--color-primary) 40%, transparent)' : 'transparent'}`,
                                }}
                              >
                                {s}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-muted-foreground" style={{ background: 'color-mix(in srgb, var(--color-border) 35%, transparent)' }}>Back</button>
                          <motion.button onClick={() => setStep(2)} whileTap={{ scale: 0.97 }} className="flex-[2] py-2.5 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                            Review <ChevronRight className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && !confirmed && (
                      <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-3">
                        <p className="text-xs font-black text-foreground">Confirm booking</p>
                        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'color-mix(in srgb, var(--color-border) 30%, transparent)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: svc.color }}>
                              <Scissors className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-foreground">{svc.name}</p>
                              <p className="text-[10px] text-muted-foreground">{svc.duration}</p>
                            </div>
                            <span className="ml-auto text-sm font-black" style={{ color: svc.color }}>{svc.price}</span>
                          </div>
                          <div className="h-px" style={{ background: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }} />
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> May {DATES[selectedDate].date}</span>
                            <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> {SLOTS[selectedSlot]}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-muted-foreground" style={{ background: 'color-mix(in srgb, var(--color-border) 35%, transparent)' }}>Back</button>
                          <motion.button onClick={handleConfirm} whileTap={{ scale: 0.97 }} className="flex-[2] py-2.5 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                            Confirm <Check className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* SUCCESS */}
                    {confirmed && (
                      <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col items-center justify-center text-center py-10 gap-4">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
                          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        >
                          <Check className="w-8 h-8 text-white" strokeWidth={3} />
                        </motion.div>
                        <div>
                          <p className="text-sm font-black text-foreground">You're all set!</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{svc.name} · May {DATES[selectedDate].date} · {SLOTS[selectedSlot]}</p>
                        </div>
                        <div className="w-full rounded-2xl px-4 py-3 text-[10px] flex items-center gap-2" style={{ background: 'color-mix(in srgb, #10b981 10%, transparent)', border: '1px solid color-mix(in srgb, #10b981 25%, transparent)', color: '#10b981' }}>
                          <Bell className="w-3 h-3 flex-shrink-0" /> SMS confirmation sent to your phone
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Home bar */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-20 h-1 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-border) 80%, transparent)' }} />
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT INFO ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 space-y-8 pt-4 lg:pt-8"
          >
            <div>
              <h3 className="text-2xl font-black text-foreground mb-3">
                Three steps.<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(100deg, var(--color-primary), var(--color-accent))' }}>
                  That's all it takes.
                </span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No account needed, no phone calls. Pick a service, pick a time, and we'll see you there.
              </p>
            </div>

            {/* Step cards — highlight matches current phone step */}
            <div className="space-y-3">
              {[
                { n: '01', title: 'Pick a service',   desc: 'Choose from our full menu of premium grooming services.' },
                { n: '02', title: 'Choose your slot', desc: 'See real-time availability and grab the time that fits you.' },
                { n: '03', title: "You're confirmed", desc: 'Instant SMS confirmation with a reminder before your visit.' },
              ].map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-400"
                  style={{
                    background: step === i && !confirmed ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'color-mix(in srgb, var(--color-card) 80%, transparent)',
                    border: `1px solid ${step === i && !confirmed ? 'color-mix(in srgb, var(--color-primary) 25%, transparent)' : 'color-mix(in srgb, var(--color-border) 50%, transparent)'}`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-all duration-400"
                    style={{
                      background: step === i && !confirmed ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'color-mix(in srgb, var(--color-border) 60%, transparent)',
                      color: step === i && !confirmed ? '#fff' : 'var(--color-muted-foreground)',
                    }}
                  >
                    {s.n}
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Perks grid */}
            <div className="grid grid-cols-2 gap-2">
              {PERKS.map((p, i) => (
                <motion.div
                  key={p.text}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  className="flex items-start gap-2 p-3 rounded-xl"
                  style={{
                    background: 'color-mix(in srgb, var(--color-card) 70%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--color-border) 45%, transparent)',
                  }}
                >
                  <p.icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                  <span className="text-[11px] text-muted-foreground leading-tight">{p.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 20px 48px color-mix(in srgb, var(--color-primary) 30%, transparent)' }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-black text-white shadow-xl"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
            >
              <Sparkles className="w-4 h-4" />
              Book My Appointment
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}