'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, Profile } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Profile[];
  onSuccess: () => void;
};

export function AddTaskDialog({ open, onOpenChange, workers, onSuccess }: AddTaskDialogProps) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!profile?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      if (!title.trim()) {
        setError('Task title is required');
        setLoading(false);
        return;
      }

      if (!deadline) {
        setError('Deadline is required');
        setLoading(false);
        return;
      }

      // Convert deadline from datetime-local to ISO string
      const deadlineDate = new Date(deadline).toISOString();

      const { error } = await supabase.from('tasks').insert({
        title: title.trim(),
        description: description.trim() || '',
        assigned_to: assignedTo || null,
        created_by: profile.id,
        priority: priority || 'medium',
        deadline: deadlineDate,
        status: 'pending',
      });

      if (error) {
        console.error('Supabase error:', error);
        setError(error.message || 'Failed to create task');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setPriority('medium');
      setDeadline('');
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Assign a new task to a worker</DialogDescription>
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
              <AlertDescription>Task created successfully!</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="taskTitle">Task Title</Label>
            <Input
              id="taskTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter task title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taskDescription">Description</Label>
            <Textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Enter task description"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskWorker">Assign to Worker</Label>
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
              <Label htmlFor="taskPriority">Priority</Label>
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
            <Label htmlFor="taskDeadline">Deadline</Label>
            <Input
              id="taskDeadline"
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
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
