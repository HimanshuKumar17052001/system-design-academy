import { notFound } from "next/navigation";
import { getModuleById } from "@/data/curriculum";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, HelpCircle } from "lucide-react";
import QuizEngine from "@/components/quizzes/QuizEngine";

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;
  const module = getModuleById(id);

  if (!module) {
    notFound();
  }

  if (!module.quiz) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-12 text-center">
          <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">No Quiz Available</h2>
          <p className="text-sm text-muted-foreground mt-1">
            There is no quiz available for this module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-xs font-mono">
            M{module.number}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="size-3.5" />
            {module.title}
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {module.quiz.title}
          </h1>
          <p className="text-base text-muted-foreground">
            Passing score: {module.quiz.passingScore}%
          </p>
        </div>
      </div>

      <Separator className="my-8" />

      <QuizEngine quiz={module.quiz} />
    </div>
  );
}
