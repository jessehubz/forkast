import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ReservationRow = {
  id: string;
  tableId: string;
  dinerId: string;
  dinerName: string;
  partySize: number;
  date: Date;
  status: string;
  depositAmount: number;
  depositPaid: boolean;
  notes: string | null;
  table: { id: string; label: string; seats: number; x: number; y: number } | null;
};

type TableRow = {
  id: string;
  label: string;
  seats: number;
  x: number;
  y: number;
};

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function getStatusColor(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "confirmed": return "default";
    case "seated": return "secondary";
    case "completed": return "outline";
    case "no_show": return "destructive";
    case "cancelled": return "destructive";
    default: return "default";
  }
}

export default async function OwnerDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
    include: { tables: true, reservations: { include: { table: true } } },
  });

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to Forkcast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              You haven&apos;t set up your restaurant yet. Get started by creating your profile and floor layout.
            </p>
            <Button asChild className="w-full" style={{ backgroundColor: "#E85D26" }}>
              <Link href="/owner/setup">Set up your restaurant</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reservations: ReservationRow[] = restaurant.reservations;
  const tables: TableRow[] = restaurant.tables;

  const now = new Date();
  const { start: weekStart, end: weekEnd } = getWeekRange();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const weekReservations = reservations.filter(
    (r: ReservationRow) => new Date(r.date) >= weekStart && new Date(r.date) < weekEnd
  );

  const totalThisWeek = weekReservations.filter((r: ReservationRow) => r.status !== "cancelled").length;

  const noShowsThisWeek = weekReservations.filter((r: ReservationRow) => r.status === "no_show").length;
  const eligibleThisWeek = weekReservations.filter((r: ReservationRow) => r.status !== "cancelled").length;
  const noShowRate = eligibleThisWeek > 0
    ? Math.round((noShowsThisWeek / eligibleThisWeek) * 100)
    : 0;

  const reservedTableIds = new Set<string>(
    reservations
      .filter((r: ReservationRow) => {
        const d = new Date(r.date);
        return r.status === "confirmed" && d >= now && d <= twoHoursLater;
      })
      .map((r: ReservationRow) => r.tableId)
  );
  const availableTablesNow = tables.filter((t: TableRow) => !reservedTableIds.has(t.id)).length;

  const upcomingToday = reservations.filter((r: ReservationRow) => {
    const d = new Date(r.date);
    return d >= now && d >= todayStart && d <= todayEnd && r.status !== "cancelled";
  });

  upcomingToday.sort((a: ReservationRow, b: ReservationRow) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const stats = [
    { label: "Reservations this week", value: totalThisWeek },
    { label: "No-show rate this week", value: `${noShowRate}%` },
    { label: "Tables available now", value: availableTablesNow },
    { label: "Upcoming today", value: upcomingToday.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-gray-500 mt-1">Owner Dashboard</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/owner/floor">View Floor</Link>
            </Button>
            <Button asChild style={{ backgroundColor: "#E85D26" }}>
              <Link href="/owner/reservations">View All Reservations</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Upcoming Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingToday.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming reservations today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Time</th>
                      <th className="pb-3 pr-4 font-medium">Diner</th>
                      <th className="pb-3 pr-4 font-medium">Party Size</th>
                      <th className="pb-3 pr-4 font-medium">Table</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {upcomingToday.map((r: ReservationRow) => (
                      <tr key={r.id} className="py-3">
                        <td className="py-3 pr-4 text-gray-900">
                          {new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 pr-4 font-medium text-gray-900">{r.dinerName}</td>
                        <td className="py-3 pr-4 text-gray-600">{r.partySize}</td>
                        <td className="py-3 pr-4 text-gray-600">{r.table?.label ?? "—"}</td>
                        <td className="py-3">
                          <Badge variant={getStatusColor(r.status)}>
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
