"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from "@dnd-kit/core";
import type { QuizAnswer } from "./QuizEngine";

interface DragDropQuestionProps {
  question: {
    type: "drag-drop";
    question: string;
    pairs: { left: string; right: string }[];
    explanation: string;
  };
  answer?: { type: "drag-drop"; matches: Record<string, string> };
  onAnswer: (a: QuizAnswer) => void;
  checked: boolean;
  onCheck: () => void;
  reviewMode: boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function DraggableItem({ id, label, disabled }: { id: string; label: string; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`px-4 py-3 rounded-lg border bg-card text-card-foreground shadow-sm cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50 ring-2 ring-primary scale-105" : ""
      } ${disabled ? "cursor-default opacity-70" : ""}`}
      aria-label={`Draggable: ${label}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {label}
    </div>
  );
}

function DroppableZone({
  id,
  label,
  matchedLeft,
  status,
}: {
  id: string;
  label: string;
  matchedLeft?: string;
  status?: "idle" | "correct" | "incorrect";
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 p-4 min-h-[3.5rem] transition-all ${
        isOver
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : status === "correct"
          ? "border-green-500 bg-green-50 dark:bg-green-950"
          : status === "incorrect"
          ? "border-red-500 bg-red-50 dark:bg-red-950"
          : "border-dashed border-muted-foreground/25 bg-muted/30"
      }`}
      aria-label={`Drop zone: ${label}`}
      role="region"
    >
      <div className="text-sm font-medium text-muted-foreground mb-2">{label}</div>
      {matchedLeft ? (
        <div
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            status === "correct"
              ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
              : status === "incorrect"
              ? "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100"
              : "bg-card border shadow-sm"
          }`}
        >
          {matchedLeft}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground/60 italic">Drop item here</div>
      )}
    </div>
  );
}

export default function DragDropQuestion({
  question,
  answer,
  onAnswer,
  checked,
  onCheck,
  reviewMode,
}: DragDropQuestionProps) {
  const [leftItems] = useState(() => shuffleArray(question.pairs.map((p) => p.left)));
  const [rightItems] = useState(() => shuffleArray(question.pairs.map((p) => p.right)));
  const [matches, setMatches] = useState<Record<string, string>>(answer?.matches ?? {});
  const [showExplanation, setShowExplanation] = useState(checked || reviewMode);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (answer?.matches) {
      setMatches(answer.matches);
    }
    setShowExplanation(checked || reviewMode);
  }, [answer, checked, reviewMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leftItem = String(active.id);
    const rightItem = String(over.id);

    if (!leftItems.includes(leftItem) || !rightItems.includes(rightItem)) return;

    const newMatches = { ...matches, [leftItem]: rightItem };
    setMatches(newMatches);
    onAnswer({ type: "drag-drop", matches: newMatches });
  };

  const handleCheck = () => {
    setShowExplanation(true);
    onCheck();
  };

  const allMatched = leftItems.every((l) => matches[l] !== undefined);
  const correctPairsMap = Object.fromEntries(question.pairs.map((p) => [p.left, p.right]));

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.5" } },
    }),
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold leading-relaxed">{question.question}</h3>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Terms / Concepts</p>
            {leftItems
              .filter((l) => !matches[l] || showExplanation)
              .map((left) => (
                <DraggableItem
                  key={left}
                  id={left}
                  label={left}
                  disabled={showExplanation || reviewMode}
                />
              ))}
            {leftItems.filter((l) => !matches[l] || showExplanation).length === 0 && (
              <p className="text-sm text-muted-foreground italic">All items matched</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Definitions / Scenarios</p>
            {rightItems.map((right) => {
              const matchedLeft = Object.entries(matches).find(([, r]) => r === right)?.[0];
              let status: "idle" | "correct" | "incorrect" = "idle";
              if (showExplanation && matchedLeft) {
                status = correctPairsMap[matchedLeft] === right ? "correct" : "incorrect";
              }
              return (
                <DroppableZone
                  key={right}
                  id={right}
                  label={right}
                  matchedLeft={matchedLeft}
                  status={status}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeId ? (
            <div className="px-4 py-3 rounded-lg border bg-primary text-primary-foreground shadow-lg cursor-grabbing">
              {activeId}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {!showExplanation && !reviewMode && (
        <Button onClick={handleCheck} disabled={!allMatched} className="mt-2">
          Check Answers
        </Button>
      )}

      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pt-2"
        >
          <Badge variant="outline" className="mb-2">
            {Object.entries(matches).filter(([l, r]) => correctPairsMap[l] === r).length} /{" "}
            {question.pairs.length} correct
          </Badge>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {question.explanation}
          </p>
        </motion.div>
      )}
    </div>
  );
}
