"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import FloorMap from "@/components/FloorMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Table = {
  id: string;
  label: string;
  seats: number;
  x: number;
  y: number;
};

type Reservation = {
  id: string;
  tableId: string;
  dinerId: string;
  dinerName: string;
  partySize: number;
  date: string;
  status: string;
  depositAmount: number;
  depositPaid: boolean;
  notes?: string | null;
};

type TableStatus = Record<string, "open" | "reserved" | "seated" | "flagged">;

function computeTableStatuses(tables: Table[], reservations: Reservation[]): TableStatus {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  const statuses: TableStatus = {};
  for (const table of tables) {
    statuses[table.id] = "open";
  }

  for (const r of reservations) {
    const rDate = new Date(r.date);

    if (r.status === "seated") {
      statuses[r.tableId] = "seated";
    } else if (r.status === "confirmed" && rDate <= fifteenMinutesAgo) {
      statuses[r.tableId] = "flagged";
    } else if (r.status === "confirmed" && rDate >= now && rDate <= twoHoursLater) {
      if (statuses[r.tableId] !== "seated" && statuses[r.tableId] !== "flagged") {
        statuses[r.tableId] = "reserved";
      }
    }
  }

  return statuses;
}

export default function FloorPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchFloorData = useCallback(async () => {
    const res = await fetch("/api/owner/floor-data");
    if (!res.ok) return;
    const data = await res.json();
    setTables(data.tables);
    setReservations(data.reservations);
    setRestaurantId(data.restaurant?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFloorData();
  }, [fetchFloorData]);

  useEffect(() => {
    if (!restaurantId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`floor-realtime-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Reservation",
          filter: `restaurantId=eq.${restaurantId}`,
        },
        () => {
          fetchFloorData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchFloorData]);

  const tableStatuses = computeTableStatuses(tables, reservations);

  const selectedReservation = selectedTableId
    ? reservations.find(
        (r) =>
          r.tableId === selectedTableId &&
          r.status !== "completed" &&
          r.status !== "cancelled" &&
          r.status !== "no_show"
      ) ?? null
    : null;

  const selectedTable = selectedTableId ? tables.find((t) => t.id === selectedTableId) ?? null : null;

  function handleTableClick(tableId: string) {
    setSelectedTableId(tableId);
    setDialogOpen(true);
  }

  async function updateStatus(status: string) {
    if (!selectedReservation) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/owner/update-reservation-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: selectedReservation.id,
          status,
          dinerId: status === "no_show" ? selectedReservation.dinerId : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success(`Status updated to ${status.replace("_", " ")}`);
      setDialogOpen(false);
      setSelectedTableId(null);
      await fetchFloorData();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    reserved: "bg-yellow-100 text-yellow-800",
    seated: "bg-green-100 text-green-800",
    flagged: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading floor map...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Floor Map</h1>
            <p className="text-gray-500 mt-1">Real-time table status</p>
          </div>
          <Button onClick={fetchFloorData} variant="outline">
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          {[
            { label: "Open", color: "bg-blue-500" },
            { label: "Reserved", color: "bg-yellow-400" },
            { label: "Seated", color: "bg-green-500" },
            { label: "Flagged (15min+)", color: "bg-red-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>

        {tables.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">No tables configured. Set up your floor layout first.</p>
          </div>
        ) : (
          <FloorMap
            tables={tables}
            tableStatuses={tableStatuses}
            selectedTableId={selectedTableId}
            onTableClick={handleTableClick}
          />
        )}

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedTableId(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Table {selectedTable?.label ?? ""}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {selectedTable && (
                <p className="text-sm text-gray-500">{selectedTable.seats} seats</p>
              )}

              {selectedReservation ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Diner</span>
                    <span className="font-medium">{selectedReservation.dinerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Party size</span>
                    <span className="font-medium">{selectedReservation.partySize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time</span>
                    <span className="font-medium">
                      {new Date(selectedReservation.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tableStatuses[selectedReservation.tableId]] ?? ""}`}>
                      {tableStatuses[selectedReservation.tableId]}
                    </span>
                  </div>
                  {selectedReservation.depositAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Deposit</span>
                      <span className="font-medium">
                        ${selectedReservation.depositAmount.toFixed(2)}{" "}
                        {selectedReservation.depositPaid ? (
                          <span className="text-green-600">(paid)</span>
                        ) : (
                          <span className="text-red-600">(unpaid)</span>
                        )}
                      </span>
                    </div>
                  )}
                  {selectedReservation.notes && (
                    <div>
                      <span className="text-gray-500 block">Notes</span>
                      <span className="text-gray-700">{selectedReservation.notes}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active reservation for this table.</p>
              )}
            </div>

            {selectedReservation && (
              <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full"
                  style={{ backgroundColor: "#E85D26" }}
                  onClick={() => updateStatus("seated")}
                  disabled={updating || selectedReservation.status === "seated"}
                >
                  Mark Seated
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateStatus("completed")}
                  disabled={updating}
                >
                  Mark Complete
                </Button>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => updateStatus("no_show")}
                  disabled={updating}
                >
                  Mark No-Show
                </Button>
              </DialogFooter>
            )}

            <DialogClose asChild>
              <Button variant="ghost" className="w-full mt-1">
                Close
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
