'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  MessageSquare,
  BarChart3,
  Users,
  Lock,
  FileText,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Chat',
    href: '/dashboard',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <Users className="w-5 h-5" />,
    adminOnly: true,
  },
  {
    label: 'Roles',
    href: '/admin/roles',
    icon: <Lock className="w-5 h-5" />,
    adminOnly: true,
  },
  {
    label: 'Audit Logs',
    href: '/admin/logs',
    icon: <FileText className="w-5 h-5" />,
    adminOnly: true,
  },
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
    adminOnly: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <aside className="hidden lg:block w-56 bg-slate-900/80 backdrop-blur-md border-r border-slate-800/80 h-screen sticky top-0">
      <nav className="p-3 space-y-1 h-full overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex gap-2 overflow-x-auto z-40">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-xl font-medium text-[11px] transition whitespace-nowrap',
              isActive
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
