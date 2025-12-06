'use client';

import { Profile, Task } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, ClipboardList, Activity } from 'lucide-react';
import { format } from 'date-fns';

type WorkersListProps = {
  workers: Profile[];
  tasks: Task[];
};

export function WorkersList({ workers, tasks }: WorkersListProps) {
  function getWorkerStats(workerId: string) {
    const workerTasks = tasks.filter((t) => t.assigned_to === workerId);
    return {
      total: workerTasks.length,
      pending: workerTasks.filter((t) => t.status === 'pending').length,
      inProgress: workerTasks.filter((t) => t.status === 'in_progress').length,
      submitted: workerTasks.filter((t) => t.status === 'submitted').length,
      approved: workerTasks.filter((t) => t.status === 'approved').length,
    };
  }

  if (workers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-600">No workers yet. Add your first worker!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workers.map((worker) => {
        const stats = getWorkerStats(worker.id);
        return (
          <Card key={worker.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{worker.full_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Mail className="h-3 w-3" />
                      <span>{worker.email}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Total Tasks</span>
                  <Badge variant="outline">{stats.total}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">In Progress</span>
                  <Badge className="bg-blue-100 text-blue-800">{stats.inProgress}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Completed</span>
                  <Badge className="bg-green-100 text-green-800">{stats.approved}</Badge>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                <span>Joined {format(new Date(worker.created_at), 'MMM dd, yyyy')}</span>
                <span className="ml-auto flex items-center gap-1">
                  <Activity className="h-3 w-3 text-green-500" />
                  Active
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
