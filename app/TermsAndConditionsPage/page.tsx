import { PolicyLayout, PolicySection } from '@/components/legal/Policylayout';

export const metadata = {
  title: 'Terms & Conditions | Sahil Cutz',
  description: 'The terms that govern booking and paying for services at Sahil Cutz.',
};

export default function TermsAndConditionsPage() {
  return (
    <PolicyLayout
      icon="fileText"
      eyebrow="Please Read Before Booking"
      title="Terms & Conditions"
      subtitle="These terms govern your use of the Sahil Cutz website and booking system, and apply to every appointment made with us."
      lastUpdated="June 27, 2026"
    >
      <PolicySection number="01" title="Bookings">
        <p>An appointment is confirmed only once you receive a confirmation message or email. Please arrive on time — appointments may be shortened or rescheduled if you arrive more than 15 minutes late, to avoid delaying other clients.</p>
      </PolicySection>

      <PolicySection number="02" title="Pricing">
        <p>All prices shown on our website and in-store are in the listed currency and are subject to change without prior notice. The price confirmed at the time of booking or service is the price you will be charged, unless additional services are requested on the day.</p>
      </PolicySection>

      <PolicySection number="03" title="Payments">
        <p>We accept payment online through our payment gateway, as well as cash and card in person, where available. Online payments are processed securely by our payment partner; Sahil Cutz is not responsible for delays or issues caused by your bank or card issuer.</p>
      </PolicySection>

      <PolicySection number="04" title="Cancellations & Rescheduling">
        <p>You may cancel or reschedule your appointment free of charge up to 24 hours before your scheduled time. Cancellations made within 24 hours, or missed appointments, may be subject to a fee as described in our Refund & Cancellation Policy.</p>
      </PolicySection>

      <PolicySection number="05" title="Conduct">
        <p>We reserve the right to refuse or end a service if a client behaves in a way that is abusive, unsafe, or disruptive to our staff or other clients.</p>
      </PolicySection>

      <PolicySection number="06" title="Liability">
        <p>While our barbers take every care during each service, Sahil Cutz is not liable for allergic reactions to products unless you have informed us of a known allergy in advance. Please tell us about any skin or scalp sensitivities before your service begins.</p>
      </PolicySection>

      <PolicySection number="07" title="Website Use">
        <p>You agree to use our website and booking system only for lawful purposes, and not to attempt to disrupt, hack, or misuse the booking system or payment gateway integration.</p>
      </PolicySection>

      <PolicySection number="08" title="Changes to These Terms">
        <p>We may revise these terms from time to time. Continued use of our booking system after changes are posted means you accept the updated terms.</p>
      </PolicySection>

      <PolicySection number="09" title="Governing Law">
        <p>These terms are governed by the laws applicable in our place of business, and any disputes will be handled in accordance with those laws.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
