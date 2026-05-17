"use client";

import { useState, useEffect } from "react";
import { FileText, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sda-notes-";

interface NotesCanvasProps {
  moduleId: string;
}

export function NotesCanvas({ moduleId }: NotesCanvasProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const storageKey = `${STORAGE_KEY}${moduleId}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setContent(saved);
    }
  }, [storageKey]);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem(storageKey, content);
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs h-8"
      >
        <FileText className="size-3.5" />
        Notes
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-xl max-h-[70vh] overflow-hidden rounded-lg border bg-popup shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">My Notes</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Take notes while you learn..."
                className="w-full h-64 resize-none border rounded-lg p-3 text-sm bg-background focus:ring-1 focus:ring-muted-foreground/20 outline-none"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t px-3 py-2 gap-2">
              <span className="text-xs text-muted-foreground self-center mr-auto">
                Notes are saved automatically
              </span>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                variant="outline"
              >
                <Save className="size-3 mr-1" />
                {isSaving ? "Saved!" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}