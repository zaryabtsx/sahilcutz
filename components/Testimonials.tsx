"use client";

import { motion, useAnimationFrame, useMotionValue } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { useRef, useState } from 'react';


const testimonials = [
  {
    name: 'Marcus Williams',
    role: 'Business Executive',
    rating: 5,
    text: 'Best barbershop experience I\'ve ever had. The attention to detail is incredible, and the booking system makes it so convenient.',
  },
  {
    name: 'James Rodriguez',
    role: 'Entrepreneur',
    rating: 5,
    text: 'Sahil Cutzz is my go-to place for grooming. Professional service, luxury atmosphere, and always on time. Highly recommended!',
  },
  {
    name: 'David Chen',
    role: 'Creative Director',
    rating: 5,
    text: 'The combination of traditional barbering skills and modern convenience is unmatched. Every visit is consistently excellent.',
  },
  {
    name: 'Michael Thompson',
    role: 'Attorney',
    rating: 5,
    text: 'Premium quality service from start to finish. The barbers are true professionals and the ambiance is top-notch.',
  },
  {
    name: 'Robert Anderson',
    role: 'Tech Founder',
    rating: 5,
    text: 'Finally found a barbershop that understands modern men\'s grooming. The online booking system is seamless and the results are always perfect.',
  },
  {
    name: 'Daniel Martinez',
    role: 'Marketing Manager',
    rating: 5,
    text: 'Exceptional service every single time. The luxury experience and skilled barbers make it worth every penny.',
  },
];

// Duplicate for seamless infinite loop
const allTestimonials = [...testimonials, ...testimonials, ...testimonials];

function InfiniteSliderRow({
  items,
  speed = 40,
  direction = 1,
}: {
  items: typeof testimonials;
  speed?: number;
  direction?: 1 | -1;
}) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const CARD_WIDTH = 280 + 24; // card width + gap
  const TOTAL_WIDTH = CARD_WIDTH * items.length; // one set width

  useAnimationFrame((_, delta) => {
    if (paused) return;
    const moveBy = direction * (speed / 1000) * delta;
    let newX = x.get() + moveBy;

    // Reset when one full set has scrolled
    if (direction === -1 && newX < -TOTAL_WIDTH) {
      newX += TOTAL_WIDTH;
    } else if (direction === 1 && newX > 0) {
      newX -= TOTAL_WIDTH;
    }

    x.set(newX);
  });

  return (
    <div
      className="overflow-hidden w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        ref={containerRef}
        style={{ x }}
        className="flex gap-6 w-max"
      >
        {/* Three copies for seamless loop */}
        {[...items, ...items, ...items].map((testimonial, index) => (
          <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} index={index} />
        ))}
      </motion.div>
    </div>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) {
  const initials = testimonial.name.split(' ').map((n) => n[0]).join('');

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative flex-shrink-0 w-[280px] bg-card/70 backdrop-blur-2xl rounded-2xl p-5 border border-border hover:border-primary/60 transition-colors duration-500 shadow-lg hover:shadow-primary/20"
      style={{ willChange: 'transform' }}
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 70%)' }}
      />

      {/* Quote icon */}
      <div className="absolute top-4 right-4 text-primary/15 group-hover:text-primary/30 transition-colors duration-500">
        <Quote className="w-6 h-6" />
      </div>

      <div className="relative space-y-3">
        {/* Stars */}
        <div className="flex gap-0.5">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-primary text-primary" />
          ))}
        </div>

        {/* Text */}
        <p className="text-muted-foreground leading-relaxed text-[13px]">
          &ldquo;{testimonial.text}&rdquo;
        </p>

        {/* Divider */}
        <div className="relative h-px">
          <div className="absolute inset-0 bg-border" />
          <motion.div
            className="absolute inset-0 bg-primary origin-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>

        {/* Author — initials only */}
        <div className="flex items-center gap-3 pt-0.5">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground text-xs group-hover:text-primary transition-colors duration-300 truncate">
              {testimonial.name}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{testimonial.role}</p>
          </div>
          {/* Verified badge */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded-full border border-primary/20 flex-shrink-0">
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-semibold text-primary uppercase tracking-wide">Verified</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Testimonials() {
  const row1 = testimonials;
  const row2 = [...testimonials].reverse();

  return (
    <section id="testimonials" className="relative py-20 bg-gradient-to-b from-secondary to-background overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] opacity-[0.06]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-accent rounded-full blur-[120px] opacity-[0.06]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[160px] opacity-[0.03]" />
      </div>

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-primary text-xs font-semibold mb-4"
            >
              <Star className="w-3 h-3 fill-primary" />
              Client Testimonials
            </motion.span>

            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight leading-none">
              Trusted by{' '}
              <span className="relative inline-block">
                <span className="text-primary">500+</span>
                <motion.span
                  className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary origin-left"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
              </span>{' '}
              Gentlemen
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Real experiences from distinguished clients who trust us for their grooming needs, every single time.
            </p>
          </motion.div>
        </div>

        {/* Sliders — fade edges */}
        <div className="relative">
          {/* Left & right fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, hsl(var(--secondary)), transparent)' }}
          />
          <div className="absolute right-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, hsl(var(--secondary)), transparent)' }}
          />

          <div className="space-y-6">
            <InfiniteSliderRow items={row1} speed={35} direction={-1} />
            <InfiniteSliderRow items={row2} speed={28} direction={1} />
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-12 flex justify-center px-4"
        >
          {/* <div className="inline-grid grid-cols-3 divide-x divide-border bg-card/60 backdrop-blur-2xl rounded-3xl border border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden">
            {[
              { value: '4.9/5', label: 'Average Rating', icon: '⭐' },
              { value: '500+', label: 'Happy Clients', icon: '✂️' },
              { value: '1000+', label: 'Services Done', icon: '💈' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                whileHover={{ backgroundColor: 'hsl(var(--primary) / 0.05)' }}
                className="flex flex-col items-center gap-0.5 px-7 py-4 transition-colors duration-300 cursor-default"
              >
                <span className="text-xl mb-0.5">{stat.icon}</span>
                <div className="text-2xl font-black text-primary tracking-tight">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div> */}
        </motion.div>
      </div>
    </section>
  );
}