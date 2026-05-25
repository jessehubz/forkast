"use client";

import { useState, useRef, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type TableData = {
  id?: string;
  label: string;
  seats: number;
  x: number;
  y: number;
};

type Restaurant = {
  id: string;
  name: string;
  description: string;
  address: string;
  cuisine: string;
  tables: TableData[];
};

type Props = {
  restaurant: Restaurant | null;
};

const CANVAS_W = 800;
const CANVAS_H = 600;
const TABLE_RADIUS = 28;

export default function RestaurantSetup({ restaurant }: Props) {
  const [name, setName] = useState(restaurant?.name ?? "");
  const [description, setDescription] = useState(restaurant?.description ?? "");
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [cuisine, setCuisine] = useState(restaurant?.cuisine ?? "");
  const [savingInfo, setSavingInfo] = useState(false);

  const [tables, setTables] = useState<TableData[]>(
    (restaurant?.tables ?? []).map((t) => ({
      id: t.id,
      label: t.label,
      seats: t.seats,
      x: t.x,
      y: t.y,
    }))
  );
  const [savingLayout, setSavingLayout] = useState(false);
  const [editingTableIdx, setEditingTableIdx] = useState<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingIdx = useRef<number | null>(null);
  const dragOffset = useRef<{ ox: number; oy: number }>({ ox: 0, oy: 0 });

  async function handleSaveInfo() {
    if (!name.trim() || !address.trim() || !cuisine.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSavingInfo(true);
    try {
      const res = await fetch("/api/owner/restaurant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, address, cuisine }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Restaurant info saved!");
    } catch {
      toast.error("Failed to save restaurant info.");
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleSaveLayout() {
    setSavingLayout(true);
    try {
      const res = await fetch("/api/owner/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Floor layout saved!");
    } catch {
      toast.error("Failed to save layout.");
    } finally {
      setSavingLayout(false);
    }
  }

  function addTable() {
    const newTable: TableData = {
      label: `T${tables.length + 1}`,
      seats: 4,
      x: 50 + Math.random() * 60,
      y: 50 + Math.random() * 60,
    };
    setTables((prev) => [...prev, newTable]);
  }

  function removeTable(idx: number) {
    setTables((prev) => prev.filter((_, i) => i !== idx));
    if (editingTableIdx === idx) setEditingTableIdx(null);
  }

  function updateTable(idx: number, patch: Partial<TableData>) {
    setTables((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  function handleMouseDown(e: React.MouseEvent, idx: number) {
    e.preventDefault();
    draggingIdx.current = idx;
    const { x, y } = getCanvasCoords(e);
    dragOffset.current = {
      ox: x - tables[idx].x,
      oy: y - tables[idx].y,
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (draggingIdx.current === null) return;
    const { x, y } = getCanvasCoords(e);
    const clampedX = Math.max(TABLE_RADIUS, Math.min(CANVAS_W - TABLE_RADIUS, x - dragOffset.current.ox));
    const clampedY = Math.max(TABLE_RADIUS, Math.min(CANVAS_H - TABLE_RADIUS, y - dragOffset.current.oy));
    updateTable(draggingIdx.current, { x: clampedX, y: clampedY });
  }

  function handleMouseUp() {
    draggingIdx.current = null;
  }

  const statusColors: Record<string, string> = {
    default: "#E85D26",
    editing: "#3b82f6",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Setup</h1>
          <p className="text-gray-500 mt-1">Configure your restaurant info and floor layout.</p>
        </div>

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Restaurant Info</TabsTrigger>
            <TabsTrigger value="floor">Floor Layout</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>Basic details shown to diners when booking.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Restaurant Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="The Golden Fork"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cuisine">Cuisine *</Label>
                    <Input
                      id="cuisine"
                      value={cuisine}
                      onChange={(e) => setCuisine(e.target.value)}
                      placeholder="Italian, Japanese, etc."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, San Francisco, CA"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell diners what makes your restaurant special..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSaveInfo}
                  disabled={savingInfo}
                  style={{ backgroundColor: "#E85D26" }}
                >
                  {savingInfo ? "Saving..." : "Save Info"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="floor">
            <Card>
              <CardHeader>
                <CardTitle>Floor Layout</CardTitle>
                <CardDescription>
                  Drag tables to position them. Click a table to edit its label and seat count.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={addTable}
                    style={{ backgroundColor: "#E85D26" }}
                  >
                    + Add Table
                  </Button>
                  <Button
                    onClick={handleSaveLayout}
                    disabled={savingLayout}
                    variant="outline"
                  >
                    {savingLayout ? "Saving..." : "Save Layout"}
                  </Button>
                </div>

                <div className="flex gap-4 flex-col lg:flex-row">
                  <div
                    ref={canvasRef}
                    className="relative bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 select-none flex-1"
                    style={{ minHeight: 400 }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <svg
                      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                      className="w-full h-full"
                      style={{ minHeight: 400 }}
                    >
                      {tables.map((table, idx) => (
                        <g
                          key={idx}
                          transform={`translate(${table.x}, ${table.y})`}
                          onMouseDown={(e) => handleMouseDown(e, idx)}
                          onClick={() => setEditingTableIdx(idx === editingTableIdx ? null : idx)}
                          style={{ cursor: "grab" }}
                        >
                          <circle
                            cx={0}
                            cy={0}
                            r={TABLE_RADIUS}
                            fill={editingTableIdx === idx ? statusColors.editing : statusColors.default}
                            stroke="white"
                            strokeWidth={2}
                            opacity={0.9}
                          />
                          <text
                            x={0}
                            y={-5}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize={12}
                            fontWeight={600}
                          >
                            {table.label}
                          </text>
                          <text
                            x={0}
                            y={10}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize={9}
                            opacity={0.85}
                          >
                            {table.seats} seats
                          </text>
                        </g>
                      ))}
                    </svg>

                    {tables.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-400 text-sm">Add tables to get started</p>
                      </div>
                    )}
                  </div>

                  {editingTableIdx !== null && tables[editingTableIdx] && (
                    <div className="w-full lg:w-64 space-y-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Edit Table</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1">
                            <Label>Label</Label>
                            <Input
                              value={tables[editingTableIdx].label}
                              onChange={(e) =>
                                updateTable(editingTableIdx, { label: e.target.value })
                              }
                              placeholder="T1"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Seats</Label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={tables[editingTableIdx].seats}
                              onChange={(e) =>
                                updateTable(editingTableIdx, {
                                  seats: parseInt(e.target.value) || 1,
                                })
                              }
                            />
                          </div>
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => removeTable(editingTableIdx)}
                          >
                            Remove Table
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setEditingTableIdx(null)}
                          >
                            Done
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {tables.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 pr-4 font-medium">Label</th>
                          <th className="pb-2 pr-4 font-medium">Seats</th>
                          <th className="pb-2 pr-4 font-medium">X</th>
                          <th className="pb-2 font-medium">Y</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tables.map((t, i) => (
                          <tr key={i}>
                            <td className="py-2 pr-4 font-medium">{t.label}</td>
                            <td className="py-2 pr-4">{t.seats}</td>
                            <td className="py-2 pr-4">{Math.round(t.x)}</td>
                            <td className="py-2">{Math.round(t.y)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
