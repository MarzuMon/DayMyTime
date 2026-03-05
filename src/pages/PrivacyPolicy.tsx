import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Privacy Policy – DayMyTime"
        description="Learn how DayMyTime handles your data, privacy, and security."
        canonical="https://daymytime.com/privacy"
      />
      <nav className="border-b bg-card/80 backdrop-blur sticky top-0 z-40" role="navigation">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-display font-bold text-lg">DayMyTime</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-12 sm:py-16 prose prose-sm dark:prose-invert">
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 1, 2026</p>

        <h2>1. Information We Collect</h2>
        <p>When you use DayMyTime, we collect information you provide directly:</p>
        <ul>
          <li><strong>Account data:</strong> Email address and display name when you sign up.</li>
          <li><strong>Schedule data:</strong> Titles, descriptions, times, meeting links, and alarm preferences you create.</li>
          <li><strong>Contact messages:</strong> Name, email, and message content when you reach out via our contact form.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide, maintain, and improve the DayMyTime service.</li>
          <li>To send you notifications about your schedules.</li>
          <li>To process payments for Pro subscriptions.</li>
          <li>To respond to your support inquiries.</li>
        </ul>

        <h2>3. Data Storage & Security</h2>
        <p>Your data is stored securely in our cloud infrastructure. We use industry-standard encryption for data in transit and at rest. Free-tier users may also use local browser storage, which remains entirely on your device.</p>

        <h2>4. Third-Party Services</h2>
        <p>We integrate with the following services:</p>
        <ul>
          <li><strong>Razorpay:</strong> For processing Pro subscription payments. Your payment information is handled directly by Razorpay and is never stored on our servers.</li>
          <li><strong>Meeting platforms:</strong> We store meeting links you provide but do not access your Zoom, Google Meet, or Teams accounts.</li>
        </ul>

        <h2>5. Your Rights</h2>
        <p>You can request to access, correct, or delete your personal data at any time by contacting us at <a href="mailto:ceo@daymytime.com" className="text-primary hover:underline">ceo@daymytime.com</a>.</p>

        <h2>6. Cookies</h2>
        <p>We use essential cookies for authentication and session management. We do not use tracking or advertising cookies.</p>

        <h2>7. Changes to This Policy</h2>
        <p>We may update this policy from time to time. We will notify you of any material changes by posting the new policy on this page.</p>

        <h2>8. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:ceo@daymytime.com" className="text-primary hover:underline">ceo@daymytime.com</a>.</p>
      </article>
    </div>
  );
}
