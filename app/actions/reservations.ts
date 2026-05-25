"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function cancelReservation(
  reservationId: string,
  restaurantId: string,
  date: Date
) {
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "cancelled" },
  });

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const firstWaitlist = await prisma.waitlist.findFirst({
    where: {
      restaurantId,
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

  revalidatePath("/dashboard");
  revalidatePath(`/reservations/${reservationId}`);
}

export async function leaveWaitlist(waitlistId: string) {
  await prisma.waitlist.delete({ where: { id: waitlistId } });
  revalidatePath("/dashboard");
}

export async function createReservation(data: {
  restaurantId: string;
  tableId: string;
  dinerId: string;
  dinerName: string;
  partySize: number;
  date: Date;
  depositAmount: number;
  notes?: string;
}) {
  const reservation = await prisma.reservation.create({
    data: {
      restaurantId: data.restaurantId,
      tableId: data.tableId,
      dinerId: data.dinerId,
      dinerName: data.dinerName,
      partySize: data.partySize,
      date: data.date,
      depositAmount: data.depositAmount,
      depositPaid: data.depositAmount > 0,
      notes: data.notes ?? null,
      status: "confirmed",
    },
  });

  revalidatePath("/dashboard");
  return { reservationId: reservation.id };
}

export async function joinWaitlist(data: {
  restaurantId: string;
  dinerId: string;
  dinerName: string;
  partySize: number;
  date: Date;
}) {
  await prisma.waitlist.create({
    data: {
      restaurantId: data.restaurantId,
      dinerId: data.dinerId,
      dinerName: data.dinerName,
      partySize: data.partySize,
      date: data.date,
      notified: false,
    },
  });

  revalidatePath("/dashboard");
}
