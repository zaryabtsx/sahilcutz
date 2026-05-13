"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, Wind, Sparkles, Droplet, Palette, Clock, ArrowUpRight, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const services = [
  {
    icon: Scissors,
    title: 'Classic Haircut',
    tag: 'Bestseller',
    tagColor: '#f59e0b',
    description: 'Precision cutting tailored to your style and face shape by our master barbers.',
    duration: '30 min',
    price: '$45',
    color: '#6366f1',
    image: 'https://images.unsplash.com/photo-1759134198561-e2041049419c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=600',
  },
  {
    icon: Wind,
    title: 'Beard Trim',
    tag: 'Popular',
    tagColor: '#10b981',
    description: 'Professional beard shaping, edging, and grooming with premium oils.',
    duration: '20 min',
    price: '$25',
    color: '#10b981',
    image: 'https://images.unsplash.com/photo-1657105052497-f996284ffff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=600',
  },
  {
    icon: Sparkles,
    title: 'Haircut + Beard',
    tag: 'Best Value',
    tagColor: '#f59e0b',
    description: 'Complete grooming package for the modern gentleman. Cut, shape, style.',
    duration: '45 min',
    price: '$65',
    color: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1553521041-d168abd31de3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=600',
  },
  {
    icon: Droplet,
    title: 'Hot Towel Shave',
    tag: 'Signature',
    tagColor: '#ec4899',
    description: 'Traditional straight razor shave with hot towel treatment and aftercare balm.',
    duration: '40 min',
    price: '$55',
    color: '#ec4899',
    image: 'https://images.unsplash.com/photo-1596362601603-b74f6ef166e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=600',
  },
  {
    icon: Palette,
    title: 'Hair Coloring',
    tag: 'Premium',
    tagColor: '#8b5cf6',
    description: 'Expert color treatment, highlights, and full styling with professional products.',
    duration: '90 min',
    price: '$85',
    color: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1590540178973-02381b349071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=600',
  },
  {
    icon: Scissors,
    title: 'Classic Haircut',
    tag: 'Bestseller',
    tagColor: '#f59e0b',
    description: 'Precision cutting tailored to your style and face shape by our master barbers.',
    duration: '30 min',
    price: '$45',
    color: '#6366f1',
    image: 'https://images.unsplash.com/photo-1759134198561-e2041049419c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=600',
  },
  {
    icon: Wind,
    title: 'Beard Trim',
    tag: 'Popular',
    tagColor: '#10b981',
    description: 'Professional beard shaping, edging, and grooming with premium oils.',
    duration: '20 min',
    price: '$25',
    color: '#10b981',
    image: 'https://images.unsplash.com/photo-1657105052497-f996284ffff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=600',
  },
  {
    icon: Sparkles,
    title: 'Haircut + Beard',
    tag: 'Best Value',
    tagColor: '#f59e0b',
    description: 'Complete grooming package for the modern gentleman. Cut, shape, style.',
    duration: '45 min',
    price: '$65',
    color: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1553521041-d168abd31de3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=600',
  },
  {
    icon: Droplet,
    title: 'Hot Towel Shave',
    tag: 'Signature',
    tagColor: '#ec4899',
    description: 'Traditional straight razor shave with hot towel treatment and aftercare balm.',
    duration: '40 min',
    price: '$55',
    color: '#ec4899',
    image: 'https://images.unsplash.com/photo-1596362601603-b74f6ef166e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=600',
  },
  {
    icon: Palette,
    title: 'Hair Coloring',
    tag: 'Premium',
    tagColor: '#8b5cf6',
    description: 'Expert color treatment, highlights, and full styling with professional products.',
    duration: '90 min',
    price: '$85',
    color: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1590540178973-02381b349071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=600',
  },
];

export function Services() {
  const [active, setActive] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="services" className="relative py-28 bg-background overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-125 h-[500px] rounded-full blur-[120px] opacity-[0.07]" style={{ background: 'var(--color-primary)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.07]" style={{ background: 'var(--color-accent)' }} />
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
              style={{
                background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                color: 'var(--color-primary)',
                border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Our Services
            </span>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-none tracking-tight text-foreground">
              Premium<br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(100deg, var(--color-primary), var(--color-accent))' }}
              >
                Grooming
              </span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-muted-foreground max-w-xs text-sm leading-relaxed md:text-right"
          >
            Every cut is a craft. Every visit is an experience designed around you.
          </motion.p>
        </div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {services.map((svc, i) => {
            const isActive = active === i;
            const isHov = hovered === i;

            return (
              <motion.div
                key={svc.title}
                layout
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                onHoverStart={() => setHovered(i)}
                onHoverEnd={() => setHovered(null)}
                onClick={() => setActive(isActive ? null : i)}
                className="group relative rounded-[22px] overflow-hidden cursor-pointer select-none"
                style={{
                  border: `1px solid ${isHov || isActive ? svc.color + '55' : 'color-mix(in srgb, var(--color-border) 60%, transparent)'}`,
                  boxShadow: isActive ? `0 20px 60px ${svc.color}25` : isHov ? `0 8px 32px ${svc.color}18` : '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.3s, border-color 0.3s',
                }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Image */}
                <div className="relative h-36 overflow-hidden">
                  <ImageWithFallback
                    src={svc.image}
                    alt={svc.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Dark scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Color tint on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                    style={{ background: svc.color }}
                  />

                  {/* Tag badge */}
                  <div
                    className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: svc.tagColor + 'ee', color: '#fff' }}
                  >
                    {svc.tag}
                  </div>

                  {/* Icon */}
                  <div
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: svc.color }}
                  >
                    <svc.icon className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Body */}
                <div
                  className="p-4"
                  style={{
                    background: isHov || isActive
                      ? `color-mix(in srgb, var(--color-card) 85%, ${svc.color})`
                      : 'var(--color-card)',
                    transition: 'background 0.3s',
                  }}
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-black text-foreground leading-tight group-hover:text-[var(--svc-color)] transition-colors" style={{ '--svc-color': svc.color } as React.CSSProperties}>
                      {svc.title}
                    </h3>
                    <motion.div
                      animate={{ rotate: isHov ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: svc.color }} />
                    </motion.div>
                  </div>

                  {/* Description — expands on hover/active */}
                  <AnimatePresence initial={false}>
                    {(isHov || isActive) && (
                      <motion.p
                        key="desc"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="text-[11px] text-muted-foreground leading-relaxed mb-3 overflow-hidden"
                      >
                        {svc.description}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Meta row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)' }}>
                      <Clock className="w-3 h-3" />
                      <span className="text-[11px] font-medium">{svc.duration}</span>
                    </div>
                    <span className="text-sm font-black" style={{ color: svc.color }}>{svc.price}</span>
                  </div>

                  {/* CTA — slides in on active */}
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.button
                        key="cta"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.22 }}
                        onClick={e => e.stopPropagation()}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${svc.color}, ${svc.color}bb)` }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Book Now
                        <ChevronRight className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Bottom CTA strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl"
          style={{
            background: 'color-mix(in srgb, var(--color-card) 70%, transparent)',
            backdropFilter: 'blur(20px)',
            border: '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
          }}
        >
          <div>
            <p className="text-sm font-black text-foreground">Can't decide? Let us pick for you.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Our barbers will recommend the right service for your style.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-primary-foreground shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
          >
            Book a Consultation
            <ArrowUpRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}