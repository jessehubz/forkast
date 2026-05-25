import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CancelButton from "@/components/CancelButton";
import Link from "next/link";
import { CheckCircle, Users, MapPin, Calendar, CreditCard } from "lucide-react";

function getStatusVariant(
  status: string
): "success" | "warning" | "destructive" | "default" {
  if (status === "completed" || status === "seated") return "success";
  if (status === "confirmed") return "warning";
  if (status === "no_show" || status === "cancelled") return "destructive";
  return "default";
}

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { restaurant: true, table: true },
  });

  if (!reservation || reservation.dinerId !== user.id) notFound();

  const now = new Date();
  const reservationDate = new Date(reservation.date);
  const hoursUntil = (reservationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canCancel = reservation.status === "confirmed" && hoursUntil > 24;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="max-w-2xl mx-auto w-full px-4 py-10 flex-1">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-gray-500 mb-4">
            <Link href="/dashboard">← Back to dashboard</Link>
          </Button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {reservation.restaurant.name}
            </h1>
            <Badge
              variant={getStatusVariant(reservation.status)}
              className="capitalize text-sm"
            >
              {reservation.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-gray-700">Reservation details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-800">
                {format(reservationDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-800">
                {reservation.partySize}{" "}
                {reservation.partySize === 1 ? "guest" : "guests"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-800">
                {reservation.restaurant.address}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-4 h-4 text-gray-400 shrink-0 flex items-center justify-center text-xs font-bold">T</span>
              <span className="text-sm text-gray-800">
                Table {reservation.table.label} (seats {reservation.table.seats})
              </span>
            </div>

            {reservation.depositAmount > 0 && (
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-800">
                  Deposit: ₱{reservation.depositAmount.toLocaleString()}
                  {reservation.depositPaid ? (
                    <span className="ml-1.5 text-green-600 font-medium">(paid)</span>
                  ) : (
                    <span className="ml-1.5 text-red-500 font-medium">(unpaid)</span>
                  )}
                </span>
              </div>
            )}

            {reservation.notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Special requests
                </p>
                <p className="text-sm text-gray-700">{reservation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {canCancel && (
          <div className="mt-6">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4 text-sm text-amber-800">
              You can cancel this reservation up to 24 hours before your booking time.
            </div>
            <CancelButton
              reservationId={reservation.id}
              restaurantId={reservation.restaurantId}
              date={reservation.date}
            />
          </div>
        )}

        {reservation.status === "confirmed" && !canCancel && hoursUntil > 0 && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
            Cancellation is no longer available within 24 hours of the reservation.
          </div>
        )}
      </div>

      <footer className="bg-gray-50 border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2025 Forkcast
      </footer>
    </div>
  );
}
