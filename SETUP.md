# SmartWorkFlow Setup Guide

## Quick Start

### 1. Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be provisioned (takes ~2 minutes)
4. Go to Project Settings > API
5. Copy your:
   - Project URL (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - Anon/Public key (long string starting with `eyJ...`)

### 2. Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

### 3. Set Up Database

The database schema is already created via migration. No manual setup needed!

The migration created these tables:
- `profiles` - User profiles with roles (admin/worker)
- `tasks` - Task management with status and priority
- `task_files` - File attachments for tasks

### 4. Set Up Storage for File Uploads

1. Go to your Supabase project
2. Click on "Storage" in the left sidebar
3. Click "New bucket"
4. Name it: `task-files`
5. Make it **public** (toggle on)
6. Click "Create bucket"

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Create Your First Admin Account

1. Navigate to `/register` or click "Register here" on the login page
2. Fill in the form:
   - Full Name: Your name
   - Email: Your email
   - Password: Create a secure password
   - Role: Select "Admin"
3. Click "Create Account"
4. Go back to login and sign in with your new credentials

## User Flows

### Admin Workflow

1. **Login** at `/login` with admin credentials
2. **Add Workers**:
   - Click the "Workers" tab
   - Click "Add Worker"
   - Enter worker details
   - Worker credentials are created instantly
3. **Create Tasks**:
   - Click the "Tasks" tab
   - Click "Add Task"
   - Enter task details, assign to worker, set deadline and priority
   - Click "Create Task"
4. **Monitor Progress**:
   - View statistics in the dashboard cards
   - See real-time task status updates
   - Delayed tasks are highlighted in red
5. **Approve Work**:
   - When a worker submits work, you'll see a "Submitted" badge
   - Click "Approve" to mark task as completed
6. **Edit/Delete Tasks**:
   - Click the edit icon to modify task details
   - Click the trash icon to delete a task

### Worker Workflow

1. **Login** at `/login` with worker credentials
2. **View Tasks**: See all assigned tasks on the dashboard
3. **Start a Task**:
   - Find a pending task
   - Click "Start Task"
   - Status changes to "In Progress"
4. **Submit Work**:
   - Click "Submit Work" on an in-progress task
   - Add optional notes
   - Upload files/images (drag and drop or click to browse)
   - Click "Submit Task"
   - Wait for admin approval

### Live Dashboard

1. Visit `/live` - no authentication required
2. See real-time statistics:
   - Total tasks
   - In progress tasks
   - Completed tasks
   - Pending tasks
   - Submitted tasks
   - Delayed tasks
3. View all tasks with detailed status
4. Updates automatically when data changes

## Features

### Real-Time Updates
- Uses Supabase Realtime for instant updates
- Admin dashboard updates when workers start/submit tasks
- Worker dashboard updates when admin creates/assigns tasks
- Live dashboard updates for all changes

### File Management
- Workers can upload multiple files per task
- Supports images, PDFs, DOC files
- Files stored securely in Supabase Storage
- File size displayed for each upload

### Task Management
- Priority levels: Low, Medium, High
- Status tracking: Pending → In Progress → Submitted → Approved
- Deadline monitoring with delayed task highlighting
- Task editing and deletion (admin only)

### Security
- Row Level Security (RLS) enabled on all tables
- Workers can only see their assigned tasks
- Admins have full access to all tasks
- Secure file uploads with access control

## Troubleshooting

### Build Errors
If you get build errors about invalid Supabase URL, make sure:
1. You've created the `.env.local` file
2. You've added your actual Supabase credentials
3. The URL starts with `https://` and ends with `.supabase.co`

### Authentication Issues
If you can't log in:
1. Make sure you've created an account first
2. Check that your Supabase project is active
3. Verify your credentials in `.env.local`

### File Upload Issues
If files won't upload:
1. Check that you created the `task-files` bucket in Supabase Storage
2. Make sure the bucket is set to public
3. Verify the bucket name is exactly `task-files`

### Real-Time Not Working
If updates don't appear immediately:
1. Check that Realtime is enabled in your Supabase project (it is by default)
2. Refresh the page
3. Check browser console for errors

## Production Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

## Support

For issues or questions:
- Check the README.md for general information
- Review the database schema in the migration file
- Check Supabase documentation at [docs.supabase.com](https://docs.supabase.com)
