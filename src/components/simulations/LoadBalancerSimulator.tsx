"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Server,
  Zap,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Rocket,
  Minus,
  Plus,
  Clock,
  XCircle,
  CheckCircle2,
  Gauge,
} from "lucide-react";

type Algorithm =
  | "round-robin"
  | "weighted-round-robin"
  | "least-connections"
  | "ip-hash"
  | "random";

interface ServerConfig {
  id: number;
  name: string;
  weight: number;
  isSlow: boolean;
  isFailed: boolean;
  requestCount: number;
  activeConnections: number;
  totalResponseTime: number;
  failedRequestCount: number;
  healthStatus: "healthy" | "degraded" | "unhealthy";
}

type RequestStatus =
  | "incoming"
  | "routing"
  | "processing"
  | "responding"
  | "completed"
  | "failed";

interface SimRequest {
  id: string;
  color: string;
  targetServerId: number;
  status: RequestStatus;
  startTime: number;
  clientIp: string;
}

const REQUEST_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateClientIp(seq: number): string {
  return `192.168.1.${(seq % 254) + 1}`;
}

function getHealthColor(status: ServerConfig["healthStatus"]) {
  switch (status) {
    case "healthy":
      return "bg-emerald-500";
    case "degraded":
      return "bg-amber-500";
    case "unhealthy":
      return "bg-red-500";
  }
}

function getHealthText(status: ServerConfig["healthStatus"]) {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    case "unhealthy":
      return "Unhealthy";
  }
}

export default function LoadBalancerSimulator() {
  const [serverCount, setServerCount] = useState(3);
  const [algorithm, setAlgorithm] = useState<Algorithm>("round-robin");
  const [speed, setSpeed] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [requests, setRequests] = useState<SimRequest[]>([]);
  const [servers, setServers] = useState<ServerConfig[]>(
    createInitialServers(3)
  );
  const [burstQueue, setBurstQueue] = useState(0);
  const seqRef = useRef(0);
  const rrIndexRef = useRef(0);
  const requestIdRef = useRef(0);

  // Keep servers array size in sync with serverCount
  useEffect(() => {
    setServers((prev) => {
      if (serverCount > prev.length) {
        const added = createInitialServers(serverCount - prev.length, prev.length);
        return [...prev, ...added];
      }
      if (serverCount < prev.length) {
        return prev.slice(0, serverCount);
      }
      return prev;
    });
  }, [serverCount]);

  // Health check interval
  useEffect(() => {
    const interval = setInterval(() => {
      setServers((prev) =>
        prev.map((s) => {
          if (s.isFailed) return { ...s, healthStatus: "unhealthy" };
          if (s.isSlow || s.activeConnections > 5)
            return { ...s, healthStatus: "degraded" };
          return { ...s, healthStatus: "healthy" };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Request generation loop
  useEffect(() => {
    if (!isRunning) return;
    const baseInterval = 800;
    const intervalMs = Math.max(100, baseInterval / speed);

    const timer = setInterval(() => {
      // Process burst queue first
      setBurstQueue((q) => {
        if (q > 0) {
          generateRequest();
          return q - 1;
        }
        generateRequest();
        return 0;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, speed, servers, algorithm]);

  // Cleanup old completed/failed requests
  useEffect(() => {
    const cleanup = setInterval(() => {
      setRequests((prev) =>
        prev.filter((r) => {
          if (r.status === "completed" || r.status === "failed") {
            // Keep for 2 seconds after completion for animation
            const completedAt = r.startTime + getRequestDuration(r, servers);
            return Date.now() - completedAt < 2000;
          }
          return true;
        })
      );
    }, 1000);
    return () => clearInterval(cleanup);
  }, [servers]);

  const generateRequest = useCallback(() => {
    const activeServers = servers.filter((s) => !s.isFailed);
    if (activeServers.length === 0) return;

    const seq = seqRef.current++;
    const clientIp = generateClientIp(seq);
    const targetServerId = selectServer(algorithm, activeServers, clientIp, seq);

    if (targetServerId === null) return;

    const reqId = `req-${requestIdRef.current++}`;
    const color = REQUEST_COLORS[seq % REQUEST_COLORS.length];

    const newRequest: SimRequest = {
      id: reqId,
      color,
      targetServerId,
      status: "incoming",
      startTime: Date.now(),
      clientIp,
    };

    setRequests((prev) => [...prev, newRequest]);

    // Simulate routing delay
    setTimeout(() => {
      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: "routing" } : r))
      );
    }, 150 / speed);

    // Simulate arrival at server
    setTimeout(() => {
      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: "processing" } : r))
      );
      setServers((prev) =>
        prev.map((s) =>
          s.id === targetServerId
            ? { ...s, activeConnections: s.activeConnections + 1 }
            : s
        )
      );
    }, 400 / speed);

    // Simulate processing completion
    const processingTime = getProcessingTime(targetServerId, servers);
    setTimeout(() => {
      const server = servers.find((s) => s.id === targetServerId);
      if (!server) return;

      if (server.isFailed) {
        setRequests((prev) =>
          prev.map((r) => (r.id === reqId ? { ...r, status: "failed" } : r))
        );
        setServers((prev) =>
          prev.map((s) =>
            s.id === targetServerId
              ? {
                  ...s,
                  activeConnections: Math.max(0, s.activeConnections - 1),
                  failedRequestCount: s.failedRequestCount + 1,
                }
              : s
          )
        );
      } else {
        setRequests((prev) =>
          prev.map((r) => (r.id === reqId ? { ...r, status: "responding" } : r))
        );
        setServers((prev) =>
          prev.map((s) =>
            s.id === targetServerId
              ? {
                  ...s,
                  requestCount: s.requestCount + 1,
                  activeConnections: Math.max(0, s.activeConnections - 1),
                  totalResponseTime: s.totalResponseTime + processingTime,
                }
              : s
          )
        );

        // Response animation complete
        setTimeout(() => {
          setRequests((prev) =>
            prev.map((r) => (r.id === reqId ? { ...r, status: "completed" } : r))
          );
        }, 300 / speed);
      }
    }, (400 + processingTime) / speed);
  }, [algorithm, servers, speed]);

  const handleBurst = () => {
    setBurstQueue((prev) => prev + 50);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRequests([]);
    setBurstQueue(0);
    setServers(createInitialServers(serverCount));
    seqRef.current = 0;
    rrIndexRef.current = 0;
  };

  const updateServer = (id: number, updates: Partial<ServerConfig>) => {
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const chartData = useMemo(() => {
    return servers.map((s) => ({
      name: s.name,
      requests: s.requestCount,
      avgTime:
        s.requestCount > 0
          ? Math.round(s.totalResponseTime / s.requestCount)
          : 0,
      failed: s.failedRequestCount,
      health: s.healthStatus,
    }));
  }, [servers]);

  const totalRequests = servers.reduce((sum, s) => sum + s.requestCount, 0);
  const totalFailed = servers.reduce((sum, s) => sum + s.failedRequestCount, 0);
  const avgResponseTime =
    totalRequests > 0
      ? Math.round(
          servers.reduce((sum, s) => sum + s.totalResponseTime, 0) /
            totalRequests
        )
      : 0;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={isRunning ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? (
                <Pause className="h-4 w-4 mr-1" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              {isRunning ? "Pause" : "Start"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBurst}>
              <Rocket className="h-4 w-4 mr-1" />
              Burst (50)
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Algorithm:</span>
            <Select
              value={algorithm}
              onValueChange={(v) => setAlgorithm(v as Algorithm)}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round-robin">Round Robin</SelectItem>
                <SelectItem value="weighted-round-robin">
                  Weighted Round Robin
                </SelectItem>
                <SelectItem value="least-connections">
                  Least Connections
                </SelectItem>
                <SelectItem value="ip-hash">IP Hash</SelectItem>
                <SelectItem value="random">Random</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Speed:</span>
            <div className="flex gap-1">
              {[1, 2, 5].map((s) => (
                <Button
                  key={s}
                  variant={speed === s ? "default" : "outline"}
                  size="xs"
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Servers:</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setServerCount((c) => Math.max(1, c - 1))}
                disabled={serverCount <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-mono w-5 text-center text-sm">
                {serverCount}
              </span>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setServerCount((c) => Math.min(8, c + 1))}
                disabled={serverCount >= 8}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Animation Canvas */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Request Flow
                </CardTitle>
                <CardDescription>
                  Incoming requests are distributed based on the selected
                  algorithm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 bg-muted/30 rounded-lg overflow-hidden border">
                  {/* Request spawn area (top) */}
                  <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center border-b border-dashed border-border/50">
                    <Badge variant="outline" className="text-xs">
                      Incoming Requests
                    </Badge>
                  </div>

                  {/* Server area (bottom) */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 flex items-end justify-center gap-2 px-4 pb-3">
                    {servers.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {s.activeConnections > 0 && (
                            <span className="text-amber-500">
                              {s.activeConnections}
                            </span>
                          )}
                        </div>
                        <div
                          className={cn(
                            "w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-colors",
                            s.isFailed
                              ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                              : s.isSlow
                                ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
                                : "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                          )}
                        >
                          <Server
                            className={cn(
                              "h-5 w-5",
                              s.isFailed
                                ? "text-red-500"
                                : s.isSlow
                                  ? "text-amber-500"
                                  : "text-emerald-500"
                            )}
                          />
                        </div>
                        <span className="text-[10px] font-medium">
                          {s.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Response area (right) */}
                  <div className="absolute top-12 right-0 bottom-20 w-20 flex items-center justify-center border-l border-dashed border-border/50">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        Response
                      </Badge>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-1" />
                    </div>
                  </div>

                  {/* Animated Requests */}
                  <AnimatePresence>
                    {requests.map((req) => {
                      const serverIndex = servers.findIndex(
                        (s) => s.id === req.targetServerId
                      );
                      const serverX =
                        serverIndex >= 0
                          ? 16 + serverIndex * 56 + 24
                          : 100;
                      const serverY = 180;

                      let x = 50;
                      let y = 10;
                      let opacity = 1;
                      let scale = 1;

                      if (req.status === "incoming") {
                        x = 50 + (hashString(req.id) % 40) - 20;
                        y = 10;
                      } else if (req.status === "routing") {
                        x = serverX;
                        y = serverY - 30;
                      } else if (req.status === "processing") {
                        x = serverX;
                        y = serverY;
                        scale = 0.8;
                      } else if (req.status === "responding") {
                        x = 90;
                        y = 80;
                      } else if (
                        req.status === "completed" ||
                        req.status === "failed"
                      ) {
                        x = req.status === "completed" ? 90 : 50;
                        y = req.status === "completed" ? 120 : 80;
                        opacity = 0;
                        scale = 0.5;
                      }

                      return (
                        <motion.div
                          key={req.id}
                          initial={{ x: 50, y: 10, opacity: 1, scale: 1 }}
                          animate={{ x, y, opacity, scale }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{
                            duration: 0.4 / speed,
                            ease: "easeInOut",
                          }}
                          className="absolute"
                          style={{
                            left: 0,
                            top: 0,
                            marginLeft: -6,
                            marginTop: -6,
                          }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/50"
                                style={{
                                  backgroundColor:
                                    req.status === "failed"
                                      ? "#ef4444"
                                      : req.color,
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <div>{req.id}</div>
                              <div className="text-muted-foreground">
                                {req.clientIp} → {servers.find((s) => s.id === req.targetServerId)?.name}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Server Configuration */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Server Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {servers.map((s) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-lg border p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            getHealthColor(s.healthStatus)
                          )}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Weight</span>
                          <span className="font-mono">{s.weight}</span>
                        </div>
                        <Slider
                          defaultValue={[s.weight]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={(v: number[]) =>
                            updateServer(s.id, { weight: v[0] })
                          }
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={s.isSlow ? "secondary" : "outline"}
                          size="xs"
                          className="flex-1"
                          onClick={() => updateServer(s.id, { isSlow: !s.isSlow })}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Slow
                        </Button>
                        <Button
                          variant={s.isFailed ? "destructive" : "outline"}
                          size="xs"
                          className="flex-1"
                          onClick={() =>
                            updateServer(s.id, { isFailed: !s.isFailed })
                          }
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {getHealthText(s.healthStatus)}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {s.requestCount} req
                        </span>
                      </div>
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
                  <Gauge className="h-4 w-4" />
                  Live Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricBox
                    label="Total Requests"
                    value={totalRequests.toLocaleString()}
                    icon={<Activity className="h-3 w-3" />}
                  />
                  <MetricBox
                    label="Avg Response"
                    value={`${avgResponseTime}ms`}
                    icon={<Clock className="h-3 w-3" />}
                  />
                  <MetricBox
                    label="Failed"
                    value={totalFailed.toLocaleString()}
                    icon={<XCircle className="h-3 w-3" />}
                    tone={totalFailed > 0 ? "danger" : "good"}
                  />
                  <MetricBox
                    label="Active"
                    value={requests.filter((r) => r.status === "processing").length.toString()}
                    icon={<Zap className="h-3 w-3" />}
                  />
                </div>

                {/* Requests per Server Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Requests per Server</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey="requests" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.health === "unhealthy"
                                  ? "#ef4444"
                                  : entry.health === "degraded"
                                    ? "#f59e0b"
                                    : "#10b981"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Avg Response Time Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Avg Response Time</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} unit="ms" />
                        <RechartsTooltip
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar
                          dataKey="avgTime"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Failed Requests */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Failed Requests</div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar
                          dataKey="failed"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Health Status */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Health Check Status</div>
                  <div className="space-y-1.5">
                    {servers.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              getHealthColor(s.healthStatus)
                            )}
                          />
                          {s.name}
                        </span>
                        <span
                          className={cn(
                            s.healthStatus === "healthy"
                              ? "text-emerald-600"
                              : s.healthStatus === "degraded"
                                ? "text-amber-600"
                                : "text-red-600"
                          )}
                        >
                          {getHealthText(s.healthStatus)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Algorithm Info */}
        <Card size="sm">
          <CardContent className="pt-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">
                  {algorithm === "round-robin" && "Round Robin:"}
                  {algorithm === "weighted-round-robin" && "Weighted Round Robin:"}
                  {algorithm === "least-connections" && "Least Connections:"}
                  {algorithm === "ip-hash" && "IP Hash:"}
                  {algorithm === "random" && "Random:"}
                </span>{" "}
                {algorithm === "round-robin" &&
                  "Distributes requests sequentially across all healthy servers. Best for homogeneous servers with equal capacity."}
                {algorithm === "weighted-round-robin" &&
                  "Distributes requests proportionally to server weights. A server with weight 4 receives 4x the traffic of weight 1."}
                {algorithm === "least-connections" &&
                  "Routes to the server with the fewest active connections. Best for long-lived connections or variable request processing times."}
                {algorithm === "ip-hash" &&
                  "Uses a hash of the client IP to determine the target server. Same client always hits the same server (session stickiness)."}
                {algorithm === "random" &&
                  "Selects a random healthy server for each request. Simple but can lead to uneven distribution with small sample sizes."}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

function createInitialServers(count: number, startId = 0): ServerConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    name: `Server ${startId + i + 1}`,
    weight: 1,
    isSlow: false,
    isFailed: false,
    requestCount: 0,
    activeConnections: 0,
    totalResponseTime: 0,
    failedRequestCount: 0,
    healthStatus: "healthy",
  }));
}

function selectServer(
  algorithm: Algorithm,
  activeServers: ServerConfig[],
  clientIp: string,
  seq: number
): number | null {
  if (activeServers.length === 0) return null;

  switch (algorithm) {
    case "round-robin": {
      const idx = seq % activeServers.length;
      return activeServers[idx].id;
    }
    case "weighted-round-robin": {
      // Create weighted list
      const weighted: number[] = [];
      activeServers.forEach((s) => {
        for (let i = 0; i < s.weight; i++) weighted.push(s.id);
      });
      if (weighted.length === 0) return activeServers[0].id;
      const idx = seq % weighted.length;
      return weighted[idx];
    }
    case "least-connections": {
      const min = Math.min(...activeServers.map((s) => s.activeConnections));
      const candidates = activeServers.filter(
        (s) => s.activeConnections === min
      );
      // Break ties with round robin
      const idx = seq % candidates.length;
      return candidates[idx].id;
    }
    case "ip-hash": {
      const hash = hashString(clientIp);
      const idx = hash % activeServers.length;
      return activeServers[idx].id;
    }
    case "random": {
      const idx = Math.floor(Math.random() * activeServers.length);
      return activeServers[idx].id;
    }
    default:
      return activeServers[0].id;
  }
}

function getProcessingTime(serverId: number, servers: ServerConfig[]): number {
  const server = servers.find((s) => s.id === serverId);
  if (!server) return 50;
  if (server.isSlow) return 300 + Math.random() * 200;
  return 50 + Math.random() * 50;
}

function getRequestDuration(req: SimRequest, servers: ServerConfig[]): number {
  const server = servers.find((s) => s.id === req.targetServerId);
  if (!server) return 500;
  if (server.isFailed) return 100;
  if (server.isSlow) return 500;
  return 250;
}

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

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
