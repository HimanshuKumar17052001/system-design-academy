"use client";

import { useEffect, useState } from "react";
import { NotesCanvas, useNotesCanvas } from "@/components/notes/NotesCanvas";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function NotesProviderInner({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useNotesCanvas();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  return (
    <>
      {children}
      <NotesCanvas open={open} onOpenChange={setOpen} />
      {/* Floating toggle button at bottom right */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "fixed bottom-20 right-6 z-45 h-10 w-10 rounded-full shadow-lg border-2 bg-background",
          open && "hidden"
        )}
        onClick={() => setOpen(true)}
        title="Open Notes (Cmd+N)"
      >
        <PanelRightOpen className="size-5" />
      </Button>
    </>
  );
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  return <NotesProviderInner>{children}</NotesProviderInner>;
}

export { useNotesCanvas };