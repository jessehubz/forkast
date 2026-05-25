import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { RestaurantFilters } from "@/components/RestaurantFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CUISINE_EMOJI: Record<string, string> = {
  Italian: "🍝",
  Japanese: "🍣",
  Mexican: "🌮",
  American: "🍔",
  Chinese: "🥢",
  Indian: "🍛",
  Mediterranean: "🫒",
  Thai: "🍜",
  French: "🥐",
};

type SearchParams = {
  cuisine?: string;
  date?: string;
  partySize?: string;
};

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { cuisine, date, partySize } = params;

  const allRestaurants = await prisma.restaurant.findMany({
    include: {
      tables: true,
      reservations: {
        where: { status: { not: "cancelled" } },
      },
    },
  });

  let filtered = allRestaurants;

  if (cuisine) {
    filtered = filtered.filter((r) =>
      r.cuisine.toLowerCase().includes(cuisine.toLowerCase())
    );
  }

  if (date && partySize) {
    const requestedParty = parseInt(partySize, 10);
    const requestedDate = new Date(date);
    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedDate);
    dayEnd.setHours(23, 59, 59, 999);

    filtered = filtered.filter((r) => {
      const capableTables = r.tables.filter((t) => t.seats >= requestedParty);
      if (capableTables.length === 0) return false;

      const reservationsOnDay = r.reservations.filter((res) => {
        const d = new Date(res.date);
        return d >= dayStart && d <= dayEnd;
      });

      const bookedTableIds = new Set(reservationsOnDay.map((res) => res.tableId));
      const hasAvailableTable = capableTables.some(
        (t) => !bookedTableIds.has(t.id)
      );

      return hasAvailableTable;
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="max-w-6xl mx-auto w-full px-4 py-10 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Browse Restaurants
        </h1>

        <div className="mb-8">
          <Suspense fallback={null}>
            <RestaurantFilters />
          </Suspense>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No restaurants match your search.</p>
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.id}`}
                className="group"
              >
                <Card className="h-full hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="h-44 bg-gray-100 flex items-center justify-center text-6xl">
                    {CUISINE_EMOJI[restaurant.cuisine] ?? "🍽️"}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg group-hover:text-[#E85D26] transition-colors">
                      {restaurant.name}
                    </CardTitle>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {restaurant.cuisine}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {restaurant.description}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      {restaurant.address}
                    </p>
                    <p className="text-xs text-[#E85D26] font-medium">
                      Best time to visit: Check availability
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer className="bg-gray-50 border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2025 Forkcast
      </footer>
    </div>
  );
}
