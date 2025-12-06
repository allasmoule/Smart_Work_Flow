import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Role = 'ADMIN' | 'MANAGER' | 'WORKER' | 'admin' | 'manager' | 'worker';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  team_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: string;
  name: string;
  manager_id: string;
  created_at: string;
  updated_at: string;
  manager?: Profile;
  members?: Profile[];
};

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'pending' | 'in_progress' | 'submitted' | 'approved';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'low' | 'medium' | 'high';

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

export type Message = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
};
