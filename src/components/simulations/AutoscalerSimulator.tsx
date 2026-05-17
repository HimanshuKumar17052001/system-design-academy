"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Cpu, Play, Pause, RotateCcw, AlertCircle, Info, TrendingUp } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PodStatus = "running" | "pending" | "terminating" | "overloaded";

interface Pod {
  id: string;
  status: PodStatus;
  cpu: number;
  pendingTimer?: number;
  terminatingTimer?: number;
}

interface MetricPoint {
  time: number;
  traffic: number;
  podCount: number;
  avgCpu: number;
  errorRate: number;
  successRate: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function initPods(count: number): Pod[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `pod-${i + 1}`,
    status: "running",
    cpu: 0,
  }));
}

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AutoscalerSimulator() {
  /* Controls */
  const [traffic, setTraffic] = useState(2000);
  const [scaleMetric, setScaleMetric] = useState<"cpu" | "requests" | "queue" | "custom">("cpu");
  const [targetThreshold, setTargetThreshold] = useState(70);
  const [minPods, setMinPods] = useState(2);
  const [maxPods, setMaxPods] = useState(20);
  const [scaleUpDelay, setScaleUpDelay] = useState(5);
  const [coolDown, setCoolDown] = useState(10);

  const [running, setRunning] = useState(false);
  const [pods, setPods] = useState<Pod[]>(() => initPods(minPods));
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [time, setTime] = useState(0);
  const [pendingScale, setPendingScale] = useState<{ targetPods: number; readyAt: number } | null>(null);

  /* Refs for latest control values inside interval */
  const trafficRef = useRef(traffic);
  const targetRef = useRef(targetThreshold);
  const minRef = useRef(minPods);
  const maxRef = useRef(maxPods);
  const delayRef = useRef(scaleUpDelay);
  const coolDownRef = useRef(coolDown);
  const metricRef = useRef(scaleMetric);

  useEffect(() => { trafficRef.current = traffic; }, [traffic]);
  useEffect(() => { targetRef.current = targetThreshold; }, [targetThreshold]);
  useEffect(() => { minRef.current = minPods; }, [minPods]);
  useEffect(() => { maxRef.current = maxPods; }, [maxPods]);
  useEffect(() => { delayRef.current = scaleUpDelay; }, [scaleUpDelay]);
  useEffect(() => { coolDownRef.current = coolDown; }, [coolDown]);
  useEffect(() => { metricRef.current = scaleMetric; }, [scaleMetric]);

  /* Simulation mutable state */
  const simRef = useRef({
    time: 0,
    pods: initPods(minPods),
    metrics: [] as MetricPoint[],
    pendingScale: null as { targetPods: number; readyAt: number } | null,
    lastScaleTime: -Infinity,
  });

  /* Sync pods when minPods changes at rest */
  useEffect(() => {
    if (time === 0 && !running) {
      const newPods = initPods(minPods);
      simRef.current.pods = newPods;
      setPods(newPods);
    }
  }, [minPods, time, running]);

  /* Timer */
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const T = trafficRef.current;
      const thresh = targetRef.current;
      const minP = minRef.current;
      const maxP = maxRef.current;
      const delay = delayRef.current;
      const cool = coolDownRef.current;

      const s = simRef.current;
      s.time += 1;
      const t = s.time;

      // Process state transitions (pending -> running, terminating -> remove)
      let nextPods = s.pods
        .map((p) => {
          if (p.status === "pending") {
            const timer = (p.pendingTimer ?? 2) - 1;
            if (timer <= 0) return { ...p, status: "running" as PodStatus, pendingTimer: 0 };
            return { ...p, pendingTimer: timer };
          }
          if (p.status === "terminating") {
            const timer = (p.terminatingTimer ?? 2) - 1;
            if (timer <= 0) return null as any;
            return { ...p, terminatingTimer: timer };
          }
          return p;
        })
        .filter(Boolean) as Pod[];

      // Compute CPU & errors
      const runningPods = nextPods.filter((p) => p.status === "running" || p.status === "overloaded");
      const rawCpu = T / Math.max(runningPods.length, 1) / 10;
      const displayCpu = Math.min(100, rawCpu);
      const overloaded = rawCpu > 100;
      const errorRate = overloaded ? Math.min(100, (rawCpu - 100) * 2) : 0;
      const successRate = 100 - errorRate;

      nextPods = nextPods.map((p) => {
        if (p.status === "running" || p.status === "overloaded") {
          return { ...p, cpu: displayCpu, status: overloaded ? "overloaded" : "running" };
        }
        return p;
      });

      // Desired pod count
      let desired = Math.max(minP, Math.min(maxP, Math.ceil(T / (thresh * 10))));
      if (metricRef.current === "queue") {
        desired = Math.max(minP, Math.min(maxP, Math.ceil(T / (thresh * 5))));
      }

      const activePods = nextPods.filter((p) => p.status !== "terminating").length;

      // Pending scale logic
      if (!s.pendingScale && desired > activePods) {
        s.pendingScale = { targetPods: desired, readyAt: t + delay };
      } else if (s.pendingScale && t >= s.pendingScale.readyAt && desired >= s.pendingScale.targetPods) {
        const toAdd = s.pendingScale.targetPods - activePods;
        for (let i = 0; i < toAdd; i++) {
          nextPods.push({
            id: `pod-${t}-${i}`,
            status: "pending",
            cpu: 0,
            pendingTimer: 2,
          });
        }
        s.lastScaleTime = t;
        s.pendingScale = null;
      } else if (s.pendingScale && desired < activePods) {
        s.pendingScale = null;
      }

      // Scale down
      if (desired < activePods && t - s.lastScaleTime > cool) {
        const idx = nextPods.findIndex((p) => p.status !== "terminating");
        if (idx !== -1) {
          nextPods[idx] = { ...nextPods[idx], status: "terminating", terminatingTimer: 2 };
          s.lastScaleTime = t;
        }
      }

      s.pods = nextPods;
      s.metrics.push({
        time: t,
        traffic: T,
        podCount: activePods,
        avgCpu: Number(displayCpu.toFixed(1)),
        errorRate: Number(errorRate.toFixed(1)),
        successRate: Number(successRate.toFixed(1)),
      });

      // Push to React
      setTime(t);
      setPods([...nextPods]);
      setMetrics([...s.metrics]);
      setPendingScale(s.pendingScale ? { ...s.pendingScale } : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  /* Reset */
  const reset = useCallback(() => {
    setRunning(false);
    const newPods = initPods(minPods);
    simRef.current = {
      time: 0,
      pods: newPods,
      metrics: [],
      pendingScale: null,
      lastScaleTime: -Infinity,
    };
    setTime(0);
    setPods(newPods);
    setMetrics([]);
    setPendingScale(null);
  }, [minPods]);

  /* Scenarios */
  const applyScenario = (scenario: string) => {
    switch (scenario) {
      case "morning":
        setTraffic(6000);
        setTargetThreshold(70);
        setScaleUpDelay(5);
        setCoolDown(10);
        break;
      case "viral":
        setTraffic(9500);
        setTargetThreshold(60);
        setScaleUpDelay(10);
        setCoolDown(15);
        break;
      case "gradual":
        setTraffic(4000);
        setTargetThreshold(75);
        setScaleUpDelay(3);
        setCoolDown(5);
        break;
      case "drop":
        setTraffic(500);
        setTargetThreshold(70);
        setScaleUpDelay(5);
        setCoolDown(10);
        break;
    }
  };

  const activePodCount = pods.filter((p) => p.status !== "terminating").length;
  const costPerHour = activePodCount * 0.05;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-base px-3 py-1">
            Pods: {activePodCount}
          </Badge>
          <Badge variant="outline" className="text-base px-3 py-1">
            Cost: ${costPerHour.toFixed(2)}/hr
          </Badge>
          {pendingScale && (
            <Badge variant="secondary" className="text-xs">
              Scaling to {pendingScale.targetPods} pods in {pendingScale.readyAt - time}s
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
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

      {/* Educational overlay */}
      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          HPA takes 30-60s to react. For predictable spikes, use schedule-based or predictive scaling. High scale-up
          delay can cause overload during sudden traffic spikes.
        </p>
      </div>

      {/* Scenarios */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => applyScenario("morning")}>
          <TrendingUp className="h-4 w-4 mr-1" />
          Morning Spike
        </Button>
        <Button variant="secondary" size="sm" onClick={() => applyScenario("viral")}>
          <TrendingUp className="h-4 w-4 mr-1" />
          Viral Event
        </Button>
        <Button variant="secondary" size="sm" onClick={() => applyScenario("gradual")}>
          <TrendingUp className="h-4 w-4 mr-1" />
          Gradual Growth
        </Button>
        <Button variant="secondary" size="sm" onClick={() => applyScenario("drop")}>
          <TrendingUp className="h-4 w-4 mr-1" />
          Sudden Drop
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Simulation Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Traffic Load */}
              <div className="space-y-2">
                <Label className="text-xs">Traffic Load: {traffic.toLocaleString()} req/s</Label>
                <Slider value={[traffic]} min={0} max={10000} step={100} onValueChange={(v: number[]) => setTraffic(v[0])} />
              </div>

              {/* Scale Metric */}
              <div className="space-y-2">
                <Label className="text-xs">Scale Metric</Label>
                <Select value={scaleMetric} onValueChange={(v) => setScaleMetric(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpu">CPU Utilization</SelectItem>
                    <SelectItem value="requests">Request Count</SelectItem>
                    <SelectItem value="queue">Queue Depth</SelectItem>
                    <SelectItem value="custom">Custom Metric</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Threshold */}
              <div className="space-y-2">
                <Label className="text-xs">Target Threshold: {targetThreshold}%</Label>
                <Slider value={[targetThreshold]} min={10} max={95} step={5} onValueChange={(v: number[]) => setTargetThreshold(v[0])} />
              </div>

              {/* Min / Max Pods */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Min Pods</Label>
                  <Input
                    type="number"
                    min={1}
                    max={maxPods}
                    value={minPods}
                    onChange={(e) => setMinPods(clamp(Number(e.target.value), 1, maxPods))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Pods</Label>
                  <Input
                    type="number"
                    min={minPods}
                    max={50}
                    value={maxPods}
                    onChange={(e) => setMaxPods(clamp(Number(e.target.value), minPods, 50))}
                  />
                </div>
              </div>

              {/* Scale-up Delay */}
              <div className="space-y-2">
                <Label className="text-xs">Scale-up Delay: {scaleUpDelay}s</Label>
                <Slider value={[scaleUpDelay]} min={0} max={30} step={1} onValueChange={(v: number[]) => setScaleUpDelay(v[0])} />
              </div>

              {/* Cool-down */}
              <div className="space-y-2">
                <Label className="text-xs">Cool-down: {coolDown}s</Label>
                <Slider value={[coolDown]} min={0} max={60} step={5} onValueChange={(v: number[]) => setCoolDown(v[0])} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pod Grid & Charts */}
        <div className="space-y-4 lg:col-span-2">
          {/* Pod Grid */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Pod Grid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                <AnimatePresence>
                  {pods.map((pod) => (
                    <motion.div
                      key={pod.id}
                      layout
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, x: -20 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className={`relative rounded-md border p-3 flex flex-col items-center justify-center gap-1 ${statusBg(pod.status)}`}
                    >
                      <div className="text-[10px] font-mono text-white/90 truncate max-w-full">{pod.id}</div>
                      <Cpu className="h-4 w-4 text-white" />
                      <div className="text-[10px] text-white font-medium">{Math.round(pod.cpu)}%</div>
                      {/* CPU gauge bar */}
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${cpuBarColor(pod.cpu)}`}
                          animate={{ width: `${pod.cpu}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      {pod.status === "overloaded" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-1 -right-1">
                          <AlertCircle className="h-3 w-3 text-red-200 fill-red-600" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Traffic, Pods & CPU</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                      <ReTooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="traffic"
                        name="Traffic"
                        stroke="#3b82f6"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="podCount"
                        name="Pod Count"
                        stroke="#22c55e"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgCpu"
                        name="Avg CPU %"
                        stroke="#ef4444"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Request Success vs Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <ReTooltip />
                      <Legend />
                      <Bar dataKey="successRate" name="Success %" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="errorRate" name="Error %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusBg(status: PodStatus) {
  switch (status) {
    case "running":
      return "bg-emerald-600";
    case "pending":
      return "bg-blue-500";
    case "terminating":
      return "bg-gray-500";
    case "overloaded":
      return "bg-red-600";
  }
}

function cpuBarColor(cpu: number) {
  if (cpu <= 50) return "bg-green-300";
  if (cpu <= 80) return "bg-yellow-300";
  return "bg-red-300";
}
