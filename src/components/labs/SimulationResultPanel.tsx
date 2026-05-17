"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Activity,
  List,
  Clock,
} from "lucide-react";
import type { SimulationResult, SimulationMetric, SimulationStateItem } from "@/types/curriculum";

interface SimulationResultPanelProps {
  result: SimulationResult;
  currentStep?: number;
  isPlaying?: boolean;
  playSpeed?: number;
  onPlayPause?: () => void;
  onStepChange?: (step: number) => void;
  onSpeedChange?: (speed: number) => void;
}

const toneClasses: Record<string, string> = {
  neutral: "text-muted-foreground",
  good: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

const badgeToneMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  neutral: "secondary",
  good: "default",
  warning: "outline",
  danger: "destructive",
};

const statusToneMap: Record<string, string> = {
  idle: "bg-gray-500",
  hit: "bg-emerald-500",
  miss: "bg-amber-500",
  stale: "bg-orange-500",
  evicted: "bg-red-500",
  queued: "bg-blue-500",
  running: "bg-emerald-500",
  failed: "bg-red-500",
  success: "bg-emerald-500",
};

export function SimulationResultPanel({
  result,
  currentStep = -1,
  isPlaying = false,
  playSpeed = 1,
  onPlayPause,
  onStepChange,
  onSpeedChange,
}: SimulationResultPanelProps) {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {result.metrics.map((metric: SimulationMetric, i: number) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border p-3"
              >
                <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                <div className={cn("text-lg font-semibold", toneClasses[metric.tone || "neutral"])}>
                  {typeof metric.value === "number"
                    ? metric.value.toLocaleString()
                    : metric.value}
                  {metric.unit ? (
                    <span className="text-xs ml-1 font-normal text-muted-foreground">
                      {metric.unit}
                    </span>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* State List */}
      {result.state.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <List className="h-4 w-4" />
              State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.state.map((item: SimulationStateItem, i: number) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.status && (
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full",
                          statusToneMap[item.status]
                        )}
                      />
                    )}
                    <Badge variant={badgeToneMap[item.tone || "neutral"]}>
                      {typeof item.value === "boolean"
                        ? item.value
                          ? "Yes"
                          : "No"
                        : String(item.value)}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Timeline */}
      {result.events.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Events Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
              {result.events.map((event: string, i: number) => {
                const isActive = i === currentStep;
                const isPast = i < currentStep;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: isActive || isPast ? 1 : 0.6,
                      x: 0,
                      scale: isActive ? 1.02 : 1,
                    }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "relative rounded-md border px-3 py-2 transition-colors",
                      isActive && "border-primary bg-primary/5",
                      isPast && "border-muted-foreground/20"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute -left-[21px] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-background",
                        isActive
                          ? "bg-primary"
                          : isPast
                            ? "bg-muted-foreground"
                            : "bg-border"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-6">
                        {i + 1}
                      </span>
                      <span className="text-sm">{event}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Auto-play controls */}
            <div className="mt-6 flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onStepChange?.(Math.max(0, currentStep - 1))}
                disabled={currentStep <= 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant={isPlaying ? "secondary" : "default"}
                size="icon"
                onClick={onPlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  onStepChange?.(Math.min(result.events.length - 1, currentStep + 1))
                }
                disabled={currentStep >= result.events.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <div className="flex-1 flex items-center gap-3 ml-4">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Speed
                </span>
                <Slider
                  defaultValue={[playSpeed]}
                  min={0.5}
                  max={3}
                  step={0.5}
                  onValueChange={(v: number[]) => onSpeedChange?.(v[0])}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground w-8">
                  {playSpeed}x
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
