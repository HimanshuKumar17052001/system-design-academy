"use client";

import { useState } from "react";
import { FileQuestion, X, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateQuiz } from "@/lib/groq";

interface QuizGeneratorProps {
  moduleTitle: string;
}

export function QuizGenerator({ moduleTitle }: QuizGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quiz, setQuiz] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setIsLoading(true);
    setError("");
    setQuiz("");

    try {
      const result = await generateQuiz(moduleTitle, 5);
      setQuiz(result);
    } catch (err) {
      setError("Failed to generate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Minimal Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs h-8"
      >
        <FileQuestion className="size-3.5" />
        Quiz
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-xl max-h-[70vh] overflow-hidden rounded-lg border bg-popup shadow-xl flex flex-col">
            {/* Minimal Header */}
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <FileQuestion className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">AI Quiz</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!quiz && !isLoading && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate 5 questions on <span className="font-medium">{moduleTitle}</span>
                  </p>
                  <Button size="sm" onClick={handleGenerate} variant="outline">
                    Generate
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-6">
                  <Loader2 className="size-5 animate-spin text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Generating...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-6">
                  <p className="text-xs text-destructive mb-2">{error}</p>
                  <Button size="sm" onClick={handleGenerate} variant="outline">
                    <RefreshCw className="size-3 mr-1" />
                    Retry
                  </Button>
                </div>
              )}

              {quiz && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isLoading}>
                      <RefreshCw className="size-3 mr-1" />
                      New
                    </Button>
                  </div>
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono bg-muted p-3 rounded">
                    {quiz}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}