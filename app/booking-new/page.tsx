'use client';

import { Suspense } from 'react';
import { BookingWizard } from '@/components/booking/BookingWizardNew';

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingWizard
        onComplete={(booking) => {
          console.log('Booking completed:', booking);
        }}
      />
    </Suspense>
  );
}
