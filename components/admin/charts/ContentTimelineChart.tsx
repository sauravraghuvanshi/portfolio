"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export interface TimelinePoint {
  year: string;
  Blogs: number;
  "Case Studies": number;
  Projects: number;
  Talks: number;
  Events: number;
  Certs: number;
}

const SERIES: { key: keyof Omit<TimelinePoint, "year">; color: string }[] = [
  { key: "Blogs", color: "#60a5fa" },
  { key: "Case Studies", color: "#22d3ee" },
  { key: "Projects", color: "#a78bfa" },
  { key: "Talks", color: "#f472b6" },
  { key: "Events", color: "#fb923c" },
  { key: "Certs", color: "#34d399" },
];

export function ContentTimelineChart({ data }: { data: TimelinePoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0d1630",
              border: "1px solid #334155",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
            cursor={{ stroke: "#334155", strokeWidth: 1 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
          />
          {SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#fill-${s.key})`}
              animationDuration={900}
              isAnimationActive
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
