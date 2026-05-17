"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { BookOpen, FlaskConical, HelpCircle, RotateCcw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LessonRenderer } from "./LessonRenderer";
import { CheckpointCard } from "./CheckpointCard";
import LabRunner from "@/components/labs/LabRunner";
import QuizEngine from "@/components/quizzes/QuizEngine";
import { QuizGenerator } from "@/components/ai-tutor/QuizGenerator";
import type { Module } from "@/types/curriculum";

interface ModuleTabsProps {
  module: Module;
}

export function ModuleTabs({ module }: ModuleTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get("tab") || "lessons";

  const setTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const tabs = [
    { key: "lessons", label: "Lessons", icon: BookOpen, show: true },
    { key: "lab", label: "Lab", icon: FlaskConical, show: !!module.lab },
    { key: "quiz", label: "Quiz", icon: HelpCircle, show: !!module.quiz },
    { key: "checkpoint", label: "Checkpoint", icon: RotateCcw, show: true },
  ].filter((t) => t.show);

  return (
    <Tabs value={activeTab} onValueChange={setTab} className="space-y-6">
      <TabsList variant="line" className="w-full">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
            <tab.icon className="size-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="lessons" className="mt-6">
        <LessonRenderer lessons={module.lessons} moduleId={module.id} />
      </TabsContent>

      <TabsContent value="lab" className="mt-6">
        {module.lab ? (
          <LabRunner lab={module.lab} />
        ) : null}
      </TabsContent>

      <TabsContent value="quiz" className="mt-6 space-y-4">
        <div className="flex justify-end">
          <QuizGenerator moduleTitle={module.title} />
        </div>
        {module.quiz ? (
          <QuizEngine quiz={module.quiz} />
        ) : null}
      </TabsContent>

      <TabsContent value="checkpoint" className="mt-6">
        <CheckpointCard checkpoint={module.checkpoint} />
      </TabsContent>
    </Tabs>
  );
}
