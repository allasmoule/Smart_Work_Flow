'use client';

import { useEffect, useState } from 'react';
import { supabase, Task, Profile } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Users } from 'lucide-react';

export function AiTaskMonitor() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const { data: tasksData } = await supabase.from('tasks').select('*');
            const { data: profilesData } = await supabase.from('profiles').select('*');

            if (tasksData) setTasks(tasksData);
            if (profilesData) setProfiles(profilesData);
        } catch (error) {
            console.error('Error fetching data for AI Monitor:', error);
        } finally {
            setLoading(false);
        }
    }

    // AI Logic: Rule-based analysis
    const insights = {
        atRisk: tasks.filter(t => {
            const deadline = new Date(t.deadline);
            const now = new Date();
            const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
            return hoursLeft < 24 && hoursLeft > 0 && t.status !== 'SUBMITTED' && t.status !== 'APPROVED';
        }),
        overdue: tasks.filter(t => {
            const deadline = new Date(t.deadline);
            const now = new Date();
            return deadline < now && t.status !== 'SUBMITTED' && t.status !== 'APPROVED';
        }),
        overloadedWorkers: profiles.map(p => {
            const activeTasks = tasks.filter(t => t.assigned_to === p.id && t.status !== 'APPROVED').length;
            return { ...p, activeTasks };
        }).filter(p => p.activeTasks > 5) // Threshold for overload
    };

    if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">AI analyzing workflow...</div>;

    return (
        <Card className="border-indigo-100 shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-lg text-indigo-900">AI Task Monitor</CardTitle>
                </div>
                <CardDescription>Intelligent workflow insights & risk detection</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 grid gap-4">

                {/* Risk Alerts */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                        Attention Required
                    </h4>

                    {insights.overdue.length > 0 && (
                        <div className="bg-red-50 border border-red-100 p-3 rounded-md text-sm text-red-800">
                            <strong>{insights.overdue.length} Tasks Overdue!</strong> Immediate action advised.
                        </div>
                    )}

                    {insights.atRisk.length > 0 && (
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-md text-sm text-amber-800">
                            <strong>{insights.atRisk.length} Tasks At Risk</strong> (Deadline &lt; 24h).
                        </div>
                    )}

                    {insights.overdue.length === 0 && insights.atRisk.length === 0 && (
                        <div className="text-sm text-slate-500 italic">No critical risks detected. Good job!</div>
                    )}
                </div>

                {/* Worker Load */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        Worker Load Analysis
                    </h4>
                    {insights.overloadedWorkers.length > 0 ? (
                        <div className="space-y-2">
                            {insights.overloadedWorkers.map(w => (
                                <div key={w.id} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                                    <span>{w.full_name}</span>
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                        {w.activeTasks} Active Tasks - High Load
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 italic">Workload is balanced across the team.</div>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}
