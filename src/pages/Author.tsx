import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { useUserRole } from '@/hooks/use-user-role';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ArrowLeft, Sun, Moon, Users, BarChart3,
  Search, ShieldCheck, MessageSquare, UsersRound, FileText, Mail, Crown
} from 'lucide-react';

import ContactMessagesTab from '@/components/author/ContactMessagesTab';
import SeoKeywordsTab from '@/components/author/SeoKeywordsTab';
import ContentManagementTab from '@/components/author/ContentManagementTab';
import SubscriberManagementTab from '@/components/author/SubscriberManagementTab';

export default function Author() {
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const [stats, setStats] = useState({ totalUsers: 0, totalTeams: 0, totalTeamMembers: 0 });
  const [signupChartData, setSignupChartData] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/app', { replace: true });
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    const { data: profiles } = await supabase.from('profiles').select('id, created_at');
    const allProfiles = profiles || [];

    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const count = allProfiles.filter(p => new Date(p.created_at).toDateString() === d.toDateString()).length;
      days.push({ day: label, count });
    }
    setSignupChartData(days);

    const { count: teamCount } = await supabase.from('teams').select('*', { count: 'exact', head: true });
    const { count: memberCount } = await supabase.from('team_members').select('*', { count: 'exact', head: true });

    setStats({ totalUsers: allProfiles.length, totalTeams: teamCount || 0, totalTeamMembers: memberCount || 0 });
  };

  if (roleLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  const chartConfig = {
    count: { label: 'Signups', color: 'hsl(var(--primary))' },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => navigate('/app')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h1 className="font-display text-xl font-bold">MARZOOQ Dashboard</h1>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
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
              <UsersRound className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTeams}</p>
                <p className="text-sm text-muted-foreground">Teams</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTeamMembers}</p>
                <p className="text-sm text-muted-foreground">Team Members</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="flex flex-wrap w-full h-auto gap-1">
            <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="messages"><MessageSquare className="h-4 w-4 mr-1.5" /> Messages</TabsTrigger>
            <TabsTrigger value="subscribers"><Mail className="h-4 w-4 mr-1.5" /> Subscribers</TabsTrigger>
            <TabsTrigger value="seo"><Search className="h-4 w-4 mr-1.5" /> SEO</TabsTrigger>
            <TabsTrigger value="content"><FileText className="h-4 w-4 mr-1.5" /> Content</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <ContactMessagesTab />
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-4">
            <SubscriberManagementTab />
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <SeoKeywordsTab />
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <ContentManagementTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
