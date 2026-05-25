import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: user.id } });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const body = await request.json();
  const { tables } = body as {
    tables: Array<{ id?: string; label: string; seats: number; x: number; y: number }>;
  };

  await prisma.table.deleteMany({ where: { restaurantId: restaurant.id } });

  const created = await prisma.table.createMany({
    data: tables.map((t) => ({
      restaurantId: restaurant.id,
      label: t.label,
      seats: t.seats,
      x: t.x,
      y: t.y,
    })),
  });

  return NextResponse.json({ success: true, count: created.count });
}
