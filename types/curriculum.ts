export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export type ModuleCategory =
  | "foundations"
  | "lld"
  | "core-distributed"
  | "architecture-patterns"
  | "reliability-ops"
  | "real-world-systems"
  | "expert-topics"
  | "interview-prep"
  | "case-studies";

export interface Module {
  id: string;
  number: number;
  category: ModuleCategory;
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  estimatedHours: number;
  icon: string;
  prerequisites: string[];
  lessons: Lesson[];
  lab?: LabDefinition;
  quiz?: QuizDefinition;
  checkpoint: Checkpoint;
}

export interface Lesson {
  id: string;
  title: string;
  content: ContentBlock[];
}

export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "diagram"; kind: DiagramKind; caption: string }
  | { type: "mermaid"; code: string; title?: string; caption?: string }
  | { type: "code"; language: string; code: string; runnable: boolean }
  | { type: "interactive"; component: string; props?: Record<string, unknown> }
  | { type: "callout"; variant: "info" | "warning" | "tip" | "success"; content: string }
  | { type: "formula"; expression: string; explanation: string }
  | { type: "bullets"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][]; caption?: string }
  | { type: "video-embed"; url?: string; title: string; duration: string; thumbnail?: string };

export type DiagramKind =
  | "request-flow"
  | "client-server"
  | "dns-cdn"
  | "api-lifecycle"
  | "sql-vs-nosql"
  | "scaling-vertical-horizontal"
  | "boe-calculation"
  | "cache-strategy"
  | "load-balancer"
  | "consistent-hash"
  | "cap-theorem"
  | "microservices"
  | "event-driven"
  | "cqrs"
  | "saga"
  | "rate-limiter"
  | "distributed-transactions"
  | "observability"
  | "deployment"
  | "url-shortener"
  | "twitter-feed"
  | "whatsapp"
  | "youtube"
  | "uber"
  | "amazon"
  | "search-autocomplete"
  | "realtime-system"
  | "ml-pipeline"
  | "security-architecture"
  | "payment-flow"
  | "global-scale"
  | "interview-framework";

export interface LabDefinition {
  id: string;
  title: string;
  kind: LabKind;
  objective: string;
  starterCode?: string;
  hint: string;
  parameters?: SimulationParameter[];
  controls?: SimulationControl[];
}

export type LabKind =
  | "latency-calculator"
  | "architecture-builder"
  | "traffic-simulator"
  | "cache-strategy"
  | "consistent-hash"
  | "cap-playground"
  | "rate-limiter"
  | "chaos-lab"
  | "code-editor"
  | "db-scaling"
  | "mq-visualizer"
  | "load-balancer"
  | "microservices-builder"
  | "interview-timer"
  | "boe-calculator"
  | "http-tracer"
  | "scaling-simulator"
  | "api-designer"
  | "db-selector"
  | "pattern-matcher"
  | "uml-sketchpad"
  | "event-flow-builder"
  | "saga-simulator"
  | "deployment-visualizer"
  | "autoscaler"
  | "case-study-walkthrough"
  | "realtime-flow-builder"
  | "ml-pipeline-simulator"
  | "security-simulator"
  | "payment-simulator"
  | "global-scale-simulator"
  | "system-design-canvas"
  | "pitfall-detector";

export interface SimulationParameter {
  key: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface SimulationControl {
  key: string;
  label: string;
  defaultValue: boolean;
}

export interface QuizDefinition {
  id: string;
  title: string;
  questions: Question[];
  passingScore: number;
}

export type Question =
  | {
      type: "multiple-choice";
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }
  | {
      type: "drag-drop";
      question: string;
      pairs: { left: string; right: string }[];
      explanation: string;
    }
  | {
      type: "fill-blank";
      question: string;
      blanks: { id: string; label: string; correctAnswers: string[] }[];
      explanation: string;
    }
  | {
      type: "ordering";
      question: string;
      items: string[];
      correctOrder: number[];
      explanation: string;
    };

export interface Checkpoint {
  prompt: string;
  answer: string;
  type: "text" | "code" | "diagram";
}

export interface SimulationResult {
  title: string;
  summary: string;
  output: string[];
  metrics: SimulationMetric[];
  state: SimulationStateItem[];
  events: string[];
}

export interface SimulationMetric {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "neutral" | "good" | "warning" | "danger";
}

export interface SimulationStateItem {
  key?: string;
  label: string;
  value: string | number | boolean;
  tone?: "neutral" | "good" | "warning" | "danger";
  status?: "idle" | "hit" | "miss" | "stale" | "evicted" | "queued" | "running" | "failed" | "success";
}

export interface UserProgress {
  completedModules: string[];
  moduleScores: Record<string, number>;
  quizScores: Record<string, number>;
  labCompletions: Record<string, boolean>;
  bookmarks: string[];
  lastVisited: string;
  totalStudyTimeMinutes: number;
}
