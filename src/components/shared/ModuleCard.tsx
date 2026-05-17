"use client";

import { motion } from "framer-motion";
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
  LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Module } from "@/types/curriculum";

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Globe,
  MapPin,
  Plug,
  Database,
  TrendingUp,
  Calculator,
};

interface ModuleCardProps {
  module: Module;
  status?: "locked" | "available" | "in-progress" | "completed";
  onClick?: () => void;
}

export function ModuleCard({ module, status = "available", onClick }: ModuleCardProps) {
  const Icon = iconMap[module.icon] || BookOpen;
  const isLocked = status === "locked";
  const isCompleted = status === "completed";

  const difficultyColor = {
    Beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    Intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Advanced: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    Expert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  }[module.difficulty];

  return (
    <motion.div
      whileHover={!isLocked ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("cursor-pointer", isLocked && "cursor-not-allowed opacity-60")}
      onClick={onClick}
    >
      <Card className="relative h-full">
        {isLocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Lock className="size-8" />
              <span className="text-sm font-medium">Locked</span>
            </div>
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Module {module.number}
                </div>
                <CardTitle className="text-base">{module.title}</CardTitle>
              </div>
            </div>
            {isCompleted && (
              <CheckCircle2 className="size-5 text-emerald-500" />
            )}
          </div>
          <CardDescription>{module.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-xs", difficultyColor)}>
              {module.difficulty}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {module.estimatedHours}h estimated
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
