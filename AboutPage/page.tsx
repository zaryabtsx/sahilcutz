'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Scissors, Award, Users, Sparkles, ArrowUpRight } from 'lucide-react';

const stats = [
  { icon: Award, value: '10+', label: 'Years of Craft' },
  { icon: Users, value: '5,000+', label: 'Clients Styled' },
  { icon: Sparkles, value: '100%', label: 'Premium Products' },
];

export default function AboutPage() {
  return (
    <main className="relative bg-background min-h-screen overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-primary rounded-full blur-[120px] opacity-[0.05]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-accent rounded-full blur-[100px] opacity-[0.05]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">

        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 no-underline mb-10">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xs text-primary font-semibold uppercase tracking-widest">Our Story</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-3">About Sahil Cutz</h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
            Premium grooming for the modern gentleman — where craft meets comfort, and every visit is a moment to reset.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-3 gap-4 mb-10"
        >
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border/60 p-5 text-center">
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border/60 p-6 md:p-10 space-y-6"
        >
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">Where We Started</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sahil Cutz was founded on a simple idea: a haircut should feel like an experience, not a chore. What began as a single chair has grown into a destination for clients who expect precision, consistency, and genuine care in every visit.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">What We Believe</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every client is different, and every cut should be too. Our barbers take the time to understand your style, your routine, and what actually works for your hair — then deliver it with the kind of detail you notice for weeks afterward.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">Why Clients Stay</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              From easy online booking to a relaxed, no-rush chair, we've built every part of the experience around respecting your time and your standards. That's the difference a real barbershop makes.
            </p>
          </section>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 text-center"
        >
          <Link href="/booking-new" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow duration-300 no-underline">
            Book Your Appointment
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}