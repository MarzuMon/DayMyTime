import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowLeft, Send, Mail, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import SEOHead from '@/components/SEOHead';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  email: z.string().trim().email('Please enter a valid email').max(255),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be under 2000 characters'),
});

export default function Contact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: result.data.name,
      email: result.data.email,
      message: result.data.message,
    });

    supabase.functions.invoke('send-contact-email', {
      body: { name: result.data.name, email: result.data.email, message: result.data.message },
    }).catch(() => {});

    setSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Message sent!', description: "We'll get back to you soon." });
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Contact Us – DayMyTime"
        description="Have a question or feedback about DayMyTime? Send us a message and we'll get back to you."
        canonical="https://daymytime.com/contact"
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

      <div className="max-w-xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">
          Have a question or feedback? Send us a message and we'll get back to you at{' '}
          <a href="mailto:ceo@daymytime.com" className="text-primary hover:underline">ceo@daymytime.com</a>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="contact-name" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" aria-hidden="true" /> Name
            </Label>
            <Input
              id="contact-name"
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              autoComplete="name"
            />
            {errors.name && <p id="name-error" className="text-sm text-destructive" role="alert">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Email
            </Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              autoComplete="email"
            />
            {errors.email && <p id="email-error" className="text-sm text-destructive" role="alert">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message" className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> Message
            </Label>
            <Textarea
              id="contact-message"
              placeholder="How can we help?"
              rows={5}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
            {errors.message && <p id="message-error" className="text-sm text-destructive" role="alert">{errors.message}</p>}
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            <Send className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {submitting ? 'Sending…' : 'Send Message'}
          </Button>
        </form>
      </div>
    </div>
  );
}
