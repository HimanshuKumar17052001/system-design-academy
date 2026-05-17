"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  LineChart,
  Line,
} from "recharts";
import {
  CreditCard,
  Receipt,
  RotateCcw,
  Play,
  Pause,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Activity,
  Clock,
  Ban,
  Database,
  FileCheck,
  Gauge,
  Wallet,
  ShieldCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PaymentStage =
  | "request"
  | "idempotency-check"
  | "auth"
  | "capture"
  | "ledger"
  | "confirmation"
  | "completed"
  | "failed"
  | "rollback";

interface PaymentRequest {
  id: string;
  idempotencyKey: string;
  stage: PaymentStage;
  startTime: number;
  stageTimes: Partial<Record<PaymentStage, number>>;
  amount: number;
  useIdempotencyKey: boolean;
  failedAt?: PaymentStage;
  isDoubleSpend?: boolean;
}

interface MetricPoint {
  time: number;
  latency: number;
  successRate: number;
  doubleSpendBlocked: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STAGES: { id: PaymentStage; name: string; icon: React.ElementType; baseLatency: number }[] = [
  { id: "request", name: "Request", icon: CreditCard, baseLatency: 5 },
  { id: "idempotency-check", name: "Idempotency", icon: FileCheck, baseLatency: 15 },
  { id: "auth", name: "Auth", icon: Lock, baseLatency: 30 },
  { id: "capture", name: "Capture", icon: Wallet, baseLatency: 45 },
  { id: "ledger", name: "Ledger", icon: Database, baseLatency: 25 },
  { id: "confirmation", name: "Confirm", icon: ShieldCheck, baseLatency: 10 },
];

const STAGE_ORDER: PaymentStage[] = [
  "request",
  "idempotency-check",
  "auth",
  "capture",
  "ledger",
  "confirmation",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PaymentSimulator() {
  const [idempotencyEnabled, setIdempotencyEnabled] = useState(true);
  const [injectionRate, setInjectionRate] = useState(2);
  const [failureStage, setFailureStage] = useState<PaymentStage | "none">("none");
  const [failureProbability, setFailureProbability] = useState(15);
  const [doubleSpendRate, setDoubleSpendRate] = useState(10);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<string[]>(["Payment simulator initialized. Idempotency keys enabled."]);
  const [completed, setCompleted] = useState<PaymentRequest[]>([]);
  const tickRef = useRef(0);
  const reqIdRef = useRef(0);
  const seenKeys = useRef<Set<string>>(new Set());

  /* ------------------------ Helpers ------------------------------- */

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev.slice(-49), `${time}: ${msg}`]);
  }, []);

  /* ------------------------ Injection --------------------------- */

  const injectRequest = useCallback(() => {
    const id = `pay-${reqIdRef.current++}`;
    const isDoubleSpend = Math.random() * 100 < doubleSpendRate;
    let key = `key-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Double spend: reuse an existing key if possible
    if (isDoubleSpend && seenKeys.current.size > 0 && idempotencyEnabled) {
      const keys = Array.from(seenKeys.current);
      key = keys[Math.floor(Math.random() * keys.length)];
    } else {
      seenKeys.current.add(key);
    }

    const req: PaymentRequest = {
      id,
      idempotencyKey: key,
      stage: "request",
      startTime: Date.now(),
      stageTimes: {},
      amount: Math.floor(Math.random() * 200) + 10,
      useIdempotencyKey: idempotencyEnabled,
      isDoubleSpend: isDoubleSpend && idempotencyEnabled,
    };

    setRequests((prev) => [...prev, req]);
    if (isDoubleSpend && idempotencyEnabled) {
      addLog(`Double-spend attempt detected: ${id} reusing key ${key}`);
    }
  }, [idempotencyEnabled, doubleSpendRate, addLog]);

  const injectBurst = () => {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => injectRequest(), i * 100);
    }
    addLog("Burst: 8 payment requests injected");
  };

  /* ------------------------ Simulation Loop --------------------- */

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      injectRequest();
    }, Math.max(300, 5000 / injectionRate));
    return () => clearInterval(interval);
  }, [isRunning, injectionRate, injectRequest]);

  // Process payment stages
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests((prev) => {
        const now = Date.now();
        const updated: PaymentRequest[] = [];
        const completedList: PaymentRequest[] = [];

        prev.forEach((req) => {
          if (["completed", "failed", "rollback"].includes(req.stage)) {
            completedList.push(req);
            return;
          }

          const stageIdx = STAGE_ORDER.indexOf(req.stage);
          const stageConfig = STAGES[stageIdx];
          const prevStages = STAGE_ORDER.slice(0, stageIdx);
          const prevLatency = prevStages.reduce((sum, s) => sum + (req.stageTimes[s] || 0), 0);
          const timeInStage = now - (req.startTime + prevLatency);
          const latency = getStageLatency(stageConfig, req);

          if (timeInStage >= latency) {
            // Idempotency check blocks double spends
            if (req.stage === "idempotency-check" && req.isDoubleSpend && req.useIdempotencyKey) {
              completedList.push({
                ...req,
                stage: "failed",
                failedAt: "idempotency-check",
                stageTimes: { ...req.stageTimes, [req.stage]: latency },
              });
              return;
            }

            // Check injected failure
            if (failureStage === req.stage && Math.random() * 100 < failureProbability) {
              completedList.push({
                ...req,
                stage: "rollback",
                failedAt: req.stage,
                stageTimes: { ...req.stageTimes, [req.stage]: latency },
              });
              return;
            }

            const nextIdx = stageIdx + 1;
            if (nextIdx < STAGE_ORDER.length) {
              updated.push({
                ...req,
                stage: STAGE_ORDER[nextIdx],
                stageTimes: { ...req.stageTimes, [req.stage]: latency },
              });
            } else {
              completedList.push({
                ...req,
                stage: "completed",
                stageTimes: { ...req.stageTimes, [req.stage]: latency },
              });
            }
          } else {
            updated.push(req);
          }
        });

        if (completedList.length > 0) {
          setCompleted((prevComp) => [...prevComp.slice(-199), ...completedList]);
          completedList.forEach((req) => {
            if (req.stage === "rollback") {
              addLog(`Payment ${req.id} failed at ${req.failedAt}. Rollback initiated.`);
            } else if (req.stage === "failed" && req.failedAt === "idempotency-check") {
              addLog(`Payment ${req.id} blocked: duplicate idempotency key`);
            }
          });
        }

        return updated;
      });
    }, 80);
    return () => clearInterval(timer);
  }, [failureStage, failureProbability, addLog]);

  /* ------------------------ Metrics ----------------------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      tickRef.current += 1;
      const recent = completed.filter((j) => Date.now() - j.startTime < 5000);
      const latencies = recent.map((j) => Object.values(j.stageTimes).reduce((a, b) => a + b, 0));
      const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
      const success = recent.filter((j) => j.stage === "completed").length;
      const total = recent.length;
      const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
      const doubleSpendBlocked = recent.filter((j) => j.failedAt === "idempotency-check").length;

      setMetrics((prev) => [
        ...prev.slice(-29),
        { time: tickRef.current, latency: avgLatency, successRate, doubleSpendBlocked },
      ]);
    }, 1000);
    return () => clearInterval(timer);
  }, [completed]);

  /* ------------------------ Reset ------------------------------- */

  const handleReset = () => {
    setIsRunning(false);
    setRequests([]);
    setCompleted([]);
    setMetrics([]);
    seenKeys.current.clear();
    setIdempotencyEnabled(true);
    setFailureStage("none");
    setLogs(["Payment simulator reset."]);
    tickRef.current = 0;
  };

  /* ------------------------ Render Helpers ---------------------- */

  const getStageLatency = (stage: (typeof STAGES)[number], req: PaymentRequest) => {
    let latency = stage.baseLatency + Math.random() * 8;
    if (req.useIdempotencyKey && stage.id === "idempotency-check") latency += 8;
    if (stage.id === "ledger") latency += Math.random() * 15; // ledger variability
    return Math.round(latency);
  };

  const chartData = metrics.map((m, i) => ({ index: i, latency: m.latency, successRate: m.successRate }));
  const latest = metrics[metrics.length - 1] || { latency: 0, successRate: 100, doubleSpendBlocked: 0 };
  const totalCompleted = completed.length;
  const totalFailed = completed.filter((r) => r.stage === "failed" || r.stage === "rollback").length;
  const totalBlocked = completed.filter((r) => r.failedAt === "idempotency-check").length;
  const activeInStage = (stageId: PaymentStage) => requests.filter((r) => r.stage === stageId).length;

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
              Burst (8)
            </Button>
            <Button variant="outline" size="sm" onClick={injectRequest}>
              <CreditCard className="h-4 w-4 mr-1" />
              Inject
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Switch checked={idempotencyEnabled} onCheckedChange={setIdempotencyEnabled} />
            <span className="text-sm">Idempotency</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Inject Failure:</span>
            <Select value={failureStage} onValueChange={(v) => setFailureStage(v as PaymentStage | "none")}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="capture">Capture</SelectItem>
                <SelectItem value="ledger">Ledger</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Failure %:</span>
            <div className="w-20">
              <Slider value={[failureProbability]} min={0} max={50} step={5} onValueChange={(v) => setFailureProbability(v[0])} />
            </div>
            <span className="text-xs text-muted-foreground w-8">{failureProbability}%</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pipeline Visual */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Payment Processing Flow
                </CardTitle>
                <CardDescription>
                  Idempotency {idempotencyEnabled ? "enabled" : "disabled"} —{" "}
                  {requests.filter((r) => !["completed", "failed", "rollback"].includes(r.stage)).length} active transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 bg-muted/30 rounded-lg overflow-hidden border">
                  {/* Payment stages */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 px-4 flex-wrap">
                    {STAGE_ORDER.map((stageId, i) => {
                      const stage = STAGES.find((s) => s.id === stageId)!;
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
                                <div
                                  className={cn(
                                    "w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-colors relative",
                                    stageId === "idempotency-check" && idempotencyEnabled
                                      ? "border-purple-300 bg-purple-50 dark:bg-purple-900/20"
                                      : "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                                  )}
                                >
                                  <Icon
                                    className={cn(
                                      "h-5 w-5",
                                      stageId === "idempotency-check" && idempotencyEnabled
                                        ? "text-purple-600"
                                        : "text-blue-600"
                                    )}
                                  />
                                  {active > 0 && (
                                    <motion.div
                                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ repeat: Infinity, duration: 1 }}
                                    >
                                      {active}
                                    </motion.div>
                                  )}
                                  {failureStage === stageId && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                                      <AlertTriangle className="h-3 w-3 text-red-500" />
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div className="font-medium">{stage.name}</div>
                                <div className="text-muted-foreground">Base latency: {stage.baseLatency}ms</div>
                                {failureStage === stageId && (
                                  <div className="text-red-600">Failure injection active</div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                            <span className="text-[10px] font-medium text-center leading-tight max-w-[70px]">{stage.name}</span>
                          </motion.div>
                          {i < STAGE_ORDER.length - 1 && (
                            <div className="flex items-center">
                              <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Animated requests */}
                  <AnimatePresence>
                    {requests.slice(-25).map((req) => {
                      const stageIdx = STAGE_ORDER.indexOf(req.stage as PaymentStage);
                      if (stageIdx === -1) return null;
                      const xPercent = 10 + stageIdx * 14;
                      return (
                        <motion.div
                          key={req.id}
                          className="absolute z-10"
                          style={{ left: `${xPercent}%`, top: "68%" }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] px-1.5 py-0",
                              req.isDoubleSpend ? "border-red-300 bg-red-50" : "border-emerald-300 bg-emerald-50"
                            )}
                          >
                            ${req.amount}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Rollback / Compensation Visual */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Compensation & Rollback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <CompensationCard
                    label="Successful"
                    count={completed.filter((c) => c.stage === "completed").length}
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    tone="good"
                  />
                  <CompensationCard
                    label="Rolled Back"
                    count={completed.filter((c) => c.stage === "rollback").length}
                    icon={<RotateCcw className="h-4 w-4 text-amber-500" />}
                    tone="warning"
                  />
                  <CompensationCard
                    label="Blocked (Double Spend)"
                    count={completed.filter((c) => c.failedAt === "idempotency-check").length}
                    icon={<Ban className="h-4 w-4 text-red-500" />}
                    tone="danger"
                  />
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  When a failure is injected, the system initiates a rollback sequence reversing all completed stages.
                  Idempotency keys prevent duplicate processing of the same payment intent.
                </div>
              </CardContent>
            </Card>

            {/* Logs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Transaction Log
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
                        log.includes("failed") || log.includes("blocked") || log.includes("Rollback")
                          ? "text-red-600"
                          : "text-muted-foreground"
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
                  <Gauge className="h-4 w-4" />
                  Payment Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricBox label="Success Rate" value={`${latest.successRate}%`} icon={<CheckCircle2 className="h-3 w-3" />} tone={latest.successRate > 90 ? "good" : "warning"} />
                  <MetricBox label="Avg Latency" value={`${latest.latency}ms`} icon={<Clock className="h-3 w-3" />} />
                  <MetricBox label="Blocked" value={totalBlocked.toString()} icon={<Ban className="h-3 w-3" />} tone={totalBlocked > 0 ? "good" : "neutral"} />
                  <MetricBox label="Processed" value={totalCompleted.toString()} icon={<Receipt className="h-3 w-3" />} />
                </div>

                {/* Latency Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Latency Trend</div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fontSize: 10 }} unit="ms" />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="latency" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Success Rate Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Success Rate %</div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="successRate" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Double Spend Prevention */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Double-Spend Prevention</div>
                  <div className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Idempotency Keys</span>
                      <Badge variant={idempotencyEnabled ? "default" : "outline"} className="text-[10px]">
                        {idempotencyEnabled ? "Active" : "Off"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Double Spend Rate</span>
                      <span className="font-mono">{doubleSpendRate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Blocked Attempts</span>
                      <span className="font-mono text-emerald-600">{totalBlocked}</span>
                    </div>
                    <div className="w-full">
                      <Slider value={[doubleSpendRate]} min={0} max={50} step={5} onValueChange={(v) => setDoubleSpendRate(v[0])} />
                    </div>
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

function CompensationCard({
  label,
  count,
  icon,
  tone = "neutral",
}: {
  label: string;
  count: number;
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
    <div className="rounded-lg border bg-card p-3 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-lg font-semibold", colors[tone])}>{count}</div>
      </div>
    </div>
  );
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

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
