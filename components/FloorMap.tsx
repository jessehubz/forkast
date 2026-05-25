"use client";

import TableNode from "@/components/TableNode";

type Table = {
  id: string;
  label: string;
  seats: number;
  x: number;
  y: number;
};

type TableStatus = Record<
  string,
  "available" | "reserved" | "seated" | "selected" | "open" | "flagged"
>;

type FloorMapProps = {
  tables: Table[];
  tableStatuses: TableStatus;
  selectedTableId?: string | null;
  onTableClick?: (tableId: string) => void;
  readonly?: boolean;
};

export default function FloorMap({
  tables,
  tableStatuses,
  selectedTableId,
  onTableClick,
  readonly = false,
}: FloorMapProps) {
  return (
    <div
      className="w-full bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
      style={{ aspectRatio: "4 / 3" }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        {tables.map((table) => {
          const status =
            selectedTableId === table.id
              ? "selected"
              : (tableStatuses[table.id] ?? "available");

          return (
            <TableNode
              key={table.id}
              id={table.id}
              label={table.label}
              seats={table.seats}
              x={table.x}
              y={table.y}
              status={status}
              onClick={readonly ? undefined : onTableClick}
            />
          );
        })}
      </svg>
    </div>
  );
}
