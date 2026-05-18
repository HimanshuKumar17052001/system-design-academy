"use client";

import { useEffect, useState } from "react";
import { NotesCanvas, useNotesCanvas } from "@/components/notes/NotesCanvas";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        onClick={() => setOpen(true)}
        title="Open Notes (Cmd+N)"
      >
        <FileText className="size-5" />
      </Button>
    </>
  );
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  return <NotesProviderInner>{children}</NotesProviderInner>;
}

export { useNotesCanvas };