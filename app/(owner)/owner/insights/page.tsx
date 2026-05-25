import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildHeatmap, DAY_NAMES } from "@/lib/heatmapUtils";
import InsightsCharts from "@/components/InsightsCharts";

type ReservationRow = {
  id: string;
  date: Date;
  status: string;
};

export default async function InsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
    include: { tables: true },
  });

  if (!restaurant) redirect("/owner/setup");

  const rawReservations = await prisma.reservation.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { date: "asc" },
  });

  const reservations: ReservationRow[] = rawReservations;

  const totalTables = restaurant.tables.length;
  const heatmap = buildHeatmap(reservations, totalTables);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const thisWeekReservations = reservations.filter((r: ReservationRow) => {
    const d = new Date(r.date);
    return d >= weekStart && d < weekEnd && r.status !== "cancelled";
  });

  const noShowCount = reservations.filter((r: ReservationRow) => r.status === "no_show").length;
  const totalEligible = reservations.filter((r: ReservationRow) => r.status !== "cancelled").length;
  const noShowRate = totalEligible > 0 ? ((noShowCount / totalEligible) * 100).toFixed(1) : "0.0";

  let maxCount = 0;
  let bestDay = 0;
  let bestHour = 12;
  for (const dayRow of heatmap) {
    for (const cell of dayRow) {
      if (cell.count > maxCount) {
        maxCount = cell.count;
        bestDay = cell.day;
        bestHour = cell.hour;
      }
    }
  }
  const hourStr =
    bestHour < 12
      ? `${bestHour}am`
      : bestHour === 12
      ? "12pm"
      : `${bestHour - 12}pm`;
  const mostPopularSlot = maxCount > 0 ? `${DAY_NAMES[bestDay]} ${hourStr}` : "N/A";

  const dayTotals = DAY_NAMES.map((_, dayIdx) =>
    heatmap[dayIdx]?.reduce((sum, cell) => sum + cell.count, 0) ?? 0
  );
  const minDayTotal = Math.min(...dayTotals);
  const leastPopularDayIdx = dayTotals.indexOf(minDayTotal);
  const leastPopularDay = DAY_NAMES[leastPopularDayIdx];

  const dayData = DAY_NAMES.map((dayName, i) => ({
    day: dayName,
    count: dayTotals[i],
  }));

  const stats = [
    { label: "Reservations this week", value: thisWeekReservations.length },
    { label: "Overall no-show rate", value: `${noShowRate}%` },
    { label: "Most popular time", value: mostPopularSlot },
    { label: "Least popular day", value: leastPopularDay },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-500 mt-1">{restaurant.name}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <InsightsCharts heatmap={heatmap} dayData={dayData} />
      </div>
    </div>
  );
}
