'use client';

import { useState } from 'react';
import { supabase, Task, Profile } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, AlertCircle, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EditTaskDialog } from './edit-task-dialog';

type TasksListProps = {
  tasks: Task[];
  workers: Profile[];
  onUpdate: () => void;
};

export function TasksList({ tasks, workers, onUpdate }: TasksListProps) {
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  async function handleDelete(taskId: string) {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleteTaskId(null);
    }
  }

  async function handleApprove(taskId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error approving task:', error);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'submitted':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }

  function isDelayed(task: Task) {
    return task.status !== 'approved' && new Date(task.deadline) < new Date();
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-600">No tasks yet. Create your first task!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task) => {
          const assignedWorker = task.assigned_to_profile as any;
          const delayed = isDelayed(task);

          return (
            <Card key={task.id} className={delayed ? 'border-red-300' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {delayed && (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Delayed
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-slate-600 mb-3">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Assigned: {assignedWorker ? assignedWorker.full_name : 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Due: {format(new Date(task.deadline), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>Created by: {(task as any).created_by_profile?.full_name || 'System'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {task.status === 'submitted' && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(task.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditTask(task)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTaskId(task.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTaskId && handleDelete(deleteTaskId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editTask && (
        <EditTaskDialog
          task={editTask}
          workers={workers}
          open={!!editTask}
          onOpenChange={(open) => !open && setEditTask(null)}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}
