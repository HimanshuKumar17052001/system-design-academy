"use client";

import { useEffect, useState } from "react";
import { NotesCanvas, useNotesCanvas } from "@/components/notes/NotesCanvas";

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
    </>
  );
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  return <NotesProviderInner>{children}</NotesProviderInner>;
}

export { useNotesCanvas };