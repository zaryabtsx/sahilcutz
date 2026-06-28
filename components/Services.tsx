"use client"

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Droplet,
  Palette,
  Scissors,
  Sparkles,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { getServiceCategoryName, sortCategoryEntries } from '@/lib/serviceCategories';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  category: string | null;
  is_active?: boolean;
}

interface CategoryMeta {
  icon: LucideIcon;
  tag: string;
  description: string;
  color: string;
  image: string;
}

const categoryMeta: Record<string, CategoryMeta> = {
  'Hair Cut': {
    icon: Scissors,
    tag: 'Bestseller',
    description: 'Precision cuts, fades, and shape work tailored to your style.',
    color: '#6366f1',
    image: 'https://images.unsplash.com/photo-1759134198561-e2041049419c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=900',
  },
  Beard: {
    icon: Wind,
    tag: 'Popular',
    description: 'Sharp beard shaping, lineups, detailing, and premium finishing.',
    color: '#10b981',
    image: 'https://images.unsplash.com/photo-1657105052497-f996284ffff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=900',
  },
  Packages: {
    icon: Sparkles,
    tag: 'Best Value',
    description: 'Complete grooming combinations for a polished finish in one visit.',
    color: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1553521041-d168abd31de3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=900',
  },
  'Care & Styling': {
    icon: Droplet,
    tag: 'Signature',
    description: 'Refresh, care, styling, and skin services to finish the look.',
    color: '#ec4899',
    image: 'https://images.unsplash.com/photo-1596362601603-b74f6ef166e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=900',
  },
  Color: {
    icon: Palette,
    tag: 'Premium',
    description: 'Professional color work, blending, and detailed finishing.',
    color: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1590540178973-02381b349071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxiYXJiZXIlMjBoYWlyY3V0JTIwc2Npc3NvcnN8ZW58MXx8fHwxNzc4NTMxMTE1fDA&ixlib=rb-4.1.0&q=80&w=900',
  },
};

function fallbackMeta(category: string): CategoryMeta {
  return {
    icon: Scissors,
    tag: category,
    description: 'Professional barber service available for online booking.',
    color: '#0ea5e9',
    image: categoryMeta['Hair Cut'].image,
  };
}

function formatPrice(value: number): string {
  return `PKR ${Number(value || 0).toLocaleString()}`;
}

export function Services() {
  const [openGroup, setOpenGroup] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        const response = await fetch('/api/services?active=true');
        if (!response.ok) throw new Error('Unable to load services');

        const data = await response.json();
        const loadedServices = Array.isArray(data) ? data : data?.services ?? [];
        if (!cancelled) {
          setServices(loadedServices.filter((service: Service) => service.is_active !== false));
        }
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  const serviceGroups = useMemo(() => {
    const groups = services.reduce<Record<string, Service[]>>((acc, service) => {
      const category = getServiceCategoryName(service);
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {});

    return sortCategoryEntries(Object.entries(groups)).map(([title, options]) => {
      const meta = categoryMeta[title] ?? fallbackMeta(title);
      return {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title,
        ...meta,
        options,
      };
    });
  }, [services]);

  const selectedCount = selectedIds.length;
  const bookingHref = useMemo(() => {
    const params = new URLSearchParams();
    selectedIds.forEach((id) => params.append('services', id));
    return selectedIds.length ? `/booking?${params.toString()}` : '/booking';
  }, [selectedIds]);

  const toggleService = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <section id="services" className="relative py-28 bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="max-w-sm md:text-right"
          >
            <p className="text-muted-foreground text-sm leading-relaxed">
              Open a service, pick one or more categories, and book them together in one appointment.
            </p>
            {selectedCount > 0 && (
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary">
                {selectedCount} selected
              </p>
            )}
          </motion.div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm font-bold text-muted-foreground">
            Loading services...
          </div>
        )}

        {!loading && serviceGroups.length === 0 && (
          <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm font-bold text-muted-foreground">
            No services available right now.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {serviceGroups.map((group, i) => {
            const Icon = group.icon;
            const isOpen = openGroup === group.id;
            const selectedInGroup = group.options.filter((option) => selectedIds.includes(option.id)).length;

            return (
              <motion.article
                key={group.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-[22px] border border-border bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpenGroup(isOpen ? '' : group.id)}
                  className="w-full text-left"
                >
                  <div className="grid min-h-[220px] grid-cols-1 sm:grid-cols-[220px_1fr]">
                    <div className="relative h-56 sm:h-full">
                      <ImageWithFallback
                        src={group.image}
                        alt={group.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <span
                        className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                        style={{ background: `${group.color}ee` }}
                      >
                        {group.tag}
                      </span>
                    </div>

                    <div className="flex min-h-[220px] flex-col justify-between p-5">
                      <div>
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-2xl"
                            style={{ background: group.color }}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: group.color }}>
                            {selectedInGroup > 0 && (
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                                {selectedInGroup} selected
                              </span>
                            )}
                            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <h3 className="text-2xl font-black leading-tight text-foreground">{group.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{group.description}</p>
                      </div>
                      <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {group.options.length} categor{group.options.length === 1 ? 'y' : 'ies'}
                      </div>
                    </div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-border bg-background/60"
                    >
                      <div className="grid gap-3 p-5 sm:grid-cols-2">
                        {group.options.map((option) => {
                          const isSelected = selectedIds.includes(option.id);

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => toggleService(option.id)}
                              className={`rounded-2xl border p-4 text-left transition-colors ${
                                isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-black text-foreground">{option.name}</p>
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    {option.duration_minutes} min - {formatPrice(option.price)}
                                  </p>
                                </div>
                                {isSelected ? (
                                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                                ) : (
                                  <span className="h-5 w-5 flex-shrink-0 rounded-full border border-border" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-5 sm:flex-row"
        >
          <div>
            <p className="text-sm font-black text-foreground">
              {selectedCount > 0 ? `${selectedCount} service${selectedCount > 1 ? 's' : ''} ready to book` : 'Choose your services'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              You can add or remove services again on the booking page.
            </p>
          </div>

          <Link
            href={bookingHref}
            className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg ${
              selectedCount === 0 ? 'pointer-events-none opacity-50' : ''
            }`}
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
            aria-disabled={selectedCount === 0}
          >
            Book Now
            <ChevronRight className="h-4 w-4" />
          </Link>

          {selectedCount === 0 && (
            <Link
              href="/booking"
              className="flex items-center gap-2 text-sm font-bold text-primary"
            >
              Browse all on booking page
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}
