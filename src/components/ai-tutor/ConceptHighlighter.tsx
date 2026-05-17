"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { explainConcept } from "@/lib/groq";

export function ConceptHighlighter() {
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 2 && text.length < 200) {
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

  const handleExplain = async () => {
    setShowTooltip(false);
    setShowPopup(true);
    setIsLoading(true);
    setExplanation("");

    try {
      const result = await explainConcept(selectedText);
      setExplanation(result);
    } catch (error) {
      setExplanation("Sorry, I couldn't explain this concept. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Tooltip */}
      {showTooltip && (
        <button
          onClick={handleExplain}
          className="fixed z-50 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:scale-105 transition-transform"
          style={{
            left: position.x,
            top: position.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <Sparkles className="size-3" />
          Explain
        </button>
      )}

      {/* Explanation Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border bg-popover p-4 shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">AI Explanation</h4>
                <p className="text-[10px] text-muted-foreground">Selected concept</p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 mb-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                "{selectedText}"
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{explanation}</p>
            )}

            <p className="mt-3 text-[10px] text-muted-foreground text-center">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      )}
    </>
  );
}