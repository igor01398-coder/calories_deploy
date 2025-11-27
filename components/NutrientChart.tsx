import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { NutrientData } from '../types';

interface NutrientChartProps {
  data: NutrientData;
}

const COLORS = ['#ef4444', '#3b82f6', '#f59e0b']; // Red (Protein), Blue (Carbs), Amber (Fat)

export const NutrientChart: React.FC<NutrientChartProps> = ({ data }) => {
  const chartData = [
    { name: '蛋白質', value: data.protein },
    { name: '碳水', value: data.carbs },
    { name: '脂肪', value: data.fat },
  ];

  // If all are zero, show a gray placeholder
  const isEmpty = chartData.every(d => d.value === 0);
  const displayData = isEmpty ? [{ name: '無資料', value: 1 }] : chartData;
  const displayColors = isEmpty ? ['#e2e8f0'] : COLORS;

  return (
    <div className="h-32 w-32 relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={55}
            paddingAngle={isEmpty ? 0 : 5}
            dataKey="value"
            stroke="none"
          >
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={displayColors[index % displayColors.length]} />
            ))}
          </Pie>
          {!isEmpty && <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute text-center">
        <span className="text-xs text-slate-400 font-medium">總熱量</span>
        <div className="text-sm font-bold text-slate-700">{Math.round(data.calories)}</div>
      </div>
    </div>
  );
};
