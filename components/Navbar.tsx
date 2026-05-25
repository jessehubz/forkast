import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";

export default async function Navbar() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    role = profile?.role ?? null;
  }

  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-[#E85D26] tracking-tight"
        >
          Forkcast
        </Link>

        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}

          {user && role === "owner" && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/floor">Floor</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <LogoutButton />
            </>
          )}

          {user && role === "diner" && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reservations">My Reservations</Link>
              </Button>
              <LogoutButton />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
