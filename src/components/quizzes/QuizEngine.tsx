"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProgressStore } from "@/lib/progress";
import { cn } from "@/lib/utils";
import type { QuizDefinition, Question } from "@/types/curriculum";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import DragDropQuestion from "./DragDropQuestion";
import FillBlankQuestion from "./FillBlankQuestion";
import OrderingQuestion from "./OrderingQuestion";

export type MCQAnswer = { type: "multiple-choice"; selectedIndex: number };
export type DragDropAnswer = { type: "drag-drop"; matches: Record<string, string> };
export type FillBlankAnswer = { type: "fill-blank"; answers: Record<string, string> };
export type OrderingAnswer = { type: "ordering"; currentOrder: number[] };

export type QuizAnswer = MCQAnswer | DragDropAnswer | FillBlankAnswer | OrderingAnswer;

function computeQuestionScore(question: Question, answer?: QuizAnswer): number {
  if (!answer) return 0;

  switch (question.type) {
    case "multiple-choice": {
      if (answer.type !== "multiple-choice") return 0;
      return answer.selectedIndex === question.correctIndex ? 1 : 0;
    }
    case "drag-drop": {
      if (answer.type !== "drag-drop") return 0;
      let correct = 0;
      for (const pair of question.pairs) {
        if (answer.matches[pair.left] === pair.right) {
          correct++;
        }
      }
      return correct / question.pairs.length;
    }
    case "fill-blank": {
      if (answer.type !== "fill-blank") return 0;
      let correct = 0;
      for (const blank of question.blanks) {
        const user = answer.answers[blank.id]?.trim().toLowerCase() ?? "";
        if (blank.correctAnswers.some((ca) => ca.toLowerCase() === user)) {
          correct++;
        }
      }
      return correct / question.blanks.length;
    }
    case "ordering": {
      if (answer.type !== "ordering") return 0;
      let correct = 0;
      for (let i = 0; i < question.correctOrder.length; i++) {
        if (answer.currentOrder[i] === question.correctOrder[i]) {
          correct++;
        }
      }
      return correct / question.items.length;
    }
  }
}

export function computeTotalScore(quiz: QuizDefinition, answers: (QuizAnswer | undefined)[]): number {
  if (quiz.questions.length === 0) return 0;
  const total = quiz.questions.reduce((sum, q, i) => sum + computeQuestionScore(q, answers[i]), 0);
  return Math.round((total / quiz.questions.length) * 100);
}

export function getQuestionScore(question: Question, answer?: QuizAnswer): number {
  return computeQuestionScore(question, answer);
}

interface QuizEngineProps {
  quiz: QuizDefinition;
}

export default function QuizEngine({ quiz }: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(QuizAnswer | undefined)[]>(() =>
    new Array(quiz.questions.length).fill(undefined)
  );
  const [checked, setChecked] = useState<boolean[]>(() =>
    new Array(quiz.questions.length).fill(false)
  );
  const [showResults, setShowResults] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recordQuizScore = useProgressStore((s) => s.recordQuizScore);
  const recordStudyTime = useProgressStore((s) => s.recordStudyTime);

  useEffect(() => {
    if (showResults || reviewMode) return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [showResults, reviewMode]);

  const scorePercentage = showResults || reviewMode ? computeTotalScore(quiz, answers) : 0;
  const passed = scorePercentage >= quiz.passingScore;

  const handleAnswer = (index: number, answer: QuizAnswer) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = answer;
      return next;
    });
  };

  const handleCheck = (index: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const handleFinish = () => {
    const score = computeTotalScore(quiz, answers);
    recordQuizScore(quiz.id, score);
    recordStudyTime(Math.ceil(elapsedSeconds / 60));
    setShowResults(true);
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setAnswers(new Array(quiz.questions.length).fill(undefined));
    setChecked(new Array(quiz.questions.length).fill(false));
    setShowResults(false);
    setReviewMode(false);
    setElapsedSeconds(0);
  };

  const handleReview = () => {
    setShowResults(false);
    setReviewMode(true);
    setCurrentIndex(0);
  };

  const currentQuestion = quiz.questions[currentIndex];
  const answeredCount = answers.filter((a, i) => a !== undefined || checked[i]).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold">Quiz Complete</h2>
            <div className="space-y-2">
              <div className="text-5xl font-extrabold">{scorePercentage}%</div>
              <Badge
                variant={passed ? "default" : "destructive"}
                className="text-sm px-3 py-1"
              >
                {passed ? "Passed" : "Did Not Pass"}
              </Badge>
              <p className="text-muted-foreground">Passing score: {quiz.passingScore}%</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Time taken: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
            </div>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={handleReview}>Review Answers</Button>
              <Button variant="outline" onClick={handleRetake}>
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (reviewMode) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Review Mode</h2>
          <Button variant="outline" onClick={handleRetake}>
            Retake Quiz
          </Button>
        </div>
        {quiz.questions.map((q, idx) => {
          const score = getQuestionScore(q, answers[idx]);
          const isCorrect = score >= 1;
          const isPartial = score > 0 && score < 1;
          
          return (
            <Card key={idx} className="overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Question {idx + 1}</Badge>
                  <Badge
                    variant={
                      isCorrect ? "default" : isPartial ? "secondary" : "destructive"
                    }
                  >
                    {isCorrect ? "Correct" : isPartial ? "Partially Correct" : "Incorrect"}
                  </Badge>
                </div>
                <QuestionRenderer
                  question={q}
                  answer={answers[idx]}
                  onAnswer={() => {}}
                  checked={true}
                  onCheck={() => {}}
                  reviewMode={true}
                />
                {"explanation" in q && q.explanation && (
                  <div className={cn(
                    "rounded-lg p-4 text-sm",
                    isCorrect 
                      ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" 
                      : "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                  )}>
                    <p className="font-medium mb-1">
                      {isCorrect ? "✓ Correct Answer" : isPartial ? "◐ Partially Correct" : "✗ Incorrect Answer"}
                    </p>
                    <p className="text-muted-foreground">{q.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {quiz.questions.length}
          </p>
          <Progress value={progress} className="w-48 h-2" />
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
        </div>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
      >
        <Card>
          <CardContent className="p-6 space-y-6">
            <QuestionRenderer
              question={currentQuestion}
              answer={answers[currentIndex]}
              onAnswer={(a) => handleAnswer(currentIndex, a)}
              checked={checked[currentIndex]}
              onCheck={() => handleCheck(currentIndex)}
              reviewMode={false}
            />
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          Previous
        </Button>

        {currentIndex < quiz.questions.length - 1 ? (
          <Button
            onClick={() => setCurrentIndex((i) => i + 1)}
            disabled={!checked[currentIndex]}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={!checked[currentIndex]}
          >
            Finish Quiz
          </Button>
        )}
      </div>
    </div>
  );
}

function QuestionRenderer({
  question,
  answer,
  onAnswer,
  checked,
  onCheck,
  reviewMode,
}: {
  question: Question;
  answer?: QuizAnswer;
  onAnswer: (a: QuizAnswer) => void;
  checked: boolean;
  onCheck: () => void;
  reviewMode: boolean;
}) {
  switch (question.type) {
    case "multiple-choice":
      return (
        <MultipleChoiceQuestion
          question={question}
          answer={answer?.type === "multiple-choice" ? answer : undefined}
          onAnswer={onAnswer}
          checked={checked}
          onCheck={onCheck}
          reviewMode={reviewMode}
        />
      );
    case "drag-drop":
      return (
        <DragDropQuestion
          question={question}
          answer={answer?.type === "drag-drop" ? answer : undefined}
          onAnswer={onAnswer}
          checked={checked}
          onCheck={onCheck}
          reviewMode={reviewMode}
        />
      );
    case "fill-blank":
      return (
        <FillBlankQuestion
          question={question}
          answer={answer?.type === "fill-blank" ? answer : undefined}
          onAnswer={onAnswer}
          checked={checked}
          onCheck={onCheck}
          reviewMode={reviewMode}
        />
      );
    case "ordering":
      return (
        <OrderingQuestion
          question={question}
          answer={answer?.type === "ordering" ? answer : undefined}
          onAnswer={onAnswer}
          checked={checked}
          onCheck={onCheck}
          reviewMode={reviewMode}
        />
      );
  }
}
