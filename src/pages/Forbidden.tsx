import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <ShieldX className="h-16 w-16 text-destructive mb-4" />
      <h1 className="font-display text-3xl font-bold mb-2">403 — Access Denied</h1>
      <p className="text-muted-foreground mb-6">You don't have permission to view this page.</p>
      <Button onClick={() => navigate('/app')}>Go to App</Button>
    </div>
  );
}
