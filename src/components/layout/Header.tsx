"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  RotateCcw,
  CheckCircle2,
  Clock,
  BookOpen,
  Search,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useProgressStore } from "@/lib/progress";
import { modules } from "@/data/curriculum";
import { UserMenu } from "@/components/auth/UserMenu";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { useNotesCanvas } from "@/components/notes/NotesProvider";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const { setOpen: setNotesOpen } = useNotesCanvas();
  const completedModules = useProgressStore((s) => s.completedModules);
  const totalStudyTimeMinutes = useProgressStore(
    (s) => s.totalStudyTimeMinutes
  );
  const resetProgress = useProgressStore((s) => s.resetProgress);

  const totalModules = modules.length;
  const completedCount = completedModules.length;

  const hours = Math.floor(totalStudyTimeMinutes / 60);
  const minutes = totalStudyTimeMinutes % 60;
  const timeLabel =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const handleReset = () => {
    resetProgress();
    setDialogOpen(false);
    router.push("/dashboard");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
      >
        <Menu className="size-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => {
          const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
          document.dispatchEvent(event);
        }}
        aria-label="Search"
      >
        <Search className="size-5" />
      </Button>

      <Link href="/dashboard" className="flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <span className="text-sm font-semibold tracking-tight md:text-base">
          System Design Academy
        </span>
      </Link>

      <div className="hidden md:block flex-1 max-w-md mx-4">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>
              {completedCount}/{totalModules} modules
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3.5 text-blue-500" />
            <span>{timeLabel}</span>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" />
            }
          >
            <RotateCcw className="size-3" />
            <span className="hidden sm:inline">Reset Progress</span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Progress</DialogTitle>
              <DialogDescription>
                This will clear all completed modules, quiz scores, lab
                completions, and study time. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReset}>
                Reset Everything
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNotesOpen(true)}
          className="gap-1.5 text-xs"
          title="Notes (Cmd+N)"
        >
          <FileText className="size-3.5" />
          <span className="hidden sm:inline">Notes</span>
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
