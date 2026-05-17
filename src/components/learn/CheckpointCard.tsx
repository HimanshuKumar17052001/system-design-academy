"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Checkpoint } from "@/types/curriculum";

interface CheckpointCardProps {
  checkpoint: Checkpoint;
}

export function CheckpointCard({ checkpoint }: CheckpointCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);

  const handleReveal = () => {
    setIsRevealed(true);
    if (!isReviewed) {
      setIsReviewed(true);
    }
  };

  const handleReset = () => {
    setIsRevealed(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="perspective-[1000px]">
        <motion.div
          className="relative"
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <Card
            className={cn(
              "min-h-[240px] backface-hidden",
              isRevealed && "invisible"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RotateCcw className="size-5 text-primary" />
                Checkpoint
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-base leading-relaxed">{checkpoint.prompt}</p>
              <div className="flex items-center gap-3">
                <Button onClick={handleReveal} className="gap-2">
                  <Eye className="size-4" />
                  Reveal Answer
                </Button>
                {isReviewed && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Reviewed
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Back */}
          <Card
            className={cn(
              "absolute inset-0 min-h-[240px] backface-hidden",
              !isRevealed && "invisible"
            )}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <EyeOff className="size-5 text-primary" />
                Answer
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {checkpoint.type === "code" ? (
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{checkpoint.answer}</code>
                </pre>
              ) : checkpoint.type === "diagram" ? (
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="text-muted-foreground">[Diagram Placeholder]</p>
                  <p className="mt-2">{checkpoint.answer}</p>
                </div>
              ) : (
                <p className="text-base leading-relaxed">{checkpoint.answer}</p>
              )}
              <Button variant="outline" onClick={handleReset} className="gap-2 w-fit">
                <RotateCcw className="size-4" />
                Hide Answer
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
