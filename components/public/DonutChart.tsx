"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "@/lib/format";

export interface DonutDatum {
  name: string;
  value: number;
  color?: string;
}

const DEFAULT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Generic donut with a centre label and legend. */
export function DonutChart({
  data,
  centerLabel,
  size = 220,
}: {
  data: DonutDatum[];
  centerLabel?: string;
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
              formatter={(value, name) => [formatNumber(Number(value)), String(name)]}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-heading text-2xl font-bold tabular-nums">{formatNumber(total)}</p>
            {centerLabel && <p className="text-xs text-muted-foreground">{centerLabel}</p>}
          </div>
        </div>
      </div>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {data.map((entry, index) => (
          <li key={entry.name} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{
                backgroundColor: entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
              }}
              aria-hidden="true"
            />
            {entry.name} ({formatNumber(entry.value)})
          </li>
        ))}
      </ul>
    </div>
  );
}
