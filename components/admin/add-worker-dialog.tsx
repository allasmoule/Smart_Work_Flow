'use client';

import { useState } from 'react';
import { signUp } from '@/lib/supabase/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type AddWorkerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function AddWorkerDialog({ open, onOpenChange, onSuccess }: AddWorkerDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await signUp(email, password, fullName, 'worker');
      setSuccess(true);
      setEmail('');
      setPassword('');
      setFullName('');
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to add worker');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Worker</DialogTitle>
          <DialogDescription>Create a new worker account</DialogDescription>
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
              <AlertDescription>Worker added successfully!</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="workerFullName">Full Name</Label>
            <Input
              id="workerFullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workerEmail">Email</Label>
            <Input
              id="workerEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workerPassword">Password</Label>
            <Input
              id="workerPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Worker'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
