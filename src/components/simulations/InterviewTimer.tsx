"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  StickyNote,
  FileText,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// Types & Config
// ------------------------------------------------------------------
interface Phase {
  id: string;
  label: string;
  description: string;
  recommendedMin: number; // minutes
  recommendedMax: number; // minutes
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const PHASES: Phase[] = [
  {
    id: "requirements",
    label: "Requirements",
    description: "Clarify functional & non-functional requirements",
    recommendedMin: 5,
    recommendedMax: 10,
    color: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "hld",
    label: "High-Level Design",
    description: "Sketch API, data model, and basic architecture",
    recommendedMin: 15,
    recommendedMax: 20,
    color: "bg-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  {
    id: "deep-dive",
    label: "Deep Dive",
    description: "Discuss bottlenecks, trade-offs, and scaling",
    recommendedMin: 15,
    recommendedMax: 20,
    color: "bg-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  {
    id: "wrap-up",
    label: "Trade-offs & Wrap-up",
    description: "Summarize, discuss future work, and answer follow-ups",
    recommendedMin: 5,
    recommendedMax: 5,
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
];

const TOTAL_MINUTES = 45;
const TOTAL_SECONDS = TOTAL_MINUTES * 60;

interface Note {
  id: number;
  text: string;
  timestamp: string;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function InterviewTimer() {
  const [elapsed, setElapsed] = useState(0); // total elapsed seconds
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimes, setPhaseTimes] = useState<number[]>(new Array(PHASES.length).fill(0));
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [showNotes, setShowNotes] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noteIdRef = useRef(0);

  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
  const remainingMinutes = Math.floor(remaining / 60);
  const remainingSeconds = remaining % 60;

  // Timer tick
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= TOTAL_SECONDS) {
          setIsRunning(false);
          return TOTAL_SECONDS;
        }
        return next;
      });
      setPhaseTimes((prev) => {
        const next = [...prev];
        next[currentPhaseIndex] += 1;
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, currentPhaseIndex]);

  const handleStart = useCallback(() => setIsRunning(true), []);
  const handlePause = useCallback(() => setIsRunning(false), []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setCurrentPhaseIndex(0);
    setPhaseTimes(new Array(PHASES.length).fill(0));
  }, []);

  const handlePhaseSwitch = useCallback((index: number) => {
    setCurrentPhaseIndex(index);
  }, []);

  const handleAddNote = useCallback(() => {
    if (!noteInput.trim()) return;
    noteIdRef.current += 1;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setNotes((prev) => [...prev, { id: noteIdRef.current, text: noteInput.trim(), timestamp: time }]);
    setNoteInput("");
  }, [noteInput]);

  const handleDeleteNote = useCallback((id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleClearNotes = useCallback(() => {
    setNotes([]);
  }, []);

  const overallProgress = (elapsed / TOTAL_SECONDS) * 100;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Main Timer Panel */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Header Timer */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Interview Timer
              </CardTitle>
              <Badge variant={remaining < 300 ? "destructive" : "secondary"} className="font-mono">
                {remainingMinutes}:{remainingSeconds.toString().padStart(2, "0")}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              45-minute countdown with phase tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-mono">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {!isRunning ? (
                <Button size="sm" onClick={handleStart}>
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handlePause}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNotes((s) => !s)}
                className="ml-auto"
              >
                <StickyNote className="h-4 w-4 mr-1" />
                {showNotes ? "Hide Notes" : "Show Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Phase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PHASES.map((phase, index) => {
            const phaseSeconds = phaseTimes[index];
            const phaseMinutes = phaseSeconds / 60;
            const isActive = currentPhaseIndex === index;
            const exceedsMax = phaseMinutes > phase.recommendedMax;
            const exceedsMin = phaseMinutes > phase.recommendedMin;
            const recommendedSecondsMax = phase.recommendedMax * 60;
            const phaseProgress = Math.min(100, (phaseSeconds / recommendedSecondsMax) * 100);

            return (
              <motion.div
                key={phase.id}
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "cursor-pointer rounded-xl border p-4 transition-colors",
                  isActive
                    ? cn("ring-2 ring-primary", phase.bgColor, phase.borderColor)
                    : "bg-card hover:bg-muted/40"
                )}
                onClick={() => handlePhaseSwitch(index)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", phase.color)} />
                    <span className={cn("text-sm font-semibold", phase.textColor)}>
                      {phase.label}
                    </span>
                    {isActive && (
                      <Badge variant="default" className="text-[10px] h-4 px-1">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {exceedsMax && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.floor(phaseMinutes)}:{(phaseSeconds % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{phase.description}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      Recommended: {phase.recommendedMin}-{phase.recommendedMax} min
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        exceedsMax ? "text-red-600" : exceedsMin ? "text-amber-600" : "text-emerald-600"
                      )}
                    >
                      {phaseMinutes.toFixed(1)} / {phase.recommendedMax} min
                    </span>
                  </div>
                  <Progress
                    value={phaseProgress}
                    className={cn("h-1.5", exceedsMax && "text-red-500")}
                  />
                </div>
                {exceedsMax && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 dark:bg-red-950/30 rounded-md px-2 py-1"
                  >
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>Exceeded recommended time by {(phaseMinutes - phase.recommendedMax).toFixed(1)} min</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Phase Timeline */}
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phase Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              {PHASES.map((phase, index) => {
                const phaseSeconds = phaseTimes[index];
                const widthPercent = Math.min(
                  100,
                  (phaseSeconds / TOTAL_SECONDS) * 100
                );
                const isCompleted = index < currentPhaseIndex;
                const isActive = index === currentPhaseIndex;
                return (
                  <div key={phase.id} className="flex-1 flex flex-col gap-1">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", phase.color)}
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {isCompleted ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : isActive ? (
                        <div className={cn("h-2 w-2 rounded-full animate-pulse", phase.color)} />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                      )}
                      <span className="text-[10px] text-muted-foreground truncate">
                        {phase.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Panel */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            className="lg:w-80 shrink-0 overflow-hidden"
          >
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Interview Notes
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button size="icon-xs" variant="ghost" onClick={handleClearNotes}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Jot down thoughts during each phase
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddNote();
                    }}
                    placeholder="Type a note..."
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                  />
                  <Button size="sm" onClick={handleAddNote}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-2 pr-3">
                    <AnimatePresence initial={false}>
                      {notes.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          No notes yet. Add quick reminders or observations here.
                        </p>
                      ) : (
                        notes.map((note) => (
                          <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="group rounded-lg border bg-muted/30 p-2.5 text-sm hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm leading-snug">{note.text}</p>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                              {note.timestamp}
                            </span>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
