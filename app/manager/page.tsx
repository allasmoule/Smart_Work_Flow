'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, ClipboardList, AlertCircle } from 'lucide-react';

export default function ManagerDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        teamMembers: 0,
        activeTasks: 0,
        pendingReviews: 0,
        overdueTasks: 0
    });

    useEffect(() => {
        // TODO: Load real stats
        setStats({
            teamMembers: 5,
            activeTasks: 12,
            pendingReviews: 3,
            overdueTasks: 1
        });
    }, []);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Manager Dashboard</h1>
                    <p className="text-slate-600">Welcome, {profile?.full_name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.teamMembers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeTasks}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">{stats.overdueTasks}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity or Task List could go here */}
                <div className="p-4 bg-white rounded-lg border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Team Overview</h2>
                    <p className="text-slate-500">Feature in progress...</p>
                </div>
            </div>
        </Layout>
    );
}
