"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Fingerprint,
  FileKey,
  UserCheck,
  Globe,
  Server,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AuthStep = "tls" | "jwt" | "rbac" | "resource";

interface AuthConfig {
  mtls: boolean;
  oauth2: boolean;
  saml: boolean;
  apiKey: boolean;
}

interface AuthRequest {
  id: string;
  step: AuthStep | "completed" | "failed";
  config: AuthConfig;
  startTime: number;
  stepTimes: Record<AuthStep, number>;
  failedAt?: AuthStep;
  failureReason?: string;
}

interface MetricPoint {
  time: number;
  securityScore: number;
  latency: number;
  failed: number;
  success: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEPS: { id: AuthStep; name: string; icon: React.ElementType; baseLatency: number }[] = [
  { id: "tls", name: "TLS Termination", icon: Lock, baseLatency: 8 },
  { id: "jwt", name: "JWT Validation", icon: KeyRound, baseLatency: 12 },
  { id: "rbac", name: "RBAC Check", icon: UserCheck, baseLatency: 18 },
  { id: "resource", name: "Resource Access", icon: Server, baseLatency: 25 },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SecuritySimulator() {
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    mtls: true,
    oauth2: false,
    saml: false,
    apiKey: false,
  });
  const [requests, setRequests] = useState<AuthRequest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [injectionRate, setInjectionRate] = useState(3);
  const [failureProbability, setFailureProbability] = useState(10);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<string[]>(["Security simulator initialized. TLS enabled by default."]);
  const [completedRequests, setCompletedRequests] = useState<AuthRequest[]>([]);
  const tickRef = useRef(0);
  const reqIdRef = useRef(0);

  /* ------------------------ Helpers ------------------------------- */

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev.slice(-49), `${time}: ${msg}`]);
  }, []);

  /* ------------------------ Security Score ---------------------- */

  const securityScore = useCallback((config: AuthConfig) => {
    let score = 40; // base for TLS
    if (config.mtls) score += 20;
    if (config.oauth2) score += 20;
    if (config.saml) score += 10;
    if (config.apiKey) score += 10;
    return Math.min(100, score);
  }, []);

  /* ------------------------ Injection --------------------------- */

  const injectRequest = useCallback(() => {
    const id = `sec-${reqIdRef.current++}`;
    const req: AuthRequest = {
      id,
      step: "tls",
      config: { ...authConfig },
      startTime: Date.now(),
      stepTimes: { tls: 0, jwt: 0, rbac: 0, resource: 0 },
    };
    setRequests((prev) => [...prev, req]);
  }, [authConfig]);

  const injectBurst = () => {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => injectRequest(), i * 100);
    }
    addLog("Burst: 8 auth requests injected");
  };

  /* ------------------------ Simulation Loop --------------------- */

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      injectRequest();
    }, Math.max(300, 5000 / injectionRate));
    return () => clearInterval(interval);
  }, [isRunning, injectionRate, injectRequest]);

  // Process auth steps
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests((prev) => {
        const now = Date.now();
        const updated: AuthRequest[] = [];
        const completed: AuthRequest[] = [];

        prev.forEach((req) => {
          if (req.step === "completed" || req.step === "failed") {
            completed.push(req);
            return;
          }

          const stepIdx = STEPS.findIndex((s) => s.id === req.step);
          const stepConfig = STEPS[stepIdx];
          const timeInStep = now - (req.startTime + Object.values(req.stepTimes).slice(0, stepIdx).reduce((a, b) => a + b, 0));
          const latency = getStepLatency(stepConfig, req);

          if (timeInStep >= latency) {
            // Check for failure
            const failRoll = Math.random() * 100;
            if (failRoll < failureProbability) {
              const reasons = [
                "Certificate expired",
                "Invalid token signature",
                "Insufficient permissions",
                "Resource not found",
              ];
              completed.push({
                ...req,
                step: "failed",
                failedAt: req.step,
                failureReason: reasons[stepIdx],
                stepTimes: { ...req.stepTimes, [req.step]: latency },
              });
              return;
            }

            const nextIdx = stepIdx + 1;
            if (nextIdx < STEPS.length) {
              updated.push({
                ...req,
                step: STEPS[nextIdx].id,
                stepTimes: { ...req.stepTimes, [req.step]: latency },
              });
            } else {
              completed.push({
                ...req,
                step: "completed",
                stepTimes: { ...req.stepTimes, [req.step]: latency },
              });
            }
          } else {
            updated.push(req);
          }
        });

        if (completed.length > 0) {
          setCompletedRequests((prevComp) => [...prevComp.slice(-199), ...completed]);
          completed.forEach((req) => {
            if (req.step === "failed") {
              addLog(`Request ${req.id} failed at ${req.failedAt}: ${req.failureReason}`);
            }
          });
        }

        return updated;
      });
    }, 80);
    return () => clearInterval(timer);
  }, [failureProbability, addLog]);

  /* ------------------------ Metrics ----------------------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      tickRef.current += 1;
      const recent = completedRequests.filter((j) => Date.now() - j.startTime < 5000);
      const latencies = recent.map((j) => Object.values(j.stepTimes).reduce((a, b) => a + b, 0));
      const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
      const failed = recent.filter((j) => j.step === "failed").length;
      const success = recent.filter((j) => j.step === "completed").length;
      const score = securityScore(authConfig);

      setMetrics((prev) => [...prev.slice(-29), { time: tickRef.current, securityScore: score, latency: avgLatency, failed, success }]);
    }, 1000);
    return () => clearInterval(timer);
  }, [completedRequests, authConfig, securityScore]);

  /* ------------------------ Toggle Config ----------------------- */

  const toggleConfig = (key: keyof AuthConfig) => {
    setAuthConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      addLog(`${key === "mtls" ? "mTLS" : key === "apiKey" ? "API Key" : key.toUpperCase()} ${next[key] ? "enabled" : "disabled"}`);
      return next;
    });
  };

  /* ------------------------ Reset ------------------------------- */

  const handleReset = () => {
    setIsRunning(false);
    setRequests([]);
    setCompletedRequests([]);
    setMetrics([]);
    setAuthConfig({ mtls: true, oauth2: false, saml: false, apiKey: false });
    setLogs(["Security simulator reset."]);
    tickRef.current = 0;
  };

  /* ------------------------ Render Helpers ---------------------- */

  const getStepLatency = (step: (typeof STEPS)[number], req: AuthRequest) => {
    let latency = step.baseLatency + Math.random() * 8;
    if (req.config.mtls && step.id === "tls") latency += 12;
    if (req.config.oauth2 && step.id === "jwt") latency += 8;
    if (req.config.saml && step.id === "jwt") latency += 20;
    if (req.config.apiKey && step.id === "rbac") latency += 5;
    return Math.round(latency);
  };

  const chartData = metrics.map((m, i) => ({ index: i, latency: m.latency, failed: m.failed, success: m.success }));
  const latest = metrics[metrics.length - 1] || { securityScore: 40, latency: 0, failed: 0, success: 0 };
  const totalCompleted = completedRequests.length;
  const totalFailed = completedRequests.filter((r) => r.step === "failed").length;
  const successRate = totalCompleted > 0 ? Math.round(((totalCompleted - totalFailed) / totalCompleted) * 100) : 100;

  const activeInStep = (stepId: AuthStep) => requests.filter((r) => r.step === stepId).length;

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
              <Shield className="h-4 w-4 mr-1" />
              Inject
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Failure %:</span>
            <div className="w-24">
              <Slider value={[failureProbability]} min={0} max={50} step={5} onValueChange={(v) => setFailureProbability(v[0])} />
            </div>
            <span className="text-xs text-muted-foreground w-8">{failureProbability}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rate:</span>
            <div className="w-20">
              <Slider value={[injectionRate]} min={1} max={10} step={1} onValueChange={(v) => setInjectionRate(v[0])} />
            </div>
            <span className="text-xs text-muted-foreground w-8">{injectionRate}/s</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Auth Flow Visual */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Security Flow
                </CardTitle>
                <CardDescription>
                  Security Score: {latest.securityScore}/100 — {totalCompleted} requests processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 bg-muted/30 rounded-lg overflow-hidden border">
                  {/* Request origin */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl border-2 border-slate-300 bg-slate-50 dark:bg-slate-900/20 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-slate-500" />
                    </div>
                    <span className="text-[10px] font-medium">Client</span>
                  </div>

                  {/* Auth steps */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 pl-16 pr-4">
                    {STEPS.map((step, i) => {
                      const active = activeInStep(step.id);
                      const Icon = step.icon;
                      return (
                        <React.Fragment key={step.id}>
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
                                    "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                                  )}
                                >
                                  <Icon className="h-5 w-5 text-blue-600" />
                                  {active > 0 && (
                                    <motion.div
                                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ repeat: Infinity, duration: 1 }}
                                    >
                                      {active}
                                    </motion.div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div className="font-medium">{step.name}</div>
                                <div className="text-muted-foreground">Base latency: {step.baseLatency}ms</div>
                              </TooltipContent>
                            </Tooltip>
                            <span className="text-[10px] font-medium text-center leading-tight max-w-[70px]">{step.name}</span>
                          </motion.div>
                          {i < STEPS.length - 1 && (
                            <motion.div
                              className="h-px w-6 bg-muted-foreground/30"
                              animate={active > 0 ? { opacity: [0.3, 1, 0.3] } : {}}
                              transition={{ repeat: Infinity, duration: 1 }}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Result area */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`result-${latest.success}-${latest.failed}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                          "w-12 h-12 rounded-xl border-2 flex items-center justify-center",
                          latest.failed > 0
                            ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                            : "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                        )}
                      >
                        {latest.failed > 0 ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                    <span className="text-[10px] font-medium">{latest.failed > 0 ? "Denied" : "Allowed"}</span>
                  </div>

                  {/* Animated requests */}
                  <AnimatePresence>
                    {requests.slice(-25).map((req) => {
                      const stepIdx = STEPS.findIndex((s) => s.id === req.step);
                      if (stepIdx === -1) return null;
                      const xPercent = 20 + stepIdx * 18;
                      return (
                        <motion.div
                          key={req.id}
                          className="absolute z-10"
                          style={{ left: `${xPercent}%`, top: "65%" }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] px-1.5 py-0",
                              req.step === "failed" ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"
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

            {/* Auth Controls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileKey className="h-4 w-4" />
                  Authentication Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ConfigToggle
                    label="mTLS"
                    description="Mutual TLS"
                    enabled={authConfig.mtls}
                    onToggle={() => toggleConfig("mtls")}
                    icon={<Fingerprint className="h-4 w-4" />}
                    impact="+20 score, +12ms TLS"
                  />
                  <ConfigToggle
                    label="OAuth2"
                    description="OAuth 2.0"
                    enabled={authConfig.oauth2}
                    onToggle={() => toggleConfig("oauth2")}
                    icon={<KeyRound className="h-4 w-4" />}
                    impact="+20 score, +8ms JWT"
                  />
                  <ConfigToggle
                    label="SAML"
                    description="SAML 2.0"
                    enabled={authConfig.saml}
                    onToggle={() => toggleConfig("saml")}
                    icon={<Shield className="h-4 w-4" />}
                    impact="+10 score, +20ms JWT"
                  />
                  <ConfigToggle
                    label="API Key"
                    description="API Key Auth"
                    enabled={authConfig.apiKey}
                    onToggle={() => toggleConfig("apiKey")}
                    icon={<Lock className="h-4 w-4" />}
                    impact="+10 score, +5ms RBAC"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Logs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Security Log
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
                        log.includes("failed") ? "text-red-600" : "text-muted-foreground"
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
                  <ShieldAlert className="h-4 w-4" />
                  Security Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricBox
                    label="Security Score"
                    value={`${latest.securityScore}`}
                    icon={<Shield className="h-3 w-3" />}
                    tone={latest.securityScore >= 80 ? "good" : latest.securityScore >= 50 ? "warning" : "danger"}
                  />
                  <MetricBox label="Avg Latency" value={`${latest.latency}ms`} icon={<Clock className="h-3 w-3" />} />
                  <MetricBox
                    label="Success Rate"
                    value={`${successRate}%`}
                    icon={<CheckCircle2 className="h-3 w-3" />}
                    tone={successRate >= 95 ? "good" : "warning"}
                  />
                  <MetricBox
                    label="Failed"
                    value={totalFailed.toString()}
                    icon={<XCircle className="h-3 w-3" />}
                    tone={totalFailed > 0 ? "danger" : "good"}
                  />
                </div>

                {/* Latency Impact Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Latency by Request</div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fontSize: 10 }} unit="ms" />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="latency" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Success vs Failed */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Recent Outcomes</div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="success" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Active Config */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Active Protections</div>
                  <div className="space-y-1.5">
                    {Object.entries(authConfig).map(([key, enabled]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn("w-2 h-2 rounded-full", enabled ? "bg-emerald-500" : "bg-slate-300")}
                          />
                          {key === "mtls" ? "mTLS" : key === "apiKey" ? "API Key" : key.toUpperCase()}
                        </span>
                        <span className={enabled ? "text-emerald-600" : "text-slate-400"}>
                          {enabled ? "Active" : "Off"}
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

function ConfigToggle({
  label,
  description,
  enabled,
  onToggle,
  icon,
  impact,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  impact: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            className={cn(
              "rounded-lg border p-3 text-left transition-all hover:shadow-sm",
              enabled
                ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-slate-200 bg-slate-50 dark:bg-slate-900/20 opacity-70"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", enabled ? "bg-emerald-100" : "bg-slate-100")}>
                {React.cloneElement(icon as React.ReactElement<any>, {
                  className: cn("h-4 w-4", enabled ? "text-emerald-600" : "text-slate-400"),
                })}
              </div>
              <Switch checked={enabled} onCheckedChange={onToggle} />
            </div>
            <div className="text-sm font-medium">{label}</div>
            <div className="text-[10px] text-muted-foreground">{description}</div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="font-medium">{impact}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
