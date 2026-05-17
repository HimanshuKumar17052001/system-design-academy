"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Gauge,
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Droplets,
  Zap,
  Activity,
  AlertTriangle,
} from "lucide-react";

type Algorithm = "token-bucket" | "leaky-bucket" | "sliding-window" | "fixed-window";

interface RequestEvent {
  id: number;
  time: string;
  accepted: boolean;
  reason?: string;
}

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface TimePoint {
  second: number;
  accepted: number;
  rejected: number;
  tokens?: number;
  queueLength?: number;
  windowCount?: number;
}

export default function RateLimiterLab() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("token-bucket");
  const [rate, setRate] = useState(10); // requests per second
  const [burstCapacity, setBurstCapacity] = useState(5); // bucket size / burst
  const [timeWindow, setTimeWindow] = useState(10); // seconds

  // Algorithm state
  const [tokens, setTokens] = useState(5);
  const [queue, setQueue] = useState<number[]>([]);
  const [windowRequests, setWindowRequests] = useState<number[]>([]);
  const [fixedWindowCount, setFixedWindowCount] = useState(0);
  const [currentWindowStart, setCurrentWindowStart] = useState(Date.now());

  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimePoint[]>([]);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [trafficMode, setTrafficMode] = useState<"steady" | "burst" | "mixed" | null>(null);
  const [requestCounter, setRequestCounter] = useState(0);

  const logIdRef = useRef(0);
  const eventIdRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulationStartRef = useRef<number>(Date.now());

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    logIdRef.current += 1;
    setLogs((prev) => [...prev, { id: logIdRef.current, time, message, type }]);
  }, []);

  // Token refill for token bucket
  useEffect(() => {
    if (algorithm !== "token-bucket") return;
    const interval = setInterval(() => {
      setTokens((prev) => Math.min(burstCapacity, prev + rate / 10)); // refill every 100ms
    }, 100);
    return () => clearInterval(interval);
  }, [algorithm, rate, burstCapacity]);

  // Leaky bucket drain
  useEffect(() => {
    if (algorithm !== "leaky-bucket") return;
    const interval = setInterval(() => {
      setQueue((prev) => {
        const drainRate = rate / 10; // drain every 100ms
        const newQueue = [...prev];
        for (let i = 0; i < drainRate && newQueue.length > 0; i++) {
          newQueue.shift();
        }
        return newQueue;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [algorithm, rate]);

  // Sliding window cleanup
  useEffect(() => {
    if (algorithm !== "sliding-window") return;
    const interval = setInterval(() => {
      const now = Date.now();
      setWindowRequests((prev) => prev.filter((t) => now - t < timeWindow * 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [algorithm, timeWindow]);

  // Fixed window reset
  useEffect(() => {
    if (algorithm !== "fixed-window") return;
    const interval = setInterval(() => {
      const now = Date.now();
      const windowMs = timeWindow * 1000;
      setCurrentWindowStart((prev) => {
        if (now - prev >= windowMs) {
          setFixedWindowCount(0);
          return now;
        }
        return prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [algorithm, timeWindow]);

  // Time series recording
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSeries((prev) => {
        const now = Date.now();
        const second = Math.floor((now - simulationStartRef.current) / 1000);
        const last = prev[prev.length - 1];
        if (last && last.second === second) {
          // Update current second
          const next = [...prev];
          next[next.length - 1] = {
            ...last,
            tokens: algorithm === "token-bucket" ? tokens : undefined,
            queueLength: algorithm === "leaky-bucket" ? queue.length : undefined,
            windowCount: algorithm === "fixed-window" ? fixedWindowCount : undefined,
          };
          return next;
        }
        return [
          ...prev,
          {
            second,
            accepted: acceptedCount,
            rejected: rejectedCount,
            tokens: algorithm === "token-bucket" ? tokens : undefined,
            queueLength: algorithm === "leaky-bucket" ? queue.length : undefined,
            windowCount: algorithm === "fixed-window" ? fixedWindowCount : undefined,
          },
        ];
      });
    }, 200);
    return () => clearInterval(interval);
  }, [algorithm, tokens, queue.length, fixedWindowCount, acceptedCount, rejectedCount]);

  const processRequest = useCallback(() => {
    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString();
    eventIdRef.current += 1;
    const reqId = eventIdRef.current;

    let accepted = false;
    let reason = "";

    switch (algorithm) {
      case "token-bucket": {
        setTokens((prev) => {
          if (prev >= 1) {
            accepted = true;
            reason = `tokens: ${Math.floor(prev - 1)}`;
            return prev - 1;
          } else {
            accepted = false;
            reason = "tokens: 0";
            return prev;
          }
        });
        break;
      }

      case "leaky-bucket": {
        setQueue((prev) => {
          if (prev.length < burstCapacity) {
            accepted = true;
            reason = `queue: ${prev.length + 1}/${burstCapacity}`;
            return [...prev, now];
          } else {
            accepted = false;
            reason = `queue full: ${prev.length}/${burstCapacity}`;
            return prev;
          }
        });
        break;
      }

      case "sliding-window": {
        setWindowRequests((prev) => {
          const windowStart = now - timeWindow * 1000;
          const inWindow = prev.filter((t) => t > windowStart);
          if (inWindow.length < rate * timeWindow) {
            accepted = true;
            reason = `window: ${inWindow.length + 1}/${rate * timeWindow}`;
            return [...inWindow, now];
          } else {
            accepted = false;
            reason = `window full: ${inWindow.length}/${rate * timeWindow}`;
            return inWindow;
          }
        });
        break;
      }

      case "fixed-window": {
        setFixedWindowCount((prev) => {
          if (prev < rate * timeWindow) {
            accepted = true;
            reason = `count: ${prev + 1}/${rate * timeWindow}`;
            return prev + 1;
          } else {
            accepted = false;
            reason = `count: ${prev}/${rate * timeWindow}`;
            return prev;
          }
        });
        break;
      }
    }

    // Use setTimeout to read the state after React updates
    setTimeout(() => {
      setRequestCounter((prev) => prev + 1);
      if (accepted) {
        setAcceptedCount((prev) => prev + 1);
        addLog(`Request #${reqId} ACCEPTED (${reason})`, "success");
      } else {
        setRejectedCount((prev) => prev + 1);
        addLog(`Request #${reqId} REJECTED 429 (${reason})`, "error");
      }
      setEvents((prev) => [
        ...prev,
        { id: reqId, time: timeStr, accepted, reason },
      ]);
    }, 0);
  }, [algorithm, rate, burstCapacity, timeWindow, addLog]);

  const startTraffic = useCallback(
    (mode: "steady" | "burst" | "mixed") => {
      setTrafficMode(mode);
      setIsRunning(true);
      simulationStartRef.current = Date.now();

      if (intervalRef.current) clearInterval(intervalRef.current);

      const sendRequest = () => {
        processRequest();
      };

      if (mode === "steady") {
        const intervalMs = Math.max(50, 1000 / rate);
        intervalRef.current = setInterval(sendRequest, intervalMs);
      } else if (mode === "burst") {
        // Send 10x rate for 2 seconds, then pause
        const burstInterval = setInterval(() => {
          for (let i = 0; i < Math.min(10, rate); i++) {
            setTimeout(() => processRequest(), i * 20);
          }
        }, 200);
        intervalRef.current = burstInterval;
        setTimeout(() => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          setTrafficMode(null);
          addLog("Burst traffic complete (2 seconds)", "info");
        }, 2000);
      } else if (mode === "mixed") {
        let isBurst = false;
        intervalRef.current = setInterval(() => {
          if (isBurst) {
            for (let i = 0; i < Math.min(5, rate); i++) {
              setTimeout(() => processRequest(), i * 30);
            }
          } else {
            processRequest();
          }
          isBurst = !isBurst;
        }, 500);
      }
    },
    [rate, processRequest, addLog]
  );

  const stopTraffic = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setTrafficMode(null);
    addLog("Traffic stopped", "info");
  }, [addLog]);

  const handleReset = useCallback(() => {
    stopTraffic();
    setTokens(burstCapacity);
    setQueue([]);
    setWindowRequests([]);
    setFixedWindowCount(0);
    setCurrentWindowStart(Date.now());
    setEvents([]);
    setLogs([]);
    setTimeSeries([]);
    setAcceptedCount(0);
    setRejectedCount(0);
    setRequestCounter(0);
    eventIdRef.current = 0;
    logIdRef.current = 0;
    addLog("Rate limiter reset.", "info");
  }, [burstCapacity, stopTraffic, addLog]);

  const chartData = timeSeries.slice(-30); // last 30 data points

  const getAlgorithmVisual = () => {
    switch (algorithm) {
      case "token-bucket":
        return <TokenBucketVisual tokens={tokens} capacity={burstCapacity} />;
      case "leaky-bucket":
        return <LeakyBucketVisual queue={queue} capacity={burstCapacity} />;
      case "sliding-window":
        return <SlidingWindowVisual requests={windowRequests} windowMs={timeWindow * 1000} />;
      case "fixed-window":
        return <FixedWindowVisual count={fixedWindowCount} limit={rate * timeWindow} windowStart={currentWindowStart} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Algorithm Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Rate Limiter Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Algorithm</label>
              <Select
                value={algorithm}
                onValueChange={(value) => {
                  const newAlgo = value as Algorithm;
                  setAlgorithm(newAlgo);
                  handleReset();
                  addLog(`Algorithm switched to ${newAlgo.replace("-", " ")}`, "info");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="token-bucket">Token Bucket</SelectItem>
                  <SelectItem value="leaky-bucket">Leaky Bucket</SelectItem>
                  <SelectItem value="sliding-window">Sliding Window</SelectItem>
                  <SelectItem value="fixed-window">Fixed Window</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Rate: {rate} req/s
              </label>
              <Slider
                defaultValue={[rate]}
                min={1}
                max={100}
                step={1}
                onValueChange={(v: number[]) => setRate(v[0])}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {algorithm === "leaky-bucket" ? "Queue Size" : "Burst Capacity / Bucket Size"}: {burstCapacity}
              </label>
              <Slider
                defaultValue={[burstCapacity]}
                min={1}
                max={100}
                step={1}
                onValueChange={(v: number[]) => setBurstCapacity(v[0])}
              />
            </div>

            {(algorithm === "sliding-window" || algorithm === "fixed-window") && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Time Window: {timeWindow}s
                </label>
                <Slider
                  defaultValue={[timeWindow]}
                  min={1}
                  max={60}
                  step={1}
                  onValueChange={(v: number[]) => setTimeWindow(v[0])}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Traffic Generator */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => startTraffic("steady")}
          disabled={isRunning}
          variant={trafficMode === "steady" ? "default" : "outline"}
        >
          <Activity className="h-4 w-4 mr-1" />
          Steady Traffic
        </Button>
        <Button
          size="sm"
          onClick={() => startTraffic("burst")}
          disabled={isRunning}
          variant={trafficMode === "burst" ? "default" : "outline"}
        >
          <Zap className="h-4 w-4 mr-1" />
          Burst Traffic
        </Button>
        <Button
          size="sm"
          onClick={() => startTraffic("mixed")}
          disabled={isRunning}
          variant={trafficMode === "mixed" ? "default" : "outline"}
        >
          <Droplets className="h-4 w-4 mr-1" />
          Mixed Traffic
        </Button>
        <Button size="sm" variant="secondary" onClick={stopTraffic} disabled={!isRunning}>
          <Pause className="h-4 w-4 mr-1" />
          Stop
        </Button>
        <Button size="sm" variant="ghost" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Accepted / Rejected Counters */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          className="rounded-xl border bg-emerald-50 dark:bg-emerald-900/20 p-4 flex items-center justify-between"
          animate={{ scale: acceptedCount > 0 ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="font-medium">Accepted</span>
          </div>
          <span className="text-2xl font-bold text-emerald-700">{acceptedCount}</span>
        </motion.div>
        <motion.div
          className="rounded-xl border bg-red-50 dark:bg-red-900/20 p-4 flex items-center justify-between"
          animate={{ scale: rejectedCount > 0 ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium">Rejected (429)</span>
          </div>
          <span className="text-2xl font-bold text-red-700">{rejectedCount}</span>
        </motion.div>
      </div>

      {/* Visual Representation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Algorithm Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          {getAlgorithmVisual()}
        </CardContent>
      </Card>

      {/* Metrics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Accepted vs Rejected Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="second" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accepted"
                    name="Accepted"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    name="Rejected"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {algorithm === "token-bucket" && "Bucket Tokens"}
              {algorithm === "leaky-bucket" && "Queue Length"}
              {algorithm === "sliding-window" && "Window Requests"}
              {algorithm === "fixed-window" && "Window Count"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="second" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip />
                  <Bar
                    dataKey={
                      algorithm === "token-bucket"
                        ? "tokens"
                        : algorithm === "leaky-bucket"
                          ? "queueLength"
                          : "windowCount"
                    }
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name={
                      algorithm === "token-bucket"
                        ? "Tokens"
                        : algorithm === "leaky-bucket"
                          ? "Queue"
                          : "Count"
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                No events yet. Start traffic to observe rate limiting behavior.
              </p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {logs.slice(-50).map((log) => (
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
                      {log.type === "error" && (
                        <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      {log.type === "warning" && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      {log.type === "info" && (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          log.type === "error"
                            ? "text-red-700"
                            : log.type === "warning"
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

function TokenBucketVisual({ tokens, capacity }: { tokens: number; capacity: number }) {
  const dotCount = Math.min(capacity, 20);
  const filledDots = Math.min(Math.max(0, Math.floor(tokens)), dotCount);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-sm font-medium">Token Bucket</div>
      <div className="relative w-32 h-40 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col-reverse items-center justify-start gap-1 p-2">
        <AnimatePresence>
          {Array.from({ length: dotCount }).map((_, i) => {
            const isFilled = i < filledDots;
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  scale: isFilled ? 1 : 0.6,
                  opacity: isFilled ? 1 : 0.2,
                  backgroundColor: isFilled ? "#3b82f6" : "#e5e7eb",
                }}
                transition={{ duration: 0.2 }}
                className="w-6 h-6 rounded-full"
              />
            );
          })}
        </AnimatePresence>
      </div>
      <div className="text-sm font-mono">
        Tokens: {Math.floor(tokens)} / {capacity}
      </div>
    </div>
  );
}

function LeakyBucketVisual({ queue, capacity }: { queue: number[]; capacity: number }) {
  const displayCapacity = Math.min(capacity, 20);
  const filled = Math.min(queue.length, displayCapacity);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-sm font-medium">Leaky Bucket (Queue)</div>
      <div className="relative w-40 h-12 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center gap-1 p-2 overflow-hidden">
        <AnimatePresence>
          {Array.from({ length: displayCapacity }).map((_, i) => {
            const isFilled = i < filled;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isFilled ? 1 : 0.2,
                  x: 0,
                  backgroundColor: isFilled ? "#8b5cf6" : "#e5e7eb",
                }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="w-4 h-8 rounded"
              />
            );
          })}
        </AnimatePresence>
      </div>
      <div className="text-sm font-mono">
        Queue: {queue.length} / {capacity}
      </div>
      <div className="text-xs text-muted-foreground">Draining at fixed rate</div>
    </div>
  );
}

function SlidingWindowVisual({ requests, windowMs }: { requests: number[]; windowMs: number }) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const inWindow = requests.filter((t) => t > windowStart);
  const maxMarkers = 30;
  const recent = inWindow.slice(-maxMarkers);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-sm font-medium">Sliding Window</div>
      <div className="relative w-full max-w-md h-16 bg-muted/30 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center px-4">
          {/* Timeline */}
          <div className="w-full h-1 bg-border relative">
            {/* Window */}
            <motion.div
              className="absolute top-0 h-full bg-blue-200 dark:bg-blue-900/40 rounded"
              style={{ width: "60%", left: "40%" }}
            />
            {/* Request marks */}
            {recent.map((t, i) => {
              const position = ((t - windowStart) / windowMs) * 100;
              return (
                <motion.div
                  key={`${t}-${i}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500"
                  style={{ left: `${Math.min(98, Math.max(2, position))}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="text-sm font-mono">Requests in window: {inWindow.length}</div>
      <div className="text-xs text-muted-foreground">Window slides forward continuously</div>
    </div>
  );
}

function FixedWindowVisual({
  count,
  limit,
  windowStart,
}: {
  count: number;
  limit: number;
  windowStart: number;
}) {
  const progress = Math.min(100, (count / limit) * 100);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-sm font-medium">Fixed Window Counter</div>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-mono">{count} / {limit}</span>
          <span className="text-xs text-muted-foreground">
            Window started: {new Date(windowStart).toLocaleTimeString()}
          </span>
        </div>
        <div className="h-6 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-blue-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {count >= limit && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 flex items-center gap-1"
          >
            <AlertTriangle className="h-4 w-4" />
            Window limit reached! Requests will be rejected until window resets.
          </motion.div>
        )}
      </div>
    </div>
  );
}
