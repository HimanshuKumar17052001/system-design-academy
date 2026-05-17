"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { QuizAnswer } from "./QuizEngine";

interface MultipleChoiceQuestionProps {
  question: {
    type: "multiple-choice";
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  answer?: { type: "multiple-choice"; selectedIndex: number };
  onAnswer: (a: QuizAnswer) => void;
  checked: boolean;
  onCheck: () => void;
  reviewMode: boolean;
}

export default function MultipleChoiceQuestion({
  question,
  answer,
  onAnswer,
  checked,
  onCheck,
  reviewMode,
}: MultipleChoiceQuestionProps) {
  const [selected, setSelected] = useState<number | undefined>(answer?.selectedIndex);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(checked || reviewMode);

  useEffect(() => {
    setSelected(answer?.selectedIndex);
    setShowExplanation(checked || reviewMode);
    setAttempts(checked ? 1 : 0);
  }, [answer, checked, reviewMode]);

  const handleSelect = (index: number) => {
    if (showExplanation && !reviewMode) return;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setSelected(index);
    onAnswer({ type: "multiple-choice", selectedIndex: index });

    if (newAttempts >= 3 || index === question.correctIndex) {
      setShowExplanation(true);
      setShowHint(false);
      onCheck();
    } else {
      setShowHint(true);
      setShowExplanation(false);
    }
  };

  const isCorrect = selected === question.correctIndex;
  const shouldRevealAnswer = showExplanation && (attempts >= 3 || reviewMode);

  return (
    <div className="space-y-4" role="radiogroup" aria-label="Multiple choice options">
      <h3 className="text-lg font-semibold leading-relaxed">{question.question}</h3>

      <div className="grid gap-3">
        {question.options.map((option, idx) => {
          const isSelected = selected === idx;
          const isCorrectOption = idx === question.correctIndex;
          const showCorrectness = shouldRevealAnswer;

          let variant: "default" | "outline" | "secondary" | "destructive" = "outline";
          if (showCorrectness) {
            if (isCorrectOption) variant = "default";
            else if (isSelected && !isCorrectOption) variant = "destructive";
          } else if (isSelected) {
            variant = "secondary";
          }

          return (
            <motion.div
              key={idx}
              whileTap={!shouldRevealAnswer && !reviewMode ? { scale: 0.98 } : undefined}
            >
              <Button
                variant={variant}
                className={`w-full justify-start h-auto py-3 px-4 text-left whitespace-normal ${
                  showCorrectness && isCorrectOption
                    ? "border-green-500 bg-green-50 hover:bg-green-100 text-green-900 dark:bg-green-950 dark:hover:bg-green-900"
                    : showCorrectness && isSelected && !isCorrectOption
                    ? "border-red-500 bg-red-50 hover:bg-red-100 text-red-900 dark:bg-red-950 dark:hover:bg-red-900"
                    : ""
                }`}
                onClick={() => handleSelect(idx)}
                role="radio"
                aria-checked={isSelected}
                aria-label={option}
                disabled={shouldRevealAnswer && !reviewMode}
              >
                <span className="mr-3 font-mono text-sm opacity-60">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className="flex-1">{option}</span>
                {showCorrectness && isCorrectOption && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 ml-2 shrink-0" />
                )}
                {showCorrectness && isSelected && !isCorrectOption && (
                  <XCircle className="w-5 h-5 text-red-600 ml-2 shrink-0" />
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {showHint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 rounded-lg p-3"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">Incorrect ({attempts}/3)</span>
            <span className="ml-2">Try again! {3 - attempts} attempts remaining.</span>
          </div>
        </motion.div>
      )}

      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pt-2"
        >
          <Badge
            variant={isCorrect ? "default" : "destructive"}
            className="mb-2"
          >
            {isCorrect ? "Correct" : "Incorrect"}
          </Badge>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {question.explanation}
          </p>
        </motion.div>
      )}
    </div>
  );
}
