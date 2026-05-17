"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
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
      setExplanation("Sorry, couldn't explain. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Minimal Tooltip */}
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
          <span className="text-muted-foreground">Explain</span>
        </button>
      )}

      {/* Minimal Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />
          <div className="relative w-full max-w-sm rounded-lg border bg-popup p-3 shadow-lg">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 pr-5">
              "{selectedText}"
            </p>

            {isLoading ? (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                <span className="text-xs">Thinking...</span>
              </div>
            ) : (
              <p className="text-sm">{explanation}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}