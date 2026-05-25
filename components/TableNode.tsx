"use client";

type TableNodeProps = {
  id: string;
  label: string;
  seats: number;
  x: number;
  y: number;
  status: "available" | "reserved" | "seated" | "selected" | "open" | "flagged";
  onClick?: (id: string) => void;
  size?: number;
};

const STATUS_COLORS: Record<TableNodeProps["status"], string> = {
  available: "#22c55e",
  open: "#3b82f6",
  reserved: "#eab308",
  seated: "#22c55e",
  selected: "#E85D26",
  flagged: "#ef4444",
};

export default function TableNode({
  id,
  label,
  seats,
  x,
  y,
  status,
  onClick,
  size = 24,
}: TableNodeProps) {
  const fill = STATUS_COLORS[status];

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={() => onClick?.(id)}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <circle
        cx={0}
        cy={0}
        r={size}
        fill={fill}
        stroke="white"
        strokeWidth={1.5}
        opacity={0.9}
      />
      <text
        x={0}
        y={-3}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={size * 0.38}
        fontWeight="600"
      >
        {label}
      </text>
      <text
        x={0}
        y={size * 0.45}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={size * 0.28}
        opacity={0.85}
      >
        {seats} seats
      </text>
    </g>
  );
}
