import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'worker';
  created_at: string;
  updated_at: string;
};

export type TaskStatus = 'pending' | 'in_progress' | 'submitted' | 'approved';
export type TaskPriority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  description: string;
  assigned_to: string | null;
  created_by: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  started_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_to_profile?: Profile;
  created_by_profile?: Profile;
};

export type TaskFile = {
  id: string;
  task_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: string | null;
  uploaded_at: string;
};
