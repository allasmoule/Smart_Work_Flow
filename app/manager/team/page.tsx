'use client';

import { useEffect, useState } from 'react';
import { supabase, Profile, Task } from '@/lib/supabase/client';
import { WorkersList } from '@/components/admin/workers-list';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function ManagerTeamPage() {
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
            // Load workers - TODO: Filter by Team
            const { data: workersData, error: workersError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'worker');

            if (workersError) throw workersError;
            setWorkers(workersData as Profile[]);

            // Load tasks for stats
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*');

            if (tasksError) throw tasksError;
            setTasks(tasksData as Task[]);

        } catch (error) {
            console.error('Error loading team:', error);
            toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">My Team</h1>
                    <p className="text-slate-600">Monitor team performance</p>
                </div>
            </div>

            <WorkersList workers={workers} tasks={tasks} />
        </div>
    );
}
