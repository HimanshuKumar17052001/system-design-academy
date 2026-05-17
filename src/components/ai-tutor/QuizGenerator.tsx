"use client";

import { useState } from "react";
import { FileQuestion, X, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      setError("Failed to generate quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
      >
        <Sparkles className="size-4" />
        AI Quiz Generator
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl border bg-popup shadow-2xl animate-in fade-in zoom-in-95 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="flex items-center gap-2 text-white">
                <FileQuestion className="size-5" />
                <h3 className="font-semibold">AI Quiz Generator</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!quiz && !isLoading && (
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <Sparkles className="size-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">
                    Generate Custom Quiz
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    I&apos;ll generate 5 interview-style questions about{" "}
                    <span className="font-medium text-foreground">
                      {moduleTitle}
                    </span>
                  </p>
                  <Button
                    onClick={handleGenerate}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Sparkles className="size-4 mr-2" />
                    Generate Quiz
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-12">
                  <Loader2 className="size-8 animate-spin text-indigo-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Generating questions...
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Creating 5 interview-style questions
                  </p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button variant="outline" onClick={handleGenerate}>
                    <RefreshCw className="size-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}

              {quiz && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Generated 5 questions for {moduleTitle}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={isLoading}
                    >
                      <RefreshCw className="size-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-muted/50 p-4 rounded-lg">
                    {quiz}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}