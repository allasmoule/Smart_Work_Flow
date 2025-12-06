'use client';

import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaskCardData = {
  id: string;
  title: string;
  description?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline: Date | string;
  assignedTo?: {
    name: string | null;
    image: string | null;
  } | null;
  createdAt: Date | string;
};

interface TaskCardProps {
  task: TaskCardData;
  onClick?: () => void;
  className?: string;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  SUBMITTED: 'bg-purple-100 text-purple-800 border-purple-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-slate-100 text-slate-800 border-slate-200',
};

const priorityColors = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  HIGH: 'bg-red-100 text-red-700',
};

export function TaskCard({ task, onClick, className }: TaskCardProps) {
  const deadline = new Date(task.deadline);
  const isOverdue = deadline < new Date() && task.status !== 'APPROVED';
  const timeRemaining = formatDistanceToNow(deadline, { addSuffix: true });

  const assignedInitials = task.assignedTo?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0',
        isOverdue && 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white',
        !isOverdue && 'bg-gradient-to-br from-white to-slate-50',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 line-clamp-2 flex-1">{task.title}</h3>
          {task.assignedTo && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={task.assignedTo.image || undefined} />
              <AvatarFallback className="text-xs">{assignedInitials}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn('text-xs', statusColors[task.status])}>
            {task.status.replace('_', ' ')}
          </Badge>
          <Badge className={cn('text-xs', priorityColors[task.priority])}>
            {task.priority}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {isOverdue ? 'Overdue' : `Due ${timeRemaining}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

