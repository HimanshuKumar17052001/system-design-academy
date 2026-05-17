"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Database,
  HardDrive,
  Monitor,
  ArrowRight,
  ArrowLeftRight,
  Zap,
  Clock,
  RotateCcw,
  Play,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

type CacheStrategy = "cache-aside" | "read-through" | "write-through" | "write-behind";
type OperationType = "read" | "write";

interface CacheEntry {
  key: string;
  value: number;
  dirty: boolean;
}

interface RequestEvent {
  id: number;
  time: string;
  type: OperationType;
  key: string;
  value?: number;
  result: "hit" | "miss" | "write" | "stale";
  latency: number;
  path: string[];
}

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: "info" | "success" | "warning";
}

const STRATEGY_INFO: Record<
  CacheStrategy,
  { name: string; description: string; readPath: string; writePath: string }
> = {
  "cache-aside": {
    name: "Cache-Aside",
    description: "App checks cache first, populates on miss. Writes go to DB, cache is invalidated.",
    readPath: "Client → Cache (check) → DB (if miss) → Cache (populate) → Client",
    writePath: "Client → DB (write) → Cache (invalidate)",
  },
  "read-through": {
    name: "Read-Through",
    description: "Cache populates itself on miss. Writes go to DB, cache invalidates.",
    readPath: "Client → Cache (check) → Cache auto-populates from DB → Client",
    writePath: "Client → DB (write) → Cache (invalidate)",
  },
  "write-through": {
    name: "Write-Through",
    description: "App writes to cache, cache writes to DB synchronously.",
    readPath: "Client → Cache (check) → DB (if miss) → Cache → Client",
    writePath: "Client → Cache → DB (sync) → Client",
  },
  "write-behind": {
    name: "Write-Behind",
    description: "App writes to cache, cache writes to DB asynchronously (delayed).",
    readPath: "Client → Cache (check) → DB (if miss) → Cache → Client",
    writePath: "Client → Cache (fast) → [async] → DB (delayed)",
  },
};

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function CacheStrategyLab() {
  const [strategy, setStrategy] = useState<CacheStrategy>("cache-aside");
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const [db, setDb] = useState<Map<string, number>>(new Map([["A", 10], ["B", 20]]));
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState({
    hits: 0,
    misses: 0,
    writes: 0,
    totalLatency: 0,
    staleIncidents: 0,
  });
  const [pendingWriteBehind, setPendingWriteBehind] = useState<{ key: string; value: number } | null>(null);
  const [animatingPath, setAnimatingPath] = useState<string[] | null>(null);
  const [animatingLatency, setAnimatingLatency] = useState<string | null>(null);
  const eventIdRef = useRef(0);
  const logIdRef = useRef(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    logIdRef.current += 1;
    setLogs((prev) => [...prev, { id: logIdRef.current, time, message, type }]);
  }, []);

  const recordEvent = useCallback(
    (event: Omit<RequestEvent, "id" | "time">) => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      eventIdRef.current += 1;
      const fullEvent: RequestEvent = { ...event, id: eventIdRef.current, time };
      setEvents((prev) => [...prev, fullEvent]);
      setMetrics((prev) => ({
        ...prev,
        hits: prev.hits + (event.result === "hit" ? 1 : 0),
        misses: prev.misses + (event.result === "miss" ? 1 : 0),
        writes: prev.writes + (event.type === "write" ? 1 : 0),
        totalLatency: prev.totalLatency + event.latency,
      }));
      return fullEvent;
    },
    []
  );

  const animatePath = useCallback((path: string[], latency: string) => {
    setAnimatingPath(path);
    setAnimatingLatency(latency);
    setTimeout(() => {
      setAnimatingPath(null);
      setAnimatingLatency(null);
    }, 1000);
  }, []);

  const handleRead = useCallback(
    (key: string) => {
      const start = performance.now();
      const cached = cache.get(key);
      const dbValue = db.get(key) ?? 0;
      let path: string[];
      let result: RequestEvent["result"];
      let latency: number;

      if (cached) {
        if (strategy === "write-behind" && cached.dirty) {
          // Stale read in write-behind
          result = "stale";
          latency = 0.1;
          path = ["client", "cache", "client"];
          addLog(`Read ${key}: Cache HIT but STALE (write-behind pending). Value=${cached.value}, DB=${dbValue}`, "warning");
          setMetrics((prev) => ({ ...prev, staleIncidents: prev.staleIncidents + 1 }));
        } else {
          result = "hit";
          latency = 0.1;
          path = ["client", "cache", "client"];
          addLog(`Read ${key}: Cache HIT. Value=${cached.value} (0.1ms)`, "success");
        }
      } else {
        result = "miss";
        latency = 5;
        path = ["client", "cache", "db", "cache", "client"];
        if (strategy === "read-through") {
          path = ["client", "cache", "db", "client"];
        }
        addLog(`Read ${key}: Cache MISS. Fetched from DB. Value=${dbValue} (5ms)`, "warning");
        // Populate cache
        setCache((prev) => {
          const next = new Map(prev);
          next.set(key, { key, value: dbValue, dirty: false });
          return next;
        });
      }

      animatePath(path, `${latency}ms`);
      recordEvent({ type: "read", key, result, latency, path });
    },
    [cache, db, strategy, addLog, recordEvent, animatePath]
  );

  const handleWrite = useCallback(
    (key: string, value: number) => {
      const start = performance.now();
      let path: string[];
      let latency: number;

      switch (strategy) {
        case "cache-aside":
        case "read-through":
          path = ["client", "db", "cache", "client"];
          latency = 5;
          setDb((prev) => {
            const next = new Map(prev);
            next.set(key, value);
            return next;
          });
          // Invalidate cache
          setCache((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
          addLog(`Write ${key}=${value}: Written to DB, cache invalidated (5ms)`, "info");
          break;

        case "write-through":
          path = ["client", "cache", "db", "client"];
          latency = 5;
          setDb((prev) => {
            const next = new Map(prev);
            next.set(key, value);
            return next;
          });
          setCache((prev) => {
            const next = new Map(prev);
            next.set(key, { key, value, dirty: false });
            return next;
          });
          addLog(`Write ${key}=${value}: Written to cache + DB synchronously (5ms)`, "info");
          break;

        case "write-behind":
          path = ["client", "cache", "client"];
          latency = 0.1;
          setCache((prev) => {
            const next = new Map(prev);
            next.set(key, { key, value, dirty: true });
            return next;
          });
          setPendingWriteBehind({ key, value });
          addLog(`Write ${key}=${value}: Written to cache (0.1ms). DB update queued asynchronously.`, "success");
          break;
      }

      animatePath(path, `${latency}ms`);
      recordEvent({ type: "write", key, value, result: "write", latency, path });
    },
    [strategy, addLog, recordEvent, animatePath]
  );

  // Write-behind async flush
  useEffect(() => {
    if (!pendingWriteBehind) return;
    const timer = setTimeout(() => {
      setDb((prev) => {
        const next = new Map(prev);
        next.set(pendingWriteBehind.key, pendingWriteBehind.value);
        return next;
      });
      setCache((prev) => {
        const next = new Map(prev);
        const existing = next.get(pendingWriteBehind.key);
        if (existing) {
          next.set(pendingWriteBehind.key, { ...existing, dirty: false });
        }
        return next;
      });
      addLog(
        `Write-behind flush: ${pendingWriteBehind.key}=${pendingWriteBehind.value} persisted to DB`,
        "info"
      );
      setPendingWriteBehind(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [pendingWriteBehind, addLog]);

  const handleSimulateLoad = useCallback(async () => {
    setIsSimulating(true);
    const keys = ["A", "B"];
    const operations: { type: OperationType; key: string; value?: number }[] = [];

    for (let i = 0; i < 20; i++) {
      const isRead = Math.random() > 0.3;
      const key = keys[Math.floor(Math.random() * keys.length)];
      if (isRead) {
        operations.push({ type: "read", key });
      } else {
        operations.push({ type: "write", key, value: Math.floor(Math.random() * 100) });
      }
    }

    for (const op of operations) {
      if (op.type === "read") {
        handleRead(op.key);
      } else {
        handleWrite(op.key, op.value ?? 0);
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    setIsSimulating(false);
    addLog("Simulation complete. 20 random requests processed.", "success");
  }, [handleRead, handleWrite, addLog]);

  const handleReset = useCallback(() => {
    setCache(new Map());
    setDb(new Map([["A", 10], ["B", 20]]));
    setEvents([]);
    setLogs([]);
    setMetrics({ hits: 0, misses: 0, writes: 0, totalLatency: 0, staleIncidents: 0 });
    setPendingWriteBehind(null);
    setAnimatingPath(null);
    eventIdRef.current = 0;
    logIdRef.current = 0;
    addLog("System reset. Cache cleared. DB: A=10, B=20.", "info");
  }, [addLog]);

  const totalRequests = metrics.hits + metrics.misses + metrics.writes;
  const hitRate = totalRequests > 0 ? Math.round((metrics.hits / (metrics.hits + metrics.misses)) * 100) : 0;
  const avgLatency = totalRequests > 0 ? (metrics.totalLatency / totalRequests).toFixed(2) : "0";

  const pieData = [
    { name: "Hits", value: metrics.hits },
    { name: "Misses", value: metrics.misses },
    { name: "Writes", value: metrics.writes },
  ];

  const latencyData = [
    { name: "Cache Hit", latency: 0.1, count: metrics.hits },
    { name: "Cache Miss", latency: 5, count: metrics.misses },
    { name: "Write", latency: strategy === "write-behind" ? 0.1 : 5, count: metrics.writes },
  ];

  const getComponentClass = (name: string) => {
    const isActive = animatingPath?.includes(name);
    return cn(
      "rounded-xl border p-4 flex flex-col items-center gap-2 transition-all duration-300",
      isActive ? "ring-2 ring-primary bg-primary/5 scale-105" : "bg-card"
    );
  };

  return (
    <div className="space-y-6">
      {/* Strategy Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Cache Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              value={strategy}
              onValueChange={(value) => {
                setStrategy(value as CacheStrategy);
                addLog(`Strategy changed to ${STRATEGY_INFO[value as CacheStrategy].name}`, "info");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cache-aside">Cache-Aside</SelectItem>
                <SelectItem value="read-through">Read-Through</SelectItem>
                <SelectItem value="write-through">Write-Through</SelectItem>
                <SelectItem value="write-behind">Write-Behind</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground flex items-center">
              {STRATEGY_INFO[strategy].description}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-muted/50 p-3">
              <span className="font-semibold">Read Path:</span> {STRATEGY_INFO[strategy].readPath}
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <span className="font-semibold">Write Path:</span> {STRATEGY_INFO[strategy].writePath}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => handleRead("A")} disabled={isSimulating}>
          <Monitor className="h-4 w-4 mr-1" />
          Read Key A
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleWrite("A", Math.floor(Math.random() * 100) + 10)} disabled={isSimulating}>
          <Database className="h-4 w-4 mr-1" />
          Write Key A
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRead("B")} disabled={isSimulating}>
          <Monitor className="h-4 w-4 mr-1" />
          Read Key B
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleWrite("B", Math.floor(Math.random() * 100) + 10)} disabled={isSimulating}>
          <Database className="h-4 w-4 mr-1" />
          Write Key B
        </Button>
        <Button size="sm" variant="secondary" onClick={handleSimulateLoad} disabled={isSimulating}>
          <Play className="h-4 w-4 mr-1" />
          Simulate Load (20 reqs)
        </Button>
        <Button size="sm" variant="ghost" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Visual Representation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4 md:gap-8 py-4">
            {/* Client */}
            <motion.div className={getComponentClass("client")} layout>
              <Monitor className="h-8 w-8 text-blue-500" />
              <span className="text-sm font-medium">Client</span>
            </motion.div>

            {/* Arrow Client → Cache */}
            <div className="relative">
              <ArrowRight
                className={cn(
                  "h-6 w-6 transition-colors",
                  animatingPath?.includes("client") && animatingPath?.includes("cache")
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
              <AnimatePresence>
                {animatingPath?.includes("client") && animatingPath?.includes("cache") && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-mono text-primary whitespace-nowrap"
                  >
                    {animatingLatency}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cache */}
            <motion.div className={getComponentClass("cache")} layout>
              <HardDrive className="h-8 w-8 text-amber-500" />
              <span className="text-sm font-medium">Cache</span>
              <div className="text-xs text-muted-foreground mt-1">
                {cache.size} / 10 entries
              </div>
              <div className="mt-2 space-y-1 w-full">
                {Array.from(cache.values()).map((entry) => (
                  <motion.div
                    key={entry.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "flex items-center justify-between rounded px-2 py-1 text-xs",
                      entry.dirty ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    )}
                  >
                    <span>{entry.key}={entry.value}</span>
                    {entry.dirty && <AlertTriangle className="h-3 w-3" />}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Arrow Cache → DB */}
            <div className="relative">
              <ArrowRight
                className={cn(
                  "h-6 w-6 transition-colors",
                  animatingPath?.includes("db") ? "text-primary" : "text-muted-foreground"
                )}
              />
              <AnimatePresence>
                {animatingPath?.includes("db") && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-mono text-primary whitespace-nowrap"
                  >
                    5ms
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Database */}
            <motion.div className={getComponentClass("db")} layout>
              <Database className="h-8 w-8 text-purple-500" />
              <span className="text-sm font-medium">Database</span>
              <div className="mt-2 space-y-1 w-full">
                {Array.from(db.entries()).map(([key, value]) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between rounded px-2 py-1 text-xs bg-blue-100 text-blue-800"
                  >
                    <span>{key}={value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hit Rate Pie Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-sm font-semibold mt-2">
              {hitRate}% Hit Rate
            </div>
          </CardContent>
        </Card>

        {/* Latency Bar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Latency by Operation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip />
                  <Bar dataKey="latency" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-sm font-semibold mt-2">
              Avg: {avgLatency}ms
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cache Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricRow label="Total Requests" value={totalRequests.toString()} unit="reqs" />
            <MetricRow label="Cache Hits" value={metrics.hits.toString()} tone="good" />
            <MetricRow label="Cache Misses" value={metrics.misses.toString()} tone="warning" />
            <MetricRow label="Writes" value={metrics.writes.toString()} />
            <MetricRow label="Avg Latency" value={avgLatency} unit="ms" />
            <MetricRow label="Cache Size" value={cache.size.toString()} unit="/ 10" />
            <MetricRow label="Stale Incidents" value={metrics.staleIncidents.toString()} tone={metrics.staleIncidents > 0 ? "warning" : "good"} />
          </CardContent>
        </Card>
      </div>

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
                No events yet. Perform reads or writes to begin.
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
                      {log.type === "info" && (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          log.type === "warning"
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

function MetricRow({
  label,
  value,
  unit,
  tone = "neutral",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  const colors = {
    neutral: "text-foreground",
    good: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono font-semibold", colors[tone])}>
        {value}
        {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
