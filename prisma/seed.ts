import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Forkcast database...");

  // Clean existing data
  await prisma.reservationHistory.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.table.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.profile.deleteMany();

  // Profiles (owners and diners)
  // NOTE: These IDs must match real Supabase auth user IDs in production.
  // For dev/demo, use placeholder UUIDs and create matching Supabase users manually.
  const owner1Id = "00000000-0000-0000-0000-000000000001";
  const owner2Id = "00000000-0000-0000-0000-000000000002";
  const diner1Id = "00000000-0000-0000-0000-000000000003";
  const diner2Id = "00000000-0000-0000-0000-000000000004";

  await prisma.profile.createMany({
    data: [
      { id: owner1Id, role: "owner", name: "Maria Santos", email: "maria@forkcast.ph" },
      { id: owner2Id, role: "owner", name: "Carlos Reyes", email: "carlos@forkcast.ph" },
      { id: diner1Id, role: "diner", name: "Ana Garcia", email: "ana@example.com", noShowCount: 0 },
      { id: diner2Id, role: "diner", name: "Ben Cruz", email: "ben@example.com", noShowCount: 2 },
    ],
  });

  // Restaurants
  const r1 = await prisma.restaurant.create({
    data: {
      ownerId: owner1Id,
      name: "Salo-Salo Kitchen",
      description: "Modern Filipino cuisine celebrating regional flavors with a contemporary twist. Family-style dining at its finest.",
      address: "123 Aguinaldo St, Intramuros, Manila",
      cuisine: "Filipino",
      coverImage: null,
    },
  });

  const r2 = await prisma.restaurant.create({
    data: {
      ownerId: owner1Id,
      name: "Yakiniku Miyabi",
      description: "Premium Japanese BBQ with wagyu and fresh cuts. Cozy booths and charcoal grills for a true yakiniku experience.",
      address: "45 Makati Ave, Makati City",
      cuisine: "Japanese",
      coverImage: null,
    },
  });

  const r3 = await prisma.restaurant.create({
    data: {
      ownerId: owner2Id,
      name: "La Trattoria Verde",
      description: "Authentic Italian fare with housemade pasta, wood-fired pizzas, and an extensive Sicilian wine list.",
      address: "88 Bonifacio High St, BGC, Taguig",
      cuisine: "Italian",
      coverImage: null,
    },
  });

  // Tables for Salo-Salo Kitchen (10 tables)
  const saloTables = await Promise.all([
    prisma.table.create({ data: { restaurantId: r1.id, label: "T1", seats: 2, x: 15, y: 15 } }),
    prisma.table.create({ data: { restaurantId: r1.id, label: "T2", seats: 2, x: 35, y: 15 } }),
    prisma.table.create({ data: { restaurantId: r1.id, label: "T3", seats: 4, x: 55, y: 15 } }),
    prisma.table.create({ data: { restaurantId: r1.id, label: "T4", seats: 4, x: 75, y: 15 } }),
    prisma.table.create({ data: { restaurantId: r1.id, label: "W1", seats: 2, x: 15, y: 45 } }),
    prisma.table.create({ data: { restaurantId: r1.id, label: "W2", seats: 4, x: 35, y: 45 } }),
    prisma.table.create({ data: { restaurantId: r1.id, label: "W3", seats: 6, x: 55, y: 45 } }),
    prisma.table.create({ data: { restaurantId: r1.id, label: "B1", seats: 8, x: 20, y: 75 } }),
    prisma.table.create({ data: { restaurantId: r1.id, label: "B2", seats: 6, x: 50, y: 75 } }),
    prisma.table.create({ data: { restaurantId: r1.id, label: "B3", seats: 4, x: 78, y: 75 } }),
  ]);

  // Tables for Yakiniku Miyabi (8 tables)
  const yakinikuTables = await Promise.all([
    prisma.table.create({ data: { restaurantId: r2.id, label: "Y1", seats: 2, x: 20, y: 20 } }),
    prisma.table.create({ data: { restaurantId: r2.id, label: "Y2", seats: 2, x: 45, y: 20 } }),
    prisma.table.create({ data: { restaurantId: r2.id, label: "Y3", seats: 4, x: 70, y: 20 } }),
    prisma.table.create({ data: { restaurantId: r2.id, label: "Y4", seats: 4, x: 20, y: 50 } }),
    prisma.table.create({ data: { restaurantId: r2.id, label: "Y5", seats: 4, x: 45, y: 50 } }),
    prisma.table.create({ data: { restaurantId: r2.id, label: "Y6", seats: 6, x: 70, y: 50 } }),
    prisma.table.create({ data: { restaurantId: r2.id, label: "P1", seats: 8, x: 30, y: 80 } }),
    prisma.table.create({ data: { restaurantId: r2.id, label: "P2", seats: 10, x: 68, y: 80 } }),
  ]);

  // Tables for La Trattoria Verde (10 tables)
  const trattoriaTables = await Promise.all([
    prisma.table.create({ data: { restaurantId: r3.id, label: "A1", seats: 2, x: 12, y: 18 } }),
    prisma.table.create({ data: { restaurantId: r3.id, label: "A2", seats: 2, x: 30, y: 18 } }),
    prisma.table.create({ data: { restaurantId: r3.id, label: "A3", seats: 4, x: 50, y: 18 } }),
    prisma.table.create({ data: { restaurantId: r3.id, label: "A4", seats: 4, x: 70, y: 18 } }),
    prisma.table.create({ data: { restaurantId: r3.id, label: "B1", seats: 4, x: 12, y: 50 } }),
    prisma.table.create({ data: { restaurantId: r3.id, label: "B2", seats: 6, x: 40, y: 50 } }),
    prisma.table.create({ data: { restaurantId: r3.id, label: "B3", seats: 6, x: 70, y: 50 } }),
    prisma.table.create({ data: { restaurantId: r3.id, label: "C1", seats: 8, x: 20, y: 80 } }),
    prisma.table.create({ data: { restaurantId: r3.id, label: "C2", seats: 10, x: 55, y: 80 } }),
    prisma.table.create({ data: { restaurantId: r3.id, label: "C3", seats: 4, x: 82, y: 80 } }),
  ]);

  // Helper to make a date relative to now
  function daysAgo(n: number, hour = 19): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, 0, 0, 0);
    return d;
  }
  function daysFromNow(n: number, hour = 19): Date {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  // Past reservations (25+ across all restaurants for heatmap data)
  const pastReservations = [
    // Salo-Salo past
    { restaurantId: r1.id, tableId: saloTables[0].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 2, date: daysAgo(60, 12), status: "completed" },
    { restaurantId: r1.id, tableId: saloTables[2].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 4, date: daysAgo(55, 13), status: "no_show" },
    { restaurantId: r1.id, tableId: saloTables[4].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 2, date: daysAgo(50, 18), status: "completed" },
    { restaurantId: r1.id, tableId: saloTables[6].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 5, date: daysAgo(45, 19), status: "completed" },
    { restaurantId: r1.id, tableId: saloTables[1].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 2, date: daysAgo(40, 19), status: "completed" },
    { restaurantId: r1.id, tableId: saloTables[3].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 4, date: daysAgo(35, 20), status: "completed" },
    { restaurantId: r1.id, tableId: saloTables[5].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 3, date: daysAgo(28, 18), status: "completed" },
    { restaurantId: r1.id, tableId: saloTables[7].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 7, date: daysAgo(21, 12), status: "no_show" },
    { restaurantId: r1.id, tableId: saloTables[8].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 5, date: daysAgo(14, 19), status: "completed" },
    { restaurantId: r1.id, tableId: saloTables[9].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 4, date: daysAgo(7, 20), status: "cancelled" },

    // Yakiniku past
    { restaurantId: r2.id, tableId: yakinikuTables[0].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 2, date: daysAgo(58, 19), status: "completed" },
    { restaurantId: r2.id, tableId: yakinikuTables[2].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 4, date: daysAgo(52, 18), status: "completed" },
    { restaurantId: r2.id, tableId: yakinikuTables[4].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 3, date: daysAgo(42, 20), status: "completed" },
    { restaurantId: r2.id, tableId: yakinikuTables[1].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 2, date: daysAgo(30, 13), status: "no_show" },
    { restaurantId: r2.id, tableId: yakinikuTables[5].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 5, date: daysAgo(20, 19), status: "completed" },
    { restaurantId: r2.id, tableId: yakinikuTables[3].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 4, date: daysAgo(10, 20), status: "completed" },

    // La Trattoria past
    { restaurantId: r3.id, tableId: trattoriaTables[0].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 2, date: daysAgo(56, 18), status: "completed" },
    { restaurantId: r3.id, tableId: trattoriaTables[3].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 4, date: daysAgo(49, 19), status: "completed" },
    { restaurantId: r3.id, tableId: trattoriaTables[5].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 5, date: daysAgo(38, 12), status: "completed" },
    { restaurantId: r3.id, tableId: trattoriaTables[7].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 8, date: daysAgo(25, 20), status: "cancelled" },
    { restaurantId: r3.id, tableId: trattoriaTables[2].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 3, date: daysAgo(18, 19), status: "completed" },
    { restaurantId: r3.id, tableId: trattoriaTables[8].id, dinerId: diner2Id, dinerName: "Ben Cruz", partySize: 9, date: daysAgo(9, 19), status: "no_show" },
    { restaurantId: r3.id, tableId: trattoriaTables[6].id, dinerId: diner1Id, dinerName: "Ana Garcia", partySize: 6, date: daysAgo(4, 20), status: "completed" },
  ];

  for (const r of pastReservations) {
    await prisma.reservation.create({ data: r });
  }

  // Upcoming reservations (3)
  await prisma.reservation.create({
    data: {
      restaurantId: r1.id,
      tableId: saloTables[1].id,
      dinerId: diner1Id,
      dinerName: "Ana Garcia",
      partySize: 2,
      date: daysFromNow(2, 19),
      status: "confirmed",
      depositAmount: 0,
      depositPaid: false,
    },
  });

  await prisma.reservation.create({
    data: {
      restaurantId: r2.id,
      tableId: yakinikuTables[4].id,
      dinerId: diner2Id,
      dinerName: "Ben Cruz",
      partySize: 4,
      date: daysFromNow(3, 18),
      status: "confirmed",
      depositAmount: 200,
      depositPaid: true,
    },
  });

  await prisma.reservation.create({
    data: {
      restaurantId: r3.id,
      tableId: trattoriaTables[5].id,
      dinerId: diner1Id,
      dinerName: "Ana Garcia",
      partySize: 5,
      date: daysFromNow(5, 20),
      status: "confirmed",
      depositAmount: 0,
      depositPaid: false,
    },
  });

  // Update Ben's noShowCount to 2 (he has 2 no-shows seeded)
  await prisma.profile.update({
    where: { id: diner2Id },
    data: { noShowCount: 2 },
  });

  // Waitlist entry
  await prisma.waitlist.create({
    data: {
      restaurantId: r1.id,
      dinerId: diner2Id,
      dinerName: "Ben Cruz",
      partySize: 4,
      date: daysFromNow(1, 19),
      notified: false,
    },
  });

  console.log("✅ Seed complete!");
  console.log("\n📝 Demo accounts (create these in Supabase Auth first):");
  console.log("  Owner 1: maria@forkcast.ph / password123");
  console.log("  Owner 2: carlos@forkcast.ph / password123");
  console.log("  Diner 1: ana@example.com / password123");
  console.log("  Diner 2: ben@example.com / password123");
  console.log("\n⚠️  After creating auth users, update the UUID constants at the top of this file to match the real Supabase user IDs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
