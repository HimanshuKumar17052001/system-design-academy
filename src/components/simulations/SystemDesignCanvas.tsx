"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Monitor,
  Scale,
  Shield,
  Server,
  HardDrive,
  Database,
  MessageSquare,
  Globe,
  Play,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Info,
  MousePointerClick,
  Minus,
  PenLine,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type ComponentKind =
  | "client"
  | "load-balancer"
  | "api-gateway"
  | "app-server"
  | "cache"
  | "database"
  | "queue"
  | "cdn";

type ConnectionType = "sync" | "async";

interface CanvasNode {
  id: string;
  kind: ComponentKind;
  x: number;
  y: number;
}

interface CanvasEdge {
  id: string;
  from: string;
  to: string;
  type: ConnectionType;
  label: string;
}

interface PaletteItem {
  kind: ComponentKind;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface ValidationIssue {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion: string;
}

// ------------------------------------------------------------------
// Palette
// ------------------------------------------------------------------
const PALETTE: PaletteItem[] = [
  {
    kind: "client",
    label: "Client",
    icon: Monitor,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  {
    kind: "load-balancer",
    label: "LB",
    icon: Scale,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "border-purple-300 dark:border-purple-700",
  },
  {
    kind: "api-gateway",
    label: "API Gateway",
    icon: Shield,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    borderColor: "border-indigo-300 dark:border-indigo-700",
  },
  {
    kind: "app-server",
    label: "App Server",
    icon: Server,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-300 dark:border-emerald-700",
  },
  {
    kind: "cache",
    label: "Cache",
    icon: HardDrive,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-300 dark:border-amber-700",
  },
  {
    kind: "database",
    label: "DB",
    icon: Database,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-300 dark:border-rose-700",
  },
  {
    kind: "queue",
    label: "Queue",
    icon: MessageSquare,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
    borderColor: "border-cyan-300 dark:border-cyan-700",
  },
  {
    kind: "cdn",
    label: "CDN",
    icon: Globe,
    color: "text-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-300 dark:border-sky-700",
  },
];

const KIND_TO_PALETTE: Record<ComponentKind, PaletteItem> = PALETTE.reduce(
  (acc, item) => ({ ...acc, [item.kind]: item }),
  {} as Record<ComponentKind, PaletteItem>
);

const GRID_SIZE = 40;

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function snapToGrid(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function runValidation(nodes: CanvasNode[], edges: CanvasEdge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const kindCounts = countByKind(nodes);
  const hasKind = (k: ComponentKind) => (kindCounts[k] || 0) > 0;

  if (nodes.length === 0) {
    return [{ id: "empty", severity: "info", message: "Canvas is empty.", suggestion: "Add components to begin your design." }];
  }

  // Missing LB with multiple app servers
  if ((kindCounts["app-server"] || 0) > 1 && !hasKind("load-balancer")) {
    issues.push({
      id: "missing-lb",
      severity: "warning",
      message: "Multiple app servers without a load balancer.",
      suggestion: "Add a Load Balancer to distribute traffic.",
    });
  }

  // Single point of failure: single DB
  if (kindCounts["database"] === 1) {
    issues.push({
      id: "spoof-db",
      severity: "warning",
      message: "Single database instance — potential SPOF.",
      suggestion: "Consider adding a second DB (replica or secondary node).",
    });
  }

  // Missing cache
  const hasAppDbPath = edges.some(
    (e) =>
      nodes.find((n) => n.id === e.from)?.kind === "app-server" &&
      nodes.find((n) => n.id === e.to)?.kind === "database"
  );
  if (hasAppDbPath && !hasKind("cache")) {
    issues.push({
      id: "missing-cache",
      severity: "info",
      message: "App server talks directly to DB without cache.",
      suggestion: "Add a Cache layer for read-heavy workloads.",
    });
  }

  // Missing CDN with clients
  if (hasKind("client") && !hasKind("cdn")) {
    issues.push({
      id: "missing-cdn",
      severity: "info",
      message: "No CDN for static assets.",
      suggestion: "Add a CDN to serve static content closer to users.",
    });
  }

  // Direct client to DB
  const directClientDb = edges.some(
    (e) =>
      nodes.find((n) => n.id === e.from)?.kind === "client" &&
      nodes.find((n) => n.id === e.to)?.kind === "database"
  );
  if (directClientDb) {
    issues.push({
      id: "client-db",
      severity: "error",
      message: "Direct Client to Database connection detected.",
      suggestion: "Route through an API Gateway or App Server.",
    });
  }

  return issues;
}

function countByKind(nodes: CanvasNode[]) {
  const counts: Partial<Record<ComponentKind, number>> = {};
  nodes.forEach((n) => {
    counts[n.kind] = (counts[n.kind] || 0) + 1;
  });
  return counts;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function SystemDesignCanvas() {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [selectedKind, setSelectedKind] = useState<ComponentKind | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionFrom, setConnectionFrom] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<ConnectionType>("sync");
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [edgeLabelInput, setEdgeLabelInput] = useState("");
  const [pendingEdge, setPendingEdge] = useState<CanvasEdge | null>(null);
  const nextIdRef = useRef(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedKind) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = snapToGrid(e.clientX - rect.left);
      const y = snapToGrid(e.clientY - rect.top);
      const id = `${selectedKind}-${nextIdRef.current}`;
      nextIdRef.current += 1;
      setNodes((prev) => [...prev, { id, kind: selectedKind, x, y }]);
    },
    [selectedKind]
  );

  const handleNodeClick = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      if (!connectionMode) {
        setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
        return;
      }
      if (!connectionFrom) {
        setConnectionFrom(nodeId);
        return;
      }
      if (connectionFrom === nodeId) {
        setConnectionFrom(null);
        return;
      }
      const newEdge: CanvasEdge = {
        id: `e-${connectionFrom}-${nodeId}-${Date.now()}`,
        from: connectionFrom,
        to: nodeId,
        type: connectionType,
        label: "",
      };
      setPendingEdge(newEdge);
      setConnectionFrom(null);
    },
    [connectionMode, connectionFrom, connectionType]
  );

  const confirmEdgeLabel = useCallback(() => {
    if (!pendingEdge) return;
    setEdges((prev) => [...prev, { ...pendingEdge, label: edgeLabelInput.trim() }]);
    setPendingEdge(null);
    setEdgeLabelInput("");
  }, [pendingEdge, edgeLabelInput]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.from !== nodeId && e.to !== nodeId));
    setSelectedNodeId(null);
  }, []);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  }, []);

  const handleValidate = useCallback(() => {
    const issues = runValidation(nodes, edges);
    setValidationIssues(issues);
    setShowValidation(true);
  }, [nodes, edges]);

  const handleExport = useCallback(() => {
    const graph = { nodes, edges };
    console.log("System Design Canvas Export:", JSON.stringify(graph, null, 2));
    alert("Design exported to console (see DevTools)");
  }, [nodes, edges]);

  const handleReset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setConnectionFrom(null);
    setPendingEdge(null);
    setShowValidation(false);
    setValidationIssues([]);
    nextIdRef.current = 1;
  }, []);

  const nodeKindCounts = countByKind(nodes);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Sidebar */}
      <Card className="lg:w-56 shrink-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" />
            Components
          </CardTitle>
          <CardDescription className="text-xs">
            Select a component, then click on the canvas to place it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {PALETTE.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedKind === item.kind;
              const count = nodeKindCounts[item.kind] || 0;
              return (
                <button
                  key={item.kind}
                  onClick={() => {
                    setSelectedKind((prev) => (prev === item.kind ? null : item.kind));
                    setConnectionMode(false);
                    setConnectionFrom(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2 py-2 text-left text-xs font-medium transition-all select-none",
                    isSelected
                      ? cn("ring-2 ring-primary shadow-sm", item.bgColor, item.borderColor)
                      : "bg-card hover:bg-muted/50 border-border"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", item.color)} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {count > 0 && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          <Separator className="my-3" />

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Connection Mode</div>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant={connectionMode ? "default" : "outline"}
                onClick={() => {
                  setConnectionMode((p) => !p);
                  setSelectedKind(null);
                  setConnectionFrom(null);
                }}
              >
                <PenLine className="h-3 w-3 mr-1" />
                {connectionMode ? "On" : "Off"}
              </Button>
              {connectionMode && (
                <div className="flex gap-1">
                  <Button
                    size="xs"
                    variant={connectionType === "sync" ? "secondary" : "outline"}
                    onClick={() => setConnectionType("sync")}
                    className="text-[10px]"
                  >
                    Sync
                  </Button>
                  <Button
                    size="xs"
                    variant={connectionType === "async" ? "secondary" : "outline"}
                    onClick={() => setConnectionType("async")}
                    className="text-[10px]"
                  >
                    Async
                  </Button>
                </div>
              )}
            </div>
            {connectionMode && (
              <p className="text-[10px] text-muted-foreground">
                Click two nodes to connect them. {connectionFrom ? "Select target node..." : "Select source node..."}
              </p>
            )}
          </div>

          <Separator className="my-3" />

          {/* Legend */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Legend</div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Minus className="h-3 w-3" />
              <span>Synchronous</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Minus className="h-3 w-3 border-dashed border-b" />
              <span>Asynchronous</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleValidate}>
            <Play className="h-4 w-4 mr-1" />
            Validate
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>

          {selectedNodeId && (
            <>
              <div className="h-6 w-px bg-border mx-1" />
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteNode(selectedNodeId)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Node
              </Button>
            </>
          )}

          {showValidation && validationIssues.length > 0 && (
            <Badge
              variant={
                validationIssues.some((i) => i.severity === "error")
                  ? "destructive"
                  : validationIssues.some((i) => i.severity === "warning")
                    ? "secondary"
                    : "default"
              }
              className="ml-auto cursor-pointer"
              onClick={() => setShowValidation((s) => !s)}
            >
              {validationIssues.length} issues
            </Badge>
          )}
        </div>

        {/* Canvas */}
        <div className="relative flex-1 min-h-[400px] rounded-xl border overflow-hidden bg-card">
          <div
            className={cn(
              "absolute inset-0",
              selectedKind ? "cursor-crosshair" : "cursor-default"
            )}
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--border) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px)",
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            }}
            onClick={handleCanvasClick}
          >
            {/* SVG Connections */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
                <marker id="arrowhead-async" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
              </defs>
              {edges.map((edge) => {
                const fromNode = nodes.find((n) => n.id === edge.from);
                const toNode = nodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                const x1 = fromNode.x + 28;
                const y1 = fromNode.y + 28;
                const x2 = toNode.x + 28;
                const y2 = toNode.y + 28;
                const isAsync = edge.type === "async";
                return (
                  <g key={edge.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isAsync ? "#94a3b8" : "#64748b"}
                      strokeWidth={2}
                      strokeDasharray={isAsync ? "6 4" : undefined}
                      markerEnd={`url(#${isAsync ? "arrowhead-async" : "arrowhead"})`}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEdge(edge.id);
                      }}
                    />
                    {edge.label && (
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 6}
                        textAnchor="middle"
                        className="text-[10px] fill-muted-foreground pointer-events-none"
                        style={{ fontSize: 10 }}
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              const palette = KIND_TO_PALETTE[node.kind];
              const Icon = palette.icon;
              const isSelected = selectedNodeId === node.id;
              const isConnectionSource = connectionFrom === node.id;
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "absolute w-14 h-14 rounded-lg border flex flex-col items-center justify-center gap-0.5 shadow-sm select-none",
                    palette.bgColor,
                    palette.borderColor,
                    isSelected && "ring-2 ring-primary z-10",
                    isConnectionSource && "ring-2 ring-amber-400 z-10"
                  )}
                  style={{ left: node.x, top: node.y }}
                  onClick={(e) => handleNodeClick(e, node.id)}
                >
                  <Icon className={cn("h-4 w-4", palette.color)} />
                  <span className="text-[9px] font-medium leading-none text-center px-1 truncate w-full">
                    {palette.label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Hint overlay */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground text-sm">
                <MousePointerClick className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a component from the sidebar</p>
                <p className="text-xs">Then click anywhere on this grid to place it</p>
              </div>
            </div>
          )}
        </div>

        {/* Edge Label Dialog / Inline */}
        <AnimatePresence>
          {pendingEdge && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card size="sm">
                <CardContent className="flex items-center gap-2 pt-3">
                  <span className="text-xs text-muted-foreground shrink-0">Connection label:</span>
                  <input
                    type="text"
                    value={edgeLabelInput}
                    onChange={(e) => setEdgeLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmEdgeLabel();
                    }}
                    placeholder="e.g., HTTP, gRPC, Events"
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                    autoFocus
                  />
                  <Button size="sm" onClick={confirmEdgeLabel}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setPendingEdge(null); setEdgeLabelInput(""); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Panel */}
        <AnimatePresence>
          {showValidation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card size="sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Validation Results</CardTitle>
                  <Button variant="ghost" size="icon-xs" onClick={() => setShowValidation(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {validationIssues.length === 0 || (validationIssues.length === 1 && validationIssues[0].id === "empty") ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      No issues found. Design looks good!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {validationIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className={cn(
                            "flex items-start gap-2 rounded-md border p-2 text-sm",
                            issue.severity === "error" &&
                              "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
                            issue.severity === "warning" &&
                              "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
                            issue.severity === "info" &&
                              "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
                          )}
                        >
                          {issue.severity === "error" ? (
                            <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          ) : issue.severity === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{issue.message}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {issue.suggestion}
                            </div>
                          </div>
                          <Badge
                            variant={
                              issue.severity === "error"
                                ? "destructive"
                                : issue.severity === "warning"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-[10px] h-5 shrink-0 capitalize"
                          >
                            {issue.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
