import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RestaurantSetup from "./RestaurantSetup";

export default async function SetupPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
    include: { tables: true },
  });

  return <RestaurantSetup restaurant={restaurant} />;
}
