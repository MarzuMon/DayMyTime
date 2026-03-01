import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { useAdminSetting } from '@/hooks/use-admin-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Sun, Moon, Users, CalendarDays, BarChart3,
  Settings, CreditCard, Megaphone, LayoutTemplate, IndianRupee, Save
} from 'lucide-react';

interface AdPlacement {
  id: string;
  name: string;
  enabled: boolean;
  type: 'banner' | 'interstitial' | 'reward';
}

interface ProFeature {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

const DEFAULT_ADS: AdPlacement[] = [
  { id: 'home_banner', name: 'Home Banner', enabled: true, type: 'banner' },
  { id: 'schedule_interstitial', name: 'Schedule Interstitial', enabled: false, type: 'interstitial' },
  { id: 'reward_extra', name: 'Reward for Extra Schedules', enabled: true, type: 'reward' },
];

const DEFAULT_PRO: ProFeature[] = [
  { id: 'cloud_sync', name: 'Cloud Sync', enabled: true, description: 'Sync schedules across devices' },
  { id: 'unlimited', name: 'Unlimited Schedules', enabled: true, description: 'Remove daily limit' },
  { id: 'analytics', name: 'Advanced Analytics', enabled: false, description: 'Detailed usage analytics' },
];

export default function Author() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const { value: ads, save: saveAds, loading: adsLoading } = useAdminSetting<AdPlacement[]>('ad_placements', DEFAULT_ADS);
  const { value: proFeatures, save: saveProFeatures, loading: proLoading } = useAdminSetting<ProFeature[]>('pro_features', DEFAULT_PRO);
  const { value: pricing, save: savePricing, loading: pricingLoading } = useAdminSetting<{ monthly: number; yearly: number }>('pricing', { monthly: 199, yearly: 1999 });
  const { value: adsense, save: saveAdsense, loading: adsenseLoading } = useAdminSetting<{ enabled: boolean; publisherId: string }>('adsense', { enabled: false, publisherId: '' });
  const { value: bankDetails, save: saveBankDetails, loading: bankLoading } = useAdminSetting<{ holder: string; account: string; ifsc: string; upi: string }>('bank_details', { holder: '', account: '', ifsc: '', upi: '' });

  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalSchedules: 0, activeToday: 0 });
  const [users, setUsers] = useState<{ id: string; display_name: string; is_pro: boolean; created_at: string }[]>([]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    const [schedulesRes, profilesRes] = await Promise.all([
      supabase.from('schedules').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);
    setStats({
      totalUsers: profilesRes.count || 0,
      totalSchedules: schedulesRes.count || 0,
      activeToday: 0,
    });
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, display_name, is_pro, created_at').order('created_at', { ascending: false }).limit(50);
    if (data) setUsers(data);
  };

  const toggleAd = (id: string) => {
    const updated = ads.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    saveAds(updated);
  };

  const toggleProFeature = (id: string) => {
    const updated = proFeatures.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
    saveProFeatures(updated);
  };

  const isLoading = adsLoading || proLoading || pricingLoading || adsenseLoading || bankLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => navigate('/app')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              <h1 className="font-display text-xl font-bold">Author Dashboard</h1>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <CalendarDays className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSchedules}</p>
                <p className="text-sm text-muted-foreground">Total Schedules</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.is_pro).length}</p>
                <p className="text-sm text-muted-foreground">Pro Users</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" /> Users</TabsTrigger>
            <TabsTrigger value="monetization"><CreditCard className="h-4 w-4 mr-1.5" /> Monetize</TabsTrigger>
            <TabsTrigger value="templates"><LayoutTemplate className="h-4 w-4 mr-1.5" /> Templates</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Key metrics for your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Signups this week</p>
                    <p className="text-xl font-bold">{users.filter(u => {
                      const d = new Date(u.created_at);
                      const week = new Date();
                      week.setDate(week.getDate() - 7);
                      return d > week;
                    }).length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Pro conversion</p>
                    <p className="text-xl font-bold">
                      {stats.totalUsers > 0 ? Math.round((users.filter(u => u.is_pro).length / stats.totalUsers) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Recent users ({users.length})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                      <div>
                        <p className="font-medium text-sm">{u.display_name || 'No name'}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(u.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_pro ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {u.is_pro ? 'Pro' : 'Free'}
                      </span>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No users yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monetization Tab */}
          <TabsContent value="monetization" className="space-y-4">
            {/* Ad Placements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Ad Placements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ads.map(ad => (
                  <div key={ad.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="font-medium text-sm">{ad.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{ad.type}</p>
                    </div>
                    <Switch checked={ad.enabled} onCheckedChange={() => toggleAd(ad.id)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pro Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4" /> Pro Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {proFeatures.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="font-medium text-sm">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </div>
                    <Switch checked={f.enabled} onCheckedChange={() => toggleProFeature(f.id)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Monthly (₹)</label>
                    <Input type="number" value={pricing.monthly} onChange={e => savePricing({ ...pricing, monthly: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Yearly (₹)</label>
                    <Input type="number" value={pricing.yearly} onChange={e => savePricing({ ...pricing, yearly: Number(e.target.value) })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AdSense */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Google AdSense</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Enable AdSense</span>
                  <Switch checked={adsense.enabled} onCheckedChange={v => saveAdsense({ ...adsense, enabled: v })} />
                </div>
                {adsense.enabled && (
                  <div>
                    <label className="text-sm font-medium">Publisher ID</label>
                    <div className="flex gap-2">
                      <Input value={adsense.publisherId} onChange={e => saveAdsense({ ...adsense, publisherId: e.target.value })} placeholder="ca-pub-XXXXXXXX" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Bank Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Account Holder</label>
                    <Input value={bankDetails.holder} onChange={e => saveBankDetails({ ...bankDetails, holder: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Account Number</label>
                    <Input value={bankDetails.account} onChange={e => saveBankDetails({ ...bankDetails, account: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">IFSC Code</label>
                    <Input value={bankDetails.ifsc} onChange={e => saveBankDetails({ ...bankDetails, ifsc: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">UPI ID</label>
                    <Input value={bankDetails.upi} onChange={e => saveBankDetails({ ...bankDetails, upi: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Template Management</CardTitle>
                <CardDescription>Manage shared schedule templates for all users</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Templates are managed per-user in the main app. Global template sharing coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
