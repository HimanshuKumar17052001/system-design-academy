"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import {
  Server,
  Heart,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Trophy,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ServerState = {
  version: "old" | "new";
  healthy: boolean;
};

type TimePoint = {
  time: number;
  oldUsers: number;
  newUsers: number;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateId() {
  return Math.random().toString(36).slice(2);
}

/* ------------------------------------------------------------------ */
/*  Rolling Deployment                                                 */
/* ------------------------------------------------------------------ */

function RollingDeployment() {
  const [servers, setServers] = useState<ServerState[]>(
    Array.from({ length: 10 }, () => ({ version: "old", healthy: true }))
  );
  const [rollingIndex, setRollingIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [chartData, setChartData] = useState<TimePoint[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeRef = useRef(0);

  const startDeployment = useCallback(() => {
    if (rollingIndex >= 10) {
      // reset first
      setServers(Array.from({ length: 10 }, () => ({ version: "old", healthy: true })));
      setRollingIndex(0);
      setChartData([]);
      timeRef.current = 0;
    }
    setIsRolling(true);
    setIsPaused(false);
  }, [rollingIndex]);

  const pause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const rollback = useCallback(() => {
    setIsRolling(false);
    setIsPaused(false);
    setServers(Array.from({ length: 10 }, () => ({ version: "old", healthy: true })));
    setRollingIndex(0);
    setChartData([]);
    timeRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isRolling || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setRollingIndex((prev) => {
        const next = prev + 1;
        if (next > 10) {
          setIsRolling(false);
          return prev;
        }
        // update server at index prev (0-based)
        setServers((srvs) => {
          const copy = [...srvs];
          copy[prev] = { version: "new", healthy: false };
          // health check after short delay
          setTimeout(() => {
            setServers((s2) => {
              const c2 = [...s2];
              if (c2[prev]) c2[prev] = { version: "new", healthy: true };
              return c2;
            });
          }, 400);
          return copy;
        });
        return next;
      });
      timeRef.current += 1;
      setChartData((data) => {
        const t = timeRef.current;
        const idx = Math.min(timeRef.current, 10); // approximate current deployment count
        return [...data, { time: t, oldUsers: (10 - idx) * 100, newUsers: idx * 100 }];
      });
    }, 800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRolling, isPaused]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={startDeployment} disabled={isRolling && !isPaused}>
          <Play className="h-4 w-4 mr-1" />
          Start Deployment
        </Button>
        <Button variant="outline" onClick={pause} disabled={!isRolling}>
          <Pause className="h-4 w-4 mr-1" />
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button variant="destructive" onClick={rollback}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Rollback
        </Button>
        <Badge variant={isRolling ? "default" : "secondary"}>
          {isRolling ? (isPaused ? "Paused" : "Deploying…") : "Idle"}
        </Badge>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {servers.map((s, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: s.version === "old" ? "#3b82f6" : "#22c55e",
            }}
            transition={{ duration: 0.4 }}
            className="relative rounded-lg border p-4 flex flex-col items-center justify-center gap-2"
          >
            <Server className="h-6 w-6 text-white" />
            <span className="text-xs text-white font-medium">S-{i + 1}</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              <Heart
                className={`h-4 w-4 ${
                  s.healthy ? "text-green-200 fill-green-200" : "text-red-300 fill-red-500"
                }`}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Active Users per Version</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <ReTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="oldUsers"
                  name="Old Version"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  name="New Version"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Blue-Green Deployment                                              */
/* ------------------------------------------------------------------ */

function BlueGreenDeployment() {
  const [greenDeployed, setGreenDeployed] = useState(false);
  const [greenHealthy, setGreenHealthy] = useState(false);
  const [trafficOnGreen, setTrafficOnGreen] = useState(false);
  const [checking, setChecking] = useState(false);

  const blueServers = Array.from({ length: 10 }, (_, i) => ({ id: `b-${i}`, color: "blue" as const }));
  const greenServers = Array.from({ length: 10 }, (_, i) => ({ id: `g-${i}`, color: "green" as const }));

  const deployToGreen = () => {
    setGreenDeployed(true);
    setGreenHealthy(false);
  };

  const healthCheck = () => {
    if (!greenDeployed) return;
    setChecking(true);
    setTimeout(() => {
      setGreenHealthy(true);
      setChecking(false);
    }, 1500);
  };

  const switchTraffic = () => setTrafficOnGreen(true);
  const rollback = () => setTrafficOnGreen(false);

  const trafficData = [
    { name: "Blue", traffic: trafficOnGreen ? 0 : 100 },
    { name: "Green", traffic: trafficOnGreen ? 100 : 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={deployToGreen} disabled={greenDeployed}>
          <Play className="h-4 w-4 mr-1" />
          Deploy to Green
        </Button>
        <Button variant="outline" onClick={healthCheck} disabled={!greenDeployed || checking}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Health Check
        </Button>
        <Button variant="default" onClick={switchTraffic} disabled={!greenHealthy || trafficOnGreen}>
          <ArrowRight className="h-4 w-4 mr-1" />
          Switch Traffic
        </Button>
        <Button variant="destructive" onClick={rollback} disabled={!trafficOnGreen}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Rollback
        </Button>
      </div>

      <div className="relative grid grid-cols-2 gap-8 items-center">
        {/* Blue Environment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500 text-white">Blue (Current)</Badge>
            <span className="text-sm text-muted-foreground">{trafficOnGreen ? "0% traffic" : "100% traffic"}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {blueServers.map((s) => (
              <div key={s.id} className="rounded-md bg-blue-500 p-3 flex items-center justify-center">
                <Server className="h-5 w-5 text-white" />
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Arrow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <motion.div
            animate={{ x: trafficOnGreen ? 40 : -40 }}
            transition={{ type: "spring", stiffness: 60, damping: 12 }}
          >
            <ArrowRight
              className={`h-10 w-10 ${trafficOnGreen ? "text-green-500" : "text-blue-500"}`}
            />
          </motion.div>
        </div>

        {/* Green Environment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600 text-white">Green (New)</Badge>
            <span className="text-sm text-muted-foreground">
              {greenDeployed ? (greenHealthy ? "Healthy" : checking ? "Checking…" : "Deployed") : "Not deployed"}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {greenServers.map((s) => (
              <motion.div
                key={s.id}
                initial={false}
                animate={{
                  backgroundColor: greenDeployed ? "#22c55e" : "#9ca3af",
                }}
                className="rounded-md p-3 flex items-center justify-center"
              >
                <Server className="h-5 w-5 text-white" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Traffic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <ReTooltip />
                <Bar dataKey="traffic" name="Traffic %" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Canary Deployment                                                  */
/* ------------------------------------------------------------------ */

function CanaryDeployment() {
  const total = 20;
  const canaryCount = 2;
  const blueCount = total - canaryCount;

  const [deployed, setDeployed] = useState(false);
  const [trafficPercent, setTrafficPercent] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [alert, setAlert] = useState(false);
  const [chartData, setChartData] = useState<{ time: number; blueErr: number; greenErr: number }[]>([]);
  const timeRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const blueServers = Array.from({ length: blueCount }, (_, i) => ({ id: `c-b-${i}`, type: "blue" as const }));
  const greenServers = Array.from({ length: canaryCount }, (_, i) => ({ id: `c-g-${i}`, type: "green" as const }));

  // simulated metrics
  const baseBlueError = 0.2;
  const baseGreenError = deployed ? 7.5 : 0;

  const startCanary = () => {
    setDeployed(true);
    setTrafficPercent(10);
    setAlert(false);
    setChartData([]);
    timeRef.current = 0;
  };

  const rollback = () => {
    setDeployed(false);
    setTrafficPercent(0);
    setAlert(false);
    setChartData([]);
    timeRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (!deployed) return;
    timerRef.current = setInterval(() => {
      timeRef.current += 1;
      const t = timeRef.current;
      setChartData((prev) => [
        ...prev,
        {
          time: t,
          blueErr: baseBlueError + Math.random() * 0.2,
          greenErr: baseGreenError + Math.random() * 1.5,
        },
      ]);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deployed, baseGreenError]);

  useEffect(() => {
    if (!deployed) return;
    if (baseGreenError > threshold && trafficPercent > 0) {
      const id = setTimeout(() => {
        setAlert(true);
        setTrafficPercent(0);
        setDeployed(false);
      }, 2000);
      return () => clearTimeout(id);
    }
  }, [baseGreenError, threshold, trafficPercent, deployed]);

  const latencyBlue = 45;
  const latencyGreen = deployed ? 180 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={startCanary} disabled={deployed}>
          <Play className="h-4 w-4 mr-1" />
          Start Canary
        </Button>
        <Button variant="destructive" onClick={rollback}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Rollback
        </Button>
      </div>

      {alert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 flex items-center gap-2 text-red-700 dark:text-red-300"
        >
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-medium">
            Auto-rollback triggered: Canary error rate exceeded threshold ({threshold}%)
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500 text-white">Main Pool</Badge>
            <span className="text-xs text-muted-foreground">{100 - trafficPercent}% traffic</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {blueServers.map((s) => (
              <div key={s.id} className="rounded-md bg-blue-500 p-2 flex items-center justify-center">
                <Server className="h-4 w-4 text-white" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600 text-white">Canary Pool</Badge>
            <span className="text-xs text-muted-foreground">{trafficPercent}% traffic</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {greenServers.map((s) => (
              <motion.div
                key={s.id}
                animate={{ backgroundColor: deployed ? "#22c55e" : "#9ca3af" }}
                className="rounded-md p-2 flex items-center justify-center"
              >
                <Server className="h-4 w-4 text-white" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Promote Traffic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider
              value={[trafficPercent]}
              min={0}
              max={100}
              step={10}
              onValueChange={(v: number[]) => !alert && setTrafficPercent(v[0])}
              disabled={!deployed || alert}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-semibold text-foreground">{trafficPercent}%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Rate Threshold</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider
              value={[threshold]}
              min={1}
              max={20}
              step={1}
              onValueChange={(v: number[]) => setThreshold(v[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span className="font-semibold text-foreground">{threshold}%</span>
              <span>20%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Metric Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Blue Error Rate</span>
                <Badge variant="outline">{baseBlueError.toFixed(2)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Canary Error Rate</span>
                <Badge variant="destructive">{baseGreenError.toFixed(2)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Blue Latency</span>
                <Badge variant="outline">{latencyBlue} ms</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Canary Latency</span>
                <Badge variant="destructive">{latencyGreen > 0 ? `${latencyGreen} ms` : "—"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ReTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="blueErr" name="Blue" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="greenErr" name="Canary" stroke="#22c55e" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  A/B Test Deployment                                                */
/* ------------------------------------------------------------------ */

function ABTestDeployment() {
  const [trafficToB, setTrafficToB] = useState(50);
  const [winner, setWinner] = useState<"A" | "B" | null>(null);

  // Simulated fixed metrics: B is slightly better
  const conversionA = 2.8;
  const conversionB = 3.4;
  const engagementA = 45;
  const engagementB = 52;

  const blendedConversion = (conversionA * (100 - trafficToB) + conversionB * trafficToB) / 100;
  const blendedEngagement = (engagementA * (100 - trafficToB) + engagementB * trafficToB) / 100;

  const declareWinner = () => {
    setWinner(conversionB > conversionA ? "B" : "A");
  };

  const aServers = Array.from({ length: 8 }, (_, i) => `a-${i}`);
  const bServers = Array.from({ length: 8 }, (_, i) => `b-${i}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={declareWinner}>
          <Trophy className="h-4 w-4 mr-1" />
          Declare Winner
        </Button>
        {winner && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Badge className="bg-amber-500 text-white">Winner: Variant {winner}</Badge>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User Segment Routing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider
              value={[trafficToB]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v: number[]) => {
                setTrafficToB(v[0]);
                setWinner(null);
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0% to B</span>
              <span className="font-semibold text-foreground">{trafficToB}% to B</span>
              <span>100% to B</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Live Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Blended Conversion</span>
                <motion.span
                  key={blendedConversion}
                  initial={{ scale: 1.2, color: "#22c55e" }}
                  animate={{ scale: 1, color: "#000" }}
                  className="text-sm font-medium"
                >
                  {blendedConversion.toFixed(2)}%
                </motion.span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Blended Engagement</span>
                <motion.span
                  key={blendedEngagement}
                  initial={{ scale: 1.2, color: "#22c55e" }}
                  animate={{ scale: 1, color: "#000" }}
                  className="text-sm font-medium"
                >
                  {blendedEngagement.toFixed(1)}s
                </motion.span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Variant A */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500 text-white">Variant A</Badge>
            <span className="text-xs text-muted-foreground">{100 - trafficToB}% traffic</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {aServers.map((id) => (
              <motion.div
                key={id}
                animate={{
                  opacity: 1 - trafficToB / 200, // subtle dimming as traffic shifts
                  borderColor: winner === "A" ? "#f59e0b" : "transparent",
                  borderWidth: winner === "A" ? 2 : 0,
                }}
                className="rounded-md bg-blue-500 p-2 flex items-center justify-center border"
              >
                <Server className="h-4 w-4 text-white" />
              </motion.div>
            ))}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversion</span>
              <span className="font-medium">{conversionA}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Engagement</span>
              <span className="font-medium">{engagementA}s</span>
            </div>
          </div>
        </div>

        {/* Variant B */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600 text-white">Variant B</Badge>
            <span className="text-xs text-muted-foreground">{trafficToB}% traffic</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {bServers.map((id) => (
              <motion.div
                key={id}
                animate={{
                  opacity: 0.5 + trafficToB / 200,
                  borderColor: winner === "B" ? "#f59e0b" : "transparent",
                  borderWidth: winner === "B" ? 2 : 0,
                }}
                className="rounded-md bg-green-600 p-2 flex items-center justify-center border"
              >
                <Server className="h-4 w-4 text-white" />
              </motion.div>
            ))}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversion</span>
              <span className="font-medium">{conversionB}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Engagement</span>
              <span className="font-medium">{engagementB}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DeploymentVisualizer() {
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Tabs defaultValue="rolling">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rolling">Rolling</TabsTrigger>
            <TabsTrigger value="blue-green">Blue-Green</TabsTrigger>
            <TabsTrigger value="canary">Canary</TabsTrigger>
            <TabsTrigger value="ab">A/B Test</TabsTrigger>
          </TabsList>
          <TabsContent value="rolling">
            <RollingDeployment />
          </TabsContent>
          <TabsContent value="blue-green">
            <BlueGreenDeployment />
          </TabsContent>
          <TabsContent value="canary">
            <CanaryDeployment />
          </TabsContent>
          <TabsContent value="ab">
            <ABTestDeployment />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
