"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Play, Pause, Globe, Server, Database, HardDrive, Cloud, Layers } from "lucide-react";

interface Packet {
  id: string;
  stage: number;
  progress: number; // 0..1 within current hop
  isReturn: boolean;
  cacheHit: boolean;
  createdAt: number;
}

interface NodeDef {
  id: string;
  label: string;
  x: number;
  y: number;
  icon: React.ReactNode;
  latencyMs: number;
}

const NODES: NodeDef[] = [
  { id: "client", label: "Client", x: 60, y: 150, icon: <HardDrive className="h-5 w-5" />, latencyMs: 0 },
  { id: "dns", label: "DNS", x: 180, y: 80, icon: <Globe className="h-5 w-5" />, latencyMs: 30 },
  { id: "cdn", label: "CDN", x: 300, y: 80, icon: <Cloud className="h-5 w-5" />, latencyMs: 15 },
  { id: "lb", label: "LB", x: 420, y: 150, icon: <Layers className="h-5 w-5" />, latencyMs: 5 },
  { id: "app", label: "App Server", x: 540, y: 150, icon: <Server className="h-5 w-5" />, latencyMs: 80 },
  { id: "db", label: "DB", x: 660, y: 150, icon: <Database className="h-5 w-5" />, latencyMs: 40 },
];

const HOPS = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
];

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const midX = (x1 + x2) / 2;
  const cp1x = x1 + (midX - x1) * 0.5;
  const cp2x = x2 - (x2 - midX) * 0.5;
  return `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
}

export default function TrafficFlowVisualizer() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [trafficLoad, setTrafficLoad] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [cdnCacheEnabled, setCdnCacheEnabled] = useState(false);
  const [appCacheEnabled, setAppCacheEnabled] = useState(false);
  const [dbSlow, setDbSlow] = useState(false);
  const [showLatency, setShowLatency] = useState(false);
  const [totalRequests, setTotalRequests] = useState(0);
  const [cacheHits, setCacheHits] = useState(0);
  const [dbQueries, setDbQueries] = useState(0);
  const [latencyHistory, setLatencyHistory] = useState<{ time: number; avgLatency: number }[]>([]);
  const [hopLatencies, setHopLatencies] = useState<Record<string, number[]>>({});
  const packetIdRef = useRef(0);
  const lastTimeRef = useRef<number>(0);
  const queueLengthRef = useRef(0);

  const injectRequest = useCallback(() => {
    const id = `pkt-${++packetIdRef.current}`;
    const cacheHit = cdnCacheEnabled && Math.random() < 0.6;
    const appHit = appCacheEnabled && !cacheHit && Math.random() < 0.5;
    const pkt: Packet = {
      id,
      stage: 0,
      progress: 0,
      isReturn: false,
      cacheHit,
      createdAt: Date.now(),
    };
    setPackets((prev) => [...prev, pkt]);
    setTotalRequests((t) => t + 1);
    if (cacheHit) setCacheHits((c) => c + 1);
    else if (appHit) setCacheHits((c) => c + 1);
    else setDbQueries((d) => d + 1);
  }, [cdnCacheEnabled, appCacheEnabled]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const toInject = Math.max(1, Math.floor(trafficLoad / 10));
      for (let i = 0; i < toInject; i++) {
        injectRequest();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, trafficLoad, injectRequest]);

  useEffect(() => {
    let raf = 0;
    const tick = (time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;

      setPackets((prev) => {
        const updated = prev
          .map((p) => {
            const speed = dbSlow && p.stage === 4 && !p.isReturn ? 0.3 : 1.0;
            const nextProgress = p.progress + dt * 2 * speed;
            if (nextProgress >= 1) {
              let nextStage = p.stage + 1;
              let isReturn = p.isReturn;
              // CDN cache hit: skip app/db
              if (p.cacheHit && !p.isReturn && nextStage === 3) {
                isReturn = true;
                nextStage = 2;
              }
              // App cache hit: skip db
              if (appCacheEnabled && !p.cacheHit && !p.isReturn && nextStage === 5) {
                isReturn = true;
                nextStage = 3;
              }
              // DB stage -> return
              if (!p.cacheHit && !isReturn && nextStage === 6) {
                isReturn = true;
                nextStage = 4;
              }
              // Return path complete
              if (isReturn && nextStage < 0) {
                // Record latency on completion
                const totalLatency = Date.now() - p.createdAt;
                setLatencyHistory((h) => [...h.slice(-49), { time: Date.now(), avgLatency: totalLatency }]);
                return null;
              }
              return { ...p, stage: nextStage, progress: 0 };
            }
            return { ...p, stage: p.stage, progress: nextProgress };
          })
          .filter(Boolean) as Packet[];
        return updated;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dbSlow, appCacheEnabled]);

  // Track queue at DB
  const dbQueue = packets.filter((p) => p.stage === 4 && !p.isReturn && !p.cacheHit).length;
  queueLengthRef.current = dbQueue;

  const nodeStatus = (nodeId: string) => {
    if (nodeId === "db" && dbSlow) return "red";
    const load = packets.filter((p) => p.stage === NODES.findIndex((n) => n.id === nodeId)).length;
    if (load > 10) return "yellow";
    return "green";
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "green":
        return "bg-emerald-500";
      case "yellow":
        return "bg-amber-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const chartData = useMemo(() => {
    return latencyHistory.map((d, i) => ({
      index: i,
      latency: d.avgLatency,
    }));
  }, [latencyHistory]);

  const hopData = useMemo(() => {
    return NODES.slice(1).map((n) => ({
      name: n.label,
      latency: dbSlow && n.id === "db" ? n.latencyMs * 5 : n.latencyMs,
    }));
  }, [dbSlow]);

  const cacheHitRate = totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={() => setIsRunning((s) => !s)} variant="outline" size="sm">
          {isRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          {isRunning ? "Stop Traffic" : "Start Traffic"}
        </Button>
        <Button onClick={injectRequest} variant="outline" size="sm">
          <Play className="h-4 w-4 mr-1" />
          Inject Request
        </Button>
        <div className="flex items-center gap-2 w-48">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Load</span>
          <Slider
            defaultValue={[trafficLoad]}
            min={1}
            max={100}
            step={1}
            onValueChange={(v: number[]) => setTrafficLoad(v[0])}
          />
          <span className="text-xs text-muted-foreground w-8">{trafficLoad}</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={cdnCacheEnabled} onCheckedChange={setCdnCacheEnabled} />
          <span className="text-sm">CDN Cache</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={appCacheEnabled} onCheckedChange={setAppCacheEnabled} />
          <span className="text-sm">App Cache</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={dbSlow} onCheckedChange={setDbSlow} />
          <span className="text-sm">DB Slow</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showLatency} onCheckedChange={setShowLatency} />
          <span className="text-sm">Show Latency</span>
        </div>
      </div>

      {/* Architecture Diagram */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative w-full overflow-x-auto">
            <svg viewBox="0 0 720 240" className="w-full min-w-[600px]">
              {/* Connections */}
              {HOPS.map((hop, i) => {
                const from = NODES[hop.from];
                const to = NODES[hop.to];
                return (
                  <g key={i}>
                    <path
                      d={bezierPath(from.x, from.y, to.x, to.y)}
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity={0.2}
                      strokeWidth={2}
                    />
                    {/* Return path */}
                    <path
                      d={bezierPath(to.x, to.y + 20, from.x, from.y + 20)}
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity={0.1}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                  </g>
                );
              })}

              {/* Packets on forward path */}
              <AnimatePresence>
                {packets.map((p) => {
                  if (p.isReturn) {
                    // Return path simplified: map stage to reverse hop
                    const forwardHop = p.stage;
                    const from = NODES[forwardHop + 1];
                    const to = NODES[forwardHop];
                    if (!from || !to) return null;
                    const path = bezierPath(from.x, from.y + 20, to.x, to.y + 20);
                    const len = path.length; // rough
                    const point = getPointAtPercent(path, p.progress);
                    return (
                      <motion.circle
                        key={`${p.id}-ret`}
                        cx={point.x}
                        cy={point.y}
                        r={4}
                        fill="#3b82f6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    );
                  }
                  const from = NODES[p.stage];
                  const to = NODES[p.stage + 1];
                  if (!from || !to) return null;
                  const path = bezierPath(from.x, from.y, to.x, to.y);
                  const point = getPointAtPercent(path, p.progress);
                  return (
                    <motion.circle
                      key={p.id}
                      cx={point.x}
                      cy={point.y}
                      r={4}
                      fill={p.cacheHit ? "#f59e0b" : "#10b981"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Nodes */}
              {NODES.map((node) => {
                const status = nodeStatus(node.id);
                return (
                  <g key={node.id}>
                    <motion.rect
                      x={node.x - 30}
                      y={node.y - 25}
                      width={60}
                      height={50}
                      rx={8}
                      fill="hsl(var(--card))"
                      stroke={status === "red" ? "#ef4444" : status === "yellow" ? "#f59e0b" : "hsl(var(--border))"}
                      strokeWidth={2}
                      animate={
                        status === "yellow" || status === "red"
                          ? { strokeWidth: [2, 4, 2] }
                          : {}
                      }
                      transition={
                        status === "yellow" || status === "red"
                          ? { repeat: Infinity, duration: 1 }
                          : {}
                      }
                    />
                    <foreignObject x={node.x - 10} y={node.y - 18} width={20} height={20}>
                      <div className="flex items-center justify-center text-foreground">{node.icon}</div>
                    </foreignObject>
                    <text x={node.x} y={node.y + 8} textAnchor="middle" fontSize={10} fontWeight={600} fill="currentColor">
                      {node.label}
                    </text>
                    {/* Status dot */}
                    <circle cx={node.x + 24} cy={node.y - 18} r={4} className={statusColor(status)} />
                    {/* Latency label */}
                    {showLatency && (
                      <text x={node.x} y={node.y - 32} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.7}>
                        {dbSlow && node.id === "db" ? `${node.latencyMs * 5}ms` : `${node.latencyMs}ms`}
                      </text>
                    )}
                    {/* DB Queue badge */}
                    {node.id === "db" && dbQueue > 0 && (
                      <g>
                        <rect x={node.x + 20} y={node.y + 10} width={20} height={14} rx={4} fill="#ef4444" />
                        <text x={node.x + 30} y={node.y + 20} textAnchor="middle" fontSize={9} fill="white">
                          {dbQueue}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Requests" value={totalRequests.toLocaleString()} unit="" />
        <MetricCard label="Cache Hits" value={cacheHits.toLocaleString()} unit="" />
        <MetricCard label="DB Queries" value={dbQueries.toLocaleString()} unit="" />
        <MetricCard label="Cache Hit Rate" value={cacheHitRate} unit="%" tone={cacheHitRate > 50 ? "good" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Request Latency Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" hide />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Avg Latency Per Hop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hopData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="latency">
                    {hopData.map((_, i) => (
                      <Cell key={i} fill={hopData[i].name === "DB" && dbSlow ? "#ef4444" : "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  unit: string;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  const colors = {
    neutral: "text-foreground",
    good: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-lg font-semibold", colors[tone])}>
        {value}
        <span className="text-xs ml-1 font-normal text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// Approximate point at percent along SVG path (simplified)
function getPointAtPercent(pathD: string, t: number) {
  // Use an offscreen SVG element for accurate measurement if needed; here approximate with simple lerp for bezier
  // Since we know paths are C bezier, use a simple midpoint lerp as fallback
  const match = pathD.match(/M ([\d.]+) ([\d.]+) C ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+)/);
  if (!match) return { x: 0, y: 0 };
  const [, x0, y0, cx1, cy1, cx2, cy2, x3, y3] = match.map(Number);
  const t1 = 1 - t;
  const x = t1 * t1 * t1 * x0 + 3 * t1 * t1 * t * cx1 + 3 * t1 * t * t * cx2 + t * t * t * x3;
  const y = t1 * t1 * t1 * y0 + 3 * t1 * t1 * t * cy1 + 3 * t1 * t * t * cy2 + t * t * t * y3;
  return { x, y };
}
