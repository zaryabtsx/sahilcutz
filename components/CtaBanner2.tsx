import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STATS = [
  { value: "4.9★", label: "Rating" },
  { value: "2k+",  label: "Clients" },
  { value: "10+",  label: "Years" },
];

export function CtaBanner2() {
  return (
    <section className="relative h-screen overflow-hidden flex flex-col">
      {/* Background glows — uses your --primary variable */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_55%_at_50%_105%,color-mix(in_oklab,var(--primary)_28%,transparent),transparent_65%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_35%_35%_at_82%_15%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_60%)]" />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right,currentColor 1px,transparent 1px),linear-gradient(to bottom,currentColor 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Glass card — fills the viewport */}
      <div className="relative z-10 flex-1 m-6 rounded-[2rem] glass-strong border-gold-glow overflow-hidden flex flex-col items-center justify-center text-center px-6 sm:px-16">

        {/* Top radial inside card */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_70%)]" />
        {/* Bottom bloom */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 h-24 w-[120%] rounded-full bg-primary/10 blur-3xl" />

        {/* Eyebrow */}
        <p className="text-[9px] uppercase tracking-[.4em] text-primary mb-5 animate-[fadeUp_.7s_.1s_ease_both] opacity-0">
          Ready when you are
        </p>

        {/* Headline */}
        <h2 className="font-display leading-[1.02] animate-[fadeUp_.8s_.22s_ease_both] opacity-0 mb-4">
          <span className="block text-4xl sm:text-5xl lg:text-7xl text-foreground">
            Upgrade your
          </span>
          <span className="block text-4xl sm:text-5xl lg:text-7xl text-gradient-gold italic">
            grooming experience
          </span>
          <span className="block text-sm sm:text-base lg:text-lg tracking-[.35em] uppercase text-muted-foreground font-normal not-italic mt-2">
            The Sahil Cutz Ritual
          </span>
        </h2>

        {/* Divider gem */}
        <div className="flex items-center gap-3 w-full max-w-xs my-5 animate-[fadeUp_.7s_.34s_ease_both] opacity-0">
          <div className="h-px flex-1 bg-primary/25" />
          <div className="h-[6px] w-[6px] rotate-45 bg-primary" />
          <div className="h-px flex-1 bg-primary/25" />
        </div>

        {/* Subtext */}
        <p className="max-w-md text-muted-foreground text-sm leading-relaxed animate-[fadeUp_.7s_.44s_ease_both] opacity-0 mb-6">
          Your chair is waiting. Step into a ritual crafted<br className="hidden sm:block" />
          for those who demand nothing but the finest.
        </p>

        {/* Stats */}
        <div className="flex border border-primary/20 mb-7 animate-[fadeUp_.7s_.54s_ease_both] opacity-0">
          {STATS.map((s, i) => (
            <div
              key={i}
              className="px-7 py-3 cursor-default transition-colors hover:bg-primary/[0.07]"
              style={{ borderRight: i < STATS.length - 1 ? "1px solid rgba(var(--primary-rgb,201,169,110),.2)" : "none" }}
            >
              <div className="font-display text-2xl text-gradient-gold leading-none">{s.value}</div>
              <div className="text-[8px] tracking-[.25em] uppercase text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3 animate-[fadeUp_.7s_.64s_ease_both] opacity-0">
          <Link
            href="/booking-new"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-lg)] transition-all hover:bg-primary-dark hover:-translate-y-px"
          >
            Book Your Appointment
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-full glass px-8 py-3.5 text-sm font-medium text-foreground hover:border-primary/40 transition-all"
          >
            Contact Us
          </a>
        </div>
      </div>

      {/* Bottom strip */}
      {/* <div className="relative z-10 flex items-center justify-between px-12 py-3 border-t border-primary/10">
        <span className="text-[8px] tracking-[.3em] uppercase text-muted-foreground/40">
          Est. 2014 · Sahil Cutzz
        </span>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-primary text-[10px]">★</span>
          ))}
        </div>
        <span className="text-[8px] tracking-[.3em] uppercase text-muted-foreground/40">
          Open Today · 9 AM – 8 PM
        </span>
      </div> */}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}