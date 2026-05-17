import type { Node, Edge } from "@xyflow/react";

export interface CaseStudyQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CaseStudyStep {
  id: string;
  title: string;
  description: string;
  thinkingPrompt: string;
  designDecision: string;
  commonMistakes: { title: string; explanation: string }[];
  quizQuestions: CaseStudyQuizQuestion[];
  architectureNodeIds: string[];
  architectureEdgeIds: string[];
  annotations?: { nodeId: string; text: string; type: "trade-off" | "note" | "warning" }[];
}

export interface CaseStudyConfig {
  systemName: string;
  moduleId: string;
  steps: CaseStudyStep[];
  architectureNodes: Node<Record<string, unknown>>[];
  architectureEdges: Edge<Record<string, unknown>>[];
}

export interface StepAnswerState {
  revealedDecision: boolean;
  mistakesExpanded: boolean;
  quizAnswers: (number | null)[];
  quizSubmitted: boolean;
}

export interface CaseStudyProgress {
  currentStep: number;
  stepStates: Record<string, StepAnswerState>;
  completed: boolean;
}
