import type { LabDefinition } from "@/types/curriculum";

export const httpTracerLab: LabDefinition = {
  id: "http-tracer-lab",
  title: "HTTP Request Tracer",
  kind: "http-tracer",
  objective: "Trace a full HTTP request from browser to database and back.",
  hint: "Click each step to see what happens. Pay attention to where time is spent.",
  parameters: [],
  controls: [],
};

export const boeCalculatorLab: LabDefinition = {
  id: "boe-calculator-lab",
  title: "BoE Calculator",
  kind: "boe-calculator",
  objective: "Estimate QPS, storage, and bandwidth for a given system.",
  hint: "Start with DAU and actions per day. Peak QPS is usually 3× average. Don't forget growth!",
  parameters: [
    { key: "dau", label: "DAU", defaultValue: 1_000_000, min: 1_000, max: 1_000_000_000, step: 1_000 },
    { key: "actionsPerDay", label: "Actions per day", defaultValue: 5, min: 1, max: 1000, step: 1, unit: "actions" },
    { key: "recordSizeBytes", label: "Record size", defaultValue: 1024, min: 1, max: 1_000_000, step: 1, unit: "B" },
    { key: "retentionDays", label: "Retention", defaultValue: 365, min: 1, max: 3650, step: 1, unit: "days" },
  ],
  controls: [],
};

export const scalingSimulatorLab: LabDefinition = {
  id: "scaling-simulator-lab",
  title: "Scaling Simulator",
  kind: "scaling-simulator",
  objective: "Add users to a system and observe when vertical scaling hits its limit, then switch to horizontal.",
  hint: "Watch the latency graph. When vertical hits 100% CPU, horizontal scaling is the only option.",
  parameters: [],
  controls: [
    { key: "mode", label: "Mode", defaultValue: false },
    { key: "users", label: "Users", defaultValue: false },
    { key: "servers", label: "Servers", defaultValue: false },
  ],
};

export const sampleLabs: LabDefinition[] = [
  httpTracerLab,
  boeCalculatorLab,
  scalingSimulatorLab,
];
