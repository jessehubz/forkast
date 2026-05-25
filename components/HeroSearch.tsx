"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const CUISINES = [
  "Any",
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

export function HeroSearch() {
  const router = useRouter();
  const [cuisine, setCuisine] = useState("Any");
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState("2");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (cuisine && cuisine !== "Any") params.set("cuisine", cuisine);
    if (date) params.set("date", date);
    if (partySize) params.set("partySize", partySize);
    router.push(`/restaurants?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col sm:flex-row gap-3 bg-white shadow-lg rounded-2xl p-3 border border-gray-100 w-full max-w-3xl mx-auto"
    >
      <select
        value={cuisine}
        onChange={(e) => setCuisine(e.target.value)}
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
      >
        {CUISINES.map((c) => (
          <option key={c} value={c}>
            {c === "Any" ? "All Cuisines" : c}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
      />

      <select
        value={partySize}
        onChange={(e) => setPartySize(e.target.value)}
        className="w-full sm:w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
          <option key={n} value={String(n)}>
            {n} {n === 1 ? "guest" : "guests"}
          </option>
        ))}
      </select>

      <Button type="submit" size="lg" className="sm:px-8">
        Search
      </Button>
    </form>
  );
}
