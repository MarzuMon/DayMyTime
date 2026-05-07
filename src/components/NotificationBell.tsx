import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/use-notifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const { items, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const labelFor = (n: typeof items[number]) => {
    if (n.type === 'like') return `${n.actor_name} liked your post`;
    if (n.type === 'comment') return `${n.actor_name} commented on your post`;
    return `${n.actor_name} started following you`;
  };

  return (
    <Popover onOpenChange={(o) => o && markAllRead()}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-h-96 overflow-y-auto p-0">
        <div className="p-3 border-b border-border font-medium text-sm">Notifications</div>
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li
                key={n.id}
                className={`p-3 text-sm cursor-pointer hover:bg-muted/50 ${!n.is_read ? 'bg-muted/30' : ''}`}
                onClick={() => n.post_slug && navigate(`/community/${n.post_slug}`)}
              >
                <p>{labelFor(n)}</p>
                {n.post_title && <p className="text-xs text-muted-foreground truncate mt-0.5">"{n.post_title}"</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
