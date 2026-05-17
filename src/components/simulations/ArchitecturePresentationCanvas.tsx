"use client";

import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
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
  Zap,
  MapPin,
  BarChart3,
  Timer,
  Users,
} from "lucide-react";

const NODE_KINDS = [
  { kind: "client", label: "Client", icon: Monitor, color: "bg-blue-50 dark:bg-blue-950", textColor: "text-blue-700 dark:text-blue-300", borderColor: "border-blue-300 dark:border-blue-700" },
  { kind: "load-balancer", label: "Load Balancer", icon: Scale, color: "bg-purple-50 dark:bg-purple-950", textColor: "text-purple-700 dark:text-purple-300", borderColor: "border-purple-300 dark:border-purple-700" },
  { kind: "api-gateway", label: "API Gateway", icon: Shield, color: "bg-indigo-50 dark:bg-indigo-950", textColor: "text-indigo-700 dark:text-indigo-300", borderColor: "border-indigo-300 dark:border-indigo-700" },
  { kind: "app-server", label: "App Server", icon: Server, color: "bg-emerald-50 dark:bg-emerald-950", textColor: "text-emerald-700 dark:text-emerald-300", borderColor: "border-emerald-300 dark:border-emerald-700" },
  { kind: "cache", label: "Cache", icon: HardDrive, color: "bg-amber-50 dark:bg-amber-950", textColor: "text-amber-700 dark:text-amber-300", borderColor: "border-amber-300 dark:border-amber-700" },
  { kind: "database", label: "Database", icon: Database, color: "bg-rose-50 dark:bg-rose-950", textColor: "text-rose-700 dark:text-rose-300", borderColor: "border-rose-300 dark:border-rose-700" },
  { kind: "message-queue", label: "Message Queue", icon: MessageSquare, color: "bg-cyan-50 dark:bg-cyan-950", textColor: "text-cyan-700 dark:text-cyan-300", borderColor: "border-cyan-300 dark:border-cyan-700" },
  { kind: "cdn", label: "CDN", icon: Globe, color: "bg-sky-50 dark:bg-sky-950", textColor: "text-sky-700 dark:text-sky-300", borderColor: "border-sky-300 dark:border-sky-700" },
  { kind: "blob-storage", label: "Blob Storage", icon: Cloud, color: "bg-slate-50 dark:bg-slate-950", textColor: "text-slate-700 dark:text-slate-300", borderColor: "border-slate-300 dark:border-slate-700" },
  { kind: "analytics", label: "Analytics", icon: BarChart3, color: "bg-teal-50 dark:bg-teal-950", textColor: "text-teal-700 dark:text-teal-300", borderColor: "border-teal-300 dark:border-teal-700" },
  { kind: "geo-index", label: "Geo Index", icon: MapPin, color: "bg-orange-50 dark:bg-orange-950", textColor: "text-orange-700 dark:text-orange-300", borderColor: "border-orange-300 dark:border-orange-700" },
  { kind: "dispatch", label: "Dispatch", icon: Zap, color: "bg-lime-50 dark:bg-lime-950", textColor: "text-lime-700 dark:text-lime-300", borderColor: "border-lime-300 dark:border-lime-700" },
  { kind: "timeline-service", label: "Timeline Service", icon: Timer, color: "bg-violet-50 dark:bg-violet-950", textColor: "text-violet-700 dark:text-violet-300", borderColor: "border-violet-300 dark:border-violet-700" },
  { kind: "graph-service", label: "Graph Service", icon: Users, color: "bg-fuchsia-50 dark:bg-fuchsia-950", textColor: "text-fuchsia-700 dark:text-fuchsia-300", borderColor: "border-fuchsia-300 dark:border-fuchsia-700" },
  { kind: "tweet-service", label: "Tweet Service", icon: MessageSquare, color: "bg-pink-50 dark:bg-pink-950", textColor: "text-pink-700 dark:text-pink-300", borderColor: "border-pink-300 dark:border-pink-700" },
] as const;

type NodeKind = (typeof NODE_KINDS)[number]["kind"];

const KIND_MAP: Record<string, (typeof NODE_KINDS)[number]> = NODE_KINDS.reduce(
  (acc, item) => ({ ...acc, [item.kind]: item }),
  {}
);

function PresentationNode({ data }: { data: Record<string, unknown> }) {
  const kind = (data.kind as NodeKind) || "app-server";
  const palette = KIND_MAP[kind] || KIND_MAP["app-server"];
  const Icon = palette.icon;
  const label = (data.label as string) || palette.label;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
      className={cn(
        "rounded-lg border-2 px-3 py-2 min-w-[130px] text-center shadow-sm cursor-default select-none",
        palette.color,
        palette.textColor,
        palette.borderColor
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-foreground/50" />
      <div className="flex flex-col items-center gap-1">
        <Icon className="h-5 w-5" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-foreground/50" />
    </motion.div>
  );
}

const nodeTypes = {
  presentation: PresentationNode,
};

function getEdgeStyle(animated = false): React.CSSProperties {
  return {
    stroke: animated ? "#3b82f6" : "#64748b",
    strokeWidth: animated ? 2.5 : 2,
    strokeDasharray: animated ? undefined : undefined,
  };
}

function getMarkerEnd(animated = false) {
  return {
    type: MarkerType.ArrowClosed,
    color: animated ? "#3b82f6" : "#64748b",
  };
}

interface ArchitecturePresentationCanvasProps {
  nodes: Node<Record<string, unknown>>[];
  edges: Edge<Record<string, unknown>>[];
  visibleNodeIds: string[];
  visibleEdgeIds: string[];
  annotations?: { nodeId: string; text: string; type: "trade-off" | "note" | "warning" }[];
  fitView?: boolean;
}

export default function ArchitecturePresentationCanvas({
  nodes,
  edges,
  visibleNodeIds,
  visibleEdgeIds,
  annotations,
  fitView = true,
}: ArchitecturePresentationCanvasProps) {
  const visibleNodes = useMemo(
    () =>
      nodes
        .filter((n) => visibleNodeIds.includes(n.id))
        .map((n) => ({ ...n, type: "presentation" as const })),
    [nodes, visibleNodeIds]
  );

  const visibleEdges = useMemo(
    () =>
      edges
        .filter((e) => visibleEdgeIds.includes(e.id))
        .map((e, i) => ({
          ...e,
          animated: true,
          style: getEdgeStyle(true),
          markerEnd: getMarkerEnd(true),
          // stagger animation by index
          data: { ...e.data, index: i },
        })),
    [edges, visibleEdgeIds]
  );

  const [rfNodes, setNodes, onNodesChange] = useNodesState(visibleNodes);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(visibleEdges);

  useEffect(() => {
    setNodes(visibleNodes);
  }, [visibleNodes, setNodes]);

  useEffect(() => {
    setEdges(visibleEdges);
  }, [visibleEdges, setEdges]);

  const annotationMap = useMemo(() => {
    if (!annotations) return {} as Record<string, { text: string; type: string }>;
    return annotations.reduce((acc, ann) => {
      acc[ann.nodeId] = ann;
      return acc;
    }, {} as Record<string, { text: string; type: string }>);
  }, [annotations]);

  return (
    <div className="h-full w-full rounded-xl border overflow-hidden bg-card">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView={fitView}
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnScroll={false}
        panOnDrag={false}
        selectionOnDrag={false}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Annotation overlays */}
      {annotations && annotations.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
          {annotations.map((ann, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium shadow-sm pointer-events-auto",
                ann.type === "trade-off" && "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300",
                ann.type === "note" && "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300",
                ann.type === "warning" && "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
              )}
            >
              {ann.text}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
