"use client";

import Link from "next/link";
import {
  BookOpen,
  Globe,
  MapPin,
  Plug,
  Database,
  TrendingUp,
  Calculator,
  Lock,
  CheckCircle2,
  Circle,
  Play,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useProgressStore } from "@/lib/progress";
import { modules } from "@/data/curriculum";
import type { Module, ModuleCategory, Difficulty } from "@/types/curriculum";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Globe,
  MapPin,
  Plug,
  Database,
  TrendingUp,
  Calculator,
};

const categoryLabels: Record<ModuleCategory, string> = {
  foundations: "Foundations",
  lld: "Low-Level Design",
  "core-distributed": "Core Distributed Systems",
  "architecture-patterns": "Architecture Patterns",
  "reliability-ops": "Reliability & Operations",
  "real-world-systems": "Real-World Systems",
  "expert-topics": "Expert Topics",
  "interview-prep": "Interview Prep",
};

const categoryOrder: ModuleCategory[] = [
  "foundations",
  "lld",
  "core-distributed",
  "architecture-patterns",
  "reliability-ops",
  "real-world-systems",
  "expert-topics",
  "interview-prep",
];

const difficultyColor: Record<Difficulty, string> = {
  Beginner:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  Intermediate:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  Advanced:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  Expert:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
};

function ModuleIcon({ name }: { name: string }) {
  const Icon = iconMap[name] || BookOpen;
  return <Icon className="size-4 shrink-0" />;
}

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

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const getModuleStatus = useProgressStore((s) => s.getModuleStatus);

  const grouped = categoryOrder.reduce<Record<string, Module[]>>((acc, cat) => {
    acc[cat] = modules.filter((m) => m.category === cat);
    return acc;
  }, {});

  const activeCategories = categoryOrder.filter(
    (cat) => grouped[cat].length > 0
  );

  return (
    <ScrollArea className="h-full">
      <div className="px-3 py-4">
        {activeCategories.map((cat, catIndex) => {
          const catModules = grouped[cat];
          return (
            <div key={cat} className={catIndex > 0 ? "mt-5" : ""}>
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {categoryLabels[cat]}
              </h3>
              <div className="mt-2 flex flex-col gap-1">
                {catModules.map((module) => {
                  const status = getModuleStatus(module.id);
                  const isLocked = status === "locked";

                  return (
                    <Link
                      key={module.id}
                      href={isLocked ? "#" : `/module/${module.id}`}
                      onClick={(e) => {
                        if (isLocked) {
                          e.preventDefault();
                          return;
                        }
                        onMobileClose();
                      }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                        isLocked
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <StatusIcon status={status} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium leading-snug">
                            {module.number}. {module.title}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-4 px-1 py-0 text-[10px] font-medium",
                              difficultyColor[module.difficulty]
                            )}
                          >
                            {module.difficulty}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {module.estimatedHours}h
                          </span>
                        </div>
                      </div>
                      <ModuleIcon name={module.icon} />
                    </Link>
                  );
                })}
              </div>
              {catIndex < activeCategories.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
