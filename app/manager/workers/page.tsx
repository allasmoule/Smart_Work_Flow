'use client';

import { useEffect, useState } from 'react';
import { supabase, Profile, Task } from '@/lib/supabase/client';
import { WorkersList } from '@/components/admin/workers-list';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function ManagerWorkersPage() {
    // This could be same as Team page for now, or showing ALL workers if manager can pick from pool
    // For now duplicate logic of team page but title different.
    const { profile } = useAuth();
    const [workers, setWorkers] = useState<Profile[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [profile]);

    async function loadData() {
        if (!profile) return;
        setLoading(true);
        try {
            const { data: workersData, error: workersError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'worker');

            if (workersError) throw workersError;
            setWorkers(workersData as Profile[]);

            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*');

            if (tasksError) throw tasksError;
            setTasks(tasksData as Task[]);

        } catch (error) {
            console.error('Error loading workers:', error);
            toast.error('Failed to load workers');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">All Workers</h1>
                    <p className="text-slate-600">View all workers in the system</p>
                </div>
            </div>

            <WorkersList workers={workers} tasks={tasks} />
        </div>
    );
}
