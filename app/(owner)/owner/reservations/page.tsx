import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import ReservationDetailDialog from "./ReservationDetailDialog";

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

type ProfileRow = {
  id: string;
  noShowCount: number;
};

type DinerReservationRow = {
  dinerId: string;
  status: string;
};

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "confirmed": return "default";
    case "seated": return "secondary";
    case "completed": return "outline";
    case "no_show":
    case "cancelled": return "destructive";
    default: return "default";
  }
}

export default async function OwnerReservationsPage() {
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
    include: { table: true },
  });

  const reservations: ReservationRow[] = rawReservations;

  const dinerIds = Array.from(new Set<string>(reservations.map((r: ReservationRow) => r.dinerId)));
  const rawProfiles = await prisma.profile.findMany({ where: { id: { in: dinerIds } } });
  const profiles: ProfileRow[] = rawProfiles;
  const profileMap = Object.fromEntries(profiles.map((p: ProfileRow) => [p.id, p]));

  const rawDinerReservations = await prisma.reservation.findMany({
    where: { restaurantId: restaurant.id, dinerId: { in: dinerIds } },
    select: { dinerId: true, status: true },
  });

  const allDinerReservations: DinerReservationRow[] = rawDinerReservations;

  const visitCounts: Record<string, number> = {};
  for (const r of allDinerReservations) {
    if (r.status === "completed") {
      visitCounts[r.dinerId] = (visitCounts[r.dinerId] ?? 0) + 1;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Reservations</h1>
          <p className="text-gray-500 mt-1">{restaurant.name}</p>
        </div>

        {reservations.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">No reservations yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date & Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Diner</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Party</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Table</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Deposit</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Flags</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.map((r: ReservationRow) => {
                    const profile: ProfileRow | undefined = profileMap[r.dinerId];
                    const isHighNoShow = (profile?.noShowCount ?? 0) >= 2;
                    const visitCount = visitCounts[r.dinerId] ?? 0;

                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900">
                          <div>{new Date(r.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</div>
                          <div className="text-gray-500 text-xs">
                            {new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.dinerName}</td>
                        <td className="px-4 py-3 text-gray-600">{r.partySize}</td>
                        <td className="px-4 py-3 text-gray-600">{r.table?.label ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusVariant(r.status)}>{r.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {r.depositAmount > 0 ? (
                            <span className={r.depositPaid ? "text-green-600" : "text-red-600"}>
                              ${r.depositAmount.toFixed(2)} {r.depositPaid ? "✓" : "✗"}
                            </span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isHighNoShow && (
                            <Badge variant="destructive" className="text-xs">
                              ⚠️ High no-show
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ReservationDetailDialog
                            reservation={{
                              id: r.id,
                              dinerName: r.dinerName,
                              dinerId: r.dinerId,
                              partySize: r.partySize,
                              date: r.date.toISOString(),
                              status: r.status,
                              notes: r.notes,
                            }}
                            profile={profile ? { noShowCount: profile.noShowCount } : null}
                            visitCount={visitCount}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
