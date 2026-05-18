"use client";

import { useEffect } from "react";
import { NotesCanvas, useNotesCanvas } from "@/components/notes/NotesCanvas";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

function NotesProviderInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { open, setOpen } = useNotesCanvas();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (isAuthenticated) {
          setOpen(!open);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && open) {
      setOpen(false);
    }
  }, [isAuthenticated, open, setOpen]);

  return (
    <>
      {children}
      {isAuthenticated && (
        <>
          <NotesCanvas open={open} onOpenChange={setOpen} />
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
      )}
    </>
  );
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  return <NotesProviderInner>{children}</NotesProviderInner>;
}

export { useNotesCanvas };