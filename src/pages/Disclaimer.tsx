import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

export default function Disclaimer() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Disclaimer – DayMyTime"
        description="Read the disclaimer for the DayMyTime smart visual scheduler. Understand the limitations and responsibilities."
        canonical="https://daymytime.com/disclaimer"
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
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Disclaimer</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 17, 2026</p>

        <h2>1. General Information</h2>
        <p>The information provided by DayMyTime ("we," "us," or "our") on <a href="https://daymytime.com" className="text-primary hover:underline">daymytime.com</a> (the "Site") is for general informational purposes only. All information on the Site is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site.</p>

        <h2>2. Content Disclaimer</h2>
        <p>The historical articles ("This Day in History") and productivity tips ("Today's Productivity Tip") published on this Site are curated for educational and inspirational purposes. While we strive for accuracy, we do not guarantee that all historical facts or productivity advice are complete, current, or error-free.</p>

        <h2>3. External Links Disclaimer</h2>
        <p>The Site may contain links to external websites that are not provided or maintained by us. We do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.</p>

        <h2>4. Professional Advice Disclaimer</h2>
        <p>The Site does not provide professional advice. Productivity tips and suggestions are meant for general guidance. You should consult a qualified professional for specific advice tailored to your situation.</p>

        <h2>5. Earnings Disclaimer</h2>
        <p>DayMyTime makes no guarantees regarding productivity improvements or time savings from using our service. Results may vary based on individual use and circumstances.</p>

        <h2>6. Fair Use</h2>
        <p>The Site may contain copyrighted material that has not always been specifically authorized by the copyright owner. We make such material available for educational and informational purposes. This constitutes "fair use" under copyright law.</p>

        <h2>7. Advertising Disclaimer</h2>
        <p>This Site displays advertisements served by third-party ad networks including Google AdSense. These ads may use cookies and web beacons. The ads displayed are not endorsements by DayMyTime.</p>

        <h2>8. Contact</h2>
        <p>If you have questions about this Disclaimer, contact us at <a href="mailto:ceo@daymytime.com" className="text-primary hover:underline">ceo@daymytime.com</a>.</p>
      </article>

      <footer className="border-t py-8" role="contentinfo">
        <div className="max-w-3xl mx-auto px-4">
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-4" aria-label="Footer navigation">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <a href="/about" className="hover:text-foreground transition-colors">About</a>
            <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/history" className="hover:text-foreground transition-colors">History</a>
            <a href="/todaytip" className="hover:text-foreground transition-colors">Productivity Tips</a>
          </nav>
          <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} DayMyTime. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}