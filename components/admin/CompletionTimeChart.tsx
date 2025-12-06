'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface CompletionTimeChartProps {
  data: {
    week: string;
    avgHours: number;
  }[];
}

export function CompletionTimeChart({ data }: CompletionTimeChartProps) {
  const chartConfig = {
    avgHours: {
      label: 'Avg Hours',
      color: '#8b5cf6',
    },
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900">Average Completion Time</CardTitle>
        <CardDescription>Weekly average task completion time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="week" 
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="avgHours"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

