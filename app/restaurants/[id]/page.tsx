import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildHeatmap,
  getBestTimeToVisit,
  DAY_NAMES,
  HOUR_LABELS,
  getHeatmapColor,
} from "@/lib/heatmapUtils";

function HeatmapGrid({
  heatmap,
}: {
  heatmap: ReturnType<typeof buildHeatmap>;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-1 mb-1 ml-10">
          {HOUR_LABELS.map((label) => (
            <div
              key={label}
              className="w-8 text-center text-xs text-gray-400 truncate"
            >
              {label}
            </div>
          ))}
        </div>
        {heatmap.map((dayRow, dayIndex) => (
          <div key={dayIndex} className="flex items-center gap-1 mb-1">
            <div className="w-8 text-xs text-gray-500 text-right pr-1 shrink-0">
              {DAY_NAMES[dayIndex]}
            </div>
            {dayRow.map((cell) => (
              <div
                key={`${cell.day}-${cell.hour}`}
                className={`w-8 h-8 rounded-sm ${getHeatmapColor(cell.avgOccupancy)}`}
                title={`${DAY_NAMES[cell.day]} ${HOUR_LABELS[cell.hour - 12]}: ${Math.round(cell.avgOccupancy * 100)}% occupancy`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { tables: true, reservations: true },
  });

  if (!restaurant) {
    notFound();
  }

  const heatmap = buildHeatmap(restaurant.reservations, restaurant.tables.length);
  const bestTime = getBestTimeToVisit(heatmap);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="max-w-4xl mx-auto w-full px-4 py-10 flex-1">
        <div className="mb-8">
          <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-8xl mb-6">
            🍽️
          </div>

          <div className="flex flex-wrap items-start gap-3 mb-3">
            <h1 className="text-4xl font-bold text-gray-900">{restaurant.name}</h1>
            <Badge className="self-center">{restaurant.cuisine}</Badge>
          </div>

          <p className="text-gray-400 text-sm mb-4">{restaurant.address}</p>
          <p className="text-gray-600 leading-relaxed">{restaurant.description}</p>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-8 flex items-center gap-3">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="text-xs font-semibold text-[#E85D26] uppercase tracking-wide mb-0.5">
              Best time to visit
            </p>
            <p className="text-lg font-bold text-gray-900">{bestTime}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Busy hours heatmap
          </h2>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <HeatmapGrid heatmap={heatmap} />
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-100" />
                Quiet
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-yellow-100" />
                Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-orange-200" />
                Busy
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-300" />
                Very busy
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href={`/restaurants/${restaurant.id}/book`}>
              Make a Reservation
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/restaurants">Back to restaurants</Link>
          </Button>
        </div>
      </div>

      <footer className="bg-gray-50 border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2025 Forkcast
      </footer>
    </div>
  );
}
