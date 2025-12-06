/*
  # SmartWorkFlow Database Schema
  
  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text: 'admin' or 'worker')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `assigned_to` (uuid, references profiles)
      - `created_by` (uuid, references profiles)
      - `status` (text: 'pending', 'in_progress', 'submitted', 'approved')
      - `priority` (text: 'low', 'medium', 'high')
      - `deadline` (timestamptz)
      - `started_at` (timestamptz)
      - `submitted_at` (timestamptz)
      - `approved_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `task_files`
      - `id` (uuid, primary key)
      - `task_id` (uuid, references tasks)
      - `file_url` (text)
      - `file_name` (text)
      - `file_size` (integer)
      - `uploaded_by` (uuid, references profiles)
      - `uploaded_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles, but only admins can create/update
    - Tasks: Workers can read their own tasks, admins can read/write all
    - Task Files: Users can read files for their tasks, create files for their tasks
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  deadline timestamptz NOT NULL,
  started_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_files table
CREATE TABLE IF NOT EXISTS task_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer DEFAULT 0,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON task_files(task_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_files ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Workers can view their assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Workers can update their assigned tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Task files policies
CREATE POLICY "Users can view files for tasks they have access to"
  ON task_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_files.task_id 
      AND (
        tasks.assigned_to = auth.uid() OR 
        tasks.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Users can upload files for their tasks"
  ON task_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_files.task_id 
      AND (
        tasks.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins can delete task files"
  ON task_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();