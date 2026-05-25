"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CUISINES = [
  "",
  "Italian",
  "Japanese",
  "Mexican",
  "American",
  "Chinese",
  "Indian",
  "Mediterranean",
  "Thai",
  "French",
];

export function RestaurantFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/restaurants?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <select
        defaultValue={searchParams.get("cuisine") ?? ""}
        onChange={(e) => updateParam("cuisine", e.target.value)}
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
      >
        <option value="">All Cuisines</option>
        {CUISINES.filter(Boolean).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        type="date"
        defaultValue={searchParams.get("date") ?? ""}
        onChange={(e) => updateParam("date", e.target.value)}
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
      />

      <select
        defaultValue={searchParams.get("partySize") ?? "2"}
        onChange={(e) => updateParam("partySize", e.target.value)}
        className="w-full sm:w-36 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
          <option key={n} value={String(n)}>
            {n} {n === 1 ? "guest" : "guests"}
          </option>
        ))}
      </select>
    </div>
  );
}
