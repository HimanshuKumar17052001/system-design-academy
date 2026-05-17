"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Zap, Trophy, RotateCcw, CheckCircle2, XCircle, Brain } from "lucide-react";

interface PatternScenario {
  id: number;
  text: string;
  correctPattern: string;
  explanation: string;
}

const ALL_SCENARIOS: PatternScenario[] = [
  {
    id: 1,
    text: "You need to create families of related UI components for Windows and Mac without hardcoding concrete classes in client code.",
    correctPattern: "Abstract Factory",
    explanation: "Abstract Factory creates families of related objects (Button, Checkbox, ScrollBar) for different platforms.",
  },
  {
    id: 2,
    text: "A logging framework needs to support multiple output targets (Console, File, Database) dynamically at runtime.",
    correctPattern: "Strategy",
    explanation: "Strategy defines a family of algorithms (log targets), encapsulates each one, and makes them interchangeable.",
  },
  {
    id: 3,
    text: "You must ensure a class has only one instance and provide global access to a shared configuration manager.",
    correctPattern: "Singleton",
    explanation: "Singleton guarantees a single instance and provides a global point of access.",
  },
  {
    id: 4,
    text: "You want to add scrolling and border decorations to a UI widget without subclassing every possible combination.",
    correctPattern: "Decorator",
    explanation: "Decorator attaches additional responsibilities to an object dynamically without subclassing.",
  },
  {
    id: 5,
    text: "An e-commerce app supports Credit Card, PayPal, and Buy-Now-Pay-Later. The checkout should select the right payment logic at runtime.",
    correctPattern: "Strategy",
    explanation: "Strategy lets you define payment algorithms interchangeably and inject the right one at runtime.",
  },
  {
    id: 6,
    text: "You need to build a complex SQL query step-by-step, optionally adding WHERE, JOIN, ORDER BY, and LIMIT clauses.",
    correctPattern: "Builder",
    explanation: "Builder separates the construction of a complex object from its representation, ideal for step-by-step assembly.",
  },
  {
    id: 7,
    text: "A stock price monitoring app needs to notify multiple UI widgets and email services whenever the price changes.",
    correctPattern: "Observer",
    explanation: "Observer defines a one-to-many dependency so that when one object changes, all dependents are notified.",
  },
  {
    id: 8,
    text: "You have a third-party analytics library with a different interface than what your app's reporting module expects.",
    correctPattern: "Adapter",
    explanation: "Adapter converts the interface of a class into another interface clients expect.",
  },
  {
    id: 9,
    text: "A remote API client should cache results, retry failed requests, and log metrics without changing the original client code.",
    correctPattern: "Decorator",
    explanation: "Decorator wraps the original client to add caching, retry, and logging transparently.",
  },
  {
    id: 10,
    text: "You want a unified, simplified interface to a complex subsystem of microservices, databases, and caches.",
    correctPattern: "Facade",
    explanation: "Facade provides a simplified interface to a complex subsystem.",
  },
  {
    id: 11,
    text: "You need a single access point to a legacy database connection pool shared across the entire application.",
    correctPattern: "Singleton",
    explanation: "Singleton is commonly used for shared resource managers like connection pools.",
  },
  {
    id: 12,
    text: "A game engine allows players to execute commands that can be undone, replayed, and queued in macros.",
    correctPattern: "Command",
    explanation: "Command encapsulates a request as an object, enabling undo, redo, and macros.",
  },
  {
    id: 13,
    text: "You want to iterate over a custom tree structure without exposing the underlying node representation.",
    correctPattern: "Iterator",
    explanation: "Iterator provides a way to access elements of an aggregate object sequentially without exposing its internal structure.",
  },
  {
    id: 14,
    text: "A document editor needs to save its state so the user can undo/redo changes.",
    correctPattern: "Memento",
    explanation: "Memento captures and externalizes an object's internal state so it can be restored later.",
  },
  {
    id: 15,
    text: "You need to defer object creation cost until it is actually needed, such as loading a high-resolution image only when it is viewed.",
    correctPattern: "Proxy",
    explanation: "Proxy (Virtual) provides a placeholder for another object to control access and defer expensive initialization.",
  },
];

const PATTERNS_POOL = [
  "Singleton",
  "Factory Method",
  "Abstract Factory",
  "Builder",
  "Adapter",
  "Decorator",
  "Facade",
  "Proxy",
  "Strategy",
  "Observer",
  "Command",
  "Iterator",
  "Memento",
];

const GAME_DURATION = 60;
const SCENARIOS_PER_ROUND = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getChoices(correct: string): string[] {
  const distractors = shuffle(PATTERNS_POOL.filter((p) => p !== correct)).slice(0, 3);
  const choices = shuffle([correct, ...distractors]);
  return choices;
}

export default function PatternMatcher() {
  const [phase, setPhase] = useState<"intro" | "playing" | "ended">("intro");
  const [scenarios, setScenarios] = useState<PatternScenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());
  const [wrongPatterns, setWrongPatterns] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [roundResults, setRoundResults] = useState<{ scenarioId: number; correct: boolean; pattern: string }[]>([]);

  const startGame = useCallback(() => {
    const picked = shuffle(ALL_SCENARIOS).slice(0, SCENARIOS_PER_ROUND);
    setScenarios(picked);
    setCurrentIndex(0);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setAnsweredIds(new Set());
    setWrongPatterns(new Set());
    setFeedback(null);
    setRoundResults([]);
    setPhase("playing");
    if (picked.length > 0) {
      setChoices(getChoices(picked[0].correctPattern));
    }
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      setPhase("ended");
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const handleAnswer = useCallback(
    (pattern: string) => {
      if (phase !== "playing" || answeredIds.has(scenarios[currentIndex].id)) return;

      const current = scenarios[currentIndex];
      const isCorrect = pattern === current.correctPattern;

      if (isCorrect) {
        setScore((s) => s + 10);
        setFeedback("correct");
      } else {
        setScore((s) => Math.max(0, s - 5));
        setFeedback("wrong");
        setWrongPatterns((prev) => new Set(prev).add(current.correctPattern));
      }

      setAnsweredIds((prev) => new Set(prev).add(current.id));
      setRoundResults((prev) => [...prev, { scenarioId: current.id, correct: isCorrect, pattern: current.correctPattern }]);

      setTimeout(() => {
        if (currentIndex + 1 < scenarios.length) {
          setCurrentIndex((i) => i + 1);
          setChoices(getChoices(scenarios[currentIndex + 1].correctPattern));
          setFeedback(null);
        } else {
          setPhase("ended");
        }
      }, 1200);
    },
    [phase, answeredIds, scenarios, currentIndex]
  );

  const currentScenario = scenarios[currentIndex];
  const percentage = scenarios.length > 0 ? Math.round((roundResults.filter((r) => r.correct).length / scenarios.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
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
                  Pattern Matcher
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You have <strong>{GAME_DURATION} seconds</strong> to match {SCENARIOS_PER_ROUND} scenarios to the correct design pattern.
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
                  Start Game
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
                {currentIndex + 1} / {scenarios.length}
              </Badge>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span
                  className={`font-mono text-sm ${timeLeft <= 10 ? "text-red-600 font-bold" : ""}`}
                >
                  {timeLeft}s
                </span>
              </div>
              <Badge variant="secondary" className="font-mono">
                Score: {score}
              </Badge>
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
                  <CardTitle className="text-base">Scenario</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{currentScenario.text}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Choices */}
            <div className="grid grid-cols-2 gap-3">
              {choices.map((choice) => {
                const isAnswered = answeredIds.has(currentScenario.id);
                const isCorrectChoice = choice === currentScenario.correctPattern;
                const isSelectedWrong = feedback === "wrong" && !isCorrectChoice && isAnswered;
                const showCorrect = feedback && isCorrectChoice;
                const showWrong = feedback === "wrong" && isSelectedWrong;

                return (
                  <motion.button
                    key={choice}
                    whileHover={!isAnswered ? { scale: 1.02 } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(choice)}
                    disabled={isAnswered}
                    className={`relative rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      showCorrect
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
                        : showWrong
                          ? "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                          : "bg-card hover:bg-muted/60"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      {choice}
                      {showCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {showWrong && <XCircle className="h-4 w-4 text-red-600" />}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  feedback === "correct"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100"
                    : "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:text-red-100"
                }`}
              >
                <p className="font-medium">
                  {feedback === "correct" ? "Correct!" : "Not quite."}
                </p>
                <p className="mt-1 text-xs opacity-90">{currentScenario.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        )}

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
                  Round Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <div className="text-3xl font-bold">{score}</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{percentage}%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                </div>

                {wrongPatterns.size > 0 ? (
                  <div className="text-left rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm font-medium mb-2">Patterns to review:</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(wrongPatterns).map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Perfect round — no patterns to review!
                  </div>
                )}

                <Button onClick={startGame} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Play Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
