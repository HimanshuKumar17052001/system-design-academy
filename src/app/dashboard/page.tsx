"use client";

import Link from "next/link";
import {
  BookOpen,
  Globe,
  Server,
  Layers,
  ShieldCheck,
  Boxes,
  Sparkles,
  MessageSquareCode,
  Rocket,
  ArrowRight,
  Clock,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProgressStore } from "@/lib/progress";
import { modules } from "@/data/curriculum";
import type { ModuleCategory } from "@/types/curriculum";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressTips } from "@/components/ai-tutor/ProgressTips";

const categoryMeta: Record<
  ModuleCategory,
  { label: string; icon: LucideIcon; gradient: string }
> = {
  foundations: {
    label: "Foundations",
    icon: BookOpen,
    gradient: "from-blue-500/10 to-indigo-500/10",
  },
  lld: {
    label: "Low-Level Design",
    icon: Layers,
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  "core-distributed": {
    label: "Core Distributed Systems",
    icon: Server,
    gradient: "from-orange-500/10 to-amber-500/10",
  },
  "architecture-patterns": {
    label: "Architecture Patterns",
    icon: Boxes,
    gradient: "from-violet-500/10 to-purple-500/10",
  },
  "reliability-ops": {
    label: "Reliability & Operations",
    icon: ShieldCheck,
    gradient: "from-rose-500/10 to-pink-500/10",
  },
  "real-world-systems": {
    label: "Real-World Systems",
    icon: Globe,
    gradient: "from-cyan-500/10 to-sky-500/10",
  },
  "expert-topics": {
    label: "Expert Topics",
    icon: Sparkles,
    gradient: "from-fuchsia-500/10 to-pink-500/10",
  },
  "interview-prep": {
    label: "Interview Prep",
    icon: MessageSquareCode,
    gradient: "from-lime-500/10 to-green-500/10",
  },
};

function CircularProgress({
  value,
  size = 160,
  strokeWidth = 12,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
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

export default function DashboardPage() {
  const completedModules = useProgressStore((s) => s.completedModules);
  const lastVisited = useProgressStore((s) => s.lastVisited);
  const totalStudyTimeMinutes = useProgressStore((s) => s.totalStudyTimeMinutes);
  const getModuleStatus = useProgressStore((s) => s.getModuleStatus);

  const totalModules = modules.length;
  const completedCount = completedModules.length;
  const progressPercent = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  const hours = Math.floor(totalStudyTimeMinutes / 60);
  const minutes = totalStudyTimeMinutes % 60;

  const activeCategories = Object.keys(categoryMeta).filter((cat) =>
    modules.some((m) => m.category === cat)
  ) as ModuleCategory[];

  const lastModule = lastVisited ? modules.find((m) => m.id === lastVisited) : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-10 text-white md:px-10 md:py-14">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 size-64 rounded-full bg-blue-500 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 size-64 rounded-full bg-indigo-500 blur-3xl" />
          </div>
          <div className="relative z-10">
            <Badge className="mb-3 bg-white/10 text-white hover:bg-white/20">
              <Rocket className="mr-1 size-3" />
              Interactive Learning
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              System Design Academy
            </h1>
            <p className="mt-3 max-w-xl text-base text-slate-300 md:text-lg">
              Master system design with interactive lessons, hands-on labs, and
              real-world case studies. Build the skills to architect scalable,
              reliable systems.
            </p>
            <div className="mt-6">
              <Link href="/module/sd-fundamentals">
                <Button size="lg" className="gap-2 bg-white text-slate-900 hover:bg-white/90">
                  Start Learning
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <BookOpen className="size-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalModules}</div>
                <div className="text-xs text-muted-foreground">Total Modules</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
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
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
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
                <div className="text-2xl font-bold">
                  {Math.round(progressPercent)}%
                </div>
                <div className="text-xs text-muted-foreground">Progress</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Category cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
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
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden">
                      <div
                        className={`h-1.5 w-full bg-gradient-to-r ${meta.gradient}`}
                      />
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                            <Icon className="size-4 text-muted-foreground" />
                          </div>
                          <CardTitle className="text-sm font-medium">
                            {meta.label}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                          {catModules.length} modules
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {catCompleted}/{catModules.length} completed
                          </span>
                          <span>{Math.round(catPercent)}%</span>
                        </div>
                        <Progress value={catPercent} className="h-1.5" />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right column: progress + activity */}
          <div className="space-y-6">
            {/* Overall progress ring */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <CircularProgress value={progressPercent} />
                <div className="text-center text-sm text-muted-foreground">
                  {completedCount} of {totalModules} modules completed
                </div>
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {lastModule ? (
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      Last visited
                    </div>
                    <Link
                      href={`/module/${lastModule.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                        <BookOpen className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {lastModule.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Module {lastModule.number}
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1 py-0"
                      >
                        {getModuleStatus(lastModule.id)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No recent activity. Start with Module 1 to begin your
                    journey.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ProgressTips />
    </AppShell>
  );
}
