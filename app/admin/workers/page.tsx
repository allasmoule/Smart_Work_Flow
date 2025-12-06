'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { supabase, Task, Profile } from '@/lib/supabase/client';
import { WorkersList } from '@/components/admin/workers-list';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
// Assuming AddWorkerDialog exists or we might need to create it later if user asks, 
// strictly user asked for /admin/workers to work and show info.

export default function AdminWorkersPage() {
    const [tasksRaw, setTasksRaw] = useState<Task[]>([]);
    const [workers, setWorkers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            // Load workers
            const { data: workersData, error: workersError } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, created_at, updated_at')
                .eq('role', 'worker')
                .order('created_at', { ascending: false });

            if (workersError) throw workersError;
            setWorkers(workersData as Profile[]);

            // Load tasks for stats
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*');

            if (tasksError) throw tasksError;
            setTasksRaw(tasksData as Task[]);

        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ProtectedRoute requiredRole="admin">
            <Layout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold">Manage Workers</h1>
                                <p className="text-slate-600">View and monitor team performance</p>
                            </div>
                        </div>
                        {/* Placeholder for Add Worker if needed later */}
                    </div>

                    <WorkersList workers={workers} tasks={tasksRaw} />
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
