import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { reservationId, status, dinerId } = body as {
    reservationId: string;
    status: string;
    dinerId?: string;
  };

  if (!reservationId || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { restaurant: true },
  });

  if (!reservation || reservation.restaurant.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status },
  });

  if (status === "no_show" && dinerId) {
    await prisma.profile.update({
      where: { id: dinerId },
      data: { noShowCount: { increment: 1 } },
    });

    const dayStart = new Date(reservation.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(reservation.date);
    dayEnd.setHours(23, 59, 59, 999);

    const firstWaitlist = await prisma.waitlist.findFirst({
      where: {
        restaurantId: reservation.restaurantId,
        date: { gte: dayStart, lte: dayEnd },
        notified: false,
      },
      orderBy: { createdAt: "asc" },
    });

    if (firstWaitlist) {
      await prisma.waitlist.update({
        where: { id: firstWaitlist.id },
        data: { notified: true },
      });
    }
  }

  return NextResponse.json({ success: true });
}
