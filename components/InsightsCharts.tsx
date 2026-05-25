"use client";

import HeatmapGrid from "@/components/HeatmapGrid";
import { DAY_NAMES, HOUR_LABELS } from "@/lib/heatmapUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type HeatmapCell = {
  day: number;
  hour: number;
  count: number;
  avgOccupancy: number;
};

type DayData = {
  day: string;
  count: number;
};

type Props = {
  heatmap: HeatmapCell[][];
  dayData: DayData[];
};

export default function InsightsCharts({ heatmap, dayData }: Props) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reservation Heatmap</h2>
        <p className="text-sm text-gray-500 mb-4">Occupancy by day and hour across all time.</p>
        <HeatmapGrid heatmap={heatmap} dayNames={DAY_NAMES} hourLabels={HOUR_LABELS} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reservations by Day of Week</h2>
        <p className="text-sm text-gray-500 mb-4">Total non-cancelled reservations grouped by day.</p>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
                formatter={(value) => [value, "Reservations"]}
              />
              <Bar dataKey="count" fill="#E85D26" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
