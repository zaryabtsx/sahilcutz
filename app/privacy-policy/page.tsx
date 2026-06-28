import { PolicyLayout, PolicySection } from '@/components/legal/Policylayout';

export const metadata = {
  title: 'Privacy Policy | Sahil Cutzz',
  description: 'How Sahil Cutzz collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      icon="shield"
      eyebrow="Your Data, Protected"
      title="Privacy Policy"
      subtitle="This policy explains what information we collect when you book an appointment or use our website, and how we use, store, and protect it."
      lastUpdated="June 27, 2026"
    >
      <PolicySection number="01" title="Information We Collect">
        <p>When you book an appointment or create an account, we collect your name, phone number, email address, and appointment preferences. If you complete a payment online, our payment gateway processes your payment details directly — we do not store your card or bank account numbers on our servers.</p>
        <p>We also automatically collect basic technical information, such as browser type and pages visited, to keep the site running smoothly and secure.</p>
      </PolicySection>

      <PolicySection number="02" title="How We Use Your Information">
        <p>We use your information to confirm and manage your bookings, send appointment reminders, process payments and refunds, and respond to your questions. We may also use your contact details to share offers or updates, but only if you have not opted out.</p>
      </PolicySection>

      <PolicySection number="03" title="Payment Information">
        <p>All online payments are processed through licensed third-party payment gateways. These providers handle your payment details under their own security standards, and Sahil Cutzz never sees or stores your full card number, CVV, or banking credentials.</p>
      </PolicySection>

      <PolicySection number="04" title="Sharing Your Information">
        <p>We do not sell your personal information. We only share data with trusted service providers who help us run bookings, payments, and communications (such as our payment gateway and SMS/email providers), and only to the extent needed to provide our services.</p>
      </PolicySection>

      <PolicySection number="05" title="Data Retention">
        <p>We keep booking and account records for as long as needed to provide our services, meet legal and tax obligations, and resolve any disputes. You can request that we delete your account information at any time, subject to records we are legally required to keep.</p>
      </PolicySection>

      <PolicySection number="06" title="Your Rights">
        <p>You can ask us to review, correct, or delete the personal information we hold about you, and you can unsubscribe from marketing messages at any time using the link in those messages or by contacting us directly.</p>
      </PolicySection>

      <PolicySection number="07" title="Cookies">
        <p>Our website may use cookies to remember your preferences and understand how the site is used. You can disable cookies in your browser settings, though some features may not work as expected.</p>
      </PolicySection>

      <PolicySection number="08" title="Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;last updated&#34; date.</p>
      </PolicySection>

      <PolicySection number="09" title="Contact Us">
        <p>If you have any questions about this Privacy Policy or how your data is handled, reach out via our Contact page or email us directly.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
