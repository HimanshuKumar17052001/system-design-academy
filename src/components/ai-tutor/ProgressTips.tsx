"use client";

import { useMemo } from "react";
import { Lightbulb, X } from "lucide-react";
import { useProgressStore } from "@/lib/progress";
import { modules } from "@/data/curriculum";
import { useState } from "react";

const MODULE_TIME_THRESHOLD = 20;
const MIN_MODULES_FOR_TIPS = 3;

function generateTip(
  moduleTimeSpent: Record<string, number>,
  completedModules: string[],
  moduleScores: Record<string, number>
): { title: string; suggestion: string } | null {
  const lowScoring = Object.entries(moduleScores)
    .filter(([_, score]) => score < 70)
    .sort((a, b) => a[1] - b[1]);

  if (lowScoring.length > 0) {
    const module = modules.find((m) => m.id === lowScoring[0][0]);
    if (module) {
      return {
        title: "Review Suggested",
        suggestion: `You scored ${lowScoring[0][1]}% on ${module.title}. Consider reviewing this module again.`,
      };
    }
  }

  const timeSpentEntries = Object.entries(moduleTimeSpent)
    .filter(([id]) => !completedModules.includes(id))
    .sort((a, b) => b[1] - a[1]);

  if (timeSpentEntries.length > 0) {
    const module = modules.find((m) => m.id === timeSpentEntries[0][0]);
    if (module) {
      return {
        title: "Continue Learning",
        suggestion: `You've been spending time on ${module.title}. Continue where you left off!`,
      };
    }
  }

  const categoryTime: Record<string, number> = {};
  modules.forEach((m) => {
    const time = moduleTimeSpent[m.id] || 0;
    categoryTime[m.category] = (categoryTime[m.category] || 0) + time;
  });

  const sortedCategories = Object.entries(categoryTime).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0 && completedModules.length < modules.length * 0.5) {
    return {
      title: "Keep Going",
      suggestion: `You're making good progress! Keep consistent with your learning.`,
    };
  }

  return null;
}

export function ProgressTips() {
  const completedModules = useProgressStore((s) => s.completedModules);
  const quizScores = useProgressStore((s) => s.quizScores);
  const totalStudyTimeMinutes = useProgressStore((s) => s.totalStudyTimeMinutes);
  const [dismissed, setDismissed] = useState(false);

  const tip = useMemo(() => {
    if (dismissed) return null;
    if (totalStudyTimeMinutes < 10) return null;
    if (completedModules.length < MIN_MODULES_FOR_TIPS) return null;

    const moduleTimeSpent: Record<string, number> = {};
    const totalTime = totalStudyTimeMinutes;
    const avgTimePerModule = totalTime / Math.max(completedModules.length, 1);

    completedModules.forEach((id) => {
      moduleTimeSpent[id] = avgTimePerModule;
    });

    return generateTip(moduleTimeSpent, completedModules, quizScores);
  }, [completedModules, quizScores, totalStudyTimeMinutes, dismissed]);

  if (!tip) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 animate-in slide-in-from-bottom-2">
      <div className="flex items-start gap-2 rounded-lg border bg-background p-3 shadow-sm max-w-[280px]">
        <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">{tip.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {tip.suggestion}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}