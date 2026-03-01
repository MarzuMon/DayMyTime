import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { useAdminSetting } from '@/hooks/use-admin-settings';
import { useUserRole } from '@/hooks/use-user-role';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ArrowLeft, Sun, Moon, Users, BarChart3,
  Settings, CreditCard, Megaphone, LayoutTemplate, IndianRupee,
  Crown, TrendingUp, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import UserManagementTab from '@/components/author/UserManagementTab';
import TemplateManagementTab from '@/components/author/TemplateManagementTab';

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

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(var(--muted))',
];

export default function Author() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const { value: ads, save: saveAds, loading: adsLoading } = useAdminSetting<AdPlacement[]>('ad_placements', DEFAULT_ADS);
  const { value: proFeatures, save: saveProFeatures, loading: proLoading } = useAdminSetting<ProFeature[]>('pro_features', DEFAULT_PRO);
  const { value: pricing, save: savePricing, loading: pricingLoading } = useAdminSetting<{ monthly: number; yearly: number }>('pricing', { monthly: 199, yearly: 1999 });
  const { value: adsense, save: saveAdsense, loading: adsenseLoading } = useAdminSetting<{ enabled: boolean; publisherId: string }>('adsense', { enabled: false, publisherId: '' });
  const { value: bankDetails, save: saveBankDetails, loading: bankLoading } = useAdminSetting<{ holder: string; account: string; ifsc: string; upi: string }>('bank_details', { holder: '', account: '', ifsc: '', upi: '' });

  const [stats, setStats] = useState({ totalUsers: 0, proUsers: 0 });
  const [users, setUsers] = useState<{ id: string; display_name: string; is_pro: boolean; created_at: string }[]>([]);
  const [signupChartData, setSignupChartData] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/app', { replace: true });
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    const { data: profiles } = await supabase.from('profiles').select('id, is_pro, created_at');
    const allProfiles = profiles || [];
    const proCount = allProfiles.filter(p => p.is_pro).length;

    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const count = allProfiles.filter(p => new Date(p.created_at).toDateString() === d.toDateString()).length;
      days.push({ day: label, count });
    }
    setSignupChartData(days);
    setStats({ totalUsers: allProfiles.length, proUsers: proCount });
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, display_name, is_pro, created_at').order('created_at', { ascending: false }).limit(50);
    if (data) setUsers(data);
  };

  const toggleUserPro = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_pro: !currentStatus }).eq('id', userId);
    if (error) {
      toast.error('Failed to update user status');
      return;
    }
    toast.success(`User ${currentStatus ? 'downgraded to Free' : 'upgraded to Pro'}`);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_pro: !currentStatus } : u));
    setStats(prev => ({
      ...prev,
      proUsers: currentStatus ? prev.proUsers - 1 : prev.proUsers + 1,
    }));
  };

  const bulkTogglePro = async (userIds: string[], setToPro: boolean) => {
    const updates = userIds.map(id =>
      supabase.from('profiles').update({ is_pro: setToPro }).eq('id', id)
    );
    const results = await Promise.all(updates);
    const failures = results.filter(r => r.error).length;
    if (failures > 0) {
      toast.error(`Failed to update ${failures} user(s)`);
    }
    const succeeded = userIds.filter((_, i) => !results[i].error);
    toast.success(`${succeeded.length} user(s) ${setToPro ? 'upgraded to Pro' : 'downgraded to Free'}`);
    setUsers(prev => prev.map(u => succeeded.includes(u.id) ? { ...u, is_pro: setToPro } : u));
    fetchStats();
  };

  const toggleAd = (id: string) => {
    const updated = ads.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    saveAds(updated);
  };

  const toggleProFeature = (id: string) => {
    const updated = proFeatures.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
    saveProFeatures(updated);
  };

  const isLoading = adsLoading || proLoading || pricingLoading || adsenseLoading || bankLoading || roleLoading;

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  const proConversion = stats.totalUsers > 0 ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0;
  const freeUsers = stats.totalUsers - stats.proUsers;

  const pieData = [
    { name: 'Pro', value: stats.proUsers },
    { name: 'Free', value: freeUsers },
  ];

  const chartConfig = {
    count: { label: 'Signups', color: 'hsl(var(--primary))' },
    pro: { label: 'Pro Users', color: 'hsl(var(--primary))' },
    free: { label: 'Free Users', color: 'hsl(var(--muted))' },
  };

  // Monetization analytics
  const monthlyMRR = stats.proUsers * pricing.monthly;
  const annualARR = stats.proUsers * pricing.yearly;
  const enabledAdsCount = ads.filter(a => a.enabled).length;
  const enabledFeaturesCount = proFeatures.filter(f => f.enabled).length;

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
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h1 className="font-display text-xl font-bold">Author Dashboard</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground flex items-center gap-1">
                <Crown className="h-3 w-3" /> Admin
              </span>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats Overview — removed Total Schedules, added Monetization */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
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
              <Crown className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.proUsers}</p>
                <p className="text-sm text-muted-foreground">Pro Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{proConversion}%</p>
                <p className="text-sm text-muted-foreground">Pro Conversion</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <IndianRupee className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">₹{monthlyMRR.toLocaleString('en-IN')}</p>
                <p className="text-sm text-muted-foreground">Monthly MRR</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="pro-analytics"><Crown className="h-4 w-4 mr-1.5" /> Pro Stats</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" /> Users</TabsTrigger>
            <TabsTrigger value="monetization"><CreditCard className="h-4 w-4 mr-1.5" /> Monetize</TabsTrigger>
            <TabsTrigger value="templates"><LayoutTemplate className="h-4 w-4 mr-1.5" /> Templates</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Signups (Last 7 Days)</CardTitle>
                  <CardDescription>New user registrations by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={signupChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis allowDecimals={false} className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Key metrics overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground">Signups this week</p>
                      <p className="text-xl font-bold">{signupChartData.reduce((s, d) => s + d.count, 0)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground">Pro conversion</p>
                      <p className="text-xl font-bold">{proConversion}%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground">Free users</p>
                      <p className="text-xl font-bold">{freeUsers}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground">Active ads</p>
                      <p className="text-xl font-bold">{enabledAdsCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pro Analytics Tab */}
          <TabsContent value="pro-analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Crown className="h-4 w-4" /> Pro vs Free Users</CardTitle>
                  <CardDescription>Distribution of user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Revenue & Monetization</CardTitle>
                  <CardDescription>Revenue estimates & monetization overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground">Monthly MRR</p>
                      <p className="text-xl font-bold">₹{monthlyMRR.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground">Annual ARR</p>
                      <p className="text-xl font-bold">₹{annualARR.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground">Active Ad Placements</p>
                      <p className="text-xl font-bold">{enabledAdsCount} / {ads.length}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground">Enabled Pro Features</p>
                      <p className="text-xl font-bold">{enabledFeaturesCount} / {proFeatures.length}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Pro user list</p>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {users.filter(u => u.is_pro).length === 0 && (
                        <p className="text-xs text-muted-foreground">No pro users yet</p>
                      )}
                      {users.filter(u => u.is_pro).map(u => (
                        <div key={u.id} className="flex items-center gap-2 text-sm">
                          <Crown className="h-3 w-3 text-primary" />
                          <span>{u.display_name || 'Unnamed'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagementTab users={users} onTogglePro={toggleUserPro} onBulkToggle={bulkTogglePro} />
          </TabsContent>

          {/* Monetization Tab */}
          <TabsContent value="monetization" className="space-y-4">
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
                    <Input value={adsense.publisherId} onChange={e => saveAdsense({ ...adsense, publisherId: e.target.value })} placeholder="ca-pub-XXXXXXXX" />
                  </div>
                )}
              </CardContent>
            </Card>

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

          <TabsContent value="templates" className="space-y-4">
            <TemplateManagementTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
