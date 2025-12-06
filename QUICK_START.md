# SmartWorkFlow - Quick Start

## 5-Minute Setup

### 1. Supabase Setup (2 min)
```bash
1. Go to https://supabase.com → Create account → New project
2. Copy Project URL and Anon Key from Settings > API
3. Paste them in .env.local file
```

### 2. Storage Bucket (1 min)
```bash
In Supabase Dashboard:
Storage → New bucket → Name: "task-files" → Public: ON → Create
```

### 3. Run the App (2 min)
```bash
npm install
npm run dev
```

### 4. Create Admin Account
```bash
1. Open http://localhost:3000
2. Click "Register here"
3. Create account with Role: Admin
4. Login and start using!
```

## What You Get

### Admin Dashboard (`/admin`)
- ✅ Add workers
- ✅ Create & assign tasks
- ✅ Set deadlines & priorities
- ✅ Monitor progress live
- ✅ Approve submitted work

### Worker Dashboard (`/worker`)
- ✅ See assigned tasks
- ✅ Start tasks
- ✅ Upload files
- ✅ Submit work

### Live Dashboard (`/live`)
- ✅ Public real-time view
- ✅ Task statistics
- ✅ Status tracking
- ✅ No login required

## Key Features

🔴 **Real-Time Updates** - Instant task status changes across all dashboards

📁 **File Uploads** - Workers can attach images, PDFs, documents to tasks

🔒 **Secure** - Row Level Security ensures workers only see their tasks

⚡ **Fast** - Optimized with Next.js and Supabase

🎨 **Beautiful** - Clean, modern UI with Tailwind CSS

## Common Tasks

### Add a Worker (Admin)
1. Go to Workers tab
2. Click "Add Worker"
3. Enter name, email, password
4. Done! Worker can now login

### Create a Task (Admin)
1. Go to Tasks tab
2. Click "Add Task"
3. Fill in title, description, assign worker, set deadline, priority
4. Click "Create Task"

### Submit Work (Worker)
1. Find task with "In Progress" status
2. Click "Submit Work"
3. Upload files if needed
4. Click "Submit Task"
5. Wait for admin approval

### Approve Work (Admin)
1. Find task with "Submitted" status
2. Click "Approve"
3. Task marked as completed!

## File Structure

```
SmartWorkFlow/
├── app/           # All pages (admin, worker, live, login, register)
├── components/    # Reusable UI components
├── lib/           # Supabase client, auth functions
├── .env.local     # Your Supabase credentials
├── README.md      # Full documentation
├── SETUP.md       # Detailed setup guide
└── QUICK_START.md # This file
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Database Tables

- `profiles` - Users with roles (admin/worker)
- `tasks` - Tasks with status, priority, deadlines
- `task_files` - File attachments

## Task Statuses

1. **Pending** - Just created, not started
2. **In Progress** - Worker has started
3. **Submitted** - Worker uploaded files and submitted
4. **Approved** - Admin approved, task complete

## Priority Levels

- 🔴 **High** - Urgent tasks
- 🟠 **Medium** - Normal priority
- ⚪ **Low** - Can wait

## Troubleshooting

**Build fails?**
- Check .env.local has correct Supabase URL and key

**Can't login?**
- Register first at /register
- Check Supabase project is active

**Files won't upload?**
- Create "task-files" bucket in Supabase Storage
- Make sure bucket is public

**No real-time updates?**
- Refresh the page
- Check browser console for errors

## Need Help?

- 📖 Read SETUP.md for detailed instructions
- 📚 Read PROJECT_STRUCTURE.md for architecture
- 🌐 Visit docs.supabase.com for Supabase help

## Build for Production

```bash
npm run build
npm run start
```

## Deploy to Vercel

```bash
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!
```

---

**That's it! You now have a complete task management system with real-time updates! 🎉**
