'use client';

import { BookingWizard } from '@/components/booking/BookingWizardNew';

export default function BookingPage() {
  return (
    <BookingWizard
      onComplete={(booking) => {
        console.log('Booking completed:', booking);
      }}
    />
  );
}
