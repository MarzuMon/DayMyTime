import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowLeft, IndianRupee, Crown, BarChart3, Users, Settings, Globe, Landmark, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminSetting } from '@/hooks/use-admin-settings';

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

const defaultAds: AdPlacement[] = [
  { id: 'banner-home', name: 'Home Banner Ad', location: 'Home screen bottom', enabled: true },
  { id: 'banner-notif', name: 'Notifications Tab Ad', location: 'Notifications tab', enabled: true },
  { id: 'interstitial', name: 'Interstitial Ad', location: 'After creating 3 schedules', enabled: false },
  { id: 'reward', name: 'Reward Ad', location: 'Unlock Pro theme for 1 day', enabled: true },
];

const defaultProFeatures: ProFeature[] = [
  { id: 'unlimited', name: 'Unlimited Schedules', enabled: true, description: 'Remove 20/day cap' },
  { id: 'analytics', name: 'Smart Analytics', enabled: true, description: 'Time spent per category' },
  { id: 'cloud', name: 'Cloud Backup & Sync', enabled: false, description: 'Multi-device sync' },
  { id: 'tones', name: 'Custom Alarm Tones', enabled: true, description: 'Upload custom sounds' },
  { id: 'priority', name: 'Priority Notifications', enabled: true, description: 'High importance alerts' },
  { id: 'themes', name: 'All Themes', enabled: true, description: 'Dark mode + custom themes' },
  { id: 'repeat', name: 'Advanced Repeat', enabled: false, description: 'Custom repeat patterns' },
];

export default function Admin() {
  const navigate = useNavigate();

  const adSettings = useAdminSetting<AdPlacement[]>('ad_placements', defaultAds);
  const proSettings = useAdminSetting<ProFeature[]>('pro_features', defaultProFeatures);
  const pricingSettings = useAdminSetting('pricing', { monthly: '199', yearly: '1999' });
  const adsenseSettings = useAdminSetting('adsense', { enabled: false, publisherId: '' });
  const bankSettings = useAdminSetting('bank_details', { name: '', accountNo: '', ifsc: '', upiId: '' });

  const toggleAd = (id: string) => {
    adSettings.setValue(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const toggleProFeature = (id: string) => {
    proSettings.setValue(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const stats = [
    { label: 'Total Users', value: '1,247', icon: Users, change: '+12%' },
    { label: 'Pro Subscribers', value: '89', icon: Crown, change: '+5%' },
    { label: 'Ad Revenue (MTD)', value: '₹28,400', icon: IndianRupee, change: '+8%' },
    { label: 'Conversion Rate', value: '7.1%', icon: BarChart3, change: '+0.3%' },
  ];

  const isLoading = adSettings.loading || proSettings.loading || pricingSettings.loading;

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
            {isLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
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
                  <IndianRupee className="h-4 w-4" /> Ad Placements
                </CardTitle>
                <CardDescription>Control where ads appear for free users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {adSettings.value.map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">{ad.name}</p>
                      <p className="text-xs text-muted-foreground">{ad.location}</p>
                    </div>
                    <Switch checked={ad.enabled} onCheckedChange={() => toggleAd(ad.id)} />
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full" onClick={() => adSettings.save(adSettings.value)}>
                  <Save className="h-3 w-3 mr-1" /> Save Ad Settings
                </Button>
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
                {proSettings.value.map((feat) => (
                  <div key={feat.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">{feat.name}</p>
                      <p className="text-xs text-muted-foreground">{feat.description}</p>
                    </div>
                    <Switch checked={feat.enabled} onCheckedChange={() => toggleProFeature(feat.id)} />
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full" onClick={() => proSettings.save(proSettings.value)}>
                  <Save className="h-3 w-3 mr-1" /> Save Pro Features
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Google AdSense */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" /> Google AdSense
              </CardTitle>
              <CardDescription>Connect your AdSense account to monetize free users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
                <div>
                  <p className="text-sm font-medium">Enable AdSense</p>
                  <p className="text-xs text-muted-foreground">Show Google ads to free-tier users</p>
                </div>
                <Switch
                  checked={adsenseSettings.value.enabled}
                  onCheckedChange={(v) => adsenseSettings.setValue(prev => ({ ...prev, enabled: v }))}
                />
              </div>
              <div className="p-4 rounded-lg border bg-secondary/30">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Publisher ID</label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-muted-foreground text-sm">ca-pub-</span>
                  <input
                    type="text"
                    value={adsenseSettings.value.publisherId}
                    onChange={(e) => adsenseSettings.setValue(prev => ({ ...prev, publisherId: e.target.value }))}
                    placeholder="1234567890123456"
                    className="flex-1 bg-background border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-secondary/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Ad Format</p>
                  <p className="text-sm font-medium">Auto Ads (Recommended)</p>
                </div>
                <div className="p-3 rounded-lg border bg-secondary/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <p className={`text-sm font-medium ${adsenseSettings.value.enabled && adsenseSettings.value.publisherId ? 'text-primary' : 'text-muted-foreground'}`}>
                    {adsenseSettings.value.enabled && adsenseSettings.value.publisherId ? '● Connected' : '○ Not connected'}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => adsenseSettings.save(adsenseSettings.value)}>
                <Save className="h-3 w-3 mr-1" /> Save AdSense Settings
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Pricing Controls */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" /> Pricing Configuration
              </CardTitle>
              <CardDescription>Set subscription pricing in Indian Rupees (₹)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-secondary/30">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Price</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-muted-foreground">₹</span>
                    <input
                      type="text"
                      value={pricingSettings.value.monthly}
                      onChange={(e) => pricingSettings.setValue(prev => ({ ...prev, monthly: e.target.value }))}
                      className="flex-1 bg-background border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-secondary/30">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Yearly Price</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-muted-foreground">₹</span>
                    <input
                      type="text"
                      value={pricingSettings.value.yearly}
                      onChange={(e) => pricingSettings.setValue(prev => ({ ...prev, yearly: e.target.value }))}
                      className="flex-1 bg-background border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">/yr</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => pricingSettings.save(pricingSettings.value)}>
                <Save className="h-3 w-3 mr-1" /> Save Pricing
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Bank Account */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4" /> Bank Account (Pro Revenue)
              </CardTitle>
              <CardDescription>Add your bank details to receive Pro subscription payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: 'name' as const, label: 'Account Holder Name', placeholder: 'Your full name' },
                  { key: 'accountNo' as const, label: 'Account Number', placeholder: 'XXXXXXXXXXXX' },
                  { key: 'ifsc' as const, label: 'IFSC Code', placeholder: 'SBIN0001234' },
                  { key: 'upiId' as const, label: 'UPI ID (Optional)', placeholder: 'yourname@upi' },
                ] as const).map(({ key, label, placeholder }) => (
                  <div key={key} className="p-4 rounded-lg border bg-secondary/30">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
                    <input
                      type="text"
                      value={bankSettings.value[key]}
                      onChange={(e) => bankSettings.setValue(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full mt-2 bg-background border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5">
                <div>
                  <p className="text-sm font-medium">Verification Status</p>
                  <p className="text-xs text-muted-foreground">Bank details need verification before payouts</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">Pending</span>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => bankSettings.save(bankSettings.value)}>
                <Save className="h-3 w-3 mr-1" /> Save Bank Details
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
