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
  ChevronRight,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useProgressStore } from "@/lib/progress";
import { modules } from "@/data/curriculum";
import type { Module, ModuleCategory, Difficulty } from "@/types/curriculum";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  "core-distributed": "Core Distributed",
  "architecture-patterns": "Architecture",
  "reliability-ops": "Reliability",
  "real-world-systems": "Real-World",
  "expert-topics": "Expert",
  "interview-prep": "Interview",
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

const categoryIcons: Record<ModuleCategory, LucideIcon> = {
  foundations: BookOpen,
  lld: Database,
  "core-distributed": Plug,
  "architecture-patterns": Globe,
  "reliability-ops": CheckCircle2,
  "real-world-systems": TrendingUp,
  "expert-topics": Calculator,
  "interview-prep": Play,
};

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
  const [expanded, setExpanded] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const grouped = categoryOrder.reduce<Record<string, Module[]>>((acc, cat) => {
    acc[cat] = modules.filter((m) => m.category === cat);
    return acc;
  }, {});

  const activeCategories = categoryOrder.filter(
    (cat) => grouped[cat].length > 0
  );

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <div
        className="hidden md:flex md:flex-col md:border-r md:bg-card relative transition-all duration-300 ease-in-out"
        style={{ width: expanded ? 280 : 72 }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Toggle Button (visible when collapsed) */}
        <AnimatePresence>
          {!expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-[-12px] z-50"
            >
              <Button
                variant="secondary"
                size="icon"
                className="size-6 rounded-full shadow-md"
                onClick={() => setExpanded(true)}
              >
                <ChevronRight className="size-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between px-3 py-3 border-b">
          {expanded ? (
            <>
              <span className="text-sm font-semibold">Modules</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setExpanded(false)}
              >
                <PanelLeft className="size-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 mx-auto"
              onClick={() => setExpanded(true)}
            >
              <PanelLeft className="size-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className={cn("py-2", expanded ? "px-3" : "px-2")}>
            {activeCategories.map((cat, catIndex) => {
              const catModules = grouped[cat];
              const CatIcon = categoryIcons[cat];
              const isCatExpanded = expandedCats[cat] ?? true;

              return (
                <div key={cat} className={catIndex > 0 ? "mt-3" : ""}>
                  {expanded ? (
                    <button
                      onClick={() => toggleCat(cat)}
                      className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>{categoryLabels[cat]}</span>
                      <ChevronRight
                        className={cn(
                          "size-3 transition-transform",
                          isCatExpanded && "rotate-90"
                        )}
                      />
                    </button>
                  ) : (
                    <div className="flex justify-center py-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <CatIcon className="size-4 text-primary" />
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {(expanded && isCatExpanded) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 flex flex-col gap-0.5">
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
                                  "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                                  isLocked
                                    ? "cursor-not-allowed opacity-50"
                                    : "hover:bg-accent hover:text-accent-foreground"
                                )}
                              >
                                <StatusIcon status={status} />
                                <div className="flex min-w-0 flex-1 flex-col">
                                  <span className="font-medium leading-snug truncate">
                                    {module.number}. {module.title}
                                  </span>
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
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {expanded && catIndex < activeCategories.length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile Sidebar Drawer (unchanged) */}
      {mobileOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 z-40 w-[280px] border-r bg-card">
            <ScrollArea className="h-full">
              <div className="px-3 py-4">
                <div className="flex items-center justify-between px-2 mb-4">
                  <span className="text-sm font-semibold">Modules</span>
                  <Button variant="ghost" size="icon" className="size-7" onClick={onMobileClose}>
                    <PanelLeft className="size-4" />
                  </Button>
                </div>
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
                                "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                                isLocked
                                  ? "cursor-not-allowed opacity-50"
                                  : "hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <StatusIcon status={status} />
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span className="font-medium leading-snug truncate">
                                  {module.number}. {module.title}
                                </span>
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
          </div>
        </div>
      )}
    </>
  );
}
