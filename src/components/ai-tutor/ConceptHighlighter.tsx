"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useAITutor } from "./AITutorContext";

export function ConceptHighlighter() {
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const { openTutor } = useAITutor();

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 2 && text.length < 300) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          setSelectedText(text);
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
          setShowTooltip(true);
        }
      } else {
        setShowTooltip(false);
      }
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, []);

  const handleExplain = () => {
    setShowTooltip(false);
    openTutor(`Explain this concept: "${selectedText}"`);
  };

  return (
    <>
      {showTooltip && (
        <button
          onClick={handleExplain}
          className="fixed z-50 flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs shadow-sm hover:bg-muted transition-colors"
          style={{
            left: position.x,
            top: position.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <Sparkles className="size-3 text-muted-foreground" />
          <span className="text-muted-foreground">Ask AI</span>
        </button>
      )}
    </>
  );
}