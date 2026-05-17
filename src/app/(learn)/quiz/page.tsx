"use client";

import Link from "next/link";
import { BookOpen, HelpCircle, FileQuestion } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProgressStore } from "@/lib/progress";
import { modules } from "@/data/curriculum";
import { AppShell } from "@/components/layout/AppShell";

interface QuizWithModule {
  moduleId: string;
  moduleTitle: string;
  moduleNumber: number;
  quizId: string;
  quizTitle: string;
  questionCount: number;
  passingScore: number;
}

function QuizListContent() {
  const quizScores = useProgressStore((s) => s.quizScores);

  const quizzes: QuizWithModule[] = modules
    .filter((m) => m.quiz)
    .map((m) => ({
      moduleId: m.id,
      moduleTitle: m.title,
      moduleNumber: m.number,
      quizId: m.quiz!.id,
      quizTitle: m.quiz!.title,
      questionCount: m.quiz!.questions.length,
      passingScore: m.quiz!.passingScore,
    }));

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge across all modules</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz) => {
            const score = quizScores[quiz.quizId];
            const isPassed = score && score >= quiz.passingScore;

            return (
              <Link key={quiz.quizId} href={`/quiz/${quiz.moduleId}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-mono">
                        M{quiz.moduleNumber}
                      </Badge>
                      {score !== undefined && (
                        <Badge
                          variant={isPassed ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {score}%
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">{quiz.quizTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileQuestion className="size-3.5" />
                        {quiz.questionCount} questions
                      </div>
                      <div className="flex items-center gap-1">
                        <HelpCircle className="size-3.5" />
                        {quiz.passingScore}% to pass
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

export default function QuizPage() {
  return <QuizListContent />;
}