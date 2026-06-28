import { PolicyLayout, PolicySection } from '@/components/legal/Policylayout';

export const metadata = {
  title: 'About Us | Sahil Cutzz',
  description: 'Learn about Sahil Cutzz, our grooming standards, booking experience, and client care.',
};

export default function AboutPage() {
  return (
    <PolicyLayout
      icon="scissors"
      eyebrow="About Sahil Cutzz"
      title="About Us"
      subtitle="Sahil Cutzz is built around careful grooming, clear booking, and a calm shop experience from start to finish."
      lastUpdated="June 27, 2026"
    >
      <PolicySection number="01" title="Who We Are">
        <p>Sahil Cutzz is a premium barber experience focused on sharp cuts, clean beard work, thoughtful styling, and dependable appointment management.</p>
      </PolicySection>

      <PolicySection number="02" title="How We Work">
        <p>Every appointment is handled with attention to timing, service detail, and client comfort. Our booking system helps clients choose services, select a time, and manage their visit with less waiting.</p>
      </PolicySection>

      <PolicySection number="03" title="Our Services">
        <p>Our service menu can be updated by the shop team from the admin dashboard, so clients always see the current cuts, packages, prices, and durations before booking.</p>
      </PolicySection>

      <PolicySection number="04" title="Client Care">
        <p>If you have questions about a booking, cancellation, refund, or service recommendation, contact us directly and our team will help you choose the best next step.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
