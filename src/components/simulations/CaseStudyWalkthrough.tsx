"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trophy,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";
import type {
  CaseStudyConfig,
  CaseStudyStep,
  CaseStudyQuizQuestion,
  StepAnswerState,
} from "@/types/case-study";
import ArchitecturePresentationCanvas from "./ArchitecturePresentationCanvas";

interface CaseStudyWalkthroughProps {
  config: CaseStudyConfig;
  onComplete?: (moduleId: string, score: number) => void;
  renderStepExtras?: (step: CaseStudyStep, stepIndex: number) => React.ReactNode;
}

function QuizSection({
  questions,
  answers,
  submitted,
  onAnswer,
}: {
  questions: CaseStudyQuizQuestion[];
  answers: (number | null)[];
  submitted: boolean;
  onAnswer: (qIdx: number, optionIdx: number) => void;
}) {
  return (
    <div className="space-y-4">
      {questions.map((q, qIdx) => {
        const selected = answers[qIdx];
        const isCorrect = submitted && selected === q.correctIndex;
        const isWrong = submitted && selected !== null && selected !== q.correctIndex;

        return (
          <motion.div
            key={qIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qIdx * 0.1 }}
            className={cn(
              "rounded-lg border p-4",
              isCorrect && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20",
              isWrong && "border-red-300 bg-red-50/50 dark:bg-red-950/20"
            )}
          >
            <div className="flex items-start gap-2 mb-3">
              {submitted ? (
                isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                )
              ) : (
                <BrainCircuit className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-medium">{q.question}</p>
            </div>
            <div className="space-y-2 ml-7">
              {q.options.map((opt, oIdx) => {
                const isSelected = selected === oIdx;
                const isCorrectOption = oIdx === q.correctIndex;
                let btnVariant: React.ComponentProps<typeof Button>["variant"] = "outline";
                let btnClass = "";

                if (submitted) {
                  if (isCorrectOption) {
                    btnVariant = "default";
                    btnClass = "bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600";
                  } else if (isSelected) {
                    btnVariant = "default";
                    btnClass = "bg-red-600 hover:bg-red-600 text-white border-red-600";
                  }
                } else if (isSelected) {
                  btnVariant = "default";
                }

                return (
                  <Button
                    key={oIdx}
                    variant={btnVariant}
                    size="sm"
                    className={cn("w-full justify-start text-left h-auto py-2", btnClass)}
                    disabled={submitted}
                    onClick={() => onAnswer(qIdx, oIdx)}
                  >
                    <span className="mr-2 font-mono text-xs opacity-60">
                      {String.fromCharCode(65 + oIdx)}.
                    </span>
                    {opt}
                  </Button>
                );
              })}
            </div>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 ml-7 text-sm text-muted-foreground"
              >
                {q.explanation}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function CaseStudyWalkthrough({ config, onComplete, renderStepExtras }: CaseStudyWalkthroughProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStates, setStepStates] = useState<Record<string, StepAnswerState>>({});
  const [showFinal, setShowFinal] = useState(false);

  const totalSteps = config.steps.length;
  const currentStep = config.steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  const getStepState = useCallback(
    (stepId: string): StepAnswerState => {
      return (
        stepStates[stepId] || {
          revealedDecision: false,
          mistakesExpanded: false,
          quizAnswers: currentStep.quizQuestions.map(() => null),
          quizSubmitted: false,
        }
      );
    },
    [stepStates, currentStep]
  );

  const updateStepState = useCallback(
    (stepId: string, updater: (prev: StepAnswerState) => StepAnswerState) => {
      setStepStates((prev) => {
        const existing = prev[stepId] || {
          revealedDecision: false,
          mistakesExpanded: false,
          quizAnswers: config.steps.find((s) => s.id === stepId)?.quizQuestions.map(() => null) || [],
          quizSubmitted: false,
        };
        return { ...prev, [stepId]: updater(existing) };
      });
    },
    [config.steps]
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      setShowFinal(true);
    } else {
      setCurrentStepIndex((i) => Math.min(i + 1, totalSteps - 1));
    }
  }, [isLast, totalSteps]);

  const handlePrev = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(i - 1, 0));
    setShowFinal(false);
  }, []);

  const score = useMemo(() => {
    let correct = 0;
    let total = 0;
    config.steps.forEach((step) => {
      const state = stepStates[step.id];
      if (!state || !state.quizSubmitted) return;
      step.quizQuestions.forEach((q, idx) => {
        total++;
        if (state.quizAnswers[idx] === q.correctIndex) correct++;
      });
    });
    return total === 0 ? 0 : Math.round((correct / total) * 100);
  }, [config.steps, stepStates]);

  const handleComplete = useCallback(() => {
    onComplete?.(config.moduleId, score);
  }, [onComplete, config.moduleId, score]);

  // Cumulative visible nodes/edges up to current step
  const cumulativeVisibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i <= currentStepIndex; i++) {
      config.steps[i].architectureNodeIds.forEach((id) => ids.add(id));
    }
    return Array.from(ids);
  }, [config.steps, currentStepIndex]);

  const cumulativeVisibleEdgeIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i <= currentStepIndex; i++) {
      config.steps[i].architectureEdgeIds.forEach((id) => ids.add(id));
    }
    return Array.from(ids);
  }, [config.steps, currentStepIndex]);

  const currentAnnotations = useMemo(() => {
    if (!currentStep.annotations) return undefined;
    return currentStep.annotations;
  }, [currentStep]);

  const state = getStepState(currentStep.id);

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{config.systemName}</h2>
          <p className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {totalSteps}: {currentStep.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
          </Badge>
          {!showFinal && (
            <Progress value={((currentStepIndex + 1) / totalSteps) * 100} className="w-24" />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel - Step Content */}
        <div className="lg:w-[60%] flex flex-col gap-4 min-h-0">
          <AnimatePresence mode="wait">
            {!showFinal ? (
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col gap-4 min-h-0"
              >
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{currentStep.title}</CardTitle>
                    <CardDescription>{currentStep.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-5">
                        {/* Thinking Prompt */}
                        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-semibold">What would you do?</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{currentStep.thinkingPrompt}</p>
                        </div>

                        {/* Reveal Design Decision */}
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStepState(currentStep.id, (prev) => ({
                                ...prev,
                                revealedDecision: !prev.revealedDecision,
                              }))
                            }
                            className="gap-1.5"
                          >
                            {state.revealedDecision ? (
                              <>
                                <EyeOff className="h-4 w-4" />
                                Hide Design Decision
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4" />
                                Reveal Design Decision
                              </>
                            )}
                          </Button>
                          <AnimatePresence>
                            {state.revealedDecision && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 text-sm leading-relaxed">
                                  {currentStep.designDecision}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Common Mistakes */}
                        {currentStep.commonMistakes.length > 0 && (
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateStepState(currentStep.id, (prev) => ({
                                  ...prev,
                                  mistakesExpanded: !prev.mistakesExpanded,
                                }))
                              }
                              className="gap-1.5 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                            >
                              <AlertTriangle className="h-4 w-4" />
                              {state.mistakesExpanded ? "Hide" : "Show"} Common Mistakes
                            </Button>
                            <AnimatePresence>
                              {state.mistakesExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 space-y-3">
                                    {currentStep.commonMistakes.map((m, idx) => (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3"
                                      >
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                          {m.title}
                                        </p>
                                        <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1">
                                          {m.explanation}
                                        </p>
                                      </motion.div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Step Extras (interactive demos) */}
                        {renderStepExtras && renderStepExtras(currentStep, currentStepIndex)}

                        {/* Quiz */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4" />
                            Quick Check
                          </h4>
                          <QuizSection
                            questions={currentStep.quizQuestions}
                            answers={state.quizAnswers}
                            submitted={state.quizSubmitted}
                            onAnswer={(qIdx, oIdx) =>
                              updateStepState(currentStep.id, (prev) => {
                                const next = [...prev.quizAnswers];
                                next[qIdx] = oIdx;
                                return { ...prev, quizAnswers: next };
                              })
                            }
                          />
                          {!state.quizSubmitted && (
                            <Button
                              size="sm"
                              className="mt-3"
                              disabled={state.quizAnswers.some((a) => a === null)}
                              onClick={() =>
                                updateStepState(currentStep.id, (prev) => ({
                                  ...prev,
                                  quizSubmitted: true,
                                }))
                              }
                            >
                              Submit Answers
                            </Button>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="final"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-6 w-6 text-amber-500" />
                      <CardTitle className="text-xl">Design Complete!</CardTitle>
                    </div>
                    <CardDescription>
                      You&apos;ve walked through the {config.systemName} design. Here&apos;s your summary.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-6">
                        {/* Design Score */}
                        <div className="flex items-center gap-6">
                          <div className="relative w-32 h-32">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth="10"
                              />
                              <motion.circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke={score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444"}
                                strokeWidth="10"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "0 264" }}
                                animate={{
                                  strokeDasharray: `${(score / 100) * 264} 264`,
                                }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold">{score}%</span>
                              <span className="text-xs text-muted-foreground">Design Score</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {score >= 80
                                ? "Excellent understanding!"
                                : score >= 50
                                  ? "Good grasp with room to improve."
                                  : "Review the material and try again."}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              You answered{" "}
                              {config.steps.reduce((acc, s) => {
                                const st = stepStates[s.id];
                                if (!st) return acc;
                                return (
                                  acc +
                                  st.quizAnswers.filter((a, i) => a === s.quizQuestions[i].correctIndex).length
                                );
                              }, 0)}{" "}
                              out of{" "}
                              {config.steps.reduce((acc, s) => acc + s.quizQuestions.length, 0)} questions
                              correctly.
                            </p>
                          </div>
                        </div>

                        {/* Key Decisions Summary */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Key Design Decisions</h4>
                          {config.steps.map((step, idx) => (
                            <motion.div
                              key={step.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-start gap-3 rounded-lg border p-3"
                            >
                              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{step.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {step.designDecision.slice(0, 120)}
                                  {step.designDecision.length > 120 ? "..." : ""}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <Button onClick={handleComplete} className="w-full">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Mark Lab Complete
                        </Button>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel - Architecture Canvas */}
        <div className="lg:w-[40%] flex flex-col gap-3 min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="text-sm">Architecture</CardTitle>
              <CardDescription className="text-xs">
                {showFinal
                  ? "Full architecture with all components"
                  : `Showing components unlocked through Step ${currentStepIndex + 1}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-3 pt-0">
              <div className="h-full min-h-[300px]">
                <ArchitecturePresentationCanvas
                  nodes={config.architectureNodes}
                  edges={config.architectureEdges}
                  visibleNodeIds={cumulativeVisibleNodeIds}
                  visibleEdgeIds={cumulativeVisibleEdgeIds}
                  annotations={currentAnnotations}
                  fitView
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={isFirst && !showFinal}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous Step
        </Button>

        <div className="flex items-center gap-1">
          {config.steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStepIndex(idx);
                setShowFinal(false);
              }}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                idx === currentStepIndex && !showFinal
                  ? "bg-primary w-6"
                  : idx < currentStepIndex
                    ? "bg-primary/60"
                    : "bg-muted-foreground/20"
              )}
            />
          ))}
          <button
            onClick={() => setShowFinal(true)}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              showFinal ? "bg-amber-500 w-6" : "bg-muted-foreground/20"
            )}
          />
        </div>

        <Button variant="default" size="sm" onClick={handleNext}>
          {showFinal ? (
            <>
              Back to Summary
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          ) : isLast ? (
            <>
              Finish
              <CheckCircle2 className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              Next Step
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
