"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export function StatusDonut({
  data,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[];
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            animationDuration={900}
            isAnimationActive
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#0d1630",
              border: "1px solid #334155",
              borderRadius: 10,
              fontSize: 12,
            }}
            formatter={(v, n) => {
              const num = Number(v) || 0;
              return [
                `${num} (${total ? Math.round((num / total) * 100) : 0}%)`,
                String(n),
              ];
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 mb-8 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-white">
          {centerValue ?? total}
        </span>
        {centerLabel && (
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}
