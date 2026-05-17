"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Shield,
  Zap,
  ServerCrash,
  Database,
  Network,
  MemoryStick,
  Cpu,
  Activity,
  Timer,
  RotateCcw,
  Play,
  Pause,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ServiceStatus = "healthy" | "degraded" | "failed";

type ServiceType = "lb" | "api" | "db" | "cache" | "queue";

interface ServiceNode {
  id: string;
  name: string;
  type: ServiceType;
  status: ServiceStatus;
  replicas: number;
  defenses: string[];
}

interface Connection {
  id: string;
  from: string;
  to: string;
  status: "healthy" | "broken";
}

interface MetricPoint {
  time: number;
  availability: number;
  errorRate: number;
  latency: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GOAL_DURATION = 120; // seconds

const INITIAL_SERVICES: ServiceNode[] = [
  { id: "lb", name: "Load Balancer", type: "lb", status: "healthy", replicas: 1, defenses: [] },
  { id: "api-1", name: "API-1", type: "api", status: "healthy", replicas: 1, defenses: [] },
  { id: "api-2", name: "API-2", type: "api", status: "healthy", replicas: 1, defenses: [] },
  { id: "api-3", name: "API-3", type: "api", status: "healthy", replicas: 1, defenses: [] },
  { id: "db", name: "Database", type: "db", status: "healthy", replicas: 1, defenses: [] },
  { id: "cache", name: "Cache", type: "cache", status: "healthy", replicas: 1, defenses: [] },
  { id: "queue", name: "Queue", type: "queue", status: "healthy", replicas: 1, defenses: [] },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { id: "c-lb-api", from: "lb", to: "api-1", status: "healthy" },
  { id: "c-lb-api2", from: "lb", to: "api-2", status: "healthy" },
  { id: "c-lb-api3", from: "lb", to: "api-3", status: "healthy" },
  { id: "c-api-db", from: "api-1", to: "db", status: "healthy" },
  { id: "c-api-cache", from: "api-1", to: "cache", status: "healthy" },
  { id: "c-api-queue", from: "api-1", to: "queue", status: "healthy" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ChaosLab() {
  const [services, setServices] = useState<ServiceNode[]>(INITIAL_SERVICES);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(100);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [events, setEvents] = useState<string[]>(["Simulation initialized. Goal: maintain >95% availability for 2 minutes."]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef(0);

  /* ------------------------ Helpers ------------------------------- */

  const logEvent = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setEvents((prev) => [...prev, `${time}: ${msg}`]);
  }, []);

  const getService = (id: string) => services.find((s) => s.id === id)!;

  const apiServices = services.filter((s) => s.type === "api");
  const otherServices = services.filter((s) => s.type !== "api");

  /* ------------------------ Simulation Tick ---------------------- */

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= GOAL_DURATION) {
          setRunning(false);
          logEvent("Time limit reached. Simulation stopped.");
        }
        return next;
      });

      tickRef.current += 1;
      const t = tickRef.current;

      // Calculate system state
      setServices((currentServices) => {
        const apiNodes = currentServices.filter((s) => s.type === "api");
        const db = currentServices.find((s) => s.type === "db")!;
        const cache = currentServices.find((s) => s.type === "cache")!;
        const queue = currentServices.find((s) => s.type === "queue")!;

        // Auto-scale logic: if any api has cpu exhaustion and auto-scaling enabled
        apiNodes.forEach((api) => {
          if (api.status === "degraded" && api.defenses.includes("auto-scale")) {
            // chance to spawn new replica
            if (Math.random() < 0.3 && apiNodes.length < 6) {
              const newId = `api-${apiNodes.length + 1}`;
              setServices((s) => [
                ...s,
                { id: newId, name: newId.toUpperCase(), type: "api", status: "healthy", replicas: 1, defenses: [] },
              ]);
              setConnections((c) => [
                ...c,
                { id: `c-lb-${newId}`, from: "lb", to: newId, status: "healthy" },
              ]);
              logEvent(`HPA scaled out: ${newId} added.`);
            }
          }
        });

        // Memory leak progression
        currentServices.forEach((s) => {
          if (s.status === "degraded" && !s.defenses.includes("circuit-breaker")) {
            // 10% chance per tick to fail
            if (Math.random() < 0.1) {
              setServices((srvs) => srvs.map((x) => (x.id === s.id ? { ...x, status: "failed" as ServiceStatus } : x)));
              logEvent(`${s.name} failed due to memory leak.`);
            }
          }
        });

        // Availability calculation
        const totalApi = apiNodes.length;
        const healthyApi = apiNodes.filter((s) => s.status === "healthy").length;
        const degradedApi = apiNodes.filter((s) => s.status === "degraded").length;
        const failedApi = apiNodes.filter((s) => s.status === "failed").length;

        let baseAvailability = 100;
        let baseLatency = 50;
        let baseErrorRate = 0;

        // API failures reduce availability
        if (failedApi > 0) {
          baseAvailability -= (failedApi / totalApi) * 30;
          baseLatency += failedApi * 40;
          baseErrorRate += (failedApi / totalApi) * 10;
        }
        if (degradedApi > 0) {
          baseAvailability -= (degradedApi / totalApi) * 10;
          baseLatency += degradedApi * 20;
          baseErrorRate += (degradedApi / totalApi) * 3;
        }

        // DB impact
        if (db.status === "failed") {
          baseAvailability -= 40;
          baseLatency += 100;
          baseErrorRate += 15;
        } else if (db.status === "degraded") {
          baseAvailability -= 15;
          baseLatency += 60;
          baseErrorRate += 5;
        }

        // Network partition impact
        const brokenConns = connections.filter((c) => c.status === "broken").length;
        if (brokenConns > 0) {
          baseAvailability -= brokenConns * 8;
          baseErrorRate += brokenConns * 2;
        }

        // Cache fallback mitigates DB failure
        if (db.status === "failed" && cache.defenses.includes("cache-fallback")) {
          baseAvailability += 25;
          baseErrorRate -= 8;
          logEvent("Cache fallback serving stale data while DB is down.");
        }

        // Retry mitigates transient errors
        if (baseErrorRate > 0 && apiNodes.some((a) => a.defenses.includes("retry"))) {
          baseErrorRate *= 0.6;
          baseLatency += 10;
        }

        // Circuit breaker mitigates cascading failures
        if (db.status === "failed" && apiNodes.some((a) => a.defenses.includes("circuit-breaker"))) {
          baseAvailability += 10;
          baseErrorRate -= 3;
        }

        baseAvailability = Math.max(0, Math.min(100, baseAvailability));
        baseErrorRate = Math.max(0, baseErrorRate);
        baseLatency = Math.max(10, baseLatency);

        setMetrics((prev) => [
          ...prev,
          { time: t, availability: Number(baseAvailability.toFixed(1)), errorRate: Number(baseErrorRate.toFixed(1)), latency: Math.round(baseLatency) },
        ]);

        setScore((prevScore) => {
          const penalty = baseAvailability < 95 ? (95 - baseAvailability) * 0.2 : 0;
          const next = Math.max(0, prevScore - penalty);
          return Number(next.toFixed(1));
        });

        return currentServices;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, connections, logEvent]);

  /* ------------------------ Attacks ------------------------------- */

  const killApi = () => {
    const apis = services.filter((s) => s.type === "api" && s.status === "healthy");
    if (apis.length === 0) return;
    const target = apis[Math.floor(Math.random() * apis.length)];
    setServices((s) => s.map((x) => (x.id === target.id ? { ...x, status: "failed" } : x)));
    logEvent(`${target.name} killed. Traffic redistributed to remaining API servers.`);
  };

  const slowDatabase = () => {
    setServices((s) => s.map((x) => (x.type === "db" ? { ...x, status: "degraded" } : x)));
    logEvent("Database latency injected. Requests queueing up.");
  };

  const networkPartition = () => {
    setConnections((c) => {
      const healthy = c.filter((x) => x.status === "healthy");
      if (healthy.length === 0) return c;
      const target = healthy[Math.floor(Math.random() * healthy.length)];
      return c.map((x) => (x.id === target.id ? { ...x, status: "broken" } : x));
    });
    logEvent("Network partition injected between two services.");
  };

  const memoryLeak = () => {
    const candidates = services.filter((s) => s.status === "healthy");
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    setServices((s) => s.map((x) => (x.id === target.id ? { ...x, status: "degraded" } : x)));
    logEvent(`Memory leak started on ${target.name}. Service degrading over time.`);
  };

  const cpuExhaustion = () => {
    const candidates = services.filter((s) => s.type === "api" && s.status === "healthy");
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    setServices((s) => s.map((x) => (x.id === target.id ? { ...x, status: "degraded" } : x)));
    logEvent(`CPU exhaustion on ${target.name}. HPA may scale if configured.`);
  };

  /* ------------------------ Defenses ------------------------------ */

  const addCircuitBreaker = () => {
    setServices((s) =>
      s.map((x) => (x.type === "api" && !x.defenses.includes("circuit-breaker") ? { ...x, defenses: [...x.defenses, "circuit-breaker"] } : x))
    );
    logEvent("Circuit breaker added to API tier.");
  };

  const addRetry = () => {
    setServices((s) =>
      s.map((x) => (x.type === "api" && !x.defenses.includes("retry") ? { ...x, defenses: [...x.defenses, "retry"] } : x))
    );
    logEvent("Retry with exponential backoff added to API tier.");
  };

  const addRedundancy = () => {
    const apis = services.filter((s) => s.type === "api");
    if (apis.length >= 6) return;
    const newId = `api-${apis.length + 1}`;
    setServices((s) => [
      ...s,
      { id: newId, name: newId.toUpperCase(), type: "api", status: "healthy", replicas: 1, defenses: [] },
    ]);
    setConnections((c) => [...c, { id: `c-lb-${newId}`, from: "lb", to: newId, status: "healthy" }]);
    logEvent(`Redundancy added: ${newId} replica launched.`);
  };

  const addAutoScaling = () => {
    setServices((s) =>
      s.map((x) => (x.type === "api" && !x.defenses.includes("auto-scale") ? { ...x, defenses: [...x.defenses, "auto-scale"] } : x))
    );
    logEvent("Auto-scaling (HPA) enabled on API tier.");
  };

  const addCacheFallback = () => {
    setServices((s) =>
      s.map((x) => (x.type === "cache" && !x.defenses.includes("cache-fallback") ? { ...x, defenses: [...x.defenses, "cache-fallback"] } : x))
    );
    logEvent("Cache fallback configured for degraded mode.");
  };

  /* ------------------------ Reset / Start ------------------------- */

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setScore(100);
    setMetrics([]);
    setEvents(["Simulation initialized. Goal: maintain >95% availability for 2 minutes."]);
    setServices(INITIAL_SERVICES);
    setConnections(INITIAL_CONNECTIONS);
    tickRef.current = 0;
  };

  /* ------------------------ Render Helpers ------------------------ */

  const statusColor = (status: ServiceStatus) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-500";
      case "degraded":
        return "bg-amber-500";
      case "failed":
        return "bg-red-500";
    }
  };

  const statusText = (status: ServiceStatus) => {
    switch (status) {
      case "healthy":
        return "Healthy";
      case "degraded":
        return "Degraded";
      case "failed":
        return "Failed";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-base px-3 py-1">
            Score: {score.toFixed(0)}
          </Badge>
          <Badge variant={score >= 80 ? "default" : score >= 50 ? "secondary" : "destructive"}>
            {score >= 80 ? "Strong" : score >= 50 ? "At Risk" : "Critical"}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            {elapsed}s / {GOAL_DURATION}s
          </div>
          <Progress value={(elapsed / GOAL_DURATION) * 100} className="w-32" />
          <Button size="sm" onClick={() => setRunning((r) => !r)}>
            {running ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {running ? "Pause" : "Start"}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Goal Banner */}
      <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
        Goal: Maintain <strong>&gt;95% availability</strong> for {GOAL_DURATION} seconds under attacks. Apply defenses to mitigate damage.
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Attack Panel */}
        <div className="col-span-12 md:col-span-3 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Attacks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="destructive" size="sm" onClick={killApi}>
                <ServerCrash className="h-4 w-4 mr-2" />
                Kill API Server
              </Button>
              <Button className="w-full justify-start" variant="destructive" size="sm" onClick={slowDatabase}>
                <Database className="h-4 w-4 mr-2" />
                Slow Database
              </Button>
              <Button className="w-full justify-start" variant="destructive" size="sm" onClick={networkPartition}>
                <Network className="h-4 w-4 mr-2" />
                Network Partition
              </Button>
              <Button className="w-full justify-start" variant="destructive" size="sm" onClick={memoryLeak}>
                <MemoryStick className="h-4 w-4 mr-2" />
                Memory Leak
              </Button>
              <Button className="w-full justify-start" variant="destructive" size="sm" onClick={cpuExhaustion}>
                <Cpu className="h-4 w-4 mr-2" />
                CPU Exhaustion
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Architecture Visual */}
        <div className="col-span-12 md:col-span-6 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Load Balancer */}
              <div className="flex justify-center">
                <ServiceBox service={getService("lb")} statusColor={statusColor} statusText={statusText} />
              </div>

              {/* Connections LB -> API */}
              <div className="flex justify-center gap-1">
                {connections
                  .filter((c) => c.from === "lb" && c.to.startsWith("api"))
                  .map((c) => (
                    <ConnectionLine key={c.id} connection={c} />
                  ))}
              </div>

              {/* API Tier */}
              <div className="flex justify-center gap-3 flex-wrap">
                <AnimatePresence>
                  {apiServices.map((s) => (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <ServiceBox service={s} statusColor={statusColor} statusText={statusText} pulse={s.status !== "healthy"} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Connections API -> Downstream */}
              <div className="flex justify-center gap-6">
                {connections
                  .filter((c) => c.from.startsWith("api") && !c.to.startsWith("api"))
                  .map((c) => (
                    <ConnectionLine key={c.id} connection={c} />
                  ))}
              </div>

              {/* Downstream Tier */}
              <div className="flex justify-center gap-4 flex-wrap">
                {otherServices
                  .filter((s) => s.type !== "lb")
                  .map((s) => (
                    <ServiceBox key={s.id} service={s} statusColor={statusColor} statusText={statusText} pulse={s.status !== "healthy"} />
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Metrics Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 300]} />
                    <ReTooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="availability"
                      name="Availability %"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.2}
                      isAnimationActive={false}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="errorRate"
                      name="Error Rate %"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.2}
                      isAnimationActive={false}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="latency"
                      name="Latency (ms)"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Defense Panel */}
        <div className="col-span-12 md:col-span-3 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                Defenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" size="sm" onClick={addCircuitBreaker}>
                Add Circuit Breaker
              </Button>
              <Button className="w-full justify-start" variant="outline" size="sm" onClick={addRetry}>
                Add Retry with Backoff
              </Button>
              <Button className="w-full justify-start" variant="outline" size="sm" onClick={addRedundancy}>
                Add Redundancy
              </Button>
              <Button className="w-full justify-start" variant="outline" size="sm" onClick={addAutoScaling}>
                Add Auto-Scaling
              </Button>
              <Button className="w-full justify-start" variant="outline" size="sm" onClick={addCacheFallback}>
                Add Cache Fallback
              </Button>
            </CardContent>
          </Card>

          {/* Event Log */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Event Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {events.map((e, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-muted-foreground border-b last:border-0 pb-1"
                    >
                      {e}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ServiceBox({
  service,
  statusColor,
  statusText,
  pulse = false,
}: {
  service: ServiceNode;
  statusColor: (s: ServiceStatus) => string;
  statusText: (s: ServiceStatus) => string;
  pulse?: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            animate={pulse ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`relative rounded-lg border p-3 min-w-[80px] text-center cursor-default ${statusColor(service.status)}`}
          >
            <div className="text-white text-xs font-semibold">{service.name}</div>
            <div className="text-[10px] text-white/80 mt-1">{statusText(service.status)}</div>
            {service.defenses.length > 0 && (
              <div className="mt-1 flex justify-center gap-0.5">
                {service.defenses.map((d) => (
                  <Badge key={d} variant="secondary" className="text-[9px] px-1 py-0">
                    {d}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {service.name} — {statusText(service.status)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ConnectionLine({ connection }: { connection: Connection }) {
  return (
    <motion.div
      animate={{ opacity: connection.status === "broken" ? 0.3 : 1 }}
      className={`h-6 w-px border-l-2 border-dashed ${connection.status === "broken" ? "border-red-500" : "border-muted-foreground/40"}`}
    />
  );
}
