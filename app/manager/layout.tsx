'use client';

import { ProtectedRoute } from '@/components/protected-route';
// Layout component is responsible for Sidebar and TopNav
// However, since admin pages use Layout individually, I might need to check if nesting Layout here works.
// Given app router, layout wraps pages. So using Layout here means all pages in /manager will have it.
import { Layout } from '@/components/Layout';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="manager">
            {children}
        </ProtectedRoute>
    );
}
