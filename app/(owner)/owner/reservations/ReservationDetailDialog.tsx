"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ReservationForDialog = {
  id: string;
  dinerName: string;
  dinerId: string;
  partySize: number;
  date: string;
  status: string;
  notes: string | null;
};

type ProfileForDialog = {
  noShowCount: number;
} | null;

type Props = {
  reservation: ReservationForDialog;
  profile: ProfileForDialog;
  visitCount: number;
};

export default function ReservationDetailDialog({ reservation, profile, visitCount }: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(reservation.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSaveNotes() {
    setSaving(true);
    try {
      const res = await fetch(`/api/owner/reservations/${reservation.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to save notes");
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        View details
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{reservation.dinerName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">
                {new Date(reservation.date).toLocaleDateString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

              <span className="text-gray-500">Time</span>
              <span className="font-medium">
                {new Date(reservation.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              <span className="text-gray-500">Party size</span>
              <span className="font-medium">{reservation.partySize}</span>

              <span className="text-gray-500">Status</span>
              <span className="font-medium capitalize">{reservation.status.replace("_", " ")}</span>
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="font-semibold text-gray-700">Diner History at this Restaurant</p>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-gray-500">Completed visits</span>
                <span className="font-medium">{visitCount}</span>

                <span className="text-gray-500">No-shows</span>
                <span className={`font-medium ${(profile?.noShowCount ?? 0) >= 2 ? "text-red-600" : ""}`}>
                  {profile?.noShowCount ?? 0}
                  {(profile?.noShowCount ?? 0) >= 2 && " ⚠️"}
                </span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <Label htmlFor={`notes-${reservation.id}`}>Notes</Label>
              <Textarea
                id={`notes-${reservation.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this reservation or diner..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={saving}
              style={{ backgroundColor: "#E85D26" }}
            >
              {saving ? "Saving..." : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
