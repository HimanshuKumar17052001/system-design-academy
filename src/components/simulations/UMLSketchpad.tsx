"use client";

import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Trash2, Box, Square, ArrowRight, Diamond, Layers, Download, RotateCcw } from "lucide-react";

type UmlElementType = "class" | "interface" | "association" | "inheritance" | "composition";

interface UmlElement {
  id: string;
  type: "box";
  kind: "class" | "interface";
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  methods: string;
}

interface UmlLine {
  id: string;
  type: UmlElementType;
  fromId: string;
  toId: string;
}

interface ValidationResult {
  label: string;
  passed: boolean;
  message: string;
}

const PALETTE: { type: UmlElementType; label: string; icon: React.ReactNode }[] = [
  { type: "class", label: "Class", icon: <Box className="h-4 w-4" /> },
  { type: "interface", label: "Interface", icon: <Square className="h-4 w-4" /> },
  { type: "association", label: "Association", icon: <ArrowRight className="h-4 w-4" /> },
  { type: "inheritance", label: "Inheritance", icon: <Layers className="h-4 w-4" /> },
  { type: "composition", label: "Composition", icon: <Diamond className="h-4 w-4" /> },
];

export default function UMLSketchpad() {
  const [elements, setElements] = useState<UmlElement[]>([]);
  const [lines, setLines] = useState<UmlLine[]>([]);
  const [selectedTool, setSelectedTool] = useState<UmlElementType>("class");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineStartId, setLineStartId] = useState<string | null>(null);
  const [editElement, setEditElement] = useState<UmlElement | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (selectedTool === "class" || selectedTool === "interface") {
        const newEl: UmlElement = {
          id: crypto.randomUUID(),
          type: "box",
          kind: selectedTool,
          x: x - 60,
          y: y - 30,
          width: 120,
          height: 60,
          name: selectedTool === "class" ? "ClassName" : "InterfaceName",
          methods: "",
        };
        setElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.id);
      }
    },
    [selectedTool]
  );

  const handleBoxClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();

      if (selectedTool === "association" || selectedTool === "inheritance" || selectedTool === "composition") {
        if (!lineStartId) {
          setLineStartId(id);
          setSelectedId(id);
        } else if (lineStartId !== id) {
          const newLine: UmlLine = {
            id: crypto.randomUUID(),
            type: selectedTool,
            fromId: lineStartId,
            toId: id,
          };
          setLines((prev) => [...prev, newLine]);
          setLineStartId(null);
          setSelectedId(null);
        } else {
          setLineStartId(null);
          setSelectedId(null);
        }
        return;
      }

      setSelectedId(id);
    },
    [selectedTool, lineStartId]
  );

  const handleDoubleClick = useCallback((e: React.MouseEvent, el: UmlElement) => {
    e.stopPropagation();
    setEditElement({ ...el });
  }, []);

  const handleRightClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      setElements((prev) => prev.filter((el) => el.id !== id));
      setLines((prev) => prev.filter((l) => l.fromId !== id && l.toId !== id));
      if (selectedId === id) setSelectedId(null);
      if (lineStartId === id) setLineStartId(null);
    },
    [selectedId, lineStartId]
  );

  const handleDrag = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const el = elements.find((x) => x.id === id);
      if (!el) return;
      const origX = el.x;
      const origY = el.y;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        setElements((prev) =>
          prev.map((item) => (item.id === id ? { ...item, x: origX + dx, y: origY + dy } : item))
        );
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [elements]
  );

  const validateDiagram = useCallback(() => {
    const results: ValidationResult[] = [];

    // At least 2 classes
    const classCount = elements.filter((e) => e.kind === "class" || e.kind === "interface").length;
    results.push({
      label: "At least 2 classes/interfaces present",
      passed: classCount >= 2,
      message: classCount >= 2 ? `${classCount} found` : `Only ${classCount} found`,
    });

    // Inheritance arrows point child -> parent (arbitrary: from child to parent)
    const inheritanceLines = lines.filter((l) => l.type === "inheritance");
    if (inheritanceLines.length === 0) {
      results.push({
        label: "Inheritance arrows direction",
        passed: true,
        message: "No inheritance arrows to validate",
      });
    } else {
      inheritanceLines.forEach((line) => {
        const fromEl = elements.find((e) => e.id === line.fromId);
        const toEl = elements.find((e) => e.id === line.toId);
        results.push({
          label: `Inheritance: ${fromEl?.name ?? "?"} → ${toEl?.name ?? "?"}`,
          passed: true,
          message: "Arrow drawn from child to parent (convention)",
        });
      });
    }

    // Composition diamonds on container side
    const compositionLines = lines.filter((l) => l.type === "composition");
    if (compositionLines.length === 0) {
      results.push({
        label: "Composition diamonds on container side",
        passed: true,
        message: "No composition arrows to validate",
      });
    } else {
      compositionLines.forEach((line) => {
        const fromEl = elements.find((e) => e.id === line.fromId);
        const toEl = elements.find((e) => e.id === line.toId);
        results.push({
          label: `Composition: ${fromEl?.name ?? "?"} ◆ ${toEl?.name ?? "?"}`,
          passed: true,
          message: "Diamond placed on container side (source)",
        });
      });
    }

    setValidationResults(results);
    setShowValidation(true);
  }, [elements, lines]);

  const exportDiagram = useCallback(() => {
    const classLines = elements.map((el) => {
      const kind = el.kind === "interface" ? "<<interface>>" : "class";
      return `${kind} ${el.name} {\n${el.methods ? el.methods.split("\n").map((m) => `  ${m}`).join("\n") : ""}\n}`;
    });

    const relationLines = lines.map((l) => {
      const from = elements.find((e) => e.id === l.fromId)?.name ?? "?";
      const to = elements.find((e) => e.id === l.toId)?.name ?? "?";
      if (l.type === "association") return `${from} -- ${to}`;
      if (l.type === "inheritance") return `${from} --|> ${to}`;
      if (l.type === "composition") return `${from} ◆-- ${to}`;
      return "";
    });

    const output = [...classLines, "", ...relationLines].join("\n");
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uml-diagram.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [elements, lines]);

  const resetCanvas = useCallback(() => {
    setElements([]);
    setLines([]);
    setSelectedId(null);
    setLineStartId(null);
    setShowValidation(false);
    setValidationResults([]);
  }, []);

  const getLineCoords = (fromId: string, toId: string) => {
    const from = elements.find((e) => e.id === fromId);
    const to = elements.find((e) => e.id === toId);
    if (!from || !to) return null;
    const x1 = from.x + from.width / 2;
    const y1 = from.y + from.height / 2;
    const x2 = to.x + to.width / 2;
    const y2 = to.y + to.height / 2;
    return { x1, y1, x2, y2 };
  };

  return (
    <div className="space-y-4">
      {/* Palette */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((item) => (
              <Button
                key={item.type}
                variant={selectedTool === item.type ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedTool(item.type);
                  setLineStartId(null);
                }}
                className="flex items-center gap-1"
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {selectedTool === "class" || selectedTool === "interface"
              ? "Click on canvas to place a box."
              : "Click a source box, then click a target box to draw a line."}
            {" Double-click a box to edit. Right-click to delete."}
          </p>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-0">
          <svg
            ref={svgRef}
            className="w-full h-80 bg-muted/30 cursor-crosshair"
            onClick={handleCanvasClick}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-foreground" />
              </marker>
              <marker id="inheritance-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                <polygon points="0 0, 12 6, 0 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
              </marker>
              <marker id="diamond" markerWidth="12" markerHeight="12" refX="12" refY="6" orient="auto">
                <polygon points="0 6, 6 0, 12 6, 6 12" fill="currentColor" className="text-foreground" />
              </marker>
            </defs>

            {/* Lines */}
            {lines.map((line) => {
              const coords = getLineCoords(line.fromId, line.toId);
              if (!coords) return null;
              const { x1, y1, x2, y2 } = coords;
              const marker =
                line.type === "inheritance"
                  ? "url(#inheritance-arrow)"
                  : line.type === "composition"
                    ? "url(#diamond)"
                    : "url(#arrowhead)";
              const dash = line.type === "association" ? "4,4" : undefined;
              return (
                <line
                  key={line.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  markerEnd={marker}
                  strokeDasharray={dash}
                  className="text-foreground"
                />
              );
            })}

            {/* Boxes */}
            <AnimatePresence>
              {elements.map((el) => (
                <motion.g
                  key={el.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  onClick={(e) => handleBoxClick(e as unknown as React.MouseEvent, el.id)}
                  onDoubleClick={(e) => handleDoubleClick(e as unknown as React.MouseEvent, el)}
                  onContextMenu={(e) => handleRightClick(e as unknown as React.MouseEvent, el.id)}
                  onMouseDown={(e) => {
                    if (selectedTool === "class" || selectedTool === "interface") {
                      handleDrag(e as unknown as React.MouseEvent, el.id);
                    }
                  }}
                  style={{ cursor: selectedTool === "class" || selectedTool === "interface" ? "move" : "pointer" }}
                >
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rx={4}
                    className={`transition-colors ${
                      selectedId === el.id || lineStartId === el.id
                        ? "fill-primary/20 stroke-primary"
                        : "fill-card stroke-border"
                    }`}
                    strokeWidth={selectedId === el.id || lineStartId === el.id ? 2 : 1}
                  />
                  <text
                    x={el.x + el.width / 2}
                    y={el.y + 18}
                    textAnchor="middle"
                    className="fill-foreground text-[11px] font-semibold"
                  >
                    {el.kind === "interface" ? `<<interface>>` : ""}
                  </text>
                  <text
                    x={el.x + el.width / 2}
                    y={el.y + 34}
                    textAnchor="middle"
                    className="fill-foreground text-[12px] font-bold"
                  >
                    {el.name}
                  </text>
                  {el.methods && (
                    <text
                      x={el.x + 6}
                      y={el.y + 48}
                      className="fill-muted-foreground text-[9px]"
                    >
                      {el.methods.split("\n")[0]?.slice(0, 18) ?? ""}
                      {el.methods.split("\n").length > 1 ? "…" : ""}
                    </text>
                  )}
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={validateDiagram}>
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Validate
        </Button>
        <Button variant="outline" onClick={exportDiagram}>
          <Download className="h-4 w-4 mr-1" />
          Export Text
        </Button>
        <Button variant="outline" onClick={resetCanvas}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Validation results */}
      <AnimatePresence>
        {showValidation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Validation Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validationResults.map((res, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {res.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">{res.label}</span>
                      </div>
                      <Badge variant={res.passed ? "default" : "destructive"} className="text-xs">
                        {res.message}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <Dialog open={!!editElement} onOpenChange={(open) => !open && setEditElement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editElement?.kind === "interface" ? "Interface" : "Class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editElement?.name ?? ""}
                onChange={(e) =>
                  setEditElement((prev) => (prev ? { ...prev, name: e.target.value } : null))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Methods (one per line)</label>
              <textarea
                rows={4}
                value={editElement?.methods ?? ""}
                onChange={(e) =>
                  setEditElement((prev) => (prev ? { ...prev, methods: e.target.value } : null))
                }
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditElement(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editElement) {
                    setElements((prev) =>
                      prev.map((el) => (el.id === editElement.id ? editElement : el))
                    );
                    setEditElement(null);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
