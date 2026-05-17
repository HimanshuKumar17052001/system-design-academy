"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Plus, Minus, Hash, CircleDot, RefreshCcw } from "lucide-react";

interface HashNode {
  id: string;
  position: number; // 0..2^32
  color: string;
  isVirtual?: boolean;
  physicalId?: string;
}

interface HashKey {
  id: string;
  position: number;
  nodeId?: string;
  prevNodeId?: string;
}

const RING_SIZE = 2 ** 32;
const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

function simpleHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % RING_SIZE;
}

function angleFromPosition(pos: number): number {
  return (pos / RING_SIZE) * 360 - 90; // start from top
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, "Z"].join(" ");
}

function findOwnerNode(pos: number, nodes: HashNode[]): HashNode | undefined {
  if (nodes.length === 0) return undefined;
  const sorted = [...nodes].sort((a, b) => a.position - b.position);
  const next = sorted.find((n) => n.position >= pos);
  return next || sorted[0];
}

export default function ConsistentHashVisualizer() {
  const [nodes, setNodes] = useState<HashNode[]>([
    { id: "Node-1", position: simpleHash("Node-1"), color: COLORS[0] },
    { id: "Node-2", position: simpleHash("Node-2"), color: COLORS[1] },
    { id: "Node-3", position: simpleHash("Node-3"), color: COLORS[2] },
  ]);
  const [keys, setKeys] = useState<HashKey[]>([]);
  const [showModulo, setShowModulo] = useState(false);
  const [useVirtualNodes, setUseVirtualNodes] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [highlightedKeyIds, setHighlightedKeyIds] = useState<Set<string>>(new Set());

  const physicalNodes = useMemo(() => nodes.filter((n) => !n.isVirtual), [nodes]);

  const effectiveNodes = useMemo(() => {
    if (!useVirtualNodes) return nodes;
    const vnodes: HashNode[] = [];
    physicalNodes.forEach((pn) => {
      vnodes.push({ ...pn, isVirtual: false });
      for (let i = 0; i < 3; i++) {
        vnodes.push({
          id: `${pn.id}-v${i}`,
          position: simpleHash(`${pn.id}-v${i}`),
          color: pn.color,
          isVirtual: true,
          physicalId: pn.id,
        });
      }
    });
    return vnodes;
  }, [nodes, physicalNodes, useVirtualNodes]);

  const assignKeys = useCallback(
    (currentKeys: HashKey[], currentNodes: HashNode[]): HashKey[] => {
      if (currentNodes.length === 0) return currentKeys.map((k) => ({ ...k, nodeId: undefined }));
      return currentKeys.map((k) => {
        const owner = findOwnerNode(k.position, currentNodes);
        return { ...k, prevNodeId: k.nodeId, nodeId: owner?.physicalId || owner?.id };
      });
    },
    []
  );

  const remapKeys = useCallback(
    (newNodes: HashNode[]) => {
      setKeys((prev) => {
        const updated = assignKeys(prev, newNodes);
        const moved = updated.filter((k) => k.prevNodeId && k.nodeId && k.prevNodeId !== k.nodeId);
        const stayed = updated.filter((k) => k.prevNodeId && k.nodeId && k.prevNodeId === k.nodeId);
        setHighlightedKeyIds(new Set(moved.map((k) => k.id)));
        setTimeout(() => setHighlightedKeyIds(new Set()), 1500);
        return updated;
      });
    },
    [assignKeys]
  );

  useEffect(() => {
    remapKeys(effectiveNodes);
  }, [effectiveNodes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const addNode = () => {
    const id = `Node-${physicalNodes.length + 1}`;
    const pos = simpleHash(id + Date.now());
    const color = COLORS[physicalNodes.length % COLORS.length];
    const newNode: HashNode = { id, position: pos, color };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);

    const prevCount = keys.filter((k) => k.nodeId).length;
    const newEffective = useVirtualNodes
      ? (() => {
          const vnodes: HashNode[] = [];
          const phys = newNodes.filter((n) => !n.isVirtual);
          phys.forEach((pn) => {
            vnodes.push({ ...pn, isVirtual: false });
            for (let i = 0; i < 3; i++) {
              vnodes.push({
                id: `${pn.id}-v${i}`,
                position: simpleHash(`${pn.id}-v${i}`),
                color: pn.color,
                isVirtual: true,
                physicalId: pn.id,
              });
            }
          });
          return vnodes;
        })()
      : newNodes;

    const updatedKeys = assignKeys(keys, newEffective);
    const moved = updatedKeys.filter(
      (k) => k.prevNodeId && k.nodeId && k.prevNodeId !== k.nodeId && keys.some((old) => old.id === k.id && old.nodeId === k.prevNodeId)
    ).length;
    const pct = prevCount > 0 ? Math.round((moved / prevCount) * 100) : 0;
    setKeys(updatedKeys);
    setHighlightedKeyIds(
      new Set(updatedKeys.filter((k) => k.prevNodeId !== k.nodeId).map((k) => k.id))
    );
    setTimeout(() => setHighlightedKeyIds(new Set()), 1500);
    setEvents((e) => [`${id} added at position ${pos}. ${moved} keys remapped (${pct}%).`, ...e].slice(0, 20));
  };

  const removeNode = () => {
    if (physicalNodes.length === 0) return;
    const toRemove = physicalNodes[physicalNodes.length - 1];
    const newNodes = nodes.filter((n) => n.id !== toRemove.id && n.physicalId !== toRemove.id);
    setNodes(newNodes);

    const prevCount = keys.filter((k) => k.nodeId).length;
    const newEffective = useVirtualNodes
      ? (() => {
          const vnodes: HashNode[] = [];
          const phys = newNodes.filter((n) => !n.isVirtual);
          phys.forEach((pn) => {
            vnodes.push({ ...pn, isVirtual: false });
            for (let i = 0; i < 3; i++) {
              vnodes.push({
                id: `${pn.id}-v${i}`,
                position: simpleHash(`${pn.id}-v${i}`),
                color: pn.color,
                isVirtual: true,
                physicalId: pn.id,
              });
            }
          });
          return vnodes;
        })()
      : newNodes;

    const updatedKeys = assignKeys(keys, newEffective);
    const moved = updatedKeys.filter(
      (k) => k.prevNodeId && k.nodeId && k.prevNodeId !== k.nodeId && keys.some((old) => old.id === k.id && old.nodeId === k.prevNodeId)
    ).length;
    const pct = prevCount > 0 ? Math.round((moved / prevCount) * 100) : 0;
    setKeys(updatedKeys);
    setHighlightedKeyIds(
      new Set(updatedKeys.filter((k) => k.prevNodeId !== k.nodeId).map((k) => k.id))
    );
    setTimeout(() => setHighlightedKeyIds(new Set()), 1500);
    setEvents((e) => [`${toRemove.id} removed. ${moved} keys remapped (${pct}%).`, ...e].slice(0, 20));
  };

  const addKeys = (count = 100) => {
    const newKeys: HashKey[] = Array.from({ length: count }).map((_, i) => {
      const id = `key-${Date.now()}-${i}`;
      const pos = simpleHash(id);
      const owner = findOwnerNode(pos, effectiveNodes);
      return {
        id,
        position: pos,
        nodeId: owner?.physicalId || owner?.id,
        prevNodeId: owner?.physicalId || owner?.id,
      };
    });
    setKeys((prev) => [...prev, ...newKeys]);
    setEvents((e) => [`Added ${count} keys. Total: ${keys.length + count} keys.`, ...e].slice(0, 20));
  };

  const reset = () => {
    const initial = [
      { id: "Node-1", position: simpleHash("Node-1"), color: COLORS[0] },
      { id: "Node-2", position: simpleHash("Node-2"), color: COLORS[1] },
      { id: "Node-3", position: simpleHash("Node-3"), color: COLORS[2] },
    ];
    setNodes(initial);
    setKeys([]);
    setEvents([]);
    setHighlightedKeyIds(new Set());
  };

  const histogramData = useMemo(() => {
    const counts: Record<string, number> = {};
    keys.forEach((k) => {
      const nid = k.nodeId || "unassigned";
      counts[nid] = (counts[nid] || 0) + 1;
    });
    return physicalNodes.map((n) => ({
      name: n.id,
      count: counts[n.id] || 0,
      color: n.color,
    }));
  }, [keys, physicalNodes]);

  const moduloData = useMemo(() => {
    if (physicalNodes.length === 0) return [];
    const counts: Record<string, number> = {};
    keys.forEach((k) => {
      const idx = k.position % physicalNodes.length;
      const nid = physicalNodes[idx]?.id || "unassigned";
      counts[nid] = (counts[nid] || 0) + 1;
    });
    return physicalNodes.map((n) => ({
      name: n.id,
      count: counts[n.id] || 0,
      color: n.color,
    }));
  }, [keys, physicalNodes]);

  const cx = 160;
  const cy = 160;
  const r = 140;
  const keyR = 110;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={addNode} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Node
        </Button>
        <Button onClick={removeNode} variant="outline" size="sm" disabled={physicalNodes.length === 0}>
          <Minus className="h-4 w-4 mr-1" />
          Remove Node
        </Button>
        <Button onClick={() => addKeys(100)} variant="outline" size="sm">
          <Hash className="h-4 w-4 mr-1" />
          Add 100 Keys
        </Button>
        <Button onClick={reset} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Virtual Nodes (3x)</span>
          <Switch checked={useVirtualNodes} onCheckedChange={setUseVirtualNodes} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Compare Modulo</span>
          <Switch checked={showModulo} onCheckedChange={setShowModulo} />
        </div>
      </div>

      {/* Rings */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Consistent Hashing Ring */}
        <Card className="flex-1 w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CircleDot className="h-4 w-4" />
              Consistent Hashing Ring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <svg viewBox="0 0 320 320" className="w-full max-w-sm">
                {/* Background ring */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={2} />
                {/* Node arcs */}
                {effectiveNodes
                  .sort((a, b) => a.position - b.position)
                  .map((node, i, arr) => {
                    const next = arr[(i + 1) % arr.length];
                    const startAngle = angleFromPosition(node.position);
                    const endAngle = angleFromPosition(next.position);
                    const d = describeArc(cx, cy, r, startAngle, endAngle);
                    return (
                      <path
                        key={node.id}
                        d={d}
                        fill={node.color + "20"}
                        stroke={node.color}
                        strokeWidth={node.isVirtual ? 1 : 2}
                        opacity={node.isVirtual ? 0.5 : 1}
                      />
                    );
                  })}
                {/* Nodes */}
                {effectiveNodes.map((node) => {
                  const pos = polarToCartesian(cx, cy, r, angleFromPosition(node.position));
                  return (
                    <g key={node.id}>
                      <circle cx={pos.x} cy={pos.y} r={node.isVirtual ? 3 : 6} fill={node.color} stroke="white" strokeWidth={1} />
                      {!node.isVirtual && (
                        <text x={pos.x} y={pos.y - 10} textAnchor="middle" fontSize={10} fontWeight={600} fill="currentColor">
                          {node.id}
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* Keys */}
                <AnimatePresence>
                  {keys.map((key) => {
                    const angle = angleFromPosition(key.position);
                    const pos = polarToCartesian(cx, cy, keyR, angle);
                    const moved = highlightedKeyIds.has(key.id);
                    return (
                      <motion.circle
                        key={key.id}
                        cx={pos.x}
                        cy={pos.y}
                        r={2}
                        fill={moved ? "#fbbf24" : "#22c55e"}
                        initial={{ opacity: 0, r: 0 }}
                        animate={{ opacity: 1, r: 2 }}
                        exit={{ opacity: 0, r: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    );
                  })}
                </AnimatePresence>
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={600} fill="currentColor">
                  {keys.length} keys
                </text>
              </svg>
            </div>
          </CardContent>
        </Card>

        {showModulo && (
          <Card className="flex-1 w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Modulo Hashing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <svg viewBox="0 0 320 320" className="w-full max-w-sm">
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={2} />
                  {physicalNodes.map((node, i) => {
                    const start = (i / physicalNodes.length) * 360 - 90;
                    const end = ((i + 1) / physicalNodes.length) * 360 - 90;
                    const d = describeArc(cx, cy, r, start, end);
                    return <path key={node.id} d={d} fill={node.color + "20"} stroke={node.color} strokeWidth={2} />;
                  })}
                  {physicalNodes.map((node, i) => {
                    const angle = ((i + 0.5) / physicalNodes.length) * 360 - 90;
                    const pos = polarToCartesian(cx, cy, r, angle);
                    return (
                      <g key={node.id}>
                        <circle cx={pos.x} cy={pos.y} r={6} fill={node.color} stroke="white" strokeWidth={1} />
                        <text x={pos.x} y={pos.y - 10} textAnchor="middle" fontSize={10} fontWeight={600} fill="currentColor">
                          {node.id}
                        </text>
                      </g>
                    );
                  })}
                  {keys.map((key) => {
                    if (physicalNodes.length === 0) return null;
                    const idx = key.position % physicalNodes.length;
                    const angle = ((idx + 0.5) / physicalNodes.length) * 360 - 90;
                    const pos = polarToCartesian(cx, cy, keyR, angle);
                    return <circle key={`mod-${key.id}`} cx={pos.x} cy={pos.y} r={2} fill={physicalNodes[idx].color} />;
                  })}
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={600} fill="currentColor">
                    {keys.length} keys
                  </text>
                </svg>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Key Distribution (Consistent)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count">
                    {histogramData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {showModulo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Key Distribution (Modulo)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduloData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count">
                      {moduloData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Event Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Event Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">No events yet. Add nodes or keys to see activity.</p>
            )}
            {events.map((ev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm border-b last:border-0 py-1"
              >
                <Badge variant="outline" className="mr-2 text-xs">
                  {events.length - i}
                </Badge>
                {ev}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
