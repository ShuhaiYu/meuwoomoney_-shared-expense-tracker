"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { Category } from "@/lib/types";
import { CATEGORY_LIMITS } from "@/lib/constants";
import { AlertCircle } from "lucide-react";

const PIE_COLORS = ["#F4A261", "#E76F51", "#2A9D8F", "#264653", "#E9C46A", "#F4A261", "#E76F51", "#2A9D8F"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isOver = data.overLimit > 0;

    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-xl text-sm z-50">
        <p className="font-bold text-cat-dark mb-1">{label}</p>
        <p className="text-cat-dark">Total Spent: <span className="font-bold">${data.totalSpent.toFixed(2)}</span></p>
        <p className="text-gray-500">Target/Limit: ${data.limit.toFixed(2)}</p>
        <div className="mt-2 pt-2 border-t border-gray-100">
          {isOver ? (
            <p className="text-red-500 font-bold text-xs flex items-center gap-1">
              <AlertCircle size={12} /> Over by ${data.overLimit.toFixed(2)}
            </p>
          ) : (
            <p className="text-emerald-600 font-bold text-xs">
              ${data.remainingLimit.toFixed(2)} remaining
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

interface ChartsSectionProps {
  breakdown: Record<Category, number>;
  limitMultiplier?: number;
}

export function ChartsSection({ breakdown, limitMultiplier = 1 }: ChartsSectionProps) {
  const pieData = Object.entries(breakdown).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);

  const barData = Object.entries(breakdown).map(([name, value]) => {
    const limit = (CATEGORY_LIMITS[name as Category] || 0) * limitMultiplier;
    const spentWithinLimit = Math.min(value, limit);
    const overLimit = Math.max(value - limit, 0);
    const remainingLimit = Math.max(limit - value, 0);
    return { name, spentWithinLimit, remainingLimit, overLimit, totalSpent: value, limit };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-center font-bold text-gray-600 mb-4 text-sm uppercase tracking-wider">Distribution</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 italic">No spending data</div>
        )}
      </div>

      <div>
        <h3 className="text-center font-bold text-gray-600 mb-4 text-sm uppercase tracking-wider">Budget Limits</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="spentWithinLimit" stackId="a" fill="#10B981" radius={[2, 0, 0, 2]} />
            <Bar dataKey="remainingLimit" stackId="a" fill="#E5E7EB" radius={[0, 4, 4, 0]} />
            <Bar dataKey="overLimit" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Spent</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-200"></div> Remaining</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Over Limit</span>
        </div>
      </div>
    </div>
  );
}
