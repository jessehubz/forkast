import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BookingFlow from "./BookingFlow";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [restaurant, profile] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id },
      include: { tables: true },
    }),
    prisma.profile.findUnique({ where: { id: user.id } }),
  ]);

  if (!restaurant) notFound();

  const dinerName = profile?.name ?? user.email ?? "Guest";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="max-w-2xl mx-auto w-full px-4 py-10 flex-1">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-gray-500">
            <Link href={`/restaurants/${restaurant.id}`}>← Back to {restaurant.name}</Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Book a table at {restaurant.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{restaurant.address}</p>
        </div>

        <BookingFlow
          restaurant={{
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            cuisine: restaurant.cuisine,
            tables: restaurant.tables,
          }}
          dinerId={user.id}
          dinerName={dinerName}
        />
      </div>

      <footer className="bg-gray-50 border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2025 Forkcast
      </footer>
    </div>
  );
}
