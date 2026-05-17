"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Globe,
  MapPin,
  Server,
  Activity,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Route,
  ArrowRight,
  Network,
  TrendingUp,
  Radio,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RegionId = "us-east" | "us-west" | "eu-central" | "apac";

interface Region {
  id: RegionId;
  name: string;
  x: number;
  y: number;
  color: string;
  isHealthy: boolean;
  replicationLag: number;
  latency: number;
  trafficShare: number;
}

interface SimRequest {
  id: string;
  origin: RegionId;
  target: RegionId;
  status: "routing" | "processing" | "completed" | "failed";
  startTime: number;
  rerouted: boolean;
}

interface MetricPoint {
  time: number;
  avgLatency: number;
  throughput: number;
  errorRate: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REGIONS: Region[] = [
  { id: "us-east", name: "US East", x: 28, y: 35, color: "#3b82f6", isHealthy: true, replicationLag: 12, latency: 45, trafficShare: 35 },
  { id: "us-west", name: "US West", x: 15, y: 38, color: "#10b981", isHealthy: true, replicationLag: 18, latency: 65, trafficShare: 25 },
  { id: "eu-central", name: "EU Central", x: 52, y: 30, color: "#f59e0b", isHealthy: true, replicationLag: 25, latency: 85, trafficShare: 25 },
  { id: "apac", name: "APAC", x: 78, y: 42, color: "#ef4444", isHealthy: true, replicationLag: 40, latency: 120, trafficShare: 15 },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function GlobalScaleSimulator() {
  const [regions, setRegions] = useState<Region[]>(REGIONS);
  const [requests, setRequests] = useState<SimRequest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [requestOrigin, setRequestOrigin] = useState<RegionId | "random">("random");
  const [geoRoutingEnabled, setGeoRoutingEnabled] = useState(true);
  const [injectionRate, setInjectionRate] = useState(2);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<string[]>(["Global scale simulator initialized. 4 regions active."]);
  const tickRef = useRef(0);
  const reqIdRef = useRef(0);
  const [completed, setCompleted] = useState<SimRequest[]>([]);

  /* ------------------------ Helpers ------------------------------- */

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev.slice(-49), `${time}: ${msg}`]);
  }, []);

  /* ------------------------ Request Injection ------------------- */

  const injectRequest = useCallback(() => {
    const originId = requestOrigin === "random" ? (REGIONS[Math.floor(Math.random() * REGIONS.length)].id as RegionId) : requestOrigin;
    const id = `req-${reqIdRef.current++}`;

    let targetId = originId;
    if (geoRoutingEnabled) {
      const healthyRegions = regions.filter((r) => r.isHealthy);
      if (healthyRegions.length === 0) {
        addLog(`Request ${id} failed: no healthy regions`);
        return;
      }
      const candidates = healthyRegions.map((r) => ({ id: r.id, latency: r.latency }));
      candidates.sort((a, b) => a.latency - b.latency);
      targetId = candidates[0].id;
      if (targetId !== originId) {
        addLog(`Request ${id} routed from ${regions.find((r) => r.id === originId)?.name} to ${regions.find((r) => r.id === targetId)?.name}`);
      }
    } else {
      const healthyRegions = regions.filter((r) => r.isHealthy);
      if (healthyRegions.length === 0) return;
      targetId = healthyRegions[Math.floor(Math.random() * healthyRegions.length)].id;
    }

    const req: SimRequest = {
      id,
      origin: originId,
      target: targetId,
      status: "routing",
      startTime: Date.now(),
      rerouted: targetId !== originId,
    };

    setRequests((prev) => [...prev, req]);

    setTimeout(() => {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "processing" } : r)));
    }, 300);

    const targetRegion = regions.find((r) => r.id === targetId);
    const processingTime = targetRegion ? targetRegion.latency + Math.random() * 20 : 100;

    setTimeout(() => {
      if (!targetRegion?.isHealthy && Math.random() < 0.3) {
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "failed" } : r)));
        addLog(`Request ${id} failed at ${targetRegion?.name}`);
      } else {
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "completed" } : r)));
      }
    }, 300 + processingTime);
  }, [requestOrigin, geoRoutingEnabled, regions, addLog]);

  const injectBurst = () => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => injectRequest(), i * 80);
    }
    addLog("Burst: 10 global requests injected");
  };

  /* ------------------------ Simulation Loop --------------------- */

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      injectRequest();
    }, Math.max(300, 5000 / injectionRate));
    return () => clearInterval(interval);
  }, [isRunning, injectionRate, injectRequest]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRequests((prev) => {
        const now = Date.now();
        const stillActive = prev.filter((r) => {
          if (r.status === "completed" || r.status === "failed") {
            const keep = now - r.startTime < 2000;
            if (!keep) {
              setCompleted((comp) => [...comp.slice(-199), r]);
            }
            return keep;
          }
          return true;
        });
        return stillActive;
      });
    }, 500);
    return () => clearInterval(timer);
  }, []);

  /* ------------------------ Metrics ----------------------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      tickRef.current += 1;
      const recent = completed.filter((j) => Date.now() - j.startTime < 5000);
      const latencies = recent.map((r) => {
        const target = regions.find((reg) => reg.id === r.target);
        return target ? target.latency + (r.rerouted ? 15 : 0) : 100;
      });
      const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
      const throughput = Math.round(recent.length / 5);
      const failed = recent.filter((r) => r.status === "failed").length;
      const errorRate = recent.length > 0 ? Math.round((failed / recent.length) * 100) : 0;

      setMetrics((prev) => [...prev.slice(-29), { time: tickRef.current, avgLatency, throughput, errorRate }]);
    }, 1000);
    return () => clearInterval(timer);
  }, [completed, regions]);

  /* ------------------------ Region Controls --------------------- */

  const toggleRegionHealth = (regionId: RegionId) => {
    setRegions((prev) =>
      prev.map((r) => {
        if (r.id !== regionId) return r;
        const next = { ...r, isHealthy: !r.isHealthy };
        addLog(`${next.name} marked as ${next.isHealthy ? "healthy" : "failed"}`);
        return next;
      })
    );
  };

  /* ------------------------ Reset ------------------------------- */

  const handleReset = () => {
    setIsRunning(false);
    setRequests([]);
    setCompleted([]);
    setMetrics([]);
    setRegions(REGIONS);
    setLogs(["Global scale simulator reset."]);
    tickRef.current = 0;
  };

  /* ------------------------ Render Helpers ---------------------- */

  const latest = metrics[metrics.length - 1] || { avgLatency: 0, throughput: 0, errorRate: 0 };
  const totalCompleted = completed.length;
  const totalFailed = completed.filter((r) => r.status === "failed").length;

  const trafficDistribution = useMemo(() => {
    const counts: Record<RegionId, number> = { "us-east": 0, "us-west": 0, "eu-central": 0, apac: 0 };
    completed.forEach((r) => {
      counts[r.target] = (counts[r.target] || 0) + 1;
    });
    return regions.map((r) => ({
      name: r.name,
      value: counts[r.id] || 0,
      color: r.color,
    }));
  }, [completed, regions]);

  const chartData = metrics.map((m, i) => ({ index: i, latency: m.avgLatency, throughput: m.throughput, errorRate: m.errorRate }));

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant={isRunning ? "destructive" : "default"} size="sm" onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isRunning ? "Pause" : "Start"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button variant="secondary" size="sm" onClick={injectBurst}>
              <Zap className="h-4 w-4 mr-1" />
              Burst (10)
            </Button>
            <Button variant="outline" size="sm" onClick={injectRequest}>
              <Globe className="h-4 w-4 mr-1" />
              Inject
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Switch checked={geoRoutingEnabled} onCheckedChange={setGeoRoutingEnabled} />
            <span className="text-sm">Geo-Routing</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Origin:</span>
            <Select value={requestOrigin} onValueChange={(v) => setRequestOrigin(v as RegionId | "random")}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="us-east">US East</SelectItem>
                <SelectItem value="us-west">US West</SelectItem>
                <SelectItem value="eu-central">EU Central</SelectItem>
                <SelectItem value="apac">APAC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Rate:</span>
            <div className="w-20">
              <Slider value={[injectionRate]} min={1} max={10} step={1} onValueChange={(v) => setInjectionRate(v[0])} />
            </div>
            <span className="text-xs text-muted-foreground w-8">{injectionRate}/s</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map Visual */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Multi-Region Deployment
                </CardTitle>
                <CardDescription>
                  Geo-routing {geoRoutingEnabled ? "enabled" : "disabled"} — {regions.filter((r) => r.isHealthy).length} of {regions.length} regions healthy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-72 bg-muted/30 rounded-lg overflow-hidden border">
                  {/* SVG World Map Silhouette */}
                  <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                    <path
                      d="M20,25 Q25,20 30,25 T40,25 Q45,22 50,25 T60,22 Q65,18 70,22 T80,20 Q85,25 80,30 T75,35 Q70,38 65,35 T55,38 Q50,40 45,38 T35,40 Q30,38 25,35 T20,30 Q15,28 20,25Z"
                      fill="currentColor"
                      className="text-slate-400"
                    />
                    <path
                      d="M12,32 Q15,28 18,32 T22,35 Q25,38 22,42 T18,45 Q15,48 12,45 T8,42 Q5,38 8,35 T12,32Z"
                      fill="currentColor"
                      className="text-slate-400"
                    />
                    <path
                      d="M78,38 Q82,35 85,38 T90,42 Q92,45 90,48 T85,50 Q82,52 78,50 T74,48 Q72,45 74,42 T78,38Z"
                      fill="currentColor"
                      className="text-slate-400"
                    />
                  </svg>

                  {/* Region Nodes */}
                  {regions.map((region) => (
                    <motion.div
                      key={region.id}
                      className="absolute z-10"
                      style={{ left: `${region.x}%`, top: `${region.y}%` }}
                      animate={region.isHealthy ? {} : { opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => toggleRegionHealth(region.id)}
                            className={cn(
                              "relative w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-colors -translate-x-1/2 -translate-y-1/2",
                              region.isHealthy
                                ? "border-white shadow-lg"
                                : "border-red-300 bg-red-50 dark:bg-red-900/20 opacity-60"
                            )}
                            style={{
                              backgroundColor: region.isHealthy ? region.color + "20" : undefined,
                              borderColor: region.isHealthy ? region.color : undefined,
                            }}
                          >
                            <Server
                              className="h-5 w-5"
                              style={{ color: region.isHealthy ? region.color : "#ef4444" }}
                            />
                            {!region.isHealthy && (
                              <div className="absolute -top-1 -right-1">
                                <XCircle className="h-4 w-4 text-red-500 bg-white rounded-full" />
                              </div>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <div className="font-medium">{region.name}</div>
                          <div className="text-muted-foreground">Latency: {region.latency}ms</div>
                          <div className="text-muted-foreground">Replication Lag: {region.replicationLag}ms</div>
                          <div className={region.isHealthy ? "text-emerald-600" : "text-red-600"}>
                            {region.isHealthy ? "Healthy" : "Failed (click to toggle)"}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1"
                          style={{ borderColor: region.color, color: region.color }}
                        >
                          {region.name}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}

                  {/* Connection lines between regions */}
                  <svg className="absolute inset-0 pointer-events-none w-full h-full">
                    {regions.map((from, i) =>
                      regions.slice(i + 1).map((to) => (
                        <motion.line
                          key={`${from.id}-${to.id}`}
                          x1={`${from.x}%`}
                          y1={`${from.y}%`}
                          x2={`${to.x}%`}
                          y2={`${to.y}%`}
                          stroke={from.isHealthy && to.isHealthy ? "#94a3b8" : "#ef4444"}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.4 }}
                          transition={{ duration: 0.5 }}
                        />
                      ))
                    )}
                  </svg>

                  {/* Animated requests */}
                  <AnimatePresence>
                    {requests.slice(-20).map((req) => {
                      const origin = regions.find((r) => r.id === req.origin);
                      const target = regions.find((r) => r.id === req.target);
                      if (!origin || !target) return null;

                      return (
                        <motion.div
                          key={req.id}
                          className="absolute z-20"
                          style={{ left: `${origin.x}%`, top: `${origin.y}%` }}
                          initial={{ opacity: 1, scale: 1 }}
                          animate={{
                            left: `${target.x}%`,
                            top: `${target.y}%`,
                            opacity: req.status === "completed" || req.status === "failed" ? 0 : 1,
                            scale: req.status === "completed" || req.status === "failed" ? 0.5 : 1,
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                          <div
                            className={cn(
                              "w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/50",
                              req.status === "failed" ? "bg-red-500" : "bg-blue-500"
                            )}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Region Cards */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Region Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => toggleRegionHealth(region.id)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-all hover:shadow-sm",
                        region.isHealthy
                          ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-red-200 bg-red-50 dark:bg-red-900/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="h-6 w-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: region.color + "30" }}
                        >
                          <Globe className="h-3 w-3" style={{ color: region.color }} />
                        </div>
                        <Badge
                          variant={region.isHealthy ? "default" : "destructive"}
                          className="text-[9px] px-1.5 py-0"
                        >
                          {region.isHealthy ? "Healthy" : "Failed"}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">{region.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">Latency: {region.latency}ms</div>
                      <div className="text-[10px] text-muted-foreground">Repl. Lag: {region.replicationLag}ms</div>
                      <div className="text-[10px] text-muted-foreground">Traffic: {region.trafficShare}%</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Logs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Event Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "text-xs border-b last:border-0 pb-1",
                        log.includes("failed") || log.includes("Failed") ? "text-red-600" : "text-muted-foreground"
                      )}
                    >
                      {log}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Global Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricBox label="Avg Latency" value={`${latest.avgLatency}ms`} icon={<Clock className="h-3 w-3" />} />
                  <MetricBox label="Throughput" value={`${latest.throughput}/s`} icon={<Zap className="h-3 w-3" />} />
                  <MetricBox
                    label="Error Rate"
                    value={`${latest.errorRate}%`}
                    icon={<XCircle className="h-3 w-3" />}
                    tone={latest.errorRate > 5 ? "warning" : "good"}
                  />
                  <MetricBox label="Processed" value={totalCompleted.toString()} icon={<Globe className="h-3 w-3" />} />
                </div>

                {/* Latency Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Latency by Time</div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fontSize: 10 }} unit="ms" />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="latency" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Error Rate Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Error Rate %</div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="errorRate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Traffic Distribution */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Traffic Distribution</div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={trafficDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {trafficDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={20} iconSize={8} />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Region Latencies */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Latency by Region</div>
                  <div className="space-y-1.5">
                    {regions.map((r) => {
                      const regionRequests = completed.filter((c) => c.target === r.id);
                      const avg =
                        regionRequests.length > 0
                          ? Math.round(regionRequests.reduce((sum, c) => sum + (c.rerouted ? r.latency + 15 : r.latency), 0) / regionRequests.length)
                          : r.latency;
                      return (
                        <div key={r.id} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={cn("w-2 h-2 rounded-full", r.isHealthy ? "bg-emerald-500" : "bg-red-500")}
                            />
                            {r.name}
                          </span>
                          <span className="font-mono text-muted-foreground">{avg}ms</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MetricBox({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  const colors = {
    neutral: "text-foreground",
    good: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={cn("text-sm font-semibold", colors[tone])}>{value}</div>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
