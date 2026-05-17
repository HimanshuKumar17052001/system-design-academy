import { notFound } from "next/navigation";
import { getModuleById } from "@/data/curriculum";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FlaskConical, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import LabRunner from "@/components/labs/LabRunner";

interface LabPageProps {
  params: Promise<{ id: string }>;
}

export default async function LabPage({ params }: LabPageProps) {
  const { id } = await params;
  const module = getModuleById(id);

  if (!module || !module.lab) {
    notFound();
  }

  const { lab } = module;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6">
        <Link
          href={`/module/${module.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to {module.title}
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-xs font-mono">
            M{module.number}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FlaskConical className="size-3.5" />
            Lab
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {module.estimatedHours}h estimated
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {lab.title}
          </h1>
          <p className="text-base text-muted-foreground">{lab.objective}</p>
        </div>
      </div>

      <Separator className="my-8" />

      <LabRunner lab={lab} />
    </div>
  );
}
