export type HeatmapCell = {
  day: number;    // 0=Sun, 1=Mon, ..., 6=Sat
  hour: number;   // 12–22
  count: number;
  avgOccupancy: number;
};

export type Reservation = {
  date: Date;
  status: string;
};

const HOURS = Array.from({ length: 11 }, (_, i) => i + 12); // 12–22
const DAYS = [0, 1, 2, 3, 4, 5, 6];
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const HOUR_LABELS = HOURS.map((h) =>
  h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`
);

export function buildHeatmap(
  reservations: Reservation[],
  totalTables: number
): HeatmapCell[][] {
  const grid: Record<string, { count: number }> = {};

  for (const r of reservations) {
    if (r.status === "cancelled") continue;
    const d = new Date(r.date);
    const day = d.getDay();
    const hour = d.getHours();
    if (hour < 12 || hour > 22) continue;
    const key = `${day}-${hour}`;
    grid[key] = { count: (grid[key]?.count ?? 0) + 1 };
  }

  return DAYS.map((day) =>
    HOURS.map((hour) => {
      const cell = grid[`${day}-${hour}`] ?? { count: 0 };
      return {
        day,
        hour,
        count: cell.count,
        avgOccupancy: totalTables > 0 ? Math.min(cell.count / totalTables, 1) : 0,
      };
    })
  );
}

export function getBestTimeToVisit(heatmap: HeatmapCell[][]): string {
  let minOccupancy = Infinity;
  let bestDay = 0;
  let bestHour = 12;

  for (const dayRow of heatmap) {
    for (const cell of dayRow) {
      if (cell.avgOccupancy < minOccupancy) {
        minOccupancy = cell.avgOccupancy;
        bestDay = cell.day;
        bestHour = cell.hour;
      }
    }
  }

  const hourLabel = HOUR_LABELS[bestHour - 12];
  return `${DAY_NAMES[bestDay]} ${hourLabel}`;
}

export function getHeatmapColor(occupancy: number): string {
  if (occupancy < 0.25) return "bg-green-100";
  if (occupancy < 0.5) return "bg-yellow-100";
  if (occupancy < 0.75) return "bg-orange-200";
  return "bg-red-300";
}
