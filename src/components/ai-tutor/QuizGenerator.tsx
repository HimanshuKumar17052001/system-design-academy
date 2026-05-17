"use client";

import { useState } from "react";
import { FileQuestion, X, Loader2, RefreshCw, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateQuiz, type AIQuizQuestion } from "@/lib/groq";
import { cn } from "@/lib/utils";

interface QuizGeneratorProps {
  moduleTitle: string;
}

export function QuizGenerator({ moduleTitle }: QuizGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [questions, setQuestions] = useState<AIQuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError("");
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers({});
    setFinished(false);

    try {
      const result = await generateQuiz(moduleTitle, 5);
      if (result.length === 0) {
        setError("Failed to generate questions. Please try again.");
      } else {
        setQuestions(result);
      }
    } catch (err) {
      setError("Failed to generate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    if (showExplanation) return;
    setSelectedAnswer(option);
    setAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const handleNext = () => {
    if (!selectedAnswer) return;
    setShowExplanation(true);
  };

  const handleContinue = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers({});
    setFinished(false);
  };

  const score = Object.keys(answers).filter(
    (idx) => questions[parseInt(idx)]?.answer.toUpperCase() === answers[parseInt(idx)]?.toUpperCase()
  ).length;

  const currentQuestion = questions[currentIndex];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs h-8"
      >
        <FileQuestion className="size-3.5" />
        AI Quiz
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-lg max-h-[80vh] overflow-hidden rounded-lg border bg-popup shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <FileQuestion className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">AI Quiz: {moduleTitle}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!questions.length && !isLoading && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate 5 questions on <span className="font-medium">{moduleTitle}</span>
                  </p>
                  <Button onClick={handleGenerate} variant="outline">
                    Generate Quiz
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Generating questions...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive mb-3">{error}</p>
                  <Button size="sm" onClick={handleGenerate} variant="outline">
                    <RefreshCw className="size-3 mr-1" />
                    Retry
                  </Button>
                </div>
              )}

              {questions.length > 0 && !finished && currentQuestion && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <Button size="sm" variant="ghost" onClick={handleGenerate} className="h-6 text-xs">
                      <RefreshCw className="size-3 mr-1" />
                      New Quiz
                    </Button>
                  </div>

                  <div className="text-sm font-medium">
                    {currentQuestion.question}
                  </div>

                  <div className="space-y-2">
                    {currentQuestion.options.map((option, idx) => {
                      const optLetter = String.fromCharCode(65 + idx);
                      const isSelected = selectedAnswer === optLetter;
                      const isCorrect = currentQuestion.answer.toUpperCase() === optLetter;

                      let bgClass = "hover:bg-muted";
                      if (showExplanation) {
                        if (isCorrect) bgClass = "bg-green-50 border-green-300";
                        else if (isSelected) bgClass = "bg-red-50 border-red-300";
                        else bgClass = "bg-muted";
                      } else if (isSelected) {
                        bgClass = "bg-blue-50 border-blue-300";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(optLetter)}
                          disabled={showExplanation}
                          className={cn(
                            "w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-all",
                            bgClass
                          )}
                        >
                          <span className="font-medium mr-2">{optLetter})</span>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {showExplanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <div className="font-medium text-blue-800 mb-1">Explanation</div>
                      <div className="text-blue-700">{currentQuestion.explanation}</div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    {!showExplanation ? (
                      <Button
                        onClick={handleNext}
                        disabled={!selectedAnswer}
                        size="sm"
                      >
                        Check Answer
                        <ChevronRight className="size-4 ml-1" />
                      </Button>
                    ) : (
                      <Button onClick={handleContinue} size="sm">
                        {currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                        <ChevronRight className="size-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {finished && (
                <div className="text-center py-6">
                  <div className="mb-4">
                    <CheckCircle className="size-12 text-green-500 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Quiz Complete!</h3>
                  <p className="text-muted-foreground mb-4">
                    You scored <span className="font-bold text-foreground">{score}</span> out of{" "}
                    <span className="font-bold text-foreground">{questions.length}</span>
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={handleRestart}>
                      Try Again
                    </Button>
                    <Button onClick={() => setIsOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}