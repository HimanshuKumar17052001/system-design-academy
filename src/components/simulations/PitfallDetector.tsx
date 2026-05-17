"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertTriangle,
  Zap,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// Types & Data
// ------------------------------------------------------------------
type PitfallKind =
  | "over-engineering"
  | "missing-nfrs"
  | "weak-consistency"
  | "no-fallback"
  | "premature-optimization"
  | "ignoring-failure-modes";

interface PitfallOption {
  kind: PitfallKind;
  label: string;
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  correctPitfall: PitfallKind;
  explanation: string;
  fix: string;
}

const PITFALLS: PitfallOption[] = [
  { kind: "over-engineering", label: "Over-engineering" },
  { kind: "missing-nfrs", label: "Missing NFRs" },
  { kind: "weak-consistency", label: "Weak consistency" },
  { kind: "no-fallback", label: "No fallback" },
  { kind: "premature-optimization", label: "Premature optimization" },
  { kind: "ignoring-failure-modes", label: "Ignoring failure modes" },
];

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Global Chat App",
    description:
      "A team designs a global real-time chat system using a single PostgreSQL instance with strong ACID guarantees, global secondary indexes, and complex JOINs for message threads. They plan to shard later 'if needed'.",
    correctPitfall: "over-engineering",
    explanation:
      "Using a single relational DB with complex schemas for a high-throughput chat system is over-engineering the data model. Chat is inherently write-heavy and partition-tolerant.",
    fix: "Use a write-optimized store (e.g., Cassandra, DynamoDB) or a message log (Kafka) for chat history. Keep a lightweight index for recent messages.",
  },
  {
    id: 2,
    title: "E-Commerce Checkout",
    description:
      "An e-commerce platform designs its checkout flow focusing only on functional requirements (add to cart, pay, confirm). The design review reveals no discussion of latency, availability, or consistency during flash sales.",
    correctPitfall: "missing-nfrs",
    explanation:
      "Checkout is a critical path. Without NFRs, you can't choose the right database, caching strategy, or rate-limiting policy.",
    fix: "Define SLOs upfront: p99 checkout latency < 500ms, 99.99% availability, idempotent payments, and inventory consistency model.",
  },
  {
    id: 3,
    title: "Bank Transfer Ledger",
    description:
      "A fintech startup builds a peer-to-peer transfer system using eventual consistency across two regional databases. Users report that balances sometimes appear incorrect for a few seconds after transfers.",
    correctPitfall: "weak-consistency",
    explanation:
      "Financial ledgers require strong consistency. Eventual consistency can lead to double-spending or incorrect balances.",
    fix: "Use a strongly consistent store (e.g., Spanner, CockroachDB, or a single ACID database with cross-region synchronous replication) for the ledger.",
  },
  {
    id: 4,
    title: "Video Streaming CDN",
    description:
      "A video streaming service relies entirely on a single CDN provider. During a major outage, the entire platform goes offline because there is no alternate path to serve content.",
    correctPitfall: "no-fallback",
    explanation:
      "Relying on a single vendor without a fallback is a single point of failure at the infrastructure level.",
    fix: "Implement multi-CDN failover. Use DNS or a traffic manager to route to a secondary CDN when the primary fails health checks.",
  },
  {
    id: 5,
    title: "Startup URL Shortener",
    description:
      "A 3-person startup builds a URL shortener with a 5-layer microservices architecture, Kubernetes, Kafka, and CQRS — before they have a single user. They spend 3 months on infrastructure instead of product validation.",
    correctPitfall: "premature-optimization",
    explanation:
      "Building for 1M+ users before validating product-market fit is premature optimization. Complexity slows iteration.",
    fix: "Start with a monolith or serverless functions. Use a managed DB. Decompose into microservices only when clear boundaries and scaling needs emerge.",
  },
  {
    id: 6,
    title: "Social Media Feed",
    description:
      "A social media feed service assumes its cache (Redis) and database (MySQL) will always be available. The design has no circuit breakers, no retries with backoff, and no graceful degradation when Redis is down.",
    correctPitfall: "ignoring-failure-modes",
    explanation:
      "Assuming 100% uptime for dependencies is unrealistic. Without failure handling, a single Redis blip cascades into a full outage.",
    fix: "Add circuit breakers, exponential backoff retries, and graceful degradation (e.g., serve stale feed or simplified view if cache is down).",
  },
];

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function PitfallDetector() {
  const [phase, setPhase] = useState<"intro" | "playing" | "ended">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedPitfall, setSelectedPitfall] = useState<PitfallKind | null>(null);
  const [results, setResults] = useState<{ scenarioId: number; correct: boolean; pitfall: PitfallKind }[]>([]);

  const startGame = useCallback(() => {
    setPhase("playing");
    setCurrentIndex(0);
    setScore(0);
    setAnswered(new Set());
    setFeedback(null);
    setSelectedPitfall(null);
    setResults([]);
  }, []);

  const handleAnswer = useCallback(
    (pitfall: PitfallKind) => {
      if (phase !== "playing" || answered.has(SCENARIOS[currentIndex].id)) return;

      const scenario = SCENARIOS[currentIndex];
      const isCorrect = pitfall === scenario.correctPitfall;

      if (isCorrect) {
        setScore((s) => s + 10);
        setFeedback("correct");
      } else {
        setScore((s) => Math.max(0, s - 5));
        setFeedback("wrong");
      }

      setSelectedPitfall(pitfall);
      setAnswered((prev) => new Set(prev).add(scenario.id));
      setResults((prev) => [...prev, { scenarioId: scenario.id, correct: isCorrect, pitfall: scenario.correctPitfall }]);

      setTimeout(() => {
        if (currentIndex + 1 < SCENARIOS.length) {
          setCurrentIndex((i) => i + 1);
          setFeedback(null);
          setSelectedPitfall(null);
        } else {
          setPhase("ended");
        }
      }, 2500);
    },
    [phase, answered, currentIndex]
  );

  const currentScenario = SCENARIOS[currentIndex];
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = SCENARIOS.length > 0 ? Math.round((correctCount / SCENARIOS.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <AnimatePresence mode="wait">
        {/* Intro Screen */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Pitfall Detector
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Read {SCENARIOS.length} system design scenarios and identify the core mistake.
                  Select the most relevant pitfall for each design.
                </p>
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>+10 correct</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>-5 wrong</span>
                  </div>
                </div>
                <Button onClick={startGame} size="lg">
                  <Zap className="h-4 w-4 mr-1" />
                  Start Challenge
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Playing Screen */}
        {phase === "playing" && currentScenario && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono">
                {currentIndex + 1} / {SCENARIOS.length}
              </Badge>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="font-mono">
                  Score: {score}
                </Badge>
              </div>
            </div>

            {/* Scenario Card */}
            <motion.div
              key={currentScenario.id}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {currentScenario.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {currentScenario.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Prompt */}
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowRight className="h-4 w-4 text-primary" />
              <span>What is the primary pitfall in this design?</span>
            </div>

            {/* Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PITFALLS.map((option) => {
                const isAnswered = answered.has(currentScenario.id);
                const isCorrect = option.kind === currentScenario.correctPitfall;
                const isSelected = selectedPitfall === option.kind;
                const showCorrect = feedback && isCorrect;
                const showWrong = feedback === "wrong" && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={option.kind}
                    whileHover={!isAnswered ? { scale: 1.02 } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(option.kind)}
                    disabled={isAnswered}
                    className={cn(
                      "relative rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                      showCorrect
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
                        : showWrong
                          ? "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                          : "bg-card hover:bg-muted/60 border-border"
                    )}
                  >
                    <span className="flex items-center justify-between">
                      {option.label}
                      {showCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {showWrong && <XCircle className="h-4 w-4 text-red-600" />}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm space-y-2",
                    feedback === "correct"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100"
                      : "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:text-red-100"
                  )}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {feedback === "correct" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>{feedback === "correct" ? "Correct!" : "Not quite."}</span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    <strong>Why:</strong> {currentScenario.explanation}
                  </p>
                  <p className="text-xs opacity-90 leading-relaxed">
                    <strong>Fix:</strong> {currentScenario.fix}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* End Screen */}
        {phase === "ended" && (
          <motion.div
            key="ended"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Challenge Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <div className="text-3xl font-bold">{score}</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{accuracy}%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                </div>

                <Separator />

                <div className="text-left space-y-2">
                  <p className="text-sm font-medium">Review:</p>
                  {SCENARIOS.map((scenario) => {
                    const result = results.find((r) => r.scenarioId === scenario.id);
                    const isCorrect = result?.correct ?? false;
                    return (
                      <div
                        key={scenario.id}
                        className="flex items-start gap-2 text-sm rounded-md border p-2"
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{scenario.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Correct: {PITFALLS.find((p) => p.kind === scenario.correctPitfall)?.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button onClick={startGame} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
