'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, RefreshCcw, Scissors, ShieldCheck, type LucideIcon } from 'lucide-react';

export type PolicyIconName = 'fileText' | 'refresh' | 'scissors' | 'shield';

const POLICY_ICONS: Record<PolicyIconName, LucideIcon> = {
  fileText: FileText,
  refresh: RefreshCcw,
  scissors: Scissors,
  shield: ShieldCheck,
};

interface PolicyLayoutProps {
  icon: PolicyIconName;
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function PolicyLayout({ icon, eyebrow, title, subtitle, lastUpdated, children }: PolicyLayoutProps) {
  const Icon = POLICY_ICONS[icon];

  return (
    <main className="relative bg-background min-h-screen overflow-hidden">
      {/* Ambient glow, matches footer treatment */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-primary rounded-full blur-[120px] opacity-[0.05]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-accent rounded-full blur-[100px] opacity-[0.05]" />
      </div>

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 no-underline mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
              <Icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xs text-primary font-semibold uppercase tracking-widest">{eyebrow}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-3">{title}</h1>
          <p className="text-base text-muted-foreground leading-relaxed">{subtitle}</p>
          <p className="text-xs text-muted-foreground mt-4">Last updated: {lastUpdated}</p>
        </motion.div>

        {/* Content card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border/60 p-6 md:p-10 space-y-8"
        >
          {children}
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-10">
          Questions about this page?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

interface PolicySectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

export function PolicySection({ number, title, children }: PolicySectionProps) {
  return (
    <section>
      <h2 className="flex items-center gap-3 text-lg font-bold text-foreground mb-3">
        <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-md w-7 h-7 flex items-center justify-center flex-shrink-0">
          {number}
        </span>
        {title}
      </h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3 pl-10">
        {children}
      </div>
    </section>
  );
}
