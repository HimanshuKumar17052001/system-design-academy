"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, BookOpen } from "lucide-react";
import { MermaidDiagram } from "./MermaidDiagram";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/lib/progress";
import type { Lesson, ContentBlock } from "@/types/curriculum";

interface LessonRendererProps {
  lessons: Lesson[];
  moduleId: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

function SyntaxHighlightedCode({ code, language }: { code: string; language: string }) {
  const highlighted = code
    .replace(
      /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
      '<span class="text-gray-400">$1</span>'
    )
    .replace(
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
      '<span class="text-emerald-400">$1</span>'
    )
    .replace(
      /\b(function|const|let|var|return|if|else|for|while|import|export|from|class|interface|type|async|await|new|this|true|false|null|undefined|try|catch|throw|switch|case|break|continue|default|extends|implements|static|public|private|protected|readonly|void|number|string|boolean|any|unknown|never|enum|namespace|module|declare|abstract|yield|of|in|instanceof|typeof|delete|debugger|with|do|finally|goto|package|super|interface|type)\b/g,
      '<span class="text-pink-400">$1</span>'
    );

  return (
    <div className="relative rounded-lg bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <span className="text-xs text-zinc-400 font-mono">{language}</span>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code
          className="text-sm font-mono text-zinc-100 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return (
        <motion.div variants={itemVariants}>
          <p className="text-base leading-7 text-foreground/90">
            {block.content}
          </p>
        </motion.div>
      );

    case "bullets":
      return (
        <motion.div variants={itemVariants}>
          <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-foreground/90">
            {block.items.map((item, i) => (
              <li key={i} className="pl-1 marker:text-primary">
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      );

    case "table":
      return (
        <motion.div variants={itemVariants} className="overflow-x-auto">
          <Table>
            {block.caption && <TableCaption>{block.caption}</TableCaption>}
            <TableHeader>
              <TableRow>
                {block.headers.map((header, i) => (
                  <TableHead key={i}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      );

    case "callout": {
      const calloutStyles = {
        info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100",
        warning:
          "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-100",
        tip: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-100",
        success:
          "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100",
      };

      return (
        <motion.div
          variants={itemVariants}
          className={cn(
            "rounded-lg border p-4 text-sm leading-relaxed",
            calloutStyles[block.variant]
          )}
        >
          <span className="font-semibold capitalize">{block.variant}: </span>
          {block.content}
        </motion.div>
      );
    }

    case "formula":
      return (
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="rounded-lg bg-muted p-4 font-mono text-sm tracking-wide">
            {block.expression}
          </div>
          <p className="text-sm text-muted-foreground">{block.explanation}</p>
        </motion.div>
      );

    case "code":
      return (
        <motion.div variants={itemVariants}>
          <SyntaxHighlightedCode code={block.code} language={block.language} />
        </motion.div>
      );

    case "diagram":
      return (
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center"
        >
          <div className="text-sm font-medium text-muted-foreground">
            Diagram: {block.kind}
          </div>
          {block.caption && (
            <p className="mt-2 text-xs text-muted-foreground">{block.caption}</p>
          )}
        </motion.div>
      );

    case "mermaid":
      return (
        <MermaidDiagram
          code={block.code}
          title={block.title}
          caption={block.caption}
        />
      );

    case "interactive":
      return (
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center"
        >
          <div className="text-sm font-medium text-muted-foreground">
            Interactive: {block.component}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            This interactive component will be loaded here.
          </p>
        </motion.div>
      );

    default:
      return null;
  }
}

export function LessonRenderer({ lessons, moduleId }: LessonRendererProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const markModuleComplete = useProgressStore((s) => s.markModuleComplete);
  const completedModules = useProgressStore((s) => s.completedModules);
  const isModuleCompleted = completedModules.includes(moduleId);

  const activeLesson = lessons[activeIndex];

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="size-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Lesson {activeIndex + 1} of {lessons.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {lessons.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === activeIndex
                  ? "w-6 bg-primary"
                  : i < activeIndex
                  ? "w-2 bg-primary/60"
                  : "w-2 bg-muted-foreground/20"
              )}
              aria-label={`Go to lesson ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Lesson Navigation */}
      <div className="flex flex-wrap gap-2">
        {lessons.map((lesson, i) => (
          <button
            key={lesson.id}
            onClick={() => setActiveIndex(i)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              i === activeIndex
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {lesson.title}
          </button>
        ))}
      </div>

      <Separator />

      {/* Active Lesson */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Lesson {activeIndex + 1}
          </Badge>
          <h2 className="text-xl font-semibold tracking-tight">
            {activeLesson.title}
          </h2>
        </div>

        <motion.div
          key={activeLesson.id}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {activeLesson.content.map((block, i) => (
            <ContentBlockRenderer key={`${activeLesson.id}-block-${i}`} block={block} />
          ))}
        </motion.div>
      </div>

      <Separator />

      {/* Bottom Navigation + Mark Complete */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={activeIndex === lessons.length - 1}
            onClick={() => setActiveIndex((i) => Math.min(lessons.length - 1, i + 1))}
          >
            Next
          </Button>
        </div>

        <Button
          size="sm"
          className="gap-2"
          disabled={isModuleCompleted}
          onClick={() => markModuleComplete(moduleId)}
        >
          {isModuleCompleted ? (
            <>
              <CheckCircle2 className="size-4" />
              Completed
            </>
          ) : (
            <>
              <Circle className="size-4" />
              Mark Lesson Complete
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
