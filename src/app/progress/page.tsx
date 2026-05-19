"use client";

import Link from "next/link";
import {
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  Award,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  Rocket,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useProgressStore } from "@/lib/progress";
import { modules } from "@/data/curriculum";
import type { ModuleCategory } from "@/types/curriculum";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";

const categoryMeta: Record<
  ModuleCategory,
  { label: string; icon: typeof BookOpen }
> = {
  foundations: { label: "Foundations", icon: BookOpen },
  lld: { label: "Low-Level Design", icon: BookOpen },
  "core-distributed": { label: "Core Distributed", icon: BookOpen },
  "architecture-patterns": { label: "Architecture", icon: BookOpen },
  "reliability-ops": { label: "Reliability", icon: BookOpen },
  "real-world-systems": { label: "Real-World", icon: BookOpen },
  "expert-topics": { label: "Expert", icon: BookOpen },
  "interview-prep": { label: "Interview", icon: BookOpen },
  "case-studies": { label: "Case Studies", icon: Rocket },
};

function CircularProgress({
  value,
  size = 140,
  strokeWidth = 10,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className="text-primary"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold">{Math.round(value)}%</span>
        <span className="text-xs text-muted-foreground">Complete</span>
      </div>
    </div>
  );
}

const difficultyColor: Record<string, string> = {
  Beginner: "bg-emerald-500",
  Intermediate: "bg-amber-500",
  Advanced: "bg-red-500",
  Expert: "bg-purple-500",
};

function StatusIcon({
  status,
}: {
  status: "locked" | "available" | "in-progress" | "completed";
}) {
  if (status === "completed") {
    return <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />;
  }
  if (status === "in-progress") {
    return <Play className="size-4 shrink-0 text-amber-500" />;
  }
  if (status === "available") {
    return <Circle className="size-4 shrink-0 text-blue-500" />;
  }
  return <Lock className="size-4 shrink-0 text-muted-foreground" />;
}

export default function ProgressPage() {
  const completedModules = useProgressStore((s) => s.completedModules);
  const totalStudyTimeMinutes = useProgressStore(
    (s) => s.totalStudyTimeMinutes
  );
  const quizScores = useProgressStore((s) => s.quizScores);
  const labCompletions = useProgressStore((s) => s.labCompletions);
  const bookmarks = useProgressStore((s) => s.bookmarks);
  const getModuleStatus = useProgressStore((s) => s.getModuleStatus);

  const totalModules = modules.length;
  const completedCount = completedModules.length;
  const progressPercent =
    totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  const hours = Math.floor(totalStudyTimeMinutes / 60);
  const minutes = totalStudyTimeMinutes % 60;

  const activeCategories = Object.keys(categoryMeta).filter((cat) =>
    modules.some((m) => m.category === cat)
  ) as ModuleCategory[];

  const quizCount = Object.keys(quizScores).length;
  const avgQuizScore =
    quizCount > 0
      ? Object.values(quizScores).reduce((a, b) => a + b, 0) / quizCount
      : 0;
  const labCount = Object.keys(labCompletions).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Progress</h1>
            <p className="text-muted-foreground">
              Track your learning journey
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <Target className="size-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedCount}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <Clock className="size-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                </div>
                <div className="text-xs text-muted-foreground">Study Time</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{quizCount}</div>
                <div className="text-xs text-muted-foreground">Quizzes Taken</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <Award className="size-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{labCount}</div>
                <div className="text-xs text-muted-foreground">Labs Done</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300">
                <BookOpen className="size-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(avgQuizScore)}%
                </div>
                <div className="text-xs text-muted-foreground">Avg Quiz</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Overall Progress Ring */}
          <Card className="lg:row-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <CircularProgress value={progressPercent} />
              <div className="text-center space-y-1">
                <div className="text-lg font-semibold">
                  {completedCount} of {totalModules} modules
                </div>
                <div className="text-sm text-muted-foreground">
                  {totalModules - completedCount} modules remaining
                </div>
              </div>
              {completedCount > 0 && (
                <div className="w-full space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Keep going! You're making great progress.
                  </div>
                  <Link href="/dashboard">
                    <Button className="w-full" size="sm">
                      Continue Learning
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Progress */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Progress by Category
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {activeCategories.map((cat) => {
                const meta = categoryMeta[cat];
                const catModules = modules.filter((m) => m.category === cat);
                const catCompleted = catModules.filter((m) =>
                  completedModules.includes(m.id)
                ).length;
                const catPercent =
                  catModules.length > 0
                    ? (catCompleted / catModules.length) * 100
                    : 0;
                const Icon = meta.icon;

                return (
                  <Card key={cat}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">
                            {meta.label}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress
                              value={catPercent}
                              className="h-1.5 flex-1"
                            />
                            <span className="text-xs text-muted-foreground shrink-0">
                              {catCompleted}/{catModules.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Bookmarked Modules */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
            </CardHeader>
            <CardContent>
              {bookmarks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {bookmarks.map((moduleId) => {
                    const module = modules.find((m) => m.id === moduleId);
                    if (!module) return null;
                    const status = getModuleStatus(moduleId);
                    const isLocked = status === "locked";

                    return (
                      <Link
                        key={moduleId}
                        href={isLocked ? "#" : `/module/${moduleId}`}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                          isLocked
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-accent"
                        )}
                      >
                        <StatusIcon status={status} />
                        <span className="font-medium">
                          {module.number}. {module.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "ml-2 text-[10px] h-5 px-1.5",
                            module.difficulty === "Beginner" &&
                              "border-emerald-500 text-emerald-600",
                            module.difficulty === "Intermediate" &&
                              "border-amber-500 text-amber-600",
                            module.difficulty === "Advanced" &&
                              "border-red-500 text-red-600",
                            module.difficulty === "Expert" &&
                              "border-purple-500 text-purple-600"
                          )}
                        >
                          {module.difficulty}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No bookmarks yet. Click the bookmark icon on any module to
                  save it for later.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}