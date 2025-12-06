'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, Task } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Upload, X, FileIcon } from 'lucide-react';

type SubmitTaskDialogProps = {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function SubmitTaskDialog({ task, open, onOpenChange, onSuccess }: SubmitTaskDialogProps) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  async function uploadFiles(taskId: string) {
    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('task-files')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('task-files')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('task_files').insert({
        task_id: taskId,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: profile?.id,
      });

      if (dbError) throw dbError;

      uploadedFiles.push(publicUrl);
      setUploadProgress(((i + 1) / files.length) * 100);
    }

    return uploadedFiles;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    setUploadProgress(0);

    try {
      if (files.length > 0) {
        await uploadFiles(task.id);
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setSuccess(false);
        setFiles([]);
        setNotes('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit task');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Task</DialogTitle>
          <DialogDescription>Upload your work and submit for review</DialogDescription>
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
              <AlertDescription>Task submitted successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Task</Label>
            <div className="p-3 bg-slate-50 rounded-md">
              <p className="font-medium">{task.title}</p>
              {task.description && (
                <p className="text-sm text-slate-600 mt-1">{task.description}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              placeholder="Add any notes about your work..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Upload Files/Images (Optional)</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <label
                htmlFor="files"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Images, PDF, DOC, TXT files supported
                </span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Selected Files ({files.length})</Label>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4 text-slate-600" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-slate-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {loading && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Uploading files...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
