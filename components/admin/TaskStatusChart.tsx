'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface TaskStatusChartProps {
  data: {
    status: string;
    count: number;
  }[];
}

const COLORS = {
  PENDING: '#fbbf24',
  IN_PROGRESS: '#3b82f6',
  SUBMITTED: '#a855f7',
  APPROVED: '#10b981',
  CANCELLED: '#6b7280',
};

export function TaskStatusChart({ data }: TaskStatusChartProps) {
  const chartData = data.map(item => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    fill: COLORS[item.status as keyof typeof COLORS] || '#6b7280',
  }));

  const chartConfig = {
    value: {
      label: 'Tasks',
    },
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900">Task Status Distribution</CardTitle>
        <CardDescription>Overview of tasks by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

