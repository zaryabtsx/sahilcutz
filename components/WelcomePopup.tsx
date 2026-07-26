'use client';

import { useEffect, useState } from 'react';
import { X, Phone, Mail, MessageCircle, MapPin, CalendarDays } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export function WelcomePopup() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!pathname) return;

    const timer = window.setTimeout(() => setOpen(true), 300);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[32px] border border-border bg-card/95 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary">Visit us</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">Book your next appointment</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Walk in to the salon for a fresh cut or book directly on WhatsApp for a quick appointment request.
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Availability may vary by worker, and the available team is supervised by Sahil.
        </p>

        <div className="mt-6 space-y-3 rounded-3xl border border-border bg-background/80 p-4 text-sm">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">+92 342 1480405</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">sahilcutzz@gmail.com</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Asghar Mall Rd, Block E Pir Choha Mohalla, Rawalpindi, 46000</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push('/booking');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-3xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <CalendarDays className="h-4 w-4" />
            Open appointment page
          </button>

          <a
            href="https://wa.me/+923421480405?text=Hello%20Sahil%20Cutz%2C%20I%20would%20like%20to%20book%20an%20appointment."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
          >
            <MessageCircle className="h-4 w-4" />
            Book via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
