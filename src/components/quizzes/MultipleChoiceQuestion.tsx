"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
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
  const [showExplanation, setShowExplanation] = useState(checked || reviewMode);

  useEffect(() => {
    setSelected(answer?.selectedIndex);
    setShowExplanation(checked || reviewMode);
  }, [answer, checked, reviewMode]);

  const handleSelect = (index: number) => {
    if (checked && !reviewMode) return;
    setSelected(index);
    onAnswer({ type: "multiple-choice", selectedIndex: index });
    setShowExplanation(true);
    onCheck();
  };

  const isCorrect = selected === question.correctIndex;

  return (
    <div className="space-y-4" role="radiogroup" aria-label="Multiple choice options">
      <h3 className="text-lg font-semibold leading-relaxed">{question.question}</h3>

      <div className="grid gap-3">
        {question.options.map((option, idx) => {
          const isSelected = selected === idx;
          const isCorrectOption = idx === question.correctIndex;
          const showCorrectness = showExplanation || reviewMode;

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
              whileTap={!showCorrectness && !reviewMode ? { scale: 0.98 } : undefined}
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
                disabled={showCorrectness && !reviewMode}
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
