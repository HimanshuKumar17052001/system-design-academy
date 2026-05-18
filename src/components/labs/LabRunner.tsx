"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle2,
  Target,
} from "lucide-react";
import type { LabDefinition, SimulationResult } from "@/types/curriculum";
import { SimulationResultPanel } from "@/components/labs/SimulationResultPanel";
import { runSimulation, type SimulationControls, type SimulationParameters } from "@/lib/simulations/engine";

// Lazy-load simulation components
import dynamic from "next/dynamic";

const BoECalculator = dynamic(
  () => import("@/components/simulations/BoECalculator")
);
const HTTPTracer = dynamic(
  () => import("@/components/simulations/HTTPTracer")
);
const ScalingSimulator = dynamic(
  () => import("@/components/simulations/ScalingSimulator")
);
const CAPPlayground = dynamic(
  () => import("@/components/simulations/CAPPlayground")
);
const CacheStrategyLab = dynamic(
  () => import("@/components/simulations/CacheStrategyLab")
);
const RateLimiterLab = dynamic(
  () => import("@/components/simulations/RateLimiterLab")
);
const CodeLab = dynamic(
  () => import("@/components/simulations/CodeLab")
);
const PatternMatcher = dynamic(
  () => import("@/components/simulations/PatternMatcher")
);
const UMLSketchpad = dynamic(
  () => import("@/components/simulations/UMLSketchpad")
);
const ConsistentHashVisualizer = dynamic(
  () => import("@/components/simulations/ConsistentHashVisualizer")
);
const TrafficFlowVisualizer = dynamic(
  () => import("@/components/simulations/TrafficFlowVisualizer")
);
const DBScalingSimulator = dynamic(
  () => import("@/components/simulations/DBScalingSimulator")
);
const MessageQueueVisualizer = dynamic(
  () => import("@/components/simulations/MessageQueueVisualizer")
);
const LoadBalancerSimulator = dynamic(
  () => import("@/components/simulations/LoadBalancerSimulator")
);
const ArchitectureCanvas = dynamic(
  () => import("@/components/simulations/ArchitectureCanvas")
);
const URLShortenerCase = dynamic(
  () => import("@/components/simulations/URLShortenerCase")
);
const TwitterCase = dynamic(
  () => import("@/components/simulations/TwitterCase")
);
const UberCase = dynamic(
  () => import("@/components/simulations/UberCase")
);
const WhatsAppCase = dynamic(
  () => import("@/components/simulations/WhatsAppCase")
);
const DeploymentVisualizer = dynamic(
  () => import("@/components/simulations/DeploymentVisualizer")
);
const ChaosLab = dynamic(
  () => import("@/components/simulations/ChaosLab")
);
const AutoscalerSimulator = dynamic(
  () => import("@/components/simulations/AutoscalerSimulator")
);
const EventFlowBuilder = dynamic(
  () => import("@/components/simulations/EventFlowBuilder")
);
const SagaSimulator = dynamic(
  () => import("@/components/simulations/SagaSimulator")
);
const RealtimeFlowBuilder = dynamic(
  () => import("@/components/simulations/RealtimeFlowBuilder")
);
const MLPipelineSimulator = dynamic(
  () => import("@/components/simulations/MLPipelineSimulator")
);
const SecuritySimulator = dynamic(
  () => import("@/components/simulations/SecuritySimulator")
);
const PaymentSimulator = dynamic(
  () => import("@/components/simulations/PaymentSimulator")
);
const GlobalScaleSimulator = dynamic(
  () => import("@/components/simulations/GlobalScaleSimulator")
);
const InterviewTimer = dynamic(
  () => import("@/components/simulations/InterviewTimer")
);
const SystemDesignCanvas = dynamic(
  () => import("@/components/simulations/SystemDesignCanvas")
);
const PitfallDetector = dynamic(
  () => import("@/components/simulations/PitfallDetector")
);

interface LabRunnerProps {
  lab: LabDefinition;
  onComplete?: (labId: string) => void;
}

export default function LabRunner({ lab, onComplete }: LabRunnerProps) {
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  // Derive controls and parameters from lab definition defaults
  const defaultParameters: SimulationParameters = React.useMemo(() => {
    const params: SimulationParameters = {};
    lab.parameters?.forEach((p) => {
      params[p.key] = p.defaultValue;
    });
    return params;
  }, [lab.parameters]);

  const defaultControls: SimulationControls = React.useMemo(() => {
    const ctrls: SimulationControls = {};
    lab.controls?.forEach((c) => {
      ctrls[c.key] = c.defaultValue;
    });
    // default mode for scaling simulator
    if (lab.kind === "scaling-simulator") {
      ctrls.mode = "vertical";
    }
    return ctrls;
  }, [lab.controls, lab.kind]);

  const handleRun = useCallback(() => {
    const res = runSimulation(lab.kind, defaultControls, defaultParameters);
    setResult(res);
    setCurrentStep(-1);
    setIsPlaying(false);
  }, [lab.kind, defaultControls, defaultParameters]);

  const handleReset = useCallback(() => {
    setResult(null);
    setCurrentStep(-1);
    setIsPlaying(false);
  }, []);

  const handleComplete = useCallback(() => {
    setIsCompleted(true);
    onComplete?.(lab.id);
  }, [lab.id, onComplete]);

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying || !result) return;
    if (currentStep >= result.events.length - 1) {
      setIsPlaying(false);
      return;
    }
    const delay = 1000 / playSpeed;
    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, result, playSpeed]);

  const renderSimulationComponent = () => {
    switch (lab.kind) {
      case "boe-calculator":
        return <BoECalculator parameters={defaultParameters as Record<string, number>} />;
      case "http-tracer":
        return <HTTPTracer />;
      case "scaling-simulator":
        return <ScalingSimulator controls={defaultControls} />;
      case "cap-playground":
        return <CAPPlayground />;
      case "cache-strategy":
        return <CacheStrategyLab />;
      case "rate-limiter":
        return <RateLimiterLab />;
      case "pattern-matcher":
        return <PatternMatcher />;
      case "uml-sketchpad":
        return <UMLSketchpad />;
      case "consistent-hash":
        return <ConsistentHashVisualizer />;
      case "traffic-simulator":
        return <TrafficFlowVisualizer />;
      case "db-scaling":
        return <DBScalingSimulator />;
      case "mq-visualizer":
        return <MessageQueueVisualizer />;
      case "load-balancer":
        return <LoadBalancerSimulator />;
      case "architecture-builder":
        return <ArchitectureCanvas />;
      case "event-flow-builder":
        return <EventFlowBuilder />;
      case "saga-simulator":
        return <SagaSimulator />;
      case "case-study-walkthrough":
        switch (lab.id) {
          case "url-shortener-lab":
            return <URLShortenerCase />;
          case "twitter-lab":
            return <TwitterCase />;
          case "uber-lab":
            return <UberCase />;
          case "whatsapp-lab":
            return <WhatsAppCase />;
          default:
            return (
              <div className="rounded-lg border p-8 text-center text-muted-foreground">
                Interactive simulation for <code>{lab.kind}</code> is running in engine mode.
                Use the controls and Run Simulation to explore the scenario.
              </div>
            );
        }
      case "deployment-visualizer":
        return <DeploymentVisualizer />;
      case "chaos-lab":
        return <ChaosLab />;
      case "autoscaler":
        return <AutoscalerSimulator />;
      case "realtime-flow-builder":
        return <RealtimeFlowBuilder />;
      case "ml-pipeline-simulator":
        return <MLPipelineSimulator />;
      case "security-simulator":
        return <SecuritySimulator />;
      case "payment-simulator":
        return <PaymentSimulator />;
      case "global-scale-simulator":
        return <GlobalScaleSimulator />;
      case "interview-timer":
        return <InterviewTimer />;
      case "system-design-canvas":
        return <SystemDesignCanvas />;
      case "pitfall-detector":
        return <PitfallDetector />;
      default:
        return (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Simulation component for <code>{lab.kind}</code> not yet implemented.
          </div>
        );
    }
  };

  const isSimulationLab = !["code-editor", "pattern-matcher", "uml-sketchpad"].includes(lab.kind);

  return (
    <div className="space-y-6">
      {/* Lab Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">Lab</Badge>
                {isCompleted && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{lab.title}</CardTitle>
              <CardDescription>{lab.objective}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Collapsible Hint */}
          <div className="rounded-lg border">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Hint
              </span>
              {showHint ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 text-sm text-muted-foreground">
                    {lab.hint}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Simulation Component */}
          <div className="rounded-xl border bg-card p-4">
            {renderSimulationComponent()}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            {isSimulationLab && (
              <div className="flex items-center gap-2">
                <Button onClick={handleRun}>
                  <Play className="h-4 w-4 mr-1" />
                  Run Simulation
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            )}
            <div className={isSimulationLab ? "" : "ml-auto"}>
              <Button
                variant={isCompleted ? "secondary" : "default"}
                onClick={handleComplete}
                disabled={isCompleted}
              >
                <Target className="h-4 w-4 mr-1" />
                {isCompleted ? "Completed" : "Mark Complete"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <AnimatePresence>
        {isSimulationLab && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <SimulationResultPanel
              result={result}
              currentStep={currentStep}
              isPlaying={isPlaying}
              playSpeed={playSpeed}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onStepChange={setCurrentStep}
              onSpeedChange={setPlaySpeed}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
