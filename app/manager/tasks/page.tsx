'use client';

import { useEffect, useState } from 'react';
import { TasksList } from '@/components/admin/tasks-list';
import { supabase, Task, Profile } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddTaskDialog } from '@/components/admin/add-task-dialog';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function ManagerTasksPage() {
    const { profile } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [workers, setWorkers] = useState<Profile[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [profile]);

    async function loadData() {
        if (!profile) return;
        setLoading(true);
        try {
            // Load tasks - specific to manager's team or simple filter if team not fully ready
            // For now, load all tasks as demo, but ideally filtered by team
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, email),
          created_by_profile:profiles!tasks_created_by_fkey(id, full_name, email)
        `)
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;
            setTasks(tasksData as Task[]);

            // Load workers
            const { data: workersData, error: workersError } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, created_at, updated_at')
                .eq('role', 'worker')
                .order('created_at', { ascending: false });
            // TODO: Filter only workers in my team

            if (workersError) throw workersError;
            setWorkers(workersData as Profile[]);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Team Tasks</h1>
                    <p className="text-slate-600">Manage and assign tasks to your team</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Task
                </Button>
            </div>

            <TasksList tasks={tasks} workers={workers} onUpdate={loadData} />

            <AddTaskDialog
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                workers={workers}
                onSuccess={loadData}
            />
        </div>
    );
}
