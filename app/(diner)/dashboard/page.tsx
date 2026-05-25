import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ReservationCard from "@/components/ReservationCard";
import CancelableReservationCard from "@/components/CancelableReservationCard";
import Navbar from "@/components/Navbar";
import { format } from "date-fns";
import { leaveWaitlist } from "@/app/actions/reservations";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [reservations, waitlists, profile] = await Promise.all([
    prisma.reservation.findMany({
      where: { dinerId: user.id },
      include: { restaurant: true, table: true },
      orderBy: { date: "asc" },
    }),
    prisma.waitlist.findMany({
      where: { dinerId: user.id },
      include: { restaurant: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.profile.findUnique({ where: { id: user.id } }),
  ]);

  const now = new Date();

  const upcoming = reservations.filter(
    (r) => new Date(r.date) >= now && r.status !== "cancelled"
  );
  const past = reservations.filter(
    (r) => new Date(r.date) < now || r.status === "cancelled"
  );

  function canCancel(date: Date) {
    const diff = new Date(date).getTime() - now.getTime();
    return diff > 24 * 60 * 60 * 1000;
  }

  const displayName = profile?.name ?? user.email ?? "there";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="max-w-3xl mx-auto w-full px-4 py-10 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {displayName}</p>
        </div>

        {profile && profile.noShowCount >= 2 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-red-800">No-show warning</p>
              <p className="text-sm text-red-700 mt-0.5">
                You have {profile.noShowCount} recorded no-shows. Continued no-shows
                may result in restrictions on future bookings.
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming
              {upcoming.length > 0 && (
                <Badge className="ml-2 bg-[#E85D26] text-white text-xs px-1.5 py-0">
                  {upcoming.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">Past Reservations</TabsTrigger>
            <TabsTrigger value="waitlists">
              Waitlists
              {waitlists.length > 0 && (
                <Badge className="ml-2 bg-gray-500 text-white text-xs px-1.5 py-0">
                  {waitlists.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg font-medium">No upcoming reservations</p>
                <p className="text-sm mt-1">
                  Find a restaurant and book your next table
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcoming.map((r) => {
                  const cancelable = canCancel(r.date);
                  return (
                    <CancelableReservationCard
                      key={r.id}
                      id={r.id}
                      restaurantId={r.restaurantId}
                      restaurantName={r.restaurant.name}
                      date={r.date}
                      partySize={r.partySize}
                      status={r.status}
                      depositAmount={r.depositAmount}
                      depositPaid={r.depositPaid}
                      tableLabel={r.table.label}
                      showCancel={cancelable}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {past.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg font-medium">No past reservations yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {past.map((r) => (
                  <ReservationCard
                    key={r.id}
                    id={r.id}
                    restaurantName={r.restaurant.name}
                    date={r.date}
                    partySize={r.partySize}
                    status={r.status}
                    depositAmount={r.depositAmount}
                    depositPaid={r.depositPaid}
                    tableLabel={r.table.label}
                    showCancel={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="waitlists">
            {waitlists.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg font-medium">You are not on any waitlists</p>
              </div>
            ) : (
              <div className="space-y-4">
                {waitlists.map((w) => (
                  <div
                    key={w.id}
                    className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">
                        {w.restaurant.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(w.date), "EEE, MMM d yyyy 'at' h:mm a")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {w.partySize} {w.partySize === 1 ? "guest" : "guests"}
                      </p>
                      {w.notified && (
                        <span className="inline-block bg-green-100 text-green-800 border border-green-200 text-xs px-2 py-0.5 rounded-full">
                          A table may be available — check your email
                        </span>
                      )}
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await leaveWaitlist(w.id);
                        revalidatePath("/dashboard");
                      }}
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shrink-0"
                      >
                        Leave waitlist
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <footer className="bg-gray-50 border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2025 Forkcast
      </footer>
    </div>
  );
}
