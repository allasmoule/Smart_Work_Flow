'use client';

import { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        {showSidebar && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

