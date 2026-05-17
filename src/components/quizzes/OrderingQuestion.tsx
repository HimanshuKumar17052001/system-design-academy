"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { QuizAnswer } from "./QuizEngine";

interface OrderingQuestionProps {
  question: {
    type: "ordering";
    question: string;
    items: string[];
    correctOrder: number[];
    explanation: string;
  };
  answer?: { type: "ordering"; currentOrder: number[] };
  onAnswer: (a: QuizAnswer) => void;
  checked: boolean;
  onCheck: () => void;
  reviewMode: boolean;
}

function SortableItem({
  id,
  label,
  status,
  disabled,
}: {
  id: string;
  label: string;
  status?: "correct" | "incorrect" | "idle";
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card shadow-sm transition-all ${
        isDragging ? "ring-2 ring-primary scale-[1.02] z-50 shadow-lg" : ""
      } ${
        status === "correct"
          ? "border-green-500 bg-green-50 dark:bg-green-950"
          : status === "incorrect"
          ? "border-red-500 bg-red-50 dark:bg-red-950"
          : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className={`p-1 rounded hover:bg-muted ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
        aria-label={`Drag to reorder: ${label}`}
        tabIndex={disabled ? -1 : 0}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <span className="flex-1 text-sm font-medium">{label}</span>
    </div>
  );
}

export default function OrderingQuestion({
  question,
  answer,
  onAnswer,
  checked,
  onCheck,
  reviewMode,
}: OrderingQuestionProps) {
  const [order, setOrder] = useState<number[]>(
    answer?.currentOrder ?? question.items.map((_, i) => i)
  );
  const [showExplanation, setShowExplanation] = useState(checked || reviewMode);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (answer?.currentOrder) {
      setOrder(answer.currentOrder);
    }
    setShowExplanation(checked || reviewMode);
  }, [answer, checked, reviewMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.findIndex((o) => String(o) === String(active.id));
    const newIndex = order.findIndex((o) => String(o) === String(over.id));

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(order, oldIndex, newIndex);
    setOrder(newOrder);
    onAnswer({ type: "ordering", currentOrder: newOrder });
  };

  const handleCheck = () => {
    setShowExplanation(true);
    onCheck();
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.5" } },
    }),
  };

  const items = order.map((idx) => ({
    id: String(idx),
    label: question.items[idx],
    originalIndex: idx,
  }));

  const correctCount = order.filter((itemIdx, position) => question.correctOrder[position] === itemIdx).length;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold leading-relaxed">{question.question}</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2" role="list" aria-label="Sortable items">
            {items.map((item) => {
              let status: "correct" | "incorrect" | "idle" = "idle";
              if (showExplanation) {
                const position = order.findIndex((o) => o === item.originalIndex);
                status = question.correctOrder[position] === item.originalIndex ? "correct" : "incorrect";
              }
              return (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  status={status}
                  disabled={showExplanation || reviewMode}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeId ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-primary text-primary-foreground shadow-lg">
              <GripVertical className="w-4 h-4" />
              <span className="flex-1 text-sm font-medium">
                {question.items[Number(activeId)]}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {!showExplanation && !reviewMode && (
        <Button onClick={handleCheck} className="mt-2">
          Check Order
        </Button>
      )}

      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pt-2 space-y-3"
        >
          <Badge variant="outline" className="mb-2">
            {correctCount} / {question.items.length} in correct position
          </Badge>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1 text-foreground">Correct sequence:</p>
            <div className="flex flex-wrap items-center gap-2">
              {question.correctOrder.map((itemIdx, pos) => (
                <span key={pos} className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100 text-xs font-medium">
                    {pos + 1}. {question.items[itemIdx]}
                  </span>
                  {pos < question.correctOrder.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {question.explanation}
          </p>
        </motion.div>
      )}
    </div>
  );
}
