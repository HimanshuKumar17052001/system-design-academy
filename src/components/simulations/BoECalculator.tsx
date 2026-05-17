"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
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
  Calculator,
  Zap,
  Database,
  HardDrive,
  Wifi,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

interface BoECalculatorProps {
  parameters?: Record<string, number>;
}

function getTone(value: number, thresholds: [number, number]): "good" | "warning" | "danger" {
  if (value < thresholds[0]) return "good";
  if (value < thresholds[1]) return "warning";
  return "danger";
}

function ToneBadge({
  value,
  thresholds,
}: {
  value: number;
  thresholds: [number, number];
}) {
  const tone = getTone(value, thresholds);
  const icons = {
    good: <CheckCircle2 className="h-3 w-3" />,
    warning: <AlertTriangle className="h-3 w-3" />,
    danger: <XCircle className="h-3 w-3" />,
  };
  const colors = {
    good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colors[tone]}`}
    >
      {icons[tone]}
      {tone === "good" ? "Reasonable" : tone === "warning" ? "Concerning" : "Unrealistic"}
    </span>
  );
}

export default function BoECalculator({ parameters }: BoECalculatorProps) {
  const [dau, setDau] = useState<number>(parameters?.dau ?? 1_000_000);
  const [actionsPerDay, setActionsPerDay] = useState<number>(
    parameters?.actionsPerDay ?? 5
  );
  const [recordSizeBytes, setRecordSizeBytes] = useState<number>(
    parameters?.recordSizeBytes ?? 1024
  );
  const [retentionDays, setRetentionDays] = useState<number>(
    parameters?.retentionDays ?? 365
  );

  const results = useMemo(() => {
    const avgQps = (dau * actionsPerDay) / 86400;
    const peakQps = avgQps * 3;
    const dailyStorageGb = (dau * actionsPerDay * recordSizeBytes) / Math.pow(2, 30);
    const annualStorageTb = (dailyStorageGb * retentionDays) / Math.pow(2, 10);
    const bandwidthMbs = (peakQps * recordSizeBytes) / Math.pow(2, 20);

    return {
      avgQps,
      peakQps,
      dailyStorageGb,
      annualStorageTb,
      bandwidthMbs,
    };
  }, [dau, actionsPerDay, recordSizeBytes, retentionDays]);

  const chartData = [
    { name: "Average QPS", value: Math.round(results.avgQps), fill: "#10b981" },
    { name: "Peak QPS", value: Math.round(results.peakQps), fill: "#f59e0b" },
  ];

  const latencyNoCache = 5; // ms (DB only)
  const latencyWithCache = 0.1 * 0.9 + 5 * 0.1; // 90% hit on memory (0.1ms), 10% miss to DB (5ms)

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" />
            Input Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dau">DAU (Daily Active Users)</Label>
              <Input
                id="dau"
                type="number"
                value={dau}
                onChange={(e) => setDau(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actions">Actions per User / Day</Label>
              <Input
                id="actions"
                type="number"
                value={actionsPerDay}
                onChange={(e) => setActionsPerDay(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recordSize">Record Size (bytes)</Label>
              <Input
                id="recordSize"
                type="number"
                value={recordSizeBytes}
                onChange={(e) => setRecordSizeBytes(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retention">Retention (days)</Label>
              <Input
                id="retention"
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Zap className="h-4 w-4 text-amber-500" />
            QPS
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Average QPS</span>
              <span className="font-mono font-semibold">
                {Math.round(results.avgQps).toLocaleString()} req/s
              </span>
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded">
              QPS<sub>avg</sub> = (DAU × Actions) / 86,400
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Peak QPS (3×)</span>
              <span className="font-mono font-semibold">
                {Math.round(results.peakQps).toLocaleString()} req/s
              </span>
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded">
              QPS<sub>peak</sub> = 3 × QPS<sub>avg</sub>
            </div>
            <ToneBadge value={results.peakQps} thresholds={[10000, 100000]} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border bg-card p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Database className="h-4 w-4 text-blue-500" />
            Storage
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Daily</span>
              <span className="font-mono font-semibold">
                {results.dailyStorageGb.toFixed(2)} GB
              </span>
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded">
              Daily = (DAU × Actions × Size) / 2<sup>30</sup>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Annual</span>
              <span className="font-mono font-semibold">
                {results.annualStorageTb.toFixed(2)} TB
              </span>
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded">
              Annual = (Daily × Retention) / 2<sup>10</sup>
            </div>
            <ToneBadge
              value={results.annualStorageTb}
              thresholds={[1000, 100000]}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border bg-card p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wifi className="h-4 w-4 text-emerald-500" />
            Bandwidth
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Peak Bandwidth</span>
              <span className="font-mono font-semibold">
                {results.bandwidthMbs.toFixed(2)} MB/s
              </span>
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded">
              BW = (QPS<sub>peak</sub> × Size) / 2<sup>20</sup>
            </div>
            <ToneBadge value={results.bandwidthMbs} thresholds={[100, 1000]} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border bg-card p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <HardDrive className="h-4 w-4 text-purple-500" />
            Cache Impact
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs">
                <th className="text-left font-medium pb-2">Scenario</th>
                <th className="text-right font-medium pb-2">Latency</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-t">
                <td className="py-2 flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  Without cache
                </td>
                <td className="py-2 text-right">{latencyNoCache.toFixed(1)} ms</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  90% cache hit
                </td>
                <td className="py-2 text-right">
                  {latencyWithCache.toFixed(2)} ms
                </td>
              </tr>
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground">
            Memory = 0.1 ms, SSD = 100 μs, DB = 5 ms
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">QPS Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
