"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { QuizAnswer } from "./QuizEngine";

interface FillBlankQuestionProps {
  question: {
    type: "fill-blank";
    question: string;
    blanks: { id: string; label: string; correctAnswers: string[] }[];
    explanation: string;
  };
  answer?: { type: "fill-blank"; answers: Record<string, string> };
  onAnswer: (a: QuizAnswer) => void;
  checked: boolean;
  onCheck: () => void;
  reviewMode: boolean;
}

export default function FillBlankQuestion({
  question,
  answer,
  onAnswer,
  checked,
  onCheck,
  reviewMode,
}: FillBlankQuestionProps) {
  const [inputs, setInputs] = useState<Record<string, string>>(answer?.answers ?? {});
  const [showExplanation, setShowExplanation] = useState(checked || reviewMode);

  useEffect(() => {
    if (answer?.answers) {
      setInputs(answer.answers);
    }
    setShowExplanation(checked || reviewMode);
  }, [answer, checked, reviewMode]);

  const handleChange = (id: string, value: string) => {
    const next = { ...inputs, [id]: value };
    setInputs(next);
    onAnswer({ type: "fill-blank", answers: next });
  };

  const handleCheck = () => {
    setShowExplanation(true);
    onCheck();
  };

  const isCorrect = (id: string) => {
    const blank = question.blanks.find((b) => b.id === id);
    if (!blank) return false;
    const val = inputs[id]?.trim().toLowerCase() ?? "";
    return blank.correctAnswers.some((ca) => ca.toLowerCase() === val);
  };

  const renderQuestion = () => {
    const parts = question.question.split(/(\[blank\d+\])/g);
    let blankIndex = 0;
    return (
      <div className="text-lg font-semibold leading-relaxed inline flex-wrap gap-1">
        {parts.map((part, idx) => {
          const match = part.match(/\[(blank\d+)\]/);
          if (match) {
            const blankId = match[1];
            const blank = question.blanks.find((b) => b.id === blankId);
            const correct = isCorrect(blankId);
            blankIndex++;
            return (
              <span key={idx} className="inline-block mx-1">
                <Input
                  value={inputs[blankId] ?? ""}
                  onChange={(e) => handleChange(blankId, e.target.value)}
                  disabled={showExplanation && !reviewMode}
                  placeholder={blank?.label ?? `Answer ${blankIndex}`}
                  className={`inline-block w-40 text-center ${
                    showExplanation
                      ? correct
                        ? "border-green-500 focus-visible:ring-green-500"
                        : "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  aria-label={`Blank ${blankIndex}: ${blank?.label ?? ""}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!showExplanation) handleCheck();
                    }
                  }}
                />
                {showExplanation && !correct && blank && (
                  <span className="block text-xs text-green-700 dark:text-green-400 mt-1 font-medium">
                    Correct: {blank.correctAnswers[0]}
                    {blank.correctAnswers.length > 1 && " (or similar)"}
                  </span>
                )}
              </span>
            );
          }
          return (
            <span key={idx} className="inline">
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  const allFilled = question.blanks.every((b) => (inputs[b.id]?.trim() ?? "").length > 0);

  return (
    <div className="space-y-4">
      <div className="leading-relaxed">{renderQuestion()}</div>

      {!showExplanation && !reviewMode && (
        <Button onClick={handleCheck} disabled={!allFilled} className="mt-2">
          Check Answers
        </Button>
      )}

      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pt-2"
        >
          <Badge variant="outline" className="mb-2">
            {question.blanks.filter((b) => isCorrect(b.id)).length} / {question.blanks.length}{" "}
            correct
          </Badge>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {question.explanation}
          </p>
        </motion.div>
      )}
    </div>
  );
}
