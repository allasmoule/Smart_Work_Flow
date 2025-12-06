'use client';

import { useMemo } from 'react';
import { Task } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { CheckCircle2, CircleDashed, Clock, FileCheck } from 'lucide-react';

type WorkerAnalyticsProps = {
    tasks: Task[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function WorkerAnalytics({ tasks }: WorkerAnalyticsProps) {

    const statusData = useMemo(() => {
        const counts = {
            PENDING: 0,
            IN_PROGRESS: 0,
            SUBMITTED: 0,
            APPROVED: 0
        };
        tasks.forEach(t => {
            const status = t.status.toUpperCase();
            if (counts[status as keyof typeof counts] !== undefined) {
                counts[status as keyof typeof counts]++;
            }
        });
        return [
            { name: 'Pending', value: counts.PENDING },
            { name: 'In Progress', value: counts.IN_PROGRESS },
            { name: 'Submitted', value: counts.SUBMITTED },
            { name: 'Approved', value: counts.APPROVED }
        ].filter(d => d.value > 0);
    }, [tasks]);

    const priorityData = useMemo(() => {
        const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
        tasks.forEach(t => {
            const p = t.priority.toUpperCase();
            if (counts[p as keyof typeof counts] !== undefined) {
                counts[p as keyof typeof counts]++;
            }
        });
        return [
            { name: 'Low', value: counts.LOW },
            { name: 'Medium', value: counts.MEDIUM },
            { name: 'High', value: counts.HIGH }
        ];
    }, [tasks]);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">

            {/* 1. Status Distribution (Pie) */}
            <Card className="shadow-md border-indigo-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-indigo-900">Task Status</CardTitle>
                    <CardDescription>Distribution of your current workload</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Priority Breakdown (Bar) */}
            <Card className="shadow-md border-indigo-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-indigo-900">Priority Breakdown</CardTitle>
                    <CardDescription>Tasks by urgency level</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Workflow Cycle Diagram */}
            <Card className="shadow-md border-indigo-100 lg:col-span-1">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-indigo-900">Workflow Cycle</CardTitle>
                    <CardDescription>Your task progression path</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-6">
                    <div className="relative w-48 h-48">
                        {/* Connecting Circle */}
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-200 animate-[spin_10s_linear_infinite]" />

                        {/* Nodes */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-sm border border-indigo-100">
                            <Clock className="h-6 w-6 text-slate-500" />
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500">Pending</span>
                        </div>

                        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-sm border border-indigo-100">
                            <CircleDashed className="h-6 w-6 text-blue-500" />
                            <span className="absolute -right-8 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-500">Active</span>
                        </div>

                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white p-2 rounded-full shadow-sm border border-indigo-100">
                            <FileCheck className="h-6 w-6 text-indigo-500" />
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-indigo-500">Submit</span>
                        </div>

                        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-sm border border-indigo-100">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                            <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-xs font-bold text-green-500">Done</span>
                        </div>

                        {/* Center Label */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-xs text-slate-400 uppercase tracking-widest">Flow</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
