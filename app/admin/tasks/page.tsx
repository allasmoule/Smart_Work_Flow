'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { supabase, Task, Profile } from '@/lib/supabase/client';
import { TasksList } from '@/components/admin/tasks-list';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { AddTaskDialog } from '@/components/admin/add-task-dialog';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminTasksPage() {
    const [tasksRaw, setTasksRaw] = useState<Task[]>([]);
    const [workers, setWorkers] = useState<Profile[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const unsubscribe = subscribeToChanges();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            // Load tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, email),
          created_by_profile:profiles!tasks_created_by_fkey(id, full_name, email)
        `)
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;
            setTasksRaw(tasksData as Task[]);

            // Load workers
            const { data: workersData, error: workersError } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, created_at, updated_at')
                .eq('role', 'worker')
                .order('created_at', { ascending: false });

            if (workersError) throw workersError;
            setWorkers(workersData as Profile[]);

        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    function subscribeToChanges() {
        const tasksChannel = supabase
            .channel('tasks-page-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => loadData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(tasksChannel);
        };
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
                                <h1 className="text-3xl font-bold">Manage Tasks</h1>
                                <p className="text-slate-600">View and manage all system tasks</p>
                            </div>
                        </div>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Task
                        </Button>
                    </div>

                    <TasksList tasks={tasksRaw} workers={workers} onUpdate={loadData} />

                    <AddTaskDialog
                        open={showCreateModal}
                        onOpenChange={setShowCreateModal}
                        workers={workers}
                        onSuccess={loadData}
                    />
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
