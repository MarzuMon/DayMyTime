import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowLeft, DollarSign, Crown, BarChart3, Users, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

interface AdPlacement {
  id: string;
  name: string;
  location: string;
  enabled: boolean;
}

interface ProFeature {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([
    { id: 'banner-home', name: 'Home Banner Ad', location: 'Home screen bottom', enabled: true },
    { id: 'banner-notif', name: 'Notifications Tab Ad', location: 'Notifications tab', enabled: true },
    { id: 'interstitial', name: 'Interstitial Ad', location: 'After creating 3 schedules', enabled: false },
    { id: 'reward', name: 'Reward Ad', location: 'Unlock Pro theme for 1 day', enabled: true },
  ]);

  const [proFeatures, setProFeatures] = useState<ProFeature[]>([
    { id: 'unlimited', name: 'Unlimited Schedules', enabled: true, description: 'Remove 20/day cap' },
    { id: 'analytics', name: 'Smart Analytics', enabled: true, description: 'Time spent per category' },
    { id: 'cloud', name: 'Cloud Backup & Sync', enabled: false, description: 'Multi-device sync' },
    { id: 'tones', name: 'Custom Alarm Tones', enabled: true, description: 'Upload custom sounds' },
    { id: 'priority', name: 'Priority Notifications', enabled: true, description: 'High importance alerts' },
    { id: 'themes', name: 'All Themes', enabled: true, description: 'Dark mode + custom themes' },
    { id: 'repeat', name: 'Advanced Repeat', enabled: false, description: 'Custom repeat patterns' },
  ]);

  const [pricing, setPricing] = useState({ monthly: '4.99', yearly: '39.99' });

  const toggleAd = (id: string) => {
    setAdPlacements(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const toggleProFeature = (id: string) => {
    setProFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const stats = [
    { label: 'Total Users', value: '1,247', icon: Users, change: '+12%' },
    { label: 'Pro Subscribers', value: '89', icon: Crown, change: '+5%' },
    { label: 'Ad Revenue (MTD)', value: '$342', icon: DollarSign, change: '+8%' },
    { label: 'Conversion Rate', value: '7.1%', icon: BarChart3, change: '+0.3%' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-accent/20 px-2 py-1 rounded-full">Demo Mode</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <section>
          <h2 className="font-display font-bold text-lg mb-4">Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, change }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-primary font-medium">{change}</span>
                  </div>
                  <p className="text-2xl font-bold font-display">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ad Placements */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" /> Ad Placements
                </CardTitle>
                <CardDescription>Control where ads appear for free users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {adPlacements.map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">{ad.name}</p>
                      <p className="text-xs text-muted-foreground">{ad.location}</p>
                    </div>
                    <Switch checked={ad.enabled} onCheckedChange={() => toggleAd(ad.id)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Pro Features */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Crown className="h-4 w-4" /> Pro Features
                </CardTitle>
                <CardDescription>Toggle which features are included in Pro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {proFeatures.map((feat) => (
                  <div key={feat.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">{feat.name}</p>
                      <p className="text-xs text-muted-foreground">{feat.description}</p>
                    </div>
                    <Switch checked={feat.enabled} onCheckedChange={() => toggleProFeature(feat.id)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Pricing Controls */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" /> Pricing Configuration
              </CardTitle>
              <CardDescription>Set subscription pricing (UI placeholder — no payment integration)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-secondary/30">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Price</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-muted-foreground">$</span>
                    <input
                      type="text"
                      value={pricing.monthly}
                      onChange={(e) => setPricing(p => ({ ...p, monthly: e.target.value }))}
                      className="flex-1 bg-background border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-secondary/30">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Yearly Price</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-muted-foreground">$</span>
                    <input
                      type="text"
                      value={pricing.yearly}
                      onChange={(e) => setPricing(p => ({ ...p, yearly: e.target.value }))}
                      className="flex-1 bg-background border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">/yr</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                ⚠️ This is a UI placeholder. Connect a payment provider (Stripe) to enable real subscriptions.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}