"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ReservationCard from "@/components/ReservationCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cancelReservation } from "@/app/actions/reservations";

type CancelableReservationCardProps = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  date: Date;
  partySize: number;
  status: string;
  depositAmount: number;
  depositPaid: boolean;
  tableLabel?: string;
  showCancel: boolean;
};

export default function CancelableReservationCard({
  id,
  restaurantId,
  restaurantName,
  date,
  partySize,
  status,
  depositAmount,
  depositPaid,
  tableLabel,
  showCancel,
}: CancelableReservationCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      await cancelReservation(id, restaurantId, date);
      toast.success("Reservation cancelled");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to cancel. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ReservationCard
        id={id}
        restaurantName={restaurantName}
        date={date}
        partySize={partySize}
        status={status}
        depositAmount={depositAmount}
        depositPaid={depositPaid}
        tableLabel={tableLabel}
        showCancel={showCancel}
        onCancel={() => setOpen(true)}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this reservation?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            This action cannot be undone. Any deposit paid may be non-refundable.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Keep reservation
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading ? "Cancelling..." : "Yes, cancel it"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
