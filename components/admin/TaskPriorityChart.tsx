'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

interface TaskPriorityChartProps {
  data: {
    priority: string;
    count: number;
  }[];
}

const PRIORITY_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

export function TaskPriorityChart({ data }: TaskPriorityChartProps) {
  const chartData = data.map(item => ({
    name: item.priority,
    value: item.count,
    fill: PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || '#6b7280',
  }));

  const chartConfig = {
    value: {
      label: 'Tasks',
    },
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900">Tasks by Priority</CardTitle>
        <CardDescription>Distribution of tasks across priority levels</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
                fill="#3b82f6"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

