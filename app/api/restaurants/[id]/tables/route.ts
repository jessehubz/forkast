import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  if (!dateParam) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const date = new Date(dateParam);
  const slotStart = new Date(date.getTime() - 30 * 60000);
  const slotEnd = new Date(date.getTime() + 90 * 60000);

  const [tables, bookedReservations] = await Promise.all([
    prisma.table.findMany({ where: { restaurantId: id } }),
    prisma.reservation.findMany({
      where: {
        restaurantId: id,
        date: { gte: slotStart, lte: slotEnd },
        status: { not: "cancelled" },
      },
      select: { tableId: true },
    }),
  ]);

  const bookedTableIds = bookedReservations.map((r) => r.tableId);

  return NextResponse.json({ tables, bookedTableIds });
}
