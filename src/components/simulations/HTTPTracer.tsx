"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Server,
  Database,
  Shield,
  Network,
  Wifi,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Clock,
} from "lucide-react";

interface StepInfo {
  icon: React.ReactNode;
  label: string;
  detail: string;
  latencyDelta: number;
}

const STEPS: StepInfo[] = [
  {
    icon: <Globe className="h-5 w-5" />,
    label: "Browser",
    detail: "User enters example.com and the browser begins the request journey.",
    latencyDelta: 0,
  },
  {
    icon: <Network className="h-5 w-5" />,
    label: "DNS Resolver",
    detail:
      "Resolves example.com to 203.0.113.45. Cached: ~0 ms. Uncached: ~50 ms.",
    latencyDelta: 0,
  },
  {
    icon: <Wifi className="h-5 w-5" />,
    label: "TCP Handshake",
    detail: "Three-way handshake: SYN → SYN-ACK → ACK (~1.5 RTT ≈ 75 ms).",
    latencyDelta: 75,
  },
  {
    icon: <Shield className="h-5 w-5" />,
    label: "TLS Handshake",
    detail:
      "Certificate exchange + key agreement. TLS 1.3 reduces this to ~1 RTT (~100 ms).",
    latencyDelta: 100,
  },
  {
    icon: <Server className="h-5 w-5" />,
    label: "Load Balancer",
    detail:
      "Inspects host header, routes to the healthiest backend using Round Robin (~15 ms).",
    latencyDelta: 15,
  },
  {
    icon: <Server className="h-5 w-5" />,
    label: "App Server",
    detail: "Receives HTTP request, runs routing & middleware, queries database (~50 ms).",
    latencyDelta: 50,
  },
  {
    icon: <Database className="h-5 w-5" />,
    label: "Database",
    detail: "Executes SQL query, reads index + row, returns result set (~50 ms).",
    latencyDelta: 50,
  },
  {
    icon: <Globe className="h-5 w-5" />,
    label: "Response",
    detail: "App assembles JSON payload. HTTP 200 OK returned to browser (~20 ms).",
    latencyDelta: 20,
  },
];

export default function HTTPTracer() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const cumulativeLatency = STEPS.slice(0, step + 1).reduce(
    (sum, s) => sum + s.latencyDelta,
    0
  );

  const nextStep = useCallback(() => {
    setStep((prev) => Math.min(STEPS.length - 1, prev + 1));
  }, []);

  const prevStep = useCallback(() => {
    setStep((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setAutoPlay(false);
  }, []);

  const replay = useCallback(() => {
    setStep(0);
    setAutoPlay(true);
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    if (step >= STEPS.length - 1) {
      setAutoPlay(false);
      return;
    }
    const timer = setTimeout(nextStep, 1200);
    return () => clearTimeout(timer);
  }, [autoPlay, step, nextStep]);

  return (
    <div className="space-y-6">
      {/* Node Flow */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Request Flow</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{cumulativeLatency} ms</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 py-4">
            {STEPS.map((s, i) => {
              const isActive = i === step;
              const isPast = i < step;
              return (
                <div key={s.label} className="flex items-center gap-2 md:gap-4">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      opacity: isPast ? 0.7 : isActive ? 1 : 0.4,
                    }}
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-xl border p-3 min-w-[80px] transition-colors",
                      isActive && "border-primary bg-primary/5",
                      isPast && "border-muted-foreground/30 bg-muted/50",
                      !isActive && !isPast && "border-border bg-card"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-full p-2",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isPast
                            ? "bg-muted-foreground/20 text-muted-foreground"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.icon}
                    </div>
                    <span className="text-xs font-medium">{s.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="active-dot"
                        className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-amber-500"
                      />
                    )}
                  </motion.div>
                  {i < STEPS.length - 1 && (
                    <motion.div
                      animate={{
                        opacity: isPast ? 1 : 0.2,
                      }}
                      className="text-muted-foreground"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Animated Packet */}
          <div className="relative h-2 mt-4 mb-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: `${((step + 1) / STEPS.length) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-amber-500 shadow"
              animate={{
                left: `${((step + 1) / STEPS.length) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step Detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step {step + 1}</Badge>
                  <CardTitle className="text-base">
                    {STEPS[step].label}
                  </CardTitle>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  +{STEPS[step].latencyDelta} ms
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{STEPS[step].detail}</p>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevStep} disabled={step <= 0}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <Button
            variant={autoPlay ? "secondary" : "default"}
            size="sm"
            onClick={() => setAutoPlay(!autoPlay)}
          >
            {autoPlay ? "Pause" : "Auto Play"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextStep}
            disabled={step >= STEPS.length - 1}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={replay}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Replay
          </Button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
