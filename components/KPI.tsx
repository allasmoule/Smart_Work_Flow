'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  iconClassName?: string;
}

export function KPI({ title, value, icon: Icon, trend, className, iconClassName }: KPICardProps) {
  return (
    <Card className={cn('shadow-md hover:shadow-lg transition-all duration-300 border-0', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
        <div className={cn('p-2 rounded-lg bg-white/50', iconClassName && 'bg-opacity-20')}>
          <Icon className={cn('h-5 w-5', iconClassName || 'text-slate-500')} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
        {trend && (
          <p className="text-xs text-slate-600 mt-1">
            <span className={cn('font-semibold', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>{' '}
            <span className="text-slate-500">{trend.label}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

