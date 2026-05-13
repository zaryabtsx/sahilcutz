/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/purity */
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { ArrowRight, Star, Users, Clock, Sparkles, ChevronDown } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

/* ─── floating particle (SSR-safe: positions fixed, no window) ─── */
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 100}%`,
  delay: (i * 0.41) % 6,
  duration: 12 + (i * 1.3) % 10,
  size: i % 3 === 0 ? 2 : 1,
}));

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const bgY      = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity  = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const textY    = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const smoothY  = useSpring(bgY, { stiffness: 80, damping: 20 });

  const stats = [
    { icon: Star,  value: '500+',  label: 'Happy Clients',  color: '#f59e0b' },
    { icon: Users, value: '10+',   label: 'Expert Barbers', color: '#6366f1' },
    { icon: Clock, value: '15min', label: 'Avg. Wait Time', color: '#10b981' },
  ];

  const badges = ['Fade Specialists', 'Hot Towel Shave', 'Beard Design'];

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* ── Parallax background image ── */}
      <motion.div
        className="absolute inset-0 z-0 scale-110"
        style={{ y: smoothY }}
      >
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1759134198561-e2041049419c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiYXJiZXIlMjBzaG9wJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzc4NTMxMDY0fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Luxury Barber Shop"
          className="w-full h-full object-cover"
        />
        {/* Light mode: let the image breathe — reduce white wash significantly */}
        <div className="absolute inset-0 bg-linear-to-br from-background/80 via-background/55 to-background/20 opacity-80 dark:from-background/97 dark:via-background/82 dark:to-background/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent dark:via-background/20" />
        {/* Warm amber tint in light mode — kills the sterile white, adds depth */}
        <div className="absolute inset-0 dark:opacity-0" style={{ background: 'linear-gradient(120deg, rgba(180,83,9,0.12) 0%, transparent 55%)', opacity: 1 }} />
        {/* Primary color bloom — right side */}
        <div
          className="absolute inset-0 opacity-25 dark:opacity-20"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 72% 42%, color-mix(in srgb, var(--color-primary) 55%, transparent), transparent)' }}
        />
      </motion.div>

      {/* ── Floating particles ── */}
      {mounted && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {PARTICLES.map((p) => (
            <motion.span
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: p.left,
                top: '-8px',
                width: p.size,
                height: p.size,
                background: p.id % 2 === 0 ? 'var(--color-primary)' : 'var(--color-accent)',
              }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: '110vh', opacity: [0, 0.7, 0.7, 0] }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-28"
      >
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* LEFT: copy */}
          <div className="space-y-7">

            {/* Badge pill */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold backdrop-blur-sm"
              style={{
                background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
                color: 'var(--color-primary)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Premium Grooming Experience
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(2.6rem,7vw,5.2rem)] font-black leading-[1.05] tracking-tight text-foreground"
            >
              Elevate Your
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(100deg, var(--color-primary), var(--color-accent))' }}
              >
                Grooming Game
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48, duration: 0.6 }}
              className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed"
            >
              Book your haircut in seconds with <strong className="text-foreground font-semibold">Sahil Cutzz</strong>.
              Luxury barber services designed for the modern gentleman — precision cuts, zero compromise.
            </motion.p>

            {/* Specialty tags */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.6 }}
              className="flex flex-wrap gap-2"
            >
              {badges.map((b, i) => (
                <motion.span
                  key={b}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.62 + i * 0.08 }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border/60 bg-card/60 backdrop-blur-sm text-muted-foreground"
                >
                  {b}
                </motion.span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 pt-1"
            >
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 24px 48px color-mix(in srgb, var(--color-primary) 35%, transparent)' }}
                whileTap={{ scale: 0.96 }}
                className="group relative overflow-hidden px-8 py-4 rounded-2xl text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-xl"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
              >
                {/* shine sweep */}
                <motion.span
                  className="absolute inset-0 -translate-x-full bg-white/20 skew-x-12"
                  whileHover={{ translateX: '200%' }}
                  transition={{ duration: 0.5 }}
                />
                Book Appointment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-8 py-4 rounded-2xl font-bold text-base border-2 transition-all duration-300"
                style={{
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-primary)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--color-primary) 10%, transparent)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                Explore Services
              </motion.button>
            </motion.div>

            {/* Social proof strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-3 pt-2"
            >
              {/* Avatar stack */}
              <div className="flex -space-x-2">
                {['bg-rose-400', 'bg-violet-400', 'bg-amber-400', 'bg-emerald-400'].map((c, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full border-2 border-background ${c} flex items-center justify-center text-[9px] font-bold text-white`}
                  >
                    {['S', 'A', 'R', 'M'][i]}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="text-foreground font-semibold">500+</span> clients trust us monthly
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT: rich visual panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex flex-col gap-4 relative"
          >
            {/* Ambient glow behind the whole panel */}
            <div
              className="absolute -inset-8 rounded-full blur-3xl opacity-20 dark:opacity-15 pointer-events-none"
              style={{ background: 'radial-gradient(circle, var(--color-primary), var(--color-accent))' }}
            />

            {/* ── TOP ROW: 3 stat pills ── */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + index * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="group relative flex flex-col items-center text-center gap-3 rounded-3xl p-5 cursor-default overflow-hidden"
                  style={{
                    background: 'color-mix(in srgb, var(--color-card) 70%, transparent)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid color-mix(in srgb, ${stat.color} 25%, transparent)`,
                    boxShadow: `0 4px 24px ${stat.color}18`,
                  }}
                >
                  {/* Colored top-edge accent line */}
                  <div
                    className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
                    style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }}
                  />
                  {/* Soft glow always-on */}
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"
                    style={{ background: stat.color }}
                  />
                  <div
                    className="relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${stat.color}, ${stat.color}99)` }}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="relative">
                    <div className="text-2xl font-black tracking-tight" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-[11px] text-muted-foreground font-medium leading-tight mt-0.5">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── MIDDLE: Barber showcase card ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.6 }}
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'color-mix(in srgb, var(--color-card) 65%, transparent)',
                backdropFilter: 'blur(24px)',
                border: '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              }}
            >
              {/* Inner glow */}
              <div
                className="absolute inset-0 opacity-8 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
              />

              <div className="relative p-5 flex gap-5 items-center">
                {/* Barber avatar placeholder with scissors icon */}
                <div
                  className="relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-xl"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 48 48" className="w-10 h-10 text-white/80 fill-current">
                      <path d="M14 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm20 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM12.5 12c-.8 0-1.5.7-1.5 1.5 0 .5.3 1 .7 1.3L24 24 11.7 33.2c-.4.3-.7.8-.7 1.3 0 .8.7 1.5 1.5 1.5.3 0 .6-.1.9-.3l14-10.3V42h2V25.4l14 10.3c.3.2.6.3.9.3.8 0 1.5-.7 1.5-1.5 0-.5-.3-1-.7-1.3L36.3 24l12.3-9.2c.4-.3.7-.8.7-1.3 0-.8-.7-1.5-1.5-1.5-.3 0-.6.1-.9.3L33 22.6V6h-2v16.6L17.4 12.3c-.3-.2-.6-.3-.9-.3z"/>
                    </svg>
                  </div>
                  {/* Live indicator */}
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-emerald-400"
                      animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-black text-foreground">Sahil Ahmed</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'color-mix(in srgb, #10b981 15%, transparent)', color: '#10b981' }}>Available</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Master Barber · 8 yrs experience</p>
                  {/* Mini rating */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-foreground">4.9</span>
                    <span className="text-xs text-muted-foreground">(214 reviews)</span>
                  </div>
                </div>
              </div>

              {/* Specialties row */}
              <div className="px-5 pb-5 flex flex-wrap gap-2">
                {['Fade', 'Beard Trim', 'Skin Fade', 'Hot Towel'].map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                    style={{
                      background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                      color: 'var(--color-primary)',
                      border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* ── BOTTOM ROW: booking slot + wait time ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Next slot */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.55 }}
                className="relative rounded-3xl p-5 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  boxShadow: '0 8px 32px color-mix(in srgb, var(--color-primary) 40%, transparent)',
                }}
              >
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                <p className="text-[11px] font-semibold text-white/70 mb-1 uppercase tracking-wider">Next Slot</p>
                <p className="text-xl font-black text-white leading-tight">Today</p>
                <p className="text-sm font-bold text-white/90">3:00 PM</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-bold backdrop-blur-sm border border-white/20"
                >
                  Reserve →
                </motion.button>
              </motion.div>

              {/* Queue / wait time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.55 }}
                className="relative rounded-3xl p-5 overflow-hidden"
                style={{
                  background: 'color-mix(in srgb, var(--color-card) 70%, transparent)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
                }}
              >
                <div
                  className="absolute -top-3 -right-3 w-16 h-16 rounded-full blur-2xl opacity-30"
                  style={{ background: '#f59e0b' }}
                />
                <p className="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Queue</p>
                <p className="text-xl font-black text-foreground leading-tight">3 ahead</p>
                <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>~15 min wait</p>
                <div className="mt-3 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full"
                      style={{
                        background: i < 3
                          ? 'linear-gradient(90deg, var(--color-primary), var(--color-accent))'
                          : 'var(--color-border)',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* MOBILE stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="lg:hidden grid grid-cols-3 gap-3"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-3 flex flex-col items-center text-center gap-1.5"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${stat.color}cc, ${stat.color}55)` }}
                >
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-lg font-black text-foreground leading-none">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
      >
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase font-medium">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: 'var(--color-primary)' }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}