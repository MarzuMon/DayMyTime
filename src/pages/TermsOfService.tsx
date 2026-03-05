import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Terms of Service – DayMyTime"
        description="Read the terms and conditions for using the DayMyTime smart visual scheduler."
        canonical="https://daymytime.com/terms"
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
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 1, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using DayMyTime ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>

        <h2>2. Description of Service</h2>
        <p>DayMyTime is a visual scheduling application that helps users manage their daily tasks, meetings, and notifications. The Service is available as a free tier and a paid Pro subscription.</p>

        <h2>3. User Accounts</h2>
        <ul>
          <li>You must provide accurate information when creating an account.</li>
          <li>You are responsible for maintaining the security of your account credentials.</li>
          <li>You must be at least 13 years old to use the Service.</li>
        </ul>

        <h2>4. Pro Subscription</h2>
        <ul>
          <li>Pro subscriptions are billed monthly (₹199/mo) or annually (₹1,499/yr).</li>
          <li>Payments are processed through Razorpay.</li>
          <li>You may cancel your subscription at any time. Access continues until the end of the billing period.</li>
          <li>Refunds are handled on a case-by-case basis. Contact us for assistance.</li>
        </ul>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose.</li>
          <li>Attempt to gain unauthorized access to any part of the Service.</li>
          <li>Interfere with or disrupt the Service or its infrastructure.</li>
          <li>Upload malicious content or spam.</li>
        </ul>

        <h2>6. Intellectual Property</h2>
        <p>All content, design, and code of DayMyTime are the property of DayMyTime and are protected by intellectual property laws. You retain ownership of the data you create within the Service.</p>

        <h2>7. Limitation of Liability</h2>
        <p>DayMyTime is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>

        <h2>8. Termination</h2>
        <p>We reserve the right to suspend or terminate your account if you violate these Terms. You may delete your account at any time by contacting us.</p>

        <h2>9. Changes to Terms</h2>
        <p>We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>

        <h2>10. Contact</h2>
        <p>For questions about these Terms, contact us at <a href="mailto:ceo@daymytime.com" className="text-primary hover:underline">ceo@daymytime.com</a>.</p>
      </article>
    </div>
  );
}
