"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FloorMap from "@/components/FloorMap";
import { createReservation } from "@/app/actions/reservations";

type Table = {
  id: string;
  label: string;
  seats: number;
  x: number;
  y: number;
};

type Restaurant = {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  tables: Table[];
};

type BookingFlowProps = {
  restaurant: Restaurant;
  dinerId: string;
  dinerName: string;
};

const TIME_SLOTS = [
  "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];

function formatTime(time: string) {
  const [h] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${ampm}`;
}

export default function BookingFlow({ restaurant, dinerId, dinerName }: BookingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [notes, setNotes] = useState("");

  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [bookedTableIds, setBookedTableIds] = useState<string[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);

  const [depositAmount, setDepositAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const selectedTable = availableTables.find((t) => t.id === selectedTableId) ?? null;

  const minDate = new Date().toISOString().split("T")[0];

  async function goToStep2() {
    if (!date || !time || !partySize) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoadingTables(true);
    try {
      const dateTime = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch(
        `/api/restaurants/${restaurant.id}/tables?date=${encodeURIComponent(dateTime)}`
      );
      if (!res.ok) throw new Error("Failed to fetch tables");
      const data = await res.json();
      setAvailableTables(data.tables);
      setBookedTableIds(data.bookedTableIds);
      setSelectedTableId(null);
      setStep(2);
    } catch {
      toast.error("Could not load tables. Please try again.");
    } finally {
      setLoadingTables(false);
    }
  }

  async function goToStep3() {
    if (!selectedTableId) {
      toast.error("Please select a table");
      return;
    }
    const existingCount = bookedTableIds.length;
    const totalCount = availableTables.length;
    const { calculateDeposit } = await import("@/lib/depositCalculator");
    const deposit = calculateDeposit(existingCount, totalCount);
    setDepositAmount(deposit);
    setStep(3);
  }

  async function confirmBooking() {
    if (!selectedTableId) return;
    setSubmitting(true);
    try {
      const bookingDate = new Date(`${date}T${time}:00`);
      await createReservation({
        restaurantId: restaurant.id,
        tableId: selectedTableId,
        dinerId,
        dinerName,
        partySize: parseInt(partySize),
        date: bookingDate,
        depositAmount,
        notes: notes || undefined,
      });
      toast.success("Reservation confirmed!");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to create reservation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const tableStatuses: Record<string, "available" | "reserved"> = {};
  for (const t of availableTables) {
    tableStatuses[t.id] = bookedTableIds.includes(t.id) ? "reserved" : "available";
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === s
                  ? "bg-[#E85D26] text-white"
                  : step > s
                  ? "bg-orange-100 text-[#E85D26]"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {s}
            </div>
            <span
              className={`text-sm hidden sm:block ${
                step === s ? "font-semibold text-gray-900" : "text-gray-400"
              }`}
            >
              {s === 1 ? "Date & Time" : s === 2 ? "Choose Table" : "Confirm"}
            </span>
            {s < 3 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">When are you coming?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatTime(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partySize">Party size</Label>
              <Select value={partySize} onValueChange={setPartySize}>
                <SelectTrigger id="partySize">
                  <SelectValue placeholder="Select party size" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "guest" : "guests"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Special requests (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Allergies, celebrations, accessibility needs..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              className="w-full bg-[#E85D26] hover:bg-[#d14f1e] text-white"
              onClick={goToStep2}
              disabled={loadingTables}
            >
              {loadingTables ? "Loading tables..." : "Choose a table"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Pick your table</CardTitle>
              <p className="text-sm text-gray-500">
                Click an available table on the floor map below
              </p>
            </CardHeader>
            <CardContent>
              <FloorMap
                tables={availableTables}
                tableStatuses={tableStatuses}
                selectedTableId={selectedTableId}
                onTableClick={(tableId) => {
                  if (!bookedTableIds.includes(tableId)) {
                    setSelectedTableId(tableId);
                  }
                }}
              />

              <div className="flex gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-green-200 inline-block" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-200 inline-block" />
                  Reserved
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#E85D26] inline-block" />
                  Selected
                </span>
              </div>

              {selectedTable && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm">
                  <p className="font-semibold text-gray-800">
                    Table {selectedTable.label} selected
                  </p>
                  <p className="text-gray-500 mt-0.5">
                    Seats up to {selectedTable.seats} guests
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              className="flex-1 bg-[#E85D26] hover:bg-[#d14f1e] text-white"
              onClick={goToStep3}
              disabled={!selectedTableId}
            >
              Review booking
            </Button>
          </div>
        </div>
      )}

      {step === 3 && selectedTable && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Confirm your reservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="divide-y divide-gray-100">
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 text-sm">Restaurant</span>
                  <span className="font-medium text-sm text-right">{restaurant.name}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 text-sm">Date</span>
                  <span className="font-medium text-sm">
                    {new Date(`${date}T${time}:00`).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 text-sm">Time</span>
                  <span className="font-medium text-sm">{formatTime(time)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 text-sm">Party size</span>
                  <span className="font-medium text-sm">
                    {partySize} {parseInt(partySize) === 1 ? "guest" : "guests"}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 text-sm">Table</span>
                  <span className="font-medium text-sm">
                    {selectedTable.label} (seats {selectedTable.seats})
                  </span>
                </div>
                {notes && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500 text-sm">Notes</span>
                    <span className="font-medium text-sm text-right max-w-xs">{notes}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-4 mt-2">
                {depositAmount > 0 ? (
                  <div>
                    <p className="font-semibold text-gray-800">
                      Deposit required: ₱{depositAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      This restaurant is in high demand. A deposit is required to confirm
                      your booking and will be applied to your bill.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-gray-800">No deposit required</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Book for free. Please be on time to keep your reservation.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="flex-1 bg-[#E85D26] hover:bg-[#d14f1e] text-white"
              onClick={confirmBooking}
              disabled={submitting}
            >
              {submitting
                ? "Confirming..."
                : depositAmount > 0
                ? `Confirm & pay ₱${depositAmount.toLocaleString()} deposit`
                : "Confirm reservation"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
