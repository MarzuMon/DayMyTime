import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, User } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export default function ContactMessagesTab() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setMessages(data as ContactMessage[]);
    }
    setLoading(false);
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading messages…</p>;
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No contact messages yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{messages.length} message(s)</p>
      {messages.map((msg) => (
        <Card key={msg.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> {msg.name}
              </CardTitle>
              <Badge variant="outline" className="text-xs font-normal">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(msg.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Badge>
            </div>
            <CardDescription>
              <a href={`mailto:${msg.email}`} className="text-primary hover:underline text-xs">
                {msg.email}
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
