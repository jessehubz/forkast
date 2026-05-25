"use client";

import { getHeatmapColor } from "@/lib/heatmapUtils";

type HeatmapCell = {
  day: number;
  hour: number;
  count: number;
  avgOccupancy: number;
};

type HeatmapGridProps = {
  heatmap: HeatmapCell[][];
  dayNames: string[];
  hourLabels: string[];
};

export default function HeatmapGrid({
  heatmap,
  dayNames,
  hourLabels,
}: HeatmapGridProps) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        <div className="flex">
          <div className="w-10 shrink-0" />
          {hourLabels.map((label, i) => (
            <div
              key={i}
              className="w-8 text-center"
              style={{ height: 40 }}
            >
              <span
                className="text-xs text-gray-500 block"
                style={{
                  transform: "rotate(-45deg)",
                  transformOrigin: "bottom center",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  marginTop: 8,
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {heatmap.map((dayRow, dayIndex) => (
          <div key={dayIndex} className="flex items-center">
            <div className="w-10 shrink-0 text-xs text-gray-600 font-medium pr-1 text-right">
              {dayNames[dayIndex]}
            </div>
            {dayRow.map((cell, hourIndex) => (
              <div
                key={hourIndex}
                className={`w-8 rounded-sm mx-px my-px ${getHeatmapColor(cell.avgOccupancy)}`}
                style={{ height: 28 }}
                title={`${dayNames[cell.day]} ${hourLabels[cell.hour - 12]}: ${Math.round(cell.avgOccupancy * 100)}% occupied`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
