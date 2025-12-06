'use client';

import { useState, useEffect } from 'react';
import { supabase, Task, Profile } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

type EditTaskDialogProps = {
  task: Task;
  workers: Profile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function EditTaskDialog({ task, workers, open, onOpenChange, onSuccess }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority);
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setAssignedTo(task.assigned_to || '');
    setPriority(task.priority);
    const deadlineDate = new Date(task.deadline);
    setDeadline(format(deadlineDate, "yyyy-MM-dd'T'HH:mm"));
  }, [task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          description,
          assigned_to: assignedTo || null,
          priority,
          deadline,
        })
        .eq('id', task.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update task details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Task updated successfully!</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="editTaskTitle">Task Title</Label>
            <Input
              id="editTaskTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editTaskDescription">Description</Label>
            <Textarea
              id="editTaskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editTaskWorker">Assign to Worker</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTaskPriority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editTaskDeadline">Deadline</Label>
            <Input
              id="editTaskDeadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
