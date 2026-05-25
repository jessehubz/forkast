"use client";

import { format } from "date-fns";
import { Users, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ReservationCardProps = {
  id: string;
  restaurantName: string;
  date: Date | string;
  partySize: number;
  status: string;
  depositAmount: number;
  depositPaid: boolean;
  tableLabel?: string;
  onCancel?: (id: string) => void;
  showCancel?: boolean;
};

function getStatusVariant(
  status: string
): "success" | "warning" | "destructive" | "default" {
  if (status === "completed" || status === "seated") return "success";
  if (status === "confirmed") return "warning";
  if (status === "no_show" || status === "cancelled") return "destructive";
  return "default";
}

export default function ReservationCard({
  id,
  restaurantName,
  date,
  partySize,
  status,
  depositAmount,
  depositPaid,
  tableLabel,
  onCancel,
  showCancel = false,
}: ReservationCardProps) {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  const formattedDate = format(parsedDate, "EEE, MMM d yyyy 'at' h:mm a");

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-bold">{restaurantName}</CardTitle>
          <Badge variant={getStatusVariant(status)} className="capitalize shrink-0">
            {status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <p className="text-sm text-gray-600">{formattedDate}</p>

        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <Users className="w-4 h-4 text-gray-500" />
          <span>{partySize} {partySize === 1 ? "guest" : "guests"}</span>
        </div>

        {tableLabel && (
          <p className="text-sm text-gray-500">Table: {tableLabel}</p>
        )}

        {depositAmount > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            {depositPaid ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-gray-300" />
            )}
            <span className={depositPaid ? "text-green-700" : "text-gray-500"}>
              Deposit: ₱{depositAmount.toLocaleString()}{depositPaid ? " (paid)" : " (unpaid)"}
            </span>
          </div>
        )}
      </CardContent>

      {showCancel && status === "confirmed" && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => onCancel?.(id)}
          >
            Cancel Reservation
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
