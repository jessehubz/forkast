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

  return NextResponse.json({ restaurant });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, address, cuisine } = body as {
    name: string;
    description: string;
    address: string;
    cuisine: string;
  };

  const existing = await prisma.restaurant.findFirst({ where: { ownerId: user.id } });

  let restaurant;
  if (existing) {
    restaurant = await prisma.restaurant.update({
      where: { id: existing.id },
      data: { name, description, address, cuisine },
    });
  } else {
    restaurant = await prisma.restaurant.create({
      data: { ownerId: user.id, name, description, address, cuisine },
    });
  }

  return NextResponse.json({ restaurant });
}
