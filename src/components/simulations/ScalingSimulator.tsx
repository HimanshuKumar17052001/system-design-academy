"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Server,
  Plus,
  Minus,
  ArrowRight,
  AlertTriangle,
  Activity,
  Users,
  Zap,
} from "lucide-react";

interface ScalingSimulatorProps {
  controls?: Record<string, number | boolean | string>;
}

export default function ScalingSimulator({ controls }: ScalingSimulatorProps) {
  const [mode, setMode] = useState<"vertical" | "horizontal">(
    (controls?.mode as "vertical" | "horizontal") ?? "vertical"
  );
  const [users, setUsers] = useState<number>(Number(controls?.users ?? 100));
  const [servers, setServers] = useState<number>(Number(controls?.servers ?? 2));

  // Derived metrics
  const maxVerticalUsers = 500;
  const cpuPercent = Math.min(100, (users / maxVerticalUsers) * 100);
  const ramPercent = Math.min(100, (users / maxVerticalUsers) * 80);
  const verticalLatency = 20 + (users / maxVerticalUsers) * 300;
  const verticalFailed = users > maxVerticalUsers ? users - maxVerticalUsers : 0;

  const usersPerServer = Math.floor(users / servers);
  const horizontalLatency = 20 + (usersPerServer / 200) * 100;
  const horizontalCapacity = servers * maxVerticalUsers;
  const horizontalFailed =
    users > horizontalCapacity ? users - horizontalCapacity : 0;

  const chartData = useMemo(() => {
    const data = [];
    for (let u = 0; u <= 1000; u += 50) {
      const vLat = 20 + (u / maxVerticalUsers) * 300;
      const hLat = 20 + (Math.floor(u / servers) / 200) * 100;
      data.push({
        users: u,
        vertical: Math.min(vLat, 500),
        horizontal: Math.min(hLat, 200),
      });
    }
    return data;
  }, [servers]);

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={mode === "vertical" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("vertical")}
        >
          <Server className="h-4 w-4 mr-1" />
          Vertical
        </Button>
        <Button
          variant={mode === "horizontal" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("horizontal")}
        >
          <Server className="h-4 w-4 mr-1" />
          Horizontal
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "vertical" ? (
          <motion.div
            key="vertical"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Single Server */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Single Server
                  </CardTitle>
                  <Badge
                    variant={cpuPercent >= 100 ? "destructive" : "default"}
                  >
                    {cpuPercent >= 100 ? "At Limit" : "Running"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CPU */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      CPU
                    </span>
                    <span className="font-mono">{Math.round(cpuPercent)}%</span>
                  </div>
                  <Progress value={cpuPercent} />
                  {cpuPercent >= 100 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-medium">Scale limit reached!</p>
                        <p className="text-xs">
                          Cannot add more users to a single server. Switch to
                          Horizontal scaling.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setMode("horizontal")}
                      >
                        Switch
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </motion.div>
                  )}
                </div>

                {/* RAM */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      RAM
                    </span>
                    <span className="font-mono">{Math.round(ramPercent)}%</span>
                  </div>
                  <Progress value={ramPercent} />
                </div>

                {/* Users Slider */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Concurrent Users: {users}
                  </Label>
                  <Slider
                    defaultValue={[users]}
                    min={0}
                    max={800}
                    step={10}
                    onValueChange={(v: number[]) => setUsers(v[0])}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="horizontal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Server Grid */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Server Pool
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setServers((s) => Math.max(1, s - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-mono w-6 text-center">{servers}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setServers((s) => Math.min(20, s + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Array.from({ length: servers }).map((_, i) => {
                    const serverUsers =
                      usersPerServer + (i < users % servers ? 1 : 0);
                    const load = Math.min(
                      100,
                      (serverUsers / maxVerticalUsers) * 100
                    );
                    const isOverloaded = load >= 100;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          "rounded-lg border p-3 flex flex-col items-center gap-2",
                          isOverloaded
                            ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                            : "border-border bg-card"
                        )}
                      >
                        <Server
                          className={cn(
                            "h-6 w-6",
                            isOverloaded
                              ? "text-red-500"
                              : "text-emerald-500"
                          )}
                        />
                        <span className="text-xs font-medium">
                          Server {i + 1}
                        </span>
                        <Badge
                          variant={isOverloaded ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {serverUsers} users
                        </Badge>
                        <div className="w-full">
                          <Progress value={load} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Users Slider */}
                <div className="mt-6 space-y-3">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Concurrent Users: {users}
                  </Label>
                  <Slider
                    defaultValue={[users]}
                    min={0}
                    max={5000}
                    step={50}
                    onValueChange={(v: number[]) => setUsers(v[0])}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Capacity"
          value={
            mode === "vertical"
              ? maxVerticalUsers.toLocaleString()
              : (servers * maxVerticalUsers).toLocaleString()
          }
          unit="users"
        />
        <MetricCard
          label="Users Served"
          value={
            mode === "vertical"
              ? Math.min(users, maxVerticalUsers).toLocaleString()
              : Math.min(users, horizontalCapacity).toLocaleString()
          }
          unit="users"
        />
        <MetricCard
          label="Avg Latency"
          value={Math.round(
            mode === "vertical" ? verticalLatency : horizontalLatency
          ).toString()}
          unit="ms"
        />
        <MetricCard
          label="Failed Requests"
          value={(
            mode === "vertical" ? verticalFailed : horizontalFailed
          ).toLocaleString()}
          unit="req/s"
          tone={
            (mode === "vertical" ? verticalFailed : horizontalFailed) > 0
              ? "danger"
              : "good"
          }
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Latency vs Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="users" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="vertical"
                  name="Vertical (1 server)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="horizontal"
                  name={`Horizontal (${servers} servers)`}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
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
  value: string;
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
        <span className="text-xs ml-1 font-normal text-muted-foreground">
          {unit}
        </span>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
