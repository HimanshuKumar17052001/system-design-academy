"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Database, Plus, Skull, Server, Zap, Activity, AlertTriangle } from "lucide-react";

type DBMode = "single" | "replica" | "shard";
type ShardStrategy = "hash" | "range" | "directory";

interface DBNode {
  id: string;
  role: "primary" | "replica" | "shard";
  connections: number;
  maxConnections: number;
  qps: number;
  lagMs?: number;
  alive: boolean;
  shardRange?: string;
}

function generateShardRange(index: number, total: number, strategy: ShardStrategy) {
  if (strategy === "hash") return `hash % ${total}`;
  if (strategy === "range") {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const start = letters[Math.floor((index / total) * 26)] || "A";
    const end = letters[Math.floor(((index + 1) / total) * 26) - 1] || "Z";
    return `${start}-${end}`;
  }
  return "lookup";
}

export default function DBScalingSimulator() {
  const [mode, setMode] = useState<DBMode>("single");
  const [nodes, setNodes] = useState<DBNode[]>([
    { id: "DB-1", role: "primary", connections: 0, maxConnections: 500, qps: 0, alive: true },
  ]);
  const [readQps, setReadQps] = useState(100);
  const [writeQps, setWriteQps] = useState(10);
  const [shardStrategy, setShardStrategy] = useState<ShardStrategy>("hash");
  const [events, setEvents] = useState<string[]>(["DB-1 initialized as single primary."]);
  const [history, setHistory] = useState<{ time: number; nodes: { id: string; qps: number }[] }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const primary = nodes.find((n) => n.role === "primary" && n.alive);

  const replicas = nodes.filter((n) => n.role === "replica" && n.alive);
  const shards = nodes.filter((n) => n.role === "shard" && n.alive);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setNodes((prev) => {
        const updated = prev.map((n) => {
          if (!n.alive) return n;
          if (mode === "single") {
            const totalQps = readQps + writeQps;
            const conn = Math.min(totalQps, n.maxConnections);
            return { ...n, qps: totalQps, connections: conn };
          }
          if (mode === "replica") {
            if (n.role === "primary") {
              const conn = Math.min(writeQps + readQps / (replicas.length + 1), n.maxConnections);
              return { ...n, qps: writeQps + readQps / (replicas.length + 1), connections: conn, lagMs: 0 };
            } else {
              const share = readQps / (replicas.length + 1);
              const conn = Math.min(share, n.maxConnections);
              const lag = n.lagMs ?? Math.max(0, Math.round(share / 20 + (Math.random() * 5 - 2)));
              return { ...n, qps: share, connections: conn, lagMs: lag };
            }
          }
          if (mode === "shard") {
            const total = shards.length;
            if (total === 0) return n;
            const idx = shards.findIndex((s) => s.id === n.id);
            const readShare = readQps / total;
            const writeShare = writeQps / total;
            const totalShare = readShare + writeShare;
            const conn = Math.min(totalShare, n.maxConnections);
            return { ...n, qps: totalShare, connections: conn };
          }
          return n;
        });
        return updated;
      });

      setNodes((prev) => prev); // ensure state refresh for history
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode, readQps, writeQps, replicas.length, shards.length]);

  useEffect(() => {
    setHistory((prev) => {
      const entry = {
        time: Date.now(),
        nodes: nodes
          .filter((n) => n.alive)
          .map((n) => ({ id: n.id, qps: Math.round(n.qps) })),
      };
      return [...prev.slice(-59), entry];
    });
  }, [nodes]);

  const switchMode = (newMode: DBMode) => {
    setMode(newMode);
    setEvents((e) => [`Switched to ${newMode} mode.`, ...e].slice(0, 20));
    if (newMode === "single") {
      setNodes([
        { id: "DB-1", role: "primary", connections: 0, maxConnections: 500, qps: 0, alive: true },
      ]);
    } else if (newMode === "replica") {
      setNodes([
        { id: "DB-Primary", role: "primary", connections: 0, maxConnections: 500, qps: 0, alive: true },
      ]);
    } else if (newMode === "shard") {
      setNodes([
        { id: "Shard-1", role: "shard", connections: 0, maxConnections: 500, qps: 0, alive: true, shardRange: generateShardRange(0, 1, shardStrategy) },
      ]);
    }
  };

  const addReplica = () => {
    if (mode !== "replica") return;
    const count = replicas.length + 1;
    const id = `Replica-${count}`;
    const newNode: DBNode = {
      id,
      role: "replica",
      connections: 0,
      maxConnections: 500,
      qps: 0,
      lagMs: 5,
      alive: true,
    };
    setNodes((prev) => [...prev, newNode]);
    setEvents((e) => [`${id} added. Replication lag: ${newNode.lagMs}ms.`, ...e].slice(0, 20));
  };

  const addShard = () => {
    if (mode !== "shard") return;
    const count = shards.length + 1;
    const id = `Shard-${count}`;
    const newNode: DBNode = {
      id,
      role: "shard",
      connections: 0,
      maxConnections: 500,
      qps: 0,
      alive: true,
      shardRange: generateShardRange(count - 1, count, shardStrategy),
    };
    setNodes((prev) => {
      const updated = prev.map((n) => ({
        ...n,
        shardRange: generateShardRange(
          prev.filter((x) => x.role === "shard").findIndex((x) => x.id === n.id),
          count,
          shardStrategy
        ),
      }));
      return [...updated, newNode];
    });
    setEvents((e) => [`${id} added with strategy ${shardStrategy}.`, ...e].slice(0, 20));
  };

  const killPrimary = () => {
    if (mode === "single") {
      setNodes((prev) => prev.map((n) => (n.role === "primary" ? { ...n, alive: false } : n)));
      setEvents((e) => ["DB-1 killed. System down!", ...e].slice(0, 20));
    } else if (mode === "replica" && primary) {
      setNodes((prev) => prev.map((n) => (n.id === primary.id ? { ...n, alive: false } : n)));
      // Promote first replica to primary
      const firstReplica = replicas[0];
      if (firstReplica) {
        setNodes((prev) =>
          prev.map((n) => (n.id === firstReplica.id ? { ...n, role: "primary", lagMs: 0 } : n))
        );
        setEvents((e) => [`Primary killed! ${firstReplica.id} promoted to primary.`, ...e].slice(0, 20));
      }
    }
  };

  const isOverloaded = (n: DBNode) => n.connections >= n.maxConnections;

  const areaData = useMemo(() => {
    return history.map((h, i) => {
      const row: Record<string, number | string> = { time: i };
      h.nodes.forEach((n) => {
        row[n.id] = n.qps;
      });
      return row;
    });
  }, [history]);

  const shardPieData = useMemo(() => {
    if (mode !== "shard") return [];
    return shards.map((n) => ({
      name: n.id,
      value: Math.round(n.qps),
      color: n.connections >= n.maxConnections ? "#ef4444" : "#3b82f6",
    }));
  }, [shards, mode]);

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => switchMode(v as DBMode)}>
        <TabsList>
          <TabsTrigger value="single">Single DB</TabsTrigger>
          <TabsTrigger value="replica">Read Replicas</TabsTrigger>
          <TabsTrigger value="shard">Sharding</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <Controls readQps={readQps} setReadQps={setReadQps} writeQps={writeQps} setWriteQps={setWriteQps} />
          <NodeGrid nodes={nodes} isOverloaded={isOverloaded} onKill={killPrimary} mode={mode} />
        </TabsContent>

        <TabsContent value="replica" className="space-y-6">
          <Controls readQps={readQps} setReadQps={setReadQps} writeQps={writeQps} setWriteQps={setWriteQps} />
          <div className="flex gap-3">
            <Button onClick={addReplica} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Replica
            </Button>
            <Button onClick={killPrimary} variant="destructive" size="sm">
              <Skull className="h-4 w-4 mr-1" />
              Kill Primary
            </Button>
          </div>
          <NodeGrid nodes={nodes} isOverloaded={isOverloaded} onKill={killPrimary} mode={mode} />
        </TabsContent>

        <TabsContent value="shard" className="space-y-6">
          <Controls readQps={readQps} setReadQps={setReadQps} writeQps={writeQps} setWriteQps={setWriteQps} />
          <div className="flex gap-3 items-center">
            <Button onClick={addShard} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Shard
            </Button>
            <Select value={shardStrategy} onValueChange={(v) => setShardStrategy(v as ShardStrategy)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hash">Hash</SelectItem>
                <SelectItem value="range">Range</SelectItem>
                <SelectItem value="directory">Directory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NodeGrid nodes={nodes} isOverloaded={isOverloaded} onKill={() => {}} mode={mode} />
        </TabsContent>
      </Tabs>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">QPS Per Node Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" hide />
                  <YAxis />
                  <RechartsTooltip />
                  {nodes
                    .filter((n) => n.alive)
                    .map((n, i) => (
                      <Area
                        key={n.id}
                        type="monotone"
                        dataKey={n.id}
                        stroke={colors[i % colors.length]}
                        fill={colors[i % colors.length] + "20"}
                        strokeWidth={2}
                      />
                    ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {mode === "replica" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Replication Lag</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={history.map((h, i) => {
                      const row: Record<string, number | string> = { time: i };
                      h.nodes.forEach((n) => {
                        const node = nodes.find((x) => x.id === n.id);
                        if (node && node.role === "replica") {
                          row[n.id] = node.lagMs ?? 0;
                        }
                      });
                      return row;
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" hide />
                    <YAxis />
                    <RechartsTooltip />
                    {replicas.map((n, i) => (
                      <Line
                        key={n.id}
                        type="monotone"
                        dataKey={n.id}
                        stroke={colors[i % colors.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === "shard" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Shard Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={shardPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                      {shardPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <RechartsTooltip />
                  </PieChart>
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

function Controls({
  readQps,
  setReadQps,
  writeQps,
  setWriteQps,
}: {
  readQps: number;
  setReadQps: (v: number) => void;
  writeQps: number;
  setWriteQps: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            Read QPS
          </span>
          <span className="font-mono">{readQps}</span>
        </div>
          <Slider defaultValue={[readQps]} min={0} max={10000} step={100} onValueChange={(v: number[]) => setReadQps(v[0])} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Write QPS
          </span>
          <span className="font-mono">{writeQps}</span>
        </div>
          <Slider defaultValue={[writeQps]} min={0} max={1000} step={10} onValueChange={(v: number[]) => setWriteQps(v[0])} />
      </div>
    </div>
  );
}

function NodeGrid({
  nodes,
  isOverloaded,
  onKill,
  mode,
}: {
  nodes: DBNode[];
  isOverloaded: (n: DBNode) => boolean;
  onKill: () => void;
  mode: DBMode;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <AnimatePresence>
        {nodes.map((node) => {
          const overloaded = isOverloaded(node);
          const pct = Math.min(100, (node.connections / node.maxConnections) * 100);
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "rounded-lg border p-3 flex flex-col items-center gap-2",
                !node.alive
                  ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                  : overloaded
                    ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                    : "border-border bg-card"
              )}
            >
              <Database
                className={cn(
                  "h-6 w-6",
                  !node.alive ? "text-red-500" : overloaded ? "text-red-500" : "text-blue-500"
                )}
              />
              <span className="text-xs font-medium">{node.id}</span>
              <Badge variant={node.role === "primary" ? "default" : "secondary"} className="text-[10px]">
                {node.role}
              </Badge>
              <div className="w-full">
                <div className="text-xs text-muted-foreground mb-1">
                  {node.connections} / {node.maxConnections} conn
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full", pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500")}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {node.lagMs !== undefined && node.lagMs > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Lag: {node.lagMs}ms
                </div>
              )}
              {node.shardRange && <div className="text-[10px] text-muted-foreground">Range: {node.shardRange}</div>}
              {mode === "replica" && node.role === "primary" && node.alive && (
                <Button variant="destructive" size="sm" className="mt-1 text-xs" onClick={onKill}>
                  <Skull className="h-3 w-3 mr-1" />
                  Kill
                </Button>
              )}
              {!node.alive && <Badge variant="destructive" className="text-[10px]">Dead</Badge>}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
