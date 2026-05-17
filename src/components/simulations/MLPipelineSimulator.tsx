"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BrainCircuit,
  Database,
  Filter,
  Gauge,
  Layers,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Activity,
  ArrowRight,
  GitBranch,
  Percent,
  Target,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PipelineStage = "feature-store" | "preprocessing" | "inference" | "post-processing";

interface StageConfig {
  id: PipelineStage;
  name: string;
  icon: React.ElementType;
  baseLatency: number;
  isHealthy: boolean;
}

type InferenceMode = "realtime" | "batch";

type ModelVersion = "v1" | "v2";

interface RequestJob {
  id: string;
  stage: PipelineStage | "completed" | "failed";
  mode: InferenceMode;
  modelVersion: ModelVersion;
  startTime: number;
  stageTimes: Record<PipelineStage, number>;
}

interface MetricPoint {
  time: number;
  latency: number;
  throughput: number;
  accuracy: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STAGES: StageConfig[] = [
  { id: "feature-store", name: "Feature Store", icon: Database, baseLatency: 20, isHealthy: true },
  { id: "preprocessing", name: "Preprocessing", icon: Filter, baseLatency: 35, isHealthy: true },
  { id: "inference", name: "Model Inference", icon: BrainCircuit, baseLatency: 80, isHealthy: true },
  { id: "post-processing", name: "Post-processing", icon: Sparkles, baseLatency: 15, isHealthy: true },
];

const STAGE_ORDER: PipelineStage[] = ["feature-store", "preprocessing", "inference", "post-processing"];

const VERSION_CONFIG: Record<ModelVersion, { accuracy: number; latencyMultiplier: number }> = {
  v1: { accuracy: 0.82, latencyMultiplier: 0.9 },
  v2: { accuracy: 0.91, latencyMultiplier: 1.2 },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MLPipelineSimulator() {
  const [mode, setMode] = useState<InferenceMode>("realtime");
  const [modelVersion, setModelVersion] = useState<ModelVersion>("v2");
  const [abSplit, setAbSplit] = useState(30); // % to v2
  const [stages, setStages] = useState<StageConfig[]>(STAGES);
  const [requests, setRequests] = useState<RequestJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [injectionRate, setInjectionRate] = useState(2);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<string[]>(["ML Pipeline initialized. v2 model accuracy: 91%, v1: 82%"]);
  const [completedJobs, setCompletedJobs] = useState<RequestJob[]>([]);
  const tickRef = useRef(0);
  const reqIdRef = useRef(0);

  /* ------------------------ Helpers ------------------------------- */

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev.slice(-49), `${time}: ${msg}`]);
  }, []);

  /* ------------------------ Injection --------------------------- */

  const injectRequest = useCallback(() => {
    const assignedVersion = Math.random() * 100 < abSplit ? "v2" : "v1";
    const id = `req-${reqIdRef.current++}`;
    const job: RequestJob = {
      id,
      stage: "feature-store",
      mode,
      modelVersion: assignedVersion,
      startTime: Date.now(),
      stageTimes: {
        "feature-store": 0,
        preprocessing: 0,
        inference: 0,
        "post-processing": 0,
      },
    };
    setRequests((prev) => [...prev, job]);
    addLog(`Injected ${mode} request → ${assignedVersion.toUpperCase()}`);
  }, [mode, abSplit, addLog]);

  const injectBurst = () => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => injectRequest(), i * 80);
    }
    addLog("Burst: 10 requests injected");
  };

  /* ------------------------ Simulation Loop --------------------- */

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      injectRequest();
    }, Math.max(300, 5000 / injectionRate));
    return () => clearInterval(interval);
  }, [isRunning, injectionRate, injectRequest]);

  // Process pipeline stages
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests((prev) => {
        const now = Date.now();
        const updated: RequestJob[] = [];
        const completed: RequestJob[] = [];

        prev.forEach((req) => {
          if (req.stage === "completed" || req.stage === "failed") {
            completed.push(req);
            return;
          }

          const stageIdx = STAGE_ORDER.indexOf(req.stage);
          const stageConfig = stages.find((s) => s.id === req.stage)!;

          // Determine if request has been in this stage long enough
          const timeInStage = now - (req.startTime + Object.values(req.stageTimes).slice(0, stageIdx).reduce((a, b) => a + b, 0));
          const latency = getStageLatency(stageConfig, req);

          if (timeInStage >= latency) {
            // Move to next stage
            const nextIdx = stageIdx + 1;
            const nextStage = STAGE_ORDER[nextIdx];

            if (!stageConfig.isHealthy && Math.random() < 0.3) {
              updated.push({ ...req, stage: "failed", stageTimes: { ...req.stageTimes, [req.stage]: latency } });
              return;
            }

            if (nextStage) {
              updated.push({
                ...req,
                stage: nextStage,
                stageTimes: { ...req.stageTimes, [req.stage]: latency },
              });
            } else {
              const finishedJob: RequestJob = {
                ...req,
                stage: "completed",
                stageTimes: { ...req.stageTimes, [req.stage]: latency },
              };
              completed.push(finishedJob);
            }
          } else {
            updated.push(req);
          }
        });

        if (completed.length > 0) {
          setCompletedJobs((prevComp) => [...prevComp.slice(-199), ...completed]);
        }

        return updated;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [stages]);

  /* ------------------------ Metrics ----------------------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      tickRef.current += 1;
      const recentCompleted = completedJobs.filter((j) => Date.now() - j.startTime < 5000);
      const latencies = recentCompleted.map((j) => {
        const total = Object.values(j.stageTimes).reduce((a, b) => a + b, 0);
        return total;
      });
      const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
      const throughput = Math.round(recentCompleted.length / 5);

      const accurateCount = recentCompleted.filter((j) => {
        const acc = VERSION_CONFIG[j.modelVersion].accuracy;
        return Math.random() < acc; // simulate accuracy outcome
      }).length;
      const accuracy = recentCompleted.length > 0 ? Math.round((accurateCount / recentCompleted.length) * 100) : 0;

      setMetrics((prev) => [...prev.slice(-29), { time: tickRef.current, latency: avgLatency, throughput, accuracy }]);
    }, 1000);
    return () => clearInterval(timer);
  }, [completedJobs]);

  /* ------------------------ Toggle Stage Health --------------- */

  const toggleStageHealth = (stageId: PipelineStage) => {
    setStages((prev) =>
      prev.map((s) => {
        if (s.id !== stageId) return s;
        const next = { ...s, isHealthy: !s.isHealthy };
        addLog(`${next.name} marked as ${next.isHealthy ? "healthy" : "degraded"}`);
        return next;
      })
    );
  };

  /* ------------------------ Reset ------------------------------- */

  const handleReset = () => {
    setIsRunning(false);
    setRequests([]);
    setCompletedJobs([]);
    setMetrics([]);
    setStages(STAGES);
    setLogs(["Pipeline reset."]);
    tickRef.current = 0;
  };

  /* ------------------------ Render Helpers ---------------------- */

  const getStageLatency = (stage: StageConfig, req: RequestJob) => {
    let latency = stage.baseLatency + Math.random() * 10;
    if (!stage.isHealthy) latency *= 3;
    if (req.mode === "batch") latency *= 0.7; // batch is faster per item (bulk)
    latency *= VERSION_CONFIG[req.modelVersion].latencyMultiplier;
    return Math.round(latency);
  };

  const chartData = metrics.map((m, i) => ({ index: i, latency: m.latency, throughput: m.throughput, accuracy: m.accuracy }));

  const activeInStage = (stageId: PipelineStage) => requests.filter((r) => r.stage === stageId).length;

  const versionDistribution = useMemo(() => {
    const v1Count = completedJobs.filter((j) => j.modelVersion === "v1").length;
    const v2Count = completedJobs.filter((j) => j.modelVersion === "v2").length;
    return [
      { name: "v1", value: v1Count, color: "#94a3b8" },
      { name: "v2", value: v2Count, color: "#3b82f6" },
    ];
  }, [completedJobs]);

  const latestMetrics = metrics[metrics.length - 1] || { latency: 0, throughput: 0, accuracy: 0 };

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
              <ArrowRight className="h-4 w-4 mr-1" />
              Inject
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mode:</span>
            <Select value={mode} onValueChange={(v) => setMode(v as InferenceMode)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="batch">Batch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Model:</span>
            <Select value={modelVersion} onValueChange={(v) => setModelVersion(v as ModelVersion)}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">v1 (82%)</SelectItem>
                <SelectItem value="v2">v2 (91%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">A/B v2:</span>
            <div className="w-24">
              <Slider value={[abSplit]} min={0} max={100} step={5} onValueChange={(v) => setAbSplit(v[0])} />
            </div>
            <span className="text-xs text-muted-foreground w-10">{abSplit}%</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pipeline Visual */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  ML Serving Pipeline
                </CardTitle>
                <CardDescription>
                  {mode === "realtime" ? "Real-time inference" : "Batch inference"} —{" "}
                  {requests.filter((r) => r.stage !== "completed" && r.stage !== "failed").length} active jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-56 bg-muted/30 rounded-lg overflow-hidden border">
                  {/* Pipeline stages */}
                  <div className="absolute inset-0 flex items-center justify-center gap-4 px-6">
                    {STAGE_ORDER.map((stageId, i) => {
                      const stage = stages.find((s) => s.id === stageId)!;
                      const active = activeInStage(stageId);
                      const Icon = stage.icon;
                      return (
                        <React.Fragment key={stageId}>
                          <motion.div
                            className="flex flex-col items-center gap-2 relative"
                            animate={active > 0 ? { scale: [1, 1.02, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => toggleStageHealth(stageId)}
                                  className={cn(
                                    "w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-colors relative",
                                    stage.isHealthy
                                      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                                      : "border-red-300 bg-red-50 dark:bg-red-900/20"
                                  )}
                                >
                                  <Icon
                                    className={cn(
                                      "h-6 w-6",
                                      stage.isHealthy ? "text-emerald-600" : "text-red-500"
                                    )}
                                  />
                                  {active > 0 && (
                                    <motion.div
                                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ repeat: Infinity, duration: 1 }}
                                    >
                                      {active}
                                    </motion.div>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div className="font-medium">{stage.name}</div>
                                <div className="text-muted-foreground">Base latency: {stage.baseLatency}ms</div>
                                <div className={stage.isHealthy ? "text-emerald-600" : "text-red-600"}>
                                  {stage.isHealthy ? "Healthy" : "Degraded (click to toggle)"}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            <span className="text-[10px] font-medium text-center leading-tight">{stage.name}</span>
                          </motion.div>
                          {i < STAGE_ORDER.length - 1 && (
                            <div className="flex items-center">
                              <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Animated requests moving through pipeline */}
                  <AnimatePresence>
                    {requests.slice(-30).map((req) => {
                      const stageIdx = STAGE_ORDER.indexOf(req.stage as PipelineStage);
                      if (stageIdx === -1) return null;
                      const xPercent = 12 + stageIdx * 22;
                      return (
                        <motion.div
                          key={req.id}
                          className="absolute z-10"
                          style={{ left: `${xPercent}%`, top: "60%" }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] px-1.5 py-0",
                              req.modelVersion === "v2" ? "border-blue-300 bg-blue-50" : "border-slate-300"
                            )}
                          >
                            {req.id}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Logs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Pipeline Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-muted-foreground border-b last:border-0 pb-1"
                    >
                      {log}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stage Info */}
            <Card size="sm">
              <CardContent className="pt-3">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <span className="font-medium text-foreground">Pipeline Stages:</span> Feature Store fetches
                    pre-computed features. Preprocessing normalizes input. Model Inference runs the neural network.
                    Post-processing formats results. Click any stage to toggle its health. A/B split routes{" "}
                    {abSplit}% of traffic to v2.
                  </div>
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
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricBox label="Avg Latency" value={`${latestMetrics.latency}ms`} icon={<Clock className="h-3 w-3" />} />
                  <MetricBox label="Throughput" value={`${latestMetrics.throughput}/s`} icon={<Zap className="h-3 w-3" />} />
                  <MetricBox
                    label="Accuracy"
                    value={`${latestMetrics.accuracy}%`}
                    icon={<Target className="h-3 w-3" />}
                    tone={latestMetrics.accuracy > 85 ? "good" : "warning"}
                  />
                  <MetricBox label="Completed" value={completedJobs.length.toString()} icon={<BrainCircuit className="h-3 w-3" />} />
                </div>

                {/* Latency Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Latency Trend</div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fontSize: 10 }} unit="ms" />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="latency" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Throughput Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Throughput</div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="throughput" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Version Distribution */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Model Version Split</div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={versionDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {versionDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={20} iconSize={8} />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stage Status */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Stage Health</div>
                  <div className="space-y-1.5">
                    {stages.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              s.isHealthy ? "bg-emerald-500" : "bg-red-500"
                            )}
                          />
                          {s.name}
                        </span>
                        <span className={s.isHealthy ? "text-emerald-600" : "text-red-600"}>
                          {s.isHealthy ? "Healthy" : "Degraded"}
                        </span>
                      </div>
                    ))}
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
