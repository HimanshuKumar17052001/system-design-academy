"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Monitor,
  Scale,
  Shield,
  Server,
  HardDrive,
  Database,
  MessageSquare,
  Globe,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Info,
  RotateCcw,
  Save,
  Play,
  X,
  Plus,
} from "lucide-react";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type NodeKind =
  | "client"
  | "load-balancer"
  | "api-gateway"
  | "app-server"
  | "cache"
  | "database"
  | "message-queue"
  | "cdn"
  | "blob-storage";

type EdgeKind = "sync" | "async" | "bottleneck";

interface ValidationIssue {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion: string;
}

interface PaletteItem {
  kind: NodeKind;
  label: string;
  icon: React.ElementType;
  color: string;
  textColor: string;
  borderColor: string;
}

// ------------------------------------------------------------------
// Palette
// ------------------------------------------------------------------
const PALETTE: PaletteItem[] = [
  {
    kind: "client",
    label: "Client",
    icon: Monitor,
    color: "bg-blue-50 dark:bg-blue-950",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  {
    kind: "load-balancer",
    label: "Load Balancer",
    icon: Scale,
    color: "bg-purple-50 dark:bg-purple-950",
    textColor: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-300 dark:border-purple-700",
  },
  {
    kind: "api-gateway",
    label: "API Gateway",
    icon: Shield,
    color: "bg-indigo-50 dark:bg-indigo-950",
    textColor: "text-indigo-700 dark:text-indigo-300",
    borderColor: "border-indigo-300 dark:border-indigo-700",
  },
  {
    kind: "app-server",
    label: "App Server",
    icon: Server,
    color: "bg-emerald-50 dark:bg-emerald-950",
    textColor: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-300 dark:border-emerald-700",
  },
  {
    kind: "cache",
    label: "Cache (Redis)",
    icon: HardDrive,
    color: "bg-amber-50 dark:bg-amber-950",
    textColor: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-300 dark:border-amber-700",
  },
  {
    kind: "database",
    label: "Database",
    icon: Database,
    color: "bg-rose-50 dark:bg-rose-950",
    textColor: "text-rose-700 dark:text-rose-300",
    borderColor: "border-rose-300 dark:border-rose-700",
  },
  {
    kind: "message-queue",
    label: "Message Queue",
    icon: MessageSquare,
    color: "bg-cyan-50 dark:bg-cyan-950",
    textColor: "text-cyan-700 dark:text-cyan-300",
    borderColor: "border-cyan-300 dark:border-cyan-700",
  },
  {
    kind: "cdn",
    label: "CDN",
    icon: Globe,
    color: "bg-sky-50 dark:bg-sky-950",
    textColor: "text-sky-700 dark:text-sky-300",
    borderColor: "border-sky-300 dark:border-sky-700",
  },
  {
    kind: "blob-storage",
    label: "Blob Storage",
    icon: Cloud,
    color: "bg-slate-50 dark:bg-slate-950",
    textColor: "text-slate-700 dark:text-slate-300",
    borderColor: "border-slate-300 dark:border-slate-700",
  },
];

const KIND_TO_PALETTE: Record<NodeKind, PaletteItem> = PALETTE.reduce(
  (acc, item) => ({ ...acc, [item.kind]: item }),
  {} as Record<NodeKind, PaletteItem>
);

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function getEdgeStyle(kind: EdgeKind): React.CSSProperties {
  switch (kind) {
    case "sync":
      return { stroke: "#64748b", strokeWidth: 2 };
    case "async":
      return { stroke: "#64748b", strokeWidth: 2, strokeDasharray: "6 4" };
    case "bottleneck":
      return { stroke: "#ef4444", strokeWidth: 3 };
  }
}

function getMarkerEnd(kind: EdgeKind) {
  return {
    type: MarkerType.ArrowClosed,
    color: kind === "bottleneck" ? "#ef4444" : "#64748b",
  };
}

// ------------------------------------------------------------------
// Custom Node
// ------------------------------------------------------------------
interface ArchNodeData extends Record<string, unknown> {
  kind: NodeKind;
  label: string;
}

function ArchitectureNode({ data }: { data: ArchNodeData }) {
  const palette = KIND_TO_PALETTE[data.kind];
  const Icon = palette.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border-2 px-3 py-2 min-w-[120px] text-center shadow-sm",
        palette.color,
        palette.textColor,
        palette.borderColor
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-foreground/50"
      />
      <div className="flex flex-col items-center gap-1">
        <Icon className="h-5 w-5" />
        <span className="text-xs font-semibold">{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-foreground/50"
      />
    </motion.div>
  );
}

const nodeTypes = {
  architecture: ArchitectureNode,
};

// ------------------------------------------------------------------
// Validation
// ------------------------------------------------------------------
function runValidation(nodes: Node<ArchNodeData>[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const kindCounts = countByKind(nodes);
  const appServers = nodes.filter((n) => n.data.kind === "app-server");
  const clients = nodes.filter((n) => n.data.kind === "client");
  const databases = nodes.filter((n) => n.data.kind === "database");
  const loadBalancers = nodes.filter((n) => n.data.kind === "load-balancer");
  const caches = nodes.filter((n) => n.data.kind === "cache");
  const cdns = nodes.filter((n) => n.data.kind === "cdn");

  // 1. Missing LB for >1 app server
  if (appServers.length > 1 && loadBalancers.length === 0) {
    issues.push({
      id: "missing-lb",
      severity: "warning",
      message: `You have ${appServers.length} app servers but no load balancer.`,
      suggestion: "Add a Load Balancer node to distribute traffic evenly across app servers.",
    });
  }

  // 2. Single point of failure
  if (databases.length === 1) {
    issues.push({
      id: "spoof-db",
      severity: "warning",
      message: "Single database instance detected.",
      suggestion: "Add a second database (replica) or shard to eliminate the single point of failure.",
    });
  }
  if (loadBalancers.length === 1) {
    issues.push({
      id: "spoof-lb",
      severity: "warning",
      message: "Single load balancer detected.",
      suggestion: "Consider an active-passive LB pair or DNS-based failover for high availability.",
    });
  }

  // 3. Missing cache for read-heavy path
  const hasReadHeavyPath =
    appServers.length > 0 &&
    databases.length > 0 &&
    edges.some(
      (e) =>
        nodes.find((n) => n.id === e.source)?.data.kind === "app-server" &&
        nodes.find((n) => n.id === e.target)?.data.kind === "database"
    );
  if (hasReadHeavyPath && caches.length === 0) {
    issues.push({
      id: "missing-cache",
      severity: "info",
      message: "App server to database path detected without caching.",
      suggestion: "Add a Cache (Redis) node to reduce database load for read-heavy workloads.",
    });
  }

  // 4. Direct client-to-DB connection
  const directClientDb = edges.some(
    (e) =>
      nodes.find((n) => n.id === e.source)?.data.kind === "client" &&
      nodes.find((n) => n.id === e.target)?.data.kind === "database"
  );
  if (directClientDb) {
    issues.push({
      id: "client-db",
      severity: "error",
      message: "Direct connection from Client to Database detected.",
      suggestion: "Never expose databases directly to clients. Route through an API Gateway or App Server.",
    });
  }

  // 5. No CDN for static assets
  if (clients.length > 0 && cdns.length === 0) {
    issues.push({
      id: "missing-cdn",
      severity: "info",
      message: "No CDN found for serving static assets.",
      suggestion: "Add a CDN node to cache and serve static assets closer to users.",
    });
  }

  return issues;
}

function countByKind(nodes: Node<ArchNodeData>[]) {
  const counts: Record<string, number> = {};
  nodes.forEach((n) => {
    counts[n.data.kind] = (counts[n.data.kind] || 0) + 1;
  });
  return counts;
}

// ------------------------------------------------------------------
// Inner Canvas
// ------------------------------------------------------------------
function ArchitectureCanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ArchNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [edgeType, setEdgeType] = useState<EdgeKind>("sync");
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [nextId, setNextId] = useState(1);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        style: getEdgeStyle(edgeType),
        markerEnd: getMarkerEnd(edgeType),
        data: { type: edgeType },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [edgeType, setEdges]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const types: EdgeKind[] = ["sync", "async", "bottleneck"];
      const current: EdgeKind = ((edge.data as unknown as { type?: EdgeKind } | undefined)?.type) || "sync";
      const next = types[(types.indexOf(current) + 1) % types.length];
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edge.id
            ? {
                ...e,
                style: getEdgeStyle(next),
                markerEnd: getMarkerEnd(next),
                data: { ...e.data, type: next },
              }
            : e
        )
      );
    },
    [setEdges]
  );

  const onDragStart = useCallback(
    (event: React.DragEvent, kind: NodeKind) => {
      event.dataTransfer.setData("application/reactflow", kind);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData("application/reactflow") as NodeKind;
      if (!kind || !PALETTE.find((p) => p.kind === kind)) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const palette = KIND_TO_PALETTE[kind];
      const newNode: Node<ArchNodeData> = {
        id: `${kind}-${nextId}`,
        type: "architecture",
        position,
        data: { kind, label: palette.label },
      };

      setNextId((id) => id + 1);
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, nextId]
  );

  const handleValidate = useCallback(() => {
    const issues = runValidation(nodes, edges);
    setValidationIssues(issues);
    setShowValidation(true);
  }, [nodes, edges]);

  const handleSave = useCallback(() => {
    const graph = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.kind,
        label: n.data.label,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.data?.type || "sync",
      })),
    };
    console.log("Architecture Graph JSON:", JSON.stringify(graph, null, 2));
    alert("Architecture exported to console (see DevTools)");
  }, [nodes, edges]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNextId(1);
    setValidationIssues([]);
    setShowValidation(false);
  }, [setNodes, setEdges]);

  const nodeKindCounts = useMemo(() => countByKind(nodes), [nodes]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Palette Sidebar */}
      <Card className="lg:w-56 shrink-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Node Palette
          </CardTitle>
          <CardDescription className="text-xs">
            Drag nodes onto the canvas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {PALETTE.map((item) => {
              const Icon = item.icon;
              const count = nodeKindCounts[item.kind] || 0;
              return (
                <div
                  key={item.kind}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.kind)}
                  className={cn(
                    "cursor-grab active:cursor-grabbing rounded-md border px-2 py-2 flex items-center gap-2 hover:shadow-sm transition-shadow select-none",
                    item.color,
                    item.borderColor
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", item.textColor)} />
                  <span className={cn("text-xs font-medium", item.textColor)}>
                    {item.label}
                  </span>
                  {count > 0 && (
                    <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1">
                      {count}
                    </Badge>
                  )}
                </div>
              );
            })}
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
          <Button size="sm" variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleClear}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Edge:</span>
            {(["sync", "async", "bottleneck"] as EdgeKind[]).map((t) => (
              <Button
                key={t}
                size="xs"
                variant={edgeType === t ? "default" : "outline"}
                onClick={() => setEdgeType(t)}
                className="text-xs capitalize"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full mr-1",
                    t === "sync" && "bg-slate-500",
                    t === "async" && "bg-slate-500 border border-slate-500 border-dashed",
                    t === "bottleneck" && "bg-red-500"
                  )}
                />
                {t === "bottleneck" ? "Bottleneck" : t}
              </Button>
            ))}
          </div>

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
              onClick={() => setShowValidation(!showValidation)}
            >
              {validationIssues.length} issues
            </Badge>
          )}
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 min-h-[400px] rounded-xl border overflow-hidden bg-card">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background gap={16} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              className="!bg-card !border !border-border"
              maskColor="rgba(0,0,0,0.1)"
            />
            <Panel position="top-right" className="m-0">
              <div className="text-[10px] text-muted-foreground bg-card/80 backdrop-blur px-2 py-1 rounded border">
                Click edge to cycle type
              </div>
            </Panel>
          </ReactFlow>
        </div>

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
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setShowValidation(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {validationIssues.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      No issues found. Architecture looks good!
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

// ------------------------------------------------------------------
// Export wrapped with provider
// ------------------------------------------------------------------
export default function ArchitectureCanvas() {
  return (
    <ReactFlowProvider>
      <ArchitectureCanvasInner />
    </ReactFlowProvider>
  );
}

// ------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
