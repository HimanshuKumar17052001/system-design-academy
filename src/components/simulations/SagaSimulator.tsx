"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  Undo2,
  Info,
  StepForward,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type StepStatus = "pending" | "running" | "success" | "failed" | "compensating" | "compensated";

interface SagaStep {
  id: string;
  name: string;
  compensateName: string;
  status: StepStatus;
}

interface SagaState {
  steps: SagaStep[];
  mode: "idle" | "running" | "compensating" | "success" | "failed";
  currentIndex: number;
  compensationIndex: number;
  logs: string[];
  startTime: number | null;
  metrics: { totalTime: number; compensations: number; successRate: number };
}

type SagaAction =
  | { type: "START"; startTime: number }
  | { type: "RESET" }
  | { type: "SUCCEED_STEP"; index: number }
  | { type: "FAIL_STEP"; index: number }
  | { type: "START_COMPENSATION"; index: number }
  | { type: "COMPLETE_COMPENSATION"; index: number };

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const INITIAL_STEPS: SagaStep[] = [
  { id: "1", name: "Reserve Inventory", compensateName: "Release Inventory", status: "pending" },
  { id: "2", name: "Process Payment", compensateName: "Refund Payment", status: "pending" },
  { id: "3", name: "Create Shipment", compensateName: "Cancel Shipment", status: "pending" },
  { id: "4", name: "Send Confirmation Email", compensateName: "", status: "pending" },
  { id: "5", name: "Update Loyalty Points", compensateName: "", status: "pending" },
];

const initialState: SagaState = {
  steps: INITIAL_STEPS.map((s) => ({ ...s, status: "pending" as StepStatus })),
  mode: "idle",
  currentIndex: -1,
  compensationIndex: -1,
  logs: [],
  startTime: null,
  metrics: { totalTime: 0, compensations: 0, successRate: 0 },
};

/* ------------------------------------------------------------------ */
/*  Reducer                                                             */
/* ------------------------------------------------------------------ */

function sagaReducer(state: SagaState, action: SagaAction): SagaState {
  switch (action.type) {
    case "RESET":
      return initialState;
    case "START":
      return {
        ...initialState,
        mode: "running",
        currentIndex: 0,
        steps: initialState.steps.map((s, i) => (i === 0 ? { ...s, status: "running" as StepStatus } : s)),
        logs: ["Saga started..."],
        startTime: action.startTime,
      };
    case "SUCCEED_STEP": {
      const idx = action.index;
      const newSteps = state.steps.map((s, i) => {
        if (i === idx) return { ...s, status: "success" as StepStatus };
        if (i === idx + 1) return { ...s, status: "running" as StepStatus };
        return s;
      });
      if (idx === state.steps.length - 1) {
        return {
          ...state,
          steps: newSteps,
          mode: "success",
          currentIndex: idx,
          metrics: {
            totalTime: Date.now() - (state.startTime || Date.now()),
            compensations: 0,
            successRate: 100,
          },
          logs: [`Step ${idx + 1}: ${state.steps[idx].name} succeeded.`, "Order Complete", ...state.logs],
        };
      }
      return {
        ...state,
        steps: newSteps,
        currentIndex: idx + 1,
        logs: [`Step ${idx + 1}: ${state.steps[idx].name} succeeded.`, ...state.logs],
      };
    }
    case "FAIL_STEP": {
      const idx = action.index;
      const compensationIndex = idx - 1;
      if (compensationIndex < 0) {
        return {
          ...state,
          steps: state.steps.map((s, i) => (i === idx ? { ...s, status: "failed" as StepStatus } : s)),
          mode: "failed",
          currentIndex: idx,
          compensationIndex: -1,
          metrics: {
            totalTime: Date.now() - (state.startTime || Date.now()),
            compensations: 0,
            successRate: 0,
          },
          logs: [
            `Step ${idx + 1}: ${state.steps[idx].name} failed. Triggering compensation...`,
            "Order Cancelled",
            ...state.logs,
          ],
        };
      }
      return {
        ...state,
        steps: state.steps.map((s, i) => (i === idx ? { ...s, status: "failed" as StepStatus } : s)),
        mode: "compensating",
        currentIndex: idx,
        compensationIndex,
        logs: [`Step ${idx + 1}: ${state.steps[idx].name} failed. Triggering compensation...`, ...state.logs],
      };
    }
    case "START_COMPENSATION": {
      const idx = action.index;
      return {
        ...state,
        steps: state.steps.map((s, i) => (i === idx ? { ...s, status: "compensating" as StepStatus } : s)),
      };
    }
    case "COMPLETE_COMPENSATION": {
      const idx = action.index;
      const newCompensationIndex = state.compensationIndex - 1;
      const nextState: SagaState = {
        ...state,
        steps: state.steps.map((s, i) => (i === idx ? { ...s, status: "compensated" as StepStatus } : s)),
        compensationIndex: newCompensationIndex,
        logs: [`Compensation: ${state.steps[idx].compensateName}...`, ...state.logs],
      };
      if (newCompensationIndex < 0) {
        const compensations = state.steps.filter((s) => s.status === "compensated").length + 1;
        return {
          ...nextState,
          mode: "failed",
          metrics: {
            totalTime: Date.now() - (state.startTime || Date.now()),
            compensations,
            successRate: 0,
          },
          logs: ["Order Cancelled", ...nextState.logs],
        };
      }
      return nextState;
    }
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function buildAutoSequence(failAt: number | null): SagaAction[] {
  const seq: SagaAction[] = [];
  const count = INITIAL_STEPS.length;
  for (let i = 0; i < count; i++) {
    if (failAt === i + 1) {
      seq.push({ type: "FAIL_STEP", index: i });
      for (let j = i - 1; j >= 0; j--) {
        seq.push({ type: "START_COMPENSATION", index: j });
        seq.push({ type: "COMPLETE_COMPENSATION", index: j });
      }
      return seq;
    }
    seq.push({ type: "SUCCEED_STEP", index: i });
  }
  return seq;
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function SagaSimulator() {
  const [state, dispatch] = React.useReducer(sagaReducer, initialState);

  const [failureStep, setFailureStep] = useState<number | null>(null);
  const [stepByStep, setStepByStep] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const failureStepRef = useRef(failureStep);
  failureStepRef.current = failureStep;

  /* ----------------------- Auto-run effect ------------------------ */
  useEffect(() => {
    if (!autoRun || stepByStep) return;
    const seq = buildAutoSequence(failureStepRef.current);
    let cancelled = false;
    async function tick() {
      for (const action of seq) {
        if (cancelled) return;
        if (action.type === "SUCCEED_STEP" || action.type === "FAIL_STEP") await delay(800);
        else if (action.type === "COMPLETE_COMPENSATION") await delay(600);
        else if (action.type === "START_COMPENSATION") await delay(50);
        if (cancelled) return;
        dispatch(action);
      }
      setAutoRun(false);
    }
    tick();
    return () => {
      cancelled = true;
    };
  }, [autoRun, stepByStep]);

  /* ----------------------- Handlers ------------------------------- */
  const handleRunSuccess = () => {
    setFailureStep(null);
    dispatch({ type: "RESET" });
    dispatch({ type: "START", startTime: Date.now() });
    setAutoRun(true);
  };

  const handleRunWithFailure = () => {
    dispatch({ type: "RESET" });
    dispatch({ type: "START", startTime: Date.now() });
    setAutoRun(true);
  };

  const handleReset = () => {
    setAutoRun(false);
    dispatch({ type: "RESET" });
    setIsBusy(false);
  };

  const handleNext = async () => {
    if (isBusy) return;
    if (state.mode === "idle") {
      dispatch({ type: "START", startTime: Date.now() });
      return;
    }
    if (state.mode === "running") {
      setIsBusy(true);
      await delay(600);
      const idx = state.currentIndex;
      if (failureStep === idx + 1) {
        dispatch({ type: "FAIL_STEP", index: idx });
      } else {
        dispatch({ type: "SUCCEED_STEP", index: idx });
      }
      setIsBusy(false);
      return;
    }
    if (state.mode === "compensating") {
      const idx = state.compensationIndex;
      if (idx < 0) return;
      setIsBusy(true);
      dispatch({ type: "START_COMPENSATION", index: idx });
      await delay(600);
      dispatch({ type: "COMPLETE_COMPENSATION", index: idx });
      setIsBusy(false);
    }
  };

  /* ----------------------- Visual helpers ------------------------- */
  const statusColor = (status: StepStatus) => {
    switch (status) {
      case "pending":
        return "bg-muted text-muted-foreground";
      case "running":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400";
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400";
      case "compensating":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400";
      case "compensated":
        return "bg-red-50/50 text-red-600 border-red-200 line-through dark:bg-red-900/10 dark:text-red-400";
    }
  };

  const statusIcon = (status: StepStatus) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "compensating":
        return <Undo2 className="h-4 w-4 text-amber-600" />;
      case "compensated":
        return <Undo2 className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleRunSuccess} size="sm">
          <Play className="h-4 w-4 mr-1" />
          Run Success
        </Button>
        <div className="flex items-center gap-2">
          <Select
            value={failureStep ? String(failureStep) : ""}
            onValueChange={(v) => setFailureStep(v ? Number(v) : null)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Inject failure at..." />
            </SelectTrigger>
            <SelectContent>
              {INITIAL_STEPS.map((s, i) => (
                <SelectItem key={s.id} value={String(i + 1)}>
                  Step {i + 1}: {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRunWithFailure} variant="outline" size="sm" disabled={!failureStep}>
            <AlertTriangle className="h-4 w-4 mr-1" />
            Run with Failure
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={stepByStep} onCheckedChange={setStepByStep} />
          <span className="text-sm">Step-by-step</span>
        </div>
        {stepByStep && (
          <Button
            onClick={handleNext}
            variant="secondary"
            size="sm"
            disabled={isBusy || state.mode === "success" || state.mode === "failed"}
          >
            <StepForward className="h-4 w-4 mr-1" />
            Next
          </Button>
        )}
        <Button onClick={handleReset} variant="ghost" size="sm">
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
        <Button onClick={() => setShowInfo(true)} variant="ghost" size="sm">
          <Info className="h-4 w-4 mr-1" />
          What is a Saga?
        </Button>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            {state.steps.map((step, i) => (
              <React.Fragment key={step.id}>
                {/* Step Card */}
                <motion.div
                  className="flex-1"
                  animate={{
                    scale:
                      step.status === "running" || step.status === "compensating"
                        ? [1, 1.05, 1]
                        : 1,
                  }}
                  transition={{
                    repeat: step.status === "running" || step.status === "compensating" ? Infinity : 0,
                    duration: 1,
                  }}
                >
                  <div
                    className={cn(
                      "rounded-lg border p-3 flex flex-col items-center gap-2 text-center transition-colors",
                      statusColor(step.status)
                    )}
                  >
                    <div className="text-xs font-semibold">{step.name}</div>
                    <Badge variant="outline" className="text-[10px]">
                      {step.status === "pending" && "Pending"}
                      {step.status === "running" && "Running"}
                      {step.status === "success" && "Success"}
                      {step.status === "failed" && "Failed"}
                      {step.status === "compensating" && "Undoing"}
                      {step.status === "compensated" && "Undone"}
                    </Badge>
                    {statusIcon(step.status)}
                    {step.compensateName && (
                      <div className="text-[10px] text-muted-foreground">
                        Compensate: {step.compensateName}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Forward Arrow */}
                {i < state.steps.length - 1 && (
                  <div className="flex flex-col items-center relative">
                    <motion.div
                      animate={{
                        opacity: step.status === "success" ? 1 : 0.3,
                        x: step.status === "success" ? [0, 4, 0] : 0,
                      }}
                      transition={{
                        repeat: step.status === "success" ? Infinity : 0,
                        duration: 1.5,
                      }}
                    >
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                    {/* Compensation arrow */}
                    <AnimatePresence>
                      {(step.status === "compensating" || step.status === "compensated") && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="absolute top-full mt-1 flex items-center gap-1 text-[10px] text-red-600 font-medium whitespace-nowrap"
                        >
                          <Undo2 className="h-3 w-3" />
                          UNDO
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Final State */}
          <div className="mt-6 text-center">
            <AnimatePresence>
              {state.mode === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2 rounded-lg border bg-emerald-50 text-emerald-700 px-4 py-2 font-medium dark:bg-emerald-900/20 dark:text-emerald-400"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Order Complete
                </motion.div>
              )}
              {state.mode === "failed" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2 rounded-lg border bg-red-50 text-red-700 px-4 py-2 font-medium dark:bg-red-900/20 dark:text-red-400"
                >
                  <XCircle className="h-5 w-5" />
                  Order Cancelled
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground mb-1">Total Time</div>
            <div className="text-xl font-semibold">
              {state.metrics.totalTime > 0 ? `${state.metrics.totalTime}ms` : "--"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground mb-1">Compensations</div>
            <div className="text-xl font-semibold">{state.metrics.compensations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
            <div
              className={cn(
                "text-xl font-semibold",
                state.metrics.successRate === 100
                  ? "text-emerald-600"
                  : state.metrics.successRate === 0
                    ? "text-red-600"
                    : ""
              )}
            >
              {state.metrics.successRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Event Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {state.logs.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">No events yet.</div>
            )}
            {[...state.logs].reverse().map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm border-b last:border-0 py-1"
              >
                {log}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Educational Overlay */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saga Pattern</DialogTitle>
            <DialogDescription>
              Saga pattern ensures eventual consistency across distributed services. When a step
              fails, previously completed steps are undone via compensating transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              In a distributed system, you cannot rely on ACID transactions across services. The
              Saga pattern breaks a business process into a sequence of local transactions. If one
              fails, the saga executes compensating transactions for the steps that already
              succeeded, rolling back the overall operation.
            </p>
            <p>There are two flavors:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Choreography:</strong> Services react to events and publish the next event.
                No central coordinator.
              </li>
              <li>
                <strong>Orchestration:</strong> A central saga orchestrator directs each step and
                invokes compensations.
              </li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
