import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { id, name, email, role } = await request.json();
  if (!id || !name || !email || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const profile = await prisma.profile.create({
    data: { id, name, email, role },
  });
  return NextResponse.json(profile);
}
