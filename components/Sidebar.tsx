'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Radio,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Sheet, SheetContent } from './ui/sheet';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/admin/workers', label: 'Workers', icon: Users },
  { href: '/live', label: 'Live View', icon: Radio },
];

const workerNavItems = [
  { href: '/worker', label: 'My Tasks', icon: ClipboardList },
  { href: '/live', label: 'Live View', icon: Radio },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const userRole = (profile as any)?.role?.toUpperCase() || '';
  const navItems = userRole === 'ADMIN' ? adminNavItems : workerNavItems;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b lg:hidden">
        <h2 className="text-lg font-semibold">Menu</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 border-r bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}

