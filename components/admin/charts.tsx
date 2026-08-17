"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

/*
  Chart palette. Ordered so adjacent series stay distinguishable, and dark enough
  on white to clear contrast requirements. Every chart is wrapped in a
  ResponsiveContainer so it reflows rather than overflowing on mobile.
*/
const SERIES = ["#b06f14", "#4a6435", "#3d5a80", "#8a4b2a", "#5f5b8a", "#7d7d3f"];

const axisProps = {
  stroke: "#94a3b8",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function TooltipCard({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      {label !== undefined && (
        <p className="text-xs font-medium text-slate-900">{label}</p>
      )}
      {payload.map((entry, index) => (
        <p key={index} className="mt-0.5 text-xs text-slate-600">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ background: entry.color }}
            aria-hidden
          />
          {entry.name}:{" "}
          <span className="font-medium text-slate-900">
            {valueFormatter && typeof entry.value === "number"
              ? valueFormatter(entry.value)
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({
  data,
}: {
  data: { label: string; revenue: number; orders: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis
            {...axisProps}
            width={52}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
          />
          <Tooltip
            content={<TooltipCard valueFormatter={(value) => formatCurrency(value)} />}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={SERIES[0]}
            strokeWidth={2}
            fill="url(#revenueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersChart({
  data,
}: {
  data: { label: string; orders: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} width={36} allowDecimals={false} />
          <Tooltip content={<TooltipCard />} cursor={{ fill: "#f1f5f9" }} />
          <Bar dataKey="orders" name="Orders" fill={SERIES[2]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({
  data,
}: {
  data: { name: string; revenue: number }[];
}) {
  const total = data.reduce((sum, entry) => sum + entry.revenue, 0);

  if (total === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        No revenue recorded yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="name"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={SERIES[index % SERIES.length]} />
              ))}
            </Pie>
            <Tooltip
              content={<TooltipCard valueFormatter={(value) => formatCurrency(value)} />}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* A legend as a real list — readable without relying on colour alone. */}
      <ul className="min-w-0 grow space-y-2">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: SERIES[index % SERIES.length] }}
              aria-hidden
            />
            <span className="min-w-0 grow truncate text-slate-600">{entry.name}</span>
            <span className="shrink-0 tabular-nums text-slate-900">
              {formatCurrency(entry.revenue)}
            </span>
            <span className="w-10 shrink-0 text-right tabular-nums text-xs text-slate-400">
              {Math.round((entry.revenue / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
