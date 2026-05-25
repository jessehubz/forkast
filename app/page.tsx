import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HeroSearch } from "@/components/HeroSearch";
import Navbar from "@/components/Navbar";
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

export default async function HomePage() {
  const featuredRestaurants = await prisma.restaurant.findMany({ take: 3 });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="bg-gradient-to-br from-orange-50 to-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Reserve your table,{" "}
            <span className="text-[#E85D26]">skip the wait</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10">
            Discover top restaurants and book your perfect table in seconds.
          </p>
          <HeroSearch />
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Featured Restaurants
          </h2>
          {featuredRestaurants.length === 0 ? (
            <p className="text-gray-400 text-center py-12">
              No restaurants yet — check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredRestaurants.map((restaurant) => (
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
                      <p className="text-xs text-gray-400">{restaurant.address}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="mt-auto bg-gray-50 border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2025 Forkcast
      </footer>
    </div>
  );
}
