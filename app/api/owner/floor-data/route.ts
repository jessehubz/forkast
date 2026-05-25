import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
    include: { tables: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      date: { gte: today, lt: tomorrow },
      status: { not: "cancelled" },
    },
    include: { table: true },
  });

  return NextResponse.json({ restaurant, tables: restaurant.tables, reservations });
}
