'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface WorkerPerformanceChartProps {
  data: {
    name: string;
    tasks: number;
    completed: number;
  }[];
}

export function WorkerPerformanceChart({ data }: WorkerPerformanceChartProps) {
  const chartData = data.map(item => ({
    name: item.name || 'Unknown',
    total: item.tasks,
    completed: item.completed,
    completionRate: item.tasks > 0 ? (item.completed / item.tasks) * 100 : 0,
  }));

  const chartConfig = {
    total: {
      label: 'Total Tasks',
      color: '#3b82f6',
    },
    completed: {
      label: 'Completed',
      color: '#10b981',
    },
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900">Worker Performance</CardTitle>
        <CardDescription>Tasks assigned and completed by worker</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#64748b"
                fontSize={12}
                width={100}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total Tasks" />
              <Bar dataKey="completed" fill="#10b981" radius={[0, 4, 4, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

