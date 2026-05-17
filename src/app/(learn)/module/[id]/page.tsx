import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getModuleById } from "@/data/curriculum";
import { notFound } from "next/navigation";
import { ModuleTabs } from "@/components/learn/ModuleTabs";
import { ModuleLockGate } from "@/components/learn/ModuleLockGate";
import { Suspense } from "react";

interface ModulePageProps {
  params: Promise<{ id: string }>;
}

const difficultyColor: Record<string, string> = {
  Beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-red-50 text-red-700 border-red-200",
  Expert: "bg-purple-50 text-purple-700 border-purple-200",
};

export default async function ModulePage({ params }: ModulePageProps) {
  const { id } = await params;
  const module = getModuleById(id);

  if (!module) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-muted-foreground">Module {module.number}:</span>{" "}
            {module.title}
          </h1>
          <Badge variant="outline" className={difficultyColor[module.difficulty] || ""}>
            {module.difficulty}
          </Badge>
        </div>
        <p className="text-muted-foreground">{module.subtitle}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4" />
          <span>{module.estimatedHours} hours</span>
          <span className="mx-2">·</span>
          <span>{module.lessons.length} lessons</span>
          {module.lab && (
            <>
              <span className="mx-2">·</span>
              <span>1 hands-on lab</span>
            </>
          )}
          {module.quiz && (
            <>
              <span className="mx-2">·</span>
              <span>1 quiz</span>
            </>
          )}
        </div>
      </div>

      <ModuleLockGate module={module}>
        <Suspense fallback={<div className="rounded-lg border bg-card p-8 text-center">Loading module content...</div>}>
          <ModuleTabs module={module} />
        </Suspense>
      </ModuleLockGate>
    </div>
  );
}
