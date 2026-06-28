import { PolicyLayout, PolicySection } from '@/components/legal/Policylayout';

export const metadata = {
  title: 'Refund & Cancellation Policy | Sahil Cutzz',
  description: 'Our policy for cancellations, rescheduling, and refunds on paid bookings.',
};

export default function RefundPolicyPage() {
  return (
    <PolicyLayout
      icon="refresh"
      eyebrow="Cancellations & Refunds"
      title="Refund & Cancellation Policy"
      subtitle="If your plans change, here's exactly what happens to your booking and your payment."
      lastUpdated="June 27, 2026"
    >
      <PolicySection number="01" title="Cancelling Your Appointment">
        <p>You can cancel directly from your booking confirmation or by contacting us. Cancellations made at least 24 hours before your appointment time are eligible for a full refund of any amount paid online.</p>
      </PolicySection>

      <PolicySection number="02" title="Late Cancellations">
        <p>Cancellations made less than 24 hours before your appointment are eligible for a 50% refund, since this short notice makes it difficult to fill the slot with another client.</p>
      </PolicySection>

      <PolicySection number="03" title="No-Shows">
        <p>If you do not arrive for your appointment and have not cancelled in advance, the amount paid is non-refundable.</p>
      </PolicySection>

      <PolicySection number="04" title="Rescheduling">
        <p>You can reschedule your appointment to a different time at no extra cost, as long as you do so at least 24 hours in advance. Rescheduling within 24 hours is subject to availability and may be treated as a late cancellation if no alternative slot can be arranged.</p>
      </PolicySection>

      <PolicySection number="05" title="How Refunds Are Issued">
        <p>Approved refunds are sent back to the original payment method used at checkout, through our payment gateway. Refund processing times depend on your bank or payment provider, and typically take 3–10 business days to appear in your account.</p>
      </PolicySection>

      <PolicySection number="06" title="Service Issues">
        <p>If you are unhappy with a service you received, please let our staff know before you leave, or contact us within 48 hours. We will offer a complimentary fix where reasonable, and may offer a partial or full refund at our discretion if the issue cannot be resolved.</p>
      </PolicySection>

      <PolicySection number="07" title="Cancellations by Sahil Cutzz">
        <p>On rare occasions we may need to cancel or reschedule an appointment (for example, due to staff illness). In this case you will be offered a full refund or a free rebooking at your preference, no questions asked.</p>
      </PolicySection>

      <PolicySection number="08" title="Need Help?">
        <p>For any cancellation or refund request, please use the booking system or reach out through our Contact page with your booking reference, and we&apos;ll take care of it quickly.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
