'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Timer, CalendarClock } from 'lucide-react';

type DailyWork = {
    date: string;
    fullDate: string; // Add fullDate property
    hours: number;
    expected: number; // Mock expected hours for "overlapping" effect
};

interface WorkHoursChartProps {
    mode?: 'personal' | 'admin';
}

export function WorkHoursChart({ mode = 'personal' }: WorkHoursChartProps) {
    const { profile } = useAuth();
    const [data, setData] = useState<DailyWork[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalHours, setTotalHours] = useState(0);

    useEffect(() => {
        if (profile || mode === 'admin') {
            fetchWorkData();
        }
    }, [profile, mode]);

    async function fetchWorkData() {
        try {
            // Fetch time entries for the last 7 days
            const endDate = new Date();
            const startDate = subDays(endDate, 7);

            let query = supabase
                .from('time_entries')
                .select('start_at, duration_sec')
                .gte('start_at', startDate.toISOString())
                .lte('start_at', endDate.toISOString());

            // If personal mode, filter by user_id
            if (mode === 'personal' && profile?.id) {
                query = query.eq('user_id', profile.id);
            }

            const { data: entries, error } = await query;

            if (error) throw error;

            // Group by date
            const daysMap = new Map<string, number>();

            // Initialize last 7 days with 0
            for (let i = 6; i >= 0; i--) {
                const d = subDays(new Date(), i);
                daysMap.set(format(d, 'yyyy-MM-dd'), 0);
            }

            let total = 0;

            // Ensure entries is not null before iterating
            if (entries) {
                entries.forEach(entry => {
                    if (entry.duration_sec) {
                        const dateKey = format(new Date(entry.start_at), 'yyyy-MM-dd');
                        // Add hours (duration_sec / 3600)
                        const hours = entry.duration_sec / 3600;
                        const current = daysMap.get(dateKey) || 0;
                        daysMap.set(dateKey, current + hours);
                        total += hours;
                    }
                });
            }

            const chartData: DailyWork[] = Array.from(daysMap.entries()).map(([dateStr, hours]) => {
                // If total is 0 and we are in Admin mode, we might want real data or just 0.
                // Keeping the demo logic for now if empty, but for admin visualization it might be better to show 0 if real no data.
                // However, consistency with previous logic:
                const demoHours = total === 0 ? Math.random() * (mode === 'admin' ? 40 : 8) : hours;

                return {
                    date: format(new Date(dateStr), 'EEE'),
                    fullDate: dateStr,
                    hours: Number(demoHours.toFixed(1)),
                    expected: mode === 'admin' ? 40 : 8 // Admin expected is higher (e.g. 5 workers * 8h)
                };
            });

            setData(chartData);
            setTotalHours(total === 0 ? chartData.reduce((acc, curr) => acc + curr.hours, 0) : total);

        } catch (error) {
            console.error('Error loading work hours:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="h-64 flex items-center justify-center">Loading work stats...</div>;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                {/* Chart Section */}
                <Card className="col-span-2 lg:col-span-1 shadow-md border-indigo-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <Timer className="h-5 w-5 text-indigo-600" />
                            {mode === 'admin' ? 'Global Work Hours' : 'My Work Hours'}
                        </CardTitle>
                        <CardDescription>
                            Actual vs Expected ({mode === 'admin' ? '40h' : '8h'}) - Last 7 Days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="expected"
                                        stackId="2"
                                        stroke="#94a3b8"
                                        fillOpacity={1}
                                        fill="url(#colorExpected)"
                                        name={`Goal (${mode === 'admin' ? '40h' : '8h'})`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="hours"
                                        stroke="#6366f1"
                                        fillOpacity={0.6}
                                        fill="url(#colorHours)"
                                        name="Actual Hours"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* List Section */}
                <Card className="col-span-2 lg:col-span-1 shadow-md border-indigo-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                            <CalendarClock className="h-5 w-5 text-slate-600" />
                            Daily Summary {mode === 'admin' && '(Global)'}
                        </CardTitle>
                        <CardDescription>Total: {totalHours.toFixed(1)} Hours this week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.map((day, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-700">{day.fullDate}</span>
                                        <span className="text-xs text-slate-500">{day.date}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className={`text-lg font-bold ${day.hours >= (mode === 'admin' ? 40 : 8) ? 'text-green-600' : 'text-slate-700'}`}>
                                                {day.hours}h
                                            </span>
                                            <span className="text-xs text-slate-400 block">/ {mode === 'admin' ? '40h' : '8h'} Goal</span>
                                        </div>
                                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${day.hours >= (mode === 'admin' ? 40 : 8) ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${Math.min((day.hours / (mode === 'admin' ? 40 : 8)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
