import { Home, UserCircle, Crown, BarChart3, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/app', icon: Home, label: 'Home' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/profile', icon: UserCircle, label: 'Profile' },
  { path: '/pro', icon: Crown, label: 'Pro' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur md:hidden"
      role="navigation"
      aria-label="Bottom navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors min-w-[64px] ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
