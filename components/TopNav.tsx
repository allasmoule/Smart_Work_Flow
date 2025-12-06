'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { Input } from './ui/input';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { profile, signOut } = useAuth();
  const profileName = (profile as any)?.full_name || (profile as any)?.name || '';
  const initials = profileName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex items-center gap-4">
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="pl-10 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-100 transition-colors">
                <Avatar className="h-10 w-10 ring-2 ring-slate-200 hover:ring-blue-400 transition-all">
                  <AvatarImage src={(profile as any)?.image || undefined} alt={profileName || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{(profile as any)?.full_name || (profile as any)?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{(profile as any)?.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

