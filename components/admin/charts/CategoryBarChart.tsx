"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

export interface CategoryDatum {
  name: string;
  value: number;
}

const PALETTE = [
  "#60a5fa",
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#fb923c",
  "#34d399",
  "#facc15",
  "#fb7185",
];

export function CategoryBarChart({ data }: { data: CategoryDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#cbd5e1"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              background: "#0d1630",
              border: "1px solid #334155",
              borderRadius: 10,
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(148,163,184,0.06)" }}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            animationDuration={900}
            isAnimationActive
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
