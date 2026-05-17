"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, BookOpen, FileText, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchContent, type SearchResult } from "@/lib/search-index";
import { cn } from "@/lib/utils";

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const searchResults = searchContent(query);
    setResults(searchResults);
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      router.push(`/module/${result.moduleId}`);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-9 md:w-64 justify-center md:justify-start text-muted-foreground",
          className
        )}
        onClick={() => setOpen(true)}
        aria-label="Search modules"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden md:inline-flex ml-2">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-xl rounded-xl border bg-popover shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b px-3 py-2 gap-2">
          <Search className="size-4 shrink-0 text-muted-foreground mt-0.5" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search modules, lessons, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button onClick={() => setOpen(false)} className="shrink-0">
            <X className="size-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-1">
          {query && results.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={`${result.moduleId}-${result.lessonId || "module"}`}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                index === selectedIndex
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              )}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="mt-0.5">
                {result.type === "module" ? (
                  <BookOpen className="size-5 text-primary" />
                ) : (
                  <FileText className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {result.moduleNumber}.
                  </span>
                  <span className="font-medium truncate">
                    {result.type === "module"
                      ? result.moduleTitle
                      : result.lessonTitle}
                  </span>
                  {result.type === "lesson" && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      in {result.moduleTitle}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {result.excerpt}
                </p>
              </div>
              <CornerDownLeft className="mt-1 size-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>

        <div className="border-t px-3 py-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}