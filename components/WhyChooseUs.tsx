"use client";

import { motion } from 'motion/react';
import { Calendar, Award, Sparkles, Clock, Wrench, Star, ArrowUpRight, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Instant Booking',
    description: 'Book your appointment online in seconds, anytime, anywhere — no calls, no waiting.',
    color: '#6366f1',
    stat: '24/7',
    statLabel: 'Online Access',
    size: 'tall',   // spans 2 rows on large
  },
  {
    icon: Award,
    title: 'Professional Barbers',
    description: 'Experienced masters with 8+ years of expertise in precision grooming.',
    color: '#f59e0b',
    stat: '10+',
    statLabel: 'Expert Barbers',
    size: 'normal',
  },
  {
    icon: Sparkles,
    title: 'Luxury Experience',
    description: 'Premium ambiance with complimentary refreshments and relaxing atmosphere.',
    color: '#ec4899',
    stat: '5★',
    statLabel: 'Rated Service',
    size: 'normal',
  },
  {
    icon: Star,
    title: 'Premium Products',
    description: 'High-end grooming lines from top global brands — your hair deserves the best.',
    color: '#8b5cf6',
    stat: '20+',
    statLabel: 'Top Brands',
    size: 'normal',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Early morning to late evening slots available — we work around your life.',
    color: '#10b981',
    stat: '6AM–10PM',
    statLabel: 'Open Hours',
    size: 'wide',   // spans 2 cols on large
  },
  {
    icon: Wrench,
    title: 'Modern Equipment',
    description: 'Latest tools and technology for consistently perfect, clean results.',
    color: '#0ea5e9',
    stat: '100%',
    statLabel: 'Precision',
    size: 'normal',
  },
];

const perks = ['Free consultation', 'Complimentary drinks', 'Hygiene guaranteed', 'Walk-ins welcome'];

// Map size to Tailwind grid classes
const sizeClass: Record<string, string> = {
  tall:   'lg:row-span-2',
  wide:   'lg:col-span-2',
  normal: '',
};

export function WhyChooseUs() {
  return (
    <section id="about" className="relative py-28 bg-background overflow-hidden">

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full blur-[130px] opacity-[0.06]" style={{ background: 'var(--color-primary)' }} />
        <div className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] rounded-full blur-[110px] opacity-[0.06]" style={{ background: 'var(--color-accent)' }} />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
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
              Why Choose Us
            </span>
            <h2 className="text-[clamp(2.2rem,5.5vw,4rem)] font-black leading-none tracking-tight text-foreground">
              The Sahil Cutzz<br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(100deg, var(--color-primary), var(--color-accent))' }}
              >
                Difference
              </span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:max-w-xs space-y-4"
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              Combining traditional barbering craftsmanship with modern convenience — every visit is a ritual.
            </p>
            {/* Perk pills */}
            <div className="flex flex-wrap gap-2">
              {perks.map((p, i) => (
                <motion.span
                  key={p}
                  initial={{ opacity: 0, scale: 0.88 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: 'color-mix(in srgb, var(--color-card) 80%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--color-border) 70%, transparent)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--color-primary)' }} />
                  {p}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.015 }}
              className={`group relative rounded-[22px] overflow-hidden cursor-default ${sizeClass[f.size]}`}
              style={{
                background: 'var(--color-card)',
                border: '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.3s, border-color 0.3s, transform 0.3s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = f.color + '55';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${f.color}20`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }}
              />

              {/* Ambient glow */}
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ background: f.color }}
              />

              <div className={`relative flex flex-col gap-4 p-6 ${f.size === 'tall' ? 'lg:h-full lg:justify-between' : ''}`}>

                {/* Icon + stat row */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${f.color}, ${f.color}99)` }}
                  >
                    <f.icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black leading-none" style={{ color: f.color }}>{f.stat}</div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{f.statLabel}</div>
                  </div>
                </div>

                {/* Text */}
                <div>
                  <h3 className="text-base font-black text-foreground mb-2 group-hover:translate-x-0.5 transition-transform duration-200">
                    {f.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '40%' }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 + 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-0.5 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }}
                  />
                  <ArrowUpRight
                    className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-0.5 translate-x-0.5 group-hover:translate-y-0 group-hover:translate-x-0"
                    style={{ color: f.color }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Bottom banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.65 }}
          className="mt-4 relative rounded-[22px] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            boxShadow: '0 16px 60px color-mix(in srgb, var(--color-primary) 35%, transparent)',
          }}
        >
          {/* Decorative blobs inside banner */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-7">
            <div>
              <p className="text-lg font-black text-white">Ready to experience the difference?</p>
              <p className="text-sm text-white/70 mt-0.5">Join 500+ satisfied clients — your best cut is one tap away.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
              whileTap={{ scale: 0.96 }}
              className="flex-shrink-0 flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-sm font-black shadow-xl"
              style={{ color: 'var(--color-primary)' }}
            >
              Experience The Difference
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </div> */}
        </motion.div>

      </div>
    </section>
  );
}