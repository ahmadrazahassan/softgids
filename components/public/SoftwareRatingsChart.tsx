"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { Software } from "@/lib/types";
import { formatRating } from "@/lib/format";

/** Horizontal bar chart of the five rating dimensions. */
export function SoftwareRatingsChart({
  software,
  accent = "var(--color-brand)",
}: {
  software: Software;
  accent?: string;
}) {
  const data = [
    { name: "Overall", value: software.overall_rating },
    { name: "Ease of use", value: software.ease_of_use_rating },
    { name: "Value for money", value: software.value_for_money_rating },
    { name: "Customer service", value: software.customer_service_rating },
    { name: "Functionality", value: software.functionality_rating },
  ];

  return (
    <div className="h-64 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            type="number"
            domain={[0, 5]}
            tickCount={6}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
            formatter={(value) => [formatRating(Number(value)), "Rating"]}
          />
          <Bar dataKey="value" fill={accent} radius={[0, 8, 8, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
