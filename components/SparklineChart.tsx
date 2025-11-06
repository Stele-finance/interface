import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineChartProps {
  data: { value: number }[];
  color?: string;
  width?: number | string;
  height?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color = '#10b981', // green-500
  width = '100%',
  height = 40,
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Determine if trend is positive or negative
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const isPositive = lastValue >= firstValue;
  const chartColor = isPositive ? '#10b981' : '#ef4444'; // green or red

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={chartColor}
          strokeWidth={1.5}
          fill={`url(#gradient-${color})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
