import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { restaurant: true },
  });

  if (!reservation || reservation.restaurant.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { notes } = body as { notes: string };

  await prisma.reservation.update({
    where: { id: params.id },
    data: { notes },
  });

  return NextResponse.json({ success: true });
}
