"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Triangle,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
} from "lucide-react";

type NodeId = "A" | "B" | "C";
type SystemMode = "CP" | "AP";

interface NodeState {
  id: NodeId;
  value: number;
  label: string;
  x: number;
  y: number;
}

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface Partition {
  from: NodeId;
  to: NodeId;
}

const INITIAL_VALUE = 5;

export default function CAPPlayground() {
  const [nodes, setNodes] = useState<Record<NodeId, NodeState>>({
    A: { id: "A", value: INITIAL_VALUE, label: "Node A", x: 200, y: 80 },
    B: { id: "B", value: INITIAL_VALUE, label: "Node B", x: 80, y: 280 },
    C: { id: "C", value: INITIAL_VALUE, label: "Node C", x: 320, y: 280 },
  });

  const [partitions, setPartitions] = useState<Partition[]>([
    { from: "A", to: "B" },
    { from: "B", to: "C" },
    { from: "A", to: "C" },
  ]);
  const [activePartition, setActivePartition] = useState<Partition | null>(null);
  const [mode, setMode] = useState<SystemMode>("CP");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastWriteTime, setLastWriteTime] = useState<number>(Date.now());
  const [showOverlay, setShowOverlay] = useState<string | null>(null);
  const [pulsingNode, setPulsingNode] = useState<NodeId | null>(null);
  const logIdRef = useRef(0);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    logIdRef.current += 1;
    setLogs((prev) => [
      ...prev,
      { id: logIdRef.current, time, message, type },
    ]);
  }, []);

  const isPartitioned = useCallback(
    (from: NodeId, to: NodeId) => {
      if (!activePartition) return false;
      return (
        (activePartition.from === from && activePartition.to === to) ||
        (activePartition.from === to && activePartition.to === from)
      );
    },
    [activePartition]
  );

  const canReplicate = useCallback(
    (from: NodeId, to: NodeId) => {
      return !isPartitioned(from, to);
    },
    [isPartitioned]
  );

  const handleWriteToA = useCallback(() => {
    const newValue = nodes.A.value + 5;
    setLastWriteTime(Date.now());
    setPulsingNode("A");
    setTimeout(() => setPulsingNode(null), 600);

    setNodes((prev) => {
      const next: Record<NodeId, NodeState> = { ...prev, A: { ...prev.A, value: newValue } };

      if (mode === "CP" && activePartition) {
        // In CP mode during partition, only replicate to non-partitioned nodes
        if (canReplicate("A", "B")) {
          next.B = { ...prev.B, value: newValue };
        }
        if (canReplicate("A", "C")) {
          next.C = { ...prev.C, value: newValue };
        }
      } else {
        // In AP mode or no partition, try to replicate everywhere
        if (canReplicate("A", "B")) {
          next.B = { ...prev.B, value: newValue };
        }
        if (canReplicate("A", "C")) {
          next.C = { ...prev.C, value: newValue };
        }
      }

      return next;
    });

    if (mode === "CP" && activePartition) {
      const partitionedNodes: NodeId[] = [];
      if (isPartitioned("A", "B")) partitionedNodes.push("B");
      if (isPartitioned("A", "C")) partitionedNodes.push("C");

      if (partitionedNodes.length > 0) {
        addLog(
          `Write x=${newValue} to A. Partition detected. Nodes ${partitionedNodes.join(", ")} marked UNAVAILABLE (CP mode)`,
          "warning"
        );
      } else {
        addLog(`Write x=${newValue} to A. Replicated to all nodes.`, "success");
      }
    } else if (activePartition) {
      const staleNodes: NodeId[] = [];
      if (isPartitioned("A", "B")) staleNodes.push("B");
      if (isPartitioned("A", "C")) staleNodes.push("C");

      if (staleNodes.length > 0) {
        addLog(
          `Write x=${newValue} to A. Nodes ${staleNodes.join(", ")} will serve stale data (AP mode)`,
          "warning"
        );
      } else {
        addLog(`Write x=${newValue} to A. Replicated to all nodes.`, "success");
      }
    } else {
      addLog(`Write x=${newValue} to A. Replicated to all nodes.`, "success");
    }
  }, [nodes.A.value, mode, activePartition, canReplicate, isPartitioned, addLog]);

  const handleReadFromB = useCallback(() => {
    const value = nodes.B.value;
    const isStale =
      activePartition && isPartitioned("A", "B") && nodes.B.value !== nodes.A.value;

    setPulsingNode("B");
    setTimeout(() => setPulsingNode(null), 600);

    if (mode === "CP" && activePartition && isPartitioned("A", "B")) {
      addLog(`Read from B returned UNAVAILABLE (partitioned, CP mode)`, "error");
    } else if (isStale) {
      addLog(
        `Read from B returned x=${value} (stale: A has x=${nodes.A.value})`,
        "warning"
      );
    } else {
      addLog(`Read from B returned x=${value} (latest)`, "success");
    }
  }, [nodes, mode, activePartition, isPartitioned, addLog]);

  const togglePartition = useCallback(() => {
    if (activePartition) {
      setActivePartition(null);
      addLog("Network partition healed. All nodes connected.", "success");
    } else {
      // Default to A-B partition
      const newPartition: Partition = { from: "A", to: "B" };
      setActivePartition(newPartition);
      addLog(`Partition A-B detected. Network link severed.`, "warning");
    }
  }, [activePartition, addLog]);

  const cyclePartition = useCallback(() => {
    if (!activePartition) {
      togglePartition();
      return;
    }
    const pairs: Partition[] = [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "A", to: "C" },
    ];
    const currentIndex = pairs.findIndex(
      (p) =>
        (p.from === activePartition.from && p.to === activePartition.to) ||
        (p.from === activePartition.to && p.to === activePartition.from)
    );
    const nextIndex = (currentIndex + 1) % pairs.length;
    setActivePartition(pairs[nextIndex]);
    addLog(
      `Partition changed to ${pairs[nextIndex].from}-${pairs[nextIndex].to}`,
      "warning"
    );
  }, [activePartition, addLog, togglePartition]);

  const handleReset = useCallback(() => {
    setNodes({
      A: { id: "A", value: INITIAL_VALUE, label: "Node A", x: 200, y: 80 },
      B: { id: "B", value: INITIAL_VALUE, label: "Node B", x: 80, y: 280 },
      C: { id: "C", value: INITIAL_VALUE, label: "Node C", x: 320, y: 280 },
    });
    setActivePartition(null);
    setMode("CP");
    setLogs([]);
    addLog("System reset. All nodes at x=5. No partitions.", "info");
  }, [addLog]);

  const getNodeStatus = (nodeId: NodeId): { label: string; tone: "good" | "warning" | "danger" } => {
    if (mode === "CP" && activePartition) {
      const partitionedWithA = isPartitioned(nodeId, "A");
      if (partitionedWithA && nodeId !== "A") {
        return { label: "Unavailable", tone: "danger" };
      }
    }
    if (activePartition) {
      if (isPartitioned(nodeId, "A") && nodes[nodeId].value !== nodes.A.value) {
        return { label: "Stale", tone: "warning" };
      }
    }
    return { label: "Latest", tone: "good" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Triangle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">CAP Theorem Playground</h2>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {mode === "CP" ? "Consistency + Partition Tolerance" : "Availability + Partition Tolerance"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={handleWriteToA}>
          <Server className="h-4 w-4 mr-1" />
          Write to A
        </Button>
        <Button size="sm" variant="outline" onClick={handleReadFromB}>
          <Server className="h-4 w-4 mr-1" />
          Read from B
        </Button>
        <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
          <Switch
            checked={!!activePartition}
            onCheckedChange={togglePartition}
            label="Network Partition"
          />
          {activePartition && (
            <Button size="xs" variant="ghost" onClick={cyclePartition} className="h-6 text-xs">
              {activePartition.from}↔{activePartition.to}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1 border rounded-lg p-0.5">
          <Button
            size="xs"
            variant={mode === "CP" ? "default" : "ghost"}
            onClick={() => {
              setMode("CP");
              setShowOverlay("CP");
              setTimeout(() => setShowOverlay(null), 4000);
            }}
            className="h-7 text-xs"
          >
            CP Mode
          </Button>
          <Button
            size="xs"
            variant={mode === "AP" ? "default" : "ghost"}
            onClick={() => {
              setMode("AP");
              setShowOverlay("AP");
              setTimeout(() => setShowOverlay(null), 4000);
            }}
            className="h-7 text-xs"
          >
            AP Mode
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {/* Visualization */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative w-full flex justify-center">
            <svg width="400" height="360" viewBox="0 0 400 360" className="max-w-full">
              {/* Connection lines */}
              {partitions.map((partition) => {
                const fromNode = nodes[partition.from];
                const toNode = nodes[partition.to];
                const isActive = isPartitioned(partition.from, partition.to);
                return (
                  <motion.line
                    key={`${partition.from}-${partition.to}`}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={isActive ? "#ef4444" : "#10b981"}
                    strokeWidth={isActive ? 3 : 2}
                    strokeDasharray={isActive ? "8 4" : "0"}
                    initial={false}
                    animate={{
                      stroke: isActive ? "#ef4444" : "#10b981",
                      strokeWidth: isActive ? 3 : 2,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                );
              })}

              {/* Nodes */}
              {(Object.keys(nodes) as NodeId[]).map((nodeId) => {
                const node = nodes[nodeId];
                const status = getNodeStatus(nodeId);
                const isPulse = pulsingNode === nodeId;
                const partitionedWithA =
                  mode === "CP" && activePartition && isPartitioned(nodeId, "A") && nodeId !== "A";

                return (
                  <g key={nodeId}>
                    {/* Pulse effect */}
                    {isPulse && (
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r={30}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        initial={{ opacity: 0.8, r: 30 }}
                        animate={{ opacity: 0, r: 50 }}
                        transition={{ duration: 0.6 }}
                      />
                    )}
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={28}
                      fill={partitionedWithA ? "#fee2e2" : status.tone === "warning" ? "#fef3c7" : "#d1fae5"}
                      stroke={partitionedWithA ? "#ef4444" : status.tone === "warning" ? "#f59e0b" : "#10b981"}
                      strokeWidth={2}
                      animate={{
                        fill: partitionedWithA
                          ? "#fee2e2"
                          : status.tone === "warning"
                            ? "#fef3c7"
                            : "#d1fae5",
                        stroke: partitionedWithA
                          ? "#ef4444"
                          : status.tone === "warning"
                            ? "#f59e0b"
                            : "#10b981",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                    <text
                      x={node.x}
                      y={node.y - 6}
                      textAnchor="middle"
                      className="text-xs font-medium fill-foreground"
                      style={{ fontSize: 12 }}
                    >
                      {node.label}
                    </text>
                    <motion.text
                      x={node.x}
                      y={node.y + 10}
                      textAnchor="middle"
                      className="font-mono font-semibold fill-foreground"
                      style={{ fontSize: 13 }}
                      key={node.value}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      x={node.value}
                    </motion.text>
                    {/* Status badge */}
                    <rect
                      x={node.x - 28}
                      y={node.y + 32}
                      width={56}
                      height={18}
                      rx={9}
                      fill={
                        status.tone === "danger"
                          ? "#ef4444"
                          : status.tone === "warning"
                            ? "#f59e0b"
                            : "#10b981"
                      }
                      opacity={0.15}
                    />
                    <text
                      x={node.x}
                      y={node.y + 44}
                      textAnchor="middle"
                      className="font-medium"
                      style={{
                        fontSize: 10,
                        fill:
                          status.tone === "danger"
                            ? "#dc2626"
                            : status.tone === "warning"
                              ? "#b45309"
                              : "#059669",
                      }}
                    >
                      {status.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Live State Display */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {(Object.keys(nodes) as NodeId[]).map((nodeId) => {
              const node = nodes[nodeId];
              const status = getNodeStatus(nodeId);
              return (
                <motion.div
                  key={nodeId}
                  className="rounded-lg border p-3 text-center"
                  animate={{
                    borderColor:
                      status.tone === "danger"
                        ? "#fca5a5"
                        : status.tone === "warning"
                          ? "#fcd34d"
                          : "#86efac",
                    backgroundColor:
                      status.tone === "danger"
                        ? "rgba(254, 226, 226, 0.5)"
                        : status.tone === "warning"
                          ? "rgba(254, 243, 199, 0.5)"
                          : "rgba(209, 250, 229, 0.5)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {node.label}
                  </div>
                  <div className="font-mono font-semibold text-lg">x={node.value}</div>
                  <Badge
                    variant={
                      status.tone === "danger"
                        ? "destructive"
                        : status.tone === "warning"
                          ? "secondary"
                          : "default"
                    }
                    className="mt-1 text-xs"
                  >
                    {status.label}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Educational Overlays */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`rounded-lg p-4 text-sm ${
              showOverlay === "CP"
                ? "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100"
                : "bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100"
            }`}
          >
            <div className="flex items-start gap-2">
              {showOverlay === "CP" ? (
                <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {showOverlay === "CP" ? "CP Mode Active" : "AP Mode Active"}
                </p>
                <p className="mt-1">
                  {showOverlay === "CP"
                    ? "CP systems sacrifice availability to preserve consistency. During a partition, writes to partitioned nodes are rejected to prevent divergence."
                    : "AP systems serve stale data to remain available. During a partition, all nodes continue accepting reads and writes, which may lead to temporary inconsistency."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Event Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 rounded-lg border bg-muted/30 p-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No events yet. Write to a node or toggle a partition to begin.
              </p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">
                        {log.time}
                      </span>
                      {log.type === "success" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      {log.type === "warning" && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      {log.type === "error" && (
                        <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      {log.type === "info" && (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          log.type === "error"
                            ? "text-red-700"
                            : log.type === "warning"
                              ? "text-amber-700"
                              : log.type === "success"
                                ? "text-emerald-700"
                                : "text-muted-foreground"
                        }
                      >
                        {log.message}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
