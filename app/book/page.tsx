'use client';

import { BookingWizard } from '@/components/booking/BookingWizard';

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <BookingWizard />
    </main>
  );
}
